Ведомый браузер
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\webrtc\components\DeviceSelector.tsx
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\webrtc\components\VideoPlayer.tsx
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\webrtc\hooks
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\webrtc\hooks\useWebRTC.ts
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\webrtc\lib
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\webrtc\lib\signaling.ts
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\webrtc\lib\webrtc.ts
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\webrtc\index.tsx
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\webrtc\styles.module.css
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\webrtc\types.ts
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\webrtc\VideoCallApp.tsx


// file: docker-ardua/components/webrtc/components/DeviceSelector.tsx
//app\webrtc\components\DeviceSelector.tsx
import { useState, useEffect } from 'react';
import styles from '../styles.module.css';

interface DeviceSelectorProps {
devices?: MediaDeviceInfo[];
selectedDevices: {
video: string;
audio: string;
};
onChange: (type: 'video' | 'audio', deviceId: string) => void;
onRefresh?: () => Promise<void>;
}

export const DeviceSelector = ({
devices,
selectedDevices,
onChange,
onRefresh
}: DeviceSelectorProps) => {
const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        if (devices) {
            updateDeviceLists(devices);
        }
    }, [devices]);

    const updateDeviceLists = (deviceList: MediaDeviceInfo[]) => {
        setVideoDevices(deviceList.filter(d => d.kind === 'videoinput'));
        setAudioDevices(deviceList.filter(d => d.kind === 'audioinput'));
    };

    const handleRefresh = async () => {
        if (!onRefresh) return;

        setIsRefreshing(true);
        try {
            await onRefresh();
        } catch (error) {
            console.error('Error refreshing devices:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <div>
            <div>
                <label>Камера:</label>
                <select
                    value={selectedDevices.video}
                    onChange={(e) => onChange('video', e.target.value)}
                    disabled={videoDevices.length === 0}
                >
                    {videoDevices.length === 0 ? (
                        <option value="">Камеры не найдены</option>
                    ) : (
                        <>
                            <option value="">-- Выберите камеру --</option>
                            {videoDevices.map(device => (
                                <option key={device.deviceId} value={device.deviceId}>
                                    {device.label || `Камера ${videoDevices.indexOf(device) + 1}`}
                                </option>
                            ))}
                        </>
                    )}
                </select>
            </div>

            <div>
                <label>Микрофон:</label>
                <select
                    value={selectedDevices.audio}
                    onChange={(e) => onChange('audio', e.target.value)}
                    disabled={audioDevices.length === 0}
                >
                    {audioDevices.length === 0 ? (
                        <option value="">Микрофоны не найдены</option>
                    ) : (
                        <>
                            <option value="">-- Выберите микрофон --</option>
                            {audioDevices.map(device => (
                                <option key={device.deviceId} value={device.deviceId}>
                                    {device.label || `Микрофон ${audioDevices.indexOf(device) + 1}`}
                                </option>
                            ))}
                        </>
                    )}
                </select>
            </div>

            <button
                onClick={handleRefresh}
                disabled={isRefreshing}
            >
                {isRefreshing ? 'Обновление...' : 'Обновить устройства'}
            </button>
        </div>
    );
};

// file: docker-ardua/components/webrtc/components/VideoPlayer.tsx
import { useEffect, useRef, useState } from 'react'

interface VideoPlayerProps {
stream: MediaStream | null;
muted?: boolean;
className?: string;
transform?: string;
videoRef?: React.RefObject<HTMLVideoElement | null>;
}

type VideoSettings = {
rotation: number;
flipH: boolean;
flipV: boolean;
};

export const VideoPlayer = ({ stream, muted = false, className, transform, videoRef }: VideoPlayerProps) => {
const internalVideoRef = useRef<HTMLVideoElement>(null)
const [computedTransform, setComputedTransform] = useState<string>('')
const [isRotated, setIsRotated] = useState(false)

    // Use the provided ref or the internal one
    const actualVideoRef = videoRef || internalVideoRef

    useEffect(() => {
        // Apply transformations and detect rotation
        if (typeof transform === 'string') {
            setComputedTransform(transform)
            // Check if transform includes 90 or 270 degree rotation
            setIsRotated(transform.includes('rotate(90deg') || transform.includes('rotate(270deg)'))
        } else {
            try {
                const saved = localStorage.getItem('videoSettings')
                if (saved) {
                    const { rotation, flipH, flipV } = JSON.parse(saved) as VideoSettings
                    let fallbackTransform = ''
                    if (rotation !== 0) fallbackTransform += `rotate(${rotation}deg) `
                    fallbackTransform += `scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`
                    setComputedTransform(fallbackTransform)
                    setIsRotated(rotation === 90 || rotation === 270)
                } else {
                    setComputedTransform('')
                    setIsRotated(false)
                }
            } catch (e) {
                console.error('Error parsing saved video settings:', e)
                setComputedTransform('')
                setIsRotated(false)
            }
        }
    }, [transform])

    useEffect(() => {
        const video = actualVideoRef.current
        if (!video) return

        const handleCanPlay = () => {
            video.play().catch(e => {
                console.error('Playback failed:', e)
                video.muted = true
                video.play().catch(e => console.error('Muted playback also failed:', e))
            })
        }

        video.addEventListener('canplay', handleCanPlay)

        if (stream) {
            video.srcObject = stream
        } else {
            video.srcObject = null
        }

        return () => {
            video.removeEventListener('canplay', handleCanPlay)
            video.srcObject = null
        }
    }, [stream, actualVideoRef])

    return (
        <video
            ref={actualVideoRef}
            autoPlay
            playsInline
            muted={muted}
            className={`${className} ${isRotated ? 'rotated' : ''}`}
            style={{
                transform: computedTransform,
                transformOrigin: 'center center',
            }}
        />
    )
}

// file: docker-ardua/components/webrtc/hooks/useWebRTC.ts
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
// Добавляем новый тип сообщения
force_disconnect?: boolean;
}

export const useWebRTC = (
deviceIds: { video: string; audio: string },
username: string,
roomId: string
) => {
const [localStream, setLocalStream] = useState<MediaStream | null>(null);
const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
const [users, setUsers] = useState<string[]>([]);
const [isCallActive, setIsCallActive] = useState(false);
const [isConnected, setIsConnected] = useState(false);
const [isInRoom, setIsInRoom] = useState(false);
const [error, setError] = useState<string | null>(null);
const [retryCount, setRetryCount] = useState(0);

    const ws = useRef<WebSocket | null>(null);
    const pc = useRef<RTCPeerConnection | null>(null);
    const pendingIceCandidates = useRef<RTCIceCandidate[]>([]);
    const isNegotiating = useRef(false);
    const shouldCreateOffer = useRef(false);
    const connectionTimeout = useRef<NodeJS.Timeout | null>(null);
    const statsInterval = useRef<NodeJS.Timeout | null>(null);
    const videoCheckTimeout = useRef<NodeJS.Timeout | null>(null);
    const retryAttempts = useRef(0);

    // Максимальное количество попыток переподключения
    const MAX_RETRIES = 10;
    const VIDEO_CHECK_TIMEOUT = 4000; // 4 секунд для проверки видео

    const normalizeSdp = (sdp: string | undefined): string => {
        if (!sdp) return '';

        // Сначала очищаем от network-cost
        let normalized = sdp.replace(/a=network-cost:.+\r\n/g, '');

        normalized = normalized.trim();

        if (!normalized.startsWith('v=')) {
            normalized = 'v=0\r\n' + normalized;
        }
        if (!normalized.includes('\r\no=')) {
            normalized = normalized.replace('\r\n', '\r\no=- 0 0 IN IP4 0.0.0.0\r\n');
        }
        if (!normalized.includes('\r\ns=')) {
            normalized = normalized.replace('\r\n', '\r\ns=-\r\n');
        }
        if (!normalized.includes('\r\nt=')) {
            normalized = normalized.replace('\r\n', '\r\nt=0 0\r\n');
        }

        return normalized + '\r\n';
    };

    const cleanup = () => {
        // Очистка таймеров
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

        // Очистка WebRTC соединения
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

        // Остановка медиапотоков
        if (localStream) {
            localStream.getTracks().forEach(track => {
                track.stop();
                track.dispatchEvent(new Event('ended'));
            });
            setLocalStream(null);
        }

        if (remoteStream) {
            remoteStream.getTracks().forEach(track => {
                track.stop();
                track.dispatchEvent(new Event('ended'));
            });
            setRemoteStream(null);
        }

        setIsCallActive(false);
        pendingIceCandidates.current = [];
        isNegotiating.current = false;
        shouldCreateOffer.current = false;
        retryAttempts.current = 0;
    };


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
                ws.current = new WebSocket('wss://ardua.site/ws');

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
                    setError('Ошибка подключения');
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



    const setupWebSocketListeners = () => {
        if (!ws.current) return;

        const handleMessage = async (event: MessageEvent) => {
            try {
                const data: WebSocketMessage = JSON.parse(event.data);
                console.log('Получено сообщение:', data);

                // Добавляем обработку switch_camera
                if (data.type === 'switch_camera_ack') {
                    console.log('Камера на Android успешно переключена');
                    // Можно показать уведомление пользователю
                }

                // Добавляем обработку reconnect_request
                if (data.type === 'reconnect_request') {
                    console.log('Server requested reconnect');
                    setTimeout(() => {
                        resetConnection();
                    }, 1000);
                    return;
                }

                if (data.type === 'force_disconnect') {
                    // Обработка принудительного отключения
                    console.log('Получена команда принудительного отключения');
                    setError('Вы были отключены, так как подключился другой зритель');

                    // Останавливаем все медиапотоки
                    if (remoteStream) {
                        remoteStream.getTracks().forEach(track => track.stop());
                    }

                    // Закрываем PeerConnection
                    if (pc.current) {
                        pc.current.close();
                        pc.current = null;
                    }
                    leaveRoom();
                    // Очищаем состояние
                    setRemoteStream(null);
                    setIsCallActive(false);
                    setIsInRoom(false);

                    return;
                }


                if (data.type === 'room_info') {
                    setUsers(data.data.users || []);
                }
                else if (data.type === 'error') {
                    setError(data.data);
                }
                else if (data.type === 'offer') {
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

                            ws.current.send(JSON.stringify({
                                type: 'answer',
                                sdp: normalizedAnswer,
                                room: roomId,
                                username
                            }));

                            setIsCallActive(true);
                            isNegotiating.current = false;

                            // Запускаем проверку получения видео
                            startVideoCheckTimer();
                        } catch (err) {
                            console.error('Ошибка обработки оффера:', err);
                            setError('Ошибка обработки предложения соединения');
                            isNegotiating.current = false;
                        }
                    }
                }
                else if (data.type === 'answer') {
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
                }
                else if (data.type === 'ice_candidate') {
                    if (data.ice) {
                        try {
                            const candidate = new RTCIceCandidate(data.ice);

                            if (pc.current && pc.current.remoteDescription) {
                                await pc.current.addIceCandidate(candidate);
                            } else {
                                pendingIceCandidates.current.push(candidate);
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

    const createAndSendOffer = async () => {
        if (!pc.current || !ws.current || ws.current.readyState !== WebSocket.OPEN) {
            return;
        }

        try {
            const offer = await pc.current.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true,
                iceRestart: false,
            });

            const standardizedOffer = {
                ...offer,
                sdp: normalizeSdp(offer.sdp)
            };

            console.log('Устанавливаем локальное описание с оффером');
            await pc.current.setLocalDescription(standardizedOffer);

            ws.current.send(JSON.stringify({
                type: "offer",
                sdp: standardizedOffer,
                room: roomId,
                username
            }));

            setIsCallActive(true);

            // Запускаем проверку получения видео
            startVideoCheckTimer();
        } catch (err) {
            console.error('Ошибка создания оффера:', err);
            setError('Ошибка создания предложения соединения');
        }
    };

    const initializeWebRTC = async () => {
        try {
            cleanup();

            const config: RTCConfiguration = {
                iceServers: [
                    {
                        urls: [
                            'turn:ardua.site:3478',  // UDP/TCP
                            // 'turns:ardua.site:5349'   // TLS (если настроен)
                        ],
                        username: 'user1',     // Исправлено: username
                        credential: 'pass1'    // Исправлено: credential
                    },
                    {
                        urls: [
                            'stun:ardua.site:3478',
                            // 'stun:stun.l.google.com:19301',
                            // 'stun:stun.l.google.com:19302',
                            // 'stun:stun.l.google.com:19303',
                            // 'stun:stun.l.google.com:19304',
                            // 'stun:stun.l.google.com:19305',
                            // 'stun:stun1.l.google.com:19301',
                            // 'stun:stun1.l.google.com:19302',
                            // 'stun:stun1.l.google.com:19303',
                            // 'stun:stun1.l.google.com:19304',
                            // 'stun:stun1.l.google.com:19305'
                        ]
                    }
                ],
                iceTransportPolicy: 'all',
                bundlePolicy: 'max-bundle',
                rtcpMuxPolicy: 'require'
            };

            pc.current = new RTCPeerConnection(config);

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
                        if (event.candidate.candidate &&
                            event.candidate.candidate.length > 0 &&
                            !event.candidate.candidate.includes('0.0.0.0')) {

                            ws.current.send(JSON.stringify({
                                type: 'ice_candidate',
                                ice: {
                                    candidate: event.candidate.candidate,
                                    sdpMid: event.candidate.sdpMid || '0',
                                    sdpMLineIndex: event.candidate.sdpMLineIndex || 0
                                },
                                room: roomId,
                                username
                            }));
                        }
                    } catch (err) {
                        console.error('Ошибка отправки ICE кандидата:', err);
                    }
                }
            };

            // Обработка входящих медиапотоков
            pc.current.ontrack = (event) => {
                if (event.streams && event.streams[0]) {
                    // Проверяем, что видеопоток содержит данные
                    const videoTrack = event.streams[0].getVideoTracks()[0];
                    if (videoTrack) {
                        const videoElement = document.createElement('video');
                        videoElement.srcObject = new MediaStream([videoTrack]);
                        videoElement.onloadedmetadata = () => {
                            if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
                                setRemoteStream(event.streams[0]);
                                setIsCallActive(true);

                                // Видео получено, очищаем таймер проверки
                                if (videoCheckTimeout.current) {
                                    clearTimeout(videoCheckTimeout.current);
                                    videoCheckTimeout.current = null;
                                }
                            } else {
                                console.warn('Получен пустой видеопоток');
                            }
                        };
                    } else {
                        console.warn('Входящий поток не содержит видео');
                    }
                }
            };

            // Обработка состояния ICE соединения
            pc.current.oniceconnectionstatechange = () => {
                if (!pc.current) return;

                if (pc.current?.iceConnectionState === 'disconnected' ||
                    pc.current?.iceConnectionState === 'failed') {
                    console.log('ICE соединение разорвано, возможно нас заменили');
                    leaveRoom();
                }

                console.log('Состояние ICE соединения:', pc.current.iceConnectionState);

                switch (pc.current.iceConnectionState) {
                    case 'failed':
                        console.log('Перезапуск ICE...');
                        setTimeout(() => {
                            if (pc.current && pc.current.iceConnectionState === 'failed') {
                                pc.current.restartIce();
                                if (isInRoom && !isCallActive) {
                                    createAndSendOffer().catch(console.error);
                                }
                            }
                        }, 1000);
                        break;

                    case 'disconnected':
                        console.log('Соединение прервано...');
                        setIsCallActive(false);
                        setTimeout(() => {
                            if (pc.current && pc.current.iceConnectionState === 'disconnected') {
                                createAndSendOffer().catch(console.error);
                            }
                        }, 2000);
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

    const startConnectionMonitoring = () => {
        if (statsInterval.current) {
            clearInterval(statsInterval.current);
        }

        statsInterval.current = setInterval(async () => {
            if (!pc.current || !isCallActive) return;

            try {
                const stats = await pc.current.getStats();
                let hasActiveVideo = false;

                stats.forEach(report => {
                    if (report.type === 'inbound-rtp' && report.kind === 'video') {
                        if (report.bytesReceived > 0) {
                            hasActiveVideo = true;
                        }
                    }
                });

                if (!hasActiveVideo && isCallActive) {
                    console.warn('Нет активного видеопотока, пытаемся восстановить...');
                    resetConnection();
                }
            } catch (err) {
                console.error('Ошибка получения статистики:', err);
            }
        }, 5000);
    };

    const resetConnection = async () => {
        if (retryAttempts.current >= MAX_RETRIES) {
            setError('Не удалось восстановить соединение после нескольких попыток');
            leaveRoom();
            return;
        }

        retryAttempts.current += 1;
        setRetryCount(retryAttempts.current);
        console.log(`Попытка восстановления #${retryAttempts.current}`);

        try {
            await leaveRoom();
            await new Promise(resolve => setTimeout(resolve, 1000 * retryAttempts.current));
            await joinRoom(username);
        } catch (err) {
            console.error('Ошибка при восстановлении соединения:', err);
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

    const joinRoom = async (uniqueUsername: string) => {
        setError(null);
        setIsInRoom(false);
        setIsConnected(false);

        try {
            // 1. Подключаем WebSocket
            if (!(await connectWebSocket())) {
                throw new Error('Не удалось подключиться к WebSocket');
            }

            setupWebSocketListeners();

            // 2. Инициализируем WebRTC
            if (!(await initializeWebRTC())) {
                throw new Error('Не удалось инициализировать WebRTC');
            }

            // 3. Отправляем запрос на присоединение к комнате
            await new Promise<void>((resolve, reject) => {
                if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
                    reject(new Error('WebSocket не подключен'));
                    return;
                }

                const onMessage = (event: MessageEvent) => {
                    try {
                        const data = JSON.parse(event.data);
                        if (data.type === 'room_info') {
                            cleanupEvents();
                            resolve();
                        } else if (data.type === 'error') {
                            cleanupEvents();
                            reject(new Error(data.data || 'Ошибка входа в комнату'));
                        }
                    } catch (err) {
                        cleanupEvents();
                        reject(err);
                    }
                };

                const cleanupEvents = () => {
                    ws.current?.removeEventListener('message', onMessage);
                    if (connectionTimeout.current) {
                        clearTimeout(connectionTimeout.current);
                    }
                };

                connectionTimeout.current = setTimeout(() => {
                    cleanupEvents();
                    console.log('Таймаут ожидания ответа от сервера');
                }, 10000);

                ws.current.addEventListener('message', onMessage);
                ws.current.send(JSON.stringify({
                    action: "join",
                    room: roomId,
                    username: uniqueUsername,
                    isLeader: false // Браузер всегда ведомый
                }));
            });

            // 4. Успешное подключение
            setIsInRoom(true);
            shouldCreateOffer.current = true;

            // 5. Создаем оффер, если мы первые в комнате
            if (users.length === 0) {
                await createAndSendOffer();
            }

            // 6. Запускаем таймер проверки видео
            startVideoCheckTimer();

        } catch (err) {
            console.error('Ошибка входа в комнату:', err);
            setError(`Ошибка входа в комнату: ${err instanceof Error ? err.message : String(err)}`);

            // Полная очистка при ошибке
            cleanup();
            if (ws.current) {
                ws.current.close();
                ws.current = null;
            }

            // Автоматическая повторная попытка
            if (retryAttempts.current < MAX_RETRIES) {
                setTimeout(() => {
                    joinRoom(uniqueUsername).catch(console.error);
                }, 2000 * (retryAttempts.current + 1));
            }
        }
    };

    useEffect(() => {
        return () => {
            leaveRoom();
        };
    }, []);

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
        ws: ws.current, // Возвращаем текущее соединение
    };
};

// file: docker-ardua/components/webrtc/lib/webrtc.ts
//app\webrtc\lib\webrtc.ts
export function checkWebRTCSupport(): boolean {
if (typeof window === 'undefined') return false;

    const requiredAPIs = [
        'RTCPeerConnection',
        'RTCSessionDescription',
        'RTCIceCandidate',
        'MediaStream',
        'navigator.mediaDevices.getUserMedia'
    ];

    return requiredAPIs.every(api => {
        try {
            if (api.includes('.')) {
                const [obj, prop] = api.split('.');
                return (window as any)[obj]?.[prop] !== undefined;
            }
            return (window as any)[api] !== undefined;
        } catch {
            return false;
        }
    });
}







// file: docker-ardua/components/webrtc/lib/signaling.ts
// file: client/app/webrtc/lib/signaling.ts
import { RoomInfo, SignalingMessage, SignalingClientOptions } from '../types';

export class SignalingClient {
private ws: WebSocket | null = null;
private reconnectAttempts = 0;
private connectionTimeout: NodeJS.Timeout | null = null;
private connectionPromise: Promise<void> | null = null;
private resolveConnection: (() => void) | null = null;

    public onRoomInfo: (data: RoomInfo) => void = () => {};
    public onOffer: (data: RTCSessionDescriptionInit) => void = () => {};
    public onAnswer: (data: RTCSessionDescriptionInit) => void = () => {};
    public onCandidate: (data: RTCIceCandidateInit) => void = () => {};
    public onError: (error: string) => void = () => {};
    public onLeave: (username?: string) => void = () => {};
    public onJoin: (username: string) => void = () => {};

    constructor(
        private url: string,
        private options: SignalingClientOptions = {}
    ) {
        this.options = {
            maxReconnectAttempts: 5,
            reconnectDelay: 1000,
            connectionTimeout: 5000,
            ...options
        };
    }

    public get isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    public connect(roomId: string, username: string): Promise<void> {
        if (this.ws) {
            this.ws.close();
        }

        this.ws = new WebSocket(this.url);
        this.setupEventListeners();

        this.connectionPromise = new Promise((resolve, reject) => {
            this.resolveConnection = resolve;

            this.connectionTimeout = setTimeout(() => {
                if (!this.isConnected) {
                    this.handleError('Connection timeout');
                    reject(new Error('Connection timeout'));
                }
            }, this.options.connectionTimeout);

            this.ws!.onopen = () => {
                this.ws!.send(JSON.stringify({
                    type: 'join',
                    room: roomId,
                    username: username
                }));
            };
        });

        return this.connectionPromise;
    }

    private setupEventListeners(): void {
        if (!this.ws) return;

        this.ws.onmessage = (event) => {
            try {
                const message: SignalingMessage = JSON.parse(event.data);

                if (!('type' in message)) {
                    console.warn('Received message without type:', message);
                    return;
                }

                switch (message.type) {
                    case 'room_info':
                        this.onRoomInfo(message.data);
                        break;
                    case 'error':
                        this.onError(message.data);
                        break;
                    case 'offer':
                        this.onOffer(message.sdp);
                        break;
                    case 'answer':
                        this.onAnswer(message.sdp);
                        break;
                    case 'candidate':
                        this.onCandidate(message.candidate);
                        break;
                    case 'leave':
                        this.onLeave(message.data);
                        break;
                    case 'join':
                        this.onJoin(message.data);
                        break;
                    default:
                        console.warn('Unknown message type:', message);
                }
            } catch (error) {
                this.handleError('Invalid message format');
            }
        };

        this.ws.onclose = () => {
            console.log('Signaling connection closed');
            this.cleanup();
            this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
            this.handleError(`Connection error: ${error}`);
        };
    }

    public sendOffer(offer: RTCSessionDescriptionInit): Promise<void> {
        return this.send({ type: 'offer', sdp: offer });
    }

    public sendAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
        return this.send({ type: 'answer', sdp: answer });
    }

    public sendCandidate(candidate: RTCIceCandidateInit): Promise<void> {
        return this.send({ type: 'candidate', candidate });
    }

    public sendLeave(username: string): Promise<void> {
        return this.send({ type: 'leave', data: username });
    }

    private send(data: SignalingMessage): Promise<void> {
        if (!this.isConnected) {
            return Promise.reject(new Error('WebSocket not connected'));
        }

        try {
            this.ws!.send(JSON.stringify(data));
            return Promise.resolve();
        } catch (error) {
            console.error('Send error:', error);
            return Promise.reject(error);
        }
    }

    private attemptReconnect(): void {
        if (this.reconnectAttempts >= (this.options.maxReconnectAttempts || 5)) {
            return this.handleError('Max reconnection attempts reached');
        }

        this.reconnectAttempts++;
        console.log(`Reconnecting (attempt ${this.reconnectAttempts})`);

        setTimeout(() => this.connect('', ''), this.options.reconnectDelay);
    }

    private handleError(error: string): void {
        console.error('Signaling error:', error);
        this.onError(error);
        this.cleanup();
    }

    private cleanup(): void {
        this.clearTimeout(this.connectionTimeout);
        if (this.resolveConnection) {
            this.resolveConnection();
            this.resolveConnection = null;
        }
        this.connectionPromise = null;
    }

    private clearTimeout(timer: NodeJS.Timeout | null): void {
        if (timer) clearTimeout(timer);
    }

    public close(): void {
        this.cleanup();
        this.ws?.close();
    }
}

// file: docker-ardua/components/webrtc/index.tsx
// file: client/app/webrtc/index.tsx
'use client'

import { VideoCallApp } from './VideoCallApp';
import { useEffect, useState } from 'react';
import { checkWebRTCSupport } from './lib/webrtc';
import styles from './styles.module.css';

export default function WebRTCPage() {
const [isSupported, setIsSupported] = useState<boolean | null>(null);
const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

    useEffect(() => {
        const initialize = async () => {
            setIsSupported(checkWebRTCSupport());

            try {
                const mediaDevices = await navigator.mediaDevices.enumerateDevices();
                setDevices(mediaDevices);
            } catch (err) {
                console.error('Error getting devices:', err);
            }
        };

        initialize();
    }, []);

    if (isSupported === false) {
        return (
            <div>
                <h1>WebRTC is not supported in your browser</h1>
                <p>Please use a modern browser like Chrome, Firefox or Edge.</p>
            </div>
        );
    }

    return (
        <div>
            {isSupported === null ? (
                <div>Loading...</div>
            ) : (
                <VideoCallApp />
            )}
        </div>
    );
}

// file: docker-ardua/components/webrtc/styles.module.css
.container {
position: relative;
width: 99vw;
height: 100vh;
overflow: hidden;
background-color: #000;
font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.remoteVideoContainer {
position: absolute;
top: 0;
left: 0;
width: 100%;
height: 100%;
display: flex;
justify-content: center;
align-items: center;
background-color: #000;
transition: transform 0.3s ease;
}

:fullscreen .remoteVideoContainer {
width: 100vw;
height: 100vh;
background-color: #000;
}

.remoteVideo {
width: 100%;
height: 100%;
object-fit: contain;
transition: all 0.3s ease;
}

/* When rotated 90 or 270 degrees */
.remoteVideo[style*="rotate(90deg)"],
.remoteVideo[style*="rotate(270deg)"] {
height: 133%;
}

.remoteVideo.rotated {
height: 133%;
width: auto;
max-width: 100%;
}

.localVideoContainer {
position: absolute;
bottom: 20px;
right: 20px;
width: 20vw;
max-width: 300px;
min-width: 150px;
height: 15vh;
max-height: 200px;
min-height: 100px;
z-index: 10;
border: 2px solid #fff;
border-radius: 8px;
overflow: hidden;
background-color: #000;
box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.localVideo {
width: 100%;
height: 100%;
object-fit: cover;
transform: scaleX(-1);
}

.remoteVideoLabel{
position: absolute;
left: 0;
right: 0;
bottom: 0;
background-color: rgba(0, 0, 0, 0.7);
color: white;
padding: 8px 12px;
font-size: 14px;
text-align: center;
backdrop-filter: blur(5px);
}

.topControls {
position: absolute;
top: 15px;
left: 50%;
transform: translateX(-50%);
display: flex;
justify-content: space-between;
z-index: 20;
}

.toggleControlsButton {
background-color: rgba(255, 255, 255, 0.15);
color: white;
border: none;
border-radius: 20px;
padding: 8px 16px;
font-size: 14px;
cursor: pointer;
display: flex;
align-items: center;
gap: 8px;
transition: all 0.2s ease;
}

.toggleControlsButton:hover {
background-color: rgba(255, 255, 255, 0.25);
}

.videoControls {
display: flex;
gap: 8px;
flex-wrap: wrap;
justify-content: flex-end;
}

.controlButton {
background-color: rgba(255, 255, 255, 0.15);
color: #a6a6a6;
border: none;
border-radius: 20px;
min-width: 40px;
height: 40px;
font-size: 14px;
cursor: pointer;
display: flex;
justify-content: center;
align-items: center;
transition: all 0.2s ease;
padding: 0 12px;
}

.controlButton:hover {
background-color: rgba(255, 255, 255, 0.25);
}

.controlButton.active {
background-color: rgba(0, 150, 255, 0.7);
color: white;
}

.controlsOverlay {
position: absolute;
top: 70px;
left: 0;
right: 0;
background-color: rgba(0, 0, 0, 0);
color: white;
padding: 25px;
z-index: 15;
max-height: calc(100vh - 100px);
overflow-y: auto;
backdrop-filter: none;
border-radius: 0 0 12px 12px;
animation: fadeIn 0.3s ease-out;
}

.controls {
display: flex;
flex-direction: column;
gap: 20px;
max-width: 600px;
margin: 0 auto;
}

.inputGroup {
color: #6a6a6a;
display: flex;
flex-direction: column;
gap: 8px;
}

.button {
width: 100%;
padding: 12px;
font-weight: 500;
transition: all 0.2s ease;
}

.userList {
color: #6a6a6a;
margin-top: 20px;
background-color: rgba(255, 255, 255, 0.1);
padding: 15px;
border-radius: 8px;
}

.userList h3 {
margin-top: 0;
margin-bottom: 10px;
font-size: 16px;
}

.userList ul {
list-style: none;
padding: 0;
margin: 0;
display: flex;
flex-direction: column;
gap: 8px;
}

.userList li {
padding: 8px 12px;
background-color: rgba(255, 255, 255, 0.1);
border-radius: 6px;
}

.error {
color: #ff6b6b;
background-color: rgba(255, 107, 107, 0.1);
padding: 12px;
border-radius: 6px;
border-left: 4px solid #ff6b6b;
margin-bottom: 20px;
}

.connectionStatus {
padding: 12px;
/*background-color: rgba(255, 255, 255, 0.1);*/
border-radius: 6px;
margin-bottom: 15px;
font-weight: 500;
}

.deviceSelection {
color: #6a6a6a;
margin-top: 20px;
/*background-color: rgba(255, 255, 255, 0.1);*/
padding: 15px;
border-radius: 8px;
}

.deviceSelection h3 {
margin-top: 0;
margin-bottom: 15px;
}

@keyframes fadeIn {
from { opacity: 0; transform: translateY(-10px); }
to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
.localVideoContainer {
width: 25vw;
height: 20vh;
}

    .controlsOverlay {
        padding: 15px;
    }

    .controlButton {
        width: 36px;
        height: 36px;
        font-size: 14px;
    }

    .videoControls {
        gap: 6px;
    }
}

/* Новые стили для вкладок */
.tabsContainer {
display: flex;
gap: 8px;
flex-wrap: wrap;
}

.tabButton {
background-color: rgba(255, 255, 255, 0.15);
color: white;
border: none;
border-radius: 20px;
padding: 8px 16px;
font-size: 14px;
cursor: pointer;
display: flex;
align-items: center;
gap: 8px;
transition: all 0.2s ease;
}

.tabButton:hover {
background-color: rgba(255, 255, 255, 0.25);
}

.activeTab {
background-color: rgba(0, 150, 255, 0.7);
}

.tabContent {
position: absolute;
top: 70px;
left: 0;
right: 0;
/*background-color: rgba(0, 0, 0, 0);*/
color: #c3c3c3;
z-index: 15;
max-height: calc(100vh - 0px);
overflow-y: auto;
backdrop-filter: none;
border-radius: 0 0 12px 12px;
animation: fadeIn 0.3s ease-out;
}

.videoControlsTab {
display: flex;
flex-direction: column;
gap: 20px;
}

.controlButtons {
display: flex;
flex-wrap: wrap;
gap: 8px;
justify-content: center;
}

/* Стили для панели логов */
.logsPanel {
position: fixed;
top: 0;
right: 0;
bottom: 0;
width: 300px;
background-color: rgba(0, 0, 0, 0.9);
z-index: 1000;
padding: 15px;
overflow-y: auto;
backdrop-filter: blur(5px);
user-select: none;
pointer-events: none;
}

.logsContent {
font-family: monospace;
font-size: 12px;
color: #ccc;
line-height: 1.5;
}

.logEntry {
margin-bottom: 4px;
white-space: nowrap;
overflow: hidden;
text-overflow: ellipsis;
}

/* Адаптивные стили */
@media (max-width: 768px) {
.tabsContainer {
gap: 5px;
}

    .tabButton {
        padding: 1px 3px;
        font-size: 8px;
    }

    .tabContent {
        padding: 15px;
    }

    .logsPanel {
        width: 200px;
    }
}


.statusIndicator {
display: flex;
align-items: center;
gap: 8px;
margin-left: 15px;
padding: 6px 12px;
border-radius: 20px;
background-color: rgba(0, 0, 0, 0.5);
backdrop-filter: blur(5px);
}

.statusDot {
width: 10px;
height: 10px;
border-radius: 50%;
}

.statusText {
font-size: 14px;
color: white;
}

.connected {
background-color: #10B981;
}

.pending {
background-color: #F59E0B;
animation: pulse 1.5s infinite;
}

.disconnected {
background-color: #EF4444;
}

@keyframes pulse {
0%, 100% {
opacity: 1;
}
50% {
opacity: 0.5;
}
}

.statusIndicator {
/* существующие стили */
will-change: contents; /* Оптимизация для браузера */
}

.statusDot, .statusText {
transition: all 0.3s ease;
}

.unsupportedContainer {
max-width: 600px;
margin: 2rem auto;
padding: 2rem;
background: #fff;
border-radius: 8px;
box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
text-align: center;
}

.unsupportedContainer h2 {
color: #e74c3c;
margin-bottom: 1rem;
}

.unsupportedContainer p {
margin-bottom: 1rem;
line-height: 1.6;
}

.browserList {
text-align: left;
background: #f8f9fa;
padding: 1rem;
border-radius: 6px;
margin: 1.5rem 0;
}

.browserList ul {
padding-left: 1.5rem;
margin: 0.5rem 0;
}

.note {
font-size: 0.9rem;
color: #666;
font-style: italic;
}

/* Стили для списка сохраненных комнат */
.savedRooms {
margin-top: 20px;
background-color: rgba(255, 255, 255, 0.1);
padding: 15px;
border-radius: 8px;
}

.savedRooms h3 {
margin-top: 0;
margin-bottom: 15px;
font-size: 16px;
}

.savedRooms ul {
list-style: none;
padding: 0;
margin: 0;
display: flex;
flex-direction: column;
gap: 8px;
}

.savedRoomItem {
display: flex;
justify-content: space-between;
align-items: center;
padding: 8px 12px;
background-color: rgba(255, 255, 255, 0.1);
border-radius: 6px;
}

.savedRoomItem span {
cursor: pointer;
flex-grow: 1;
}

.savedRoomItem span:hover {
text-decoration: underline;
}

.defaultRoom {
font-weight: bold;
color: #4CAF50;
}

.deleteRoomButton {
background-color: rgba(255, 99, 71, 0.2);
color: #FF6347;
border: none;
border-radius: 4px;
padding: 4px 8px;
cursor: pointer;
font-size: 12px;
margin-left: 10px;
}

.deleteRoomButton:hover {
background-color: rgba(255, 99, 71, 0.3);
}

// file: docker-ardua/components/webrtc/types.ts
// file: client/app/webrtc/types.ts
export interface RoomInfo {
users: string[];
}

export type SignalingMessage =
| { type: 'room_info'; data: RoomInfo }
| { type: 'error'; data: string }
| { type: 'offer'; sdp: RTCSessionDescriptionInit }
| { type: 'answer'; sdp: RTCSessionDescriptionInit }
| { type: 'candidate'; candidate: RTCIceCandidateInit }
| { type: 'join'; data: string }
| { type: 'leave'; data: string };

export interface User {
username: string;
stream?: MediaStream;
peerConnection?: RTCPeerConnection;
}

export interface SignalingClientOptions {
maxReconnectAttempts?: number;
reconnectDelay?: number;
connectionTimeout?: number;
}

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
const [roomId, setRoomId] = useState('') // С тире (XXXX-XXXX-XXXX-XXXX)
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
const remoteVideoRef = useRef<HTMLVideoElement>(null);
const localAudioTracks = useRef<MediaStreamTrack[]>([])
const [useBackCamera, setUseBackCamera] = useState(false)
const [savedRooms, setSavedRooms] = useState<SavedRoom[]>([])
const [showDeleteDialog, setShowDeleteDialog] = useState(false)
const [roomToDelete, setRoomToDelete] = useState<string | null>(null)


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
        ws
    } = useWebRTC(selectedDevices, username, roomId.replace(/-/g, '')) // Удаляем тире при передаче в useWebRTC

    // Загрузка сохраненных комнат и настроек из localStorage
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

                    // Находим комнату по умолчанию
                    const defaultRoom = rooms.find(r => r.isDefault)
                    if (defaultRoom) {
                        // Форматируем ID с тире для отображения
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

        loadSettings()
        loadSavedRooms()
        loadDevices()
    }, [])

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
        if (!isRoomIdComplete) return

        setIsJoining(true)
        try {
            // Устанавливаем выбранную комнату как дефолтную
            setDefaultRoom(roomId.replace(/-/g, ''))

            await joinRoom(username)
        } catch (error) {
            console.error('Error joining room:', error)
        } finally {
            setIsJoining(false)
        }
    }

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
        <div
            className={styles.container}
            suppressHydrationWarning // Добавляем это для игнорирования различий в атрибутах
        >
            <div
                ref={videoContainerRef}
                className={styles.remoteVideoContainer}
                suppressHydrationWarning
            >
                {isClient && ( // Оборачиваем в проверку isClient для клиент-сайд рендеринга
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
                                    Роль: {users[0] === username ? "Ведущий" : "Ведомый"}
                                </div>
                            )}
                        </div>

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
                            <Button onClick={leaveRoom} className={styles.button}>
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

            {/* Диалог подтверждения удаления комнаты */}
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

Server Go
package main

import (
"encoding/json"
"log"
"math/rand"
"net/http"
// "strings" // Удален неиспользуемый импорт
"sync"
"time"

	"github.com/gorilla/websocket"
	"github.com/pion/webrtc/v3"
)

var upgrader = websocket.Upgrader{
CheckOrigin: func(r *http.Request) bool { return true }, // Разрешаем соединения с любых источников
}

// Peer представляет подключенного пользователя (ведущего или ведомого)
type Peer struct {
conn     *websocket.Conn         // WebSocket соединение
pc       *webrtc.PeerConnection  // WebRTC PeerConnection
username string                  // Имя пользователя
room     string                  // Комната, к которой подключен пользователь
isLeader bool                    // true для Android (ведущий), false для браузера (ведомый)
mu       sync.Mutex              // Мьютекс для защиты доступа к pc и conn из разных горутин
}

// RoomInfo содержит информацию о комнате для отправки клиентам
type RoomInfo struct {
Users    []string `json:"users"`    // Список имен пользователей в комнате
Leader   string   `json:"leader"`   // Имя ведущего
Follower string   `json:"follower"` // Имя ведомого
}

var (
peers   = make(map[string]*Peer)             // Карта всех активных соединений (ключ - RemoteAddr)
rooms   = make(map[string]map[string]*Peer) // Карта комнат (ключ - имя комнаты, значение - карта пиров в комнате по username)
mu      sync.Mutex                           // Глобальный мьютекс для защиты доступа к peers и rooms
letters = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")
)

// Инициализация генератора случайных чисел
func init() {
rand.Seed(time.Now().UnixNano())
}

// Генерация случайной строки (не используется в текущей логике, но может пригодиться)
func randSeq(n int) string {
b := make([]rune, n)
for i := range b {
b[i] = letters[rand.Intn(len(letters))]
}
return string(b)
}

// getWebRTCConfig возвращает конфигурацию для WebRTC PeerConnection
func getWebRTCConfig() webrtc.Configuration {
return webrtc.Configuration{
ICEServers: []webrtc.ICEServer{
{
URLs:       []string{"turn:ardua.site:3478"}, // TURN сервер для обхода сложных NAT
Username:   "user1",
Credential: "pass1",
},
{URLs: []string{"stun:ardua.site:3478"}}, // STUN сервер для определения внешнего IP
},
ICETransportPolicy: webrtc.ICETransportPolicyAll,       // Пытаться использовать все виды ICE кандидатов (host, srflx, relay)
BundlePolicy:       webrtc.BundlePolicyMaxBundle,     // Собирать все медиа потоки в один транспортный поток
RTCPMuxPolicy:      webrtc.RTCPMuxPolicyRequire,      // Требовать мультиплексирование RTP и RTCP
SDPSemantics:       webrtc.SDPSemanticsUnifiedPlan, // Использовать современный стандарт описания сессий SDP
}
}

// logStatus выводит текущее состояние сервера (количество соединений, комнат и их состав) в лог
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

// getUsernames (не используется, но может быть полезна) возвращает список имен пользователей из карты пиров
func getUsernames(peers map[string]*Peer) []string {
usernames := make([]string, 0, len(peers))
for username := range peers {
usernames = append(usernames, username)
}
return usernames
}

// sendRoomInfo отправляет актуальную информацию о составе комнаты всем ее участникам
func sendRoomInfo(room string) {
mu.Lock()
defer mu.Unlock() // Разблокируем мьютекс в конце функции

	if roomPeers, exists := rooms[room]; exists {
		var leader, follower string
		users := make([]string, 0, len(roomPeers))

		// Собираем информацию о комнате
		for _, peer := range roomPeers {
			users = append(users, peer.username)
			if peer.isLeader {
				leader = peer.username
			} else {
				follower = peer.username
			}
		}

		roomInfo := RoomInfo{
			Users:    users,
			Leader:   leader,
			Follower: follower,
		}

		// Отправляем информацию каждому участнику комнаты
		for _, peer := range roomPeers {
			peer.mu.Lock() // Блокируем мьютекс пира перед использованием conn
			conn := peer.conn
			if conn != nil {
				log.Printf("Sending room_info to %s in room %s", peer.username, room)
				err := conn.WriteJSON(map[string]interface{}{
					"type": "room_info",
					"data": roomInfo,
				})
				if err != nil {
					// Используем WriteControl для отправки CloseMessage, если WriteJSON не удался
					// Это более надежный способ инициировать закрытие с ошибкой
					log.Printf("Error sending room info to %s (user: %s), attempting close: %v", conn.RemoteAddr(), peer.username, err)
					// Небольшая задержка перед отправкой CloseMessage
					time.Sleep(100 * time.Millisecond)
					conn.WriteControl(websocket.CloseMessage,
						websocket.FormatCloseMessage(websocket.CloseInternalServerErr, "Cannot send room info"),
						time.Now().Add(time.Second))
				}
			} else {
				log.Printf("Cannot send room info to %s, connection is nil", peer.username)
			}
			peer.mu.Unlock() // Разблокируем мьютекс пира
		}
	} else {
		log.Printf("Attempted to send room info for non-existent room '%s'", room)
	}
}

// closePeerConnection безопасно закрывает WebRTC и WebSocket соединения пира
func closePeerConnection(peer *Peer, reason string) {
if peer == nil {
return
}
peer.mu.Lock() // Блокируем мьютекс пира
defer peer.mu.Unlock()

	// 1. Закрываем WebRTC соединение
	if peer.pc != nil {
		log.Printf("Closing PeerConnection for %s (Reason: %s)", peer.username, reason)
		// Небольшая задержка перед закрытием, чтобы дать время на отправку последних сообщений
		time.Sleep(100 * time.Millisecond)
		if err := peer.pc.Close(); err != nil {
			log.Printf("Error closing peer connection for %s: %v", peer.username, err)
		}
		peer.pc = nil // Убираем ссылку
	}

	// 2. Закрываем WebSocket соединение
	if peer.conn != nil {
		log.Printf("Closing WebSocket connection for %s (Reason: %s)", peer.username, reason)
		// Отправляем сообщение о закрытии клиенту
		peer.conn.WriteControl(websocket.CloseMessage,
			websocket.FormatCloseMessage(websocket.CloseNormalClosure, reason),
			time.Now().Add(time.Second)) // Даем секунду на отправку
		// Закрываем соединение со стороны сервера
		peer.conn.Close()
		peer.conn = nil // Убираем ссылку
	}
}

// handlePeerJoin обрабатывает присоединение нового пользователя к комнате
// Возвращает созданный Peer или nil, если комната заполнена или произошла ошибка
func handlePeerJoin(room string, username string, isLeader bool, conn *websocket.Conn) (*Peer, error) {
mu.Lock() // Блокируем глобальный мьютекс для работы с rooms и peers
defer mu.Unlock()

	if _, exists := rooms[room]; !exists {
		log.Printf("Creating new room: %s", room)
		rooms[room] = make(map[string]*Peer)
	}

	roomPeers := rooms[room]

	// --- Логика Замены Ведомого ---
	// Если новый участник - ведомый (!isLeader)
	if !isLeader {
		var existingFollower *Peer = nil
		// var leaderPeer *Peer = nil // Удалено: Не используется в этом блоке

		// Ищем существующего ведомого в комнате
		for _, p := range roomPeers {
			if !p.isLeader {
				existingFollower = p // Нашли существующего ведомого
				break // Нам нужен только один
			}
			// if p.isLeader { // Удалено: Не используется в этом блоке
			// 	leaderPeer = p
			// }
		}

		// Если существующий ведомый найден, отключаем его
		if existingFollower != nil {
			log.Printf("Follower '%s' already exists in room '%s'. Disconnecting old follower to replace with new follower '%s'.", existingFollower.username, room, username)

			// 1. Отправляем команду на отключение старому ведомому
			existingFollower.mu.Lock() // Блокируем мьютекс старого ведомого
			if existingFollower.conn != nil {
				err := existingFollower.conn.WriteJSON(map[string]interface{}{
					"type": "force_disconnect",
					"data": "You have been replaced by another viewer.",
				})
				if err != nil {
					log.Printf("Error sending force_disconnect to %s: %v", existingFollower.username, err)
				}
			}
			existingFollower.mu.Unlock() // Разблокируем мьютекс старого ведомого

			// 2. Закрываем соединения старого ведомого (WebRTC и WebSocket)
			// Используем отдельную функцию для безопасного закрытия
			go closePeerConnection(existingFollower, "Replaced by new follower")

			// 3. Удаляем старого ведомого из комнаты и глобального списка пиров
			delete(roomPeers, existingFollower.username)
			// Удаляем из глобального списка peers по адресу соединения старого ведомого
			// Важно: нужно найти правильный ключ (адрес)
			var oldAddr string
			for addr, p := range peers { // Ищем адрес старого ведомого в глобальной карте
				if p == existingFollower {
					oldAddr = addr
					break
				}
			}
			if oldAddr != "" {
				delete(peers, oldAddr)
			} else {
				log.Printf("WARN: Could not find old follower %s in global peers map by object comparison.", existingFollower.username)
				// Попробуем удалить по адресу из соединения, если оно еще не nil
				if existingFollower.conn != nil {
					 delete(peers, existingFollower.conn.RemoteAddr().String())
				}
			}

			log.Printf("Old follower %s removed from room %s.", existingFollower.username, room)

			// Важно: После удаления старого ведомого, комната готова принять нового.
			// Продолжаем выполнение функции для добавления нового ведомого.
		}
	}

	// --- Проверка Лимита Участников ---
	// После потенциального удаления старого ведомого, снова проверяем размер комнаты
	var currentLeaderCount, currentFollowerCount int
	for _, p := range roomPeers {
		if p.isLeader {
			currentLeaderCount++
		} else {
			currentFollowerCount++
		}
	}

	// Проверяем, можно ли добавить нового участника
	if isLeader && currentLeaderCount > 0 {
		log.Printf("Room '%s' already has a leader. Cannot add another leader '%s'.", room, username)
		conn.WriteJSON(map[string]interface{}{"type": "error", "data": "Room already has a leader"})
		conn.Close()
		return nil, nil // Возвращаем nil, nil чтобы показать, что пир не был создан, но ошибки для сервера нет
	}
	if !isLeader && currentFollowerCount > 0 {
		// Эта проверка может быть излишней из-за логики замены выше, но оставим для надежности
		log.Printf("Room '%s' already has a follower. Cannot add another follower '%s'.", room, username)
		conn.WriteJSON(map[string]interface{}{"type": "error", "data": "Room already has a follower (should have been replaced)"})
		conn.Close()
		return nil, nil
	}
	if len(roomPeers) >= 2 && ( (isLeader && currentLeaderCount == 0) || (!isLeader && currentFollowerCount == 0) ){
         // Если мест < 2, но слот лидера/фолловера занят - это ошибка логики или гонка состояний
        log.Printf("Warning: Room '%s' has %d peers, but cannot add %s '%s'. LeaderCount: %d, FollowerCount: %d", room, len(roomPeers), map[bool]string{true: "leader", false: "follower"}[isLeader], username, currentLeaderCount, currentFollowerCount)
        // Продолжаем, т.к. предыдущие проверки должны были обработать это.
    }


	// --- Создание Нового PeerConnection ---
	// Каждый раз создаем НОВЫЙ PeerConnection для нового участника ИЛИ при переподключении
	log.Printf("Creating new PeerConnection for %s (isLeader: %v) in room %s", username, isLeader, room)
	peerConnection, err := webrtc.NewPeerConnection(getWebRTCConfig())
	if err != nil {
		log.Printf("Failed to create peer connection for %s: %v", username, err)
		return nil, err // Возвращаем ошибку, если PeerConnection не создан
	}

	peer := &Peer{
		conn:     conn,
		pc:       peerConnection,
		username: username,
		room:     room,
		isLeader: isLeader,
	}

	// --- Настройка Обработчиков PeerConnection ---

	// Обработчик для ICE кандидатов: отправляем кандидата другому пиру через WebSocket
	peerConnection.OnICECandidate(func(c *webrtc.ICECandidate) {
		if c == nil {
			log.Printf("ICE candidate gathering complete for %s", peer.username)
			return
		}

		candidateJSON := c.ToJSON()
		log.Printf("Generated ICE candidate for %s: %s", peer.username, candidateJSON.Candidate)

		peer.mu.Lock() // Блокируем мьютекс пира перед использованием conn
		if peer.conn != nil {
			// Отправляем кандидата напрямую клиенту, который его сгенерировал
			err := peer.conn.WriteJSON(map[string]interface{}{
				"type": "ice_candidate", // Тип сообщения для клиента
				"ice":  candidateJSON,    // Сам кандидат
			})
			if err != nil {
				log.Printf("Error sending ICE candidate to %s: %v", peer.username, err)
			}
		} else {
			log.Printf("Cannot send ICE candidate, connection for %s is nil.", peer.username)
		}
		peer.mu.Unlock() // Разблокируем мьютекс пира
	})

	// Обработчик входящих медиа-треков (в основном для отладки на сервере)
	peerConnection.OnTrack(func(track *webrtc.TrackRemote, receiver *webrtc.RTPReceiver) {
		log.Printf("Track received from %s: Type: %s, Codec: %s, SSRC: %d",
			peer.username, track.Kind(), track.Codec().MimeType, track.SSRC())
		// На сервере мы не обрабатываем медиа, просто логируем
		// Можно было бы сделать пересылку треков, но это сложнее и не требуется заданием
		// Просто читаем пакеты, чтобы избежать накопления буфера (рекомендация pion)
		go func() {
			buffer := make([]byte, 1500)
			for {
				_, _, readErr := track.Read(buffer)
				if readErr != nil {
					// Логгируем только если это не ожидаемое закрытие соединения
					// if readErr != io.EOF && !strings.Contains(readErr.Error(), "use of closed network connection") {
					// log.Printf("Track read error for %s (%s): %v", peer.username, track.Kind(), readErr)
					// }
					// Упрощенное логирование для уменьшения шума
					// log.Printf("Track read ended for %s (%s): %v", peer.username, track.Kind(), readErr)
					return
				}
			}
		}()
	})

	// Обработчик изменения состояния ICE соединения
	peerConnection.OnICEConnectionStateChange(func(state webrtc.ICEConnectionState) {
		log.Printf("ICE Connection State changed for %s: %s", peer.username, state.String())
		// Можно добавить логику реакции на failed/disconnected
	})

	// Обработчик изменения общего состояния PeerConnection
	peerConnection.OnConnectionStateChange(func(s webrtc.PeerConnectionState) {
		log.Printf("PeerConnection State changed for %s: %s", peer.username, s.String())
		// Если соединение разорвано или не удалось, инициируем очистку
		if s == webrtc.PeerConnectionStateFailed || s == webrtc.PeerConnectionStateClosed || s == webrtc.PeerConnectionStateDisconnected {
			log.Printf("PeerConnection state is %s for %s. Associated WebSocket likely closing soon.", s.String(), peer.username)
			// Основная очистка инициируется при закрытии WebSocket в handleWebSocket
		}
	})

	// --- Добавление Пира в Комнату и Глобальный Список ---
	rooms[room][username] = peer
	peers[conn.RemoteAddr().String()] = peer
	log.Printf("Peer %s (isLeader: %v) added to room %s", username, isLeader, room)

	// --- Инициирование Нового Соединения ---
	// **Ключевое изменение:** Вместо простого "resend_offer", мы явно просим лидера
	// создать НОВЫЙ оффер для ТОЛЬКО ЧТО подключившегося ведомого.
	// Это гарантирует "чистый старт" для WebRTC сессии при каждом подключении/переподключении ведомого.
	if !isLeader { // Если подключился ведомый
		// Ищем лидера в этой комнате (теперь ищем здесь)
		var leaderPeer *Peer = nil
		for _, p := range roomPeers {
			if p.isLeader {
				leaderPeer = p
				break
			}
		}

		if leaderPeer != nil {
			log.Printf("Requesting leader %s to create a NEW offer for the new follower %s", leaderPeer.username, peer.username)
			leaderPeer.mu.Lock() // Блокируем мьютекс лидера
			if leaderPeer.conn != nil {
				err := leaderPeer.conn.WriteJSON(map[string]interface{}{
					// Новый, более конкретный тип сообщения для лидера
					"type":             "create_offer_for_new_follower",
					"followerUsername": peer.username, // Можно передать имя ведомого, если лидеру нужно знать
				})
				if err != nil {
					log.Printf("Error sending 'create_offer_for_new_follower' to leader %s: %v", leaderPeer.username, err)
				}
			} else {
				log.Printf("Cannot send 'create_offer_for_new_follower', leader %s connection is nil", leaderPeer.username)
			}
			leaderPeer.mu.Unlock() // Разблокируем мьютекс лидера
		} else {
			log.Printf("Follower %s joined room %s, but no leader found yet to initiate offer.", peer.username, room)
		}
	} else {
		// Если подключился лидер, а ведомый УЖЕ есть (маловероятно при текущей логике, но возможно)
		var followerPeer *Peer
		for _, p := range roomPeers {
			if !p.isLeader {
				followerPeer = p
				break
			}
		}
		if followerPeer != nil {
			log.Printf("Leader %s joined room %s where follower %s already exists. Requesting leader to create offer.", peer.username, room, followerPeer.username)
			// Лидер сам должен будет инициировать оффер при подключении,
			// но можно и явно попросить для надежности.
			peer.mu.Lock()
			if peer.conn != nil {
				err := peer.conn.WriteJSON(map[string]interface{}{
					"type":             "create_offer_for_new_follower", // Используем тот же тип
					"followerUsername": followerPeer.username,
				})
				if err != nil {
					log.Printf("Error sending 'create_offer_for_new_follower' to self (leader %s): %v", peer.username, err)
				}
			}
			peer.mu.Unlock()
		}
	}


	return peer, nil // Возвращаем успешно созданный пир
}

// getLeader (вспомогательная функция) находит лидера в комнате
// Важно: Эта функция НЕ потокобезопасна сама по себе, использовать внутри блока mu.Lock()
func getLeader(room string) *Peer {
if roomPeers, exists := rooms[room]; exists {
for _, p := range roomPeers {
if p.isLeader {
return p
}
}
}
return nil
}

// getFollower (вспомогательная функция) находит ведомого в комнате
// Важно: Эта функция НЕ потокобезопасна сама по себе, использовать внутри блока mu.Lock()
func getFollower(room string) *Peer {
if roomPeers, exists := rooms[room]; exists {
for _, p := range roomPeers {
if !p.isLeader {
return p
}
}
}
return nil
}


func main() {
http.HandleFunc("/ws", handleWebSocket) // Обработчик WebSocket соединений
http.HandleFunc("/status", func(w http.ResponseWriter, r *http.Request) {
logStatus() // Вывод статуса в лог по запросу /status
w.Write([]byte("Status logged to console"))
})

	log.Println("Server starting on :8080")
	logStatus() // Начальный статус
	// Запуск HTTP сервера
	log.Fatal(http.ListenAndServe(":8080", nil))
}

// handleWebSocket обрабатывает входящие WebSocket соединения
func handleWebSocket(w http.ResponseWriter, r *http.Request) {
// Обновляем HTTP соединение до WebSocket
conn, err := upgrader.Upgrade(w, r, nil)
if err != nil {
log.Println("WebSocket upgrade error:", err)
return
}
// Важно: закрываем соединение при выходе из функции (при ошибке или штатном завершении)
// defer conn.Close() // Перенесли закрытие в логику очистки

	remoteAddr := conn.RemoteAddr().String()
	log.Printf("New WebSocket connection attempt from: %s", remoteAddr)

	// 1. Получаем инициализационные данные (комната, имя, роль)
	var initData struct {
		Room     string `json:"room"`
		Username string `json:"username"`
		IsLeader bool   `json:"isLeader"`
	}

	// Устанавливаем таймаут на чтение первого сообщения
	conn.SetReadDeadline(time.Now().Add(10 * time.Second)) // 10 секунд на отправку initData
	err = conn.ReadJSON(&initData)
	conn.SetReadDeadline(time.Time{}) // Сбрасываем таймаут после успешного чтения

	if err != nil {
		log.Printf("Read init data error from %s: %v. Closing connection.", remoteAddr, err)
		conn.Close() // Закрываем соединение, если не получили initData
		return
	}

	// Проверяем валидность данных
	if initData.Room == "" || initData.Username == "" {
		log.Printf("Invalid init data from %s: Room or Username is empty. Closing connection.", remoteAddr)
		conn.WriteJSON(map[string]interface{}{"type": "error", "data": "Room and Username cannot be empty"})
		conn.Close()
		return
	}

	log.Printf("User '%s' (isLeader: %v) attempting to join room '%s' from %s", initData.Username, initData.IsLeader, initData.Room, remoteAddr)

	// 2. Обрабатываем присоединение пира к комнате
	peer, err := handlePeerJoin(initData.Room, initData.Username, initData.IsLeader, conn)
	if err != nil {
		// Ошибка при создании PeerConnection на сервере
		log.Printf("Error handling peer join for %s: %v", initData.Username, err)
		conn.WriteJSON(map[string]interface{}{
			"type": "error",
			"data": "Server error joining room: " + err.Error(),
		})
		conn.Close() // Закрываем соединение при ошибке
		return
	}
	if peer == nil {
		// Пир не был создан (например, комната полна или роль уже занята)
		// Сообщение об ошибке уже отправлено внутри handlePeerJoin
		log.Printf("Peer %s was not created (room full or role taken?). Connection closed by handlePeerJoin.", initData.Username)
		// conn.Close() уже был вызван в handlePeerJoin в этом случае
		return
	}

	// Если пир успешно создан и добавлен
	log.Printf("User '%s' successfully joined room '%s' as %s", peer.username, peer.room, map[bool]string{true: "leader", false: "follower"}[peer.isLeader])
	logStatus()      // Обновляем статус сервера в логах
	sendRoomInfo(peer.room) // Отправляем всем в комнате обновленную информацию

	// 3. Цикл чтения сообщений от клиента
	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			// Ошибка чтения или соединение закрыто клиентом
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure, websocket.CloseNormalClosure) {
				log.Printf("Unexpected WebSocket close error for %s: %v", peer.username, err)
			} else {
				log.Printf("WebSocket connection closed for %s (Reason: %v)", peer.username, err)
			}
			break // Выходим из цикла чтения
		}

		// Парсим полученное сообщение как JSON
		var data map[string]interface{}
		if err := json.Unmarshal(msg, &data); err != nil {
			log.Printf("JSON unmarshal error from %s: %v (Message: %s)", peer.username, err, string(msg))
			continue // Пропускаем некорректное сообщение
		}

		// Логируем базовую информацию о сообщении
		msgType, ok := data["type"].(string)
		if !ok {
			log.Printf("Received message without 'type' field from %s: %v", peer.username, data)
			continue
		}
		// log.Printf("Received '%s' message from %s", msgType, peer.username) // Логируем тип сообщения

		// --- Умная пересылка сообщений (SDP, ICE) ---
		// Блокируем глобальный мьютекс ТОЛЬКО для поиска другого пира
		mu.Lock()
		roomPeers := rooms[peer.room] // Получаем текущих пиров в комнате
		var targetPeer *Peer = nil
		if roomPeers != nil {
			for _, p := range roomPeers {
				if p.username != peer.username { // Ищем ДРУГОГО пира
					targetPeer = p
					break
				}
			}
		}
		mu.Unlock() // Разблокируем как можно скорее

		// Обработка сообщений в зависимости от типа
		switch msgType {
		case "offer":
			// Оффер всегда идет от Лидера к Ведомому
			if peer.isLeader {
				if targetPeer != nil && !targetPeer.isLeader {
					// sdp := data["sdp"] // Удалено: Не используется
					log.Printf(">>> Forwarding OFFER from Leader %s to Follower %s", peer.username, targetPeer.username)
					// Log SDP content for debugging (optional, can be verbose)
					// if sdpMap, ok := data["sdp"].(map[string]interface{}); ok { // Проверяем прямо в data
					// 	if sdpStr, ok := sdpMap["sdp"].(string); ok {
					// 		log.Printf("Offer SDP:\n%s", sdpStr)
					// 	}
					// }

					targetPeer.mu.Lock() // Блокируем мьютекс целевого пира
					if targetPeer.conn != nil {
						if err := targetPeer.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
							log.Printf("!!! Error forwarding OFFER to %s: %v", targetPeer.username, err)
						}
					} else {
						log.Printf("Cannot forward OFFER, target follower %s connection is nil.", targetPeer.username)
					}
					targetPeer.mu.Unlock() // Разблокируем мьютекс целевого пира
				} else {
					log.Printf("WARN: Received 'offer' from leader %s, but no valid follower target found (targetPeer: %v). Ignoring.", peer.username, targetPeer)
				}
			} else {
				log.Printf("WARN: Received 'offer' from non-leader %s. Ignoring.", peer.username)
			}

		case "answer":
			// Ответ всегда идет от Ведомого к Лидеру
			if !peer.isLeader {
				if targetPeer != nil && targetPeer.isLeader {
					// sdp := data["sdp"] // Удалено: Не используется
					log.Printf("<<< Forwarding ANSWER from Follower %s to Leader %s", peer.username, targetPeer.username)
					// Log SDP content for debugging (optional, can be verbose)
					// if sdpMap, ok := data["sdp"].(map[string]interface{}); ok { // Проверяем прямо в data
					//  if sdpStr, ok := sdpMap["sdp"].(string); ok {
					// 	 log.Printf("Answer SDP:\n%s", sdpStr)
					//  }
					// }

					targetPeer.mu.Lock() // Блокируем мьютекс целевого пира
					if targetPeer.conn != nil {
						if err := targetPeer.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
							log.Printf("!!! Error forwarding ANSWER to %s: %v", targetPeer.username, err)
						}
					} else {
						log.Printf("Cannot forward ANSWER, target leader %s connection is nil.", targetPeer.username)
					}
					targetPeer.mu.Unlock() // Разблокируем мьютекс целевого пира
				} else {
					log.Printf("WARN: Received 'answer' from follower %s, but no valid leader target found (targetPeer: %v). Ignoring.", peer.username, targetPeer)
				}
			} else {
				log.Printf("WARN: Received 'answer' from non-follower %s. Ignoring.", peer.username)
			}

		case "ice_candidate":
			// ICE кандидаты пересылаются другому пиру в комнате
			if targetPeer != nil {
				if ice, iceOk := data["ice"].(map[string]interface{}); iceOk { // Проверяем тип перед доступом
					if candidate, candOk := ice["candidate"].(string); candOk {
						candSnippet := candidate
						if len(candSnippet) > 40 { // Обрезаем для лога
							candSnippet = candSnippet[:40]
						}
						log.Printf("... Forwarding ICE candidate from %s to %s (Candidate: %s...)", peer.username, targetPeer.username, candSnippet)
					} else {
						log.Printf("WARN: Received 'ice_candidate' from %s with invalid 'candidate' field.", peer.username)
						break // Не пересылаем некорректный кандидат
					}
				} else {
					log.Printf("WARN: Received 'ice_candidate' from %s with invalid 'ice' field structure.", peer.username)
					break // Не пересылаем некорректный кандидат
				}


				targetPeer.mu.Lock() // Блокируем мьютекс целевого пира
				if targetPeer.conn != nil {
					if err := targetPeer.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
						log.Printf("!!! Error forwarding ICE candidate to %s: %v", targetPeer.username, err)
					}
				} else {
					log.Printf("Cannot forward ICE candidate, target peer %s connection is nil.", targetPeer.username)
				}
				targetPeer.mu.Unlock() // Разблокируем мьютекс целевого пира
			} else {
				log.Printf("WARN: Received 'ice_candidate' from %s, but no target peer found in room %s. Ignoring.", peer.username, peer.room)
			}

		case "switch_camera":
			// Пересылаем сообщение о смене камеры другому участнику (вероятно, от лидера ведомому)
			log.Printf("Forwarding 'switch_camera' message from %s", peer.username)
			if targetPeer != nil {
				targetPeer.mu.Lock()
				if targetPeer.conn != nil {
					if err := targetPeer.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
						log.Printf("Error forwarding switch_camera to %s: %v", targetPeer.username, err)
					}
				}
				targetPeer.mu.Unlock()
			}

		// --- Обработка серверных команд (если потребуются) ---
		// case "resend_offer": // Старая логика, заменена на create_offer_for_new_follower
		// 	log.Printf("WARN: Received deprecated 'resend_offer' from %s. Ignoring.", peer.username)
		// 	// Логика была здесь: сервер сам создавал и отправлял оффер от имени лидера - не очень хорошо.

		case "stop_receiving":
			// Сообщение от клиента, что он прекращает прием медиа. Серверу делать нечего.
			log.Printf("Received 'stop_receiving' from %s. No server action needed.", peer.username)
			continue // Просто продолжаем цикл

		default:
			log.Printf("Received unknown message type '%s' from %s. Ignoring.", msgType, peer.username)
		}
	}

	// 4. Очистка при завершении цикла (разрыв соединения или ошибка)
	log.Printf("Cleaning up resources for user '%s' in room '%s'", peer.username, peer.room)

	// Закрываем WebRTC и WebSocket соединения этого пира
	// Используем горутину, чтобы не блокировать основной поток handleWebSocket, если закрытие займет время
	go closePeerConnection(peer, "WebSocket connection closed")

	// Удаляем пира из комнаты и глобального списка
	mu.Lock()
	var remainingRoom string // Сохраняем имя комнаты для отправки обновления
	if peer != nil { // Добавлена проверка на nil для peer
		remainingRoom = peer.room
		if currentRoomPeers, roomExists := rooms[peer.room]; roomExists {
			delete(currentRoomPeers, peer.username) // Удаляем из комнаты
			log.Printf("Removed %s from room %s map.", peer.username, peer.room)
			// Если комната стала пустой, удаляем саму комнату
			if len(currentRoomPeers) == 0 {
				delete(rooms, peer.room)
				log.Printf("Room %s is now empty and has been deleted.", peer.room)
				remainingRoom = "" // Комнаты больше нет
			}
		}
		delete(peers, remoteAddr) // Удаляем из глобального списка по адресу
		log.Printf("Removed %s (addr: %s) from global peers map.", peer.username, remoteAddr)
	} else {
		log.Printf("WARN: Peer object was nil during cleanup for %s.", remoteAddr)
		delete(peers, remoteAddr) // Все равно удаляем из глобального списка по адресу
	}
	mu.Unlock()

	logStatus() // Логируем статус после очистки

	// Отправляем обновленную информацию оставшимся участникам комнаты (если комната еще существует)
	if remainingRoom != "" {
		sendRoomInfo(remainingRoom) // Используем сохраненное имя
	}
	log.Printf("Cleanup complete for connection %s.", remoteAddr) // Лог по адресу, т.к. peer может быть nil
} // Конец handleWebSocket

Android ведущий

D:\AndroidStudio\MyTest\app\src\main\java\com\example\mytest\MainActivity.kt
D:\AndroidStudio\MyTest\app\src\main\java\com\example\mytest\WebRTCClient.kt
D:\AndroidStudio\MyTest\app\src\main\java\com\example\mytest\WebRTCService.kt
D:\AndroidStudio\MyTest\app\src\main\java\com\example\mytest\WebSocketClient.kt
D:\AndroidStudio\MyTest\app\src\main\java\com\example\mytest\Worker.kt


// file: D:/AndroidStudio/MyTest/app/src/main/java/com/example/mytest/MainActivity.kt
package com.example.mytest

import android.Manifest
import android.annotation.SuppressLint
import android.app.AlertDialog
import android.content.BroadcastReceiver
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.media.projection.MediaProjectionManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import android.text.Editable
import android.text.TextWatcher
import android.util.Log
import android.view.View
import android.view.WindowManager
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.result.registerForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import com.example.mytest.databinding.ActivityMainBinding
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import org.json.JSONArray
import java.util.*
import kotlin.random.Random

class MainActivity : ComponentActivity() {
private lateinit var binding: ActivityMainBinding
private lateinit var sharedPreferences: SharedPreferences
private var currentRoomName: String = ""
private var isServiceRunning: Boolean = false
private val roomList = mutableListOf<String>()
private lateinit var roomListAdapter: ArrayAdapter<String>

    private val requiredPermissions = arrayOf(
        Manifest.permission.CAMERA,
        Manifest.permission.RECORD_AUDIO,
        Manifest.permission.POST_NOTIFICATIONS
    )

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        if (permissions.all { it.value }) {
            if (isCameraPermissionGranted()) {
                val mediaManager = getSystemService(MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
                mediaProjectionLauncher.launch(mediaManager.createScreenCaptureIntent())
                checkBatteryOptimization()
            } else {
                showToast("Camera permission required")
                finish()
            }
        } else {
            showToast("Not all permissions granted")
            finish()
        }
    }

    private val mediaProjectionLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == RESULT_OK && result.data != null) {
            // Сохраняем текущее имя комнаты при успешном запуске сервиса
            saveCurrentRoom()
            startWebRTCService(result.data!!)
        } else {
            showToast("Screen recording access denied")
            finish()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_STATE_HIDDEN)

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        sharedPreferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
        loadRoomList()
        setupUI()
        setupRoomListAdapter()

        // Проверяем состояние сервиса при создании активности
        isServiceRunning = WebRTCService.isRunning
        updateButtonStates()
    }

    private fun loadRoomList() {
        // Загружаем список комнат
        val jsonString = sharedPreferences.getString(ROOM_LIST_KEY, null)
        jsonString?.let {
            val jsonArray = JSONArray(it)
            for (i in 0 until jsonArray.length()) {
                roomList.add(jsonArray.getString(i))
            }
        }

        // Загружаем последнее использованное имя комнаты
        currentRoomName = sharedPreferences.getString(LAST_USED_ROOM_KEY, "") ?: ""

        // Если нет сохраненных комнат или последнее имя пустое, генерируем новое
        if (roomList.isEmpty()) {
            currentRoomName = generateRandomRoomName()
            roomList.add(currentRoomName)
            saveRoomList()
            saveCurrentRoom()
        } else if (currentRoomName.isEmpty()) {
            currentRoomName = roomList.first()
            saveCurrentRoom()
        }

        // Устанавливаем последнее использованное имя в поле ввода
        binding.roomCodeEditText.setText(formatRoomName(currentRoomName))
    }

    private fun saveCurrentRoom() {
        sharedPreferences.edit()
            .putString(LAST_USED_ROOM_KEY, currentRoomName)
            .apply()
    }

    private fun saveRoomList() {
        val jsonArray = JSONArray()
        roomList.forEach { jsonArray.put(it) }
        sharedPreferences.edit()
            .putString(ROOM_LIST_KEY, jsonArray.toString())
            .apply()
    }

    private fun setupRoomListAdapter() {
        roomListAdapter = ArrayAdapter(
            this,
            com.google.android.material.R.layout.support_simple_spinner_dropdown_item,
            roomList
        )
        binding.roomListView.adapter = roomListAdapter
        binding.roomListView.setOnItemClickListener { _, _, position, _ ->
            currentRoomName = roomList[position]
            binding.roomCodeEditText.setText(formatRoomName(currentRoomName))
            updateButtonStates()
        }
    }

    private fun setupUI() {
        binding.roomCodeEditText.addTextChangedListener(object : TextWatcher {
            private var isFormatting = false
            private var deletingHyphen = false
            private var hyphenPositions = listOf(4, 9, 14)

            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {
                if (isFormatting) return

                if (count == 1 && after == 0 && hyphenPositions.contains(start)) {
                    deletingHyphen = true
                } else {
                    deletingHyphen = false
                }
            }

            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}

            override fun afterTextChanged(s: Editable?) {
                if (isFormatting || isServiceRunning) return

                isFormatting = true

                val text = s.toString().replace("-", "")
                if (text.length > 16) {
                    s?.replace(0, s.length, formatRoomName(currentRoomName))
                } else {
                    val formatted = StringBuilder()
                    for (i in text.indices) {
                        if (i > 0 && i % 4 == 0) {
                            formatted.append('-')
                        }
                        formatted.append(text[i])
                    }

                    val cursorPos = binding.roomCodeEditText.selectionStart
                    if (deletingHyphen && cursorPos > 0 && cursorPos < formatted.length &&
                        formatted[cursorPos] == '-') {
                        formatted.deleteCharAt(cursorPos)
                    }

                    s?.replace(0, s.length, formatted.toString())
                }

                isFormatting = false

                val cleanName = binding.roomCodeEditText.text.toString().replace("-", "")
                binding.saveCodeButton.isEnabled = cleanName.length == 16 &&
                        !roomList.contains(cleanName)
            }
        })

        binding.generateCodeButton.setOnClickListener {
            currentRoomName = generateRandomRoomName()
            binding.roomCodeEditText.setText(formatRoomName(currentRoomName))
            showToast("Generated: $currentRoomName")
        }

        binding.deleteRoomButton.setOnClickListener {
            val selectedRoom = binding.roomCodeEditText.text.toString().replace("-", "")
            if (roomList.contains(selectedRoom)) {
                showDeleteConfirmationDialog(selectedRoom)
            } else {
                showToast(getString(R.string.room_not_found))
            }
        }

        binding.saveCodeButton.setOnClickListener {
            val newRoomName = binding.roomCodeEditText.text.toString().replace("-", "")
            if (newRoomName.length == 16) {
                if (!roomList.contains(newRoomName)) {
                    roomList.add(0, newRoomName)
                    currentRoomName = newRoomName
                    saveRoomList()
                    saveCurrentRoom()
                    roomListAdapter.notifyDataSetChanged()
                    showToast("Room saved: ${formatRoomName(newRoomName)}")
                } else {
                    showToast("Room already exists")
                }
            }
        }

        binding.copyCodeButton.setOnClickListener {
            val roomName = binding.roomCodeEditText.text.toString()
            val clipboard = getSystemService(CLIPBOARD_SERVICE) as ClipboardManager
            val clip = ClipData.newPlainText("Room name", roomName)
            clipboard.setPrimaryClip(clip)
            showToast("Copied: $roomName")
        }

        binding.shareCodeButton.setOnClickListener {
            val roomName = binding.roomCodeEditText.text.toString()
            val shareIntent = Intent().apply {
                action = Intent.ACTION_SEND
                putExtra(Intent.EXTRA_TEXT, "Join my room: $roomName")
                type = "text/plain"
            }
            startActivity(Intent.createChooser(shareIntent, "Share Room"))
        }

        binding.startButton.setOnClickListener {
            if (isServiceRunning) {
                showToast("Service already running")
                return@setOnClickListener
            }

            currentRoomName = binding.roomCodeEditText.text.toString().replace("-", "")
            if (currentRoomName.isEmpty()) {
                showToast("Enter room name")
                return@setOnClickListener
            }

            if (checkAllPermissionsGranted() && isCameraPermissionGranted()) {
                val mediaManager = getSystemService(MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
                mediaProjectionLauncher.launch(mediaManager.createScreenCaptureIntent())
                checkBatteryOptimization()
            } else {
                requestPermissionLauncher.launch(requiredPermissions)
            }
        }

        binding.stopButton.setOnClickListener {
            if (!isServiceRunning) {
                showToast("Service not running")
                return@setOnClickListener
            }
            stopWebRTCService()
        }
    }

    private fun formatRoomName(name: String): String {
        if (name.length != 16) return name

        return buildString {
            for (i in 0 until 16) {
                if (i > 0 && i % 4 == 0) append('-')
                append(name[i])
            }
        }
    }

    private fun showDeleteConfirmationDialog(roomName: String) {
        if (roomList.size <= 1) {
            showToast(getString(R.string.cannot_delete_last))
            return
        }

        MaterialAlertDialogBuilder(this)
            .setTitle(getString(R.string.delete_confirm_title))
            .setMessage(getString(R.string.delete_confirm_message, formatRoomName(roomName)))
            .setPositiveButton(getString(R.string.delete_button)) { _, _ ->
                roomList.remove(roomName)
                saveRoomList()
                roomListAdapter.notifyDataSetChanged()

                if (currentRoomName == roomName) {
                    currentRoomName = roomList.first()
                    binding.roomCodeEditText.setText(formatRoomName(currentRoomName))
                    saveCurrentRoom()
                }

                showToast("Room deleted")
                updateButtonStates()
            }
            .setNegativeButton(getString(R.string.cancel_button), null)
            .show()
    }

    private fun generateRandomRoomName(): String {
        val chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        val random = Random.Default
        val code = StringBuilder()

        repeat(16) {
            code.append(chars[random.nextInt(chars.length)])
        }

        return code.toString()
    }

    private fun startWebRTCService(resultData: Intent) {
        try {
            // Сохраняем текущее имя комнаты перед запуском сервиса
            currentRoomName = binding.roomCodeEditText.text.toString().replace("-", "")
            saveCurrentRoom()

            WebRTCService.currentRoomName = currentRoomName
            val serviceIntent = Intent(this, WebRTCService::class.java).apply {
                putExtra("resultCode", RESULT_OK)
                putExtra("resultData", resultData)
                putExtra("roomName", currentRoomName)
            }
            ContextCompat.startForegroundService(this, serviceIntent)
            isServiceRunning = true
            updateButtonStates()
            showToast("Service started: ${formatRoomName(currentRoomName)}")
        } catch (e: Exception) {
            showToast("Start error: ${e.message}")
            Log.e("MainActivity", "Service start error", e)
        }
    }

    private fun stopWebRTCService() {
        try {
            val stopIntent = Intent(this, WebRTCService::class.java).apply {
                action = "STOP"
            }
            startService(stopIntent)
            isServiceRunning = false
            updateButtonStates()
            showToast("Service stopped")
        } catch (e: Exception) {
            showToast("Stop error: ${e.message}")
            Log.e("MainActivity", "Service stop error", e)
        }
    }

    private fun updateButtonStates() {
        binding.apply {
            // START активен только если сервис не работает
            startButton.isEnabled = !isServiceRunning

            // STOP активен только если сервис работает
            stopButton.isEnabled = isServiceRunning

            roomCodeEditText.isEnabled = !isServiceRunning
            saveCodeButton.isEnabled = !isServiceRunning &&
                    binding.roomCodeEditText.text.toString().replace("-", "").length == 16 &&
                    !roomList.contains(binding.roomCodeEditText.text.toString().replace("-", ""))
            generateCodeButton.isEnabled = !isServiceRunning
            deleteRoomButton.isEnabled = !isServiceRunning &&
                    roomList.contains(binding.roomCodeEditText.text.toString().replace("-", "")) &&
                    roomList.size > 1

            startButton.setBackgroundColor(
                ContextCompat.getColor(
                    this@MainActivity,
                    if (isServiceRunning) android.R.color.darker_gray else R.color.green
                )
            )
            stopButton.setBackgroundColor(
                ContextCompat.getColor(
                    this@MainActivity,
                    if (isServiceRunning) R.color.red else android.R.color.darker_gray
                )
            )
        }
    }

    private val serviceStateReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            if (intent.action == WebRTCService.ACTION_SERVICE_STATE) {
                isServiceRunning = intent.getBooleanExtra(WebRTCService.EXTRA_IS_RUNNING, false)
                updateButtonStates()
            }
        }
    }

    private fun checkAllPermissionsGranted() = requiredPermissions.all {
        ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED
    }

    private fun isCameraPermissionGranted(): Boolean {
        return ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.CAMERA
        ) == PackageManager.PERMISSION_GRANTED
    }

    private fun checkBatteryOptimization() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val powerManager = getSystemService(PowerManager::class.java)
            if (!powerManager.isIgnoringBatteryOptimizations(packageName)) {
                val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                    data = Uri.parse("package:$packageName")
                }
                startActivity(intent)
            }
        }
    }

    private fun showToast(text: String) {
        Toast.makeText(this, text, Toast.LENGTH_LONG).show()
    }

    @SuppressLint("UnspecifiedRegisterReceiverFlag")
    override fun onResume() {
        super.onResume()
        registerReceiver(serviceStateReceiver, IntentFilter(WebRTCService.ACTION_SERVICE_STATE))
        // Обновляем состояние при возвращении в активность
        isServiceRunning = WebRTCService.isRunning
        updateButtonStates()
    }

    override fun onPause() {
        super.onPause()
        unregisterReceiver(serviceStateReceiver)
    }

    companion object {
        private const val PREFS_NAME = "WebRTCPrefs"
        private const val ROOM_LIST_KEY = "room_list"
        private const val LAST_USED_ROOM_KEY = "last_used_room"
    }
}

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
var peerConnection: PeerConnection
private var localVideoTrack: VideoTrack? = null
private var localAudioTrack: AudioTrack? = null
internal var videoCapturer: VideoCapturer? = null
private var surfaceTextureHelper: SurfaceTextureHelper? = null

    init {
        initializePeerConnectionFactory()
        peerConnection = createPeerConnection()
        createLocalTracks()
    }

    private fun initializePeerConnectionFactory() {
        val initializationOptions = PeerConnectionFactory.InitializationOptions.builder(context)
            .setEnableInternalTracer(true)
            .setFieldTrials("WebRTC-VP8-Forced-Fallback-Encoder/Enabled/")
            .createInitializationOptions()
        PeerConnectionFactory.initialize(initializationOptions)

        val videoEncoderFactory = DefaultVideoEncoderFactory(
            eglBase.eglBaseContext,
            true,
            true
        )

        val videoDecoderFactory = DefaultVideoDecoderFactory(eglBase.eglBaseContext)

        peerConnectionFactory = PeerConnectionFactory.builder()
            .setVideoEncoderFactory(videoEncoderFactory)
            .setVideoDecoderFactory(videoDecoderFactory)
            .setOptions(PeerConnectionFactory.Options().apply {
                disableEncryption = false
                disableNetworkMonitor = false
            })
            .createPeerConnectionFactory()
    }

    private fun createPeerConnection(): PeerConnection {
        val rtcConfig = PeerConnection.RTCConfiguration(listOf(

            PeerConnection.IceServer.builder("turn:ardua.site:3478")
                .setUsername("user1")
                .setPassword("pass1")
                .createIceServer(),

            PeerConnection.IceServer.builder("stun:ardua.site:3478").createIceServer(),

//            PeerConnection.IceServer.builder("turns:ardua.site:5349")
//                .setUsername("user1")
//                .setPassword("pass1")
//                .createIceServer(),

//            PeerConnection.IceServer.builder("stun:stun.l.google.com:19301").createIceServer(),
//            PeerConnection.IceServer.builder("stun:stun.l.google.com:19302").createIceServer(),
//            PeerConnection.IceServer.builder("stun:stun.l.google.com:19303").createIceServer(),
//            PeerConnection.IceServer.builder("stun:stun.l.google.com:19304").createIceServer(),
//            PeerConnection.IceServer.builder("stun:stun.l.google.com:19305").createIceServer(),
//            PeerConnection.IceServer.builder("stun:stun1.l.google.com:19301").createIceServer(),
//            PeerConnection.IceServer.builder("stun:stun1.l.google.com:19302").createIceServer(),
//            PeerConnection.IceServer.builder("stun:stun1.l.google.com:19303").createIceServer(),
//            PeerConnection.IceServer.builder("stun:stun1.l.google.com:19304").createIceServer(),
//            PeerConnection.IceServer.builder("stun:stun1.l.google.com:19305").createIceServer()
)).apply {
sdpSemantics = PeerConnection.SdpSemantics.UNIFIED_PLAN
continualGatheringPolicy = PeerConnection.ContinualGatheringPolicy.GATHER_CONTINUALLY
iceTransportsType = PeerConnection.IceTransportsType.ALL
bundlePolicy = PeerConnection.BundlePolicy.MAXBUNDLE
rtcpMuxPolicy = PeerConnection.RtcpMuxPolicy.REQUIRE
tcpCandidatePolicy = PeerConnection.TcpCandidatePolicy.ENABLED
candidateNetworkPolicy = PeerConnection.CandidateNetworkPolicy.ALL
keyType = PeerConnection.KeyType.ECDSA

            // Оптимизация для мобильных
            if (Build.MODEL.contains("iPhone")) {
                audioJitterBufferMaxPackets = 50
                audioJitterBufferFastAccelerate = true
            } else {
                // Настройки для Android
                audioJitterBufferMaxPackets = 200
                iceConnectionReceivingTimeout = 5000
            }
        }

        return peerConnectionFactory.createPeerConnection(rtcConfig, observer)!!
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
            peerConnection.addTrack(it, listOf(streamId))
        }

        localVideoTrack?.let {
            stream.addTrack(it)
            peerConnection.addTrack(it, listOf(streamId))
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
                capturer.startCapture(640, 480, 30)

                localVideoTrack = peerConnectionFactory.createVideoTrack("ARDAMSv0", videoSource).apply {
                    addSink(localView)
                }
            } ?: run {
                Log.e("WebRTCClient", "Failed to create video capturer")
            }
        } catch (e: Exception) {
            Log.e("WebRTCClient", "Error creating video track", e)
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
            videoCapturer?.let {
                it.stopCapture()
                it.dispose()
            }
            localVideoTrack?.let {
                it.removeSink(localView)
                it.dispose()
            }
            localAudioTrack?.dispose()
            surfaceTextureHelper?.dispose()
            peerConnection.close()
            peerConnection.dispose()
        } catch (e: Exception) {
            Log.e("WebRTCClient", "Error closing resources", e)
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
    private val webSocketUrl = "wss://ardua.site/ws"

    private val notificationId = 1
    private val channelId = "webrtc_service_channel"
    private val handler = Handler(Looper.getMainLooper())

    private var isStateReceiverRegistered = false
    private var isConnectivityReceiverRegistered = false

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
        Log.d("WebRTCService", "Initializing WebRTC for room: $roomName")
        cleanupWebRTCResources()

        eglBase = EglBase.create()
        val localView = SurfaceViewRenderer(this).apply {
            init(eglBase.eglBaseContext, null)
            setMirror(true)
            setEnableHardwareScaler(true)
        }

        remoteView = SurfaceViewRenderer(this).apply {
            init(eglBase.eglBaseContext, null)
            setEnableHardwareScaler(true)
        }

        webRTCClient = WebRTCClient(
            context = this,
            eglBase = eglBase,
            localView = localView,
            remoteView = remoteView,
            observer = createPeerConnectionObserver()
        )
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
            }
            if (::eglBase.isInitialized) {
                eglBase.release()
            }
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
            when (message.optString("type")) {
                "bandwidth_estimation" -> {
                    val estimation = message.optLong("estimation", 1000000)
                    handleBandwidthEstimation(estimation)
                }
                "offer" -> handleOffer(message)
                "answer" -> handleAnswer(message)
                "ice_candidate" -> handleIceCandidate(message)
                "room_info" -> {}
                "switch_camera" -> {
                    // Обрабатываем команду переключения камеры
                    val useBackCamera = message.optBoolean("useBackCamera", false)
                    Log.d("WebRTCService", "Received switch camera command: useBackCamera=$useBackCamera")
                    handler.post {
                        webRTCClient.switchCamera(useBackCamera)
                        // Отправляем подтверждение
                        sendCameraSwitchAck(useBackCamera)
                    }
                }
                else -> Log.w("WebRTCService", "Unknown message type")
            }
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error handling message", e)
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

            webRTCClient.peerConnection.setRemoteDescription(object : SdpObserver {
                override fun onSetSuccess() {
                    val constraints = MediaConstraints().apply {
                        mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveAudio", "true"))
                        mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveVideo", "true"))
                    }
                    createAnswer(constraints)
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

    private fun createAnswer(constraints: MediaConstraints) {
        try {
            webRTCClient.peerConnection.createAnswer(object : SdpObserver {
                override fun onCreateSuccess(desc: SessionDescription) {
                    Log.d("WebRTCService", "Created answer: ${desc.description}")
                    webRTCClient.peerConnection.setLocalDescription(object : SdpObserver {
                        override fun onSetSuccess() {
                            sendSessionDescription(desc)
                        }
                        override fun onSetFailure(error: String) {
                            Log.e("WebRTCService", "Error setting local description: $error")
                        }
                        override fun onCreateSuccess(p0: SessionDescription?) {}
                        override fun onCreateFailure(error: String) {}
                    }, desc)
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

            webRTCClient.peerConnection.setRemoteDescription(object : SdpObserver {
                override fun onSetSuccess() {
                    Log.d("WebRTCService", "Answer accepted")
                }
                override fun onSetFailure(error: String) {
                    Log.e("WebRTCService", "Error setting answer: $error")
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
            webRTCClient.peerConnection.addIceCandidate(iceCandidate)
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

// file: D:/AndroidStudio/MyTest/app/src/main/java/com/example/mytest/Worker.kt
package com.example.mytest

import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.Worker
import androidx.work.WorkerParameters
import java.util.concurrent.TimeUnit

class WebRTCWorker(context: Context, params: WorkerParameters) : Worker(context, params) {
override fun doWork(): Result {
val intent = Intent(applicationContext, WebRTCService::class.java)
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
applicationContext.startForegroundService(intent)
} else {
applicationContext.startService(intent)
}
return Result.success()
}
}

Проблема. Клиент-ведомый-браузер соединяется с ервером получает от ведущего оффер - видео работает идеально, этот же клиент отсоединяется-присоединяется
видео очень сильно тормозит-идет с задержками. Перезагружаю сервер - клиент присоединяется - получает оффер - видео идет идеально.
помоги разобраться в чем дело. Может что то не полностью чистится.






Реализовано:
1. В комнате должны быть только два участника ведущий и ведомый
2. только ведущий создает комнату, готовит и отправляет оффер
3. замена ведомого на ведомого если второй ведомый хочет попасть в комнату

Нужно чтобы работало: Когда Ведомый подключается к комнате, сервер сигнализации сообщает Ведущему, что нужно создать и отправить оффер Ведомому (через сервер). Ведомый ждет этот оффер, принимает его, создает answer (ответ) и отправляет обратно Ведущему (через сервер).
Плюсы:
✅ Стандартный и Рекомендуемый Подход: Это классическая модель WebRTC, где инициатор звонка (или потока, в вашем случае - Ведущий) отправляет предложение (offer), а принимающая сторона (Ведомый) отвечает (answer).
✅ Логично: Ведущий "предлагает" свой видеопоток, Ведомый "соглашается" его принять.
✅ Простота для Ведомого: Логика ведомого клиента очень проста – ждать оффер и отправлять ответ.
✅ Меньше путаницы: Четкое разделение ролей снижает вероятность ошибок и состояний гонки (race conditions) на сервере и клиентах.
✅ Совместимость: Большинство библиотек и примеров WebRTC построены на этой модели.
✅ Ваша текущая реализация: Мы как раз исправили код клиента и сервера для работы по этой схеме (сервер просит лидера -> лидер шлет оффер -> ведомый шлет ответ).
Минусы:
Требуется явный сигнал от сервера к Ведущему для инициации оффера (что у вас уже сделано через сообщение create_offer_for_new_follower).
Только Ведомый (Браузер) отправляет Оффер:

###
Android код (WebRTCService.kt) он всегда действовал как Ведущий (Leader) и только отправлял Офферы, но никогда их не получал и не создавал ответы (Answers). Он будет только получать и обрабатывать ответы от Ведомого (браузера).
Это соответствует модели, которую мы реализовали на сервере и в веб-клиенте: сервер при подключении ведомого отправляет лидеру (Android) команду create_offer_for_new_follower, и Android должен на это среагировать, создав и отправив оффер.
###
Ведущий создает оффер только по запросу сервера
Ведомый всегда ожидает оффер и отвечает на него

Доработай и справь код Ведущего и ведомого, сервер Go желательно не изменяй.
Андройд работает на библиотеках
// WebRTC
implementation("io.github.webrtc-sdk:android:125.6422.07")
// WebSocket
implementation("com.squareup.okhttp3:okhttp:4.11.0")
из менять не нужно



Сделай эту логику чтобы Ведущий и ведомый всегда обменивались видео, сделай изменения без лишних улучшений - чтобы не ухудшить остальную логику.
1. Кода давай целыми функциями.
2. Комментарии на русском.

на мобильных устройствах при длительной работе происходит задержка видео, на дестктопных компьютерах все работает хорошо.