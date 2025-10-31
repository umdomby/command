import { useEffect, useRef, useState, useCallback } from 'react'; // Добавлен useCallback

interface WebSocketMessage {
    type: string;
    data?: any;
    sdp?: {
        type: RTCSdpType;
        sdp: string;
    };
    ice?: RTCIceCandidateInit;
    room?: string;
    username?: string;
    force_disconnect?: boolean; // Обработка принудительного отключения
    reason?: string; // Для reconnect_request
}

// Конфигурация WebRTC (вынесена для читаемости)
const RTC_CONFIG: RTCConfiguration = {
    iceServers: [
        {
            urls: [
                'turn:ardua.site:3478', // UDP/TCP
                // 'turns:ardua.site:5349'   // TLS (если настроен)
            ],
            username: 'user1',
            credential: 'pass1'
        },
        {
            urls: [
                'stun:ardua.site:3478',
                'stun:stun.l.google.com:19302', // Добавлен Google STUN для надежности
            ]
        }
    ],
    iceTransportPolicy: 'all', // 'relay' для тестирования только через TURN
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require'
};


export const useWebRTC = (
    deviceIds: { video: string; audio: string },
    username: string,
    roomId: string
) => {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [users, setUsers] = useState<string[]>([]);
    const [isCallActive, setIsCallActive] = useState(false); // Активно ли WebRTC соединение (получен поток)
    const [isConnected, setIsConnected] = useState(false);   // Подключен ли WebSocket
    const [isInRoom, setIsInRoom] = useState(false);     // Присоединен ли к комнате на сервере
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    const ws = useRef<WebSocket | null>(null);
    const pc = useRef<RTCPeerConnection | null>(null);
    const pendingIceCandidates = useRef<RTCIceCandidate[]>([]);
    // const isNegotiating = useRef(false); // Не требуется для ведомого в этой логике
    // const shouldCreateOffer = useRef(false); // Ведомый не создает оффер
    const connectionTimeout = useRef<NodeJS.Timeout | null>(null);
    const statsInterval = useRef<NodeJS.Timeout | null>(null);
    const videoCheckTimeout = useRef<NodeJS.Timeout | null>(null);
    const retryAttempts = useRef(0);

    const MAX_RETRIES = 5; // Уменьшим количество попыток для быстрого ответа
    const VIDEO_CHECK_TIMEOUT = 10000; // 10 секунд для проверки видео

    // Функция нормализации SDP (без изменений)
    const normalizeSdp = (sdp: string | undefined): string => {
        if (!sdp) return '';
        let normalized = sdp.replace(/a=network-cost:.+\r\n/g, '');
        normalized = normalized.trim();
        if (!normalized.startsWith('v=')) {
            normalized = 'v=0\r\n' + normalized;
        }
        // Другие нормализации могут быть излишними, современные браузеры обычно справляются
        // if (!normalized.includes('\r\no=')) { ... }
        // if (!normalized.includes('\r\ns=')) { ... }
        // if (!normalized.includes('\r\nt=')) { ... }
        return normalized + '\r\n';
    };

    // Функция очистки ресурсов (используем useCallback для стабильности ссылок)
    const cleanup = useCallback(() => {
        console.log('Выполняется очистка ресурсов...');
        if (connectionTimeout.current) clearTimeout(connectionTimeout.current);
        if (statsInterval.current) clearInterval(statsInterval.current);
        if (videoCheckTimeout.current) clearTimeout(videoCheckTimeout.current);

        connectionTimeout.current = null;
        statsInterval.current = null;
        videoCheckTimeout.current = null;

        if (pc.current) {
            console.log('Закрытие RTCPeerConnection');
            pc.current.onicecandidate = null;
            pc.current.ontrack = null;
            pc.current.onnegotiationneeded = null;
            pc.current.oniceconnectionstatechange = null;
            pc.current.onicegatheringstatechange = null;
            pc.current.onsignalingstatechange = null;
            pc.current.onconnectionstatechange = null; // Добавлено для полноты
            pc.current.onicecandidateerror = null; // Добавлено
            if (pc.current.signalingState !== 'closed') {
                pc.current.close();
            }
            pc.current = null;
        } else {
            console.log('RTCPeerConnection уже был null');
        }

        if (localStream) {
            console.log('Остановка локального потока');
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }
        if (remoteStream) {
            console.log('Остановка удаленного потока');
            remoteStream.getTracks().forEach(track => track.stop());
            setRemoteStream(null);
        }

        setIsCallActive(false);
        pendingIceCandidates.current = [];
        // isNegotiating.current = false; // Не используется
        // shouldCreateOffer.current = false; // Не используется
        retryAttempts.current = 0; // Сбрасываем счетчик попыток при полной очистке
        setRetryCount(0); // Сбрасываем отображаемый счетчик
        console.log('Очистка завершена');
    }, [localStream, remoteStream]); // Зависимости для useCallback


    // Функция выхода из комнаты (используем useCallback)
    const leaveRoom = useCallback(() => {
        console.log('Выход из комнаты...');
        if (ws.current?.readyState === WebSocket.OPEN) {
            try {
                console.log('Отправка сообщения "leave" на сервер');
                // Сообщение 'leave' сейчас игнорируется сервером, но может пригодиться
                ws.current.send(JSON.stringify({ type: 'leave' }));
            } catch (e) {
                console.error('Ошибка отправки сообщения leave:', e);
            }
        } else {
            console.log('WebSocket не был открыт при попытке отправки "leave"');
        }
        cleanup(); // Выполняем основную очистку
        setUsers([]);
        setIsInRoom(false);
        if (ws.current) {
            console.log('Закрытие WebSocket');
            ws.current.close();
            ws.current = null;
        }
        setIsConnected(false); // Убедимся, что состояние соединения сброшено
        console.log('Выход из комнаты завершен');
    }, [cleanup, ws, roomId, username]); // Добавили зависимости

    // Запуск таймера проверки видео (без изменений)
    const startVideoCheckTimer = () => {
        if (videoCheckTimeout.current) clearTimeout(videoCheckTimeout.current);
        console.log(`Запуск таймера проверки видео (${VIDEO_CHECK_TIMEOUT}ms)`);
        videoCheckTimeout.current = setTimeout(() => {
            if (!remoteStream || remoteStream.getVideoTracks().length === 0 || !remoteStream.getVideoTracks()[0].enabled || remoteStream.getVideoTracks()[0].readyState !== 'live') {
                console.warn(`Удаленное видео НЕ получено/неактивно в течение ${VIDEO_CHECK_TIMEOUT}ms, перезапускаем соединение...`);
                resetConnection();
            } else {
                console.log('Проверка видео: Удаленный поток активен.');
            }
        }, VIDEO_CHECK_TIMEOUT);
    };

    // Подключение WebSocket (без существенных изменений, добавлено логирование)
    const connectWebSocket = async (): Promise<boolean> => {
        return new Promise((resolve) => {
            if (ws.current?.readyState === WebSocket.OPEN) {
                console.log('WebSocket уже подключен');
                resolve(true);
                return;
            }
            if (ws.current?.readyState === WebSocket.CONNECTING) {
                console.log('WebSocket уже подключается');
                // Можно дождаться или вернуть false/true в зависимости от логики
                setTimeout(() => resolve(ws.current?.readyState === WebSocket.OPEN), 100); // Дадим шанс подключиться
                return;
            }

            console.log('Попытка подключения WebSocket к wss://ardua.site/ws');
            setError(null); // Сбрасываем ошибку перед новой попыткой

            try {
                ws.current = new WebSocket('wss://ardua.site/ws');
                let resolved = false; // Флаг, чтобы resolve вызвался только один раз

                const onOpen = () => {
                    if (resolved) return;
                    resolved = true;
                    cleanupEvents();
                    setIsConnected(true);
                    setError(null);
                    console.log('WebSocket подключен');
                    resolve(true);
                };

                const onError = (event: Event) => {
                    if (resolved) return;
                    resolved = true;
                    cleanupEvents();
                    console.error('Ошибка WebSocket:', event);
                    setError('Ошибка подключения WebSocket');
                    setIsConnected(false);
                    resolve(false);
                };

                const onClose = (event: CloseEvent) => {
                    // onClose может вызваться после onOpen/onError, не сбрасываем resolved
                    cleanupEvents(); // Все равно чистим обработчики
                    console.log('WebSocket отключен:', event.code, event.reason);
                    setIsConnected(false);
                    setIsInRoom(false); // Если сокет закрылся, мы точно не в комнате
                    if (event.code !== 1000 && event.code !== 1005 && !error) { // Не перезаписываем существующую ошибку
                        setError(`WebSocket закрыт: ${event.reason || 'код ' + event.code}`);
                    }
                    // Не вызываем resolve(false) здесь, если он уже был вызван в onError/onTimeout
                    if (!resolved) {
                        resolved = true;
                        resolve(false); // Если закрылся до onOpen
                    }
                };

                const cleanupEvents = () => {
                    ws.current?.removeEventListener('open', onOpen);
                    ws.current?.removeEventListener('error', onError);
                    ws.current?.removeEventListener('close', onClose);
                    if (connectionTimeout.current) {
                        clearTimeout(connectionTimeout.current);
                        connectionTimeout.current = null;
                    }
                };

                // Таймаут подключения WebSocket
                connectionTimeout.current = setTimeout(() => {
                    if (resolved) return;
                    resolved = true;
                    cleanupEvents();
                    console.error('Таймаут подключения WebSocket');
                    setError('Таймаут подключения WebSocket');
                    ws.current?.close(); // Принудительно закрываем попытку
                    resolve(false);
                }, 10000); // Увеличим таймаут до 10 секунд

                ws.current.addEventListener('open', onOpen);
                ws.current.addEventListener('error', onError);
                ws.current.addEventListener('close', onClose);

            } catch (err) {
                if (!error) { // Не перезаписываем ошибку, если она уже установлена
                    setError(`Не удалось создать WebSocket: ${err instanceof Error ? err.message : String(err)}`);
                }
                console.error('Критическая ошибка создания WebSocket:', err);
                resolve(false); // Не удалось даже создать объект
            }
        });
    };

    // Настройка слушателей WebSocket (ключевые изменения здесь)
    const setupWebSocketListeners = () => {
        if (!ws.current) {
            console.error('Попытка настроить слушатели для несуществующего WebSocket');
            return;
        }
        console.log('Настройка слушателей WebSocket...');

        const handleMessage = async (event: MessageEvent) => {
            try {
                const message: WebSocketMessage = JSON.parse(event.data);
                console.log('<<< Получено сообщение:', message); // Лог для всех входящих

                switch (message.type) {
                    case 'room_info':
                        console.log('Обновлена информация о комнате:', message.data);
                        setUsers(message.data?.users || []);
                        // Если мы в комнате и есть лидер, можно считать, что готовы к офферу
                        if (message.data?.leader && isInRoom) {
                            console.log('Лидер в комнате, ожидаем оффер...');
                            // Таймер ожидания оффера можно добавить здесь
                        }
                        break;

                    case 'error':
                        console.error('Ошибка от сервера:', message.data);
                        setError(`Сервер: ${message.data}`);
                        // Можно добавить логику реакции, например, выход из комнаты
                        if (message.data === 'Room is full' || message.data === 'Room already has a leader' || message.data === 'Room already has a follower') {
                            leaveRoom();
                        }
                        break;

                    case 'force_disconnect':
                        console.warn('Получена команда принудительного отключения:', message.data);
                        setError(`Отключено сервером: ${message.data || 'Другой зритель подключился'}`);
                        leaveRoom(); // Выходим и очищаем все
                        break;

                    case 'reconnect_request':
                        console.warn('Сервер запросил переподключение:', message.reason);
                        setError(`Сервер запросил переподключение: ${message.reason || 'проблема соединения'}`);
                        // Небольшая задержка перед ресетом
                        setTimeout(() => {
                            resetConnection();
                        }, 1500);
                        break;

                    // --- ВАЖНО: Обработка ОФФЕРА от лидера ---
                    case 'offer':
                        if (!pc.current) {
                            console.error('Получен оффер, но PeerConnection не инициализирован!');
                            setError('Ошибка: получен оффер до инициализации WebRTC');
                            return;
                        }
                        if (!message.sdp) {
                            console.error('Получен оффер без SDP!');
                            setError('Ошибка: Некорректный оффер от сервера');
                            return;
                        }
                        if (pc.current.signalingState !== 'stable' && pc.current.signalingState !== 'have-remote-offer') {
                            console.warn(`Получен оффер в неожиданном состоянии ${pc.current.signalingState}, попытка обработки...`);
                            // Можно попробовать сбросить состояние перед обработкой, но это рискованно
                            // await resetConnection(); // Как вариант
                            // return;
                        }


                        console.log('Получен оффер от лидера, обрабатываем...');
                        try {
                            const offerDescription: RTCSessionDescriptionInit = {
                                type: 'offer',
                                sdp: normalizeSdp(message.sdp.sdp) // Нормализуем SDP
                            };

                            console.log('Установка Remote Description (Offer)');
                            await pc.current.setRemoteDescription(offerDescription);

                            console.log('Создание Answer');
                            const answer = await pc.current.createAnswer(); // Не нужны constraints

                            const normalizedAnswer = {
                                ...answer,
                                sdp: normalizeSdp(answer.sdp) // Нормализуем наш Answer
                            };

                            console.log('Установка Local Description (Answer)');
                            await pc.current.setLocalDescription(normalizedAnswer);

                            // Отправляем Answer на сервер
                            if (ws.current?.readyState === WebSocket.OPEN) {
                                console.log('>>> Отправка Answer на сервер');
                                ws.current.send(JSON.stringify({
                                    type: 'answer',
                                    sdp: normalizedAnswer,
                                    // room: roomId, // Сервер знает комнату по соединению
                                    // username // Сервер знает имя по соединению
                                }));
                                console.log('Answer отправлен');

                                // Начинаем ожидать медиапоток
                                // setIsCallActive(true); // Устанавливать в true лучше при получении трека
                                startVideoCheckTimer(); // Запускаем проверку получения видео
                            } else {
                                console.error('WebSocket закрыт, не удалось отправить Answer');
                                setError('Ошибка отправки ответа: WebSocket закрыт');
                            }

                            // Обрабатываем ожидающие ICE кандидаты, если они есть
                            console.log(`Обработка ${pendingIceCandidates.current.length} ожидающих ICE кандидатов...`);
                            while (pendingIceCandidates.current.length > 0) {
                                const candidate = pendingIceCandidates.current.shift();
                                if (candidate && pc.current.remoteDescription) { // Убедимся, что remoteDescription все еще установлен
                                    try {
                                        console.log('Добавление отложенного ICE кандидата:', candidate.candidate.substring(0, 30) + '...');
                                        await pc.current.addIceCandidate(candidate);
                                    } catch (err) {
                                        console.error('Ошибка добавления отложенного ICE кандидата:', err);
                                    }
                                }
                            }


                        } catch (err) {
                            console.error('Ошибка обработки Offer или создания Answer:', err);
                            setError(`Ошибка WebRTC при обработке оффера: ${err instanceof Error ? err.message : String(err)}`);
                            // Попытка сбросить соединение при ошибке
                            resetConnection();
                        }
                        break;

                    // --- УДАЛЕНО: Обработка Answer (ведомый не получает Answer) ---
                    // case 'answer':
                    //     console.warn('Получено сообщение "answer", которое ведомый не должен получать.');
                    //     break;

                    case 'ice_candidate':
                        if (!pc.current) {
                            console.warn('Получен ICE кандидат, но PeerConnection не создан.');
                            return;
                        }
                        if (!message.ice || !message.ice.candidate) {
                            console.warn('Получен некорректный ICE кандидат от сервера.');
                            return;
                        }

                        try {
                            const candidate = new RTCIceCandidate(message.ice);
                            console.log('Получен ICE кандидат:', candidate.candidate.substring(0, 30) + '...');

                            // Добавляем кандидата только если remoteDescription уже установлен
                            // Иначе добавляем в очередь
                            if (pc.current.remoteDescription) {
                                console.log('Добавление ICE кандидата немедленно.');
                                await pc.current.addIceCandidate(candidate);
                            } else {
                                console.log('Remote description еще не установлен, добавление ICE кандидата в очередь.');
                                pendingIceCandidates.current.push(candidate);
                            }
                        } catch (err) {
                            // Игнорируем ошибки добавления кандидатов, если браузер считает их невалидными
                            if (err instanceof DOMException && err.name === 'OperationError') {
                                console.warn('Ошибка добавления ICE кандидата (возможно, дубликат или невалидный):', err.message, message.ice);
                            } else {
                                console.error('Критическая ошибка добавления ICE кандидата:', err);
                                // setError('Ошибка обработки ICE кандидата'); // Не ставим ошибку, чтобы не прерывать процесс
                            }
                        }
                        break;

                    // Добавим обработку других типов, если нужно
                    case 'switch_camera':
                        // Ведомый получил уведомление о смене камеры лидером
                        console.log('Лидер переключил камеру (уведомление)');
                        // Здесь можно добавить визуальную индикацию, если нужно
                        break;

                    default:
                        console.log('Получено сообщение неизвестного типа:', message.type);
                }
            } catch (err) {
                console.error('Критическая ошибка обработки сообщения WebSocket:', err, event.data);
                setError('Ошибка парсинга сообщения от сервера');
            }
        };

        // Удаляем старый обработчик, если он был
        if (ws.current.onmessage) {
            console.log('Удаление старого обработчика onmessage');
            ws.current.onmessage = null;
        }
        // Назначаем новый
        ws.current.onmessage = handleMessage;
        console.log('Новый обработчик onmessage назначен');
    };

    // --- УДАЛЕНО: createAndSendOffer (ведомый не создает оффер) ---
    // const createAndSendOffer = async () => { ... };

    // Инициализация WebRTC (добавлены логи, убраны ненужные обработчики)
    const initializeWebRTC = async (): Promise<boolean> => {
        console.log('Инициализация WebRTC...');
        if (pc.current) {
            console.warn('WebRTC уже инициализирован, очистка перед повторной инициализацией...');
            cleanup(); // Очищаем перед созданием нового
        }
        setError(null); // Сбрасываем прошлые ошибки WebRTC

        try {
            // cleanup(); // Убрали отсюда, делаем перед созданием pc.current выше

            console.log('Создание нового RTCPeerConnection с конфигурацией:', RTC_CONFIG);
            pc.current = new RTCPeerConnection(RTC_CONFIG);

            // --- Обработчики событий WebRTC ---
            pc.current.onnegotiationneeded = () => {
                // Этот обработчик может срабатывать при добавлении треков.
                // Для ведомого он не должен инициировать отправку оффера.
                console.log('Событие: onnegotiationneeded сработало. Текущее состояние:', pc.current?.signalingState);
                // Убедимся, что не пытаемся создать оффер здесь
                if (pc.current?.signalingState === 'stable') {
                    console.log('Состояние stable, negotiationneeded может быть ложным срабатыванием или требовать действий лидера.');
                }
            };

            pc.current.onsignalingstatechange = () => {
                console.log('Событие: Состояние сигнализации изменилось:', pc.current?.signalingState);
            };

            pc.current.onicegatheringstatechange = () => {
                console.log('Событие: Состояние сбора ICE изменилось:', pc.current?.iceGatheringState);
                if(pc.current?.iceGatheringState === 'complete') {
                    console.log('Сбор ICE кандидатов завершен.');
                }
            };

            pc.current.onicecandidateerror = (event) => {
                // Игнорируем стандартные ошибки STUN/TURN, которые не являются критическими
                const ignorableErrors = [701, /* STUN binding request timeout */ ];
                if ('errorCode' in event && !ignorableErrors.includes(event.errorCode)) {
                    console.error(`Критическая ошибка ICE кандидата: Код ${event.errorCode}, Текст: ${event.errorText}, URL: ${event.url}`);
                    // setError(`Ошибка ICE соединения: ${event.errorText || 'код ' + event.errorCode}`);
                    // Не устанавливаем глобальную ошибку, чтобы не прерывать все, но логируем как error
                } else {
                    console.warn('Не критическая ошибка ICE кандидата:', event);
                }
            };

            // --- Получение локального медиапотока ---
            console.log('Запрос доступа к медиаустройствам:', deviceIds);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: deviceIds.video ? {
                    deviceId: { exact: deviceIds.video },
                    width: { ideal: 640 },  // Уменьшим разрешение для экономии ресурсов
                    height: { ideal: 480 },
                    frameRate: { ideal: 24 } // Уменьшим частоту кадров
                } : false, // Ведомому не нужно отправлять свое видео
                audio: deviceIds.audio ? {
                    deviceId: { exact: deviceIds.audio },
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } : false // Ведомому не нужно отправлять свое аудио
            });
            console.log('Локальный медиапоток получен:', stream.id);

            // --- Ведомому НЕ НУЖНО отправлять свои треки ---
            // setLocalStream(stream); // Не сохраняем локальный поток, если не отправляем
            // stream.getTracks().forEach(track => {
            //     console.log(`Добавление локального трека ${track.kind} к PeerConnection`);
            //     pc.current?.addTrack(track, stream);
            // });

            // --- Обработка ICE кандидатов ---
            pc.current.onicecandidate = (event) => {
                if (event.candidate) {
                    // Проверяем готовность WebSocket перед отправкой
                    if (ws.current?.readyState === WebSocket.OPEN) {
                        console.log(`>>> Отправка ICE кандидата: ${event.candidate.candidate.substring(0, 30)}...`);
                        try {
                            // Формируем данные кандидата явно, как ожидает сервер
                            const iceData: RTCIceCandidateInit = {
                                candidate: event.candidate.candidate,
                                sdpMid: event.candidate.sdpMid ?? undefined, // Используем ?? для null/undefined
                                sdpMLineIndex: event.candidate.sdpMLineIndex ?? undefined,
                                usernameFragment: event.candidate.usernameFragment ?? undefined,
                            };
                            ws.current.send(JSON.stringify({
                                type: 'ice_candidate',
                                ice: iceData
                                // room и username не нужны, сервер знает по соединению
                            }));
                        } catch (err) {
                            console.error('Ошибка отправки ICE кандидата:', err);
                        }
                    } else {
                        console.warn('WebSocket не открыт, не удалось отправить ICE кандидата.');
                    }
                } else {
                    console.log('Событие onicecandidate без кандидата (конец сбора?)');
                }
            };

            // --- Обработка входящих медиапотоков ---
            pc.current.ontrack = (event) => {
                console.log(`Событие: Получен трек ${event.track.kind}, stream_id: ${event.streams[0]?.id}`);
                if (event.streams && event.streams[0]) {
                    const incomingStream = event.streams[0];
                    console.log(`Трек принадлежит потоку ${incomingStream.id}. Текущий remoteStream: ${remoteStream?.id}`);

                    // Устанавливаем поток, только если он новый
                    if(remoteStream?.id !== incomingStream.id) {
                        console.log('Установка нового удаленного потока:', incomingStream.id);
                        setRemoteStream(incomingStream); // Устанавливаем весь поток
                    } else {
                        console.log('Трек принадлежит уже установленному удаленному потоку.');
                    }

                    // Проверяем видео трек отдельно
                    const videoTrack = incomingStream.getVideoTracks()[0];
                    if (videoTrack) {
                        console.log(`Видео трек получен: ${videoTrack.id}, readyState: ${videoTrack.readyState}, enabled: ${videoTrack.enabled}`);
                        videoTrack.onunmute = () => {
                            console.log('Видео трек размьючен (начал поступать)');
                            setIsCallActive(true); // Считаем звонок активным при получении видео
                            // Очищаем таймер проверки, так как видео пошло
                            if (videoCheckTimeout.current) {
                                console.log('Очистка таймера проверки видео (видео получено)');
                                clearTimeout(videoCheckTimeout.current);
                                videoCheckTimeout.current = null;
                            }
                        };
                        videoTrack.onmute = () => {
                            console.warn('Видео трек замьючен (перестал поступать?)');
                            setIsCallActive(false);
                            startVideoCheckTimer(); // Перезапускаем проверку на всякий случай
                        };
                        videoTrack.onended = () => {
                            console.warn('Видео трек завершен');
                            setIsCallActive(false);
                            setRemoteStream(null); // Убираем поток
                        };
                        // Если трек уже не замьючен при добавлении
                        if (!videoTrack.muted) {
                            setIsCallActive(true);
                            if (videoCheckTimeout.current) {
                                clearTimeout(videoCheckTimeout.current);
                                videoCheckTimeout.current = null;
                            }
                        }
                    } else {
                        console.warn('Входящий поток не содержит видео трека.');
                    }
                } else {
                    console.warn('Событие ontrack не содержит потоков.');
                }
            };

            // --- Обработка состояния ICE соединения ---
            pc.current.oniceconnectionstatechange = () => {
                if (!pc.current) return;
                const state = pc.current.iceConnectionState;
                console.log('Событие: Состояние ICE соединения:', state);

                switch (state) {
                    case 'checking':
                        console.log('ICE проверка...');
                        break;
                    case 'connected':
                        console.log('ICE соединение установлено (connected).');
                        // Можно считать активным, но лучше дождаться 'completed' или видео
                        break;
                    case 'completed':
                        console.log('ICE соединение успешно завершено (completed).');
                        setIsCallActive(true); // Теперь точно активно
                        if (videoCheckTimeout.current) {
                            clearTimeout(videoCheckTimeout.current); // Видео должно быть уже проверено или скоро
                            videoCheckTimeout.current = null;
                        }
                        break;
                    case 'failed':
                        console.error('ICE соединение НЕ УДАЛОСЬ (failed). Попытка перезапуска ICE...');
                        setError('Проблема с ICE соединением');
                        // Пытаемся перезапустить ICE через некоторое время
                        setTimeout(() => {
                            if (pc.current && pc.current.iceConnectionState === 'failed') {
                                console.log('Вызов restartIce()...');
                                pc.current.restartIce();
                                // После restartIce может потребоваться новый offer/answer,
                                // но в роли ведомого мы ждем оффер от лидера.
                                // Можно запросить новый оффер у сервера? Или сервер сам заметит?
                                // Пока просто перезапускаем ICE.
                            }
                        }, 1500);
                        break;
                    case 'disconnected':
                        console.warn('ICE соединение разорвано (disconnected). Ожидание автоматического восстановления...');
                        // Браузер попытается восстановиться сам. Если не получится, перейдет в failed.
                        // Можно запустить таймер для resetConnection, если восстановление не произойдет.
                        setIsCallActive(false); // Пока считаем неактивным
                        startVideoCheckTimer(); // Запускаем проверку, вдруг видео пропало
                        break;
                    case 'closed':
                        console.log('ICE соединение закрыто.');
                        setIsCallActive(false);
                        cleanup(); // Полная очистка при закрытии ICE
                        break;
                    default:
                        console.log('Промежуточное состояние ICE:', state);
                }
            };

            // --- Обработка состояния PeerConnection ---
            pc.current.onconnectionstatechange = () => {
                if(!pc.current) return;
                const state = pc.current.connectionState;
                console.log('Событие: Состояние PeerConnection:', state);
                switch(state) {
                    case 'connected':
                        console.log('PeerConnection успешно подключен.');
                        setIsCallActive(true); // Подтверждаем активность
                        setError(null); // Сбрасываем ошибки при успешном подключении
                        retryAttempts.current = 0; // Сбрасываем счетчик попыток
                        setRetryCount(0);
                        break;
                    case 'failed':
                        console.error('PeerConnection перешел в состояние failed.');
                        setError('Ошибка установки PeerConnection');
                        resetConnection(); // Пытаемся полностью пересоздать соединение
                        break;
                    case 'disconnected':
                        console.warn('PeerConnection отключен (disconnected).');
                        setIsCallActive(false);
                        // Может восстановиться само или перейти в failed
                        break;
                    case 'closed':
                        console.log('PeerConnection закрыт.');
                        setIsCallActive(false);
                        // Очистка обычно уже вызвана через iceConnectionState 'closed'
                        break;
                }
            };


            // Запускаем мониторинг статистики (если нужно)
            // startConnectionMonitoring();

            console.log('Инициализация WebRTC завершена успешно.');
            return true;
        } catch (err) {
            console.error('Критическая ошибка инициализации WebRTC:', err);
            setError(`Не удалось инициализировать WebRTC: ${err instanceof Error ? err.message : String(err)}`);
            cleanup(); // Очистка при ошибке
            return false;
        }
    };

    // Мониторинг соединения (без изменений)
    const startConnectionMonitoring = () => {
        if (statsInterval.current) clearInterval(statsInterval.current);
        statsInterval.current = setInterval(async () => {
            if (!pc.current || pc.current.connectionState !== 'connected') return;
            try {
                const stats = await pc.current.getStats();
                let activeInboundVideo = false;
                stats.forEach(report => {
                    if (report.type === 'inbound-rtp' && report.kind === 'video' && report.bytesReceived > 0) {
                        // Проверяем, были ли получены байты с момента последней проверки (нужно хранить предыдущее значение)
                        // Или просто проверяем, что пакеты приходят
                        if (report.packetsReceived > 0 /* && report.packetsReceived > previousPackets */) {
                            activeInboundVideo = true;
                        }
                    }
                });
                if (!activeInboundVideo && isCallActive) {
                    console.warn('Мониторинг: Не обнаружено активного входящего видеопотока.');
                    // Возможно, стоит запустить resetConnection, но это может быть агрессивно
                    // resetConnection();
                } else if (activeInboundVideo && !isCallActive) {
                    console.log('Мониторинг: Видеопоток восстановлен.');
                    setIsCallActive(true); // Восстанавливаем состояние, если поток пошел
                }
            } catch (err) {
                // console.error('Ошибка получения статистики:', err); // Может быть шумно
            }
        }, 5000); // Проверка каждые 5 секунд
    };

    // Сброс и попытка переподключения (немного изменена логика)
    const resetConnection = async () => {
        console.warn('Вызов resetConnection...');
        if (retryAttempts.current >= MAX_RETRIES) {
            console.error(`Достигнут лимит попыток переподключения (${MAX_RETRIES}). Отключаемся.`);
            setError('Не удалось восстановить соединение после нескольких попыток.');
            leaveRoom();
            return;
        }

        retryAttempts.current += 1;
        setRetryCount(retryAttempts.current);
        console.log(`Попытка восстановления соединения #${retryAttempts.current}...`);
        setError(`Попытка восстановления #${retryAttempts.current}...`); // Показываем пользователю

        // Важно: Сначала полностью очищаем все, включая WebSocket
        leaveRoom(); // leaveRoom теперь закрывает и ws.current

        // Пауза перед следующей попыткой
        const delay = Math.min(1000 * Math.pow(2, retryAttempts.current - 1), 15000); // Экспоненциальная задержка до 15 сек
        console.log(`Пауза перед переподключением: ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));

        // Пытаемся заново войти в комнату
        console.log('Повторный вызов joinRoom...');
        await joinRoom(username); // Используем исходный username
    };

    // Перезагрузка медиаустройств (без изменений, но ведомому не нужно)
    const restartMediaDevices = async (): Promise<boolean> => {
        console.warn("Ведомому не требуется перезапускать медиаустройства для отправки.");
        // Эта функция может быть полезна, если нужно обновить источник звука для воспроизведения,
        // но обычно это делается через настройки браузера или ОС.
        return true; // Просто возвращаем true

        /* Старый код, если бы ведомый отправлял медиа
        try {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            // ... (код получения нового stream)
            setLocalStream(stream);
            // ... (код замены треков в pc.current)
            return true;
        } catch (err) {
            console.error('Ошибка перезагрузки медиаустройств:', err);
            setError('Ошибка доступа к медиаустройствам');
            return false;
        }
        */
    };

    // --- Основная функция входа в комнату ---
    const joinRoom = useCallback(async (uniqueUsername: string) => {
        console.log(`Попытка входа в комнату ${roomId} как ${uniqueUsername}`);
        if (isInRoom) {
            console.warn('Уже в комнате, выход не требуется перед входом?');
            // Возможно, стоит вызвать leaveRoom() перед повторным входом, если это не реконнект
            // leaveRoom(); // Раскомментировать, если нужен полный сброс при вызове joinRoom снаружи
        }
        // Сбрасываем состояние перед входом
        setError(null);
        setIsInRoom(false);
        setIsConnected(false);
        setIsCallActive(false);
        // cleanup(); // Очистка теперь вызывается в leaveRoom или при ошибке

        try {
            // 1. Подключаем WebSocket
            console.log('Шаг 1: Подключение WebSocket...');
            if (!(await connectWebSocket())) {
                // Ошибка уже установлена в connectWebSocket
                throw new Error('Не удалось подключиться к WebSocket');
            }
            console.log('WebSocket подключен.');

            // 2. Настраиваем слушатели (важно сделать до отправки join)
            console.log('Шаг 2: Настройка слушателей WebSocket...');
            setupWebSocketListeners();

            // 3. Инициализируем WebRTC (создаем PeerConnection)
            console.log('Шаг 3: Инициализация WebRTC...');
            if (!(await initializeWebRTC())) {
                // Ошибка уже установлена в initializeWebRTC
                throw new Error('Не удалось инициализировать WebRTC');
            }
            console.log('WebRTC инициализирован.');


            // 4-All. Отправляем запрос на присоединение к комнате
            // Убедимся, что сокет все еще открыт
            if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
                throw new Error('WebSocket не готов к отправке сообщения join');
            }

            console.log('Шаг 4-All: Отправка запроса на присоединение к комнате...');
            // --- ИСПРАВЛЕНО: Отправляем данные напрямую, как ожидает сервер ---
            ws.current.send(JSON.stringify({
                // НЕ 'action: "join"'
                room: roomId,
                username: uniqueUsername,
                isLeader: false // Браузер всегда ведомый
            }));
            console.log('Запрос на присоединение отправлен.');

            // 5. Успешное присоединение (локально считаем, ждем подтверждения от сервера)
            // Сервер пришлет room_info при успешном добавлении
            setIsInRoom(true); // Устанавливаем флаг, что мы в процессе входа/находимся в комнате
            console.log('Локально установлен флаг isInRoom=true, ожидание ответа сервера (room_info) и оффера...');

            // --- УДАЛЕНО: Логика создания оффера ведомым ---
            // shouldCreateOffer.current = true;
            // if (users.length === 0) { // НЕПРАВИЛЬНО для ведомого
            //     await createAndSendOffer();
            // }

            // 6. Запускаем таймер проверки видео (он запустится при получении оффера/ответа)
            // startVideoCheckTimer(); // Перенесено в обработчик оффера

        } catch (err) {
            console.error('Критическая ошибка на этапе входа в комнату:', err);
            if (!error) { // Не перезаписываем более конкретную ошибку
                setError(`Ошибка входа: ${err instanceof Error ? err.message : String(err)}`);
            }

            // Полная очистка при любой ошибке на этом этапе
            leaveRoom(); // Вызываем leaveRoom для корректной очистки и закрытия сокета

            // --- Логика повторного подключения ---
            // Перенесена в resetConnection, который вызывается при ошибках ICE/PeerConnection
            // или при запросе сервера на переподключение.
            // Если нужно переподключаться и при ошибке входа - можно вызвать resetConnection() здесь.
            // resetConnection();
        }
    }, [roomId, cleanup, leaveRoom, error]); // Добавляем зависимости для useCallback

    // Эффект для автоматического выхода при размонтировании компонента
    useEffect(() => {
        // Возвращаем функцию очистки, которая будет вызвана при размонтировании
        return () => {
            console.log('Компонент размонтируется, вызов leaveRoom...');
            leaveRoom();
        };
    }, [leaveRoom]); // Зависимость от leaveRoom (которая сама использует useCallback)

    // Возвращаем состояние и функции управления
    return {
        localStream: null, // Ведомый не использует локальный поток для отправки
        remoteStream,
        users,
        joinRoom,
        leaveRoom,
        isCallActive,
        isConnected,
        isInRoom,
        error,
        retryCount,
        resetConnection,
        // restartMediaDevices, // Ведомому не нужна
        ws: ws.current,
    };
};