'use client';
import { useEffect, useRef, useState } from 'react';
import { VideoPlayer } from '@/components/webrtc/components/VideoPlayer';
import { joinRoomViaProxy } from '@/app/actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface NoRegWebRTCProps {
    roomId: string;
    setLeaveRoom?: (leaveRoom: () => void) => void;
    videoTransform?: string;
    setWebSocket?: (ws: WebSocket | null) => void;
    useBackCamera?: boolean;
}

interface WebSocketMessage {
    type: string;
    data?: any;
    sdp?: RTCSessionDescriptionInit;
    ice?: RTCIceCandidateInit;
    room?: string;
    username?: string;
    isLeader?: boolean;
    useBackCamera?: boolean;
    force_disconnect?: boolean;
    preferredCodec?: string;
}

export default function UseNoRegWebRTC({ roomId, setLeaveRoom, videoTransform, setWebSocket, useBackCamera }: NoRegWebRTCProps) {
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isInRoom, setIsInRoom] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [connectionState, setConnectionState] = useState<{
        ice: string | null;
        signaling: string | null;
    }>({ ice: null, signaling: null });
    const ws = useRef<WebSocket | null>(null);
    const pc = useRef<RTCPeerConnection | null>(null);
    const retryAttempts = useRef(0);
    const videoCheckTimeout = useRef<NodeJS.Timeout | null>(null);
    const connectionTimeout = useRef<NodeJS.Timeout | null>(null);
    const webRTCRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const joinMessageRetries = useRef(0);
    const videoRef = useRef<HTMLVideoElement>(null);
    const isJoining = useRef(false);
    const isReconnecting = useRef(false);
    const isConnectionStable = useRef(false);
    const lastRetryTimestamp = useRef(0);
    const username = `guest_${Math.floor(Math.random() * 1000)}`;
    const preferredCodec = 'VP8';
    const MAX_RETRIES = 10;
    const VIDEO_CHECK_TIMEOUT = 8000;
    const WS_TIMEOUT = 15000;
    const MAX_JOIN_MESSAGE_RETRIES = 10;
    const [isMuted, setIsMuted] = useState<boolean>(true);
    const [flashlightState, setFlashlightState] = useState<boolean>(false);

    const detectPlatform = () => {
        const ua = navigator.userAgent;
        const isIOS = /iPad|iPhone|iPod/.test(ua);
        const isSafari = /^((?!chrome|android).)*safari/i.test(ua) || isIOS;
        const isOldDevice = /Android [4-7]\./.test(ua) || /iOS (9|10|11)\./.test(ua); // Проверка старых устройств
        return {
            isIOS,
            isSafari,
            isHuawei: /huawei/i.test(ua),
            isMobile: /Android|iPad|iPhone|iPod/.test(ua),
            isOldDevice,
        };
    };

    const { isIOS, isSafari, isHuawei, isMobile, isOldDevice } = detectPlatform();

    const checkNetwork = () => {
        if (!navigator.onLine) return false;
        if ('connection' in navigator && navigator.connection) {
            const connection = navigator.connection as any;
            if (connection.effectiveType === '2g' || connection.downlink < 1) {
                console.warn('Слабая сеть (2G или низкая скорость), откладываем подключение');
                return false;
            }
        }
        return true;
    };

    const cleanup = () => {
        console.log('Выполняется полная очистка ресурсов');

        // Очистка таймеров
        [videoCheckTimeout, connectionTimeout, webRTCRetryTimeoutRef, pingIntervalRef].forEach(timer => {
            if (timer.current) {
                if (timer === pingIntervalRef) {
                    clearInterval(timer.current);
                } else {
                    clearTimeout(timer.current);
                }
                timer.current = null;
            }
        });

        // Полная очистка PeerConnection
        if (pc.current) {
            console.log('Закрытие PeerConnection');
            pc.current.onicecandidate = null;
            pc.current.ontrack = null;
            pc.current.onnegotiationneeded = null;
            pc.current.oniceconnectionstatechange = null;
            pc.current.onicegatheringstatechange = null;
            pc.current.onsignalingstatechange = null;
            pc.current.onconnectionstatechange = null;

            pc.current.getTransceivers().forEach(transceiver => {
                try {
                    transceiver.stop();
                } catch (err) {
                    console.warn('Ошибка при остановке трансцепсера:', err);
                }
            });

            try {
                pc.current.close();
            } catch (err) {
                console.warn('Ошибка при закрытии PeerConnection:', err);
            }
            pc.current = null;
        }

        // Остановка и очистка удаленного потока
        if (remoteStream) {
            console.log('Остановка удаленного потока');
            remoteStream.getTracks().forEach(track => {
                try {
                    track.stop();
                    track.dispatchEvent(new Event('ended'));
                } catch (err) {
                    console.warn('Ошибка при остановке трека:', err);
                }
            });
            setRemoteStream(null);
        }

        // Очистка WebSocket
        if (ws.current) {
            ws.current.onmessage = null;
            ws.current.onopen = null;
            ws.current.onclose = null;
            ws.current.onerror = null;
            try {
                ws.current.close();
            } catch (e) {
                console.warn('Ошибка при закрытии WebSocket:', e);
            }
            ws.current = null;
            if (setWebSocket) setWebSocket(null);
        }

        // Сброс состояний
        setIsConnected(false);
        setIsInRoom(false);
        setError(null);
        setConnectionState({ ice: null, signaling: null });
        retryAttempts.current = 0;
        setRetryCount(0);
        joinMessageRetries.current = 0;
        isJoining.current = false;
        isReconnecting.current = false;
        isConnectionStable.current = false;
        console.log('Очистка завершена');
    };

    const leaveRoom = () => {
        console.log('Выполняется leaveRoom');
        if (ws.current?.readyState === WebSocket.OPEN) {
            try {
                sendWebSocketMessage({
                    type: 'leave',
                    room: roomId.replace(/-/g, ''),
                    username,
                    preferredCodec,
                });
                console.log('Отправлено leave сообщение:', { type: 'leave', room: roomId.replace(/-/g, ''), username, preferredCodec });
            } catch (e) {
                console.error('Ошибка отправки leave сообщения:', e);
            }
        }

        cleanup();
    };

    useEffect(() => {
        if (setLeaveRoom) {
            setLeaveRoom(leaveRoom);
        }
    }, [setLeaveRoom]);

    const startVideoCheckTimer = () => {
        if (videoCheckTimeout.current) {
            clearTimeout(videoCheckTimeout.current);
            console.log('Очищен предыдущий таймер проверки видео');
        }
        console.log(`Запуск таймера проверки видео на ${VIDEO_CHECK_TIMEOUT / 1000} секунд`);
        videoCheckTimeout.current = setTimeout(() => {
            const videoElement = videoRef.current;
            const hasVideoContent = videoElement && videoElement.videoWidth > 0 && videoElement.videoHeight > 0;
            console.log('Проверка видео:', {
                remoteStream: !!remoteStream,
                videoTracks: remoteStream?.getVideoTracks().length || 0,
                firstTrackEnabled: remoteStream?.getVideoTracks()[0]?.enabled,
                firstTrackReadyState: remoteStream?.getVideoTracks()[0]?.readyState,
                hasVideoContent,
                iceConnectionState: pc.current?.iceConnectionState,
                signalingState: pc.current?.signalingState,
            });
            if (
                remoteStream &&
                remoteStream.getVideoTracks().length > 0 &&
                remoteStream.getVideoTracks()[0]?.enabled &&
                remoteStream.getVideoTracks()[0]?.readyState === 'live' &&
                hasVideoContent &&
                pc.current?.iceConnectionState === 'connected'
            ) {
                console.log('Видео активно, переподключение не требуется');
                isConnectionStable.current = true;
            } else {
                console.warn(`Видео не получено в течение ${VIDEO_CHECK_TIMEOUT / 1000} секунд, переподключение...`);
                if (!isReconnecting.current && !isConnectionStable.current) {
                    resetConnection();
                }
            }
        }, VIDEO_CHECK_TIMEOUT);
    };

    const connectWebSocket = async (): Promise<boolean> => {
        return new Promise((resolve) => {
            if (ws.current?.readyState === WebSocket.OPEN) {
                console.log('WebSocket уже открыт');
                if (setWebSocket) setWebSocket(ws.current);
                resolve(true);
                return;
            }

            let retryCount = 0;
            const maxRetries = 15;

            const attemptConnection = () => {
                if (!checkNetwork()) {
                    console.warn('Нет подходящего сетевого соединения, откладываем попытку');
                    setTimeout(attemptConnection, 5000);
                    return;
                }
                console.log(`Попытка подключения WebSocket ${retryCount + 1}/${maxRetries + 1}`);
                try {
                    ws.current = new WebSocket(process.env.WEBSOCKET_URL_WSGO || 'wss://ardua.site:444/wsgo');
                    console.log('Инициализация WebSocket...');

                    const onOpen = () => {
                        console.log('WebSocket успешно подключен');
                        cleanupEvents();
                        setIsConnected(true);
                        setError(null);
                        if (setWebSocket) setWebSocket(ws.current);
                        pingIntervalRef.current = setInterval(() => {
                            if (ws.current?.readyState === WebSocket.OPEN) {
                                sendWebSocketMessage({ type: 'ping' });
                                console.log('Отправлен ping для поддержания WebSocket');
                            }
                        }, 30000);
                        resolve(true);
                    };

                    const onError = (event: Event) => {
                        console.error('Ошибка WebSocket:', event);
                        cleanupEvents();
                        if (retryCount < maxRetries) {
                            retryCount++;
                            const backoffDelay = Math.min(10000 * Math.pow(2, retryCount), 30000); // Увеличена базовая задержка
                            console.log(`Повторная попытка подключения WebSocket (${retryCount}/${maxRetries}) через ${backoffDelay} мс`);
                            setTimeout(attemptConnection, backoffDelay);
                        } else {
                            setError('Не удалось подключиться к WebSocket после максимального количества попыток');
                            resolve(false);
                        }
                    };

                    const onClose = (event: CloseEvent) => {
                        console.log('WebSocket закрыт:', event.code, event.reason, { wasClean: event.wasClean });
                        cleanupEvents();
                        setIsConnected(false);
                        setIsInRoom(false);
                        if (setWebSocket) setWebSocket(null);
                        if (event.code === 1006) {
                            console.warn('WebSocket закрыт с кодом 1006, возможны проблемы с сетью или сервером');
                        }
                        if (retryCount < maxRetries) {
                            retryCount++;
                            const backoffDelay = Math.min(10000 * Math.pow(2, retryCount), 30000);
                            console.log(`Повторная попытка подключения WebSocket (${retryCount}/${maxRetries}) через ${backoffDelay} мс`);
                            setTimeout(attemptConnection, backoffDelay);
                        } else {
                            setError(event.code !== 1000 ? `WebSocket закрыт: ${event.reason || 'код ' + event.code}` : null);
                            resolve(false);
                        }
                    };

                    const cleanupEvents = () => {
                        if (ws.current) {
                            ws.current.removeEventListener('open', onOpen);
                            ws.current.removeEventListener('error', onError);
                            ws.current.removeEventListener('close', onClose);
                        }
                        if (connectionTimeout.current) {
                            clearTimeout(connectionTimeout.current);
                            connectionTimeout.current = null;
                        }
                    };

                    connectionTimeout.current = setTimeout(() => {
                        console.error('Таймаут подключения WebSocket');
                        cleanupEvents();
                        if (ws.current && ws.current.readyState !== WebSocket.OPEN) {
                            ws.current.close();
                            ws.current = null;
                            if (setWebSocket) setWebSocket(null);
                        }
                        if (retryCount < maxRetries) {
                            retryCount++;
                            const backoffDelay = Math.min(10000 * Math.pow(2, retryCount), 30000);
                            console.log(`Повторная попытка подключения WebSocket (${retryCount}/${maxRetries}) через ${backoffDelay} мс`);
                            setTimeout(attemptConnection, backoffDelay);
                        } else {
                            setError('Таймаут подключения WebSocket после максимального количества попыток');
                            resolve(false);
                        }
                    }, WS_TIMEOUT);

                    ws.current.addEventListener('open', onOpen);
                    ws.current.addEventListener('error', onError);
                    ws.current.addEventListener('close', onClose);
                } catch (err) {
                    console.error('Ошибка создания WebSocket:', err);
                    if (retryCount < maxRetries) {
                        retryCount++;
                        const backoffDelay = Math.min(10000 * Math.pow(2, retryCount), 30000);
                        console.log(`Повторная попытка подключения WebSocket (${retryCount}/${maxRetries}) через ${backoffDelay} мс`);
                        setTimeout(attemptConnection, backoffDelay);
                    } else {
                        setError('Не удалось создать WebSocket');
                        resolve(false);
                    }
                }
            };

            attemptConnection();
        });
    };

    const initializeWebRTC = async () => {
        cleanup(); // Полная очистка перед инициализацией

        const iceServers = isOldDevice
            ? [
                { urls: 'stun:stun.l.google.com:19302' },
                {
                    urls: 'turn:ardua.site:3478',
                    username: 'user1',
                    credential: 'pass1',
                },
            ]
            : [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:ardua.site:3478' },
                {
                    urls: 'turn:ardua.site:3478',
                    username: 'user1',
                    credential: 'pass1',
                },
            ];

        pc.current = new RTCPeerConnection({
            iceServers,
            bundlePolicy: 'max-bundle',
            rtcpMuxPolicy: 'require',
            iceTransportPolicy: 'all',
            iceCandidatePoolSize: 0,
            // sdpSemantics: isOldDevice ? 'plan-b' : 'unified-plan',
        });

        pc.current.onsignalingstatechange = () => {
            if (!pc.current) return;
            console.log('Состояние сигнализации:', pc.current.signalingState);
            setConnectionState(prev => ({ ...prev, signaling: pc.current?.signalingState || null }));
        };

        pc.current.oniceconnectionstatechange = () => {
            if (!pc.current) return;
            console.log('Состояние ICE:', pc.current.iceConnectionState);
            setConnectionState(prev => ({ ...prev, ice: pc.current?.iceConnectionState || null }));
            if (
                pc.current.iceConnectionState === 'failed' ||
                pc.current.iceConnectionState === 'disconnected'
            ) {
                console.warn('ICE соединение прервано, проверяем переподключение...');
                if (!isReconnecting.current && !isConnectionStable.current) {
                    resetConnection();
                }
            } else if (pc.current.iceConnectionState === 'connected') {
                console.log('ICE соединение установлено');
                isReconnecting.current = false;
                if (remoteStream) isConnectionStable.current = true;
            }
        };

        pc.current.onicegatheringstatechange = () => {
            if (pc.current) {
                console.log('Состояние сбора ICE:', pc.current.iceGatheringState);
            }
        };

        pc.current.onicecandidateerror = (event: any) => {
            const ignorableErrors = [701, 702, 703];
            if (!ignorableErrors.includes(event.errorCode)) {
                console.error('Критическая ошибка ICE кандидата:', event);
                setError(`Ошибка ICE соединения: ${event.errorText}`);
            }
        };

        pc.current.onicecandidate = (event) => {
            if (event.candidate && ws.current?.readyState === WebSocket.OPEN) {
                if (shouldSendIceCandidate(event.candidate)) {
                    console.log('Отправка ICE кандидата:', event.candidate);
                    sendWebSocketMessage({
                        type: 'ice_candidate',
                        ice: event.candidate.toJSON(),
                        room: roomId.replace(/-/g, ''),
                        username,
                        preferredCodec,
                    });
                }
            }
        };

        const shouldSendIceCandidate = (candidate: RTCIceCandidate) => {
            if (isHuawei) {
                return candidate.candidate.includes('typ relay');
            }
            if (isIOS || isSafari || isOldDevice) {
                return (
                    candidate.candidate.includes('typ relay') ||
                    candidate.candidate.includes('typ srflx')
                );
            }
            return true;
        };

        pc.current.ontrack = (event) => {
            console.log('Получен поток в ontrack:', {
                streamId: event.streams[0]?.id,
                videoTracks: event.streams[0]?.getVideoTracks().length,
                audioTracks: event.streams[0]?.getAudioTracks().length,
                videoTrackEnabled: event.streams[0]?.getVideoTracks()[0]?.enabled,
                videoTrackReadyState: event.streams[0]?.getVideoTracks()[0]?.readyState,
            });
            if (event.streams && event.streams[0]) {
                const stream = event.streams[0];
                const newRemoteStream = new MediaStream();
                stream.getTracks().forEach(track => {
                    newRemoteStream.addTrack(track);
                    console.log(`Добавлен ${track.kind} трек в remoteStream:`, track.id);
                    if (track.kind === 'audio') {
                        track.enabled = !isMuted;
                    }
                });
                setRemoteStream(newRemoteStream);
                setIsInRoom(true);
                if (videoCheckTimeout.current) {
                    clearTimeout(videoCheckTimeout.current);
                    console.log('Таймер проверки видео очищен');
                }
                startVideoCheckTimer();
            } else {
                console.warn('Получен пустой поток в ontrack');
                startVideoCheckTimer();
            }
        };

        try {
            pc.current.addTransceiver('video', { direction: 'recvonly' });
            pc.current.addTransceiver('audio', { direction: 'recvonly' });
            console.log('Добавлены транссиверы для получения видео и аудио');
        } catch (err) {
            console.error('Ошибка добавления транссиверов:', err);
            setError('Ошибка настройки WebRTC');
        }

        if (!isOldDevice) {
            startConnectionMonitoring();
        }
    };

    const startConnectionMonitoring = () => {
        if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
        }

        pingIntervalRef.current = setInterval(async () => {
            if (!pc.current || !isInRoom) return;

            try {
                const stats = await pc.current.getStats();
                let hasActiveVideo = false;
                let packetsLost = 0;
                let totalPackets = 0;

                stats.forEach(report => {
                    if (report.type === 'inbound-rtp' && report.kind === 'video') {
                        if (report.bytesReceived > 0) hasActiveVideo = true;
                        if (report.packetsLost !== undefined) packetsLost += report.packetsLost;
                        if (report.packetsReceived !== undefined) totalPackets += report.packetsReceived;
                    }
                });

                if (!hasActiveVideo && isInRoom) {
                    console.warn('Нет активного видеопотока, пытаемся восстановить...');
                    if (!isReconnecting.current && !isConnectionStable.current) {
                        resetConnection();
                    }
                } else if (totalPackets > 0 && packetsLost / totalPackets > 0.05) {
                    console.warn('Высокий уровень потерь пакетов (>5%), переподключение...');
                    if (!isReconnecting.current && !isConnectionStable.current) {
                        resetConnection();
                    }
                }
            } catch (err) {
                console.error('Ошибка получения статистики:', err);
            }
        }, 10000); // Увеличен интервал до 10 секунд

        return () => {
            if (pingIntervalRef.current) {
                clearInterval(pingIntervalRef.current);
            }
        };
    };

    const sendWebSocketMessage = (message: WebSocketMessage) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            console.log('Отправка WebSocket-сообщения:', message);
            ws.current.send(JSON.stringify(message));
        } else {
            console.error('WebSocket не открыт для отправки:', message);
        }
    };

    const setupWebSocketListeners = () => {
        if (!ws.current) return;

        ws.current.onmessage = async (event) => {
            try {
                const data: WebSocketMessage = JSON.parse(event.data);
                console.log('Получено сообщение:', JSON.stringify(data, null, 2));

                switch (data.type.toLowerCase()) {
                    case 'room_info':
                        console.log('Получено room_info, пользователь в комнате');
                        setIsInRoom(true);
                        joinMessageRetries.current = 0;
                        startVideoCheckTimer();
                        break;

                    case 'offer':
                        if (pc.current && data.sdp) {
                            console.log('Получен offer:', data.sdp);
                            await pc.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
                            const answer = await pc.current.createAnswer();
                            await pc.current.setLocalDescription(answer);
                            sendWebSocketMessage({
                                type: 'answer',
                                sdp: answer,
                                room: roomId.replace(/-/g, ''),
                                username,
                                preferredCodec,
                            });
                            console.log('Отправлен answer:', answer);
                        }
                        break;

                    case 'ice_candidate':
                        if (pc.current && data.ice) {
                            console.log('Добавление ICE кандидата:', data.ice);
                            try {
                                await pc.current.addIceCandidate(new RTCIceCandidate(data.ice));
                            } catch (err) {
                                console.error('Ошибка добавления ICE-кандидата:', err);
                                setError('Ошибка добавления ICE-кандидата');
                            }
                        }
                        break;

                    case 'error':
                        console.error('Ошибка сервера:', data.data);
                        setError(`Ошибка сервера: ${data.data || 'Неизвестная ошибка'}`);
                        if (
                            data.data === 'Room does not exist. Leader must join first.' ||
                            data.data === 'Leader is unavailable'
                        ) {
                            if (retryAttempts.current < MAX_RETRIES) {
                                console.log(`${data.data}, повторная попытка через 10 секунд`);
                                webRTCRetryTimeoutRef.current = setTimeout(() => {
                                    retryAttempts.current += 1;
                                    setRetryCount(retryAttempts.current);
                                    if (!isReconnecting.current && !isConnectionStable.current) {
                                        resetConnection();
                                    }
                                }, 10000);
                            } else {
                                setError('Не удалось подключиться: лидер не в комнате');
                            }
                        } else if (joinMessageRetries.current < MAX_JOIN_MESSAGE_RETRIES) {
                            joinMessageRetries.current += 1;
                            console.log(`Повторная отправка join сообщения (${joinMessageRetries.current}/${MAX_JOIN_MESSAGE_RETRIES})`);
                            setTimeout(() => {
                                sendWebSocketMessage({
                                    type: 'join',
                                    room: roomId.replace(/-/g, ''),
                                    username,
                                    isLeader: false,
                                    preferredCodec,
                                });
                            }, 3000); // Увеличена задержка
                        } else {
                            setError(`Не удалось подключиться к комнате: ${data.data}`);
                            if (!isConnectionStable.current) resetConnection();
                        }
                        break;

                    case 'force_disconnect':
                        console.log('Принудительное отключение');
                        setError('Отключен: другой пользователь подключился');
                        leaveRoom();
                        break;

                    case 'pong':
                        console.log('Получен pong, WebSocket жив');
                        break;

                    case 'camera_switched':
                        console.log('Камера переключена на:', data.data.useBackCamera ? 'заднюю' : 'фронтальную');
                        if (data.data.useBackCamera !== undefined) {
                            console.log('Подтверждение переключения камеры:', data.data.useBackCamera);
                        }
                        break;

                    case 'flashlight_toggled':
                        console.log('Фонарик:', data.data.isOn ? 'включен' : 'выключен');
                        setFlashlightState(data.data.isOn);
                        break;

                    default:
                        console.warn('Неизвестный тип сообщения:', data.type);
                }
            } catch (err) {
                console.error('Ошибка обработки сообщения:', err);
                setError('Ошибка обработки сообщения сервера');
            }
        };
    };

    const joinRoom = async () => {
        if (isJoining.current) {
            console.log('joinRoom уже выполняется, пропускаем...');
            return;
        }
        isJoining.current = true;
        console.log('Запуск joinRoom, полная очистка перед новым соединением');
        leaveRoom();
        setError(null);
        joinMessageRetries.current = 0;

        try {
            const normalizedRoomId = roomId.replace(/-/g, '');
            console.log('Отправка joinRoomViaProxy с roomId:', normalizedRoomId);
            const response = await joinRoomViaProxy(normalizedRoomId);
            if ('error' in response) {
                console.error('joinRoomViaProxy ошибка:', response.error);
                throw new Error(response.error);
            }
            const { roomId: targetRoomId } = response;
            console.log('Получен targetRoomId:', targetRoomId);

            if (!(await connectWebSocket())) {
                throw new Error('Не удалось подключиться к WebSocket');
            }

            setupWebSocketListeners();

            // Откладываем initializeWebRTC до успешного join
            await new Promise<void>((resolve, reject) => {
                if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
                    reject(new Error('WebSocket не подключен'));
                    return;
                }

                const onMessage = (event: MessageEvent) => {
                    try {
                        const data = JSON.parse(event.data);
                        console.log('Получено сообщение в joinRoom:', JSON.stringify(data, null, 2));
                        if (data.type === 'room_info') {
                            console.log('Успешно подключено к комнате');
                            cleanupEvents();
                            setIsInRoom(true);
                            setError(null);
                            retryAttempts.current = 0;
                            setRetryCount(0);
                            resolve();
                        } else if (data.type === 'error') {
                            console.error('Ошибка при подключении:', data.data);
                            cleanupEvents();
                            setError(data.data || 'Ошибка входа в комнату');
                            if (
                                data.data === 'Room does not exist. Leader must join first.' ||
                                data.data === 'Leader is unavailable'
                            ) {
                                if (retryAttempts.current < MAX_RETRIES) {
                                    console.log(`${data.data}, повторная попытка через 10 секунд`);
                                    webRTCRetryTimeoutRef.current = setTimeout(() => {
                                        retryAttempts.current += 1;
                                        setRetryCount(retryAttempts.current);
                                        joinRoom().catch(console.error);
                                    }, 10000);
                                } else {
                                    setError('Не удалось подключиться после максимального количества попыток');
                                    reject(new Error('Достигнуто максимальное количество попыток подключения'));
                                }
                            } else if (joinMessageRetries.current < MAX_JOIN_MESSAGE_RETRIES) {
                                joinMessageRetries.current += 1;
                                console.log(`Повторная отправка join сообщения (${joinMessageRetries.current}/${MAX_JOIN_MESSAGE_RETRIES})`);
                                setTimeout(() => {
                                    sendWebSocketMessage({
                                        type: 'join',
                                        room: targetRoomId,
                                        username,
                                        isLeader: false,
                                        preferredCodec,
                                    });
                                }, 3000);
                            } else {
                                reject(new Error(data.data || 'Ошибка входа в комнату'));
                            }
                        }
                    } catch (err) {
                        console.error('Ошибка обработки сообщения:', err);
                        cleanupEvents();
                        setError('Ошибка обработки сообщения сервера');
                        reject(err);
                    }
                };

                const cleanupEvents = () => {
                    if (ws.current) {
                        ws.current.removeEventListener('message', onMessage);
                    }
                    if (connectionTimeout.current) {
                        clearTimeout(connectionTimeout.current);
                        connectionTimeout.current = null;
                    }
                };

                ws.current.addEventListener('message', onMessage);

                connectionTimeout.current = setTimeout(() => {
                    cleanupEvents();
                    console.error('Таймаут ожидания ответа от сервера');
                    setError('Таймаут ожидания ответа от сервера');
                    reject(new Error('Таймаут ожидания ответа от сервера'));
                }, 15000);

                sendWebSocketMessage({
                    type: 'join',
                    room: targetRoomId,
                    username,
                    isLeader: false,
                    preferredCodec,
                });
                console.log('Отправлен запрос на подключение:', {
                    action: 'join',
                    room: targetRoomId,
                    username,
                    isLeader: false,
                    preferredCodec,
                });

                if (useBackCamera !== undefined) {
                    sendWebSocketMessage({
                        type: 'switch_camera',
                        useBackCamera,
                        room: targetRoomId,
                        username,
                    });
                    console.log('Отправлена начальная команда switch_camera:', { useBackCamera });
                }
            });

            await initializeWebRTC(); // Инициализируем WebRTC после успешного join
            startVideoCheckTimer();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            console.error('Join room ошибка:', errorMessage);
            setError(`Ошибка подключения: ${errorMessage}`);
            if (retryAttempts.current < MAX_RETRIES && !isConnectionStable.current) {
                console.log('Планируем повторную попытку через 10 секунд');
                webRTCRetryTimeoutRef.current = setTimeout(() => {
                    retryAttempts.current += 1;
                    setRetryCount(retryAttempts.current);
                    if (!isReconnecting.current && !isConnectionStable.current) {
                        resetConnection();
                    }
                }, 10000);
            } else {
                setError(`Не удалось подключиться после ${MAX_RETRIES} попыток: ${errorMessage}`);
            }
        } finally {
            isJoining.current = false;
        }
    };

    const resetConnection = () => {
        const now = Date.now();
        if (isReconnecting.current || now - lastRetryTimestamp.current < 10000) {
            console.log('Переподключение уже выполняется или слишком рано, пропускаем...');
            return;
        }
        lastRetryTimestamp.current = now;
        if (isConnectionStable.current) {
            console.log('Соединение стабильно, переподключение запрещено:', {
                iceConnectionState: pc.current?.iceConnectionState,
                signalingState: pc.current?.signalingState,
                wsState: ws.current?.readyState,
            });
            return;
        }
        if (
            pc.current &&
            (pc.current.iceConnectionState === 'connected' ||
                pc.current.iceConnectionState === 'checking' ||
                pc.current.signalingState === 'have-remote-offer' ||
                ws.current?.readyState === WebSocket.OPEN)
        ) {
            console.log('Соединение активно или в процессе установления, переподключение запрещено:', {
                iceConnectionState: pc.current?.iceConnectionState,
                signalingState: pc.current?.signalingState,
                wsState: ws.current?.readyState,
            });
            return;
        }
        isReconnecting.current = true;
        console.log('Переподключение WebRTC...');
        joinRoom();
    };

    useEffect(() => {
        if (roomId && !isJoining.current) {
            joinRoom();
        }
        return () => leaveRoom();
    }, [roomId]);

    return (
        <div className="relative w-full h-full">
            {error && (
                <Dialog open={!!error} onOpenChange={() => {}}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Ошибка подключения</DialogTitle>
                        </DialogHeader>
                        <p>{error}</p>
                        {retryCount > 0 && <p>Попытка переподключения: {retryCount} из {MAX_RETRIES}</p>}
                    </DialogContent>
                </Dialog>
            )}
            <VideoPlayer
                stream={remoteStream}
                videoRef={videoRef}
                muted={isMuted}
                className="w-full h-full"
                transform={videoTransform}
            />
        </div>
    );
}