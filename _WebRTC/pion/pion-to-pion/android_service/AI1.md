это код react - работающее приложение
import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
const [username, setUsername] = useState(`User${Math.floor(Math.random() * 1000)}`);
const [originalUsername, setOriginalUsername] = useState('');
const [room, setRoom] = useState('room1');
const [users, setUsers] = useState([]);
const [isCallActive, setIsCallActive] = useState(false);
const [error, setError] = useState('');
const [isConnected, setIsConnected] = useState(false);
const [isInRoom, setIsInRoom] = useState(false);
const [isCallInitiator, setIsCallInitiator] = useState(false);
const [iceCandidates, setIceCandidates] = useState([]);

const localVideoRef = useRef(null);
const remoteVideoRef = useRef(null);
const ws = useRef(null);
const pc = useRef(null);
const pendingIceCandidates = useRef([]);

// Генерация уникального имени пользователя
const generateUniqueUsername = (base) => {
return `${base}_${Math.floor(Math.random() * 1000)}`;
};

// Очистка ресурсов
const cleanup = () => {
console.log('Cleaning up resources...');

    if (pc.current) {
      console.log('Closing peer connection...');
      pc.current.onicecandidate = null;
      pc.current.ontrack = null;
      pc.current.onnegotiationneeded = null;
      pc.current.oniceconnectionstatechange = null;
      pc.current.close();
      pc.current = null;
    }

    if (localVideoRef.current?.srcObject) {
      console.log('Stopping local media tracks...');
      localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current?.srcObject) {
      console.log('Stopping remote media tracks...');
      remoteVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      remoteVideoRef.current.srcObject = null;
    }

    setIsCallActive(false);
    setIsCallInitiator(false);
    pendingIceCandidates.current = [];
};

// Подключение к WebSocket
const connectWebSocket = () => {
console.log('Connecting to WebSocket...');
try {
ws.current = new WebSocket('wss://anybet.site/ws');

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError('');
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error');
        setIsConnected(false);
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setTimeout(() => {
          if (!isConnected) {
            console.log('Attempting to reconnect...');
            connectWebSocket();
          }
        }, 3000);
      };

      ws.current.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received message:', data);

          if (data.type === 'room_info') {
            setUsers(data.data.users || []);
          }
          else if (data.type === 'error') {
            setError(data.data);
          }
          else if (data.type === 'start_call') {
            if (!isCallActive && pc.current) {
              console.log('Creating offer...');
              const offer = await pc.current.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true,
                voiceActivityDetection: false
              });
              await pc.current.setLocalDescription(offer);
              ws.current.send(JSON.stringify({
                type: 'offer',
                sdp: offer,
                room,
                username
              }));
              setIsCallActive(true);
              setIsCallInitiator(true);
            }
          }
          else if (data.type === 'offer') {
            console.log('Received offer:', data.sdp);
            if (pc.current) {
              await pc.current.setRemoteDescription(new RTCSessionDescription(data.sdp));

              const answer = await pc.current.createAnswer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
              });
              await pc.current.setLocalDescription(answer);

              ws.current.send(JSON.stringify({
                type: 'answer',
                sdp: answer,
                room,
                username
              }));

              setIsCallActive(true);
            }
          }
          else if (data.type === 'answer') {
            console.log('Received answer:', data.sdp);
            if (pc.current && pc.current.signalingState !== 'stable') {
              await pc.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
              setIsCallActive(true);

              // Добавляем ожидающие ICE кандидаты
              pendingIceCandidates.current.forEach(candidate => {
                pc.current.addIceCandidate(new RTCIceCandidate(candidate));
              });
              pendingIceCandidates.current = [];
            }
          }
          else if (data.type === 'ice_candidate') {
            console.log('Received ICE candidate:', data.ice);
            const candidate = new RTCIceCandidate(data.ice);

            if (pc.current && pc.current.remoteDescription) {
              await pc.current.addIceCandidate(candidate);
            } else {
              console.log('Adding ICE candidate to pending list');
              pendingIceCandidates.current.push(candidate);
            }
          }
        } catch (err) {
          console.error('Error processing message:', err);
          setError('Error processing server message');
        }
      };

      return true;
    } catch (err) {
      console.error('WebSocket connection failed:', err);
      setError('Failed to connect to server');
      return false;
    }
};

// Инициализация WebRTC
const initializeWebRTC = async () => {
console.log('Initializing WebRTC...');
try {
cleanup();

      const config = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          // Добавьте TURN серверы при необходимости
          // { urls: 'turn:your-turn-server.com', username: 'user', credential: 'pass' }
        ],
        sdpSemantics: 'unified-plan',
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
        iceTransportPolicy: 'all'
      };

      pc.current = new RTCPeerConnection(config);

      // Получение медиапотока
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 }
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Добавление треков в соединение
        stream.getTracks().forEach(track => {
          pc.current.addTrack(track, stream);
        });
      } catch (err) {
        console.error('Error accessing media devices:', err);
        setError('Could not access camera/microphone');
        return false;
      }

      // Обработка ICE кандидатов
      pc.current.onicecandidate = (event) => {
        if (event.candidate && ws.current?.readyState === WebSocket.OPEN) {
          console.log('Sending ICE candidate:', event.candidate);
          ws.current.send(JSON.stringify({
            type: 'ice_candidate',
            ice: event.candidate,
            room,
            username
          }));
        }
      };

      // Обработка входящих треков
      pc.current.ontrack = (event) => {
        console.log('Received track:', event.track.kind);
        if (event.streams && event.streams[0]) {
          if (remoteVideoRef.current.srcObject !== event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        }
      };

      // Обработка изменений состояния ICE
      pc.current.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', pc.current.iceConnectionState);
        if (pc.current.iceConnectionState === 'disconnected' ||
            pc.current.iceConnectionState === 'failed') {
          console.log('ICE connection failed, attempting to restart...');
          reconnect();
        }
      };

      return true;
    } catch (err) {
      console.error('WebRTC initialization failed:', err);
      setError('Failed to initialize WebRTC');
      cleanup();
      return false;
    }
};

// Начало звонка
const startCall = async () => {
console.log('Starting call...');
if (!pc.current || !ws.current || ws.current.readyState !== WebSocket.OPEN) {
setError('Not connected to server');
return;
}

    try {
      ws.current.send(JSON.stringify({
        type: "start_call",
        room,
        username
      }));

      const offer = await pc.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
        voiceActivityDetection: false
      });
      await pc.current.setLocalDescription(offer);

      ws.current.send(JSON.stringify({
        type: "offer",
        sdp: offer,
        room,
        username
      }));

      setIsCallActive(true);
      setIsCallInitiator(true);
      setError('');
    } catch (err) {
      console.error('Error starting call:', err);
      setError('Failed to start call');
    }
};

// Завершение звонка
const endCall = () => {
console.log('Ending call...');
if (ws.current?.readyState === WebSocket.OPEN) {
ws.current.send(JSON.stringify({
type: "end_call",
room,
username
}));
}
cleanup();
setIsInRoom(false);
setUsers([]);
};

// Переподключение
const reconnect = async () => {
console.log('Attempting to reconnect...');
cleanup();

    if (ws.current) {
      ws.current.close();
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    if (isInRoom) {
      await joinRoom();
    } else {
      connectWebSocket();
    }
};

// Вход в комнату
const joinRoom = async () => {
console.log('Joining room...');
setError('');

    if (!isConnected) {
      if (!connectWebSocket()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Сохраняем оригинальное имя пользователя
    if (!originalUsername) {
      setOriginalUsername(username);
    }

    // Генерируем уникальное имя пользователя для повторного входа
    const uniqueUsername = generateUniqueUsername(originalUsername || username);
    setUsername(uniqueUsername);

    if (!(await initializeWebRTC())) {
      return;
    }

    ws.current.send(JSON.stringify({
      action: "join",
      room,
      username: uniqueUsername
    }));

    setIsInRoom(true);
};

// Выход из комнаты
const leaveRoom = () => {
console.log('Leaving room...');
if (ws.current?.readyState === WebSocket.OPEN) {
ws.current.send(JSON.stringify({
type: "leave",
room,
username
}));
}
setIsInRoom(false);
cleanup();
setUsers([]);
};

// Эффект при монтировании
useEffect(() => {
connectWebSocket();

    return () => {
      console.log('Component unmounting, cleaning up...');
      if (ws.current) {
        ws.current.close();
      }
      cleanup();
    };
}, []);

return (
<div className="app-container">
<div className="control-panel">
<div className="connection-status">
Status: {isConnected ? (isInRoom ? `In room ${room}` : 'Connected') : 'Disconnected'}
{isCallActive && ' (Call active)'}
</div>

          <div className="input-group">
            <label>Room:</label>
            <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                disabled={isInRoom}
            />
          </div>

          <div className="input-group">
            <label>Username:</label>
            <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isInRoom}
            />
          </div>

          {!isInRoom ? (
              <button onClick={joinRoom} disabled={!isConnected}>
                Join Room
              </button>
          ) : (
              <button onClick={leaveRoom}>Leave Room</button>
          )}

          <div className="user-list">
            <h3>Users in room ({users.length}):</h3>
            <ul>
              {users.map((user, index) => (
                  <li key={index}>{user}</li>
              ))}
            </ul>
          </div>

          <div className="call-controls">
            {!isCallActive ? (
                <button
                    onClick={startCall}
                    disabled={!isInRoom || users.length < 2}
                >
                  Start Call
                </button>
            ) : (
                <button onClick={endCall}>End Call</button>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}
        </div>

        <div className="video-container">
          <div className="video-wrapper">
            <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="local-video"
            />
            <div className="video-label">You ({username})</div>
          </div>

          <div className="video-wrapper">
            <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="remote-video"
            />
            <div className="video-label">Remote</div>
          </div>
        </div>
      </div>
);
}

export default App;


Это код Next

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
const [hasPermission, setHasPermission] = useState(false);

    const {
        localStream,
        remoteUsers,
        startCall,
        endCall,
        joinRoom,
        leaveRoom,
        isCallActive,
        isConnected,
        error
    } = useWebRTC(selectedDevices, username, roomId);

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

    const handleRefreshDevices = async () => {
        await loadDevices();
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>WebRTC Video Call</h1>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.controls}>
                <div className={styles.inputGroup}>
                    <Label htmlFor="room">Room:</Label>
                    <Input
                        id="room"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        disabled={isConnected}
                    />
                </div>

                <div className={styles.inputGroup}>
                    <Label htmlFor="username">Username:</Label>
                    <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={isConnected}
                    />
                </div>

                {!isConnected ? (
                    <Button
                        onClick={joinRoom}
                        className={styles.button}
                    >
                        Join Room
                    </Button>
                ) : (
                    <Button
                        onClick={() => {
                            endCall();
                            leaveRoom();
                        }}
                        className={styles.button}
                        variant="destructive"
                    >
                        Leave Room
                    </Button>
                )}

                {isConnected && !isCallActive && (
                    <Button
                        onClick={startCall}
                        disabled={remoteUsers.length < 1}
                        className={styles.button}
                    >
                        Start Call
                    </Button>
                )}

                {isCallActive && (
                    <Button
                        onClick={endCall}
                        className={styles.button}
                        variant="destructive"
                    >
                        End Call
                    </Button>
                )}
            </div>

            <div className={styles.userList}>
                <h3>Participants ({remoteUsers.length}):</h3>
                <ul>
                    {remoteUsers.map((user, index) => (
                        <li key={index}>{user.username}</li>
                    ))}
                </ul>
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
                        stream={remoteUsers[0]?.stream || null}
                        className={styles.remoteVideo}
                    />
                    <div className={styles.videoLabel}>
                        {remoteUsers[0]?.username || 'Connecting...'}
                    </div>
                </div>
            </div>

            {!isConnected && (
                <div className={styles.deviceSelection}>
                    <h3>Select devices:</h3>
                    {!hasPermission ? (
                        <Button
                            onClick={loadDevices}
                            className={styles.refreshButton}
                        >
                            Request camera & microphone access
                        </Button>
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

// file: client/app/webrtc/hooks/useWebRTC.ts
// file: client/app/webrtc/hooks/useWebRTC.ts
import { useEffect, useRef, useState } from 'react';

interface WebSocketMessage {
type: string;
data?: any;
sdp?: RTCSessionDescriptionInit;
ice?: RTCIceCandidateInit;
}

export const useWebRTC = (
deviceIds: { video: string; audio: string },
username: string,
roomId: string
) => {
const [localStream, setLocalStream] = useState<MediaStream | null>(null);
const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
const [isCallActive, setIsCallActive] = useState(false);
const [isConnected, setIsConnected] = useState(false);
const [error, setError] = useState<string | null>(null);

    const ws = useRef<WebSocket | null>(null);
    const pc = useRef<RTCPeerConnection | null>(null);

    useEffect(() => {
        // Автоматически устанавливаем isCallActive в true, если есть удаленный поток
        const hasRemoteStream = remoteUsers.some(user => user.stream);
        if (hasRemoteStream && !isCallActive) {
            setIsCallActive(true);
        }
    }, [remoteUsers]);

    const cleanup = () => {
        if (pc.current) {
            pc.current.onicecandidate = null;
            pc.current.ontrack = null;
            pc.current.close();
            pc.current = null;
        }

        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }

        if (ws.current) {
            ws.current.close();
            ws.current = null;
        }

        setIsCallActive(false);
    };

    const leaveRoom = () => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'leave' }));
        }
        cleanup();
        setRemoteUsers([]);
    };

    const connectWebSocket = () => {
        try {
            ws.current = new WebSocket('wss://anybet.site/ws');

            ws.current.onopen = () => {
                setIsConnected(true);
                ws.current?.send(JSON.stringify({
                    type: 'join',
                    room: roomId,
                    username
                }));
            };

            ws.current.onerror = (error) => {
                console.error('WebSocket error:', error);
                setError('Connection error');
                setIsConnected(false);
            };

            ws.current.onclose = () => {
                console.log('WebSocket disconnected');
                setIsConnected(false);
                cleanup();
            };

            ws.current.onmessage = async (event) => {
                try {
                    const data: WebSocketMessage = JSON.parse(event.data);

                    if (data.type === 'room_info') {
                        setRemoteUsers(
                            data.data.users
                                .filter((u: string) => u !== username)
                                .map((u: string) => ({ username: u }))
                        );
                    }
                    else if (data.type === 'join') {
                        setRemoteUsers(prev => {
                            if (prev.some(user => user.username === data.data)) {
                                return prev;
                            }
                            return [...prev, { username: data.data }];
                        });
                    }
                    else if (data.type === 'leave') {
                        setRemoteUsers(prev =>
                            prev.filter(user => user.username !== data.data)
                        );
                    }
                    else if (data.type === 'error') {
                        setError(data.data);
                    } else if (data.sdp && pc.current) {
                        await pc.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
                        if (data.sdp.type === 'offer') {
                            const answer = await pc.current.createAnswer();
                            await pc.current.setLocalDescription(answer);
                            if (ws.current?.readyState === WebSocket.OPEN) {
                                ws.current.send(JSON.stringify({ sdp: answer }));
                            }
                        }
                    } else if (data.ice && pc.current) {
                        try {
                            await pc.current.addIceCandidate(new RTCIceCandidate(data.ice));
                        } catch (e) {
                            console.error('Error adding ICE candidate:', e);
                        }
                    }
                } catch (err) {
                    console.error('Error processing message:', err);
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
            if (pc.current) {
                cleanup();
            }

            pc.current = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });

            const stream = await navigator.mediaDevices.getUserMedia({
                video: deviceIds.video ? { deviceId: { exact: deviceIds.video } } : true,
                audio: deviceIds.audio ? { deviceId: { exact: deviceIds.audio } } : true
            });

            setLocalStream(stream);
            stream.getTracks().forEach(track => {
                pc.current?.addTrack(track, stream);
            });

            pc.current.onicecandidate = (event) => {
                if (event.candidate && ws.current?.readyState === WebSocket.OPEN) {
                    ws.current.send(JSON.stringify({ ice: event.candidate }));
                }
            };

            pc.current.ontrack = (event) => {
                setRemoteUsers(prev => {
                    const existingUser = prev.find(u => u.username !== username);
                    if (existingUser) {
                        return prev.map(u => ({
                            ...u,
                            stream: event.streams[0]
                        }));
                    }
                    return [...prev, { username: 'Remote', stream: event.streams[0] }];
                });
            };

            if (!ws.current) {
                throw new Error('WebSocket connection not established');
            }

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
            const offer = await pc.current.createOffer();
            await pc.current.setLocalDescription(offer);
            ws.current.send(JSON.stringify({ sdp: offer }));
            setIsCallActive(true);
            setError(null);
        } catch (err) {
            console.error('Error starting call:', err);
            setError('Failed to start call');
        }
    };

    const endCall = () => {
        cleanup();
        setRemoteUsers([]);
    };

    const joinRoom = async () => {
        setError(null);

        if (!connectWebSocket()) {
            return;
        }

        await new Promise(resolve => setTimeout(resolve, 500));

        if (!(await initializeWebRTC())) {
            return;
        }
    };

    useEffect(() => {
        return () => {
            cleanup();
        };
    }, []);

    return {
        localStream,
        remoteUsers,
        startCall,
        endCall,
        joinRoom,
        isCallActive,
        isConnected,
        leaveRoom,
        error
    };
};

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

нужно исправить реализацию конференции аналогично как в React
дай полный код, отвечай на русском, сделай минимальные изменения только по заданию