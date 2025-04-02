\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-webrtc-js\app\webrtc
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-webrtc-js\app\webrtc\components
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-webrtc-js\app\webrtc\components\DeviceSelector.tsx
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-webrtc-js\app\webrtc\components\VideoPlayer.tsx
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-webrtc-js\app\webrtc\hooks
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-webrtc-js\app\webrtc\hooks\useWebRTC.ts
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-webrtc-js\app\webrtc\lib
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-webrtc-js\app\webrtc\lib\signaling.ts
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-webrtc-js\app\webrtc\lib\webrtc.ts
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-webrtc-js\app\webrtc\page.tsx
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-webrtc-js\app\webrtc\styles.module.css
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-webrtc-js\app\webrtc\types.ts
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-webrtc-js\app\webrtc\VideoCallApp.tsx
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-webrtc-js\next.config.js


// file: docker-webrtc-js/app/webrtc/lib/webrtc.ts
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







// file: docker-webrtc-js/app/webrtc/lib/signaling.ts
// app/webrtc/lib/signaling.ts
import {
RoomCreatedData,
WebRTCOffer,
WebRTCAnswer,
WebRTCCandidate,
SignalingClientOptions
} from '../types';

export class SignalingClient {
private ws: WebSocket | null = null;
private messageQueue: Array<{event: string, data: any}> = [];
private reconnectAttempts = 0;
private connectionTimeout: NodeJS.Timeout | null = null;
private pingInterval: NodeJS.Timeout | null = null;
private connectionPromise: Promise<void> | null = null;
private resolveConnection: (() => void) | null = null;
private lastJoinedUser: string | null = null;

    public onRoomCreated: (data: RoomCreatedData) => void = () => {};
    public onOffer: (data: WebRTCOffer) => void = () => {};
    public onAnswer: (data: WebRTCAnswer) => void = () => {};
    public onCandidate: (data: WebRTCCandidate) => void = () => {};
    public onUserJoined: (username: string) => void = () => {};
    public onUserLeft: (username: string) => void = () => {};
    public onError: (error: string) => void = () => {};

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
        this.connect();
    }

    public get isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    private connect(): void {
        this.ws = new WebSocket(this.url);
        this.setupEventListeners();

        this.connectionTimeout = setTimeout(() => {
            if (!this.isConnected) {
                this.handleError('Connection timeout');
                this.ws?.close();
            }
        }, this.options.connectionTimeout);
    }

    private setupEventListeners(): void {
        if (!this.ws) return;

        this.ws.onopen = () => {
            this.clearTimeout(this.connectionTimeout);
            this.reconnectAttempts = 0;
            console.log('Signaling connection established');

            if (this.resolveConnection) {
                this.resolveConnection();
                this.resolveConnection = null;
                this.connectionPromise = null;
            }

            this.pingInterval = setInterval(() => this.sendPing(), 30000);
            this.flushMessageQueue();
        };

        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                console.debug('Received message:', message.event);

                if (message.event === 'user_joined' && this.lastJoinedUser === message.data.username) {
                    return;
                }

                switch (message.event) {
                    case 'joined':
                        this.onRoomCreated(message.data);
                        break;
                    case 'offer':
                        this.onOffer(message.data);
                        break;
                    case 'answer':
                        this.onAnswer(message.data);
                        break;
                    case 'candidate':
                        this.onCandidate(message.data);
                        break;
                    case 'user_joined':
                        this.lastJoinedUser = message.data.username;
                        this.onUserJoined(message.data.username);
                        break;
                    case 'user_left':
                        this.onUserLeft(message.data.username);
                        this.lastJoinedUser = null;
                        break;
                    case 'error':
                        this.onError(message.data);
                        break;
                    case 'ping':
                        this.sendPong();
                        break;
                    case 'pong':
                        break;
                    default:
                        console.warn('Unknown message type:', message.event);
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

    private async flushMessageQueue(): Promise<void> {
        while (this.messageQueue.length > 0 && this.isConnected) {
            const message = this.messageQueue.shift();
            if (message) await this.sendMessageInternal(message);
        }
    }

    private async sendMessageInternal(message: { event: string; data: any }): Promise<void> {
        if (!this.isConnected) {
            throw new Error('WebSocket not connected');
        }

        try {
            this.ws?.send(JSON.stringify(message));
        } catch (error) {
            console.error('Send failed, requeuing message:', message.event);
            this.messageQueue.unshift(message);
            throw error;
        }
    }

    public async sendMessage(message: { event: string; data: any }): Promise<void> {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            if (!this.connectionPromise) {
                this.connectionPromise = new Promise((resolve, reject) => {
                    this.resolveConnection = resolve;
                    setTimeout(() => {
                        reject(new Error('Connection timeout'));
                        this.cleanup();
                    }, this.options.connectionTimeout || 5000);
                });
            }
            this.messageQueue.push(message);
            await this.connectionPromise;
            return this.sendMessage(message);
        }

        try {
            this.ws.send(JSON.stringify(message));
        } catch (error) {
            console.error('Send error:', error);
            throw error;
        }
    }

    private attemptReconnect(): void {
        if (this.reconnectAttempts >= (this.options.maxReconnectAttempts || 5)) {
            return this.handleError('Max reconnection attempts reached');
        }

        this.reconnectAttempts++;
        console.log(`Reconnecting (attempt ${this.reconnectAttempts})`);

        setTimeout(() => this.connect(), this.options.reconnectDelay);
    }

    private handleError(error: string): void {
        console.error('Signaling error:', error);
        this.onError(error);
        this.cleanup();
    }

    private cleanup(): void {
        this.clearTimeout(this.connectionTimeout);
        this.clearInterval(this.pingInterval);
        this.lastJoinedUser = null;
    }

    private clearTimeout(timer: NodeJS.Timeout | null): void {
        if (timer) clearTimeout(timer);
    }

    private clearInterval(timer: NodeJS.Timeout | null): void {
        if (timer) clearInterval(timer);
    }

    private sendPing(): void {
        this.sendMessage({ event: 'ping', data: null }).catch(() => {});
    }

    private sendPong(): void {
        this.sendMessage({ event: 'pong', data: null }).catch(() => {});
    }

    public close(): void {
        this.cleanup();
        this.ws?.close();
        this.messageQueue = [];
    }

    public createRoom(username: string): Promise<void> {
        return this.sendMessage({
            event: 'join',
            data: { roomId: '', username }
        });
    }

    public joinRoom(roomId: string, username: string): Promise<void> {
        return this.sendMessage({
            event: 'join',
            data: { roomId, username }
        });
    }

    public sendOffer(data: { offer: RTCSessionDescriptionInit; to: string }): Promise<void> {
        return this.sendMessage({
            event: 'offer',
            data: { offer: data.offer, to: data.to }
        });
    }

    public sendAnswer(data: { answer: RTCSessionDescriptionInit; to: string }): Promise<void> {
        return this.sendMessage({
            event: 'answer',
            data: { answer: data.answer, to: data.to }
        });
    }

    public sendCandidate(data: { candidate: RTCIceCandidateInit; to: string }): Promise<void> {
        return this.sendMessage({
            event: 'candidate',
            data: { candidate: data.candidate, to: data.to }
        });
    }
}

// file: docker-webrtc-js/app/webrtc/hooks/useWebRTC.ts
// app/webrtc/hooks/useWebRTC.ts
import { useEffect, useRef, useState } from 'react';
import { SignalingClient } from '../lib/signaling';
import { User, RoomCreatedData, WebRTCOffer, WebRTCAnswer, WebRTCCandidate } from '../types';

export const useWebRTC = (deviceIds: { video: string; audio: string }, username: string) => {
const [localStream, setLocalStream] = useState<MediaStream | null>(null);
const [remoteUsers, setRemoteUsers] = useState<User[]>([]);
const [roomId, setRoomId] = useState<string | null>(null);
const [isCaller, setIsCaller] = useState(false);
const [connectionStatus, setConnectionStatus] = useState('disconnected');
const [error, setError] = useState<string | null>(null);

    const signalingClient = useRef<SignalingClient | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
    const processedUsers = useRef<Set<string>>(new Set());

// app/webrtc/hooks/useWebRTC.ts
const initPeerConnection = (userId: string): RTCPeerConnection => {
const pc = new RTCPeerConnection({
iceServers: [
{ urls: 'stun:stun.l.google.com:19302' },
{ urls: 'stun:stun1.l.google.com:19302' },
{ urls: 'stun:stun2.l.google.com:19302' }
],
iceTransportPolicy: 'all' // Добавляем для лучшей совместимости
});

        pc.onicecandidate = (event) => {
            if (event.candidate && signalingClient.current?.isConnected) {
                signalingClient.current.sendCandidate({
                    candidate: event.candidate,
                    to: userId
                }).catch(e => console.error('Failed to send ICE candidate:', e));
            }
        };

        pc.ontrack = (event) => {
            if (!event.streams || event.streams.length === 0) return;

            setRemoteUsers(prev => {
                const existingUser = prev.find(u => u.username === userId);
                const newStream = new MediaStream();
                event.streams[0].getTracks().forEach(track => {
                    if (!newStream.getTracks().some(t => t.id === track.id)) {
                        newStream.addTrack(track);
                    }
                });

                if (existingUser) {
                    return prev.map(u =>
                        u.username === userId
                            ? { ...u, stream: newStream }
                            : u
                    );
                }
                return [...prev, { username: userId, stream: newStream, peerConnection: pc }];
            });
        };

        // Добавляем обработчики для отладки
        pc.oniceconnectionstatechange = () => {
            console.log(`ICE state for ${userId}:`, pc.iceConnectionState);
            if (pc.iceConnectionState === 'connected') {
                setConnectionStatus('connected');
            }
        };

        pc.onnegotiationneeded = async () => {
            console.log('Negotiation needed for:', userId);
        };

        return pc;
    };

    const createOffer = async (toUsername: string) => {
        if (peerConnections.current[toUsername]) {
            console.log('Connection already exists for user:', toUsername);
            return;
        }

        const pc = initPeerConnection(toUsername);
        if (!localStreamRef.current) {
            console.error('Local stream not available');
            return;
        }

        try {
            // Добавляем треки локального потока
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current!);
            });

            // Создаем offer с явным указанием типов
            const offer = await pc.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });

            // Явно указываем тип для localDescription
            await pc.setLocalDescription(new RTCSessionDescription(offer));

            if (!signalingClient.current) {
                throw new Error('Signaling client not available');
            }

            // Отправляем offer через signaling
            await signalingClient.current.sendOffer({
                offer: pc.localDescription!,
                to: toUsername
            });

            // Обновляем состояние пользователей
            setRemoteUsers(prev => {
                const existingUser = prev.find(u => u.username === toUsername);
                if (existingUser) {
                    return prev.map(u =>
                        u.username === toUsername ? { ...u, peerConnection: pc } : u
                    );
                }
                return [...prev, { username: toUsername, peerConnection: pc }];
            });

        } catch (err) {
            console.error('Error in createOffer:', err);
            setError(`Failed to create offer: ${err instanceof Error ? err.message : String(err)}`);

            // Закрываем соединение в случае ошибки
            pc.close();
            delete peerConnections.current[toUsername];
        }
    };

    const startCall = async (isInitiator: boolean, existingRoomId?: string) => {
        try {
            processedUsers.current = new Set();
            setIsCaller(isInitiator);
            await getLocalMedia();

            signalingClient.current = new SignalingClient('wss://anybet.site/ws');

            signalingClient.current.onRoomCreated = (data: RoomCreatedData) => {
                setRoomId(data.roomId);
                setConnectionStatus('connecting');

                if (isInitiator) {
                    data.clients.forEach((clientUsername: string) => {
                        if (clientUsername !== username && !processedUsers.current.has(clientUsername)) {
                            processedUsers.current.add(clientUsername);
                            createOffer(clientUsername);
                        }
                    });
                }
            };

            signalingClient.current.onUserJoined = (joinedUsername: string) => {
                if (joinedUsername === username || processedUsers.current.has(joinedUsername)) return;

                processedUsers.current.add(joinedUsername);
                setConnectionStatus('connecting');

                if (isCaller) {
                    createOffer(joinedUsername);
                }

                setRemoteUsers(prev => {
                    const existingUser = prev.find(u => u.username === joinedUsername);
                    return existingUser ? prev : [...prev, { username: joinedUsername }];
                });
            };

            signalingClient.current.onUserLeft = (leftUsername: string) => {
                setRemoteUsers(prev => {
                    const user = prev.find(u => u.username === leftUsername);
                    if (user?.peerConnection) {
                        user.peerConnection.close();
                        delete peerConnections.current[leftUsername];
                    }
                    processedUsers.current.delete(leftUsername);
                    return prev.filter(u => u.username !== leftUsername);
                });
            };

            signalingClient.current.onOffer = async ({ offer, from }: WebRTCOffer) => {
                if (processedUsers.current.has(from)) return;
                processedUsers.current.add(from);

                const pc = initPeerConnection(from);
                await pc.setRemoteDescription(new RTCSessionDescription(offer));

                if (localStreamRef.current) {
                    localStreamRef.current.getTracks().forEach(track => {
                        pc.addTrack(track, localStreamRef.current!);
                    });
                }

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                signalingClient.current?.sendAnswer({
                    answer,
                    to: from
                });

                setRemoteUsers(prev => {
                    const existingUser = prev.find(u => u.username === from);
                    if (existingUser) {
                        return prev.map(u =>
                            u.username === from ? { ...u, peerConnection: pc } : u
                        );
                    }
                    return [...prev, { username: from, peerConnection: pc }];
                });
            };

            signalingClient.current.onAnswer = async ({ answer, from }: WebRTCAnswer) => {
                const pc = peerConnections.current[from];
                if (pc) {
                    await pc.setRemoteDescription(new RTCSessionDescription(answer));
                }
            };

            signalingClient.current.onCandidate = async ({ candidate, from }: WebRTCCandidate) => {
                const pc = peerConnections.current[from];
                if (pc && candidate) {
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    } catch (err) {
                        console.error('Error adding ICE candidate:', err);
                    }
                }
            };

            signalingClient.current.onError = (error: string) => {
                setError(error);
                setConnectionStatus('failed');
            };

            if (existingRoomId) {
                await signalingClient.current.joinRoom(existingRoomId, username);
            } else {
                await signalingClient.current.createRoom(username);
            }

        } catch (error) {
            console.error('Error starting call:', error);
            setError(`Failed to start call: ${error instanceof Error ? error.message : String(error)}`);
            setConnectionStatus('failed');
            cleanup();
        }
    };

    const getLocalMedia = async () => {
        try {
            const constraints = {
                video: deviceIds.video ? { deviceId: { exact: deviceIds.video } } : true,
                audio: deviceIds.audio ? { deviceId: { exact: deviceIds.audio } } : true
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            localStreamRef.current = stream;
            setLocalStream(new MediaStream(stream.getTracks()));
            return stream;
        } catch (err) {
            console.error('Error getting media devices:', err);
            setError('Could not access camera/microphone');
            throw err;
        }
    };

    const joinRoom = (roomId: string) => {
        startCall(false, roomId);
    };

    const stopCall = () => {
        cleanup();
        setRoomId(null);
        setConnectionStatus('disconnected');
    };

    const cleanup = () => {
        Object.values(peerConnections.current).forEach(pc => pc.close());
        peerConnections.current = {};
        processedUsers.current.clear();

        if (signalingClient.current) {
            signalingClient.current.close();
            signalingClient.current = null;
        }

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
            setLocalStream(null);
        }

        setRemoteUsers([]);
    };

    useEffect(() => {
        return () => {
            cleanup();
        };
    }, []);

    return {
        localStream,
        remoteUsers,
        roomId,
        connectionStatus,
        error,
        isConnected: connectionStatus === 'connected',
        startCall,
        joinRoom,
        stopCall,
        signalingClient
    };
};

// file: docker-webrtc-js/app/webrtc/page.tsx
//app\webrtc\page.tsx
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
            <div className={styles.errorContainer}>
                <h1>WebRTC is not supported in your browser</h1>
                <p>Please use a modern browser like Chrome, Firefox or Edge.</p>
            </div>
        );
    }

    return (
        <main className={styles.container}>
            {isSupported === null ? (
                <div>Loading...</div>
            ) : (
                <VideoCallApp />
            )}
        </main>
    );
}

// file: docker-webrtc-js/app/webrtc/types.ts
// app/webrtc/types.ts
export interface RoomCreatedData {
roomId: string;
clients: string[];
}

export interface WebRTCOffer {
offer: RTCSessionDescriptionInit;
from: string;
}

export interface WebRTCAnswer {
answer: RTCSessionDescriptionInit;
from: string;
}

export interface WebRTCCandidate {
candidate: RTCIceCandidateInit;
from: string;
}

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

// file: docker-webrtc-js/app/webrtc/components/VideoPlayer.tsx
// app/webrtc/components/VideoPlayer.tsx
import { useEffect, useRef } from 'react';

interface VideoPlayerProps {
stream: MediaStream | null;
muted?: boolean;
className?: string;
}

export const VideoPlayer = ({ stream, muted = false, className }: VideoPlayerProps) => {
const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleCanPlay = () => {
            video.play().catch(e => {
                console.error('Playback failed:', e);
                // Пытаемся воспроизвести снова с muted
                video.muted = true;
                video.play().catch(e => console.error('Muted playback also failed:', e));
            });
        };

        video.addEventListener('canplay', handleCanPlay);

        if (stream) {
            video.srcObject = stream;
        } else {
            video.srcObject = null;
        }

        return () => {
            video.removeEventListener('canplay', handleCanPlay);
            video.srcObject = null;
        };
    }, [stream]);

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={muted}
            className={className}
        />
    );
};

// file: docker-webrtc-js/app/webrtc/components/DeviceSelector.tsx
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
        <div className={styles.deviceSelector}>
            <div className={styles.deviceGroup}>
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

            <div className={styles.deviceGroup}>
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
                className={styles.refreshButton}
                disabled={isRefreshing}
            >
                {isRefreshing ? 'Обновление...' : 'Обновить устройства'}
            </button>
        </div>
    );
};

// file: docker-webrtc-js/app/webrtc/VideoCallApp.tsx
// app/webrtc/VideoCallApp.tsx
import { useWebRTC } from './hooks/useWebRTC';
import styles from './styles.module.css';
import { VideoPlayer } from './components/VideoPlayer';
import { DeviceSelector } from './components/DeviceSelector';
import { useEffect, useState } from 'react';

export const VideoCallApp = () => {
const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
const [selectedDevices, setSelectedDevices] = useState({
video: '',
audio: ''
});
const [roomIdInput, setRoomIdInput] = useState('');
const [username, setUsername] = useState(`User${Math.floor(Math.random() * 1000)}`);
const [hasPermission, setHasPermission] = useState(false);

    const {
        localStream,
        remoteUsers,
        roomId,
        startCall,
        joinRoom,
        stopCall,
        isConnected,
        connectionStatus,
        error
    } = useWebRTC(selectedDevices, username);

    const loadDevices = async () => {
        try {
            // Сначала запрашиваем разрешения
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            // Останавливаем треки сразу после получения разрешений
            stream.getTracks().forEach(track => track.stop());

            // Теперь получаем список устройств
            const devices = await navigator.mediaDevices.enumerateDevices();
            setDevices(devices);
            setHasPermission(true);

            // Автоматически выбираем устройства если они есть
            const videoDevice = devices.find(d => d.kind === 'videoinput');
            const audioDevice = devices.find(d => d.kind === 'audioinput');

            setSelectedDevices({
                video: videoDevice?.deviceId || '',
                audio: audioDevice?.deviceId || ''
            });

        } catch (error) {
            console.error('Device access error:', error);
            setHasPermission(false);
        }
    };

    useEffect(() => {
        loadDevices();
    }, []);

    const handleStartCall = () => {
        if (roomIdInput.trim()) {
            joinRoom(roomIdInput.trim());
        } else {
            startCall(true);
        }
    };

    const handleRefreshDevices = async () => {
        await loadDevices();
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>WebRTC Video Call</h1>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.controls}>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ваше имя"
                    className={styles.input}
                />
                <input
                    type="text"
                    value={roomIdInput}
                    onChange={(e) => setRoomIdInput(e.target.value)}
                    placeholder="ID комнаты (оставьте пустым для создания новой)"
                    className={styles.input}
                />
                <button
                    onClick={handleStartCall}
                    className={styles.button}
                    disabled={isConnected}
                >
                    {isConnected ? 'Подключено' : 'Подключиться'}
                </button>
                {isConnected && (
                    <button onClick={stopCall} className={styles.stopButton}>
                        Завершить
                    </button>
                )}
            </div>

            {roomId && (
                <div className={styles.roomInfo}>
                    <p>ID комнаты: <strong>{roomId}</strong></p>
                </div>
            )}

            <div className={styles.connectionStatus}>
                <span>Статус: </span>
                <div className={`${styles.connectionDot} ${
                    isConnected ? styles.connected : styles.disconnected
                }`} />
                <span>{connectionStatus}</span>
            </div>

            <div className={styles.videoContainer}>
                {/* Локальное видео */}
                {localStream && (
                    <div className={styles.videoWrapper}>
                        <VideoPlayer
                            stream={localStream}
                            muted
                            className={styles.video}
                        />
                        <div className={styles.videoLabel}>Вы: {username}</div>
                    </div>
                )}

                {/* Удаленные видео */}
                {remoteUsers.map((user) => (
                    <div key={user.username} className={styles.videoWrapper}>
                        {user.stream ? (
                            <>
                                <VideoPlayer
                                    stream={user.stream}
                                    className={styles.video}
                                />
                                <div className={styles.videoLabel}>{user.username}</div>
                            </>
                        ) : (
                            <div className={styles.videoPlaceholder}>
                                <div className={styles.userAvatar}>
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                                <div>{user.username}</div>
                                <div>Подключается...</div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {!isConnected && (
                <div className={styles.deviceSelection}>
                    <h3>Выберите устройства:</h3>
                    {!hasPermission ? (
                        <button
                            onClick={loadDevices}
                            className={styles.refreshButton}
                        >
                            Запросить доступ к камере и микрофону
                        </button>
                    ) : (
                        <DeviceSelector
                            devices={devices}
                            selectedDevices={selectedDevices}
                            onChange={(type, deviceId) =>
                                setSelectedDevices(prev => ({...prev, [type]: deviceId}))
                            }
                            onRefresh={handleRefreshDevices}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

// file: docker-webrtc-js/app/webrtc/styles.module.css
/*app\webrtc\styles.module.css*/
.container {
max-width: 1200px;
margin: 0 auto;
padding: 20px;
font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
color: #333;
background-color: #f5f7fa;
min-height: 100vh;
}

.title {
text-align: center;
color: #2c3e50;
margin-bottom: 30px;
font-size: 2rem;
font-weight: 600;
}

.error {
color: #e74c3c;
background-color: #fadbd8;
padding: 12px 16px;
border-radius: 6px;
margin-bottom: 20px;
border-left: 4px solid #e74c3c;
display: flex;
align-items: center;
gap: 8px;
}

.errorContainer {
display: flex;
flex-direction: column;
align-items: center;
justify-content: center;
height: 100vh;
text-align: center;
padding: 20px;
background-color: #f8f9fa;
}

.setupPanel {
background-color: #ffffff;
border-radius: 12px;
padding: 30px;
box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
margin-bottom: 30px;
}

.deviceSelection {
margin-bottom: 25px;
background-color: #f8f9fa;
padding: 20px;
border-radius: 8px;
}

.sectionTitle {
color: #3498db;
margin-top: 0;
margin-bottom: 20px;
font-size: 1.3rem;
font-weight: 600;
}

.connectionOptions {
display: flex;
flex-direction: column;
gap: 20px;
background-color: #f8f9fa;
padding: 20px;
border-radius: 8px;
}

.primaryButton, .secondaryButton, .stopButton {
padding: 14px 24px;
border: none;
border-radius: 8px;
cursor: pointer;
font-size: 16px;
font-weight: 500;
transition: all 0.25s ease;
display: inline-flex;
align-items: center;
justify-content: center;
gap: 8px;
}

.primaryButton {
background: linear-gradient(135deg, #3498db, #2980b9);
color: white;
box-shadow: 0 2px 10px rgba(52, 152, 219, 0.3);
}

.primaryButton:hover {
background: linear-gradient(135deg, #2980b9, #3498db);
transform: translateY(-2px);
box-shadow: 0 4px 15px rgba(52, 152, 219, 0.4);
}

.stopButton {
background: linear-gradient(135deg, #e74c3c, #c0392b);
color: white;
box-shadow: 0 2px 10px rgba(231, 76, 60, 0.3);
}

.stopButton:hover {
background: linear-gradient(135deg, #c0392b, #e74c3c);
transform: translateY(-2px);
box-shadow: 0 4px 15px rgba(231, 76, 60, 0.4);
}

.joinContainer {
display: flex;
gap: 12px;
align-items: center;
flex-wrap: wrap;
}

.roomInput {
flex: 1;
min-width: 250px;
padding: 14px;
border: 1px solid #e0e0e0;
border-radius: 8px;
font-size: 16px;
transition: all 0.25s ease;
background-color: #ffffff;
}

.roomInput:focus {
outline: none;
border-color: #3498db;
box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
}

.callPanel {
background-color: #ffffff;
border-radius: 12px;
padding: 30px;
box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
margin-bottom: 30px;
}

.roomInfo {
display: flex;
align-items: center;
margin-bottom: 25px;
padding-bottom: 20px;
border-bottom: 1px solid #eee;
flex-wrap: wrap;
gap: 15px;
}

.roomInfo p {
margin: 0;
color: #7f8c8d;
font-size: 15px;
}

.roomInfo strong {
color: #2c3e50;
font-weight: 600;
}

.statusBadge {
padding: 6px 12px;
border-radius: 20px;
font-size: 14px;
font-weight: 500;
}

.connected {
background-color: #e8f5e9;
color: #2ecc71;
}

.disconnected {
background-color: #ffebee;
color: #e74c3c;
}

.videoContainer {
display: grid;
grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
gap: 25px;
margin-top: 20px;
}

.videoWrapper {
position: relative;
background: #000;
border-radius: 12px;
overflow: hidden;
aspect-ratio: 16/9;
box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
transition: all 0.3s ease;
}

.videoWrapper:hover {
transform: translateY(-5px);
box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.video {
width: 100%;
height: 100%;
object-fit: cover;
background-color: #000;
}

.videoLabel {
position: absolute;
bottom: 12px;
left: 12px;
background: rgba(0, 0, 0, 0.7);
color: white;
padding: 6px 12px;
border-radius: 20px;
font-size: 14px;
font-weight: 500;
backdrop-filter: blur(4px);
}

.deviceSelector {
background: #ffffff;
padding: 25px;
border-radius: 12px;
box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
margin-bottom: 25px;
}

.deviceGroup {
margin-bottom: 20px;
}

.deviceGroup label {
display: block;
margin-bottom: 10px;
font-weight: 500;
color: #34495e;
font-size: 15px;
}

.deviceGroup select {
width: 100%;
padding: 12px;
border: 1px solid #e0e0e0;
border-radius: 8px;
background: #ffffff;
font-size: 15px;
transition: all 0.25s ease;
appearance: none;
background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
background-repeat: no-repeat;
background-position: right 12px center;
background-size: 16px;
}

.deviceGroup select:focus {
outline: none;
border-color: #3498db;
box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
}

.refreshButton {
background-color: #3498db;
color: white;
border: none;
padding: 12px 18px;
border-radius: 8px;
cursor: pointer;
font-size: 15px;
margin-top: 10px;
display: inline-flex;
align-items: center;
gap: 8px;
transition: all 0.25s ease;
}

.refreshButton:hover {
background-color: #2980b9;
transform: translateY(-2px);
}

.refreshButton:disabled {
background-color: #bdc3c7;
cursor: not-allowed;
transform: none;
}

.formGroup {
margin-bottom: 20px;
}

.formGroup label {
display: block;
margin-bottom: 8px;
font-weight: 500;
color: #34495e;
font-size: 15px;
}

.formGroup input {
width: 100%;
padding: 12px;
border: 1px solid #e0e0e0;
border-radius: 8px;
font-size: 15px;
transition: all 0.25s ease;
}

.formGroup input:focus {
outline: none;
border-color: #3498db;
box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
}

.videoPlaceholder {
display: flex;
flex-direction: column;
align-items: center;
justify-content: center;
height: 100%;
background: linear-gradient(135deg, #f5f7fa, #e4e8eb);
color: #7f8c8d;
font-size: 16px;
gap: 10px;
}

.videoPlaceholder svg {
width: 60px;
height: 60px;
opacity: 0.6;
}

.userAvatar {
width: 80px;
height: 80px;
border-radius: 50%;
background-color: #3498db;
display: flex;
align-items: center;
justify-content: center;
color: white;
font-size: 32px;
font-weight: bold;
margin-bottom: 10px;
}

@media (max-width: 768px) {
.container {
padding: 15px;
}

    .title {
        font-size: 1.8rem;
        margin-bottom: 20px;
    }

    .videoContainer {
        grid-template-columns: 1fr;
        gap: 15px;
    }

    .roomInfo {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
        padding-bottom: 15px;
    }

    .joinContainer {
        flex-direction: column;
        gap: 12px;
    }

    .roomInput, .formGroup input, .deviceGroup select {
        width: 100%;
    }

    .setupPanel, .callPanel, .deviceSelector {
        padding: 20px;
    }
}

/* Анимации */
@keyframes fadeIn {
from { opacity: 0; transform: translateY(10px); }
to { opacity: 1; transform: translateY(0); }
}

.videoWrapper {
animation: fadeIn 0.4s ease-out forwards;
}

/* Индикатор подключения */
.connectionStatus {
display: flex;
align-items: center;
gap: 6px;
font-size: 14px;
}

.connectionDot {
width: 10px;
height: 10px;
border-radius: 50%;
}

.connectionDot.connected {
background-color: #2ecc71;
box-shadow: 0 0 0 2px rgba(46, 204, 113, 0.3);
}

.connectionDot.disconnected {
background-color: #e74c3c;
box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.3);
}

.roomInfo {
background-color: #f8f9fa;
padding: 12px 16px;
border-radius: 8px;
margin: 15px 0;
display: inline-block;
}

.roomInfo p {
margin: 0;
color: #6c757d;
}

.roomInfo strong {
color: #343a40;
font-weight: 600;
}

.connectionStatus {
display: flex;
align-items: center;
gap: 8px;
margin-bottom: 15px;
font-size: 14px;
color: #495057;
}

.connectionDot {
width: 10px;
height: 10px;
border-radius: 50%;
}

.connectionDot.connected {
background-color: #28a745;
}

.connectionDot.disconnected {
background-color: #dc3545;
}

.input {
width: 100%;
padding: 12px;
border: 1px solid #e0e0e0;
border-radius: 8px;
font-size: 15px;
transition: all 0.25s ease;
}

.input:focus {
outline: none;
border-color: #3498db;
box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
}

.button {
background-color: #3498db;
color: white;
border: none;
padding: 12px 18px;
border-radius: 8px;
cursor: pointer;
font-size: 15px;
transition: all 0.25s ease;
}

.button:hover {
background-color: #2980b9;
transform: translateY(-2px);
}
.controls {
display: flex;
gap: 10px;
margin-bottom: 20px;
flex-wrap: wrap;
align-items: center;
}

.connectionStatus {
padding: 8px;
background: #f5f5f5;
border-radius: 4px;
margin: 10px 0;
}

.connectionDetails {
margin-top: 5px;
padding: 5px;
background: #eee;
border-radius: 3px;
font-size: 0.9em;
}


// file: docker-webrtc-js/next.config.js
// file: docker-webrtc-js/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
reactStrictMode: true,
images: {
domains: ['anybet.site'],
},
async headers() {
return [
{
source: '/_next/:path*',
headers: [
{
key: 'Access-Control-Allow-Origin',
value: 'https://anybet.site',
},
{
key: 'Access-Control-Allow-Methods',
value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
},
{
key: 'Access-Control-Allow-Headers',
value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
},
],
},
{
source: '/api/:path*',
headers: [
{
key: 'Access-Control-Allow-Origin',
value: 'https://anybet.site',
},
],
},
]
},
allowedDevOrigins: [
'anybet.site',
'localhost',
],
}

module.exports = nextConfig

