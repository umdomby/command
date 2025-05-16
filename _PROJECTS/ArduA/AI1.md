браузер-ведомый
\\wsl.localhost\Ubuntu-24.04\home\pi\projects\docker\docker-ardua\components\webrtc\hooks\useWebRTC.ts
\\wsl.localhost\Ubuntu-24.04\home\pi\projects\docker\docker-ardua\components\webrtc\VideoCallApp.tsx

// file: docker-ardua/components/webrtc/hooks/useWebRTC.ts
// file: docker-ardua/components/webrtc/hooks/useWebRTC.ts
import { useEffect, useRef, useState } from 'react';
import {RoomInfo} from "@/components/webrtc/types";

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
isLeader?: boolean;
force_disconnect?: boolean;
}

interface RoomInfoMessage extends WebSocketMessage {
type: 'room_info';
data: RoomInfo;
}

interface CustomRTCRtpCodecParameters extends RTCRtpCodecParameters {
parameters?: {
'level-asymmetry-allowed'?: number;
'packetization-mode'?: number;
'profile-level-id'?: string;
[key: string]: any;
};
}

export const useWebRTC = (
deviceIds: { video: string; audio: string },
username: string,
roomId: string,
preferredCodec: 'VP8' | 'H264' // Новый параметр
) => {
const [localStream, setLocalStream] = useState<MediaStream | null>(null);
const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
const [users, setUsers] = useState<string[]>([]);
const [isCallActive, setIsCallActive] = useState(false);
const [isConnected, setIsConnected] = useState(false);
const [isInRoom, setIsInRoom] = useState(false);
const [error, setError] = useState<string | null>(null);
const [retryCount, setRetryCount] = useState(0);
const [isLeader, setIsLeader] = useState(false);
const ws = useRef<WebSocket | null>(null);
const pc = useRef<RTCPeerConnection | null>(null);
const pendingIceCandidates = useRef<RTCIceCandidate[]>([]);
const isNegotiating = useRef(false);
const shouldCreateOffer = useRef(false);
const connectionTimeout = useRef<NodeJS.Timeout | null>(null);
const statsInterval = useRef<NodeJS.Timeout | null>(null);
const videoCheckTimeout = useRef<NodeJS.Timeout | null>(null);
const retryAttempts = useRef(0);

    // Добавляем функцию для определения платформы
    const detectPlatform = () => {
        const ua = navigator.userAgent;
        const isIOS = /iPad|iPhone|iPod/.test(ua);
        const isSafari = /^((?!chrome|android).)*safari/i.test(ua) || isIOS;
        return {
            isIOS,
            isSafari,
            isChrome: /chrome/i.test(ua),
            isHuawei: /huawei/i.test(ua),
            isAndroid: /Android/i.test(ua),
            isMobile: isIOS || /Android/i.test(ua)
        };
    };

    // Максимальное количество попыток переподключения
    const MAX_RETRIES = 10;
    const VIDEO_CHECK_TIMEOUT = 7000; // 4 секунд для проверки видео



    // 1. Улучшенная функция для получения параметров видео для Huawei
    const getVideoConstraints = () => {
        const { isHuawei, isSafari, isIOS, isMobile } = detectPlatform();
        // Специальные параметры для Huawei
        if (isHuawei) {
            return {
                width: { ideal: 480, max: 640 },
                height: { ideal: 360, max: 480 },
                frameRate: { ideal: 20, max: 24 },
                // Huawei лучше работает с этими параметрами
                facingMode: 'environment',
                resizeMode: 'crop-and-scale'
            };
        }

        // Базовые параметры для всех устройств
        const baseConstraints = {
            width: { ideal: isMobile ? 640 : 1280 },
            height: { ideal: isMobile ? 480 : 720 },
            frameRate: { ideal: isMobile ? 24 : 30 }
        };

        // Специфичные настройки для Huawei
        if (isHuawei) {
            return {
                ...baseConstraints,
                width: { ideal: 480 },
                height: { ideal: 360 },
                frameRate: { ideal: 24 },
                advanced: [{ width: { max: 480 } }]
            };
        }
        if (isIOS) {
            return {
                ...baseConstraints,
                facingMode: 'user', // Фронтальная камера по умолчанию
                deviceId: deviceIds.video ? { exact: deviceIds.video } : undefined,
                advanced: [
                    { facingMode: 'user' }, // Приоритет фронтальной камеры
                    { width: { max: 640 } },
                    { height: { max: 480 } },
                    { frameRate: { max: 24 } }
                ]
            };
        }

        // Специфичные настройки для Safari
        if (isSafari || isIOS) {
            return {
                ...baseConstraints,
                frameRate: { ideal: 24 }, // Чуть меньше FPS для стабильности
                advanced: [
                    { frameRate: { max: 24 } },
                    { width: { max: 640 }, height: { max: 480 } }
                ]
            };
        }

        return baseConstraints;
    };

// 2. Конфигурация видео-трансмиттера для Huawei
const configureVideoSender = (sender: RTCRtpSender) => {
const { isHuawei } = detectPlatform();

        if (isHuawei && sender.track?.kind === 'video') {
            const parameters = sender.getParameters();

            if (!parameters.encodings) {
                parameters.encodings = [{}];
            }

            // Используем только стандартные параметры
            parameters.encodings[0] = {
                ...parameters.encodings[0],
                maxBitrate: 300000,    // 300 kbps
                scaleResolutionDownBy: 1,
                maxFramerate: 15,
                priority: 'high',
                networkPriority: 'high'
            };

            try {
                sender.setParameters(parameters);
            } catch (err) {
                console.error('Ошибка настройки параметров видео:', err);
            }
        }
    };



    // 4. Мониторинг производительности для Huawei
    const startHuaweiPerformanceMonitor = () => {
        const { isHuawei } = detectPlatform();
        if (!isHuawei) return () => {};


        const monitorInterval = setInterval(async () => {
            if (!pc.current || !isCallActive) return;

            try {
                const stats = await pc.current.getStats();
                let videoStats: any = null;
                let connectionStats: any = null;

                stats.forEach(report => {
                    if (report.type === 'outbound-rtp' && report.kind === 'video') {
                        videoStats = report;
                    }
                    if (report.type === 'candidate-pair' && report.selected) {
                        connectionStats = report;
                    }
                });

                if (videoStats && connectionStats) {
                    // Адаптация при высокой потере пакетов или задержке
                    if (videoStats.packetsLost > 5 ||
                        (connectionStats.currentRoundTripTime && connectionStats.currentRoundTripTime > 0.5)) {
                        console.log('Высокие потери или задержка, уменьшаем качество');
                        adjustVideoQuality('lower');
                    }
                }
            } catch (err) {
                console.error('Ошибка мониторинга:', err);
            }
        }, 3000); // Более частый мониторинг для Huawei

        return () => clearInterval(monitorInterval);
    };

// 5. Функция адаптации качества видео
const adjustVideoQuality = (direction: 'higher' | 'lower') => {
const { isMobile } = detectPlatform();
const senders = pc.current?.getSenders() || [];

        senders.forEach(sender => {
            if (sender.track?.kind === 'video') {
                const parameters = sender.getParameters();

                if (!parameters.encodings || parameters.encodings.length === 0) {
                    parameters.encodings = [{}];
                }

                // Базовые параметры для всех устройств
                const baseEncoding: RTCRtpEncodingParameters = {
                    ...parameters.encodings[0],
                    active: true,
                };

                // Для мобильных сетей используем более низкие битрейты
                if (isMobile) {
                    parameters.encodings[0] = {
                        ...baseEncoding,
                        maxBitrate: direction === 'higher' ? 300000 : 150000,
                        scaleResolutionDownBy: direction === 'higher' ? 1.0 : 1.5,
                        maxFramerate: direction === 'higher' ? 15 : 10,
                        priority: 'high',
                        networkPriority: 'high'
                    };
                } else {
                    // Для WiFi оставляем текущие настройки
                    parameters.encodings[0] = {
                        ...baseEncoding,
                        maxBitrate: direction === 'higher' ? 300000 : 150000,
                        scaleResolutionDownBy: direction === 'higher' ? 1.0 : 1.5,
                        maxFramerate: direction === 'higher' ? 15 : 10,
                        priority: 'high',
                        networkPriority: 'high'
                    };
                }

                try {
                    sender.setParameters(parameters);
                } catch (err) {
                    console.error('Ошибка изменения параметров:', err);
                }
            }
        });
    };

    const normalizeSdpForIOS = (sdp: string): string => {
        return sdp
            // Удаляем лишние RTX кодеки
            .replace(/a=rtpmap:\d+ rtx\/\d+\r\n/g, '')
            .replace(/a=fmtp:\d+ apt=\d+\r\n/g, '')
            // Упрощаем параметры
            .replace(/a=extmap:\d+ .*\r\n/g, '')
            // Форсируем низкую задержку
            .replace(/a=mid:video\r\n/g, 'a=mid:video\r\na=x-google-flag:conference\r\n')
            // Упрощаем SDP для лучшей совместимости с iOS
            .replace(/a=setup:actpass\r\n/g, 'a=setup:active\r\n')
            // Удаляем ICE options, которые могут мешать
            .replace(/a=ice-options:trickle\r\n/g, '')
            // Устанавливаем низкий битрейт для iOS
            .replace(/a=mid:video\r\n/g, 'a=mid:video\r\nb=AS:300\r\n')
            // Форсируем H.264
            .replace(/a=rtpmap:\d+ H264\/\d+/g, 'a=rtpmap:$& profile-level-id=42e01f;packetization-mode=1')
            // Удаляем несовместимые параметры
            .replace(/a=rtcp-fb:\d+ goog-remb\r\n/g, '')
            .replace(/a=rtcp-fb:\d+ transport-cc\r\n/g, '');

    };


    // 3. Специальная нормализация SDP для Huawei
    const normalizeSdpForHuawei = (sdp: string): string => {
        const { isHuawei } = detectPlatform();

        if (!isHuawei) return sdp;

        return sdp
            // Приоритет H.264 baseline profile
            .replace(/a=rtpmap:(\d+) H264\/\d+/g,
                'a=rtpmap:$1 H264/90000\r\n' +
                'a=fmtp:$1 profile-level-id=42e01f;packetization-mode=1;level-asymmetry-allowed=1\r\n')
            // Уменьшаем размер GOP
            .replace(/a=fmtp:\d+/, '$&;sprop-parameter-sets=J0LgC5Q9QEQ=,KM4=;')
            // Оптимизации буферизации и битрейта
            .replace(/a=mid:video\r\n/g,
                'a=mid:video\r\n' +
                'b=AS:250\r\n' +  // Уменьшенный битрейт для Huawei
                'b=TIAS:250000\r\n' +
                'a=rtcp-fb:* ccm fir\r\n' +
                'a=rtcp-fb:* nack\r\n' +
                'a=rtcp-fb:* nack pli\r\n');

    };

    const normalizeSdp = (sdp: string | undefined): string => {
        if (!sdp) return '';

        const { isHuawei, isSafari, isIOS } = detectPlatform();

        let optimized = sdp;

        optimized = optimized.replace(/a=rtpmap:(\d+) rtx\/\d+\r\n/gm, (match, pt) => {
            // Проверяем, есть ли соответствующий H264 кодек
            if (optimized.includes(`a=fmtp:${pt} apt=`)) {
                return match; // Оставляем RTX для H264
            }
            return ''; // Удаляем RTX для других кодеков
        });

        // 2. Форсируем H.264 параметры
        // optimized = optimized.replace(
        //     /a=rtpmap:(\d+) H264\/\d+\r\n/g,
        //     'a=rtpmap:$1 H264/90000\r\na=fmtp:$1 profile-level-id=42e01f;level-asymmetry-allowed=1;packetization-mode=1\r\n'
        // );

        // Оптимизации только для Huawei
        if (isHuawei) {
            optimized = normalizeSdpForHuawei(optimized);
        }

        // Специальные оптимизации для iOS/Safari
        if (isIOS || isSafari) {
            optimized = normalizeSdpForIOS(optimized);
        }


        // Общие оптимизации для всех устройств
        optimized = optimized
            .replace(/a=mid:video\r\n/g, 'a=mid:video\r\nb=AS:150\r\nb=TIAS:500000\r\n')
            .replace(/a=rtpmap:(\d+) H264\/\d+/g, 'a=rtpmap:$1 H264/90000\r\na=fmtp:$1 profile-level-id=42e01f;level-asymmetry-allowed=1;packetization-mode=1')
            .replace(/a=rtpmap:\d+ rtx\/\d+\r\n/g, '')
            .replace(/a=fmtp:\d+ apt=\d+\r\n/g, '')
            .replace(/(a=fmtp:\d+ .*profile-level-id=.*\r\n)/g, 'a=fmtp:126 profile-level-id=42e01f\r\n')
            .replace(/a=rtcp-fb:\d+ goog-remb\r\n/g, '') // Отключаем REMB
            .replace(/a=rtcp-fb:\d+ transport-cc\r\n/g, '') // Отключаем transport-cc
            .replace(/^(m=video.*?)((?:\s+\d+)+)/gm, (match, prefix, payloads) => {
                // Оставляем только payload types, которые есть в оставшемся SDP
                const allowedPayloads = Array.from(new Set(sdp.match(/a=rtpmap:(\d+)/g) || []))
                    .map(m => m.replace('a=rtpmap:', ''));
                const filtered = payloads.split(' ').filter((pt: string) => allowedPayloads.includes(pt));
                return prefix + ' ' + filtered.join(' ');
            })
            .replace(/a=fmtp:\d+ .*\r\n/g, '');


        return optimized;
    };

    let cleanup = () => {
        console.log('Выполняется полная очистка ресурсов');

        // Очистка таймеров
        [connectionTimeout, statsInterval, videoCheckTimeout].forEach(timer => {
            if (timer.current) {
                clearTimeout(timer.current);
                timer.current = null;
            }
        });

        // Полная очистка PeerConnection
        if (pc.current) {
            console.log('Закрытие PeerConnection');
            // Отключаем все обработчики событий
            pc.current.onicecandidate = null;
            pc.current.ontrack = null;
            pc.current.onnegotiationneeded = null;
            pc.current.oniceconnectionstatechange = null;
            pc.current.onicegatheringstatechange = null;
            pc.current.onsignalingstatechange = null;
            pc.current.onconnectionstatechange = null;

            // Закрываем все трансцепторы
            pc.current.getTransceivers().forEach(transceiver => {
                try {
                    transceiver.stop();
                } catch (err) {
                    console.warn('Ошибка при остановке трансцептора:', err);
                }
            });

            // Закрываем соединение
            try {
                pc.current.close();
            } catch (err) {
                console.warn('Ошибка при закрытии PeerConnection:', err);
            }
            pc.current = null;
        }

        // Остановка и очистка медиапотоков
        [localStream, remoteStream].forEach(stream => {
            if (stream) {
                console.log(`Остановка ${stream === localStream ? 'локального' : 'удаленного'} потока`);
                stream.getTracks().forEach(track => {
                    try {
                        track.stop();
                        track.dispatchEvent(new Event('ended'));
                    } catch (err) {
                        console.warn('Ошибка при остановке трека:', err);
                    }
                });
            }
        });

        // Сброс состояний
        setLocalStream(null);
        setRemoteStream(null);
        pendingIceCandidates.current = [];
        isNegotiating.current = false;
        shouldCreateOffer.current = false;
        setIsCallActive(false);
        setIsInRoom(false); // Сбрасываем isInRoom
        console.log('Очистка завершена');
    };


    const leaveRoom = () => {
        console.log('Выполняется leaveRoom');
        if (ws.current?.readyState === WebSocket.OPEN) {
            try {
                ws.current.send(JSON.stringify({
                    type: 'leave',
                    room: roomId,
                    username
                }));
                console.log('Отправлено сообщение leave:', { type: 'leave', room: roomId, username });
            } catch (e) {
                console.error('Ошибка отправки сообщения leave:', e);
            }
        }

        // Очищаем ресурсы
        cleanup();

        // Закрываем WebSocket
        if (ws.current) {
            ws.current.close();
            ws.current = null;
        }

        // Сбрасываем состояния
        setUsers([]);
        setIsInRoom(false);
        setIsConnected(false);
        setIsCallActive(false);
        setIsLeader(false);
        setRetryCount(0);
        setError(null);
        console.log('Состояния сброшены после leaveRoom');
    };

    const startVideoCheckTimer = () => {
        // Очищаем предыдущий таймер, если он есть
        if (videoCheckTimeout.current) {
            clearTimeout(videoCheckTimeout.current);
        }

        // Устанавливаем новый таймер
        videoCheckTimeout.current = setTimeout(() => {
            if (!remoteStream || remoteStream.getVideoTracks().length === 0 ||
                !remoteStream.getVideoTracks()[0].readyState) {
                console.log('Удаленное видео не получено в течение .. секунд, перезапускаем соединение...');
                resetConnection();
            }
        }, VIDEO_CHECK_TIMEOUT);
    };

    const connectWebSocket = async (): Promise<boolean> => {
        return new Promise((resolve) => {
            if (ws.current?.readyState === WebSocket.OPEN) {
                resolve(true);
                return;
            }

            try {
                ws.current = new WebSocket('wss://ardua.site/wsgo');

                const onOpen = () => {
                    cleanupEvents();
                    setIsConnected(true);
                    setError(null);
                    console.log('WebSocket подключен');
                    resolve(true);
                };

                const onError = (event: Event) => {
                    cleanupEvents();
                    console.error('Ошибка WebSocket:', event);
                    setError('Ошибка подключения к WebSocket');
                    setIsConnected(false);
                    resolve(false);
                };

                const onClose = (event: CloseEvent) => {
                    cleanupEvents();
                    console.log('WebSocket отключен:', event.code, event.reason);
                    setIsConnected(false);
                    setIsInRoom(false);
                    setError(event.code !== 1000 ? `Соединение закрыто: ${event.reason || 'код ' + event.code}` : null);
                    resolve(false);
                };

                const cleanupEvents = () => {
                    ws.current?.removeEventListener('open', onOpen);
                    ws.current?.removeEventListener('error', onError);
                    ws.current?.removeEventListener('close', onClose);
                    if (connectionTimeout.current) {
                        clearTimeout(connectionTimeout.current);
                    }
                };

                connectionTimeout.current = setTimeout(() => {
                    cleanupEvents();
                    setError('Таймаут подключения WebSocket');
                    resolve(false);
                }, 5000);

                ws.current.addEventListener('open', onOpen);
                ws.current.addEventListener('error', onError);
                ws.current.addEventListener('close', onClose);

            } catch (err) {
                console.error('Ошибка создания WebSocket:', err);
                setError('Не удалось создать WebSocket соединение');
                resolve(false);
            }
        });
    };

    // Функция для извлечения видеокодека из SDP
    const getVideoCodecFromSdp = (sdp: string): string | null => {
        const lines = sdp.split('\n');
        let videoSection = false;

        for (const line of lines) {
            if (line.startsWith('m=video')) {
                videoSection = true;
                continue;
            }
            if (videoSection && line.startsWith('a=rtpmap')) {
                const match = line.match(/a=rtpmap:\d+ ([A-Za-z0-9]+)/);
                if (match) {
                    return match[1]; // Например, VP8 или H264
                }
            }
            if (line.startsWith('m=') && !line.startsWith('m=video')) {
                videoSection = false;
            }
        }
        return null;
    };


    const setupWebSocketListeners = () => {
        if (!ws.current) return;

        const handleMessage = async (event: MessageEvent) => {
            try {
                const data: WebSocketMessage = JSON.parse(event.data);
                console.log('Получено сообщение:', data);

                // Устанавливаем isLeader и users при получении room_info
                if (data.type === 'room_info') {
                    const roomInfo = (data as RoomInfoMessage).data;
                    console.log('Обработка room_info:', roomInfo);
                    if (roomInfo) {
                        setIsLeader(roomInfo.leader === username);
                        setUsers(roomInfo.users || []);
                        setIsInRoom(true);
                    }
                }

                // Обработка switch_camera
                if (data.type === 'switch_camera_ack') {
                    console.log('Камера на Android успешно переключена');
                }

                // Обработка reconnect_request
                if (data.type === 'reconnect_request') {
                    console.log('Сервер запросил переподключение');
                    setTimeout(() => {
                        resetConnection();
                    }, 1000);
                    return;
                }

                if (data.type === 'force_disconnect') {
                    console.log('Получена команда принудительного отключения');
                    setError('Вы были отключены, так как подключился другой зритель');
                    leaveRoom();
                    return;
                }

                if (data.type === 'error') {
                    setError(data.data || 'Ошибка от сервера');
                    console.error('Ошибка от сервера:', data.data);
                }

                if (data.type === 'offer') {
                    if (pc.current && ws.current?.readyState === WebSocket.OPEN && data.sdp) {
                        try {
                            if (isNegotiating.current) {
                                console.log('Уже в процессе переговоров, игнорируем оффер');
                                return;
                            }

                            isNegotiating.current = true;
                            await pc.current.setRemoteDescription(
                                new RTCSessionDescription(data.sdp)
                            );

                            const answer = await pc.current.createAnswer({
                                offerToReceiveAudio: true,
                                offerToReceiveVideo: true
                            });

                            const normalizedAnswer = {
                                ...answer,
                                sdp: normalizeSdp(answer.sdp)
                            };

                            await pc.current.setLocalDescription(normalizedAnswer);

                            // Логируем кодек из SDP ответа
                            const codec = getVideoCodecFromSdp(normalizedAnswer.sdp);
                            if (codec) {
                                console.log(`Кодек трансляции: ${codec}`);
                            } else {
                                console.warn('Кодек не найден в SDP ответа');
                            }

                            ws.current.send(JSON.stringify({
                                type: 'answer',
                                sdp: normalizedAnswer,
                                room: roomId,
                                username
                            }));
                            console.log('Отправлен answer:', normalizedAnswer);

                            setIsCallActive(true);
                            isNegotiating.current = false;
                        } catch (err) {
                            console.error('Ошибка обработки оффера:', err);
                            setError('Ошибка обработки предложения соединения');
                            isNegotiating.current = false;
                        }
                    }
                } else if (data.type === 'answer') {
                    if (pc.current && data.sdp) {
                        try {
                            if (pc.current.signalingState !== 'have-local-offer') {
                                console.log('Не в состоянии have-local-offer, игнорируем ответ');
                                return;
                            }

                            const answerDescription: RTCSessionDescriptionInit = {
                                type: 'answer',
                                sdp: normalizeSdp(data.sdp.sdp)
                            };

                            console.log('Устанавливаем удаленное описание с ответом');
                            await pc.current.setRemoteDescription(
                                new RTCSessionDescription(answerDescription)
                            );

                            setIsCallActive(true);

                            // Запускаем проверку получения видео
                            startVideoCheckTimer();

                            // Обрабатываем ожидающие кандидаты
                            while (pendingIceCandidates.current.length > 0) {
                                const candidate = pendingIceCandidates.current.shift();
                                if (candidate) {
                                    try {
                                        await pc.current.addIceCandidate(candidate);
                                    } catch (err) {
                                        console.error('Ошибка добавления отложенного ICE кандидата:', err);
                                    }
                                }
                            }
                        } catch (err) {
                            console.error('Ошибка установки ответа:', err);
                            setError(`Ошибка установки ответа: ${err instanceof Error ? err.message : String(err)}`);
                        }
                    }
                } else if (data.type === 'ice_candidate') {
                    if (data.ice) {
                        try {
                            const candidate = new RTCIceCandidate(data.ice);

                            if (pc.current && pc.current.remoteDescription) {
                                await pc.current.addIceCandidate(candidate);
                                console.log('Добавлен ICE кандидат:', candidate);
                            } else {
                                pendingIceCandidates.current.push(candidate);
                                console.log('ICE кандидат добавлен в очередь:', candidate);
                            }
                        } catch (err) {
                            console.error('Ошибка добавления ICE-кандидата:', err);
                            setError('Ошибка добавления ICE-кандидата');
                        }
                    }
                }
            } catch (err) {
                console.error('Ошибка обработки сообщения:', err);
                setError('Ошибка обработки сообщения сервера');
            }
        };

        ws.current.onmessage = handleMessage;
    };

    const initializeWebRTC = async () => {
        try {
            cleanup();

            const { isIOS, isSafari, isHuawei } = detectPlatform();

            const config: RTCConfiguration = {
                iceServers: [
                    { urls: 'stun:ardua.site:3478' },
                    {
                        urls: 'turn:ardua.site:3478',
                        username: 'user1',
                        credential: 'pass1'
                    }
                ],
                bundlePolicy: 'max-bundle',
                rtcpMuxPolicy: 'require',
                iceTransportPolicy: 'all',
                iceCandidatePoolSize: 0,
                // @ts-ignore - sdpSemantics is supported but not in TypeScript's types
                sdpSemantics: 'unified-plan' as any,
            };

            pc.current = new RTCPeerConnection(config);


            if (isIOS || isSafari) {
                // iOS требует более агрессивного управления ICE
                pc.current.oniceconnectionstatechange = () => {
                    if (!pc.current) return;

                    console.log('iOS ICE state:', pc.current.iceConnectionState);

                    if (pc.current.iceConnectionState === 'disconnected' ||
                        pc.current.iceConnectionState === 'failed') {
                        console.log('iOS: ICE failed, restarting connection');
                        setTimeout(resetConnection, 1000);
                    }
                };

                // iOS требует быстрой переотправки кандидатов
                pc.current.onicegatheringstatechange = () => {
                    if (pc.current?.iceGatheringState === 'complete') {
                        console.log('iOS: ICE gathering complete');
                    }
                };
            }

            pc.current.addEventListener('icecandidate', event => {
                if (event.candidate) {
                    console.log('Using candidate type:',
                        event.candidate.candidate.split(' ')[7]);
                }
            });

            if (isHuawei) {
                pc.current.oniceconnectionstatechange = () => {
                    if (!pc.current) return;

                    console.log('Huawei ICE состояние:', pc.current.iceConnectionState);

                    // Более агрессивное восстановление для Huawei
                    if (pc.current.iceConnectionState === 'disconnected' ||
                        pc.current.iceConnectionState === 'failed') {
                        console.log('Huawei: соединение прервано, переподключение...');
                        setTimeout(resetConnection, 1000);
                    }
                };
            }

            // Обработчики событий WebRTC
            pc.current.onnegotiationneeded = () => {
                console.log('Требуется переговорный процесс');
            };

            pc.current.onsignalingstatechange = () => {
                console.log('Состояние сигнализации изменилось:', pc.current?.signalingState);
            };

            pc.current.onicegatheringstatechange = () => {
                console.log('Состояние сбора ICE изменилось:', pc.current?.iceGatheringState);
            };

            pc.current.onicecandidateerror = (event) => {
                const ignorableErrors = [701, 702, 703]; // Игнорируем стандартные ошибки STUN
                if (!ignorableErrors.includes(event.errorCode)) {
                    console.error('Критическая ошибка ICE кандидата:', event);
                    setError(`Ошибка ICE соединения: ${event.errorText}`);
                }
            };

            // Получаем медиапоток с устройства
            const stream = await navigator.mediaDevices.getUserMedia({
                video: deviceIds.video ? {
                    deviceId: { exact: deviceIds.video },
                    ...getVideoConstraints(),
                    ...(isIOS && !deviceIds.video ? { facingMode: 'user' } : {})
                } : getVideoConstraints(),
                ...(isIOS && !deviceIds.video ? { facingMode: 'user' } : {}),
                audio: deviceIds.audio ? {
                    deviceId: { exact: deviceIds.audio },
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } : true
            });

            // Применяем настройки для Huawei
            pc.current.getSenders().forEach(configureVideoSender);

            // Проверяем наличие видеотрека
            const videoTracks = stream.getVideoTracks();
            if (videoTracks.length === 0) {
                throw new Error('Не удалось получить видеопоток с устройства');
            }

            setLocalStream(stream);
            stream.getTracks().forEach(track => {
                pc.current?.addTrack(track, stream);
            });

            // Обработка ICE кандидатов
            pc.current.onicecandidate = (event) => {
                if (event.candidate && ws.current?.readyState === WebSocket.OPEN) {
                    try {
                        // Фильтруем нежелательные кандидаты
                        if (shouldSendIceCandidate(event.candidate)) {
                            ws.current.send(JSON.stringify({
                                type: 'ice_candidate',
                                ice: event.candidate.toJSON(),
                                room: roomId,
                                username
                            }));
                        }
                    } catch (err) {
                        console.error('Ошибка отправки ICE кандидата:', err);
                    }
                }
            };

            const shouldSendIceCandidate = (candidate: RTCIceCandidate) => {

                const { isIOS, isSafari, isHuawei } = detectPlatform();

                // Для Huawei отправляем только relay-кандидаты
                if (isHuawei) {
                    return candidate.candidate.includes('typ relay');
                }

                // Для iOS/Safari отправляем только relay-кандидаты и srflx
                if (isIOS || isSafari) {
                    return candidate.candidate.includes('typ relay') ||
                        candidate.candidate.includes('typ srflx');
                }

                return true;
            };

            // Обработка входящих медиапотоков
            pc.current.ontrack = (event) => {
                if (event.streams && event.streams[0]) {
                    const stream = event.streams[0];

                    // Проверяем наличие видео трека
                    const videoTrack = stream.getVideoTracks()[0];
                    if (videoTrack) {
                        console.log('Получен видеотрек:', videoTrack.id);

                        // Создаем новый MediaStream только с нужными треками
                        const newRemoteStream = new MediaStream();
                        stream.getTracks().forEach(track => {
                            newRemoteStream.addTrack(track);
                            console.log(`Добавлен ${track.kind} трек в remoteStream`);
                        });

                        setRemoteStream(newRemoteStream);
                        setIsCallActive(true);

                        // Очищаем таймер проверки видео
                        if (videoCheckTimeout.current) {
                            clearTimeout(videoCheckTimeout.current);
                            videoCheckTimeout.current = null;
                        }
                    } else {
                        console.warn('Входящий поток не содержит видео');
                        startVideoCheckTimer();
                    }
                }
            };

            // Обработка состояния ICE соединения
            pc.current.oniceconnectionstatechange = () => {
                if (!pc.current) return;

                const { isHuawei } = detectPlatform();

                if (pc.current.iceConnectionState === 'connected' && isHuawei) {
                    // Сохраняем функцию остановки для cleanup
                    const stopHuaweiMonitor = startHuaweiPerformanceMonitor();

                    // Автоматическая остановка при разрыве
                    pc.current.onconnectionstatechange = () => {
                        if (pc.current?.connectionState === 'disconnected') {
                            stopHuaweiMonitor();
                        }
                    };

                    // Также останавливаем при ручной очистке
                    const originalCleanup = cleanup;
                    cleanup = () => {
                        stopHuaweiMonitor();
                        originalCleanup();
                    };
                }

                if (isHuawei && pc.current.iceConnectionState === 'disconnected') {
                    // Более агрессивный перезапуск для Huawei
                    setTimeout(resetConnection, 1000);
                }

                console.log('Состояние ICE соединения:', pc.current.iceConnectionState);

                switch (pc.current.iceConnectionState) {
                    case 'failed':
                        console.log('Ошибка ICE, перезапуск...');
                        resetConnection();
                        break;

                    case 'disconnected':
                        console.log('Соединение прервано...');
                        setIsCallActive(false);
                        resetConnection();
                        break;

                    case 'connected':
                        console.log('Соединение установлено!');
                        setIsCallActive(true);
                        break;

                    case 'closed':
                        console.log('Соединение закрыто');
                        setIsCallActive(false);
                        break;
                }
            };

            // Запускаем мониторинг статистики соединения
            startConnectionMonitoring();

            return true;
        } catch (err) {
            console.error('Ошибка инициализации WebRTC:', err);
            setError(`Не удалось инициализировать WebRTC: ${err instanceof Error ? err.message : String(err)}`);
            cleanup();
            return false;
        }
    };

    const adjustVideoQualityForSafari = (direction: 'higher' | 'lower') => {
        const senders = pc.current?.getSenders() || [];

        senders.forEach(sender => {
            if (sender.track?.kind === 'video') {
                const parameters = sender.getParameters();

                if (!parameters.encodings) return;

                parameters.encodings[0] = {
                    ...parameters.encodings[0],
                    maxBitrate: direction === 'higher' ? 300000 : 150000,
                    scaleResolutionDownBy: direction === 'higher' ? 1.0 : 1.5,
                    maxFramerate: direction === 'higher' ? 25 : 15,
                    priority: 'high',
                    networkPriority: 'high'
                };

                try {
                    sender.setParameters(parameters);
                } catch (err) {
                    console.error('Ошибка изменения параметров:', err);
                }
            }
        });
    };

    const startConnectionMonitoring = () => {
        if (statsInterval.current) {
            clearInterval(statsInterval.current);
        }

        const { isSafari } = detectPlatform();

        statsInterval.current = setInterval(async () => {
            if (!pc.current || !isCallActive) return;

            try {
                const stats = await pc.current.getStats();
                let hasActiveVideo = false;
                let packetsLost = 0;
                let totalPackets = 0;
                let videoJitter = 0;

                stats.forEach(report => {
                    if (report.type === 'inbound-rtp' && report.kind === 'video') {
                        if (report.bytesReceived > 0) hasActiveVideo = true;
                        if (report.packetsLost !== undefined) packetsLost += report.packetsLost;
                        if (report.packetsReceived !== undefined) totalPackets += report.packetsReceived;
                        if (report.jitter !== undefined) videoJitter = report.jitter;
                    }
                });

                // Общая проверка для всех устройств
                if (!hasActiveVideo && isCallActive) {
                    console.warn('Нет активного видеопотока, пытаемся восстановить...');
                    resetConnection();
                    return;
                }

                // Специфичные проверки для Safari
                if (isSafari) {
                    // Проверка на высокую задержку
                    if (videoJitter > 0.3) { // Jitter в секундах
                        console.log('Высокий jitter на Safari, уменьшаем битрейт');
                        adjustVideoQualityForSafari('lower');
                    }
                    // Проверка потери пакетов
                    else if (totalPackets > 0 && packetsLost / totalPackets > 0.05) { // >5% потерь
                        console.warn('Высокий уровень потерь пакетов на Safari, переподключение...');
                        resetConnection();
                        return;
                    }
                }
            } catch (err) {
                console.error('Ошибка получения статистики:', err);
            }
        }, 5000);

        return () => {
            if (statsInterval.current) {
                clearInterval(statsInterval.current);
            }
        };
    };

// Модифицируем функцию resetConnection
const resetConnection = async () => {
if (retryAttempts.current >= MAX_RETRIES) {
setError('Не удалось восстановить соединение после нескольких попыток');
leaveRoom();
return;
}

        // Увеличиваем таймаут с каждой попыткой, особенно для мобильных
        const { isIOS, isSafari } = detectPlatform();
        const baseDelay = isIOS || isSafari ? 5000 : 2000; // Больше времени для iOS
        const retryDelay = Math.min(baseDelay * (retryAttempts.current + 1), 15000);

        console.log(`Попытка переподключения #${retryAttempts.current + 1}, задержка: ${retryDelay}ms`);

        cleanup();
        retryAttempts.current += 1;
        setRetryCount(retryAttempts.current);

        setTimeout(async () => {
            try {
                await joinRoom(username);
                retryAttempts.current = 0;
            } catch (err) {
                console.error('Ошибка переподключения:', err);
                if (retryAttempts.current < MAX_RETRIES) {
                    resetConnection();
                }
            }
        }, retryDelay);
    };

    const restartMediaDevices = async () => {
        try {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: deviceIds.video ? {
                    deviceId: { exact: deviceIds.video },
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 30 }
                } : {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 30 }
                },
                audio: deviceIds.audio ? {
                    deviceId: { exact: deviceIds.audio },
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } : true
            });

            setLocalStream(stream);

            if (pc.current) {
                const senders = pc.current.getSenders();
                stream.getTracks().forEach(track => {
                    const sender = senders.find(s => s.track?.kind === track.kind);
                    if (sender) {
                        sender.replaceTrack(track);
                    } else {
                        pc.current?.addTrack(track, stream);
                    }
                });
            }

            return true;
        } catch (err) {
            console.error('Ошибка перезагрузки медиаустройств:', err);
            setError('Ошибка доступа к медиаустройствам');
            return false;
        }
    };

    const joinRoom = async (uniqueUsername: string) => {
        setError(null)
        setIsInRoom(false)
        setIsConnected(false)
        setIsLeader(false)

        try {
            if (!(await connectWebSocket())) {
                throw new Error('Не удалось подключиться к WebSocket')
            }

            setupWebSocketListeners()

            if (!(await initializeWebRTC())) {
                throw new Error('Не удалось инициализировать WebRTC')
            }

            // Используем переданный preferredCodec вместо определения по платформе
            // const { isChrome } = detectPlatform()
            // const preferredCodec = isChrome ? 'VP8' : 'H264'

            await new Promise<void>((resolve, reject) => {
                if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
                    reject(new Error('WebSocket не подключен'))
                    return
                }

                const onMessage = (event: MessageEvent) => {
                    try {
                        const data = JSON.parse(event.data)
                        console.log('Получено сообщение в joinRoom:', data)
                        if (data.type === 'room_info') {
                            console.log('Получено room_info, очищаем таймер')
                            cleanupEvents()
                            setIsInRoom(true)
                            setUsers(data.data?.users || [])
                            resolve()
                        } else if (data.type === 'error') {
                            console.error('Ошибка от сервера:', data.data)
                            cleanupEvents()
                            reject(new Error(data.data || 'Ошибка входа в комнату'))
                        }
                    } catch (err) {
                        console.error('Ошибка обработки сообщения:', err)
                        cleanupEvents()
                        reject(err)
                    }
                }

                const cleanupEvents = () => {
                    ws.current?.removeEventListener('message', onMessage)
                    if (connectionTimeout.current) {
                        clearTimeout(connectionTimeout.current)
                        connectionTimeout.current = null
                    }
                }

                connectionTimeout.current = setTimeout(() => {
                    cleanupEvents()
                    console.error('Таймаут ожидания ответа от сервера')
                    setError('Таймаут ожидания ответа от сервера')
                    reject(new Error('Таймаут ожидания ответа от сервера'))
                }, 15000)

                ws.current.addEventListener('message', onMessage)

                ws.current.send(JSON.stringify({
                    action: "join",
                    room: roomId,
                    username: uniqueUsername,
                    isLeader: false,
                    preferredCodec // Используем переданный кодек
                }))
                console.log('Отправлен запрос на подключение:', { action: "join", room: roomId, username: uniqueUsername, isLeader: false, preferredCodec })
            })

            shouldCreateOffer.current = false
            startVideoCheckTimer()
        } catch (err) {
            console.error('Ошибка входа в комнату:', err)
            setError(`Ошибка входа в комнату: ${err instanceof Error ? err.message : String(err)}`)

            cleanup()
            if (ws.current) {
                ws.current.close()
                ws.current = null
            }

            if (retryAttempts.current < MAX_RETRIES) {
                setTimeout(() => {
                    joinRoom(uniqueUsername).catch(console.error)
                }, 2000 * (retryAttempts.current + 1))
            }
        }
    }

    useEffect(() => {
        return () => {
            leaveRoom()
        }
    }, [])

    return {
        localStream,
        remoteStream,
        users,
        joinRoom,
        leaveRoom,
        isCallActive,
        isConnected,
        isInRoom,
        isLeader,
        error,
        retryCount,
        resetConnection,
        restartMediaDevices,
        setError,
        ws: ws.current, // Возвращаем текущее соединение
    };
};

// file: docker-ardua/components/webrtc/VideoCallApp.tsx
// file: docker-ardua/components/webrtc/VideoCallApp.tsx
'use client'

import { useWebRTC } from './hooks/useWebRTC'
import styles from './styles.module.css'
import { VideoPlayer } from './components/VideoPlayer'
import { DeviceSelector } from './components/DeviceSelector'
import { useEffect, useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import SocketClient from '../control/SocketClient'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"


type VideoSettings = {
rotation: number
flipH: boolean
flipV: boolean
}

// Тип для сохраненных комнат
type SavedRoom = {
id: string // Без тире (XXXX-XXXX-XXXX-XXXX -> XXXXXXXXXXXXXXXX)
isDefault: boolean
}

export const VideoCallApp = () => {
const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
const [selectedDevices, setSelectedDevices] = useState({
video: '',
audio: ''
})
const [showLocalVideo, setShowLocalVideo] = useState(true)
const [videoTransform, setVideoTransform] = useState('')
const [roomId, setRoomId] = useState('')
const [username, setUsername] = useState('user_' + Math.floor(Math.random() * 1000))
const [hasPermission, setHasPermission] = useState(false)
const [devicesLoaded, setDevicesLoaded] = useState(false)
const [isJoining, setIsJoining] = useState(false)
const [autoJoin, setAutoJoin] = useState(false)
const [activeMainTab, setActiveMainTab] = useState<'webrtc' | 'esp' | null>(null)
const [showControls, setShowControls] = useState(false)
const [videoSettings, setVideoSettings] = useState<VideoSettings>({
rotation: 0,
flipH: false,
flipV: false
})
const [muteLocalAudio, setMuteLocalAudio] = useState(false)
const [muteRemoteAudio, setMuteRemoteAudio] = useState(false)
const videoContainerRef = useRef<HTMLDivElement>(null)
const [isFullscreen, setIsFullscreen] = useState(false)
const remoteVideoRef = useRef<HTMLVideoElement>(null)
const localAudioTracks = useRef<MediaStreamTrack[]>([])
const [useBackCamera, setUseBackCamera] = useState(false)
const [savedRooms, setSavedRooms] = useState<SavedRoom[]>([])
const [showDeleteDialog, setShowDeleteDialog] = useState(false)
const [roomToDelete, setRoomToDelete] = useState<string | null>(null)
// Новое состояние для кодека
const [selectedCodec, setSelectedCodec] = useState<'VP8' | 'H264'>('VP8')

    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    const {
        localStream,
        remoteStream,
        users,
        joinRoom,
        leaveRoom,
        isCallActive,
        isConnected,
        isInRoom,
        error,
        setError,
        ws
    } = useWebRTC(selectedDevices, username, roomId.replace(/-/g, ''), selectedCodec) // Передаём selectedCodec

    useEffect(() => {
        console.log('Состояния:', { isConnected, isInRoom, isCallActive, error })
    }, [isConnected, isInRoom, isCallActive, error])

    // Загрузка сохранённых настроек
    useEffect(() => {
        const loadSettings = () => {
            try {
                const saved = localStorage.getItem('videoSettings')
                if (saved) {
                    const parsed = JSON.parse(saved) as VideoSettings
                    setVideoSettings(parsed)
                    applyVideoTransform(parsed)
                }
            } catch (e) {
                console.error('Failed to load video settings', e)
            }
        }

        const loadSavedRooms = () => {
            try {
                const saved = localStorage.getItem('savedRooms')
                if (saved) {
                    const rooms: SavedRoom[] = JSON.parse(saved)
                    setSavedRooms(rooms)
                    const defaultRoom = rooms.find(r => r.isDefault)
                    if (defaultRoom) {
                        setRoomId(formatRoomId(defaultRoom.id))
                    }
                }
            } catch (e) {
                console.error('Failed to load saved rooms', e)
            }
        }

        const savedMuteLocal = localStorage.getItem('muteLocalAudio')
        if (savedMuteLocal !== null) {
            setMuteLocalAudio(savedMuteLocal === 'true')
        }

        const savedMuteRemote = localStorage.getItem('muteRemoteAudio')
        if (savedMuteRemote !== null) {
            setMuteRemoteAudio(savedMuteRemote === 'true')
        }

        const savedShowLocalVideo = localStorage.getItem('showLocalVideo')
        if (savedShowLocalVideo !== null) {
            setShowLocalVideo(savedShowLocalVideo === 'true')
        }

        const savedCameraPref = localStorage.getItem('useBackCamera')
        if (savedCameraPref !== null) {
            setUseBackCamera(savedCameraPref === 'true')
        }

        const savedAutoJoin = localStorage.getItem('autoJoin') === 'true'
        setAutoJoin(savedAutoJoin)

        // Загрузка сохранённого кодека
        const savedCodec = localStorage.getItem('selectedCodec')
        if (savedCodec === 'VP8' || savedCodec === 'H264') {
            setSelectedCodec(savedCodec)
        }

        loadSettings()
        loadSavedRooms()
        loadDevices()
    }, [])

    const handleCodecChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const codec = e.target.value as 'VP8' | 'H264'
        setSelectedCodec(codec)
        localStorage.setItem('selectedCodec', codec)
    }

    // Форматирование ID комнаты с тире (XXXX-XXXX-XXXX-XXXX)
    const formatRoomId = (id: string): string => {
        // Удаляем все недопустимые символы (оставляем только буквы и цифры)
        const cleanId = id.replace(/[^A-Z0-9]/gi, '')

        // Вставляем тире каждые 4 символа
        return cleanId.replace(/(.{4})(?=.)/g, '$1-')
    }

    // Обработчик изменения поля ID комнаты
    const handleRoomIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value.toUpperCase()

        // Удаляем все недопустимые символы (оставляем только буквы, цифры и тире)
        let cleanInput = input.replace(/[^A-Z0-9-]/gi, '')

        // Ограничиваем длину до 19 символов (16 символов + 3 тире)
        if (cleanInput.length > 19) {
            cleanInput = cleanInput.substring(0, 19)
        }

        // Вставляем тире каждые 4 символа
        const formatted = formatRoomId(cleanInput)
        setRoomId(formatted)
    }

    // Проверка, что введен полный ID комнаты (16 символов без учета тире)
    const isRoomIdComplete = roomId.replace(/-/g, '').length === 16

    // Сохранение комнаты в список
    const handleSaveRoom = () => {
        if (!isRoomIdComplete) return

        const roomIdWithoutDashes = roomId.replace(/-/g, '')

        // Проверяем, не сохранена ли уже эта комната
        if (savedRooms.some(r => r.id === roomIdWithoutDashes)) {
            return
        }

        const newRoom: SavedRoom = {
            id: roomIdWithoutDashes,
            isDefault: savedRooms.length === 0 // Первая комната становится по умолчанию
        }

        const updatedRooms = [...savedRooms, newRoom]
        setSavedRooms(updatedRooms)
        saveRoomsToStorage(updatedRooms)
    }

    // Удаление комнаты из списка
    const handleDeleteRoom = (roomIdWithoutDashes: string) => {
        setRoomToDelete(roomIdWithoutDashes)
        setShowDeleteDialog(true)
    }

    // Подтверждение удаления комнаты
    const confirmDeleteRoom = () => {
        if (!roomToDelete) return

        const updatedRooms = savedRooms.filter(r => r.id !== roomToDelete)

        // Если удаляем комнату по умолчанию, назначаем новую по умолчанию (если есть)
        if (savedRooms.some(r => r.id === roomToDelete && r.isDefault)) {
            if (updatedRooms.length > 0) {
                updatedRooms[0].isDefault = true
            }
        }

        setSavedRooms(updatedRooms)
        saveRoomsToStorage(updatedRooms)

        // Если удаленная комната была текущей, очищаем поле
        if (roomId.replace(/-/g, '') === roomToDelete) {
            setRoomId('')
        }

        setShowDeleteDialog(false)
        setRoomToDelete(null)
    }

    // Выбор комнаты из списка
    const handleSelectRoom = (roomIdWithoutDashes: string) => {
        // Форматируем ID с тире для отображения
        setRoomId(formatRoomId(roomIdWithoutDashes))
    }

    // Установка комнаты по умолчанию
    const setDefaultRoom = (roomIdWithoutDashes: string) => {
        const updatedRooms = savedRooms.map(r => ({
            ...r,
            isDefault: r.id === roomIdWithoutDashes
        }))

        setSavedRooms(updatedRooms)
        saveRoomsToStorage(updatedRooms)
    }

    // Сохранение списка комнат в localStorage
    const saveRoomsToStorage = (rooms: SavedRoom[]) => {
        localStorage.setItem('savedRooms', JSON.stringify(rooms))
    }

    // Функция переключения камеры на Android устройстве
    const toggleCamera = () => {
        const newCameraState = !useBackCamera
        setUseBackCamera(newCameraState)
        localStorage.setItem('useBackCamera', String(newCameraState))

        // Проверяем соединение перед отправкой
        if (isConnected && ws) {
            try {
                ws.send(JSON.stringify({
                    type: "switch_camera",
                    useBackCamera: newCameraState,
                    room: roomId.replace(/-/g, ''),
                    username: username
                }))
            } catch (err) {
                console.error('Error sending camera switch command:', err)
            }
        } else {
            console.error('Not connected to server')
        }
    }

    // Управление локальным звуком
    useEffect(() => {
        if (localStream) {
            localAudioTracks.current = localStream.getAudioTracks()
            localAudioTracks.current.forEach(track => {
                track.enabled = !muteLocalAudio
            })
        }
    }, [localStream, muteLocalAudio])

    // Управление удаленным звуком
    useEffect(() => {
        if (remoteStream) {
            remoteStream.getAudioTracks().forEach(track => {
                track.enabled = !muteRemoteAudio
            })
        }
    }, [remoteStream, muteRemoteAudio])

    useEffect(() => {
        if (autoJoin && hasPermission && !isInRoom && isRoomIdComplete) {
            handleJoinRoom();
        }
    }, [autoJoin, hasPermission, isRoomIdComplete]); // Зависимости

    const applyVideoTransform = (settings: VideoSettings) => {
        const { rotation, flipH, flipV } = settings
        let transform = ''
        if (rotation !== 0) transform += `rotate(${rotation}deg) `
        transform += `scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`
        setVideoTransform(transform)

        if (remoteVideoRef.current) {
            remoteVideoRef.current.style.transform = transform
            remoteVideoRef.current.style.transformOrigin = 'center center'
        }
    }

    const saveSettings = (settings: VideoSettings) => {
        localStorage.setItem('videoSettings', JSON.stringify(settings))
    }

    const loadDevices = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            })

            stream.getTracks().forEach(track => track.stop())

            const devices = await navigator.mediaDevices.enumerateDevices()
            setDevices(devices)
            setHasPermission(true)
            setDevicesLoaded(true)

            const savedVideoDevice = localStorage.getItem('videoDevice')
            const savedAudioDevice = localStorage.getItem('audioDevice')

            setSelectedDevices({
                video: savedVideoDevice || '',
                audio: savedAudioDevice || ''
            })
        } catch (error) {
            console.error('Device access error:', error)
            setHasPermission(false)
            setDevicesLoaded(true)
        }
    }

    const toggleLocalVideo = () => {
        const newState = !showLocalVideo
        setShowLocalVideo(newState)
        localStorage.setItem('showLocalVideo', String(newState))
    }

    const updateVideoSettings = (newSettings: Partial<VideoSettings>) => {
        const updated = { ...videoSettings, ...newSettings }
        setVideoSettings(updated)
        applyVideoTransform(updated)
        saveSettings(updated)
    }

    const handleDeviceChange = (type: 'video' | 'audio', deviceId: string) => {
        setSelectedDevices(prev => ({
            ...prev,
            [type]: deviceId
        }))
        localStorage.setItem(`${type}Device`, deviceId)
    }

    const handleJoinRoom = async () => {
        if (!isRoomIdComplete) {
            console.warn('ID комнаты не полный, подключение невозможно');
            return;
        }

        setIsJoining(true);
        console.log('Попытка подключения к комнате:', roomId);
        try {
            // Устанавливаем выбранную комнату как дефолтную
            setDefaultRoom(roomId.replace(/-/g, ''));

            await joinRoom(username);
            console.log('Успешно подключено к комнате:', roomId);
        } catch (error) {
            console.error('Ошибка подключения к комнате:', error);
            setError('Ошибка подключения к комнате'); // Теперь setError должен быть доступен
        } finally {
            setIsJoining(false);
            console.log('Состояние isJoining сброшено');
        }
    };

    const toggleFullscreen = async () => {
        if (!videoContainerRef.current) return

        try {
            if (!document.fullscreenElement) {
                await videoContainerRef.current.requestFullscreen()
                setIsFullscreen(true)
            } else {
                await document.exitFullscreen()
                setIsFullscreen(false)
            }
        } catch (err) {
            console.error('Fullscreen error:', err)
        }
    }

    const toggleMuteLocalAudio = () => {
        const newState = !muteLocalAudio
        setMuteLocalAudio(newState)
        localStorage.setItem('muteLocalAudio', String(newState))

        localAudioTracks.current.forEach(track => {
            track.enabled = !newState
        })
    }

    const toggleMuteRemoteAudio = () => {
        const newState = !muteRemoteAudio
        setMuteRemoteAudio(newState)
        localStorage.setItem('muteRemoteAudio', String(newState))

        if (remoteStream) {
            remoteStream.getAudioTracks().forEach(track => {
                track.enabled = !newState
            })
        }
    }

    const rotateVideo = (degrees: number) => {
        updateVideoSettings({ rotation: degrees });

        if (remoteVideoRef.current) {
            if (degrees === 90 || degrees === 270) {
                remoteVideoRef.current.classList.add(styles.rotated);
            } else {
                remoteVideoRef.current.classList.remove(styles.rotated);
            }
        }
    };

    const flipVideoHorizontal = () => {
        updateVideoSettings({ flipH: !videoSettings.flipH })
    }

    const flipVideoVertical = () => {
        updateVideoSettings({ flipV: !videoSettings.flipV })
    }

    const resetVideo = () => {
        updateVideoSettings({ rotation: 0, flipH: false, flipV: false })
    }

    const toggleTab = (tab: 'webrtc' | 'esp' | 'controls') => {
        if (tab === 'controls') {
            setShowControls(!showControls)
        } else {
            setActiveMainTab(activeMainTab === tab ? null : tab)
        }
    }

    return (
        <div className={styles.container} suppressHydrationWarning>
            <div ref={videoContainerRef} className={styles.remoteVideoContainer} suppressHydrationWarning>
                {isClient && (
                    <VideoPlayer
                        stream={remoteStream}
                        className={styles.remoteVideo}
                        transform={videoTransform}
                        videoRef={remoteVideoRef}
                    />
                )}
            </div>

            {showLocalVideo && (
                <div className={styles.localVideoContainer}>
                    <VideoPlayer
                        stream={localStream}
                        muted
                        className={styles.localVideo}
                    />
                </div>
            )}

            <div className={styles.topControls}>
                <div className={styles.tabsContainer}>
                    <button
                        onClick={() => toggleTab('webrtc')}
                        className={`${styles.tabButton} ${activeMainTab === 'webrtc' ? styles.activeTab : ''}`}
                    >
                        {activeMainTab === 'webrtc' ? '▲' : '▼'} <img src="/cam.svg" alt="Camera"/>
                    </button>
                    <button
                        onClick={() => toggleTab('esp')}
                        className={`${styles.tabButton} ${activeMainTab === 'esp' ? styles.activeTab : ''}`}
                    >
                        {activeMainTab === 'esp' ? '▲' : '▼'} <img src="/joy.svg" alt="Joystick"/>
                    </button>
                    <button
                        onClick={() => toggleTab('controls')}
                        className={`${styles.tabButton} ${showControls ? styles.activeTab : ''}`}
                    >
                        {showControls ? '▲' : '▼'} <img src="/img.svg" alt="Image"/>
                    </button>
                </div>
            </div>

            {activeMainTab === 'webrtc' && (
                <div className={styles.tabContent}>
                    {error && <div className={styles.error}>{error}</div>}
                    <div className={styles.controls}>
                        <div className={styles.connectionStatus}>
                            Статус: {isConnected ? (isInRoom ? `В комнате ${roomId}` : 'Подключено') : 'Отключено'}
                            {isCallActive && ' (Звонок активен)'}
                            {users.length > 0 && (
                                <div>
                                    Роль: "Ведомый"
                                </div>
                            )}
                        </div>

                        {error && <div className={styles.error}>{error}</div>}

                        <div className={styles.inputGroup}>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="autoJoin"
                                    checked={autoJoin}
                                    disabled={!isRoomIdComplete}
                                    onCheckedChange={(checked) => {
                                        setAutoJoin(!!checked)
                                        localStorage.setItem('autoJoin', checked ? 'true' : 'false')
                                    }}
                                    suppressHydrationWarning
                                />
                                <Label htmlFor="autoJoin">Автоматическое подключение</Label>
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <Label htmlFor="room">ID комнаты</Label>
                            <Input
                                id="room"
                                value={roomId}
                                onChange={handleRoomIdChange}
                                disabled={isInRoom}
                                placeholder="XXXX-XXXX-XXXX-XXXX"
                                maxLength={19}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <Label htmlFor="username">Ваше имя</Label>
                            <Input
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={isInRoom}
                                placeholder="Ваше имя"
                            />
                        </div>

                        {!isInRoom ? (
                            <Button
                                onClick={handleJoinRoom}
                                disabled={!hasPermission || isJoining || !isRoomIdComplete}
                                className={styles.button}
                            >
                                {isJoining ? 'Подключение...' : 'Войти в комнату'}
                            </Button>
                        ) : (
                            <Button
                                onClick={leaveRoom}
                                disabled={!isConnected || !isInRoom}
                                className={styles.button}
                            >
                                Покинуть комнату
                            </Button>
                        )}

                        <div className={styles.inputGroup}>
                            <Button
                                onClick={handleSaveRoom}
                                disabled={!isRoomIdComplete || savedRooms.some(r => r.id === roomId.replace(/-/g, ''))}
                                className={styles.button}
                            >
                                Сохранить ID комнаты
                            </Button>
                        </div>

                        {savedRooms.length > 0 && (
                            <div className={styles.savedRooms}>
                                <h3>Сохраненные комнаты:</h3>
                                <ul>
                                    {savedRooms.map((room) => (
                                        <li key={room.id} className={styles.savedRoomItem}>
                                            <span
                                                onClick={() => handleSelectRoom(room.id)}
                                                className={room.isDefault ? styles.defaultRoom : ''}
                                            >
                                                {formatRoomId(room.id)}
                                                {room.isDefault && ' (по умолчанию)'}
                                            </span>
                                            <button
                                                onClick={() => handleDeleteRoom(room.id)}
                                                className={styles.deleteRoomButton}
                                            >
                                                Удалить
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                                {/* Новый выбор кодека */}
                                <div className={styles.inputGroup}>
                                    <Label htmlFor="codec">Кодек трансляции</Label>
                                    <select
                                        id="codec"
                                        value={selectedCodec}
                                        onChange={handleCodecChange}
                                        disabled={isInRoom}
                                        className={styles.codecSelect}
                                    >
                                        <option value="VP8">VP8</option>
                                        <option value="H264">H264</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        <div className={styles.userList}>
                            <h3>Участники ({users.length}):</h3>
                            <ul>
                                {users.map((user, index) => (
                                    <li key={index}>{user}</li>
                                ))}
                            </ul>
                        </div>

                        <div className={styles.deviceSelection}>
                            <h3>Выбор устройств:</h3>
                            {devicesLoaded ? (
                                <DeviceSelector
                                    devices={devices}
                                    selectedDevices={selectedDevices}
                                    onChange={handleDeviceChange}
                                    onRefresh={loadDevices}
                                />
                            ) : (
                                <div>Загрузка устройств...</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeMainTab === 'esp' && (
                <div className={styles.tabContent}>
                    <SocketClient/>
                </div>
            )}

            {showControls && (
                <div className={styles.tabContent}>
                    <div className={styles.videoControlsTab}>
                        <div className={styles.controlButtons}>
                            <button
                                onClick={toggleCamera}
                                className={`${styles.controlButton} ${useBackCamera ? styles.active : ''}`}
                                title={useBackCamera ? 'Переключить на фронтальную камеру' : 'Переключить на заднюю камеру'}
                            >
                                {useBackCamera ? '📷⬅️' : '📷➡️'}
                            </button>
                            <button
                                onClick={() => rotateVideo(0)}
                                className={`${styles.controlButton} ${videoSettings.rotation === 0 ? styles.active : ''}`}
                                title="Обычная ориентация"
                            >
                                ↻0°
                            </button>
                            <button
                                onClick={() => rotateVideo(90)}
                                className={`${styles.controlButton} ${videoSettings.rotation === 90 ? styles.active : ''}`}
                                title="Повернуть на 90°"
                            >
                                ↻90°
                            </button>
                            <button
                                onClick={() => rotateVideo(180)}
                                className={`${styles.controlButton} ${videoSettings.rotation === 180 ? styles.active : ''}`}
                                title="Повернуть на 180°"
                            >
                                ↻180°
                            </button>
                            <button
                                onClick={() => rotateVideo(270)}
                                className={`${styles.controlButton} ${videoSettings.rotation === 270 ? styles.active : ''}`}
                                title="Повернуть на 270°"
                            >
                                ↻270°
                            </button>
                            <button
                                onClick={flipVideoHorizontal}
                                className={`${styles.controlButton} ${videoSettings.flipH ? styles.active : ''}`}
                                title="Отразить по горизонтали"
                            >
                                ⇄
                            </button>
                            <button
                                onClick={flipVideoVertical}
                                className={`${styles.controlButton} ${videoSettings.flipV ? styles.active : ''}`}
                                title="Отразить по вертикали"
                            >
                                ⇅
                            </button>
                            <button
                                onClick={resetVideo}
                                className={styles.controlButton}
                                title="Сбросить настройки"
                            >
                                ⟲
                            </button>
                            <button
                                onClick={toggleFullscreen}
                                className={styles.controlButton}
                                title={isFullscreen ? 'Выйти из полноэкранного режима' : 'Полноэкранный режим'}
                            >
                                {isFullscreen ? '✕' : '⛶'}
                            </button>
                            <button
                                onClick={toggleLocalVideo}
                                className={`${styles.controlButton} ${!showLocalVideo ? styles.active : ''}`}
                                title={showLocalVideo ? 'Скрыть локальное видео' : 'Показать локальное видео'}
                            >
                                {showLocalVideo ? '👁' : '👁‍🗨'}
                            </button>
                            <button
                                onClick={toggleMuteLocalAudio}
                                className={`${styles.controlButton} ${muteLocalAudio ? styles.active : ''}`}
                                title={muteLocalAudio ? 'Включить микрофон' : 'Отключить микрофон'}
                            >
                                {muteLocalAudio ? '🎤🔇' : '🎤'}
                            </button>
                            <button
                                onClick={toggleMuteRemoteAudio}
                                className={`${styles.controlButton} ${muteRemoteAudio ? styles.active : ''}`}
                                title={muteRemoteAudio ? 'Включить звук' : 'Отключить звук'}
                            >
                                {muteRemoteAudio ? '🔈🔇' : '🔈'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Удалить комнату?</DialogTitle>
                    </DialogHeader>
                    <p>Вы уверены, что хотите удалить комнату {roomToDelete ? formatRoomId(roomToDelete) : ''}?</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Отмена
                        </Button>
                        <Button variant="destructive" onClick={confirmDeleteRoom}>
                            Удалить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}


Сервер GO
package main
import (
"encoding/json"
"errors"
"fmt"
"log"
"net/http"
"regexp" // Добавлено для normalizeSdpForCodec
"strings" // Добавлено для normalizeSdpForCodec
"sync"
"time"
"github.com/gorilla/websocket"
"github.com/pion/webrtc/v3"
)

var upgrader = websocket.Upgrader{
CheckOrigin: func(r *http.Request) bool { return true },
}

type Peer struct {
conn     *websocket.Conn
pc       *webrtc.PeerConnection
username string
room     string
isLeader bool
mu       sync.Mutex
}

type RoomInfo struct {
Users    []string `json:"users"`
Leader   string   `json:"leader"`
Follower string   `json:"follower"`
}

var (
peers     = make(map[string]*Peer)
rooms     = make(map[string]map[string]*Peer)
mu        sync.Mutex
// letters = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ") // Не используется, но оставлено для вашего сведения
webrtcAPI *webrtc.API // Глобальный API с настроенным MediaEngine
)

func normalizeSdpForCodec(sdp, preferredCodec string) string {
log.Printf("Normalizing SDP for codec: %s", preferredCodec)
lines := strings.Split(sdp, "\r\n")
var newLines []string
targetPayloadTypes := []string{}
targetCodec := preferredCodec
if targetCodec != "H264" && targetCodec != "VP8" {
targetCodec = "H264"
log.Printf("Invalid codec %s, defaulting to H264", preferredCodec)
}

    // Найти payload types для targetCodec
    codecRegex := regexp.MustCompile(fmt.Sprintf(`a=rtpmap:(\d+) %s/\d+`, targetCodec))
    for _, line := range lines {
        matches := codecRegex.FindStringSubmatch(line)
        if matches != nil {
            targetPayloadTypes = append(targetPayloadTypes, matches[1])
        }
    }

    if len(targetPayloadTypes) == 0 {
        log.Printf("No payload types found for %s, returning original SDP", targetCodec)
        return sdp
    }

    // Удалить другие кодеки
    otherCodecs := []string{"VP8", "VP9", "AV1"}
    if targetCodec == "VP8" {
        otherCodecs = []string{"H264", "VP9", "AV1"}
    }
    for _, line := range lines {
        skip := false
        for _, codec := range otherCodecs {
            if strings.Contains(line, fmt.Sprintf("a=rtpmap:%%d %s/", codec)) {
                skip = true
                break
            }
            if strings.Contains(line, "a=fmtp:") && strings.Contains(line, codec) {
                skip = true
                break
            }
            if strings.Contains(line, "a=rtcp-fb:") && strings.Contains(line, codec) {
                skip = true
                break
            }
        }
        if !skip {
            newLines = append(newLines, line)
        }
    }

    // Переупорядочить m=video
    for i, line := range newLines {
        if strings.HasPrefix(line, "m=video") {
            parts := strings.Split(line, " ")
            if len(parts) < 4 {
                log.Printf("Invalid m=video line: %s", line)
                return sdp
            }
            currentPayloads := parts[3:]
            filteredPayloads := []string{}
            for _, pt := range currentPayloads {
                for _, line := range newLines {
                    if strings.Contains(line, fmt.Sprintf("a=rtpmap:%s ", pt)) {
                        filteredPayloads = append(filteredPayloads, pt)
                        break
                    }
                }
            }
            preferredPayloads := []string{}
            for _, pt := range targetPayloadTypes {
                if contains(filteredPayloads, pt) {
                    preferredPayloads = append(preferredPayloads, pt)
                }
            }
            otherPayloads := []string{}
            for _, pt := range filteredPayloads {
                if !contains(targetPayloadTypes, pt) {
                    otherPayloads = append(otherPayloads, pt)
                }
            }
            parts = append(parts[:3], append(preferredPayloads, otherPayloads...)...)
            newLines[i] = strings.Join(parts, " ")
            log.Printf("Reordered m=video payloads: %v", parts[3:])
            break
        }
    }

    // Установить битрейт
    for i, line := range newLines {
        if strings.HasPrefix(line, "a=mid:video") {
            newLines = append(newLines[:i+1], append([]string{fmt.Sprintf("b=AS:%d", 500)}, newLines[i+1:]...)...)
            break
        }
    }

    newSdp := strings.Join(newLines, "\r\n")
    log.Printf("Normalized SDP:\n%s", newSdp)
    return newSdp
}

// contains проверяет, есть ли элемент в срезе
func contains(slice []string, item string) bool {
for _, s := range slice {
if s == item {
return true
}
}
return false
}


// createMediaEngine создает MediaEngine с учетом preferredCodec
func createMediaEngine(preferredCodec string) *webrtc.MediaEngine {
mediaEngine := &webrtc.MediaEngine{}

    if preferredCodec == "H264" {
        // Регистрируем только H.264
        if err := mediaEngine.RegisterCodec(webrtc.RTPCodecParameters{
            RTPCodecCapability: webrtc.RTPCodecCapability{
                MimeType:    webrtc.MimeTypeH264,
                ClockRate:   90000,
                SDPFmtpLine: "level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f",
                RTCPFeedback: []webrtc.RTCPFeedback{
                    {Type: "nack"},
                    {Type: "nack", Parameter: "pli"},
                    {Type: "ccm", Parameter: "fir"},
                    {Type: "goog-remb"},
                },
            },
            PayloadType: 126,
        }, webrtc.RTPCodecTypeVideo); err != nil {
            log.Printf("H264 codec registration error: %v", err)
        }
        log.Printf("MediaEngine configured with H.264 (PT: 126) only")
    } else if preferredCodec == "VP8" {
        // Регистрируем только VP8
        if err := mediaEngine.RegisterCodec(webrtc.RTPCodecParameters{
            RTPCodecCapability: webrtc.RTPCodecCapability{
                MimeType:    webrtc.MimeTypeVP8,
                ClockRate:   90000,
                RTCPFeedback: []webrtc.RTCPFeedback{
                    {Type: "nack"},
                    {Type: "nack", Parameter: "pli"},
                    {Type: "ccm", Parameter: "fir"},
                    {Type: "goog-remb"},
                },
            },
            PayloadType: 96,
        }, webrtc.RTPCodecTypeVideo); err != nil {
            log.Printf("VP8 codec registration error: %v", err)
        }
        log.Printf("MediaEngine configured with VP8 (PT: 96) only")
    } else {
        // По умолчанию H.264
        if err := mediaEngine.RegisterCodec(webrtc.RTPCodecParameters{
            RTPCodecCapability: webrtc.RTPCodecCapability{
                MimeType:    webrtc.MimeTypeH264,
                ClockRate:   90000,
                SDPFmtpLine: "level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f",
                RTCPFeedback: []webrtc.RTCPFeedback{
                    {Type: "nack"},
                    {Type: "nack", Parameter: "pli"},
                    {Type: "ccm", Parameter: "fir"},
                    {Type: "goog-remb"},
                },
            },
            PayloadType: 126,
        }, webrtc.RTPCodecTypeVideo); err != nil {
            log.Printf("H264 codec registration error: %v", err)
        }
        log.Printf("MediaEngine configured with default H.264 (PT: 126)")
    }

    // Регистрируем Opus аудио
    if err := mediaEngine.RegisterCodec(webrtc.RTPCodecParameters{
        RTPCodecCapability: webrtc.RTPCodecCapability{
            MimeType:     webrtc.MimeTypeOpus,
            ClockRate:    48000,
            Channels:     2,
            SDPFmtpLine:  "minptime=10;useinbandfec=1",
            RTCPFeedback: []webrtc.RTCPFeedback{},
        },
        PayloadType: 111,
    }, webrtc.RTPCodecTypeAudio); err != nil {
        log.Printf("Opus codec registration error: %v", err)
    }

    return mediaEngine
}

func init() {
// rand.Seed(time.Now().UnixNano()) // Закомментировано, т.к. randSeq не используется. Если будете использовать math/rand, раскомментируйте.
initializeMediaAPI() // Инициализируем MediaEngine при старте
}

// initializeMediaAPI настраивает MediaEngine только с H.264 и Opus
func initializeMediaAPI() {
mediaEngine := createMediaEngine("H264")
webrtcAPI = webrtc.NewAPI(
webrtc.WithMediaEngine(mediaEngine),
)
log.Println("Global MediaEngine initialized with H.264 (PT: 126) and Opus (PT: 111)")
}

// getWebRTCConfig осталась вашей функцией
func getWebRTCConfig() webrtc.Configuration {
return webrtc.Configuration{
ICEServers: []webrtc.ICEServer{
{URLs: []string{"stun:ardua.site:3478"}},
{URLs: []string{"turn:ardua.site:3478"}, Username: "user1", Credential: "pass1"},
},
ICETransportPolicy: webrtc.ICETransportPolicyAll,
BundlePolicy:       webrtc.BundlePolicyMaxBundle,
RTCPMuxPolicy:      webrtc.RTCPMuxPolicyRequire,
SDPSemantics:       webrtc.SDPSemanticsUnifiedPlan,
}
}

// logStatus осталась вашей функцией
func logStatus() {
mu.Lock()
defer mu.Unlock()
log.Printf("--- Server Status ---")
log.Printf("Total Connections: %d", len(peers))
log.Printf("Active Rooms: %d", len(rooms))
for room, roomPeers := range rooms {
var leader, follower string
users := []string{}
for username, p := range roomPeers {
users = append(users, username)
if p.isLeader {
leader = p.username
} else {
follower = p.username
}
}
log.Printf("  Room '%s' (%d users: %v) - Leader: [%s], Follower: [%s]",
room, len(roomPeers), users, leader, follower)
}
log.Printf("---------------------")
}

// sendRoomInfo осталась вашей функцией
func sendRoomInfo(room string) {
mu.Lock()
defer mu.Unlock()

    roomPeers, exists := rooms[room]
    if !exists || roomPeers == nil {
        return
    }

    var leader, follower string
    users := make([]string, 0, len(roomPeers))
    for _, peer := range roomPeers {
        users = append(users, peer.username)
        if peer.isLeader {
            leader = peer.username
        } else {
            follower = peer.username
        }
    }

    roomInfo := RoomInfo{Users: users, Leader: leader, Follower: follower}
    for _, peer := range roomPeers {
        peer.mu.Lock()
        conn := peer.conn
        if conn != nil {
            err := conn.WriteJSON(map[string]interface{}{"type": "room_info", "data": roomInfo})
            if err != nil {
                log.Printf("Error sending room info to %s (user: %s): %v", conn.RemoteAddr(), peer.username, err)
            }
        }
        peer.mu.Unlock()
    }
}

// closePeerResources - унифицированная функция для закрытия ресурсов пира
func closePeerResources(peer *Peer, reason string) {
if peer == nil {
return
}
peer.mu.Lock() // Блокируем конкретного пира

    // Сначала закрываем WebRTC соединение
    if peer.pc != nil {
        log.Printf("Closing PeerConnection for %s (Reason: %s)", peer.username, reason)
        // Небольшая задержка может иногда помочь отправить последние данные, но обычно не нужна
        // time.Sleep(100 * time.Millisecond)
        if err := peer.pc.Close(); err != nil {
            // Ошибки типа "invalid PeerConnection state" ожидаемы, если соединение уже закрывается
            // log.Printf("Error closing peer connection for %s: %v", peer.username, err)
        }
        peer.pc = nil // Помечаем как закрытое
    }

    // Затем закрываем WebSocket соединение
    if peer.conn != nil {
        log.Printf("Closing WebSocket connection for %s (Reason: %s)", peer.username, reason)
        // Отправляем управляющее сообщение о закрытии, если возможно
        _ = peer.conn.WriteControl(websocket.CloseMessage,
            websocket.FormatCloseMessage(websocket.CloseNormalClosure, reason),
            time.Now().Add(time.Second)) // Даем немного времени на отправку
        peer.conn.Close()
        peer.conn = nil // Помечаем как закрытое
    }
    peer.mu.Unlock()
}

// handlePeerJoin осталась вашей функцией с изменениями для создания PeerConnection через webrtcAPI
// handlePeerJoin обрабатывает присоединение пира к комнате
func handlePeerJoin(room string, username string, isLeader bool, conn *websocket.Conn, preferredCodec string) (*Peer, error) {
mu.Lock() // Блокируем для работы с глобальными комнатами

    if _, exists := rooms[room]; !exists {
        if !isLeader {
            mu.Unlock()
            _ = conn.WriteJSON(map[string]interface{}{"type": "error", "data": "Room does not exist. Leader must join first."})
            conn.Close()
            return nil, errors.New("room does not exist for follower")
        }
        rooms[room] = make(map[string]*Peer)
    }

    roomPeers := rooms[room] // Получаем ссылку на мапу пиров комнаты

    // Логика замены ведомого
    if !isLeader {
        hasLeader := false
        for _, p := range roomPeers {
            if p.isLeader {
                hasLeader = true
                break
            }
        }
        if !hasLeader {
            mu.Unlock()
            _ = conn.WriteJSON(map[string]interface{}{"type": "error", "data": "No leader in room"})
            conn.Close()
            return nil, errors.New("no leader in room")
        }

        var existingFollower *Peer
        // Используем переданный preferredCodec, по умолчанию H.264
        codec := preferredCodec
        if codec == "" {
            codec = "H264"
        }
        log.Printf("Follower %s prefers codec: %s in room %s", username, codec, room)

        for _, p := range roomPeers {
            if !p.isLeader { // Ищем существующего ведомого
                existingFollower = p
                break
            }
        }

        if existingFollower != nil {
            log.Printf("Replacing old follower %s with new follower %s in room %s", existingFollower.username, username, room)
            // Удаляем старого ведомого из комнаты и глобального списка peers
            delete(roomPeers, existingFollower.username)
            for addr, pItem := range peers {
                if pItem == existingFollower {
                    delete(peers, addr)
                    break
                }
            }
            mu.Unlock()
            // Отправляем команду на отключение и закрываем ресурсы старого ведомого
            existingFollower.mu.Lock()
            if existingFollower.conn != nil {
                _ = existingFollower.conn.WriteJSON(map[string]interface{}{
                    "type": "force_disconnect",
                    "data": "You have been replaced by another viewer",
                })
            }
            existingFollower.mu.Unlock()
            go closePeerResources(existingFollower, "Replaced by new follower")
            mu.Lock()
        }

        var leaderPeer *Peer
        for _, p := range roomPeers {
            if p.isLeader {
                leaderPeer = p
                break
            }
        }
        if leaderPeer != nil {
            log.Printf("Sending rejoin_and_offer command to leader %s for new follower %s with codec %s", leaderPeer.username, username, codec)
            leaderPeer.mu.Lock()
            leaderWsConn := leaderPeer.conn
            leaderPeer.mu.Unlock()

            if leaderWsConn != nil {
                mu.Unlock()
                err := leaderWsConn.WriteJSON(map[string]interface{}{
                    "type":           "rejoin_and_offer",
                    "room":           room,
                    "preferredCodec": codec,
                })
                mu.Lock()
                if err != nil {
                    log.Printf("Error sending rejoin_and_offer command to leader %s: %v", leaderPeer.username, err)
                } else {
                    log.Printf("Successfully sent rejoin_and_offer with codec %s to leader %s", codec, leaderPeer.username)
                }
            } else {
                log.Printf("Leader %s has no active WebSocket connection to send rejoin_and_offer.", leaderPeer.username)
            }
        } else {
            log.Printf("No leader found in room %s to send rejoin_and_offer.", room)
        }
    }

    // Создаем PeerConnection с учетом preferredCodec
    mediaEngine := createMediaEngine(preferredCodec)
    peerAPI := webrtc.NewAPI(webrtc.WithMediaEngine(mediaEngine))
    peerConnection, err := peerAPI.NewPeerConnection(getWebRTCConfig())
    if err != nil {
        mu.Unlock()
        return nil, fmt.Errorf("failed to create PeerConnection: %w", err)
    }
    log.Printf("PeerConnection created for %s with preferred codec %s", username, preferredCodec)

    peer := &Peer{
        conn:     conn,
        pc:       peerConnection,
        username: username,
        room:     room,
        isLeader: isLeader,
    }

    if isLeader {
        // Для лидера (Android) добавляем трансиверы
        if _, err := peerConnection.AddTransceiverFromKind(webrtc.RTPCodecTypeVideo, webrtc.RTPTransceiverInit{
            Direction: webrtc.RTPTransceiverDirectionSendonly,
        }); err != nil {
            log.Printf("Failed to add video transceiver for leader %s: %v", username, err)
        }
    } else {
        // Для ведомого (браузера) добавляем приемный трансивер
        if _, err := peerConnection.AddTransceiverFromKind(webrtc.RTPCodecTypeVideo, webrtc.RTPTransceiverInit{
            Direction: webrtc.RTPTransceiverDirectionRecvonly,
        }); err != nil {
            log.Printf("Failed to add video transceiver for follower %s: %v", username, err)
        }
    }

    if _, err := peerConnection.AddTransceiverFromKind(webrtc.RTPCodecTypeAudio, webrtc.RTPTransceiverInit{
        Direction: webrtc.RTPTransceiverDirectionSendrecv,
    }); err != nil {
        log.Printf("Failed to add audio transceiver for %s: %v", username, err)
    }

    // Настройка обработчиков ICE кандидатов и треков
    peerConnection.OnICECandidate(func(c *webrtc.ICECandidate) {
        if c == nil {
            return
        }
        peer.mu.Lock()
        defer peer.mu.Unlock()
        if peer.conn != nil {
            err := peer.conn.WriteJSON(map[string]interface{}{"type": "ice_candidate", "ice": c.ToJSON()})
            if err != nil {
                log.Printf("Error sending ICE candidate to %s: %v", peer.username, err)
            }
        }
    })

    if !isLeader {
        peerConnection.OnTrack(func(track *webrtc.TrackRemote, receiver *webrtc.RTPReceiver) {
            log.Printf("Track received for follower %s in room %s: Codec %s",
                peer.username, peer.room, track.Codec().MimeType)
        })
    }

    rooms[room][username] = peer
    peers[conn.RemoteAddr().String()] = peer

    // Отправляем room_info клиенту
    err = conn.WriteJSON(map[string]interface{}{
        "type": "room_info",
        "data": map[string]interface{}{
            "room":     room,
            "username": username,
            "isLeader": isLeader,
        },
    })
    if err != nil {
        log.Printf("Error sending room_info to %s: %v", username, err)
    } else {
        log.Printf("Sent room_info to %s", username)
    }

    mu.Unlock()
    return peer, nil
}

// main осталась вашей функцией
func main() {
// initializeMediaAPI() // Уже вызывается в init()

    http.HandleFunc("/wsgo", handleWebSocket)
    http.HandleFunc("/status", func(w http.ResponseWriter, r *http.Request) {
        logStatus()
        w.WriteHeader(http.StatusOK)
        if _, err := w.Write([]byte("Status logged to console")); err != nil {
            log.Printf("Error writing /status response: %v", err)
        }
    })

    log.Println("Server starting on :8085 (Logic: Leader Re-joins on Follower connect)")
    log.Println("WebRTC MediaEngine configured for H.264 (video) and Opus (audio).")
    logStatus() // Логируем статус при запуске
    if err := http.ListenAndServe(":8085", nil); err != nil {
        log.Fatalf("Failed to start server: %v", err)
    }
}

// handleWebSocket осталась вашей функцией с минимальными изменениями для очистки
func handleWebSocket(w http.ResponseWriter, r *http.Request) {
conn, err := upgrader.Upgrade(w, r, nil)
if err != nil {
log.Println("WebSocket upgrade error:", err)
return
}
remoteAddr := conn.RemoteAddr().String()
log.Printf("New WebSocket connection attempt from: %s", remoteAddr)

    var initData struct {
        Room           string `json:"room"`
        Username       string `json:"username"`
        IsLeader       bool   `json:"isLeader"`
        PreferredCodec string `json:"preferredCodec"`
    }
    conn.SetReadDeadline(time.Now().Add(10 * time.Second))
    err = conn.ReadJSON(&initData)
    conn.SetReadDeadline(time.Time{})

    if err != nil {
        log.Printf("Read init data error from %s: %v. Closing.", remoteAddr, err)
        conn.Close()
        return
    }
    if initData.Room == "" || initData.Username == "" {
        log.Printf("Invalid init data from %s: Room or Username is empty. Closing.", remoteAddr)
        _ = conn.WriteJSON(map[string]interface{}{"type": "error", "data": "Room and Username cannot be empty"})
        conn.Close()
        return
    }

    log.Printf("User '%s' (isLeader: %v, preferredCodec: %s) attempting to join room '%s' from %s",
        initData.Username, initData.IsLeader, initData.PreferredCodec, initData.Room, remoteAddr)

    currentPeer, err := handlePeerJoin(initData.Room, initData.Username, initData.IsLeader, conn, initData.PreferredCodec)
    if err != nil {
        log.Printf("Error handling peer join for %s: %v", initData.Username, err)
        return
    }
    if currentPeer == nil {
        log.Printf("Peer %s was not created. Connection likely closed by handlePeerJoin.", initData.Username)
        return
    }

    log.Printf("User '%s' successfully joined room '%s' as %s", currentPeer.username, currentPeer.room, map[bool]string{true: "leader", false: "follower"}[currentPeer.isLeader])
    logStatus()
    sendRoomInfo(currentPeer.room)

    // Цикл чтения сообщений от клиента
    for {
        msgType, msgBytes, err := conn.ReadMessage()
        if err != nil {
            if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure, websocket.CloseNormalClosure, websocket.CloseNoStatusReceived) {
                log.Printf("Unexpected WebSocket close error for %s (%s): %v", currentPeer.username, remoteAddr, err)
            } else {
                log.Printf("WebSocket connection closed/read error for %s (%s): %v", currentPeer.username, remoteAddr, err)
            }
            break
        }

        if msgType != websocket.TextMessage {
            log.Printf("Received non-text message type (%d) from %s. Ignoring.", msgType, currentPeer.username)
            continue
        }
        if len(msgBytes) == 0 {
            continue
        }

        var data map[string]interface{}
        if err := json.Unmarshal(msgBytes, &data); err != nil {
            log.Printf("JSON unmarshal error (for logging type) from %s: %v. Message: %s. Forwarding raw.", currentPeer.username, err, string(msgBytes))
        }
        dataType, _ := data["type"].(string)

        mu.Lock()
        roomPeers := rooms[currentPeer.room]
        var targetPeer *Peer
        if roomPeers != nil {
            for _, p := range roomPeers {
                if p.username != currentPeer.username {
                    targetPeer = p
                    break
                }
            }
        }
        mu.Unlock()

        if targetPeer == nil && (dataType == "offer" || dataType == "answer" || dataType == "ice_candidate") {
            continue
        }

        switch dataType {
        case "offer":
            log.Printf("Received offer from %s: %s", currentPeer.username, string(msgBytes))
            if currentPeer.isLeader && targetPeer != nil && !targetPeer.isLeader {
                log.Printf(">>> Forwarding Offer from %s to %s", currentPeer.username, targetPeer.username)
                // Нормализуем SDP
                preferredCodec, _ := data["preferredCodec"].(string)
                if preferredCodec == "" {
                    preferredCodec = initData.PreferredCodec
                    if preferredCodec == "" {
                        preferredCodec = "H264"
                    }
                }
                if sdp, ok := data["sdp"].(string); ok {
                    data["sdp"] = normalizeSdpForCodec(sdp, preferredCodec)
                    msgBytes, _ = json.Marshal(data)
                }
                targetPeer.mu.Lock()
                targetWsConn := targetPeer.conn
                targetPeer.mu.Unlock()
                if targetWsConn != nil {
                    if err := targetWsConn.WriteMessage(websocket.TextMessage, msgBytes); err != nil {
                        log.Printf("!!! Error forwarding offer to %s: %v", targetPeer.username, err)
                    }
                }
            } else {
                log.Printf("WARN: Received 'offer' from non-leader or no target.")
            }

        case "answer":
            if targetPeer != nil && !currentPeer.isLeader && targetPeer.isLeader {
                log.Printf("<<< Forwarding Answer from %s to %s", currentPeer.username, targetPeer.username)
                // Нормализуем SDP
                preferredCodec, _ := data["preferredCodec"].(string)
                if preferredCodec == "" {
                    preferredCodec = initData.PreferredCodec
                    if preferredCodec == "" {
                        preferredCodec = "H264"
                    }
                }
                if sdp, ok := data["sdp"].(string); ok {
                    data["sdp"] = normalizeSdpForCodec(sdp, preferredCodec)
                    msgBytes, _ = json.Marshal(data)
                }
                targetPeer.mu.Lock()
                targetWsConn := targetPeer.conn
                targetPeer.mu.Unlock()
                if targetWsConn != nil {
                    if err := targetWsConn.WriteMessage(websocket.TextMessage, msgBytes); err != nil {
                        log.Printf("!!! Error forwarding answer to %s: %v", targetPeer.username, err)
                    }
                }
            } else {
                log.Printf("WARN: Received 'answer' from non-follower or no target leader.")
            }

        case "ice_candidate":
            if targetPeer != nil {
                log.Printf("... Forwarding ICE candidate from %s to %s", currentPeer.username, targetPeer.username)
                targetPeer.mu.Lock()
                targetWsConn := targetPeer.conn
                targetPeer.mu.Unlock()
                if targetWsConn != nil {
                    if err := targetWsConn.WriteMessage(websocket.TextMessage, msgBytes); err != nil {
                        log.Printf("Error forwarding ICE candidate to %s: %v", targetPeer.username, err)
                    }
                }
            }

        case "switch_camera":
            if targetPeer != nil {
                log.Printf("Forwarding '%s' message from %s to %s", dataType, currentPeer.username, targetPeer.username)
                targetPeer.mu.Lock()
                targetWsConn := targetPeer.conn
                targetPeer.mu.Unlock()
                if targetWsConn != nil {
                    if err := targetWsConn.WriteMessage(websocket.TextMessage, msgBytes); err != nil {
                        log.Printf("Error forwarding '%s' to %s: %v", dataType, targetPeer.username, err)
                    }
                }
            }
        default:
            log.Printf("Ignoring message with type '%s' from %s", dataType, currentPeer.username)
        }
    }

    log.Printf("Cleaning up for %s (Addr: %s) in room %s after WebSocket loop ended.", currentPeer.username, remoteAddr, currentPeer.room)
    go closePeerResources(currentPeer, "WebSocket read loop ended")

    mu.Lock()
    roomName := currentPeer.room
    if currentRoomPeers, roomExists := rooms[roomName]; roomExists {
        delete(currentRoomPeers, currentPeer.username)
        if len(currentRoomPeers) == 0 {
            delete(rooms, roomName)
            log.Printf("Room %s is now empty and has been deleted.", roomName)
            roomName = ""
        }
    }
    delete(peers, remoteAddr)
    mu.Unlock()

    logStatus()
    if roomName != "" {
        sendRoomInfo(roomName)
    }
    log.Printf("Cleanup complete for WebSocket connection %s (User: %s)", remoteAddr, currentPeer.username)
}

андройд ведущий
D:\AndroidStudio\MyTest\app\src\main\java\com\example\mytest\WebRTCClient.kt
D:\AndroidStudio\MyTest\app\src\main\java\com\example\mytest\WebRTCService.kt
D:\AndroidStudio\MyTest\app\src\main\java\com\example\mytest\WebSocketClient.kt


// file: D:/AndroidStudio/MyTest/app/src/main/java/com/example/mytest/WebRTCClient.kt
package com.example.mytest

import android.content.Context
import android.os.Build
import android.util.Log
import org.webrtc.*

class WebRTCClient(
private val context: Context,
private val eglBase: EglBase,
private val localView: SurfaceViewRenderer,
private val remoteView: SurfaceViewRenderer,
private val observer: PeerConnection.Observer
) {
lateinit var peerConnectionFactory: PeerConnectionFactory
var peerConnection: PeerConnection? = null
private var localVideoTrack: VideoTrack? = null
private var localAudioTrack: AudioTrack? = null
internal var videoCapturer: VideoCapturer? = null
private var surfaceTextureHelper: SurfaceTextureHelper? = null

    init {
        initializePeerConnectionFactory()
        peerConnection = createPeerConnection()
        if (peerConnection == null) {
            throw IllegalStateException("Failed to create peer connection")
        }
        createLocalTracks()
    }

    private fun initializePeerConnectionFactory() {
        val initializationOptions = PeerConnectionFactory.InitializationOptions.builder(context)
            .setEnableInternalTracer(true)
            // Форсируем H.264 High Profile и разрешаем разные режимы пакетизации
            // 42e01f (Constrained Baseline) часто более совместим, чем High.
            // Если High Profile (обычно 64xxxx) вызывает проблемы с iOS/старыми Android, используйте:
            // .setFieldTrials("WebRTC-H264Profile/42e01f/") // Пример для Constrained Baseline
            .setFieldTrials("WebRTC-H264HighProfile/Enabled/WebRTC-H264PacketizationMode/Enabled/")
            .createInitializationOptions()
        PeerConnectionFactory.initialize(initializationOptions)

        // Используем DefaultVideoEncoderFactory, отключая другие кодеки, если возможно,
        // или SoftwareVideoEncoderFactory для большей предсказуемости H.264.
        val videoEncoderFactory: VideoEncoderFactory = DefaultVideoEncoderFactory(
            eglBase.eglBaseContext,
            false,  // disable Intel VP8 encoder
            true    // enable H264 High Profile (или false, если H264 обеспечивается платформой/Software factory)
        )
        // Альтернатива для большей стабильности H.264, если есть проблемы с аппаратными кодерами:
        // val videoEncoderFactory: VideoEncoderFactory = SoftwareVideoEncoderFactory()

        val videoDecoderFactory: VideoDecoderFactory = DefaultVideoDecoderFactory(eglBase.eglBaseContext)
        // Альтернатива:
        // val videoDecoderFactory: VideoDecoderFactory = SoftwareVideoDecoderFactory()


        peerConnectionFactory = PeerConnectionFactory.builder()
            .setVideoEncoderFactory(videoEncoderFactory)
            .setVideoDecoderFactory(videoDecoderFactory)
            .setOptions(PeerConnectionFactory.Options().apply {
                disableEncryption = false
                disableNetworkMonitor = false
            })
            .createPeerConnectionFactory()
    }

    private fun createPeerConnection(): PeerConnection? {
        val rtcConfig = PeerConnection.RTCConfiguration(listOf(
            PeerConnection.IceServer.builder("stun:ardua.site:3478").createIceServer(),
            PeerConnection.IceServer.builder("turn:ardua.site:3478")
                .setUsername("user1")
                .setPassword("pass1")
                .createIceServer()
        )).apply {

            sdpSemantics = PeerConnection.SdpSemantics.UNIFIED_PLAN
            continualGatheringPolicy = PeerConnection.ContinualGatheringPolicy.GATHER_CONTINUALLY
            iceTransportsType = PeerConnection.IceTransportsType.ALL
            bundlePolicy = PeerConnection.BundlePolicy.MAXBUNDLE
            rtcpMuxPolicy = PeerConnection.RtcpMuxPolicy.REQUIRE
            tcpCandidatePolicy = PeerConnection.TcpCandidatePolicy.ENABLED
            candidateNetworkPolicy = PeerConnection.CandidateNetworkPolicy.ALL
            keyType = PeerConnection.KeyType.ECDSA
        }

        return peerConnectionFactory.createPeerConnection(rtcConfig, observer)
    }

    // В WebRTCClient.kt добавляем обработку переключения камеры
    internal fun switchCamera(useBackCamera: Boolean) {
        try {
            videoCapturer?.let { capturer ->
                if (capturer is CameraVideoCapturer) {
                    if (useBackCamera) {
                        // Switch to back camera
                        val cameraEnumerator = Camera2Enumerator(context)
                        val deviceNames = cameraEnumerator.deviceNames
                        deviceNames.find { !cameraEnumerator.isFrontFacing(it) }?.let { backCameraId ->
                            capturer.switchCamera(object : CameraVideoCapturer.CameraSwitchHandler {
                                override fun onCameraSwitchDone(isFrontCamera: Boolean) {
                                    Log.d("WebRTCClient", "Switched to back camera")
                                }

                                override fun onCameraSwitchError(error: String) {
                                    Log.e("WebRTCClient", "Error switching to back camera: $error")
                                }
                            })
                        }
                    } else {
                        // Switch to front camera
                        val cameraEnumerator = Camera2Enumerator(context)
                        val deviceNames = cameraEnumerator.deviceNames
                        deviceNames.find { cameraEnumerator.isFrontFacing(it) }?.let { frontCameraId ->
                            capturer.switchCamera(object : CameraVideoCapturer.CameraSwitchHandler {
                                override fun onCameraSwitchDone(isFrontCamera: Boolean) {
                                    Log.d("WebRTCClient", "Switched to front camera")
                                }

                                override fun onCameraSwitchError(error: String) {
                                    Log.e("WebRTCClient", "Error switching to front camera: $error")
                                }
                            })
                        }
                    }
                }
            }
        } catch (e: Exception) {
            Log.e("WebRTCClient", "Error switching camera", e)
        }
    }

    private fun createLocalTracks() {
        createAudioTrack()
        createVideoTrack()

        val streamId = "ARDAMS"
        val stream = peerConnectionFactory.createLocalMediaStream(streamId)

        localAudioTrack?.let {
            stream.addTrack(it)
            peerConnection?.addTrack(it, listOf(streamId))
        }

        localVideoTrack?.let {
            stream.addTrack(it)
            peerConnection?.addTrack(it, listOf(streamId))
        }
    }

    private fun createAudioTrack() {
        val audioConstraints = MediaConstraints().apply {
            mandatory.add(MediaConstraints.KeyValuePair("googEchoCancellation", "true"))
            mandatory.add(MediaConstraints.KeyValuePair("googAutoGainControl", "true"))
            mandatory.add(MediaConstraints.KeyValuePair("googHighpassFilter", "true"))
            mandatory.add(MediaConstraints.KeyValuePair("googNoiseSuppression", "true"))
        }

        val audioSource = peerConnectionFactory.createAudioSource(audioConstraints)
        localAudioTrack = peerConnectionFactory.createAudioTrack("ARDAMSa0", audioSource)
    }

    private fun createVideoTrack() {
        try {
            videoCapturer = createCameraCapturer()
            videoCapturer?.let { capturer ->
                surfaceTextureHelper = SurfaceTextureHelper.create(
                    "CaptureThread",
                    eglBase.eglBaseContext
                )

                val videoSource = peerConnectionFactory.createVideoSource(false)
                capturer.initialize(
                    surfaceTextureHelper,
                    context,
                    videoSource.capturerObserver
                )

                // Старт с оптимальными параметрами для H264
                capturer.startCapture(640, 480, 15) // 640x480 @ 15fps

                localVideoTrack = peerConnectionFactory.createVideoTrack("ARDAMSv0", videoSource).apply {
                    addSink(localView)
                }

                // Устанавливаем начальный битрейт
                setVideoEncoderBitrate(300000, 400000, 500000) // 300-500 kbps
            }
        } catch (e: Exception) {
            Log.e("WebRTCClient", "Error creating video track", e)
        }
    }

    // Функция для установки битрейта
    fun setVideoEncoderBitrate(minBitrate: Int, currentBitrate: Int, maxBitrate: Int) {
        try {
            val sender = peerConnection?.senders?.find { it.track()?.kind() == "video" }
            sender?.let { videoSender ->
                val parameters = videoSender.parameters
                if (parameters.encodings.isNotEmpty()) {
                    parameters.encodings[0].minBitrateBps = minBitrate
                    parameters.encodings[0].maxBitrateBps = maxBitrate
                    parameters.encodings[0].bitratePriority = 1.0
                    videoSender.parameters = parameters
                }
            }
        } catch (e: Exception) {
            Log.e("WebRTCClient", "Error setting video bitrate", e)
        }
    }



    private fun createCameraCapturer(): VideoCapturer? {
        return Camera2Enumerator(context).run {
            deviceNames.find { isFrontFacing(it) }?.let {
                Log.d("WebRTC", "Using front camera: $it")
                createCapturer(it, null)
            } ?: deviceNames.firstOrNull()?.let {
                Log.d("WebRTC", "Using first available camera: $it")
                createCapturer(it, null)
            }
        }
    }

    fun close() {
        try {
            videoCapturer?.let { capturer ->
                try {
                    capturer.stopCapture()
                } catch (e: Exception) {
                    Log.e("WebRTCClient", "Error stopping capturer", e)
                }
                try {
                    capturer.dispose()
                } catch (e: Exception) {
                    Log.e("WebRTCClient", "Error disposing capturer", e)
                }
            }

            localVideoTrack?.let { track ->
                try {
                    track.removeSink(localView)
                    track.dispose()
                } catch (e: Exception) {
                    Log.e("WebRTCClient", "Error disposing video track", e)
                }
            }

            localAudioTrack?.let { track ->
                try {
                    track.dispose()
                } catch (e: Exception) {
                    Log.e("WebRTCClient", "Error disposing audio track", e)
                }
            }

            surfaceTextureHelper?.let { helper ->
                try {
                    helper.dispose()
                } catch (e: Exception) {
                    Log.e("WebRTCClient", "Error disposing surface helper", e)
                }
            }

            peerConnection?.let { pc ->
                try {
                    pc.close()
                } catch (e: Exception) {
                    Log.e("WebRTCClient", "Error closing peer connection", e)
                }
                try {
                    pc.dispose()
                } catch (e: Exception) {
                    Log.e("WebRTCClient", "Error disposing peer connection", e)
                }
            }
        } catch (e: Exception) {
            Log.e("WebRTCClient", "Error in cleanup", e)
        } finally {
            videoCapturer = null
            localVideoTrack = null
            localAudioTrack = null
            surfaceTextureHelper = null
            peerConnection = null
        }
    }
}

// file: D:/AndroidStudio/MyTest/app/src/main/java/com/example/mytest/WebRTCService.kt
// file: src/main/java/com/example/mytest/WebRTCService.kt
package com.example.mytest

import android.annotation.SuppressLint
import android.app.*
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.ServiceInfo
import android.net.ConnectivityManager
import android.net.Network
import android.os.*
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import org.json.JSONObject
import org.webrtc.*
import okhttp3.WebSocketListener
import java.util.concurrent.TimeUnit
import android.net.NetworkRequest
import androidx.work.Constraints
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType

class WebRTCService : Service() {

    companion object {
        var isRunning = false
            private set
        var currentRoomName = ""
        const val ACTION_SERVICE_STATE = "com.example.mytest.SERVICE_STATE"
        const val EXTRA_IS_RUNNING = "is_running"
    }

    private val stateReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            if (intent.action == ACTION_SERVICE_STATE) {
                val isRunning = intent.getBooleanExtra(EXTRA_IS_RUNNING, false)
                // Можно обновить UI активности, если она видима
            }
        }
    }

    private fun sendServiceStateUpdate() {
        val intent = Intent(ACTION_SERVICE_STATE).apply {
            putExtra(EXTRA_IS_RUNNING, isRunning)
        }
        sendBroadcast(intent)
    }

    private var isConnected = false // Флаг подключения
    private var isConnecting = false // Флаг процесса подключения

    private var shouldStop = false
    private var isUserStopped = false

    private val binder = LocalBinder()
    private lateinit var webSocketClient: WebSocketClient
    private lateinit var webRTCClient: WebRTCClient
    private lateinit var eglBase: EglBase

    private var reconnectAttempts = 0
    private val maxReconnectAttempts = 10
    private val reconnectDelay = 5000L // 5 секунд

    private lateinit var remoteView: SurfaceViewRenderer

    private var roomName = "room1" // Будет перезаписано при старте
    private val userName = Build.MODEL ?: "AndroidDevice"
    private val webSocketUrl = "wss://ardua.site/wsgo"

    private val notificationId = 1
    private val channelId = "webrtc_service_channel"
    private val handler = Handler(Looper.getMainLooper())

    private var isStateReceiverRegistered = false
    private var isConnectivityReceiverRegistered = false

    private var isEglBaseReleased = false

    inner class LocalBinder : Binder() {
        fun getService(): WebRTCService = this@WebRTCService
    }

    override fun onBind(intent: Intent?): IBinder = binder

    private val connectivityReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            if (!isInitialized() || !webSocketClient.isConnected()) {
                reconnect()
            }
        }
    }

    private fun isValidSdp(sdp: String, codecName: String): Boolean {
        val hasVideoSection = sdp.contains("m=video")
        val hasCodec = sdp.contains("a=rtpmap:.*$codecName")
        if (!hasVideoSection || !hasCodec) {
            Log.e("WebRTCService", "SDP validation failed: hasVideoSection=$hasVideoSection, hasCodec=$hasCodec")
            return false
        }
        return true
    }

    private val webSocketListener = object : WebSocketListener() {
        override fun onMessage(webSocket: okhttp3.WebSocket, text: String) {
            try {
                val message = JSONObject(text)
                handleWebSocketMessage(message)
            } catch (e: Exception) {
                Log.e("WebRTCService", "WebSocket message parse error", e)
            }
        }

        override fun onOpen(webSocket: okhttp3.WebSocket, response: okhttp3.Response) {
            Log.d("WebRTCService", "WebSocket connected for room: $roomName")
            isConnected = true
            isConnecting = false
            reconnectAttempts = 0 // Сбрасываем счетчик попыток
            updateNotification("Connected to server")
            joinRoom()
        }

        override fun onClosed(webSocket: okhttp3.WebSocket, code: Int, reason: String) {
            Log.d("WebRTCService", "WebSocket disconnected, code: $code, reason: $reason")
            isConnected = false
            if (code != 1000) { // Если это не нормальное закрытие
                scheduleReconnect()
            }
        }

        override fun onFailure(webSocket: okhttp3.WebSocket, t: Throwable, response: okhttp3.Response?) {
            Log.e("WebRTCService", "WebSocket error: ${t.message}")
            isConnected = false
            isConnecting = false
            updateNotification("Error: ${t.message?.take(30)}...")
            scheduleReconnect()
        }
    }

    private val networkCallback = object : ConnectivityManager.NetworkCallback() {
        override fun onAvailable(network: Network) {
            super.onAvailable(network)
            handler.post { reconnect() }
        }

        override fun onLost(network: Network) {
            super.onLost(network)
            handler.post { updateNotification("Network lost") }
        }
    }

    private val healthCheckRunnable = object : Runnable {
        override fun run() {
            if (!isServiceActive()) {
                reconnect()
            }
            handler.postDelayed(this, 30000) // Проверка каждые 30 секунд
        }
    }

    // Добавляем в класс WebRTCService
    private val bandwidthEstimationRunnable = object : Runnable {
        override fun run() {
            if (isConnected) {
                adjustVideoQualityBasedOnStats()
            }
            handler.postDelayed(this, 10000) // Каждые 10 секунд
        }
    }

    private fun adjustVideoQualityBasedOnStats() {
        webRTCClient.peerConnection?.getStats { statsReport ->
            try {
                var videoPacketsLost = 0L
                var videoPacketsSent = 0L
                var availableSendBandwidth = 0L

                statsReport.statsMap.values.forEach { stats ->
                    when {
                        stats.type == "outbound-rtp" && stats.id.contains("video") -> {
                            videoPacketsLost += stats.members["packetsLost"] as? Long ?: 0L
                            videoPacketsSent += stats.members["packetsSent"] as? Long ?: 1L
                        }
                        stats.type == "candidate-pair" && stats.members["state"] == "succeeded" -> {
                            availableSendBandwidth = stats.members["availableOutgoingBitrate"] as? Long ?: 0L
                        }
                    }
                }

                if (videoPacketsSent > 0) {
                    val lossRate = videoPacketsLost.toDouble() / videoPacketsSent.toDouble()
                    handler.post {
                        when {
                            lossRate > 0.1 -> reduceVideoQuality() // >10% потерь
                            lossRate < 0.05 && availableSendBandwidth > 700000 -> increaseVideoQuality() // <5% потерь и хорошая пропускная способность
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e("WebRTCService", "Error processing stats", e)
            }
        }
    }

    private fun reduceVideoQuality() {
        try {
            webRTCClient.videoCapturer?.let { capturer ->
                capturer.stopCapture()
                capturer.startCapture(480, 360, 15)
                webRTCClient.setVideoEncoderBitrate(150000, 200000, 300000)
                Log.d("WebRTCService", "Reduced video quality to 480x360@15fps, 200kbps")
            }
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error reducing video quality", e)
        }
    }

    private fun increaseVideoQuality() {
        try {
            webRTCClient.videoCapturer?.let { capturer ->
                capturer.stopCapture()
                capturer.startCapture(640, 480, 20)
                webRTCClient.setVideoEncoderBitrate(300000, 400000, 500000)
                Log.d("WebRTCService", "Increased video quality to 640x480@20fps, 400kbps")
            }
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error increasing video quality", e)
        }
    }

    @SuppressLint("UnspecifiedRegisterReceiverFlag")
    override fun onCreate() {
        super.onCreate()
        isRunning = true

        // Инициализация имени комнаты из статического поля
        roomName = currentRoomName

        val alarmManager = getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(this, WebRTCService::class.java).apply {
            action = "CHECK_CONNECTION"
        }
        val pendingIntent = PendingIntent.getService(
            this, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        handler.post(healthCheckRunnable)

        alarmManager.setInexactRepeating(
            AlarmManager.ELAPSED_REALTIME_WAKEUP,
            SystemClock.elapsedRealtime() + AlarmManager.INTERVAL_FIFTEEN_MINUTES,
            AlarmManager.INTERVAL_FIFTEEN_MINUTES,
            pendingIntent
        )

        Log.d("WebRTCService", "Service created with room: $roomName")
        sendServiceStateUpdate()
        handler.post(bandwidthEstimationRunnable)
        try {
            registerReceiver(connectivityReceiver, IntentFilter(ConnectivityManager.CONNECTIVITY_ACTION))
            isConnectivityReceiverRegistered = true
            registerReceiver(stateReceiver, IntentFilter(ACTION_SERVICE_STATE))
            isStateReceiverRegistered = true
            createNotificationChannel()
            startForegroundService()
            initializeWebRTC()
            connectWebSocket()
            registerNetworkCallback() // Добавлен вызов регистрации коллбэка сети
        } catch (e: Exception) {
            Log.e("WebRTCService", "Initialization failed", e)
            stopSelf()
        }
    }

    private fun registerNetworkCallback() {
        val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            cm.registerDefaultNetworkCallback(networkCallback)
        } else {
            val request = NetworkRequest.Builder().build()
            cm.registerNetworkCallback(request, networkCallback)
        }
    }

    private fun isServiceActive(): Boolean {
        return ::webSocketClient.isInitialized && webSocketClient.isConnected()
    }


    private fun startForegroundService() {
        val notification = createNotification()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            try {
                startForeground(
                    notificationId,
                    notification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION or
                            ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA or
                            ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
                )
            } catch (e: SecurityException) {
                Log.e("WebRTCService", "SecurityException: ${e.message}")
                startForeground(notificationId, notification)
            }
        } else {
            startForeground(notificationId, notification)
        }
    }

    private fun initializeWebRTC() {
        Log.d("WebRTCService", "Initializing new WebRTC connection")
        cleanupWebRTCResources()
        eglBase = EglBase.create()
        isEglBaseReleased = false
        val localView = SurfaceViewRenderer(this).apply {
            init(eglBase.eglBaseContext, null)
            setMirror(true)
        }
        remoteView = SurfaceViewRenderer(this).apply {
            init(eglBase.eglBaseContext, null)
        }
        webRTCClient = WebRTCClient(
            context = this,
            eglBase = eglBase,
            localView = localView,
            remoteView = remoteView,
            observer = createPeerConnectionObserver()
        )
        webRTCClient.setVideoEncoderBitrate(300000, 400000, 500000)
    }

    private fun createPeerConnectionObserver() = object : PeerConnection.Observer {
        override fun onIceCandidate(candidate: IceCandidate?) {
            candidate?.let {
                Log.d("WebRTCService", "Local ICE candidate: ${it.sdpMid}:${it.sdpMLineIndex} ${it.sdp}")
                sendIceCandidate(it)
            }
        }

        override fun onIceConnectionChange(state: PeerConnection.IceConnectionState?) {
            Log.d("WebRTCService", "ICE connection state: $state")
            when (state) {
                PeerConnection.IceConnectionState.CONNECTED ->
                    updateNotification("Connection established")
                PeerConnection.IceConnectionState.DISCONNECTED ->
                    updateNotification("Connection lost")
                else -> {}
            }
        }

        override fun onSignalingChange(p0: PeerConnection.SignalingState?) {}
        override fun onIceConnectionReceivingChange(p0: Boolean) {}
        override fun onIceGatheringChange(p0: PeerConnection.IceGatheringState?) {}
        override fun onIceCandidatesRemoved(p0: Array<out IceCandidate>?) {}
        override fun onAddStream(stream: MediaStream?) {
            stream?.videoTracks?.forEach { track ->
                Log.d("WebRTCService", "Adding remote video track from stream")
                track.addSink(remoteView)
            }
        }
        override fun onRemoveStream(p0: MediaStream?) {}
        override fun onDataChannel(p0: DataChannel?) {}
        override fun onRenegotiationNeeded() {}
        override fun onAddTrack(p0: RtpReceiver?, p1: Array<out MediaStream>?) {}
        override fun onTrack(transceiver: RtpTransceiver?) {
            transceiver?.receiver?.track()?.let { track ->
                handler.post {
                    when (track.kind()) {
                        "video" -> {
                            Log.d("WebRTCService", "Video track received")
                            (track as VideoTrack).addSink(remoteView)
                        }
                        "audio" -> {
                            Log.d("WebRTCService", "Audio track received")
                        }
                    }
                }
            }
        }
    }

    private fun cleanupWebRTCResources() {
        try {
            if (::webRTCClient.isInitialized) {
                webRTCClient.close()
                Log.d("WebRTCService", "WebRTCClient closed")
            }
            if (::eglBase.isInitialized && !isEglBaseReleased) {
                eglBase.release()
                isEglBaseReleased = true
                Log.d("WebRTCService", "EglBase released")
            }
            if (::remoteView.isInitialized) {
                remoteView.clearImage()
                remoteView.release()
                Log.d("WebRTCService", "remoteView released")
            }
            Log.d("WebRTCService", "WebRTC resources cleaned up")
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error cleaning WebRTC resources", e)
        }
    }

    private fun connectWebSocket() {
        if (isConnected || isConnecting) {
            Log.d("WebRTCService", "Already connected or connecting, skipping")
            return
        }

        isConnecting = true
        webSocketClient = WebSocketClient(webSocketListener)
        webSocketClient.connect(webSocketUrl)
    }

    private fun scheduleReconnect() {
        if (isUserStopped) {
            Log.d("WebRTCService", "Service stopped by user, not reconnecting")
            return
        }

        handler.removeCallbacksAndMessages(null)

        reconnectAttempts++
        val delay = when {
            reconnectAttempts < 5 -> 5000L
            reconnectAttempts < 10 -> 15000L
            else -> 60000L
        }

        Log.d("WebRTCService", "Scheduling reconnect in ${delay/1000} seconds (attempt $reconnectAttempts)")
        updateNotification("Reconnecting in ${delay/1000}s...")

        handler.postDelayed({
            if (!isConnected && !isConnecting) {
                Log.d("WebRTCService", "Executing reconnect attempt $reconnectAttempts")
                reconnect()
            } else {
                Log.d("WebRTCService", "Already connected or connecting, skipping scheduled reconnect")
            }
        }, delay)
    }

    private fun reconnect() {
        if (isConnected || isConnecting) {
            Log.d("WebRTCService", "Already connected or connecting, skipping manual reconnect")
            return
        }

        handler.post {
            try {
                Log.d("WebRTCService", "Starting reconnect process")

                // Получаем последнее сохраненное имя комнаты
                val sharedPrefs = getSharedPreferences("WebRTCPrefs", Context.MODE_PRIVATE)
                val lastRoomName = sharedPrefs.getString("last_used_room", "")

                // Если имя комнаты пустое, используем дефолтное значение
                roomName = if (lastRoomName.isNullOrEmpty()) {
                    "default_room_${System.currentTimeMillis()}"
                } else {
                    lastRoomName
                }

                // Обновляем текущее имя комнаты
                currentRoomName = roomName
                Log.d("WebRTCService", "Reconnecting to room: $roomName")

                // Очищаем предыдущие соединения
                if (::webSocketClient.isInitialized) {
                    webSocketClient.disconnect()
                }

                // Инициализируем заново
                initializeWebRTC()
                connectWebSocket()

            } catch (e: Exception) {
                Log.e("WebRTCService", "Reconnection error", e)
                isConnecting = false
                scheduleReconnect()
            }
        }
    }

    private fun joinRoom() {
        try {
            val message = JSONObject().apply {
                put("action", "join")
                put("room", roomName)
                put("username", userName)
                put("isLeader", true)
            }
            webSocketClient.send(message.toString())
            Log.d("WebRTCService", "Sent join request for room: $roomName")
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error joining room: $roomName", e)
        }
    }

    private fun handleBandwidthEstimation(estimation: Long) {
        handler.post {
            try {
                // Адаптируем качество видео в зависимости от доступной полосы
                val width = when {
                    estimation > 1500000 -> 1280 // 1.5 Mbps+
                    estimation > 500000 -> 854  // 0.5-1.5 Mbps
                    else -> 640                // <0.5 Mbps
                }

                val height = (width * 9 / 16)

                webRTCClient.videoCapturer?.let { capturer ->
                    capturer.stopCapture()
                    capturer.startCapture(width, height, 24)
                    Log.d("WebRTCService", "Adjusted video to ${width}x${height} @24fps")
                }
            } catch (e: Exception) {
                Log.e("WebRTCService", "Error adjusting video quality", e)
            }
        }
    }

    private fun handleWebSocketMessage(message: JSONObject) {
        Log.d("WebRTCService", "Received: $message")

        try {
            val isLeader = message.optBoolean("isLeader", false)

            when (message.optString("type")) {
                "rejoin_and_offer" -> {
                    Log.d("WebRTCService", "Received rejoin command from server")
                    val preferredCodec = message.optString("preferredCodec", "H264")
                    handler.post {
                        cleanupWebRTCResources()
                        initializeWebRTC()
                        createOffer(preferredCodec)
                    }
                }
                "create_offer_for_new_follower" -> {
                    Log.d("WebRTCService", "Received request to create offer for new follower")
                    handler.post {
                        createOffer("VP8") // Согласованность с браузером
                    }
                }
                "bandwidth_estimation" -> {
                    val estimation = message.optLong("estimation", 1000000)
                    handleBandwidthEstimation(estimation)
                }
                "offer" -> {
                    if (!isLeader) {
                        Log.w("WebRTCService", "Received offer from non-leader, ignoring")
                        return
                    }
                    handleOffer(message)
                }
                "answer" -> handleAnswer(message)
                "ice_candidate" -> handleIceCandidate(message)
                "room_info" -> {}
                "switch_camera" -> {
                    val useBackCamera = message.optBoolean("useBackCamera", false)
                    Log.d("WebRTCService", "Received switch camera command: useBackCamera=$useBackCamera")
                    handler.post {
                        webRTCClient.switchCamera(useBackCamera)
                        sendCameraSwitchAck(useBackCamera)
                    }
                }
                else -> Log.w("WebRTCService", "Unknown message type")
            }
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error handling message", e)
        }
    }

    // Вспомогательная функция для модификации SDP на Android
    private fun normalizeSdpForCodec(sdp: String, targetCodec: String, targetBitrateAs: Int = 500): String {
        var newSdp = sdp
        val codecName = when (targetCodec) {
            "H264" -> "H264"
            "VP8" -> "VP8"
            else -> {
                Log.w("WebRTCService", "Unknown target codec: $targetCodec, defaulting to H264")
                "H264"
            }
        }

        // 1. Найти payload type для целевого кодека
        val rtpmapRegex = "a=rtpmap:(\\d+) $codecName(?:/\\d+)?".toRegex()
        val rtpmapMatches = rtpmapRegex.findAll(newSdp)
        val targetPayloadTypes = rtpmapMatches.map { it.groupValues[1] }.toList()

        if (targetPayloadTypes.isEmpty()) {
            Log.w("WebRTCService", "$codecName payload type not found in SDP")
            return newSdp
        }

        val targetPayloadType = targetPayloadTypes.first()
        Log.d("WebRTCService", "Found $codecName payload type: $targetPayloadType")

        // 2. Удалить другие видеокодеки
        val videoCodecsToRemove = when (codecName) {
            "H264" -> listOf("VP8", "VP9", "AV1")
            "VP8" -> listOf("H264", "VP9", "AV1")
            else -> emptyList()
        }
        for (codecToRemove in videoCodecsToRemove) {
            val ptToRemoveRegex = "a=rtpmap:(\\d+) $codecToRemove(?:/\\d+)?\r\n".toRegex()
            var matchResult = ptToRemoveRegex.find(newSdp)
            while (matchResult != null) {
                val pt = matchResult.groupValues[1]
                newSdp = newSdp.replace("a=rtpmap:$pt $codecToRemove(?:/\\d+)?\r\n".toRegex(), "")
                newSdp = newSdp.replace("a=fmtp:$pt .*\r\n".toRegex(), "")
                newSdp = newSdp.replace("a=rtcp-fb:$pt .*\r\n".toRegex(), "")
                Log.d("WebRTCService", "Removed $codecToRemove (PT: $pt) from SDP")
                matchResult = ptToRemoveRegex.find(newSdp)
            }
        }

        // 3. Модифицировать fmtp только для H264
        if (codecName == "H264") {
            val desiredFmtp = "profile-level-id=42e01f;level-asymmetry-allowed=1;packetization-mode=1"
            for (pt in targetPayloadTypes) {
                val fmtpSearchRegex = "a=fmtp:$pt .*\r\n".toRegex()
                val newFmtpLine = "a=fmtp:$pt $desiredFmtp\r\n"
                if (newSdp.contains(fmtpSearchRegex)) {
                    newSdp = newSdp.replace(fmtpSearchRegex, newFmtpLine)
                } else {
                    newSdp = newSdp.replace(
                        "a=rtpmap:$pt $codecName(?:/\\d+)?\r\n",
                        "a=rtpmap:$pt $codecName/90000\r\n$newFmtpLine"
                    )
                }
                Log.d("WebRTCService", "Set $codecName (PT: $pt) fmtp to: $desiredFmtp")
            }
        }

        // 4. Убедиться, что целевой кодек первый в m=video линии
        val mLineRegex = "^(m=video\\s+\\d+\\s+UDP/(?:TLS/)?RTP/SAVPF\\s+)(.*)".toRegex(RegexOption.MULTILINE)
        newSdp = mLineRegex.replace(newSdp) { mLineMatchResult ->
            val prefix = mLineMatchResult.groupValues[1]
            var payloads = mLineMatchResult.groupValues[2].split(" ").toMutableList()
            val activePayloadTypesInSdp = "a=rtpmap:(\\d+)".toRegex().findAll(newSdp).map { it.groupValues[1] }.toSet()
            payloads = payloads.filter { activePayloadTypesInSdp.contains(it) }.toMutableList()
            val targetPtsInOrder = targetPayloadTypes.filter { payloads.contains(it) }
            targetPtsInOrder.forEach { payloads.remove(it) }
            payloads.addAll(0, targetPtsInOrder)
            Log.d("WebRTCService", "Reordered m=video payloads to: ${payloads.joinToString(" ")}")
            prefix + payloads.joinToString(" ")
        }

        // 5. Установить битрейт для видео секции
        newSdp = newSdp.replace(Regex("^(a=mid:video\r\n(?:(?!a=mid:).*\r\n)*?)b=(AS|TIAS):\\d+\r\n", RegexOption.MULTILINE), "$1")
        newSdp = newSdp.replace("a=mid:video\r\n", "a=mid:video\r\nb=AS:$targetBitrateAs\r\n")
        Log.d("WebRTCService", "Set video bitrate to AS:$targetBitrateAs")

        // 6. Проверка валидности SDP
        if (!newSdp.contains("m=video") || !newSdp.contains("a=rtpmap:.*$codecName")) {
            Log.e("WebRTCService", "Invalid SDP after modification: missing m=video or $codecName")
            return sdp
        }

        return newSdp
    }

    // Модифицируем createOffer для принудительного создания нового оффера
    private fun createOffer(preferredCodec: String = "H264") {
        try {
            if (!::webRTCClient.isInitialized || !isConnected) {
                Log.w("WebRTCService", "Cannot create offer - not initialized or connected")
                return
            }

            // Настройка кодеков через RTCRtpTransceiver
            webRTCClient.peerConnection?.transceivers?.filter {
                it.mediaType == MediaStreamTrack.MediaType.MEDIA_TYPE_VIDEO && it.sender != null
            }?.forEach { transceiver ->
                try {
                    val sender = transceiver.sender
                    val parameters = sender.parameters
                    if (parameters != null) {
                        val targetCodecs = parameters.codecs.filter { codecInfo ->
                            codecInfo.name.equals(preferredCodec, ignoreCase = true)
                        }
                        if (targetCodecs.isNotEmpty()) {
                            parameters.codecs = ArrayList(targetCodecs)
                            val result = sender.setParameters(parameters)
                            Log.d("WebRTCService", "Set $preferredCodec codec preference: $result")
                        } else {
                            Log.w("WebRTCService", "$preferredCodec codec not found in sender parameters")
                        }
                    }
                } catch (e: Exception) {
                    Log.e("WebRTCService", "Error setting codec preferences", e)
                }
            }

            val constraints = MediaConstraints().apply {
                mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveAudio", "true"))
                mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveVideo", "true"))
                mandatory.add(MediaConstraints.KeyValuePair("googCpuOveruseDetection", "true"))
                mandatory.add(MediaConstraints.KeyValuePair("googScreencastMinBitrate", "300"))
            }

            webRTCClient.peerConnection?.createOffer(object : SdpObserver {
                override fun onCreateSuccess(desc: SessionDescription) {
                    Log.d("WebRTCService", "Original Local Offer SDP:\n${desc.description}")
                    val modifiedSdp = normalizeSdpForCodec(desc.description, preferredCodec, 300)
                    Log.d("WebRTCService", "Modified Local Offer SDP:\n$modifiedSdp")

                    if (!isValidSdp(modifiedSdp, preferredCodec)) {
                        Log.e("WebRTCService", "Falling back to original SDP due to invalid modification")
                        webRTCClient.peerConnection?.setLocalDescription(
                            object : SdpObserver {
                                override fun onSetSuccess() {
                                    Log.d("WebRTCService", "Successfully set original local description")
                                    sendSessionDescription(desc)
                                }
                                override fun onSetFailure(error: String) {
                                    Log.e("WebRTCService", "Error setting original local description: $error")
                                }
                                override fun onCreateSuccess(p0: SessionDescription?) {}
                                override fun onCreateFailure(error: String) {}
                            }, desc
                        )
                        return
                    }

                    val modifiedDesc = SessionDescription(desc.type, modifiedSdp)
                    webRTCClient.peerConnection?.setLocalDescription(
                        object : SdpObserver {
                            override fun onSetSuccess() {
                                Log.d("WebRTCService", "Successfully set local description")
                                sendSessionDescription(modifiedDesc)
                            }
                            override fun onSetFailure(error: String) {
                                Log.e("WebRTCService", "Error setting local description: $error")
                            }
                            override fun onCreateSuccess(p0: SessionDescription?) {}
                            override fun onCreateFailure(error: String) {}
                        }, modifiedDesc
                    )
                }

                override fun onCreateFailure(error: String) {
                    Log.e("WebRTCService", "Error creating offer: $error")
                }
                override fun onSetSuccess() {}
                override fun onSetFailure(error: String) {}
            }, constraints)
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error in createOffer", e)
        }
    }

    // Метод для отправки подтверждения переключения камеры
    private fun sendCameraSwitchAck(useBackCamera: Boolean) {
        try {
            val message = JSONObject().apply {
                put("type", "switch_camera_ack")
                put("useBackCamera", useBackCamera)
                put("success", true)
                put("room", roomName)
                put("username", userName)
            }
            webSocketClient.send(message.toString())
            Log.d("WebRTCService", "Sent camera switch ack")
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error sending camera switch ack", e)
        }
    }

    private fun handleOffer(offer: JSONObject) {
        try {
            val sdp = offer.getJSONObject("sdp")
            val sessionDescription = SessionDescription(
                SessionDescription.Type.OFFER,
                sdp.getString("sdp")
            )

            // Извлекаем preferredCodec из сообщения или используем значение по умолчанию
            val preferredCodec = offer.optString("preferredCodec", "H264")

            webRTCClient.peerConnection?.setRemoteDescription(object : SdpObserver {
                override fun onSetSuccess() {
                    val constraints = MediaConstraints().apply {
                        mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveAudio", "true"))
                        mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveVideo", "true"))
                    }
                    createAnswer(constraints, preferredCodec)
                }

                override fun onSetFailure(error: String) {
                    Log.e("WebRTCService", "Error setting remote description: $error")
                }
                override fun onCreateSuccess(p0: SessionDescription?) {}
                override fun onCreateFailure(error: String) {}
            }, sessionDescription)
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error handling offer", e)
        }
    }

    private fun createAnswer(constraints: MediaConstraints, preferredCodec: String = "H264") {
        try {
            webRTCClient.peerConnection?.createAnswer(object : SdpObserver {
                override fun onCreateSuccess(desc: SessionDescription) {
                    Log.d("WebRTCService", "Original Local Answer SDP:\n${desc.description}")
                    val modifiedSdp = normalizeSdpForCodec(desc.description, preferredCodec, 300)
                    Log.d("WebRTCService", "Modified Local Answer SDP:\n$modifiedSdp")

                    if (!isValidSdp(modifiedSdp, preferredCodec)) {
                        Log.e("WebRTCService", "Falling back to original SDP due to invalid modification")
                        webRTCClient.peerConnection?.setLocalDescription(object : SdpObserver {
                            override fun onSetSuccess() {
                                Log.d("WebRTCService", "Successfully set original local description")
                                sendSessionDescription(desc)
                            }
                            override fun onSetFailure(error: String) {
                                Log.e("WebRTCService", "Error setting original local description: $error")
                            }
                            override fun onCreateSuccess(p0: SessionDescription?) {}
                            override fun onCreateFailure(error: String) {}
                        }, desc)
                        return
                    }

                    val modifiedDesc = SessionDescription(desc.type, modifiedSdp)
                    webRTCClient.peerConnection?.setLocalDescription(object : SdpObserver {
                        override fun onSetSuccess() {
                            Log.d("WebRTCService", "Successfully set local description")
                            sendSessionDescription(modifiedDesc)
                        }
                        override fun onSetFailure(error: String) {
                            Log.e("WebRTCService", "Error setting local description: $error")
                        }
                        override fun onCreateSuccess(p0: SessionDescription?) {}
                        override fun onCreateFailure(error: String) {}
                    }, modifiedDesc)
                }

                override fun onCreateFailure(error: String) {
                    Log.e("WebRTCService", "Error creating answer: $error")
                }
                override fun onSetSuccess() {}
                override fun onSetFailure(error: String) {}
            }, constraints)
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error creating answer", e)
        }
    }

    private fun sendSessionDescription(desc: SessionDescription) {
        Log.d("WebRTCService", "Sending SDP: ${desc.type} \n${desc.description}")
        try {
            val message = JSONObject().apply {
                put("type", desc.type.canonicalForm())
                put("sdp", JSONObject().apply {
                    put("type", desc.type.canonicalForm())
                    put("sdp", desc.description)
                })
                put("room", roomName)
                put("username", userName)
                put("target", "browser")
            }
            Log.d("WebRTCService", "Sending JSON: $message")
            webSocketClient.send(message.toString())
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error sending SDP", e)
        }
    }

    private fun handleAnswer(answer: JSONObject) {
        try {
            val sdp = answer.getJSONObject("sdp")
            val sessionDescription = SessionDescription(
                SessionDescription.Type.fromCanonicalForm(sdp.getString("type")),
                sdp.getString("sdp")
            )

            webRTCClient.peerConnection?.setRemoteDescription(object : SdpObserver {
                override fun onSetSuccess() {
                    Log.d("WebRTCService", "Answer accepted, connection should be established")
                }

                override fun onSetFailure(error: String) {
                    Log.e("WebRTCService", "Error setting answer: $error")
                    // При ошибке запрашиваем новый оффер
                    handler.postDelayed({ createOffer() }, 2000)
                }

                override fun onCreateSuccess(p0: SessionDescription?) {}
                override fun onCreateFailure(error: String) {}
            }, sessionDescription)
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error handling answer", e)
        }
    }

    private fun handleIceCandidate(candidate: JSONObject) {
        try {
            val ice = candidate.getJSONObject("ice")
            val iceCandidate = IceCandidate(
                ice.getString("sdpMid"),
                ice.getInt("sdpMLineIndex"),
                ice.getString("candidate")
            )
            webRTCClient.peerConnection?.addIceCandidate(iceCandidate)
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error handling ICE candidate", e)
        }
    }

    private fun sendIceCandidate(candidate: IceCandidate) {
        try {
            val message = JSONObject().apply {
                put("type", "ice_candidate")
                put("ice", JSONObject().apply {
                    put("sdpMid", candidate.sdpMid)
                    put("sdpMLineIndex", candidate.sdpMLineIndex)
                    put("candidate", candidate.sdp)
                })
                put("room", roomName)
                put("username", userName)
            }
            webSocketClient.send(message.toString())
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error sending ICE candidate", e)
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "WebRTC Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "WebRTC streaming service"
            }
            (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
                .createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        return NotificationCompat.Builder(this, channelId)
            .setContentTitle("WebRTC Service")
            .setContentText("Active in room: $roomName")
            .setSmallIcon(R.drawable.ic_notification)
            .setPriority(NotificationCompat.PRIORITY_HIGH) // Измените на HIGH
            .setOngoing(true)
            .build()
    }

    private fun updateNotification(text: String) {
        val notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("WebRTC Service")
            .setContentText(text)
            .setSmallIcon(R.drawable.ic_notification)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build()

        (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
            .notify(notificationId, notification)
    }

    override fun onDestroy() {
        if (!isUserStopped) {
            if (isConnectivityReceiverRegistered) {
                unregisterReceiver(connectivityReceiver)
            }
            if (isStateReceiverRegistered) {
                unregisterReceiver(stateReceiver)
            }
            // Автоматический перезапуск только если не было явной остановки
            scheduleRestartWithWorkManager()
        }
        super.onDestroy()
    }

    private fun cleanupAllResources() {
        handler.removeCallbacksAndMessages(null)
        cleanupWebRTCResources()
        if (::webSocketClient.isInitialized) {
            webSocketClient.disconnect()
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            "STOP" -> {
                isUserStopped = true
                isConnected = false
                isConnecting = false
                stopEverything()
                return START_NOT_STICKY
            }
            else -> {
                isUserStopped = false

                // Получаем последнее сохраненное имя комнаты
                val sharedPrefs = getSharedPreferences("WebRTCPrefs", Context.MODE_PRIVATE)
                val lastRoomName = sharedPrefs.getString("last_used_room", "")

                roomName = if (lastRoomName.isNullOrEmpty()) {
                    "default_room_${System.currentTimeMillis()}"
                } else {
                    lastRoomName
                }

                currentRoomName = roomName

                Log.d("WebRTCService", "Starting service with room: $roomName")

                if (!isConnected && !isConnecting) {
                    initializeWebRTC()
                    connectWebSocket()
                }

                isRunning = true
                return START_STICKY
            }
        }
    }

    private fun stopEverything() {
        isRunning = false
        isConnected = false
        isConnecting = false

        try {
            handler.removeCallbacksAndMessages(null)
            unregisterReceiver(connectivityReceiver)
            val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
            cm?.unregisterNetworkCallback(networkCallback)
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error during cleanup", e)
        }

        cleanupAllResources()

        if (isUserStopped) {
            stopSelf()
            android.os.Process.killProcess(android.os.Process.myPid())
        }
    }

    private fun scheduleRestartWithWorkManager() {
        // Убедитесь, что используете ApplicationContext
        val workRequest = OneTimeWorkRequestBuilder<WebRTCWorker>()
            .setInitialDelay(1, TimeUnit.MINUTES)
            .setConstraints(
                Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED) // Только при наличии сети
                    .build()
            )
            .build()

        WorkManager.getInstance(applicationContext).enqueueUniqueWork(
            "WebRTCServiceRestart",
            ExistingWorkPolicy.REPLACE,
            workRequest
        )
    }

    fun isInitialized(): Boolean {
        return ::webSocketClient.isInitialized &&
                ::webRTCClient.isInitialized &&
                ::eglBase.isInitialized
    }
}

// file: D:/AndroidStudio/MyTest/app/src/main/java/com/example/mytest/WebSocketClient.kt
package com.example.mytest

import android.annotation.SuppressLint
import android.util.Log
import okhttp3.*
import org.json.JSONObject
import java.security.cert.X509Certificate
import java.util.concurrent.TimeUnit
import javax.net.ssl.*

class WebSocketClient(private val listener: okhttp3.WebSocketListener) {
private var webSocket: WebSocket? = null
private var currentUrl: String = ""
private val client = OkHttpClient.Builder()
.pingInterval(20, TimeUnit.SECONDS)
.pingInterval(20, TimeUnit.SECONDS)
.hostnameVerifier { _, _ -> true }
.sslSocketFactory(getUnsafeSSLSocketFactory(), getTrustAllCerts()[0] as X509TrustManager)
.build()

    private fun getUnsafeSSLSocketFactory(): SSLSocketFactory {
        val trustAllCerts = getTrustAllCerts()
        val sslContext = SSLContext.getInstance("SSL")
        sslContext.init(null, trustAllCerts, java.security.SecureRandom())
        return sslContext.socketFactory
    }

    private fun getTrustAllCerts(): Array<TrustManager> {
        return arrayOf(
            @SuppressLint("CustomX509TrustManager")
            object : X509TrustManager {
                @SuppressLint("TrustAllX509TrustManager")
                override fun checkClientTrusted(chain: Array<X509Certificate>, authType: String) {
                }

                @SuppressLint("TrustAllX509TrustManager")
                override fun checkServerTrusted(chain: Array<X509Certificate>, authType: String) {
                }

                override fun getAcceptedIssuers(): Array<X509Certificate> = arrayOf()
            })
    }
    fun isConnected(): Boolean {
        return webSocket != null
    }

    fun connect(url: String) {
        currentUrl = url
        val request = Request.Builder()
            .url(url)
            .build()

        webSocket = client.newWebSocket(request, listener)
    }

    fun reconnect() {
        disconnect()
        connect(currentUrl)
    }

    fun send(message: String) {
        webSocket?.send(message)
    }

    fun disconnect() {
        webSocket?.close(1000, "Normal closure")
        client.dispatcher.executorService.shutdown()
    }
}




Андройд-ведущий работает на библиотеках, не меняй их
implementation("io.github.webrtc-sdk:android:125.6422.07")
implementation("com.squareup.okhttp3:okhttp:4.11.0")

Server Go работает на библиотеках, не меняй их
github.com/gorilla/websocket v1.5.3
github.com/pion/webrtc/v3 v3.3.5

комментарии на русском


браузер (клиент-ведомый) подключается к серверу со своим преподчитаемым кодеком, кодек выбирает пользователь в браузере,
сервер говорит андройду-ведущему, что ведомый с определенным кодеком хочет подключиться к комнате, Ведущий Андройд перезаходит в комнату с новым соединением WebRTC c нужным кодеком.
Клиенту-ведомый (браузер) указывает предпочтительный видеокодек (H.264 или VP8) при подключении к комнате, передать эту информацию через сервер ведущему (Android), инициировать переподключение ведущего с настройкой соответствующего кодека, чтобы обеспечить совместимость и оптимальное качество трансляции.
мне нужно отобразить на клиенте браузере у пользователя с каким кодеком ведется трансляция


1. Нужно наладить работу с выбором кодека, посмотри где что нужно обновить, где заменить. Потому что в логах клиента всегда показывает Кодек трансляции: VP8
2. посмотри кодеки для локальных трансляций
3. я хочу видеть реальный кодек который создал Android-ведущий и на каком кодеке идет трансляция.
4. код рабочий в целом, в прошлый раз ты сделал изменения в Андройд-ведущем и Андройд самсунг перестал делать трансляцию, Андройд Huawei трансляция была.