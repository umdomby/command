
// file: client/app/webrtc/lib/webrtc.ts
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







// file: client/app/webrtc/lib/signaling.ts
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

// file: client/app/webrtc/hooks/useWebRTC.ts
// file: client/app/webrtc/hooks/useWebRTC.ts
import { useEffect, useRef, useState } from 'react';

interface WebSocketMessage {
type: string;
data?: any;
sdp?: RTCSessionDescriptionInit;
ice?: RTCIceCandidateInit;
room?: string;
username?: string;
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
const [isCallInitiator, setIsCallInitiator] = useState(false);
const [error, setError] = useState<string | null>(null);

    const ws = useRef<WebSocket | null>(null);
    const pc = useRef<RTCPeerConnection | null>(null);
    const pendingIceCandidates = useRef<RTCIceCandidate[]>([]);

    const cleanup = () => {
        if (pc.current) {
            pc.current.onicecandidate = null;
            pc.current.ontrack = null;
            pc.current.onnegotiationneeded = null;
            pc.current.oniceconnectionstatechange = null;
            pc.current.close();
            pc.current = null;
        }

        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }

        if (remoteStream) {
            remoteStream.getTracks().forEach(track => track.stop());
            setRemoteStream(null);
        }

        setIsCallActive(false);
        setIsCallInitiator(false);
        pendingIceCandidates.current = [];
    };

    const leaveRoom = () => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
                type: 'leave',
                room: roomId,
                username
            }));
        }
        cleanup();
        setUsers([]);
        setIsInRoom(false);
        ws.current?.close();
        ws.current = null;
    };

    const connectWebSocket = () => {
        try {
            ws.current = new WebSocket('wss://anybet.site/ws');

            ws.current.onopen = () => {
                setIsConnected(true);
                setError(null);
                console.log('WebSocket connected');
            };

            ws.current.onerror = (event) => {
                console.error('WebSocket error:', event);
                setError('Connection error');
                setIsConnected(false);
            };

            ws.current.onclose = (event) => {
                console.log('WebSocket disconnected, code:', event.code, 'reason:', event.reason);
                setIsConnected(false);
                setIsInRoom(false);
            };

            ws.current.onmessage = async (event) => {
                try {
                    const data: WebSocketMessage = JSON.parse(event.data);
                    console.log('Received message:', data);

                    if (data.type === 'room_info') {
                        setUsers(data.data.users || []);
                    }
                    else if (data.type === 'error') {
                        setError(data.data);
                    }
                    else if (data.type === 'start_call') {
                        if (!isCallActive && pc.current && ws.current?.readyState === WebSocket.OPEN) {
                            const offer = await pc.current.createOffer({
                                offerToReceiveAudio: true,
                                offerToReceiveVideo: true
                            });
                            await pc.current.setLocalDescription(offer);
                            ws.current.send(JSON.stringify({
                                type: 'offer',
                                sdp: offer,
                                room: roomId,
                                username
                            }));
                            setIsCallActive(true);
                            setIsCallInitiator(true);
                        }
                    }
                    else if (data.type === 'offer') {
                        if (pc.current && ws.current?.readyState === WebSocket.OPEN && data.sdp) {
                            await pc.current.setRemoteDescription(new RTCSessionDescription(data.sdp));

                            const answer = await pc.current.createAnswer({
                                offerToReceiveAudio: true,
                                offerToReceiveVideo: true
                            });
                            await pc.current.setLocalDescription(answer);

                            ws.current.send(JSON.stringify({
                                type: 'answer',
                                sdp: answer,
                                room: roomId,
                                username
                            }));

                            setIsCallActive(true);
                        }
                    }
                    else if (data.type === 'answer') {
                        if (pc.current && pc.current.signalingState !== 'stable' && data.sdp) {
                            await pc.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
                            setIsCallActive(true);

                            pendingIceCandidates.current.forEach(candidate => {
                                pc.current?.addIceCandidate(new RTCIceCandidate(candidate));
                            });
                            pendingIceCandidates.current = [];
                        }
                    }
                    else if (data.type === 'ice_candidate') {
                        if (data.ice) {
                            const candidate = new RTCIceCandidate(data.ice);

                            if (pc.current && pc.current.remoteDescription) {
                                await pc.current.addIceCandidate(candidate);
                            } else {
                                pendingIceCandidates.current.push(candidate);
                            }
                        }
                    }
                } catch (err) {
                    console.error('Error processing message:', err);
                    setError('Error processing server message');
                }
            };

            return true;
        } catch (err) {
            console.error('WebSocket connection error:', err);
            setError('Failed to connect to server');
            return false;
        }
    };

    const initializeWebRTC = async () => {
        try {
            cleanup();

            const config = {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' }
                ],
                sdpSemantics: 'unified-plan' as const,
                bundlePolicy: 'max-bundle' as const,
                rtcpMuxPolicy: 'require' as const,
                iceTransportPolicy: 'all' as const
            };

            pc.current = new RTCPeerConnection(config);

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

            pc.current.onicecandidate = (event) => {
                if (event.candidate && ws.current?.readyState === WebSocket.OPEN) {
                    ws.current.send(JSON.stringify({
                        type: 'ice_candidate',
                        ice: event.candidate,
                        room: roomId,
                        username
                    }));
                }
            };

            pc.current.ontrack = (event) => {
                if (event.streams && event.streams[0]) {
                    setRemoteStream(event.streams[0]);
                }
            };

            pc.current.oniceconnectionstatechange = () => {
                if (pc.current?.iceConnectionState === 'disconnected' ||
                    pc.current?.iceConnectionState === 'failed') {
                    console.log('ICE connection failed, attempting to restart...');
                    reconnect();
                }
            };

            return true;
        } catch (err) {
            console.error('WebRTC initialization error:', err);
            setError('Failed to initialize WebRTC');
            cleanup();
            return false;
        }
    };

    const startCall = async () => {
        if (!pc.current || !ws.current || ws.current.readyState !== WebSocket.OPEN) {
            setError('Not connected to server');
            return;
        }

        try {
            ws.current.send(JSON.stringify({
                type: "start_call",
                room: roomId,
                username
            }));

            const offer = await pc.current.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });
            await pc.current.setLocalDescription(offer);

            ws.current.send(JSON.stringify({
                type: "offer",
                sdp: offer,
                room: roomId,
                username
            }));

            setIsCallActive(true);
            setIsCallInitiator(true);
            setError(null);
        } catch (err) {
            console.error('Error starting call:', err);
            setError('Failed to start call');
        }
    };

    const endCall = () => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
                type: "end_call",
                room: roomId,
                username
            }));
        }
        cleanup();
    };

    const reconnect = async () => {
        cleanup();

        if (ws.current) {
            ws.current.close();
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        if (isInRoom) {
            await joinRoom(username);
        }
    };

    const joinRoom = async (uniqueUsername: string) => {
        setError(null);

        if (!connectWebSocket()) {
            return;
        }

        if (!(await initializeWebRTC())) {
            return;
        }

        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
                action: "join",
                room: roomId,
                username: uniqueUsername
            }));
            setIsInRoom(true);
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
        startCall,
        endCall,
        joinRoom,
        leaveRoom,
        isCallActive,
        isConnected,
        isInRoom,
        isCallInitiator,
        error
    };
};

// file: client/app/webrtc/page.tsx
// file: client/app/webrtc/page.tsx
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

// file: client/app/webrtc/types.ts
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

// file: client/app/webrtc/components/VideoPlayer.tsx
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

// file: client/app/webrtc/components/DeviceSelector.tsx
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

// file: client/app/webrtc/VideoCallApp.tsx
// file: client/app/webrtc/VideoCallApp.tsx
'use client'

import { useWebRTC } from './hooks/useWebRTC';
import styles from './styles.module.css';
import { VideoPlayer } from './components/VideoPlayer';
import { DeviceSelector } from './components/DeviceSelector';
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const VideoCallApp = () => {
const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
const [selectedDevices, setSelectedDevices] = useState({
video: '',
audio: ''
});
const [roomId, setRoomId] = useState('room1');
const [username, setUsername] = useState(`User${Math.floor(Math.random() * 1000)}`);
const [originalUsername, setOriginalUsername] = useState('');
const [hasPermission, setHasPermission] = useState(false);
const [devicesLoaded, setDevicesLoaded] = useState(false);
const [isJoining, setIsJoining] = useState(false);

    const {
        localStream,
        remoteStream,
        users,
        startCall,
        endCall,
        joinRoom,
        leaveRoom,
        isCallActive,
        isConnected,
        isInRoom,
        error,
        isCallInitiator
    } = useWebRTC(selectedDevices, username, roomId);

    const generateUniqueUsername = (base: string) => {
        return `${base}_${Math.floor(Math.random() * 1000)}`;
    };

    const loadDevices = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            stream.getTracks().forEach(track => track.stop());

            const devices = await navigator.mediaDevices.enumerateDevices();
            setDevices(devices);
            setHasPermission(true);
            setDevicesLoaded(true);

            const videoDevice = devices.find(d => d.kind === 'videoinput');
            const audioDevice = devices.find(d => d.kind === 'audioinput');

            setSelectedDevices({
                video: videoDevice?.deviceId || '',
                audio: audioDevice?.deviceId || ''
            });
        } catch (error) {
            console.error('Device access error:', error);
            setHasPermission(false);
            setDevicesLoaded(true);
        }
    };

    const handleDeviceChange = (type: 'video' | 'audio', deviceId: string) => {
        setSelectedDevices(prev => ({
            ...prev,
            [type]: deviceId
        }));
    };

    const handleJoinRoom = async () => {
        setIsJoining(true);
        try {
            if (!originalUsername) {
                setOriginalUsername(username);
            }
            const uniqueUsername = generateUniqueUsername(originalUsername || username);
            setUsername(uniqueUsername);
            await joinRoom(uniqueUsername);
        } catch (error) {
            console.error('Error joining room:', error);
        } finally {
            setIsJoining(false);
        }
    };

    useEffect(() => {
        loadDevices();
    }, []);

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>WebRTC Video Call</h1>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.controls}>
                <div className={styles.connectionStatus}>
                    Status: {isConnected ? (isInRoom ? `In room ${roomId}` : 'Connected') : 'Disconnected'}
                    {isCallActive && ' (Call active)'}
                    {isCallInitiator && ' (Initiator)'}
                </div>

                <div className={styles.inputGroup}>
                    <Label htmlFor="room">Room:</Label>
                    <Input
                        id="room"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        disabled={isInRoom}
                    />
                </div>

                <div className={styles.inputGroup}>
                    <Label htmlFor="username">Username:</Label>
                    <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={isInRoom}
                    />
                </div>

                {!isInRoom ? (
                    <Button
                        onClick={handleJoinRoom}
                        disabled={!hasPermission || isJoining}
                        className={styles.button}
                    >
                        {isJoining ? 'Joining...' : 'Join Room'}
                    </Button>
                ) : (
                    <Button
                        onClick={leaveRoom}
                        className={styles.button}
                    >
                        Leave Room
                    </Button>
                )}

                <div className={styles.userList}>
                    <h3>Users in room ({users.length}):</h3>
                    <ul>
                        {users.map((user, index) => (
                            <li key={index}>{user}</li>
                        ))}
                    </ul>
                </div>

                <div>
                    {!isCallActive ? (
                        <Button
                            onClick={startCall}
                            disabled={!isInRoom || users.length < 2}
                            className={styles.button}
                        >
                            Start Call
                        </Button>
                    ) : (
                        <Button
                            onClick={endCall}
                            className={styles.button}
                            variant="destructive"
                        >
                            End Call
                        </Button>
                    )}
                </div>
            </div>

            <div className={styles.videoContainer}>
                <div className={styles.videoWrapper}>
                    <VideoPlayer
                        stream={localStream}
                        muted
                        className={styles.localVideo}
                    />
                    <div className={styles.videoLabel}>You ({username})</div>
                </div>

                <div className={styles.videoWrapper}>
                    <VideoPlayer
                        stream={remoteStream}
                        className={styles.remoteVideo}
                    />
                    <div className={styles.videoLabel}>Remote</div>
                </div>
            </div>

            <div className={styles.deviceSelection}>
                <h3>Select devices:</h3>
                {devicesLoaded ? (
                    <DeviceSelector
                        devices={devices}
                        selectedDevices={selectedDevices}
                        onChange={handleDeviceChange}
                        onRefresh={loadDevices}
                    />
                ) : (
                    <div>Loading devices...</div>
                )}
            </div>
        </div>
    );
};

// file: client/app/webrtc/styles.module.css
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

/* file: client/app/webrtc/styles.module.css */
.inputGroup {
margin-bottom: 1rem;
display: flex;
flex-direction: column;
gap: 0.5rem;
}

.inputGroup label {
font-size: 0.875rem;
font-weight: 500;
color: hsl(var(--foreground));
}

.inputGroup input {
width: 100%;
padding: 0.5rem 0.75rem;
border: 1px solid hsl(var(--border));
border-radius: calc(var(--radius) - 2px);
background-color: hsl(var(--background));
color: hsl(var(--foreground));
font-size: 0.875rem;
transition: border-color 0.2s;
}

.inputGroup input:focus {
outline: none;
border-color: hsl(var(--primary));
box-shadow: 0 0 0 2px hsla(var(--primary), 0.2);
}

/* Для темной темы */
@media (prefers-color-scheme: dark) {
.inputGroup input {
background-color: hsl(var(--card));
}
}

.localVideo {
position: relative;
width: 100%;
/*max-width: 300px;*/
height: auto;
border-radius: var(--radius);
overflow: hidden;
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
background-color: hsl(var(--muted));
transform: scaleX(-1); /* Зеркальное отображение для естественного вида */
object-fit: cover;
aspect-ratio: 16/9;
}

/* Стили для контейнера видео */
.videoWrapper {
position: relative;
margin-bottom: 1rem;
}

/* Метка под видео */
.videoLabel {
position: absolute;
bottom: 8px;
left: 8px;
background-color: hsla(var(--background)/0.8);
color: hsl(var(--foreground));
padding: 4px 8px;
border-radius: calc(var(--radius) - 2px);
font-size: 0.75rem;
font-weight: 500;
}

/* Для темной темы */
@media (prefers-color-scheme: dark) {
.localVideo {
border: 1px solid hsl(var(--border));
}
}

/* Стили для списка пользователей */
.userList {
background-color: hsl(var(--card));
border: 1px solid hsl(var(--border));
border-radius: var(--radius);
padding: 1rem;
margin-bottom: 1.5rem;
max-height: 200px;
overflow-y: auto;
}

.userList h3 {
font-size: 1rem;
font-weight: 600;
margin-bottom: 0.75rem;
color: hsl(var(--foreground));
}

.userList ul {
list-style: none;
padding: 0;
margin: 0;
display: flex;
flex-direction: column;
gap: 0.5rem;
}

.userList li {
font-size: 0.875rem;
padding: 0.5rem;
border-radius: calc(var(--radius) - 4px);
background-color: hsl(var(--muted)/0.5);
color: hsl(var(--foreground));
}

/* Стили для удаленного видео */
.remoteVideo {
width: 100%;
height: auto;
border-radius: var(--radius);
background-color: hsl(var(--muted));
object-fit: cover;
aspect-ratio: 16/9;
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Контейнер для удаленного видео */
.remoteVideoContainer {
position: relative;
margin-top: 1rem;
}

/* Адаптация для темной темы */
@media (prefers-color-scheme: dark) {
.userList {
background-color: hsl(var(--card));
border-color: hsl(var(--border));
}

    .remoteVideo {
        border: 1px solid hsl(var(--border)/0.3);
    }
}

// file: client/app/page.tsx
import Image from "next/image";
import Link from "next/link";

export default function Home() {
return (
<div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
<Link href="/webrtc">webrtc</Link>
</div>
);
}


// file: client/app/layout.tsx
'use server'
import { Nunito } from 'next/font/google';
import './globals.css';
import {Providers} from "@/components/providers";


const nunito = Nunito({
subsets: ['cyrillic'],
variable: '--font-nunito',
weight: ['400', '500', '600', '700', '800', '900'],
});

export default async function RootLayout({
children,
}: Readonly<{
children: React.ReactNode;
}>) {

    return (
        <html lang="en">
        <head>
            {/*<link data-rh="true" rel="icon" href="/logo.webp" />*/}
        </head>
        <body className={nunito.className} suppressHydrationWarning={true}>
        <Providers>
            <main>{children}</main>
        </Providers>
        </body>
        </html>
    );
}

// file: client/app/globals.css
@import "tailwindcss";

:root {
--background: #ffffff;
--foreground: #171717;
}

@theme inline {
--color-background: var(--background);
--color-foreground: var(--foreground);
--font-sans: var(--font-geist-sans);
--font-mono: var(--font-geist-mono);
}

@media (prefers-color-scheme: dark) {
:root {
--background: #0a0a0a;
--foreground: #ededed;
}
}

body {
background: var(--background);
color: var(--foreground);
font-family: Arial, Helvetica, sans-serif;
}

при нажатии End Call чтобы выходило так же и из комнаты.