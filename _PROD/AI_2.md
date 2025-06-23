\\wsl.localhost\Ubuntu-24.04\home\pi\prod\docker-ardua-444\components\no_reg\useNoRegWebRTC.tsx
нужно исправить

// file: docker-ardua-444/components/no_reg/useNoRegWebRTC.tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import { VideoPlayer } from '@/components/webrtc/components/VideoPlayer';
import { joinRoomViaProxy } from '@/app/actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface NoRegWebRTCProps {
roomId: string;
}

interface WebSocketMessage {
type: string;
data?: any;
sdp?: RTCSessionDescriptionInit;
ice?: RTCIceCandidateInit;
room?: string;
username?: string;
isLeader?: boolean;
force_disconnect?: boolean;
preferredCodec?: string;
}

export default function UseNoRegWebRTC({ roomId }: NoRegWebRTCProps) {
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
const isConnectionStable = useRef(false); // Новый флаг для стабильного соединения
const username = `guest_${Math.floor(Math.random() * 1000)}`;
const preferredCodec = 'VP8';
const MAX_RETRIES = 10;
const VIDEO_CHECK_TIMEOUT = 12000;
const WS_TIMEOUT = 20000; // Увеличено до 20 секунд
const MAX_JOIN_MESSAGE_RETRIES = 3;

    const detectPlatform = () => {
        const ua = navigator.userAgent;
        const isIOS = /iPad|iPhone|iPod/.test(ua);
        const isSafari = /^((?!chrome|android).)*safari/i.test(ua) || isIOS;
        return { isIOS, isSafari, isHuawei: /huawei/i.test(ua) };
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

        if (videoCheckTimeout.current) clearTimeout(videoCheckTimeout.current);
        if (connectionTimeout.current) clearTimeout(connectionTimeout.current);
        if (webRTCRetryTimeoutRef.current) clearTimeout(webRTCRetryTimeoutRef.current);
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

        if (pc.current) {
            pc.current.onicecandidate = null;
            pc.current.ontrack = null;
            pc.current.oniceconnectionstatechange = null;
            pc.current.onsignalingstatechange = null;
            try {
                pc.current.close();
            } catch (e) {
                console.warn('Ошибка закрытия PeerConnection:', e);
            }
            pc.current = null;
        }

        if (remoteStream) {
            remoteStream.getTracks().forEach(track => {
                try {
                    track.stop();
                } catch (e) {
                    console.warn('Ошибка остановки трека:', e);
                }
            });
            setRemoteStream(null);
        }

        if (ws.current) {
            ws.current.onmessage = null;
            ws.current.onopen = null;
            ws.current.onclose = null;
            ws.current.onerror = null;
            try {
                ws.current.close();
            } catch (e) {
                console.warn('Ошибка закрытия WebSocket:', e);
            }
            ws.current = null;
        }

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
    };

    const startVideoCheckTimer = () => {
        if (videoCheckTimeout.current) {
            clearTimeout(videoCheckTimeout.current);
            console.log('Очищен предыдущий таймер проверки видео');
        }
        console.log('Запуск таймера проверки видео');
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
                isConnectionStable.current ||
                (remoteStream &&
                    remoteStream.getVideoTracks().length > 0 &&
                    remoteStream.getVideoTracks()[0]?.enabled &&
                    remoteStream.getVideoTracks()[0]?.readyState === 'live' &&
                    hasVideoContent) ||
                pc.current?.iceConnectionState === 'connected' ||
                pc.current?.iceConnectionState === 'connecting' ||
                ws.current?.readyState === WebSocket.OPEN
            ) {
                console.log('Соединение стабильно или видео активно, переподключение не требуется');
                if (pc.current?.iceConnectionState === 'connected' && hasVideoContent) {
                    isConnectionStable.current = true; // Устанавливаем флаг стабильного соединения
                }
            } else {
                console.warn('Видео не получено и соединение не активно, переподключение...');
                resetConnection();
            }
        }, VIDEO_CHECK_TIMEOUT);
    };

    const connectWebSocket = async (): Promise<boolean> => {
        return new Promise((resolve) => {
            if (ws.current?.readyState === WebSocket.OPEN) {
                console.log('WebSocket уже открыт');
                resolve(true);
                return;
            }

            let retryCount = 0;
            const maxRetries = 3;

            const attemptConnection = () => {
                console.log(`Попытка подключения WebSocket ${retryCount + 1}/${maxRetries + 1}`);
                try {
                    ws.current = new WebSocket(process.env.WEBSOCKET_URL_WSGO || 'wss://ardua.site:444/wsgo');
                    console.log('Инициализация WebSocket...');

                    const onOpen = () => {
                        console.log('WebSocket успешно подключен');
                        cleanupEvents();
                        setIsConnected(true);
                        setError(null);
                        pingIntervalRef.current = setInterval(() => {
                            if (ws.current?.readyState === WebSocket.OPEN) {
                                sendWebSocketMessage({ type: 'ping' });
                                console.log('Отправлен ping для поддержания WebSocket');
                            }
                        }, 30000); // Пинг каждые 30 секунд
                        resolve(true);
                    };

                    const onError = (event: Event) => {
                        console.error('Ошибка WebSocket:', event);
                        cleanupEvents();
                        if (retryCount < maxRetries) {
                            retryCount++;
                            console.log(`Повторная попытка подключения WebSocket (${retryCount}/${maxRetries})`);
                            setTimeout(attemptConnection, 3000);
                        } else {
                            setError('Не удалось подключиться к WebSocket');
                            resolve(false);
                        }
                    };

                    const onClose = (event: CloseEvent) => {
                        console.log('WebSocket закрыт:', event.code, event.reason);
                        cleanupEvents();
                        setIsConnected(false);
                        if (retryCount < maxRetries) {
                            retryCount++;
                            console.log(`Повторная попытка подключения WebSocket (${retryCount}/${maxRetries})`);
                            setTimeout(attemptConnection, 3000);
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
                        }
                        if (retryCount < maxRetries) {
                            retryCount++;
                            console.log(`Повторная попытка подключения WebSocket (${retryCount}/${maxRetries})`);
                            setTimeout(attemptConnection, 3000);
                        } else {
                            setError('Таймаут подключения WebSocket');
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
                        console.log(`Повторная попытка подключения WebSocket (${retryCount}/${maxRetries})`);
                        setTimeout(attemptConnection, 3000);
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
        if (pc.current) {
            console.log('PeerConnection уже существует, очищаем...');
            pc.current.close();
            pc.current = null;
        }

        const { isIOS, isSafari, isHuawei } = detectPlatform();
        pc.current = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:ardua.site:3478' },
                {
                    urls: 'turn:ardua.site:3478',
                    username: 'user1',
                    credential: 'pass1',
                },
            ],
            bundlePolicy: 'max-bundle',
            rtcpMuxPolicy: 'require',
            iceTransportPolicy: 'all',
            sdpSemantics: 'unified-plan',
        });

        pc.current.onsignalingstatechange = () => {
            if (!pc.current) return;
            console.log('Состояние сигнализации:', pc.current.signalingState);
            setConnectionState(prev => ({ ...prev, signaling: pc.current?.signalingState || null }));
        };

        if (isIOS || isSafari || isHuawei) {
            pc.current.oniceconnectionstatechange = () => {
                if (!pc.current) return;
                console.log(`${isHuawei ? 'Huawei' : 'iOS/Safari'} ICE состояние:`, pc.current.iceConnectionState);
                setConnectionState(prev => ({ ...prev, ice: pc.current?.iceConnectionState || null }));
                if (
                    pc.current.iceConnectionState === 'disconnected' ||
                    pc.current.iceConnectionState === 'failed'
                ) {
                    console.log(`${isHuawei ? 'Huawei' : 'iOS/Safari'}: ICE прервано, проверяем переподключение...`);
                    if (!isReconnecting.current && !isConnectionStable.current) {
                        resetConnection();
                    }
                } else if (pc.current.iceConnectionState === 'connected') {
                    console.log('ICE соединение установлено');
                    isReconnecting.current = false;
                    if (remoteStream) isConnectionStable.current = true;
                }
            };
        }

        pc.current.onicecandidate = (event) => {
            if (event.candidate && ws.current?.readyState === WebSocket.OPEN) {
                console.log('Отправка ICE кандидата:', event.candidate);
                ws.current.send(
                    JSON.stringify({
                        type: 'ice_candidate',
                        ice: event.candidate.toJSON(),
                        room: roomId.replace(/-/g, ''),
                        username,
                        preferredCodec,
                    })
                );
            }
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

                switch (data.type) {
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
                            await pc.current.addIceCandidate(new RTCIceCandidate(data.ice));
                        }
                        break;

                    case 'error':
                        console.error('Ошибка сервера:', data.data);
                        setError(`Ошибка сервера: ${data.data || 'Неизвестная ошибка'}`);
                        if (data.data === 'Room does not exist. Leader must join first.') {
                            if (retryAttempts.current < MAX_RETRIES) {
                                console.log('Комната не существует, повторная попытка через 5 секунд');
                                webRTCRetryTimeoutRef.current = setTimeout(() => {
                                    retryAttempts.current += 1;
                                    setRetryCount(retryAttempts.current);
                                    if (!isReconnecting.current && !isConnectionStable.current) {
                                        resetConnection();
                                    }
                                }, 5000);
                            } else {
                                setError('Не удалось подключиться: лидер не в комнате');
                            }
                        } else if (joinMessageRetries.current < MAX_JOIN_MESSAGE_RETRIES) {
                            joinMessageRetries.current += 1;
                            console.log(`Повторная отправка join сообщения (${joinMessageRetries.current}/${MAX_JOIN_MESSAGE_RETRIES})`);
                            sendWebSocketMessage({
                                type: 'join',
                                room: roomId.replace(/-/g, ''),
                                username,
                                isLeader: false,
                                preferredCodec,
                            });
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

            await new Promise(resolve => setTimeout(resolve, 500));
            console.log('Задержка после connectWebSocket завершена');

            setupWebSocketListeners();
            await initializeWebRTC();

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
                            resolve();
                        } else if (data.type === 'error') {
                            console.error('Ошибка при подключении:', data.data);
                            cleanupEvents();
                            setError(`Не удалось подключиться к комнате: ${data.data}`);
                            if (joinMessageRetries.current < MAX_JOIN_MESSAGE_RETRIES) {
                                joinMessageRetries.current += 1;
                                console.log(`Повторная отправка join сообщения (${joinMessageRetries.current}/${MAX_JOIN_MESSAGE_RETRIES})`);
                                sendWebSocketMessage({
                                    type: 'join',
                                    room: targetRoomId,
                                    username,
                                    isLeader: false,
                                    preferredCodec,
                                });
                            } else {
                                reject(new Error(data.data));
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

                connectionTimeout.current = setTimeout(() => {
                    cleanupEvents();
                    console.error('Таймаут ожидания ответа от сервера');
                    setError('Таймаут ожидания ответа от сервера');
                    if (joinMessageRetries.current < MAX_JOIN_MESSAGE_RETRIES) {
                        joinMessageRetries.current += 1;
                        console.log(`Повторная отправка join сообщения (${joinMessageRetries.current}/${MAX_JOIN_MESSAGE_RETRIES})`);
                        sendWebSocketMessage({
                            type: 'join',
                            room: targetRoomId,
                            username,
                            isLeader: false,
                            preferredCodec,
                        });
                    } else {
                        reject(new Error('Таймаут ожидания ответа от сервера'));
                    }
                }, WS_TIMEOUT);

                ws.current.addEventListener('message', onMessage);

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
            });

            startVideoCheckTimer();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            console.error('Join room ошибка:', errorMessage);
            setError(`Ошибка подключения: ${errorMessage}`);
            if (retryAttempts.current < MAX_RETRIES && !isConnectionStable.current) {
                console.log('Планируем повторную попытку через 5 секунд');
                webRTCRetryTimeoutRef.current = setTimeout(() => {
                    retryAttempts.current += 1;
                    setRetryCount(retryAttempts.current);
                    if (!isReconnecting.current && !isConnectionStable.current) {
                        resetConnection();
                    }
                }, 5000);
            } else {
                setError(`Не удалось подключиться после ${MAX_RETRIES} попыток: ${errorMessage}`);
            }
        } finally {
            isJoining.current = false;
        }
    };

    const resetConnection = () => {
        if (isReconnecting.current) {
            console.log('Переподключение уже выполняется, пропускаем...');
            return;
        }
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
                pc.current.iceConnectionState === 'connecting' ||
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
                muted={false}
                className="w-full h-full"
            />
            <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
                Статус: {isConnected ? (isInRoom ? 'В комнате' : 'Подключено') : 'Отключено'} | ICE: {connectionState.ice || 'N/A'} | Signaling: {connectionState.signaling || 'N/A'}
            </div>
        </div>
    );
}



вот ошибка одна
requests.js:1
POST https://ardua.site:444/no-reg?roomId=1NMI-YW6P-ZDQN-TD10 500 (Internal Server Error)
(anonymous)	@	requests.js:1
(anonymous)	@	traffic.js:1
fetch	@	traffic.js:1
Promise.then		
joinRoomViaProxy	@	actions.ts:903
joinRoom	@	useNoRegWebRTC.tsx:505
UseNoRegWebRTC.useEffect	@	useNoRegWebRTC.tsx:667
"use client"		
NoRegPage	@	page.tsx:21
"use server"		
(app-pages-browser)/./node_modules/next/dist/client/app-index.js	@	main-app.js?v=1750495568746:160
options.factory	@	webpack.js?v=1750495568746:712
__webpack_require__	@	webpack.js?v=1750495568746:37
fn	@	webpack.js?v=1750495568746:369
(app-pages-browser)/./node_modules/next/dist/client/app-next-dev.js	@	main-app.js?v=1750495568746:182
options.factory	@	webpack.js?v=1750495568746:712
__webpack_require__	@	webpack.js?v=1750495568746:37
__webpack_exec__	@	main-app.js?v=1750495568746:2824
(anonymous)	@	main-app.js?v=1750495568746:2825
webpackJsonpCallback	@	webpack.js?v=1750495568746:1388
(anonymous)	@	main-app.js?v=1750495568746:9

вот вторая
useNoRegWebRTC.tsx:576 Таймаут ожидания ответа от сервера
error	@	intercept-console-error.js:50
eval	@	useNoRegWebRTC.tsx:576

соединение происходит, потом разрывается при  useNoRegWebRTC.tsx:576 Таймаут ожидания ответа от сервера
error	@	intercept-console-error.js:50
eval	@	useNoRegWebRTC.tsx:576

вот сервер код , его если он нормальный не изменяй
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

func isConnAlive(conn *websocket.Conn) bool {
if conn == nil {
return false
}
err := conn.WriteControl(websocket.PingMessage, []byte{}, time.Now().Add(2*time.Second))
return err == nil
}

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

    // Найти payload types для целевого кодека
    codecRegex := regexp.MustCompile(fmt.Sprintf(`a=rtpmap:(\d+) %s/\d+`, targetCodec))
    for _, line := range lines {
        matches := codecRegex.FindStringSubmatch(line)
        if matches != nil {
            targetPayloadTypes = append(targetPayloadTypes, matches[1])
            log.Printf("Found %s payload type: %s", targetCodec, matches[1])
        }
    }

    // Добавить H.264, если отсутствует
    if len(targetPayloadTypes) == 0 && targetCodec == "H264" {
        log.Printf("No H264 payload types found, adding manually")
        targetPayloadTypes = []string{"126"}
        h264Lines := []string{
            "a=rtpmap:126 H264/90000",
            "a=fmtp:126 profile-level-id=42e01f;level-asymmetry-allowed=1;packetization-mode=1",
            "a=rtcp-fb:126 ccm fir",
            "a=rtcp-fb:126 nack",
            "a=rtcp-fb:126 nack pli",
        }
        videoSectionFound := false
        for i, line := range lines {
            if strings.HasPrefix(line, "m=video") {
                videoSectionFound = true
                newLines = append(lines[:i+1], append(h264Lines, lines[i+1:]...)...)
                newLines[i] = "m=video 9 UDP/TLS/RTP/SAVPF 126"
                break
            }
        }
        if !videoSectionFound {
            log.Printf("No m=video section found, returning original SDP")
            return sdp
        }
    } else {
        newLines = lines
    }

    // Удалить другие кодеки
    otherCodecs := []string{"VP8", "VP9", "AV1"}
    if targetCodec == "VP8" {
        otherCodecs = []string{"H264", "VP9", "AV1"}
    }
    filteredLines := []string{}
    for _, line := range newLines {
        skip := false
        for _, codec := range otherCodecs {
            codecRegex := regexp.MustCompile(fmt.Sprintf(`a=rtpmap:(\d+) %s/\d+`, codec))
            if codecRegex.MatchString(line) || strings.Contains(line, fmt.Sprintf("apt=%s", codec)) {
                log.Printf("Skipping line with codec %s: %s", codec, line)
                skip = true
                break
            }
        }
        if !skip {
            filteredLines = append(filteredLines, line)
        }
    }
    newLines = filteredLines

    // Убедиться, что m=video содержит только целевой payload type
    for i, line := range newLines {
        if strings.HasPrefix(line, "m=video") {
            newLines[i] = fmt.Sprintf("m=video 9 UDP/TLS/RTP/SAVPF %s", targetPayloadTypes[0])
            log.Printf("Updated m=video to use only %s payload type: %s", targetCodec, targetPayloadTypes[0])
            break
        }
    }

    // Установить битрейт
    for i, line := range newLines {
        if strings.HasPrefix(line, "a=mid:video") {
            newLines = append(newLines[:i+1], append([]string{"b=AS:300"}, newLines[i+1:]...)...)
            break
        }
    }

    newSdp := strings.Join(newLines, "\r\n")
    log.Printf("Normalized SDP for %s:\n%s", targetCodec, newSdp)
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
{URLs: []string{"stun:stun.l.google.com:19302"}},
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
func handlePeerJoin(room string, username string, isLeader bool, conn *websocket.Conn, preferredCodec string) (*Peer, error) {
mu.Lock()
defer mu.Unlock() // Гарантируем разблокировку мьютекса при выходе из функции

    // Очистка устаревших пиров в комнате
    if roomPeers, exists := rooms[room]; exists {
        for uname, p := range roomPeers {
            p.mu.Lock()
            if p.conn == nil || p.pc == nil || p.pc.ConnectionState() == webrtc.PeerConnectionStateClosed {
                log.Printf("Removing stale peer %s from room %s", uname, room)
                delete(roomPeers, uname)
                for addr, peer := range peers {
                    if peer == p {
                        delete(peers, addr)
                        break
                    }
                }
                go closePeerResources(p, "Stale peer cleanup")
            }
            p.mu.Unlock()
        }
        if len(roomPeers) == 0 {
            delete(rooms, room)
        }
    }

    if _, exists := rooms[room]; !exists {
        if !isLeader {
            _ = conn.WriteJSON(map[string]interface{}{"type": "error", "data": "Room does not exist. Leader must join first."})
            conn.Close()
            return nil, errors.New("room does not exist for follower")
        }
        rooms[room] = make(map[string]*Peer)
    }

    roomPeers := rooms[room]

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
            _ = conn.WriteJSON(map[string]interface{}{"type": "error", "data": "No leader in room"})
            conn.Close()
            return nil, errors.New("no leader in room")
        }

        var existingFollower *Peer
        codec := preferredCodec
        if codec == "" {
            codec = "H264"
        }
        log.Printf("Follower %s prefers codec: %s in room %s", username, codec, room)

        for _, p := range roomPeers {
            if !p.isLeader {
                existingFollower = p
                break
            }
        }

        if existingFollower != nil {
            log.Printf("Replacing old follower %s with new follower %s in room %s", existingFollower.username, username, room)
            delete(roomPeers, existingFollower.username)
            for addr, pItem := range peers {
                if pItem == existingFollower {
                    delete(peers, addr)
                    break
                }
            }
            existingFollower.mu.Lock()
            if existingFollower.conn != nil {
                _ = existingFollower.conn.WriteJSON(map[string]interface{}{
                    "type": "force_disconnect",
                    "data": "You have been replaced by another viewer",
                })
            }
            existingFollower.mu.Unlock()
            go closePeerResources(existingFollower, "Replaced by new follower")
        }

        var leaderPeer *Peer
        for _, p := range roomPeers {
            if p.isLeader {
                leaderPeer = p
                break
            }
        }
        if leaderPeer != nil && isConnAlive(leaderPeer.conn) {
            log.Printf("Sending rejoin_and_offer command to leader %s for new follower %s with codec %s", leaderPeer.username, username, codec)
            leaderPeer.mu.Lock()
            err := leaderPeer.conn.WriteJSON(map[string]interface{}{
                "type":           "rejoin_and_offer",
                "room":           room,
                "preferredCodec": codec,
            })
            leaderPeer.mu.Unlock()
            if err != nil {
                log.Printf("Error sending rejoin_and_offer to leader %s: %v", leaderPeer.username, err)
            }
        }
    }

    mediaEngine := createMediaEngine(preferredCodec)
    peerAPI := webrtc.NewAPI(webrtc.WithMediaEngine(mediaEngine))
    peerConnection, err := peerAPI.NewPeerConnection(getWebRTCConfig())
    if err != nil {
        return nil, fmt.Errorf("failed to create PeerConnection: %w", err)
    }
    log.Printf("PeerConnection created for %s with preferred codec %s", username, preferredCodec)

    peerConnection.OnConnectionStateChange(func(s webrtc.PeerConnectionState) {
        log.Printf("PeerConnection state changed for %s: %s", username, s.String())
        if s == webrtc.PeerConnectionStateDisconnected || s == webrtc.PeerConnectionStateFailed {
            log.Printf("PeerConnection for %s is disconnected or failed, closing resources", username)
            tempPeer := &Peer{
                conn:     conn,
                pc:       peerConnection,
                username: username,
                room:     room,
                isLeader: isLeader,
            }
            go closePeerResources(tempPeer, "PeerConnection failed or disconnected")
            mu.Lock()
            if roomPeers, exists := rooms[room]; exists {
                log.Printf("Removing %s from room %s", username, room)
                delete(roomPeers, username)
                if len(roomPeers) == 0 {
                    log.Printf("Room %s is empty, deleting", room)
                    delete(rooms, room)
                }
            }
            log.Printf("Removing %s from peers (addr: %s)", username, conn.RemoteAddr().String())
            delete(peers, conn.RemoteAddr().String())
            mu.Unlock()
            log.Printf("Sending updated room info for %s", room)
            sendRoomInfo(room)
        }
    })

    peer := &Peer{
        conn:     conn,
        pc:       peerConnection,
        username: username,
        room:     room,
        isLeader: isLeader,
    }

    if isLeader {
        videoTransceiver, err := peerConnection.AddTransceiverFromKind(webrtc.RTPCodecTypeVideo, webrtc.RTPTransceiverInit{
            Direction: webrtc.RTPTransceiverDirectionSendonly,
        })
        if err != nil {
            log.Printf("Failed to add video transceiver for leader %s: %v", username, err)
            conn.WriteJSON(map[string]interface{}{
                "type": "error",
                "data": "Failed to add video transceiver",
            })
            conn.Close()
            return nil, fmt.Errorf("failed to add video transceiver: %w", err)
        }
        go func() {
            time.Sleep(5 * time.Second)
            peer.mu.Lock()
            defer peer.mu.Unlock()
            if videoTransceiver.Sender() == nil || videoTransceiver.Sender().Track() == nil {
                log.Printf("No video track added by leader %s in room %s", username, room)
                if peer.conn != nil {
                    peer.conn.WriteJSON(map[string]interface{}{
                        "type": "error",
                        "data": "No video track detected. Please ensure camera is active.",
                    })
                }
            } else {
                log.Printf("Video track confirmed for leader %s in room %s", username, room)
            }
        }()
    }

    if _, err := peerConnection.AddTransceiverFromKind(webrtc.RTPCodecTypeAudio, webrtc.RTPTransceiverInit{
        Direction: webrtc.RTPTransceiverDirectionSendrecv,
    }); err != nil {
        log.Printf("Failed to add audio transceiver for %s: %v", username, err)
    }

    peerConnection.OnICECandidate(func(c *webrtc.ICECandidate) {
        if c == nil {
            log.Printf("No more ICE candidates for %s", username)
            return
        }
        log.Printf("ICE candidate for %s: %s", username, c.ToJSON().Candidate)
        peer.mu.Lock()
        defer peer.mu.Unlock()
        if peer.conn != nil && isConnAlive(peer.conn) {
            err := peer.conn.WriteJSON(map[string]interface{}{"type": "ice_candidate", "ice": c.ToJSON()})
            if err != nil {
                log.Printf("Error sending ICE candidate to %s: %v", peer.username, err)
                go closePeerResources(peer, "Failed to send ICE candidate")
            }
        }
    })

    if !isLeader {
        peerConnection.OnTrack(func(track *webrtc.TrackRemote, receiver *webrtc.RTPReceiver) {
            log.Printf("Track received for follower %s in room %s: Codec %s",
                username, room, track.Codec().MimeType)
        })
    }

    rooms[room][username] = peer
    peers[conn.RemoteAddr().String()] = peer

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

    return peer, nil
}

// main осталась вашей функцией
func main() {

    cleanupPeers()
    initializeMediaAPI()
    http.HandleFunc("/wsgo", handleWebSocket)
    http.HandleFunc("/status", func(w http.ResponseWriter, r *http.Request) {
        logStatus()
        w.WriteHeader(http.StatusOK)
        if _, err := w.Write([]byte("Status logged to console")); err != nil {
            log.Printf("Error writing /status response: %v", err)
        }
    })

    log.Println("Server starting on :8095 (Logic: Leader Re-joins on Follower connect)")
    log.Println("WebRTC MediaEngine configured for H.264 (video) and Opus (audio).")
    logStatus() // Логируем статус при запуске
    if err := http.ListenAndServe(":8095", nil); err != nil {
        log.Fatalf("Failed to start server: %v", err)
    }
}

func cleanupPeers() {
mu.Lock()
defer mu.Unlock()

    for _, peer := range peers {
        go closePeerResources(peer, "Server cleanup on restart")
    }
    peers = make(map[string]*Peer)
    rooms = make(map[string]map[string]*Peer)
    log.Println("All peers and rooms have been cleaned up")
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

        if targetPeer == nil && (dataType == "offer" || dataType == "answer" || dataType == "ice_candidate" || dataType == "toggle_flashlight") {
            continue
        }

        switch dataType {
        case "offer":
            log.Printf("Received offer from %s: %s", currentPeer.username, string(msgBytes))
            if currentPeer.isLeader && targetPeer != nil && !targetPeer.isLeader {
                log.Printf(">>> Forwarding Offer from %s to %s", currentPeer.username, targetPeer.username)
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
                if targetWsConn != nil && isConnAlive(targetWsConn) {
                    if err := targetWsConn.WriteMessage(websocket.TextMessage, msgBytes); err != nil {
                        log.Printf("!!! Error forwarding offer to %s: %v", targetPeer.username, err)
                        go closePeerResources(targetPeer, "Failed to forward offer")
                    }
                } else {
                    log.Printf("Target WebSocket connection for %s is not alive, skipping offer forwarding", targetPeer.username)
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
        case "toggle_flashlight":
            if targetPeer != nil && targetPeer.isLeader {
                log.Printf("Forwarding 'toggle_flashlight' message from %s to %s", currentPeer.username, targetPeer.username)
                targetPeer.mu.Lock()
                targetWsConn := targetPeer.conn
                targetPeer.mu.Unlock()
                if targetWsConn != nil {
                    if err := targetWsConn.WriteMessage(websocket.TextMessage, msgBytes); err != nil {
                        log.Printf("Error forwarding 'toggle_flashlight' to %s: %v", targetPeer.username, err)
                    }
                }
            } else {
                log.Printf("Error: Received 'toggle_flashlight' from %s but no leader found.", currentPeer.username)
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
серверная функция
type JoinRoomViaProxyResult =
| { roomId: string; deviceId: string | null }
| { error: string };
export async function joinRoomViaProxy(roomIdProxy: string): Promise<JoinRoomViaProxyResult> {
const parsedRoomIdProxy = roomIdSchema.safeParse(roomIdProxy);
if (!parsedRoomIdProxy.success) {
return { error: parsedRoomIdProxy.error.errors[0].message };
}

const proxyAccess = await prisma.proxyAccess.findUnique({
where: { proxyRoomId: roomIdProxy },
include: { room: { include: { devices: true } } },
});

if (!proxyAccess) {
return { error: 'Прокси-доступ не найден' };
}

if (proxyAccess.expiresAt && new Date(proxyAccess.expiresAt) < new Date()) {
return { error: 'Прокси-доступ истек' };
}

return {
roomId: proxyAccess.room.roomId,
deviceId: proxyAccess.room.devices?.idDevice || null,
};
}

отвечай на русском

это сделано для того чтобы незарегистрированные пользователи могли соединяться с WEBRTC


вот код для зарегистрированных пользователей, он работает ICE кандидаты работают, STUN TURN И остальное тоже работает, исправь  UseNoRegWebRTC

вот рабочий вариант для образца
// file: docker-ardua/components/webrtc/hooks/useWebRTC.ts
import { useEffect, useRef, useState } from 'react';
import {RoomInfo} from "@/components/webrtc/types";

interface WebSocketMessage {
type: string;
data?: any;
// sdp?: {
//     type: RTCSdpType;
//     sdp: string;
// };
sdp?: RTCSessionDescriptionInit;
ice?: RTCIceCandidateInit;
room?: string;
username?: string;
isLeader?: boolean;
force_disconnect?: boolean;
preferredCodec?: string;
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
preferredCodec: 'VP8'
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

    const [activeCodec, setActiveCodec] = useState<string | null>(null);

    const [roomInfo, setRoomInfo] = useState<any>({});
    const [stream, setStream] = useState<MediaStream | null>(null);
    const webRTCRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [isCameraEnabled, setIsCameraEnabled] = useState(false); // Состояние для камеры



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
    const VIDEO_CHECK_TIMEOUT = 8000; // 4 секунд для проверки видео



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
                    if (report.type === 'inbound-rtp' && report.kind === 'video') {
                        console.log('Статистика видео:', {
                            bytesReceived: report.bytesReceived,
                            packetsLost: report.packetsLost,
                            jitter: report.jitter
                        });
                        if (report.bytesReceived === 0 && isCallActive) {
                            console.warn('Видео не передается (bytesReceived=0), инициируем переподключение');
                            resetConnection();
                        }
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

    const normalizeSdp = (sdp: string | undefined): string => {
        if (!sdp) {
            console.warn('No SDP provided for normalization');
            return '';
        }

        const { isHuawei, isSafari, isIOS } = detectPlatform();
        let optimized = sdp;

        // Найти payload types для видео
        let videoPayloadTypes: string[] = [];
        const lines = sdp.split('\n');
        for (const line of lines) {
            if (line.startsWith('m=video')) {
                const parts = line.split(' ');
                if (parts.length >= 4) {
                    videoPayloadTypes = parts.slice(3);
                    console.log(`Original m=video payload types: ${videoPayloadTypes.join(', ')}`);
                }
                break;
            }
        }

        // Проверить наличие H.264
        let h264PayloadType: string | null = null;
        for (const pt of videoPayloadTypes) {
            if (optimized.includes(`a=rtpmap:${pt} H264`)) {
                h264PayloadType = pt;
                break;
            }
        }

        // Если H.264 отсутствует и preferredCodec === 'H264', добавить его
        if (!h264PayloadType && preferredCodec === 'H264') {
            console.log('H.264 not found in SDP, adding manually');
            h264PayloadType = '126';
            const h264Lines = [
                `a=rtpmap:126 H264/90000`,
                `a=fmtp:126 profile-level-id=42e01f;level-asymmetry-allowed=1;packetization-mode=1`,
                `a=rtcp-fb:126 ccm fir`,
                `a=rtcp-fb:126 nack`,
                `a=rtcp-fb:126 nack pli`
            ].join('\r\n') + '\r\n';

            let newLines: string[] = [];
            let videoSectionFound = false;
            for (const line of lines) {
                newLines.push(line);
                if (line.startsWith('m=video') && !videoSectionFound) {
                    videoSectionFound = true;
                    newLines[newLines.length - 1] = line.replace(
                        /(m=video\s+\d+\s+UDP\/TLS\/RTP\/SAVPF\s+)(.*)/,
                        `$1${h264PayloadType} $2`
                    );
                    newLines.push(h264Lines);
                }
            }
            optimized = newLines.join('\r\n');
        }

        // Приоритизировать H.264, если он есть
        if (h264PayloadType && preferredCodec === 'H264') {
            optimized = optimized.replace(
                /^(m=video\s+\d+\s+UDP\/TLS\/RTP\/SAVPF\s+)(.*)$/gm,
                (match, prefix, payloads) => {
                    const payloadList = payloads.split(' ').filter((pt: string) =>
                        pt === h264PayloadType ||
                        (!optimized.includes(`a=rtpmap:${pt} VP8`) &&
                            !optimized.includes(`a=rtpmap:${pt} VP9`) &&
                            !optimized.includes(`a=rtpmap:${pt} AV1`))
                    );
                    return `${prefix}${payloadList.join(' ')}`;
                }
            );
            console.log(`Reordered m=video to prioritize H.264 payload type: ${h264PayloadType}`);
        } else if (!h264PayloadType && preferredCodec === 'H264') {
            console.warn('H.264 not supported, falling back to VP8');
            setError('H.264 не поддерживается, используется VP8');
        }

        // Применить оптимизации для iOS/Safari
        if (isIOS || isSafari) {
            optimized = optimized
                .replace(/a=setup:actpass\r\n/g, 'a=setup:active\r\n')
                .replace(/a=ice-options:trickle\r\n/g, '')
                .replace(/a=rtcp-fb:\d+ goog-remb\r\n/g, '')
                .replace(/a=rtcp-fb:\d+ transport-cc\r\n/g, '')
                .replace(/a=mid:video\r\n/g, 'a=mid:video\r\nb=AS:300\r\n');
        }

        // Применить оптимизации для Huawei
        if (isHuawei) {
            optimized = optimized
                .replace(/a=rtpmap:(\d+) H264\/\d+/g,
                    'a=rtpmap:$1 H264/90000\r\n' +
                    'a=fmtp:$1 profile-level-id=42e01f;packetization-mode=1;level-asymmetry-allowed=1\r\n')
                .replace(/a=mid:video\r\n/g,
                    'a=mid:video\r\n' +
                    'b=AS:250\r\n' +
                    'b=TIAS:250000\r\n' +
                    'a=rtcp-fb:* ccm fir\r\n' +
                    'a=rtcp-fb:* nack\r\n' +
                    'a=rtcp-fb:* nack pli\r\n');
        }

        console.log('Normalized SDP:\n', optimized);
        return optimized;
    };

// Добавляем очистку таймера в cleanup
let cleanup = () => {
console.log('Выполняется полная очистка ресурсов');

        // Очистка таймеров
        [connectionTimeout, statsInterval, videoCheckTimeout, webRTCRetryTimeoutRef].forEach(timer => {
            if (timer.current) {
                clearTimeout(timer.current);
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
                    console.warn('Ошибка при остановке трансцептора:', err);
                }
            });

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
        setIsInRoom(false);
        console.log('Очистка завершена');
    };


    const leaveRoom = () => {
        console.log('Выполняется leaveRoom');
        if (ws.current?.readyState === WebSocket.OPEN) {
            try {
                sendWebSocketMessage({
                    type: 'leave',
                    room: roomId,
                    username,
                    preferredCodec
                });
                console.log('Отправлено сообщение leave:', { type: 'leave', room: roomId, username, preferredCodec });
            } catch (e) {
                console.error('Ошибка отправки сообщения leave:', e);
            }
        }

        // Полная очистка WebRTC
        cleanup();
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
        }

        // Очистка всех таймеров
        if (webRTCRetryTimeoutRef.current) {
            clearTimeout(webRTCRetryTimeoutRef.current);
            webRTCRetryTimeoutRef.current = null;
        }
        if (connectionTimeout.current) {
            clearTimeout(connectionTimeout.current);
            connectionTimeout.current = null;
        }
        if (statsInterval.current) {
            clearInterval(statsInterval.current);
            statsInterval.current = null;
        }
        if (videoCheckTimeout.current) {
            clearTimeout(videoCheckTimeout.current);
            videoCheckTimeout.current = null;
        }

        // Сброс всех состояний
        retryAttempts.current = 0;
        setRetryCount(0);
        shouldCreateOffer.current = false;
        isNegotiating.current = false;
        pendingIceCandidates.current = [];
        setUsers([]);
        setIsInRoom(false);
        setIsConnected(false);
        setIsCallActive(false);
        setIsLeader(false);
        setError(null);
        setLocalStream(null);
        setRemoteStream(null);
        setRoomInfo({});
        setStream(null);
        setActiveCodec(null);
        console.log('Состояния полностью сброшены после leaveRoom');
    };

    const startVideoCheckTimer = () => {
        if (videoCheckTimeout.current) {
            clearTimeout(videoCheckTimeout.current);
            videoCheckTimeout.current = null;
            console.log('Очищен предыдущий таймер проверки видео');
        }
        console.log('Запуск таймера проверки видео на 4 секунды');
        videoCheckTimeout.current = setTimeout(() => {
            console.log('Проверка видео:', {
                remoteStream: !!remoteStream,
                videoTracks: remoteStream?.getVideoTracks().length || 0,
                firstTrackEnabled: remoteStream?.getVideoTracks()[0]?.enabled,
                firstTrackReadyState: remoteStream?.getVideoTracks()[0]?.readyState
            });
            const videoElement = document.querySelector('video');
            const hasVideoContent =
                videoElement && videoElement.videoWidth > 0 && videoElement.videoHeight > 0;
            if (
                !remoteStream ||
                remoteStream.getVideoTracks().length === 0 ||
                !remoteStream.getVideoTracks()[0]?.enabled ||
                remoteStream.getVideoTracks()[0]?.readyState !== 'live' ||
                !hasVideoContent
            ) {
                console.log(
                    `Удаленное видео не получено или пустое в течение ${VIDEO_CHECK_TIMEOUT / 1000} секунд, перезапускаем соединение...`
                );
                resetConnection();
            } else {
                console.log('Видео активно, переподключение не требуется');
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
                ws.current = new WebSocket(process.env.WEBSOCKET_URL_WSGO || 'wss://ardua.site:444/wsgo');

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
    const getVideoCodecFromSdp = (sdp: string | undefined): string | null => {
        if (!sdp) {
            console.warn('No SDP provided');
            return null;
        }
        console.log('Full SDP:\n', sdp); // Логируем полный SDP
        const lines = sdp.split('\n');
        let videoPayloadTypes: string[] = [];

        // Найти строку m=video и извлечь payload types
        for (const line of lines) {
            if (line.startsWith('m=video')) {
                const parts = line.split(' ');
                if (parts.length >= 4) {
                    videoPayloadTypes = parts.slice(3);
                    console.log(`Found m=video payload types: ${videoPayloadTypes.join(', ')}`);
                }
                break;
            }
        }

        if (videoPayloadTypes.length === 0) {
            console.warn('No video payload types found in SDP');
            return null;
        }

        // Найти первый подходящий кодек по payload type
        for (const pt of videoPayloadTypes) {
            for (const line of lines) {
                if (line.includes(`a=rtpmap:${pt} H264`)) {
                    console.log(`Found H264 for payload type ${pt}`);
                    return 'H264';
                }
                if (line.includes(`a=rtpmap:${pt} VP8`)) {
                    console.log(`Found VP8 for payload type ${pt}`);
                    return 'VP8';
                }
            }
        }

        console.warn('No matching codec found for payload types:', videoPayloadTypes);
        return null;
    };


    const setupWebSocketListeners = () => {
        if (!ws.current) return;

        const handleMessage = async (event: MessageEvent) => {
            try {
                const data: WebSocketMessage = JSON.parse(event.data);
                console.log('Получено сообщение:', data);
                console.log('Получено сообщение:', JSON.stringify(data, null, 2))

                if (data.type === 'rejoin_and_offer' && isLeader) {
                    console.log('Получена команда rejoin_and_offer для лидера');
                    if (pc.current && ws.current?.readyState === WebSocket.OPEN) {
                        try {
                            // const localStream = await initializeWebRTC();
                            // if (!localStream || localStream.getVideoTracks().length === 0) {
                            //     console.error('Нет видеотрека для лидера после initializeWebRTC');
                            //     throw new Error('Видеотрек отсутствует');
                            // }
                            const offer = await pc.current.createOffer({
                                offerToReceiveAudio: true,
                                offerToReceiveVideo: false
                            });
                            const normalizedOffer = {
                                ...offer,
                                sdp: normalizeSdp(offer.sdp)
                            };
                            await pc.current.setLocalDescription(normalizedOffer);
                            sendWebSocketMessage({
                                type: 'offer',
                                sdp: normalizedOffer,
                                room: roomId,
                                username,
                                preferredCodec
                            });
                            console.log('Отправлен новый offer:', normalizedOffer);
                            startVideoCheckTimer();
                        } catch (err) {
                            console.error('Ошибка создания нового offer:', err);
                            setError('Ошибка при создании нового предложения');
                        }
                    }
                    return;
                }

                switch (data.type) {
                    case 'room_info':
                        console.log('Обработка room_info:', data.data);
                        setIsLeader(data.data?.leader === username);
                        setUsers(data.data?.users || []);
                        setIsInRoom(true);
                        if (data.data?.leader && data.data?.follower) {
                            console.log('Получены данные комнаты:', {
                                leader: data.data.leader,
                                follower: data.data.follower
                            });
                            if (videoCheckTimeout.current) {
                                clearTimeout(videoCheckTimeout.current);
                                console.log('Таймер проверки видео очищен при получении room_info');
                            }
                            startVideoCheckTimer();
                        }
                        break;

                    case 'offer':
                        console.log('Получен offer SDP:\n', data.sdp?.sdp);
                        if (!isLeader && pc.current && data.sdp) {
                            if (!data.sdp) {
                                console.error('Получен offer без SDP');
                                setError('Недействительное предложение от сервера');
                                return;
                            }
                            console.log('Получен offer:', data.sdp);
                            await pc.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
                            console.log('Состояние сигнализации изменилось: have-remote-offer');
                            const answer = await pc.current.createAnswer();
                            const normalizedAnswer = {
                                ...answer,
                                sdp: normalizeSdp(answer.sdp)
                            };
                            await pc.current.setLocalDescription(normalizedAnswer);
                            sendWebSocketMessage({
                                type: 'answer',
                                sdp: normalizedAnswer,
                                room: roomId,
                                username,
                                preferredCodec
                            });
                            console.log('Отправлен answer:', normalizedAnswer);

                            // Извлекаем кодек из SDP ответа
                            const codec = getVideoCodecFromSdp(normalizedAnswer.sdp);
                            if (codec) {
                                console.log(`Кодек трансляции: ${codec}`);
                                setActiveCodec(codec);
                                if (codec !== preferredCodec) {
                                    console.warn(`Используется кодек ${codec} вместо выбранного ${preferredCodec}`);
                                    setError(`Используется кодек ${codec} вместо выбранного ${preferredCodec}`);
                                }
                            } else {
                                console.warn('Кодек не найден в SDP ответа');
                                setActiveCodec(null);
                                setError('Не удалось определить кодек трансляции');
                            }
                        }
                        break;

                    case 'answer':
                        if (isLeader && pc.current && data.sdp) {
                            if (!data.sdp) {
                                console.error('Получен answer без SDP');
                                setError('Недействительный ответ от сервера');
                                return;
                            }
                            console.log('Получен answer:', data.sdp);
                            await pc.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
                            console.log('Состояние сигнализации изменилось: stable');

                            // Извлекаем кодек из SDP ответа
                            const codec = getVideoCodecFromSdp(data.sdp.sdp);
                            if (codec) {
                                console.log(`Кодек трансляции: ${codec}`);
                                setActiveCodec(codec);
                            } else {
                                console.warn('Кодек не найден в SDP ответа');
                                setActiveCodec(null);
                            }
                        }
                        break;

                    case 'ice_candidate':
                        if (pc.current && data.ice) {
                            console.log('ICE кандидат добавлен в очередь:', data.ice);
                            try {
                                await pc.current.addIceCandidate(new RTCIceCandidate(data.ice));
                                console.log('Добавлен ICE кандидат:', data.ice);
                            } catch (err) {
                                console.error('Ошибка добавления ICE-кандидата:', err);
                                setError('Ошибка добавления ICE-кандидата');
                            }
                        }
                        break;

                    case 'reconnect_request':
                        console.log('Сервер запросил переподключение');
                        setTimeout(() => {
                            resetConnection();
                        }, 1000);
                        break;

                    case 'force_disconnect':
                        console.log('Получена команда принудительного отключения');
                        setError('Вы были отключены, так как подключился другой зритель');
                        leaveRoom();
                        break;

                    case 'error':
                        console.error('Ошибка от сервера:', data.data);
                        setError(data.data || 'Ошибка от сервера');
                        break;

                    default:
                        console.warn('Неизвестный тип сообщения:', data.type);
                }
            } catch (err) {
                console.error('Ошибка обработки сообщения:', err);
                setError('Ошибка обработки сообщения сервера');
            }
        };

        ws.current.onmessage = handleMessage;
    };

    const initializeWebRTC = async (): Promise<void> => {
        try {
            cleanup();

            const { isIOS, isSafari, isHuawei } = detectPlatform();

            const config: RTCConfiguration = {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
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

            // Специфичные настройки ICE для iOS/Safari
            if (isIOS || isSafari) {
                pc.current.oniceconnectionstatechange = () => {
                    if (!pc.current) return;

                    console.log('iOS ICE state:', pc.current.iceConnectionState);

                    if (
                        pc.current.iceConnectionState === 'disconnected' ||
                        pc.current.iceConnectionState === 'failed'
                    ) {
                        console.log('iOS: ICE failed, restarting connection');
                        setTimeout(resetConnection, 1000);
                    }
                };

                pc.current.onicegatheringstatechange = () => {
                    if (pc.current?.iceGatheringState === 'complete') {
                        console.log('iOS: ICE gathering complete');
                    }
                };
            }

            // Специфичные настройки ICE для Huawei
            if (isHuawei) {
                pc.current.oniceconnectionstatechange = () => {
                    if (!pc.current) return;

                    console.log('Huawei ICE состояние:', pc.current.iceConnectionState);

                    if (
                        pc.current.iceConnectionState === 'disconnected' ||
                        pc.current.iceConnectionState === 'failed'
                    ) {
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
            let stream: MediaStream | null = null;
            console.log('initializeWebRTC: isCameraEnabled =', isCameraEnabled); // Добавляем лог
            if (isCameraEnabled) {
                console.log('initializeWebRTC: Запрашиваем медиапоток');
                stream = await navigator.mediaDevices.getUserMedia({
                    video: deviceIds.video
                        ? {
                            deviceId: { exact: deviceIds.video },
                            ...getVideoConstraints(),
                            ...(isIOS && !deviceIds.video ? { facingMode: 'user' } : {})
                        }
                        : getVideoConstraints(),
                    audio: deviceIds.audio
                        ? {
                            deviceId: { exact: deviceIds.audio },
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true
                        }
                        : true
                });
            } else {
                console.log('initializeWebRTC: Медиапоток не запрашивается, так как isCameraEnabled = false');
            }

            // Проверяем наличие видеотрека
            // const videoTracks = stream.getVideoTracks();
            // if (videoTracks.length === 0) {
            //     throw new Error('Не удалось получить видеопоток с устройства');
            // }

            // Применяем настройки для Huawei
            pc.current.getSenders().forEach(configureVideoSender);

            if (stream) {
                pc.current.getSenders().forEach(configureVideoSender);
                setLocalStream(stream);
                stream.getTracks().forEach(track => {
                    pc.current?.addTrack(track, stream);
                    console.log(`Добавлен ${track.kind} трек в PeerConnection:`, track.id);
                });
            } else {
                console.log('Медиапоток не запрошен, PeerConnection инициализирован без треков');
            }

            // Обработка ICE кандидатов
            pc.current.onicecandidate = (event) => {
                if (event.candidate && ws.current?.readyState === WebSocket.OPEN) {
                    try {
                        // Фильтруем нежелательные кандидаты
                        if (shouldSendIceCandidate(event.candidate)) {
                            ws.current.send(
                                JSON.stringify({
                                    type: 'ice_candidate',
                                    ice: event.candidate.toJSON(),
                                    room: roomId,
                                    preferredCodec,
                                    username
                                })
                            );
                            console.log('Отправлен ICE кандидат:', event.candidate);
                        }
                    } catch (err) {
                        console.error('Ошибка отправки ICE кандидата:', err);
                    }
                }
            };

            // Функция фильтрации ICE-кандидатов
            const shouldSendIceCandidate = (candidate: RTCIceCandidate) => {
                const { isIOS, isSafari, isHuawei } = detectPlatform();

                // Для Huawei отправляем только relay-кандидаты
                if (isHuawei) {
                    return candidate.candidate.includes('typ relay');
                }

                // Для iOS/Safari отправляем только relay и srflx кандидаты
                if (isIOS || isSafari) {
                    return (
                        candidate.candidate.includes('typ relay') ||
                        candidate.candidate.includes('typ srflx')
                    );
                }

                return true;
            };

            // Обработка входящих медиапотоков
            pc.current.ontrack = (event) => {
                if (event.streams && event.streams[0]) {
                    const stream = event.streams[0];
                    console.log('Получен поток в ontrack:', {
                        streamId: stream.id,
                        videoTracks: stream.getVideoTracks().length,
                        audioTracks: stream.getAudioTracks().length,
                        videoTrackEnabled: stream.getVideoTracks()[0]?.enabled,
                        videoTrackReadyState: stream.getVideoTracks()[0]?.readyState,
                        videoTrackId: stream.getVideoTracks()[0]?.id
                    });

                    const videoTrack = stream.getVideoTracks()[0];
                    if (videoTrack && videoTrack.enabled && videoTrack.readyState === 'live') {
                        console.log('Получен активный видеотрек:', videoTrack.id);
                        const newRemoteStream = new MediaStream();
                        stream.getTracks().forEach(track => {
                            newRemoteStream.addTrack(track);
                            console.log(`Добавлен ${track.kind} трек в remoteStream:`, track.id);
                        });
                        setRemoteStream(newRemoteStream);
                        setIsCallActive(true);
                        if (videoCheckTimeout.current) {
                            clearTimeout(videoCheckTimeout.current);
                            videoCheckTimeout.current = null;
                            console.log('Таймер проверки видео очищен: получен активный видеотрек');
                        }
                    } else {
                        console.warn('Входящий поток не содержит активного видеотрека');
                        startVideoCheckTimer();
                    }
                } else {
                    console.warn('Получен пустой поток в ontrack');
                    startVideoCheckTimer();
                }
            };

            // Обработка состояния ICE соединения
            pc.current.oniceconnectionstatechange = () => {
                if (!pc.current) return;

                console.log('Состояние ICE соединения:', pc.current.iceConnectionState);

                if (isHuawei && pc.current.iceConnectionState === 'connected') {
                    const stopHuaweiMonitor = startHuaweiPerformanceMonitor();
                    pc.current.onconnectionstatechange = () => {
                        if (pc.current?.connectionState === 'disconnected') {
                            stopHuaweiMonitor();
                        }
                    };
                    const originalCleanup = cleanup;
                    cleanup = () => {
                        stopHuaweiMonitor();
                        originalCleanup();
                    };
                }

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

            // Запускаем мониторинг соединения
            startConnectionMonitoring();

            //return stream; // Возвращаем MediaStream
        } catch (err) {
            console.error('Ошибка инициализации WebRTC:', err);
            setError(`Не удалось инициализировать WebRTC: ${err instanceof Error ? err.message : String(err)}`);
            cleanup();
            //return null; // Возвращаем null при ошибке
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
    const resetConnection = async () => {
        console.log('Запуск resetConnection');
        leaveRoom(); // Полная очистка соединения
    };

    const enableCamera = async () => {
        if (isCameraEnabled) {
            console.log('Камера и микрофон уже включены');
            return;
        }
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: deviceIds.video
                    ? {
                        deviceId: { exact: deviceIds.video },
                        ...getVideoConstraints(),
                        ...(detectPlatform().isIOS && !deviceIds.video ? { facingMode: 'user' } : {})
                    }
                    : getVideoConstraints(),
                audio: deviceIds.audio
                    ? {
                        deviceId: { exact: deviceIds.audio },
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                    : true
            });
            if (localStream) {
                mediaStream.getTracks().forEach(track => {
                    localStream.addTrack(track);
                    if (pc.current) {
                        const sender = pc.current.getSenders().find(s => s.track?.kind === track.kind);
                        if (sender) {
                            sender.replaceTrack(track);
                        } else {
                            pc.current.addTrack(track, localStream);
                        }
                        if (track.kind === 'video') {
                            configureVideoSender(pc.current.getSenders().find(s => s.track === track)!);
                        }
                    }
                });
                setLocalStream(new MediaStream(localStream.getTracks()));
            } else {
                setLocalStream(mediaStream);
                mediaStream.getTracks().forEach(track => {
                    if (pc.current) {
                        pc.current.addTrack(track, mediaStream);
                        if (track.kind === 'video') {
                            configureVideoSender(pc.current.getSenders().find(s => s.track === track)!);
                        }
                    }
                });
            }
            setIsCameraEnabled(true);
            console.log('Камера и микрофон успешно включены');
        } catch (err) {
            console.error('Ошибка включения камеры и микрофона:', err);
            setError(`Ошибка включения медиа: ${err instanceof Error ? err.message : String(err)}`);
        }
    };

    const disableCamera = () => {
        if (!isCameraEnabled || !localStream) {
            console.log('Камера и микрофон уже отключены или локальный поток отсутствует');
            return;
        }
        try {
            localStream.getTracks().forEach(track => {
                track.stop();
                console.log(`Остановлен ${track.kind} трек: ${track.id}`);
            });
            setLocalStream(null);
            if (pc.current) {
                pc.current.getSenders().forEach(sender => {
                    if (sender.track) {
                        sender.replaceTrack(null);
                        console.log(`${sender.track.kind} трек удалён из PeerConnection`);
                    }
                });
            }
            setIsCameraEnabled(false);
            console.log('Камера и микрофон успешно отключены');
        } catch (err) {
            console.error('Ошибка отключения камеры и микрофона:', err);
            setError(`Ошибка отключения медиа: ${err instanceof Error ? err.message : String(err)}`);
        }
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


    const sendWebSocketMessage = (message: WebSocketMessage) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            console.log('Отправка WebSocket-сообщения:', message);
            ws.current.send(JSON.stringify(message));
        } else {
            console.error('WebSocket не открыт для отправки:', message);
        }
    };

    const joinRoom = async (uniqueUsername: string, customRoomId?: string) => {
        console.log('Запуск joinRoom, полная очистка перед новым соединением');
        leaveRoom(); // Полная очистка перед новым соединением
        setError(null);
        setIsInRoom(false);
        setIsConnected(false);
        setIsLeader(false);

        try {
            if (!(await connectWebSocket())) {
                throw new Error('Не удалось подключиться к WebSocket');
            }

            setupWebSocketListeners();

            // if (!(await initializeWebRTC())) {
            //     throw new Error('Не удалось инициализировать WebRTC');
            // }
            await initializeWebRTC();

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
                            console.log('Получено room_info, очищаем таймер');
                            cleanupEvents();
                            setIsInRoom(true);
                            setUsers(data.data?.users || []);
                            setError(null); // Сбрасываем ошибку при успешном подключении
                            retryAttempts.current = 0; // Сбрасываем счетчик попыток
                            setRetryCount(0);
                            resolve();
                        } else if (data.type === 'error') {
                            console.error('Ошибка от сервера:', data.data);
                            cleanupEvents();
                            if (data.data === 'Room does not exist. Leader must join first.') {
                                if (retryAttempts.current < MAX_RETRIES) {
                                    console.log('Комната не существует, повторная попытка через 5 секунд');
                                    webRTCRetryTimeoutRef.current = setTimeout(() => {
                                        retryAttempts.current += 1;
                                        setRetryCount(retryAttempts.current);
                                        joinRoom(uniqueUsername, customRoomId).catch(console.error);
                                    }, 5000);
                                    return;
                                } else {
                                    setError('Лидер не подключился после максимального количества попыток');
                                    reject(new Error('Достигнуто максимальное количество попыток подключения'));
                                }
                            } else {
                                setError(data.data || 'Ошибка входа в комнату');
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
                    ws.current?.removeEventListener('message', onMessage);
                    if (connectionTimeout.current) {
                        clearTimeout(connectionTimeout.current);
                        connectionTimeout.current = null;
                    }
                };

                connectionTimeout.current = setTimeout(() => {
                    cleanupEvents();
                    console.error('Таймаут ожидания ответа от сервера');
                    setError('Таймаут ожидания ответа от сервера');
                    reject(new Error('Таймаут ожидания ответа от сервера'));
                }, 15000);

                ws.current.addEventListener('message', onMessage);

                const effectiveRoomId = customRoomId || roomId.replace(/-/g, '');
                sendWebSocketMessage({
                    type: 'join',
                    room: effectiveRoomId,
                    username: uniqueUsername,
                    isLeader: false,
                    preferredCodec,
                });
                console.log('Отправлен запрос на подключение:', {
                    action: 'join',
                    room: effectiveRoomId,
                    username: uniqueUsername,
                    isLeader: false,
                    preferredCodec,
                });
            });

            shouldCreateOffer.current = false;
            startVideoCheckTimer();
        } catch (err) {
            console.error('Ошибка входа в комнату:', err);
            setError(`Ошибка входа в комнату: ${err instanceof Error ? err.message : String(err)}`);

            cleanup();
            if (ws.current) {
                ws.current.close();
                ws.current = null;
            }

            if (retryAttempts.current < MAX_RETRIES) {
                console.log('Планируем повторную попытку через 5 секунд');
                webRTCRetryTimeoutRef.current = setTimeout(() => {
                    retryAttempts.current += 1;
                    setRetryCount(retryAttempts.current);
                    joinRoom(uniqueUsername, customRoomId).catch(console.error);
                }, 5000);
            } else {
                console.error('Исчерпаны все попытки подключения');
                setError('Не удалось подключиться после максимального количества попыток');
            }
        }
    };

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
        ws: ws.current,
        activeCodec,
        isCameraEnabled, // Добавляем состояние камеры
        enableCamera, // Добавляем функцию включения камеры
        disableCamera
    };
};

отвечай на русском, локальный трек оставь пустым, локальные девайсы видео и звук не используй. мы используем только клиент, клиент комнаты не создает. Клиент только присоединяется к комнате, которую создает андройд устройство. Браузер - только подключается.