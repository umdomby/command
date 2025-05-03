import { useEffect, useRef, useState, useCallback } from 'react';

// Определяем возможные платформы для более точной настройки
type Platform = 'desktop' | 'android' | 'ios' | 'unknown';

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
force_disconnect?: boolean;
// Добавляем типы, которые обрабатываются
switch_camera_ack?: boolean;
reconnect_request?: boolean;
}

// Интерфейс для возвращаемых значений хука
export interface UseWebRTCReturn {
localStream: MediaStream | null;
remoteStream: MediaStream | null;
users: string[];
joinRoom: (uniqueUsername: string) => Promise<void>;
leaveRoom: () => void;
isCallActive: boolean;
isConnected: boolean; // WebSocket connected
isInRoom: boolean; // Successfully joined room
isPeerConnected: boolean; // WebRTC peer connection established
error: string | null;
retryCount: number;
resetConnection: () => Promise<void>;
restartMediaDevices: () => Promise<boolean>;
ws: WebSocket | null;
platform: Platform; // Возвращаем определенную платформу
}

export const useWebRTC = (
deviceIds: { video: string; audio: string },
username: string,
roomId: string
): UseWebRTCReturn => {
const [localStream, setLocalStream] = useState<MediaStream | null>(null);
const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
const [users, setUsers] = useState<string[]>([]);
const [isCallActive, setIsCallActive] = useState(false);
const [isConnected, setIsConnected] = useState(false); // WebSocket connected
const [isInRoom, setIsInRoom] = useState(false);
const [isPeerConnected, setIsPeerConnected] = useState(false); // Добавлено состояние для RTCPeerConnection
const [error, setError] = useState<string | null>(null);
const [retryCount, setRetryCount] = useState(0);
const [platform, setPlatform] = useState<Platform>('unknown'); // Состояние для платформы

    const ws = useRef<WebSocket | null>(null);
    const pc = useRef<RTCPeerConnection | null>(null);
    const pendingIceCandidates = useRef<RTCIceCandidate[]>([]);
    const isNegotiating = useRef(false);
    const connectionTimeout = useRef<NodeJS.Timeout | null>(null);
    const statsInterval = useRef<NodeJS.Timeout | null>(null);
    const videoCheckTimeout = useRef<NodeJS.Timeout | null>(null);
    const retryAttempts = useRef(0);
    const lastStats = useRef<RTCStatsReport | null>(null); // Для сравнения статистики

    const MAX_RETRIES = 5; // Уменьшено для более быстрой реакции на неустранимые проблемы
    const RETRY_DELAY_BASE = 2000; // Базовая задержка перед повторной попыткой (мс)
    const VIDEO_CHECK_TIMEOUT = 5000; // Увеличено время ожидания видео до 5 секунд
    const STATS_INTERVAL = 3000; // Частота проверки статистики (мс) - чаще для быстрой реакции

    // Определение платформы при монтировании
    useEffect(() => {
        const ua = navigator.userAgent.toLowerCase();
        if (/android/.test(ua)) {
            setPlatform('android');
        } else if (/iphone|ipad|ipod/.test(ua)) {
            setPlatform('ios');
        } else if (navigator.platform.toUpperCase().indexOf('MAC') >= 0 || navigator.platform.toUpperCase().indexOf('WIN') >= 0) {
            setPlatform('desktop');
        } else {
            setPlatform('unknown');
        }
    }, []);

    // Нормализация SDP: удаляет нестандартные атрибуты и исправляет базовую структуру
    // Важно: эта функция должна быть аккуратной, чтобы не сломать валидный SDP
    const normalizeSdp = (sdp: string | undefined): string => {
        if (!sdp) return '';
        // Удаляем network-cost атрибут, который может вызывать проблемы совместимости
        let normalized = sdp.replace(/a=network-cost:.+\r\n/g, '');
        // Можно добавить другие правила нормализации, если будут выявлены проблемы
        // Пример: Принудительное использование определенного кодека (требует сложного парсинга SDP)
        // normalized = preferCodec(normalized, 'H264'); // Условная функция
        return normalized.trim() + '\r\n'; // Убедимся, что в конце есть CRLF
    };

    // Полная очистка ресурсов
    const cleanup = useCallback(() => {
        console.log('Выполняется очистка ресурсов...');
        // Таймеры
        if (connectionTimeout.current) clearTimeout(connectionTimeout.current);
        if (statsInterval.current) clearInterval(statsInterval.current);
        if (videoCheckTimeout.current) clearTimeout(videoCheckTimeout.current);
        connectionTimeout.current = null;
        statsInterval.current = null;
        videoCheckTimeout.current = null;

        // WebRTC соединение
        if (pc.current) {
            // Удаляем обработчики перед закрытием
            pc.current.onicecandidate = null;
            pc.current.ontrack = null;
            pc.current.onnegotiationneeded = null;
            pc.current.oniceconnectionstatechange = null;
            pc.current.onicegatheringstatechange = null;
            pc.current.onsignalingstatechange = null;
            pc.current.onconnectionstatechange = null; // Новый обработчик
            pc.current.onicecandidateerror = null;

            // Остановка всех трансиверов (важно для полного разрыва)
            pc.current.getTransceivers().forEach(transceiver => {
                try {
                    if (transceiver.stop) transceiver.stop(); // Новый метод
                    // Старый метод (для совместимости)
                    if (transceiver.sender && transceiver.sender.track) {
                        transceiver.sender.track.stop();
                    }
                    if (transceiver.receiver && transceiver.receiver.track) {
                        transceiver.receiver.track.stop();
                    }
                } catch (e) {
                    console.warn("Ошибка при остановке трансивера:", e);
                }
            });

            pc.current.close();
            pc.current = null;
            console.log("RTCPeerConnection закрыт.");
        }

        // Медиапотоки
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
            console.log("Локальный медиапоток остановлен.");
        }
        if (remoteStream) {
            remoteStream.getTracks().forEach(track => track.stop());
            setRemoteStream(null);
            console.log("Удаленный медиапоток остановлен.");
        }

        // Сброс состояний
        setIsCallActive(false);
        setIsPeerConnected(false); // Сбрасываем состояние подключения пира
        pendingIceCandidates.current = [];
        isNegotiating.current = false;
        lastStats.current = null; // Сброс последней статистики
        console.log("Состояния сброшены.");
    }, [localStream, remoteStream]); // Добавлены зависимости


    // Функция выхода из комнаты
    const leaveRoom = useCallback(() => {
        console.log(`Попытка выхода из комнаты ${roomId}...`);
        if (ws.current?.readyState === WebSocket.OPEN) {
            try {
                console.log("Отправка сообщения 'leave' на WebSocket");
                ws.current.send(JSON.stringify({
                    type: 'leave',
                    room: roomId,
                    username
                }));
            } catch (e) {
                console.error('Ошибка отправки сообщения leave:', e);
            } finally {
                // Закрываем WebSocket после отправки сообщения
                console.log("Закрытие WebSocket соединения...");
                ws.current?.close(1000, "User initiated leave"); // Код 1000 - нормальное закрытие
                ws.current = null;
            }
        } else if (ws.current) {
             console.log("WebSocket не был открыт, просто закрываем.");
             ws.current.close(1001, "WebSocket not open on leave"); // Код 1001 - сторона уходит
             ws.current = null;
        }

        cleanup(); // Выполняем полную очистку
        setUsers([]);
        setIsInRoom(false);
        setIsConnected(false); // WebSocket больше не подключен
        setRetryCount(0); // Сбрасываем счетчик попыток при ручном выходе
        retryAttempts.current = 0;
        setError(null); // Очищаем ошибки при выходе
        console.log(`Выход из комнаты ${roomId} завершен.`);
    }, [roomId, username, cleanup]); // Добавлены зависимости

    // Таймер для проверки получения видеопотока
    const startVideoCheckTimer = useCallback(() => {
        if (videoCheckTimeout.current) clearTimeout(videoCheckTimeout.current);

        videoCheckTimeout.current = setTimeout(() => {
            // Проверяем, активен ли удаленный видео трек
            const videoTrack = remoteStream?.getVideoTracks()[0];
            if (!videoTrack || videoTrack.readyState !== 'live' || videoTrack.muted) {
                console.warn(`Удаленное видео не получено или неактивно в течение ${VIDEO_CHECK_TIMEOUT / 1000} сек. Попытка перезапуска соединения...`);
                resetConnection();
            } else {
                console.log("Проверка видео: удаленный видеопоток активен.");
            }
        }, VIDEO_CHECK_TIMEOUT);
    }, [remoteStream]); // Добавлены зависимости resetConnection, remoteStream

    // Подключение WebSocket с таймаутом
    const connectWebSocket = useCallback(async (): Promise<boolean> => {
        // Если уже подключен или подключается, выходим
        if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
             console.log(`WebSocket уже ${ws.current.readyState === WebSocket.OPEN ? 'открыт' : 'подключается'}.`);
            return ws.current.readyState === WebSocket.OPEN;
        }
        // Очищаем предыдущий инстанс, если он был закрыт некорректно
        if (ws.current) {
             ws.current.close();
        }

        return new Promise((resolve) => {
            console.log("Попытка подключения WebSocket к wss://ardua.site/ws");
            setError(null); // Сбрасываем ошибку перед новой попыткой
            try {
                ws.current = new WebSocket('wss://ardua.site/ws');
                setIsConnected(false); // Устанавливаем в false на время подключения

                let resolved = false; // Флаг, чтобы избежать двойного разрешения/отклонения

                const onOpen = () => {
                    if (resolved) return;
                    resolved = true;
                    cleanupEvents();
                    setIsConnected(true);
                    setError(null);
                    console.log('WebSocket успешно подключен.');
                    resolve(true);
                };

                const onError = (event: Event) => {
                    if (resolved) return;
                    resolved = true;
                    cleanupEvents();
                    console.error('Ошибка WebSocket:', event);
                    setError('Ошибка подключения WebSocket');
                    setIsConnected(false);
                     ws.current = null; // Сбрасываем инстанс при ошибке
                    resolve(false);
                };

                const onClose = (event: CloseEvent) => {
                    if (resolved && event.code === 1000) return; // Игнорируем нормальное закрытие, если уже разрешили
                    if (!resolved) { // Если закрылся до 'open' или из-за ошибки
                        resolved = true;
                        cleanupEvents();
                        console.warn('WebSocket отключен до установления соединения:', event.code, event.reason);
                        setError(event.code !== 1000 ? `WebSocket закрыт: ${event.reason || 'код ' + event.code}` : null);
                    } else { // Закрылся после успешного 'open'
                         console.log('WebSocket отключен (после установления соединения):', event.code, event.reason);
                         setError(event.code !== 1000 && event.code !== 1005 ? `Соединение WebSocket потеряно: ${event.reason || 'код ' + event.code}` : null); // 1005 - No Status Rcvd
                    }
                    setIsConnected(false);
                    setIsInRoom(false); // Если WebSocket упал, мы больше не в комнате
                    setIsPeerConnected(false); // И пир-соединение тоже неактивно
                    ws.current = null; // Сбрасываем инстанс
                     if (!resolved) resolve(false); // Если закрылся до 'open', промис должен завершиться false
                };

                 // Таймаут подключения
                 connectionTimeout.current = setTimeout(() => {
                    if (resolved) return;
                    resolved = true;
                    cleanupEvents();
                    console.error('Таймаут подключения WebSocket');
                    setError('Таймаут подключения WebSocket');
                    ws.current?.close(1001, "Connection timeout"); // Закрываем попытку
                    ws.current = null;
                    setIsConnected(false);
                    resolve(false);
                }, 10000); // 10 секунд на подключение

                const cleanupEvents = () => {
                    ws.current?.removeEventListener('open', onOpen);
                    ws.current?.removeEventListener('error', onError);
                    ws.current?.removeEventListener('close', onClose);
                    if (connectionTimeout.current) clearTimeout(connectionTimeout.current);
                    connectionTimeout.current = null;
                };

                ws.current.addEventListener('open', onOpen);
                ws.current.addEventListener('error', onError);
                ws.current.addEventListener('close', onClose);

            } catch (err) {
                console.error('Критическая ошибка при создании WebSocket:', err);
                setError('Не удалось создать WebSocket соединение');
                setIsConnected(false);
                 ws.current = null;
                resolve(false);
            }
        });
    }, []); // Нет зависимостей, т.к. URL и логика не меняются

    // Настройка обработчиков сообщений WebSocket
    const setupWebSocketListeners = useCallback(() => {
        if (!ws.current) {
            console.error("Попытка настроить слушателей для несуществующего WebSocket");
            return;
        }
        console.log("Настройка слушателей WebSocket...");

        ws.current.onmessage = async (event: MessageEvent) => {
            try {
                const message: WebSocketMessage = JSON.parse(event.data);
                console.log('WS <-', message); // Логирование входящих сообщений

                switch (message.type) {
                    case 'room_info':
                        setUsers(message.data?.users || []);
                        console.log("Обновлена информация о пользователях:", message.data?.users);
                        // Если мы только что вошли и есть другие пользователи, они должны прислать offer
                        // Если мы первые, то будем создавать offer сами (логика в joinRoom)
                        break;
                    case 'offer':
                        if (pc.current && message.sdp) {
                            if (isNegotiating.current || pc.current.signalingState !== 'stable') {
                                console.warn(`Игнорируем offer, т.к. ${isNegotiating.current ? 'уже идет согласование' : `нестабильное состояние ${pc.current.signalingState}`}`);
                                // Можно отправить ответ, что мы заняты, если сервер это поддерживает
                                return;
                            }
                            console.log("Получен offer, начинаем обработку...");
                            isNegotiating.current = true;
                            try {
                                await pc.current.setRemoteDescription(
                                    new RTCSessionDescription(message.sdp)
                                );
                                console.log("Установлено remote description (offer). Создание answer...");

                                // Получаем локальный медиапоток перед созданием ответа, если его еще нет
                                if (!localStream) {
                                    console.warn("Локальный поток отсутствует при создании answer. Попытка получить.");
                                    await initializeMediaDevices(); // Пытаемся получить медиа снова
                                    if (!localStream) {
                                        throw new Error("Не удалось получить локальный медиапоток для создания answer");
                                    }
                                }

                                const answer = await pc.current.createAnswer();
                                const normalizedAnswer = { ...answer, sdp: normalizeSdp(answer.sdp) };
                                console.log("Установка local description (answer)...");
                                await pc.current.setLocalDescription(normalizedAnswer);

                                console.log("Отправка answer...");
                                if (ws.current?.readyState === WebSocket.OPEN) {
                                    ws.current.send(JSON.stringify({
                                        type: 'answer',
                                        sdp: normalizedAnswer,
                                        room: roomId,
                                        username
                                    }));
                                } else {
                                     console.warn("WebSocket закрыт, не удалось отправить answer.");
                                }

                                setIsCallActive(true); // Считаем звонок активным после отправки ответа
                                console.log("Обработка offer завершена успешно.");

                                // Обработка отложенных ICE кандидатов (если они пришли до установки remote description)
                                await processPendingIceCandidates();

                            } catch (err) {
                                console.error('Ошибка обработки offer:', err);
                                setError(`Ошибка обработки предложения: ${err instanceof Error ? err.message : String(err)}`);
                                // Попытка отката состояния, если возможно
                                if (pc.current?.signalingState !== 'stable') {
                                    // Попробовать rollback или перезапуск соединения
                                    resetConnection();
                                }
                            } finally {
                                isNegotiating.current = false;
                            }
                        } else {
                            console.warn("Получен offer, но PeerConnection не готов или нет SDP.");
                        }
                        break;
                    case 'answer':
                        if (pc.current && message.sdp) {
                             if (pc.current.signalingState !== 'have-local-offer') {
                                console.warn(`Игнорируем answer, т.к. состояние сигнализации ${pc.current.signalingState}, а ожидалось 'have-local-offer'`);
                                return;
                            }
                            console.log("Получен answer. Установка remote description...");
                            try {
                                // Проверяем корректность SDP перед установкой
                                if (!message.sdp.sdp || message.sdp.type !== 'answer') {
                                    throw new Error('Некорректный формат SDP в answer');
                                }
                                const answerDescription = new RTCSessionDescription({
                                    type: 'answer',
                                    sdp: normalizeSdp(message.sdp.sdp) // Нормализуем SDP ответа
                                });
                                await pc.current.setRemoteDescription(answerDescription);
                                console.log("Remote description (answer) установлен успешно.");
                                setIsCallActive(true); // Звонок активен

                                // Обработка отложенных ICE кандидатов
                                await processPendingIceCandidates();

                                // Запускаем проверку получения видео
                                startVideoCheckTimer();

                            } catch (err) {
                                console.error('Ошибка установки answer:', err);
                                setError(`Ошибка установки ответа: ${err instanceof Error ? err.message : String(err)}`);
                                // Попытка перезапуска соединения при ошибке
                                resetConnection();
                            }
                        } else {
                            console.warn("Получен answer, но PeerConnection не готов или нет SDP.");
                        }
                        break;
                    case 'ice_candidate':
                        if (message.ice && pc.current) {
                            const candidate = new RTCIceCandidate(message.ice);
                            // Добавляем кандидата, только если remote description уже установлен
                            if (pc.current.remoteDescription) {
                                try {
                                     console.log("Добавление ICE кандидата...");
                                    await pc.current.addIceCandidate(candidate);
                                } catch (err) {
                                    // Игнорируем ошибки добавления кандидатов, браузеры часто с этим справляются
                                    console.warn('Ошибка добавления ICE-кандидата (часто некритично):', err);
                                }
                            } else {
                                // Если remote description еще нет, откладываем кандидата
                                console.log("Откладываем ICE кандидата (remote description еще не установлен)");
                                pendingIceCandidates.current.push(candidate);
                            }
                        }
                        break;
                    case 'force_disconnect':
                        console.warn('Получена команда принудительного отключения с сервера.');
                        setError('Вы были отключены: другой зритель подключился.');
                        leaveRoom(); // Используем leaveRoom для корректной очистки и закрытия WS
                        break;
                    case 'reconnect_request':
                         console.warn('Сервер запросил переподключение.');
                         setError('Сервер запросил переподключение, пытаемся...');
                         setTimeout(() => {
                             resetConnection();
                         }, 1000); // Небольшая задержка перед ресетом
                         break;
                    case 'switch_camera_ack':
                        console.log('Камера на удаленном устройстве (Android) успешно переключена.');
                        // Можно добавить уведомление для пользователя
                        break;
                    case 'error':
                        console.error('Получена ошибка от сервера:', message.data);
                        setError(`Ошибка сервера: ${message.data}`);
                        // Решаем, нужно ли разрывать соединение при ошибке сервера
                        if (message.data === 'Room is full' || message.data?.includes('already exists')) {
                             leaveRoom(); // Выходим, если комната полна или пользователь уже есть
                        }
                        break;
                    default:
                        console.log('Получено неизвестное сообщение:', message);
                }
            } catch (err) {
                console.error('Критическая ошибка обработки сообщения WebSocket:', err, 'Сообщение:', event.data);
                setError('Ошибка обработки сообщения от сервера');
            }
        };

        ws.current.onerror = (event) => {
            console.error('Произошла ошибка WebSocket:', event);
            setError('Ошибка соединения WebSocket');
            // connectWebSocket обработает переподключение или покажет ошибку в 'onClose'
        };

        ws.current.onclose = (event) => {
            console.warn(`WebSocket соединение закрыто. Код: ${event.code}, Причина: ${event.reason}`);
            setIsConnected(false);
            setIsInRoom(false);
            setIsPeerConnected(false);
            // Не сбрасываем ошибку, если она была установлена ранее (например, force_disconnect)
             if (!error && event.code !== 1000 && event.code !== 1005) { // 1000 - Normal, 1005 - No Status Rcvd
                setError(`WebSocket отключен: ${event.reason || 'код ' + event.code}`);
            }
            // Если закрытие не было инициировано пользователем (leaveRoom), пробуем переподключиться
            // if (event.code !== 1000) {
            //     // Здесь можно добавить логику автоматического переподключения WebSocket,
            //     // но resetConnection уже включает в себя переподключение WS
            //     console.log("Потеряно соединение WebSocket, возможно, потребуется resetConnection.");
            // }
            cleanup(); // Полная очистка при разрыве WS
            ws.current = null; // Убедимся, что ссылка очищена
        };
         console.log("Слушатели WebSocket настроены.");

    }, [roomId, username, error, leaveRoom, resetConnection, startVideoCheckTimer, cleanup, localStream, initializeMediaDevices]); // Добавлены зависимости

    // Обработка отложенных ICE кандидатов
    const processPendingIceCandidates = useCallback(async () => {
        if (!pc.current) return;
        console.log(`Обработка ${pendingIceCandidates.current.length} отложенных ICE кандидатов...`);
        while (pendingIceCandidates.current.length > 0) {
            const candidate = pendingIceCandidates.current.shift();
            if (candidate && pc.current.remoteDescription) { // Еще раз проверяем remoteDescription
                try {
                    await pc.current.addIceCandidate(candidate);
                     console.log("Отложенный ICE кандидат успешно добавлен.");
                } catch (err) {
                    console.warn('Ошибка добавления отложенного ICE кандидата:', err);
                }
            } else if (candidate) {
                // Если remote description снова пропал, возвращаем кандидата обратно или логируем ошибку
                 console.warn("Не удалось добавить отложенный ICE кандидата: remote description отсутствует.");
                 // pendingIceCandidates.current.unshift(candidate); // Можно вернуть обратно
                 break; // Выходим из цикла, если что-то пошло не так
            }
        }
    }, []); // Зависимостей нет, работает с refs

    // Инициализация медиаустройств (вынесена для переиспользования)
    const initializeMediaDevices = useCallback(async (): Promise<boolean> => {
        console.log("Инициализация медиаустройств...");
        setError(null);

        // Остановка текущего потока перед запросом нового
        if (localStream) {
            console.log("Остановка предыдущего локального потока...");
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }

        // Определение констрейнтов в зависимости от платформы
        let videoConstraints: MediaTrackConstraints | boolean;
        const audioConstraints: MediaTrackConstraints | boolean = deviceIds.audio
            ? {
                deviceId: { exact: deviceIds.audio },
                echoCancellation: true,
                noiseSuppression: true, // Включаем шумоподавление
                autoGainControl: true // Включаем АРУЗ
            }
            : true; // Запрашиваем аудио по умолчанию

        // Настройки видео для мобильных и десктопов
        // Уменьшаем разрешение и частоту кадров для мобильных устройств
        if (platform === 'android' || platform === 'ios') {
            console.log("Применение мобильных констрейнтов для видео");
            videoConstraints = deviceIds.video
                ? {
                    deviceId: { exact: deviceIds.video },
                    width: { ideal: 640, max: 1280 }, // Идеал ниже, макс выше на всякий случай
                    height: { ideal: 480, max: 720 },
                    frameRate: { ideal: 15, max: 24 } // Снижаем частоту кадров
                } : { // Мобильные по умолчанию
                    facingMode: "user", // Предпочитаем фронтальную камеру
                    width: { ideal: 640, max: 1280 },
                    height: { ideal: 480, max: 720 },
                    frameRate: { ideal: 15, max: 24 }
                };
        } else { // Десктопные констрейнты
             console.log("Применение десктопных констрейнтов для видео");
            videoConstraints = deviceIds.video
                ? {
                    deviceId: { exact: deviceIds.video },
                    width: { ideal: 1280 }, // Более высокое разрешение для десктопа
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 } // Стандартная частота кадров
                } : { // Десктопные по умолчанию
                     width: { ideal: 1280 },
                     height: { ideal: 720 },
                     frameRate: { ideal: 30 }
                 };
        }

        try {
            console.log("Запрос getUserMedia с констрейнтами:", { video: videoConstraints, audio: audioConstraints });
            const stream = await navigator.mediaDevices.getUserMedia({
                video: videoConstraints,
                audio: audioConstraints
            });

            const videoTracks = stream.getVideoTracks();
            const audioTracks = stream.getAudioTracks();
            console.log(`Получен поток: ${videoTracks.length} видео трек(ов), ${audioTracks.length} аудио трек(ов).`);

            if (videoTracks.length === 0 && videoConstraints !== false) {
                console.error('Не удалось получить видеопоток, хотя он был запрошен.');
                throw new Error('Видео недоступно с выбранного устройства.');
            }
             if (audioTracks.length === 0 && audioConstraints !== false) {
                console.warn('Не удалось получить аудиопоток, хотя он был запрошен.');
                // Не бросаем ошибку, видео может быть важнее
            }

            setLocalStream(stream);
            console.log("Локальный медиапоток успешно установлен.");
            return true;

        } catch (err) {
            console.error('Критическая ошибка getUserMedia:', err);
            setError(`Ошибка доступа к камере/микрофону: ${err instanceof Error ? err.message : String(err)}`);
            cleanup(); // Полная очистка при ошибке доступа к медиа
            return false;
        }
    }, [deviceIds.video, deviceIds.audio, platform, localStream, cleanup]); // Добавлены зависимости platform, localStream, cleanup


    // Инициализация RTCPeerConnection (вынесена для переиспользования)
    const initializePeerConnection = useCallback(async (): Promise<boolean> => {
        console.log("Инициализация RTCPeerConnection...");
        // Очистка предыдущего соединения перед созданием нового
        if (pc.current) {
            console.warn("Предыдущее соединение RTCPeerConnection существует. Очистка...");
            cleanup(); // Используем cleanup для корректной очистки
        }
         // Сброс связанных состояний
         setIsCallActive(false);
         setIsPeerConnected(false);
         pendingIceCandidates.current = [];
         isNegotiating.current = false;
         lastStats.current = null;


        // Конфигурация STUN/TURN серверов
        const config: RTCConfiguration = {
            iceServers: [
                { // TURN сервер для обхода сложных NAT
                    urls: 'turn:ardua.site:3478?transport=udp', // Приоритет UDP
                    // urls: ['turn:ardua.site:3478?transport=udp', 'turn:ardua.site:3478?transport=tcp'], // Можно указать оба
                    username: 'user1',
                    credential: 'pass1'
                },
                // { // TURN/TLS (если настроен и нужен)
                //     urls: 'turns:ardua.site:5349?transport=tcp',
                //     username: 'user1',
                //     credential: 'pass1'
                // },
                { // STUN сервер (можно добавить публичные для надежности)
                    urls: 'stun:ardua.site:3478'
                    // urls: ['stun:ardua.site:3478', 'stun:l.google.com:19302'] // Пример с Google STUN
                }
            ],
            iceTransportPolicy: 'all', // 'all' - использовать и STUN, и TURN. 'relay' - только TURN (для тестов)
            bundlePolicy: 'max-bundle', // Собирать все потоки в один транспортный канал
            rtcpMuxPolicy: 'require', // Требовать мультиплексирование RTP и RTCP
            // sdpSemantics: 'unified-plan' // Явно указываем Unified Plan (стандарт по умолчанию)
        };

        try {
            pc.current = new RTCPeerConnection(config);
            console.log("RTCPeerConnection создан с конфигурацией:", config);

            // === Обработчики событий PeerConnection ===

            // Требуется начать новый сеанс согласования (например, после addTrack)
            pc.current.onnegotiationneeded = async () => {
                 // Этот обработчик часто срабатывает при добавлении треков до установки соединения.
                 // В модели "ответчик создает оффер только если первый" он может быть излишним
                 // или даже мешать, вызывая преждевременные офферы.
                 // Если логика такая, что оффер создает только инициатор (или первый вошедший),
                 // этот обработчик можно оставить пустым или использовать для renegotiation позже.
                console.log("Событие: onnegotiationneeded");
                 // Пример: автоматическое создание оффера при renegotiation
                 // if (pc.current && pc.current.signalingState === 'stable' && isPeerConnected) {
                 //     console.log("onnegotiationneeded: Попытка renegotiation...");
                 //     await createAndSendOffer(true); // true - флаг ренегоджации
                 // }
            };

            // Изменение состояния сигнализации (обмен SDP)
            pc.current.onsignalingstatechange = () => {
                console.log('Событие: onsignalingstatechange. Новое состояние:', pc.current?.signalingState);
                 // Можно добавить логику обработки нестабильных состояний
                if (pc.current?.signalingState === 'closed') {
                    console.warn("Состояние сигнализации 'closed'. Соединение разорвано.");
                    // cleanup(); // Дополнительная очистка, если нужно
                }
            };

            // Изменение состояния сбора ICE кандидатов
            pc.current.onicegatheringstatechange = () => {
                console.log('Событие: onicegatheringstatechange. Новое состояние:', pc.current?.iceGatheringState);
            };

            // Ошибка при сборе ICE кандидатов
            pc.current.onicecandidateerror = (event) => {
                // Игнорируем стандартные ошибки STUN (701), они ожидаемы
                // Коды ошибок: https://webrtc.googlesource.com/src/+/refs/heads/main/pc/dtlstransport.cc#916
                // 701: STUN server returned an error response (e.g. unauthorized)
                 if (event.errorCode >= 700 && event.errorCode <= 799) {
                      console.warn(`Ошибка ICE кандидата (STUN/TURN): Код ${event.errorCode}, URL: ${event.url}, Ошибка: ${event.errorText}`);
                 } else {
                     console.error('Критическая ошибка ICE кандидата:', event);
                     setError(`Ошибка ICE (${event.errorCode}): ${event.errorText}`);
                     // Возможно, стоит перезапустить соединение при критической ошибке
                     // resetConnection();
                 }
            };

             // Новый основной обработчик состояния соединения (заменяет oniceconnectionstatechange)
            pc.current.onconnectionstatechange = () => {
                 if (!pc.current) return;
                 const state = pc.current.connectionState;
                 console.log(`Событие: onconnectionstatechange. Новое состояние: ${state}`);

                 switch (state) {
                     case 'connecting':
                         setIsPeerConnected(false);
                         console.log("PeerConnection: Подключение...");
                         break;
                     case 'connected':
                         setIsPeerConnected(true);
                         setError(null); // Сбрасываем ошибку при успешном подключении
                         retryAttempts.current = 0; // Сбрасываем счетчик попыток
                         setRetryCount(0);
                         console.log("PeerConnection: Успешно подключено!");
                         // Запускаем мониторинг статистики только после 'connected'
                         startConnectionMonitoring();
                         // Если есть таймер ожидания видео, запускаем его
                          if (!remoteStream?.getVideoTracks()[0]?.readyState || remoteStream?.getVideoTracks()[0]?.readyState === 'ended') {
                             startVideoCheckTimer();
                         }
                         break;
                     case 'disconnected':
                         setIsPeerConnected(false);
                         console.warn("PeerConnection: Отключено (disconnected). Попытка восстановления...");
                         setError("Соединение потеряно, попытка восстановления...");
                         // Браузер попытается восстановиться сам. Если не сможет, перейдет в 'failed'.
                         // Можно запустить таймер, и если за N секунд не вернется в 'connected', вызвать resetConnection.
                         // setTimeout(() => {
                         //    if (pc.current?.connectionState === 'disconnected') {
                         //        resetConnection();
                         //    }
                         // }, 5000);
                         break;
                     case 'failed':
                         setIsPeerConnected(false);
                         console.error("PeerConnection: Соединение не удалось (failed).");
                         setError("Не удалось установить медиа-соединение.");
                         // Очищаем интервал статистики при 'failed'
                         if (statsInterval.current) clearInterval(statsInterval.current);
                         statsInterval.current = null;
                         // Запускаем полный перезапуск соединения
                         resetConnection();
                         break;
                     case 'closed':
                         setIsPeerConnected(false);
                         setIsCallActive(false); // Убедимся, что звонок неактивен
                         console.log("PeerConnection: Соединение закрыто (closed).");
                         // Очищаем интервал статистики
                         if (statsInterval.current) clearInterval(statsInterval.current);
                         statsInterval.current = null;
                         // Не вызываем resetConnection здесь, т.к. 'closed' обычно результат cleanup() или leaveRoom()
                         break;
                     case 'new': // Начальное состояние
                         setIsPeerConnected(false);
                         break;
                     default:
                         console.log(`Неизвестное состояние connectionState: ${state}`);
                         break;
                 }
             };


            // === Добавление треков ===
             if (!localStream) {
                 console.warn("Локальный поток отсутствует при инициализации PeerConnection. Попытка получить.");
                 if (!await initializeMediaDevices()) {
                     throw new Error("Не удалось получить медиа устройства для инициализации PeerConnection");
                 }
             }
             if (localStream) {
                console.log("Добавление треков из локального потока в PeerConnection...");
                localStream.getTracks().forEach(track => {
                    try {
                        pc.current?.addTrack(track, localStream);
                        console.log(`Трек добавлен: kind=${track.kind}, id=${track.id}`);
                    } catch (e) {
                         console.error(`Ошибка добавления трека ${track.kind}:`, e);
                    }
                });
            } else {
                 console.error("Критическая ошибка: локальный поток отсутствует, невозможно добавить треки.");
                 // throw new Error("Локальный поток недоступен"); // Можно раскомментировать для прерывания
            }

            // === Обработка входящих треков ===
            pc.current.ontrack = (event: RTCTrackEvent) => {
                console.log(`Событие: ontrack. Получен трек: kind=${event.track.kind}, id=${event.track.id}`);
                // Мы ожидаем один удаленный поток
                if (event.streams && event.streams[0]) {
                     const incomingStream = event.streams[0];
                     console.log("Трек принадлежит потоку:", incomingStream.id);

                     // Очищаем таймер проверки видео, т.к. получили поток (даже если видео пока нет)
                     if (videoCheckTimeout.current) {
                        clearTimeout(videoCheckTimeout.current);
                        videoCheckTimeout.current = null;
                        console.log("Таймер проверки видео остановлен (получен ontrack).");
                    }

                    // Проверяем наличие видео трека в потоке
                     const videoTrack = incomingStream.getVideoTracks()[0];
                     if (videoTrack) {
                         console.log(`Видео трек найден: id=${videoTrack.id}, readyState=${videoTrack.readyState}, muted=${videoTrack.muted}`);
                         // Проверка на "живой" трек
                         videoTrack.onunmute = () => {
                             console.log("Удаленный видео трек стал активным (unmute).");
                             setRemoteStream(incomingStream); // Обновляем поток, если он изменился
                             setIsCallActive(true);
                         };
                         videoTrack.onmute = () => {
                             console.warn("Удаленный видео трек стал неактивным (mute).");
                             // Возможно, стоит запустить таймер проверки или resetConnection
                         };
                         videoTrack.onended = () => {
                            console.warn("Удаленный видео трек завершился (ended).");
                            setRemoteStream(prev => {
                                if (prev === incomingStream) return null; // Убираем только если это текущий поток
                                return prev;
                            });
                            setIsCallActive(false);
                            // Попытка перезапуска
                             resetConnection();
                         }

                         // Если трек уже активен (некоторые браузеры)
                          if (videoTrack.readyState === 'live' && !videoTrack.muted) {
                              console.log("Удаленный видео трек уже активен.");
                              setRemoteStream(incomingStream);
                              setIsCallActive(true);
                          } else {
                              // Если трек неактивен, все равно устанавливаем поток,
                              // но setIsCallActive(true) будет вызван в onunmute
                              setRemoteStream(incomingStream);
                              console.warn("Удаленный видео трек получен, но пока неактивен.");
                               // Запускаем таймер проверки, если видео не станет активным
                              startVideoCheckTimer();
                          }

                    } else {
                         console.warn("Входящий поток не содержит видео трека.");
                         // Если мы ожидаем видео, а его нет, возможно, проблема
                         // Устанавливаем поток только с аудио, если оно есть
                         if (incomingStream.getAudioTracks().length > 0) {
                             setRemoteStream(incomingStream);
                             console.log("Установлен удаленный поток только с аудио.");
                             // Если видео было обязательно, можно инициировать resetConnection
                         } else {
                             console.error("Входящий поток не содержит ни видео, ни аудио треков.");
                         }
                    }
                } else {
                    console.warn("Событие ontrack не содержит потоков (streams). Добавляем трек отдельно.");
                    // Иногда (редко) поток не приходит сразу с треком
                     const currentRemote = remoteStream || new MediaStream();
                     currentRemote.addTrack(event.track);
                     setRemoteStream(currentRemote);
                     if(event.track.kind === 'video'){
                        setIsCallActive(true);
                        startVideoCheckTimer(); // Проверяем и в этом случае
                     }
                }
            };

            // === Обработка ICE кандидатов ===
            pc.current.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
                if (event.candidate) {
                    // Отправляем кандидата на сервер сигнализации
                    if (ws.current?.readyState === WebSocket.OPEN) {
                         // Фильтруем пустые кандидаты и локальные адреса (если не нужны для LAN)
                        if (event.candidate.candidate && event.candidate.candidate.length > 0 /* && !event.candidate.candidate.includes('192.168') */) {
                            console.log(`Отправка ICE кандидата: тип ${event.candidate.type}, адрес ${event.candidate.address}`);
                            ws.current.send(JSON.stringify({
                                type: 'ice_candidate',
                                ice: event.candidate.toJSON(), // Используем toJSON() для правильного формата
                                room: roomId,
                                username
                            }));
                        }
                    } else {
                        console.warn("WebSocket закрыт, не удалось отправить ICE кандидата.");
                         // Можно накапливать кандидатов и отправить при переподключении WS,
                         // но обычно проще перезапустить все соединение.
                    }
                } else {
                    // Сбор кандидатов завершен (event.candidate === null)
                    console.log("Сбор ICE кандидатов завершен.");
                }
            };

            return true;

        } catch (err) {
            console.error('Критическая ошибка инициализации RTCPeerConnection:', err);
            setError(`Ошибка создания PeerConnection: ${err instanceof Error ? err.message : String(err)}`);
            cleanup(); // Полная очистка при ошибке
            return false;
        }
    }, [roomId, username, localStream, remoteStream, platform, initializeMediaDevices, cleanup, startVideoCheckTimer, resetConnection]); // Добавлены зависимости

    // Создание и отправка Offer
    const createAndSendOffer = useCallback(async (isRenegotiation = false) => {
        if (!pc.current || !ws.current || ws.current.readyState !== WebSocket.OPEN) {
             console.warn(`Невозможно создать offer: pc=${!!pc.current}, ws=${ws.current?.readyState}`);
            return;
        }
        if (isNegotiating.current) {
             console.warn("Попытка создать offer во время другого согласования.");
             return;
        }
        // Предотвращаем создание оффера, если мы не должны (например, если ждем оффер от другого)
        // Эта логика зависит от вашей сигнализации (кто инициатор)

        console.log(`Создание ${isRenegotiation ? 'renegotiation ' : ''}offer...`);
        isNegotiating.current = true;
        setError(null); // Сброс ошибки перед попыткой

        try {
            // Опции для createOffer
            const offerOptions: RTCOfferOptions = {
                offerToReceiveAudio: true,
                offerToReceiveVideo: true,
                // Используем iceRestart только для явного перезапуска ICE
                iceRestart: isRenegotiation // Перезапускаем ICE при ренегоджации, если нужно (например, при смене сети)
            };
             console.log("Опции offer:", offerOptions);

             // Убедимся, что локальный поток есть и треки добавлены
             if (!localStream || localStream.getTracks().length === 0) {
                 console.warn("Локальный поток отсутствует или пуст перед созданием offer. Попытка получить.");
                 if (!await initializeMediaDevices()) {
                     throw new Error("Не удалось получить локальный медиапоток для создания offer");
                 }
                 // Нужно дождаться добавления треков в pc, если initializeMediaDevices их добавил асинхронно
                 // или перезапустить initializePeerConnection, что безопаснее.
                 console.warn("Перезапуск PeerConnection после получения медиа перед offer...");
                 if (!await initializePeerConnection()) {
                     throw new Error("Не удалось переинициализировать PeerConnection перед offer");
                 }
                 if (!pc.current) throw new Error("PeerConnection отсутствует после переинициализации");
             }


            const offer = await pc.current.createOffer(offerOptions);
            const normalizedOffer = { ...offer, sdp: normalizeSdp(offer.sdp) };

             // Проверяем состояние перед установкой local description
            if (pc.current.signalingState !== 'stable' && !isRenegotiation) {
                console.warn(`Попытка установить local offer в состоянии ${pc.current.signalingState}. Ожидалось 'stable'.`);
                // Можно попробовать обработать это состояние или прервать
                // throw new Error(`Неожиданное состояние сигнализации: ${pc.current.signalingState}`);
            }

            console.log(`Установка local description (${normalizedOffer.type})...`);
            await pc.current.setLocalDescription(normalizedOffer);

            console.log("Отправка offer на сервер...");
            ws.current.send(JSON.stringify({
                type: "offer",
                sdp: normalizedOffer,
                room: roomId,
                username
            }));

            setIsCallActive(true); // Считаем звонок активным после отправки оффера
            console.log("Offer успешно создан и отправлен.");

        } catch (err) {
            console.error(`Ошибка создания или отправки ${isRenegotiation ? 'renegotiation ' : ''}offer:`, err);
            setError(`Ошибка создания предложения: ${err instanceof Error ? err.message : String(err)}`);
            // Попытка отката или перезапуска при ошибке
            resetConnection();
        } finally {
            isNegotiating.current = false;
        }
    }, [ws.current, pc.current, roomId, username, localStream, initializeMediaDevices, initializePeerConnection, resetConnection]); // Добавлены зависимости

    // Мониторинг качества соединения
    const startConnectionMonitoring = useCallback(() => {
        if (statsInterval.current) clearInterval(statsInterval.current);
         console.log(`Запуск мониторинга статистики каждые ${STATS_INTERVAL / 1000} сек.`);

        statsInterval.current = setInterval(async () => {
            if (!pc.current || pc.current.connectionState !== 'connected' || !isCallActive) {
                // console.log("Мониторинг: пропуск (соединение не активно)");
                // Очищаем интервал, если соединение больше не 'connected'
                 if (pc.current && pc.current.connectionState !== 'connected' && statsInterval.current) {
                     console.log("Мониторинг: остановка (соединение не 'connected').");
                     clearInterval(statsInterval.current);
                     statsInterval.current = null;
                     lastStats.current = null;
                 }
                return;
            }

            try {
                const reports: RTCStatsReport = await pc.current.getStats();
                let videoIssuesDetected = false;
                let currentVideoBytesReceived = 0;
                let lastVideoBytesReceived = 0;
                let currentPacketsLost = 0;
                let lastPacketsLost = 0;
                let currentJitter = 0;

                 // Находим предыдущую статистику для видео
                 if (lastStats.current) {
                    lastStats.current.forEach(report => {
                        if (report.type === 'inbound-rtp' && report.kind === 'video') {
                            lastVideoBytesReceived = report.bytesReceived || 0;
                            lastPacketsLost = report.packetsLost || 0;
                        }
                    });
                }

                reports.forEach(report => {
                    // --- Проверка входящего видеопотока ---
                    if (report.type === 'inbound-rtp' && report.kind === 'video') {
                        currentVideoBytesReceived = report.bytesReceived || 0;
                        currentPacketsLost = report.packetsLost || 0;
                        currentJitter = report.jitter || 0;

                         // 1. Проверка на отсутствие поступления данных
                        if (currentVideoBytesReceived === lastVideoBytesReceived && isCallActive) {
                            console.warn(`Мониторинг: Видеоданные не поступают (bytesReceived: ${currentVideoBytesReceived}).`);
                            videoIssuesDetected = true;
                        }

                         // 2. Проверка на значительное увеличение потерь пакетов
                         // (учитываем только увеличение, т.к. счетчик может сбрасываться)
                        const deltaPacketsLost = currentPacketsLost - lastPacketsLost;
                         // Порог потери пакетов (например, > 10 за интервал)
                        if (deltaPacketsLost > 10) {
                            console.warn(`Мониторинг: Значительное увеличение потерь видео пакетов (+${deltaPacketsLost}, всего: ${currentPacketsLost}).`);
                             // Можно сделать issue менее критичным, если связь нестабильна
                             // videoIssuesDetected = true;
                        }

                         // 3. Проверка на высокий джиттер (задержка между пакетами)
                         // Порог джиттера (например, > 0.1 секунды = 100 мс)
                        if (currentJitter > 0.1) {
                            console.warn(`Мониторинг: Высокий джиттер видео (${(currentJitter * 1000).toFixed(0)} мс).`);
                             // videoIssuesDetected = true; // Высокий джиттер может быть временным
                        }
                    }

                    // --- Проверка выбранного ICE кандидата ---
                    if (report.type === 'candidate-pair' && report.state === 'succeeded' && report.nominated) {
                         // console.log(`Активная пара ICE: ${report.localCandidateId} <-> ${report.remoteCandidateId}`);
                         // Можно проверить тип кандидатов (relay, srflx, host)
                         const localCandidate = reports.get(report.localCandidateId);
                         const remoteCandidate = reports.get(report.remoteCandidateId);
                         if (localCandidate?.candidateType === 'relay' || remoteCandidate?.candidateType === 'relay') {
                             // console.warn("Мониторинг: Используется TURN ретранслятор. Возможны задержки.");
                         }
                    }
                });

                // Обновляем последнюю статистику для следующей проверки
                lastStats.current = reports;

                // Если обнаружены серьезные проблемы с видео, перезапускаем соединение
                if (videoIssuesDetected) {
                    console.error("Мониторинг: Обнаружены проблемы с видеопотоком. Попытка перезапуска соединения...");
                     if (statsInterval.current) clearInterval(statsInterval.current); // Останавливаем мониторинг перед ресетом
                     statsInterval.current = null;
                    resetConnection();
                }

            } catch (err) {
                console.error('Мониторинг: Ошибка получения статистики:', err);
                 // Возможно, стоит остановить мониторинг при ошибке
                 // if (statsInterval.current) clearInterval(statsInterval.current);
                 // statsInterval.current = null;
            }
        }, STATS_INTERVAL); // Интервал проверки
    }, [isCallActive, resetConnection]); // Добавлены зависимости

    // Функция перезапуска соединения (с экспоненциальной задержкой)
    const resetConnection = useCallback(async () => {
        if (isNegotiating.current) {
            console.warn("Попытка сброса соединения во время согласования. Отмена.");
            return;
        }
        if (retryAttempts.current >= MAX_RETRIES) {
            console.error(`Превышено максимальное количество попыток (${MAX_RETRIES}) восстановления соединения.`);
            setError('Не удалось восстановить соединение после нескольких попыток.');
            leaveRoom(); // Выходим из комнаты окончательно
            return;
        }

        retryAttempts.current += 1;
        setRetryCount(retryAttempts.current);
        const delay = RETRY_DELAY_BASE * Math.pow(2, retryAttempts.current - 1); // Экспоненциальная задержка
        console.warn(`--- Перезапуск соединения (Попытка ${retryAttempts.current}/${MAX_RETRIES}). Задержка ${delay} мс ---`);
        setError(`Проблемы с соединением, попытка восстановления #${retryAttempts.current}...`);

        // 1. Останавливаем текущие процессы и очищаем ресурсы
        cleanup(); // Полная очистка WebRTC и таймеров
         if (ws.current?.readyState === WebSocket.OPEN || ws.current?.readyState === WebSocket.CONNECTING) {
             console.log("Закрытие существующего WebSocket соединения перед ресетом...");
             ws.current.close(1001, "Resetting connection");
             ws.current = null;
         }
         // Сброс состояний
         setIsConnected(false);
         setIsInRoom(false);
         setIsPeerConnected(false);
         setIsCallActive(false);
         setUsers([]); // Очищаем список пользователей


        // 2. Пауза перед повторной попыткой
        await new Promise(resolve => setTimeout(resolve, delay));

        // 3. Попытка войти в комнату заново
        console.log("Попытка повторного входа в комнату после задержки...");
        // Используем try-catch, т.к. joinRoom сам обрабатывает ошибки, но мы хотим знать результат здесь
        try {
            await joinRoom(username); // joinRoom сам установит нужные состояния или ошибку
            console.log("Функция joinRoom завершила выполнение после перезапуска.");
             // Если joinRoom успешен, он сбросит retryAttempts внутри себя при 'connected'
             // Но если он завершился без 'connected', нужно проверить состояние
        } catch (err) {
             console.error('Ошибка во время выполнения joinRoom при перезапуске соединения:', err);
             // Ошибка уже должна быть установлена в joinRoom
             // Если joinRoom не смог подключиться, retryAttempts не сбросится, и следующая попытка будет с большей задержкой
        }
    }, [MAX_RETRIES, RETRY_DELAY_BASE, username, cleanup, leaveRoom, joinRoom]); // Добавлены зависимости

    // Перезагрузка медиа устройств (например, при смене камеры/микрофона)
    // Возвращает true при успехе, false при ошибке
    const restartMediaDevices = useCallback(async (): Promise<boolean> => {
        console.log("Перезапуск медиа устройств...");
        setError(null);

        // 1. Получаем новый медиапоток
        const success = await initializeMediaDevices();
        if (!success || !localStream || !pc.current) {
            console.error("Не удалось получить новый медиапоток или PeerConnection отсутствует.");
            setError(error || "Не удалось перезагрузить медиаустройства."); // Сохраняем предыдущую ошибку, если была
            return false;
        }

        // 2. Заменяем треки в существующем PeerConnection
        console.log("Замена треков в RTCPeerConnection...");
        const senders = pc.current.getSenders();
        const newTracks = localStream.getTracks();
        let tracksReplaced = false;

        for (const track of newTracks) {
            const sender = senders.find(s => s.track?.kind === track.kind);
            if (sender) {
                try {
                    console.log(`Замена трека ${track.kind} (id: ${track.id})`);
                    await sender.replaceTrack(track);
                    tracksReplaced = true;
                } catch (err) {
                    console.error(`Ошибка замены трека ${track.kind}:`, err);
                    setError(`Ошибка замены ${track.kind} трека.`);
                    // Если замена не удалась, возможно, нужно полное пересогласование
                     resetConnection(); // Перезапускаем все соединение
                    return false;
                }
            } else {
                 console.warn(`Не найден sender для трека ${track.kind}. Возможно, трек не был добавлен изначально.`);
                 // Попытка добавить трек, если сендера нет (менее стандартный сценарий)
                 try {
                    console.log(`Добавление нового трека ${track.kind} (id: ${track.id})`);
                    pc.current.addTrack(track, localStream);
                    tracksReplaced = true; // Считаем успехом, но может потребоваться renegotiation
                 } catch (err) {
                     console.error(`Ошибка добавления трека ${track.kind}:`, err);
                      setError(`Ошибка добавления ${track.kind} трека.`);
                      resetConnection();
                     return false;
                 }
            }
        }

        // Если треки были заменены или добавлены, может потребоваться renegotiation
        // Но часто браузеры обрабатывают replaceTrack без необходимости нового offer/answer
        if (tracksReplaced) {
             console.log("Медиаустройства успешно перезагружены и треки обновлены.");
             // Явное пересогласование обычно не нужно после replaceTrack,
             // но если возникают проблемы, можно раскомментировать:
             // console.log("Запуск renegotiation после замены треков...");
             // await createAndSendOffer(true); // true = renegotiation
             return true;
        } else {
            console.warn("Треки не были заменены (возможно, не было сендеров).");
            return false; // Возвращаем false, если ничего не изменилось
        }

    }, [initializeMediaDevices, localStream, pc, error, resetConnection]); // createAndSendOffer убран из зависимостей

    // Основная функция для входа в комнату
    const joinRoom = useCallback(async (uniqueUsername: string) => {
        console.log(`--- Попытка входа в комнату ${roomId} пользователем ${uniqueUsername} ---`);
        // Предотвращаем двойной вход
        if (isInRoom || (ws.current && ws.current.readyState === WebSocket.OPEN)) {
            console.warn("Попытка войти в комнату, когда уже в ней или WebSocket активен.");
            // return; // Раскомментировать, если нужно строго запретить
        }

        setError(null);
        setIsInRoom(false);
        setIsConnected(false);
        setIsPeerConnected(false);
        setIsCallActive(false);
        setUsers([]); // Очищаем пользователей перед входом
        retryAttempts.current = 0; // Сбрасываем счетчик при новом входе
        setRetryCount(0);

        try {
            // --- Шаг 1: Подключение WebSocket ---
            console.log("Шаг 1: Подключение WebSocket...");
            if (!(await connectWebSocket()) || !ws.current) {
                throw new Error('Не удалось подключиться к WebSocket');
            }
             // Устанавливаем обработчики только после успешного connectWebSocket
             setupWebSocketListeners();
             console.log("WebSocket подключен и слушатели настроены.");


            // --- Шаг 2: Инициализация медиа и WebRTC ---
            // Сначала медиа, потом PeerConnection
            console.log("Шаг 2а: Инициализация медиаустройств...");
             if (!localStream) { // Инициализируем медиа, только если их нет
                 if (!(await initializeMediaDevices())) {
                     // Ошибка уже установлена в initializeMediaDevices
                     throw new Error('Не удалось инициализировать медиаустройства');
                 }
             } else {
                  console.log("Медиаустройства уже инициализированы.");
             }

            console.log("Шаг 2б: Инициализация PeerConnection...");
            if (!await initializePeerConnection()) {
                 // Ошибка уже установлена в initializePeerConnection
                throw new Error('Не удалось инициализировать RTCPeerConnection');
            }
             console.log("WebRTC инициализирован.");


            // --- Шаг 3: Присоединение к комнате через WebSocket ---
            console.log("Шаг 3: Отправка запроса 'join' на сервер...");
            await new Promise<void>((resolve, reject) => {
                if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
                    reject(new Error('WebSocket не подключен для отправки join'));
                    return;
                }

                 let joinResolved = false;
                 const onMessage = (event: MessageEvent) => {
                     try {
                         const data = JSON.parse(event.data);
                         // Ждем 'room_info' как подтверждение успешного входа
                         if (data.type === 'room_info') {
                            if (joinResolved) return;
                            joinResolved = true;
                             cleanupTimeoutAndListener();
                             console.log("Получено 'room_info', вход в комнату успешен.");
                             setUsers(data.data?.users || []); // Обновляем пользователей сразу
                             setIsInRoom(true); // Устанавливаем флаг входа в комнату
                             resolve();
                         } else if (data.type === 'error') {
                            if (joinResolved) return;
                            joinResolved = true;
                             cleanupTimeoutAndListener();
                             console.error("Получена ошибка при входе в комнату:", data.data);
                             reject(new Error(data.data || 'Ошибка входа в комнату от сервера'));
                         }
                     } catch (err) {
                         if (joinResolved) return;
                         joinResolved = true;
                         cleanupTimeoutAndListener();
                         console.error("Ошибка парсинга сообщения при ожидании room_info:", err);
                         reject(err);
                     }
                 };

                 const onError = () => {
                     if (joinResolved) return;
                     joinResolved = true;
                     cleanupTimeoutAndListener();
                     reject(new Error('Ошибка WebSocket во время ожидания входа в комнату'));
                 };

                 const onClose = () => {
                     if (joinResolved) return;
                     joinResolved = true;
                     cleanupTimeoutAndListener();
                     reject(new Error('WebSocket закрылся во время ожидания входа в комнату'));
                 };

                 // Таймаут ожидания ответа 'room_info'
                 const joinTimeout = setTimeout(() => {
                     if (joinResolved) return;
                     joinResolved = true;
                     cleanupTimeoutAndListener();
                     console.error("Таймаут ожидания 'room_info' от сервера.");
                     reject(new Error('Таймаут входа в комнату'));
                 }, 15000); // 15 секунд на вход

                const cleanupTimeoutAndListener = () => {
                    clearTimeout(joinTimeout);
                    ws.current?.removeEventListener('message', onMessage);
                     ws.current?.removeEventListener('error', onError);
                     ws.current?.removeEventListener('close', onClose);
                };

                // Добавляем временные слушатели
                ws.current.addEventListener('message', onMessage);
                 ws.current.addEventListener('error', onError);
                 ws.current.addEventListener('close', onClose);

                 // Отправляем сообщение join
                 ws.current.send(JSON.stringify({
                     type: "join", // Используем type вместо action для консистентности
                     room: roomId,
                     username: uniqueUsername,
                     isLeader: false // Браузер всегда ведомый в этой логике
                 }));
                 console.log("Сообщение 'join' отправлено.");
            });

            // --- Шаг 4: Успешное подключение ---
            console.log(`--- Успешный вход в комнату ${roomId} ---`);
            // setIsInRoom(true); // Устанавливается в Promise выше
            setError(null); // Сбрасываем ошибки после успешного входа
            retryAttempts.current = 0; // Сбрасываем счетчик попыток
            setRetryCount(0);

            // --- Шаг 5: Создание Offer (если необходимо) ---
            // Решение о создании Offer зависит от логики сигнализации.
            // Пример: создать Offer, если мы первые в комнате (или единственные).
            // Данные о пользователях (users) могли обновиться в 'room_info'
             const currentUsers = users; // Используем состояние users, обновленное в промисе
            if (currentUsers.length <= 1) { // Если в комнате только мы (или она была пуста)
                 console.log("Мы первые в комнате или единственные. Создаем offer...");
                 await createAndSendOffer();
             } else {
                 console.log("В комнате уже есть другие участники. Ожидаем offer...");
                 // Ничего не делаем, ждем offer от другого участника (лидера)
             }

            // --- Шаг 6: Запуск таймера проверки видео (даже если ждем offer) ---
             // Если offer придет, этот таймер перезапустится после установки answer
             // Если мы создали offer, он тоже запустится после установки local desc
             // Этот запуск - подстраховка на случай, если что-то пойдет не так.
             // startVideoCheckTimer(); // Запускается в ontrack или после setRemoteDescription(answer)


        } catch (err) {
            console.error('Критическая ошибка при входе в комнату:', err);
            setError(`Ошибка входа в комнату: ${err instanceof Error ? err.message : String(err)}`);

            // --- Полная очистка при ошибке входа ---
            cleanup();
            if (ws.current) {
                 console.log("Закрытие WebSocket после ошибки входа.");
                ws.current.close(1011, "Join room failed"); // 1011 - Internal Error
                ws.current = null;
            }
             // Сброс состояний
             setIsConnected(false);
             setIsInRoom(false);
             setIsPeerConnected(false);
             setIsCallActive(false);
             setUsers([]);


            // --- Автоматическая повторная попытка (если не достигнут лимит) ---
            // НЕ ДЕЛАЕМ АВТОМАТИЧЕСКУЮ ПОПЫТКУ ЗДЕСЬ.
            // Автоповтор должен запускаться только через resetConnection при проблемах УЖЕ УСТАНОВЛЕННОГО соединения.
            // Ошибка при первом входе должна отображаться пользователю.
            // Если нужно автоповторение именно при первом входе, раскомментируйте блок ниже:
            /*
            if (retryAttempts.current < MAX_RETRIES) {
                retryAttempts.current += 1;
                setRetryCount(retryAttempts.current);
                const delay = RETRY_DELAY_BASE * Math.pow(2, retryAttempts.current - 1);
                console.log(`Автоматическая повторная попытка входа через ${delay} мс (Попытка ${retryAttempts.current})...`);
                setTimeout(() => {
                    joinRoom(uniqueUsername).catch(console.error); // Рекурсивный вызов
                }, delay);
            } else {
                 console.error("Достигнут лимит попыток входа в комнату.");
                 setError(error + " Достигнут лимит попыток входа."); // Дополняем ошибку
            }
            */
             // Бросаем ошибку дальше, чтобы компонент мог ее обработать
             throw err;
        }
    }, [
        roomId, ws, isConnected, isInRoom, connectWebSocket, setupWebSocketListeners,
        initializeMediaDevices, initializePeerConnection, users, createAndSendOffer,
        cleanup, setError, setUsers, setIsConnected, setIsInRoom, setRetryCount, localStream // Добавлены зависимости
    ]);


    // Эффект для очистки при размонтировании компонента
    useEffect(() => {
        // Возвращаем функцию очистки, которая будет вызвана при размонтировании
        return () => {
            console.log("Компонент размонтируется. Вызов leaveRoom для очистки...");
            leaveRoom();
        };
    }, [leaveRoom]); // Зависимость от leaveRoom (которая сама зависит от roomId, username, cleanup)

    // Возвращаем состояние и функции управления
    return {
        localStream,
        remoteStream,
        users,
        joinRoom,
        leaveRoom,
        isCallActive, // Активен ли звонок (обмен медиа)
        isConnected, // Подключен ли WebSocket
        isInRoom,    // Успешно ли вошли в комнату на сервере
        isPeerConnected, // Установлено ли медиа-соединение WebRTC ('connected')
        error,
        retryCount,
        resetConnection,
        restartMediaDevices,
        ws: ws.current, // Возвращаем текущий инстанс WebSocket (если нужен снаружи)
        platform, // Возвращаем определенную платформу
    };
};



Описание улучшений и изменений:
Определение Платформы:

Добавлено состояние platform ('desktop' | 'android' | 'ios' | 'unknown'), которое определяется при монтировании компонента с помощью navigator.userAgent.
Это позволяет применять специфичные настройки для разных типов устройств.
Адаптивные Медиа-Констрейнты (initializeMediaDevices):

Функция initializeMediaDevices теперь использует определенную platform для установки разных videoConstraints.
Для мобильных устройств (android, ios):
Запрашивается меньшее ideal разрешение (640x480) и max (1280x720).
Запрашивается меньшая ideal частота кадров (15 fps) и max (24 fps). Это ключевое изменение для снижения нагрузки на мобильные устройства и сеть.
По умолчанию запрашивается facingMode: "user" (фронтальная камера).
Для десктопов:
Сохранены или увеличены ideal разрешение (1280x720) и частота кадров (30 fps).
Аудио: Включены echoCancellation, noiseSuppression, autoGainControl для лучшего качества звука на всех платформах.
Добавлена проверка на успешное получение видео/аудио треков после getUserMedia.
Улучшенная Обработка Состояний Соединения (initializePeerConnection):

Используется pc.current.onconnectionstatechange вместо устаревшего oniceconnectionstatechange. Этот обработчик предоставляет более детальные состояния (new, connecting, connected, disconnected, failed, closed).
Добавлено состояние isPeerConnected, которое становится true только когда connectionState равен 'connected'.
При connected сбрасываются счетчики ошибок и запускается мониторинг статистики.
При disconnected выводится предупреждение; браузер попытается восстановиться сам. Если перейдет в failed, вызывается resetConnection.
При failed вызывается resetConnection для полного перезапуска.
При closed останавливается мониторинг и сбрасываются флаги.
Улучшенная Обработка Входящих Треков (ontrack):

Добавлены обработчики onmute, onunmute, onended для удаленного видео трека. Это позволяет реагировать на временное пропадание/появление видео или его полное завершение.
setRemoteStream вызывается сразу при получении потока, но setIsCallActive(true) вызывается только когда видео трек становится live и unmuted (или в onunmute).
Таймер startVideoCheckTimer теперь запускается более обдуманно: при установке remoteDescription(answer), при получении ontrack с неактивным видео, или если видео стало muted. Он также останавливается при получении ontrack или когда видео становится unmuted.
Увеличено время VIDEO_CHECK_TIMEOUT до 5 секунд, чтобы дать больше времени на установку соединения на медленных сетях.
Более Надежный Перезапуск Соединения (resetConnection):

Используется экспоненциальная задержка (RETRY_DELAY_BASE * Math.pow(2, retryAttempts.current - 1)) между попытками, чтобы не перегружать сервер и дать сети время на восстановление.
Уменьшено MAX_RETRIES до 5 для более быстрой реакции на неустранимые проблемы.
Перед перезапуском выполняется полная очистка (cleanup()) и закрытие WebSocket, если он был активен.
После задержки вызывается joinRoom, который выполняет всю логику подключения заново.
Мониторинг Статистики Соединения (startConnectionMonitoring):

Интервал проверки (STATS_INTERVAL) уменьшен до 3 секунд для более быстрой реакции.
Сохраняется предыдущая статистика (lastStats.current) для сравнения.
Проверяются:
Отсутствие поступления видео данных: currentVideoBytesReceived === lastVideoBytesReceived. Если данные не приходят при активном звонке, это явный признак проблемы.
Значительное увеличение потерь пакетов: deltaPacketsLost > порог.
Высокий джиттер: currentJitter > порог.
Если обнаруживаются серьезные проблемы (в данном коде - отсутствие поступления данных), вызывается resetConnection. Предупреждения о потерях и джиттере выводятся, но не вызывают ресет немедленно (можно настроить).
Мониторинг запускается только при connectionState === 'connected' и останавливается при failed или closed.
Улучшения в joinRoom:

Более четкое разделение на шаги (WS -> Media -> WebRTC -> Join -> Offer).
Проверка на существующее подключение в начале.
initializeMediaDevices и initializePeerConnection вызываются последовательно.
Используется Promise с таймаутом для ожидания ответа room_info после отправки join, с корректной очисткой слушателей.
Решение о создании offer принимается после успешного join на основе полученной информации о пользователях.
Убрано автоматическое повторение joinRoom при первой ошибке входа. Автоповтор теперь логично делать через resetConnection при последующих сбоях уже установленного соединения.
Улучшения в createAndSendOffer и Обработке offer/answer:

Добавлена проверка isNegotiating и состояния сигнализации перед созданием/обработкой SDP для предотвращения гонок состояний.
Добавлена проверка наличия localStream перед createOffer и createAnswer с попыткой его получения при необходимости.
Обработка offer: ожидается stable состояние.
Обработка answer: ожидается have-local-offer состояние.
Более детальное логирование ошибок и состояний.
Нормализация SDP применяется и к answer.
processPendingIceCandidates вызывается после установки remoteDescription.
Очистка Ресурсов (cleanup, leaveRoom):

cleanup сделан более надежным: удаляет все обработчики перед close(), останавливает трансиверы, сбрасывает больше состояний.
leaveRoom теперь явно закрывает WebSocket с кодом 1000 (нормальное закрытие) после отправки сообщения leave и вызывает cleanup.
Функции cleanup, leaveRoom, resetConnection и т.д. обернуты в useCallback с правильными зависимостями для предотвращения лишних пересозданий.