import { useEffect, useRef, useState } from 'react';

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
}

export const useWebRTC = (
    deviceIds: { video: string; audio: string },
    username: string,
    roomId: string
) => {
    // Состояния
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [users, setUsers] = useState<string[]>([]);
    const [isCallActive, setIsCallActive] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isInRoom, setIsInRoom] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    // Рефы
    const ws = useRef<WebSocket | null>(null);
    const pc = useRef<RTCPeerConnection | null>(null);
    const pendingIceCandidates = useRef<RTCIceCandidate[]>([]);
    const isNegotiating = useRef(false);
    const shouldCreateOffer = useRef(false);
    const connectionTimeout = useRef<NodeJS.Timeout | null>(null);
    const statsInterval = useRef<NodeJS.Timeout | null>(null);
    const videoCheckTimeout = useRef<NodeJS.Timeout | null>(null);
    const retryAttempts = useRef(0);

    // Константы
    const MAX_RETRIES = 10;
    const VIDEO_CHECK_TIMEOUT = 6000;
    const WS_URL = 'wss://ardua.site/ws';

    // Нормализация SDP
    const normalizeSdp = (sdp: string | undefined): string => {
        if (!sdp) return '';
        return sdp
            .replace(/a=network-cost:.+\r\n/g, '')
            .trim()
            .replace(/^/, 'v=0\r\n')
            .replace(/\r\n/, '\r\no=- 0 0 IN IP4 0.0.0.0\r\n')
            .replace(/\r\n/, '\r\ns=-\r\n')
            .replace(/\r\n/, '\r\nt=0 0\r\n') + '\r\n';
    };

    // Очистка ресурсов
    const cleanup = () => {
        // Таймеры
        [connectionTimeout, statsInterval, videoCheckTimeout].forEach(timer => {
            if (timer.current) clearTimeout(timer.current);
            timer.current = null;
        });

        // WebRTC соединение
        if (pc.current) {
            pc.current.onicecandidate = null;
            pc.current.ontrack = null;
            pc.current.onnegotiationneeded = null;
            pc.current.oniceconnectionstatechange = null;
            pc.current.onicegatheringstatechange = null;
            pc.current.onsignalingstatechange = null;
            pc.current.onconnectionstatechange = null;
            pc.current.close();
            pc.current = null;
        }

        // Медиапотоки
        [localStream, remoteStream].forEach(stream => {
            if (stream) {
                stream.getTracks().forEach(track => {
                    track.stop();
                    track.dispatchEvent(new Event('ended'));
                });
            }
        });

        setLocalStream(null);
        setRemoteStream(null);
        setIsCallActive(false);
        pendingIceCandidates.current = [];
        isNegotiating.current = false;
        shouldCreateOffer.current = false;
        retryAttempts.current = 0;
    };

    // Выход из комнаты
    const leaveRoom = () => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            try {
                ws.current.send(JSON.stringify({
                    type: 'leave',
                    room: roomId,
                    username
                }));
            } catch (e) {
                console.error('Error sending leave message:', e);
            }
        }
        cleanup();
        setUsers([]);
        setIsInRoom(false);
        ws.current?.close();
        ws.current = null;
        setRetryCount(0);
    };

    // Таймер проверки видео
    const startVideoCheckTimer = () => {
        if (videoCheckTimeout.current) {
            clearTimeout(videoCheckTimeout.current);
        }

        videoCheckTimeout.current = setTimeout(() => {
            if (!remoteStream ||
                !remoteStream.getVideoTracks().length ||
                !remoteStream.getVideoTracks()[0].readyState) {
                console.log('Видео не получено, перезапускаем соединение...');
                resetConnection();
            }
        }, VIDEO_CHECK_TIMEOUT);
    };

    // Подключение WebSocket
    const connectWebSocket = async (): Promise<boolean> => {
        return new Promise((resolve) => {
            if (ws.current?.readyState === WebSocket.OPEN) {
                resolve(true);
                return;
            }

            try {
                ws.current = new WebSocket(WS_URL);

                const onOpen = () => {
                    cleanupEvents();
                    setIsConnected(true);
                    setError(null);
                    console.log('WebSocket подключен');
                    resolve(true);
                };

                const onError = (event: Event) => {
                    cleanupEvents();
                    console.error('WebSocket error:', event);
                    setError('Ошибка подключения');
                    setIsConnected(false);
                    resolve(false);
                };

                const onClose = (event: CloseEvent) => {
                    cleanupEvents();
                    console.log('WebSocket closed:', event.code, event.reason);
                    setIsConnected(false);
                    setIsInRoom(false);
                    setError(event.code !== 1000 ? `Соединение закрыто: ${event.reason || 'код ' + event.code}` : null);
                    resolve(false);
                };

                const cleanupEvents = () => {
                    ws.current?.removeEventListener('open', onOpen);
                    ws.current?.removeEventListener('error', onError);
                    ws.current?.removeEventListener('close', onClose);
                    if (connectionTimeout.current) clearTimeout(connectionTimeout.current);
                };

                connectionTimeout.current = setTimeout(() => {
                    cleanupEvents();
                    setError('Таймаут подключения');
                    resolve(false);
                }, 5000);

                ws.current.addEventListener('open', onOpen);
                ws.current.addEventListener('error', onError);
                ws.current.addEventListener('close', onClose);

            } catch (err) {
                console.error('WebSocket creation error:', err);
                setError('Не удалось подключиться');
                resolve(false);
            }
        });
    };

    // Обработка оффера
    const handleOffer = async (offer: RTCSessionDescriptionInit) => {
        if (!pc.current || isNegotiating.current) return;

        try {
            isNegotiating.current = true;

            // Сброс состояния при необходимости
            if (pc.current.signalingState !== 'stable') {
                console.log('Сбрасываем состояние для нового оффера');
                await initializeWebRTC();
            }

            await pc.current.setRemoteDescription(new RTCSessionDescription(offer));

            const answer = await pc.current.createAnswer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });

            const normalizedAnswer = {
                ...answer,
                sdp: normalizeSdp(answer.sdp)
            };

            await pc.current.setLocalDescription(normalizedAnswer);

            if (ws.current?.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify({
                    type: 'answer',
                    sdp: normalizedAnswer,
                    room: roomId,
                    username
                }));
            }

            setIsCallActive(true);
            startVideoCheckTimer();
            processPendingCandidates();

        } catch (err) {
            console.error('Ошибка обработки оффера:', err);
            resetConnection();
        } finally {
            isNegotiating.current = false;
        }
    };

    // Обработка ожидающих ICE кандидатов
    const processPendingCandidates = async () => {
        while (pendingIceCandidates.current.length > 0) {
            const candidate = pendingIceCandidates.current.shift();
            if (candidate && pc.current?.remoteDescription) {
                try {
                    await pc.current.addIceCandidate(candidate);
                    console.log('Добавлен отложенный ICE кандидат');
                } catch (err) {
                    console.warn('Ошибка добавления ICE кандидата:', err);
                }
            }
        }
    };

    // Настройка обработчиков WebSocket
    const setupWebSocketListeners = () => {
        if (!ws.current) return;

        ws.current.onmessage = async (event) => {
            try {
                const data: WebSocketMessage = JSON.parse(event.data);
                console.log('Получено сообщение:', data.type);

                switch (data.type) {
                    case 'room_info':
                        setUsers(data.data?.users || []);
                        break;

                    case 'error':
                        setError(data.data);
                        break;

                    case 'offer':
                        if (data.sdp) {
                            setTimeout(() => handleOffer(data.sdp!), 500);
                        }
                        break;

                    case 'answer':
                        if (data.sdp && pc.current?.signalingState === 'have-local-offer') {
                            await pc.current.setRemoteDescription(
                                new RTCSessionDescription({
                                    type: 'answer',
                                    sdp: normalizeSdp(data.sdp.sdp)
                                })
                            );
                            setIsCallActive(true);
                            startVideoCheckTimer();
                            processPendingCandidates();
                        }
                        break;

                    case 'ice_candidate':
                        if (data.ice) {
                            const candidate = new RTCIceCandidate(data.ice);
                            if (pc.current?.remoteDescription) {
                                await pc.current.addIceCandidate(candidate);
                            } else {
                                pendingIceCandidates.current.push(candidate);
                            }
                        }
                        break;

                    case 'force_disconnect':
                        setError('Вы были отключены');
                        leaveRoom();
                        break;

                    case 'switch_camera_ack':
                        console.log('Камера переключена');
                        break;

                    case 'reconnect_request':
                        setTimeout(resetConnection, 1000);
                        break;
                }
            } catch (err) {
                console.error('Ошибка обработки сообщения:', err);
            }
        };
    };

    // Создание и отправка оффера
    const createAndSendOffer = async () => {
        if (!pc.current || !ws.current || isNegotiating.current) return;

        try {
            isNegotiating.current = true;

            const offer = await pc.current.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });

            const standardizedOffer = {
                ...offer,
                sdp: normalizeSdp(offer.sdp)
            };

            await pc.current.setLocalDescription(standardizedOffer);

            ws.current.send(JSON.stringify({
                type: "offer",
                sdp: standardizedOffer,
                room: roomId,
                username
            }));

            setIsCallActive(true);
            startVideoCheckTimer();

        } catch (err) {
            console.error('Ошибка создания оффера:', err);
            resetConnection();
        } finally {
            isNegotiating.current = false;
        }
    };

    // Инициализация WebRTC
    const initializeWebRTC = async (): Promise<boolean> => {
        try {
            cleanup();

            const config: RTCConfiguration = {
                iceServers: [
                    {
                        urls: ['turn:ardua.site:3478'],
                        username: 'user1',
                        credential: 'pass1'
                    },
                    { urls: ['stun:ardua.site:3478'] }
                ],
                iceTransportPolicy: 'all',
                bundlePolicy: 'max-bundle',
                rtcpMuxPolicy: 'require'
            };

            pc.current = new RTCPeerConnection(config);

            // Обработчики событий
            pc.current.onicecandidate = (event) => {
                if (event.candidate && ws.current?.readyState === WebSocket.OPEN) {
                    ws.current.send(JSON.stringify({
                        type: 'ice_candidate',
                        ice: event.candidate.toJSON(),
                        room: roomId,
                        username
                    }));
                }
            };

            pc.current.ontrack = (event) => {
                if (event.streams[0]) {
                    const stream = event.streams[0];
                    const videoTrack = stream.getVideoTracks()[0];

                    if (videoTrack) {
                        const videoElement = document.createElement('video');
                        videoElement.srcObject = new MediaStream([videoTrack]);
                        videoElement.onloadedmetadata = () => {
                            if (videoElement.videoWidth > 0) {
                                setRemoteStream(stream);
                                setIsCallActive(true);
                                if (videoCheckTimeout.current) {
                                    clearTimeout(videoCheckTimeout.current);
                                    videoCheckTimeout.current = null;
                                }
                            }
                        };
                    }
                }
            };

            pc.current.oniceconnectionstatechange = () => {
                if (!pc.current) return;

                switch (pc.current.iceConnectionState) {
                    case 'failed':
                        pc.current.restartIce();
                        break;
                    case 'disconnected':
                        setTimeout(resetConnection, 2000);
                        break;
                    case 'connected':
                        setIsCallActive(true);
                        break;
                    case 'closed':
                        setIsCallActive(false);
                        break;
                }
            };

            // Получение медиапотока
            const stream = await navigator.mediaDevices.getUserMedia({
                video: deviceIds.video ? {
                    deviceId: { exact: deviceIds.video },
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 30 }
                } : true,
                audio: deviceIds.audio ? {
                    deviceId: { exact: deviceIds.audio },
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } : true
            });

            setLocalStream(stream);
            stream.getTracks().forEach(track => {
                pc.current?.addTrack(track, stream);
            });

            return true;

        } catch (err) {
            console.error('Ошибка инициализации WebRTC:', err);
            cleanup();
            return false;
        }
    };

    // Мониторинг соединения
    const startConnectionMonitoring = () => {
        statsInterval.current = setInterval(async () => {
            if (!pc.current || !isCallActive) return;

            try {
                const stats = await pc.current.getStats();
                let hasVideo = false;

                stats.forEach(report => {
                    if (report.type === 'inbound-rtp' && report.kind === 'video' && report.bytesReceived > 0) {
                        hasVideo = true;
                    }
                });

                if (!hasVideo) {
                    console.warn('Нет видеопотока, переподключаемся...');
                    resetConnection();
                }
            } catch (err) {
                console.error('Ошибка мониторинга:', err);
            }
        }, 5000);
    };

    // Переподключение
    const resetConnection = async () => {
        if (retryAttempts.current >= MAX_RETRIES) {
            setError('Не удалось восстановить соединение');
            leaveRoom();
            return;
        }

        retryAttempts.current++;
        setRetryCount(retryAttempts.current);

        try {
            await leaveRoom();
            await new Promise(resolve => setTimeout(resolve, 1000 * retryAttempts.current));
            await joinRoom(username);
        } catch (err) {
            console.error('Ошибка переподключения:', err);
        }
    };

    // Перезапуск медиаустройств
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
                } : true,
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
                    sender ? sender.replaceTrack(track) : pc.current?.addTrack(track, stream);
                });
            }

            return true;
        } catch (err) {
            console.error('Ошибка перезапуска медиаустройств:', err);
            return false;
        }
    };

    // Вход в комнату
    const joinRoom = async (uniqueUsername: string) => {
        setError(null);
        setIsInRoom(false);

        try {
            if (!(await connectWebSocket())) throw new Error('WebSocket error');
            if (!(await initializeWebRTC())) throw new Error('WebRTC error');

            await new Promise<void>((resolve, reject) => {
                if (!ws.current) return reject('No WebSocket');

                const timeout = setTimeout(() => {
                    ws.current?.removeEventListener('message', onMessage);
                    reject('Timeout');
                }, 10000);

                const onMessage = (event: MessageEvent) => {
                    const data = JSON.parse(event.data);
                    if (data.type === 'room_info') {
                        clearTimeout(timeout);
                        ws.current?.removeEventListener('message', onMessage);
                        resolve();
                    } else if (data.type === 'error') {
                        clearTimeout(timeout);
                        ws.current?.removeEventListener('message', onMessage);
                        reject(data.data);
                    }
                };

                ws.current.addEventListener('message', onMessage);
                ws.current.send(JSON.stringify({
                    action: "join",
                    room: roomId,
                    username: uniqueUsername,
                    isLeader: false
                }));
            });

            setIsInRoom(true);
            shouldCreateOffer.current = true;
            startVideoCheckTimer();
            startConnectionMonitoring();

        } catch (err) {
            console.error('Ошибка входа:', err);
            setError(`Ошибка входа: ${err}`);
            cleanup();

            if (retryAttempts.current < MAX_RETRIES) {
                setTimeout(() => joinRoom(uniqueUsername), 2000 * (retryAttempts.current + 1));
            }
        }
    };

    // Очистка при размонтировании
    useEffect(() => () => leaveRoom(), []);

    return {
        localStream,
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
        restartMediaDevices,
        ws: ws.current,
    };
};