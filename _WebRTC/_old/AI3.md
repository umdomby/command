было такое задание

1. добавь возможность создавать комнаты с паролем. Кто подсоединяется к этой комнате у нее требуют пароль. Если пусто пароль не требует.
2. Создатель комнаты подчеркивается, он может установить галочку для полного контроля за комнатой. Разрешать другим пользователям
   включать видео и отдельно включать звук. Перед созданием комнаты, создатель устанавливает галочку
   (разрешить пользователям активизировать видео и звук), после создатель может сам давать разрешения на включение видео и звука.
3. добавь возможность добавлять ники общая комната room1 без пароля, с чатом.
   При подключении ведео на активируется, пользователь сам может его включать.
4. Возможность выбора Device видео и звук
5. добавь стили, кнопку включить - отключить видео и звук (изначально они в комнате отключены),
6. стили чтобы видео зделасть на весь экран.
7. Сколько пользователей находится в комнате.
8. Сообщения в каждой комнате, показывалось - ник и время.
9. Нельзя находиться пользователям в комнате с одинаковыми никами.
   сделай сервер и клиент и дай мне полные кода


Server Go
package main

import (
"context"
"encoding/json"
"errors"
"log"
"net/http"
"sync"
"time"

	"github.com/gorilla/websocket"
	"github.com/pion/webrtc/v3"
	"github.com/sourcegraph/jsonrpc2"
	websocketjsonrpc2 "github.com/sourcegraph/jsonrpc2/websocket"
)

var upgrader = websocket.Upgrader{
CheckOrigin: func(r *http.Request) bool {
return true
},
}

type Room struct {
ID           string
Password     string
Creator      string
FullControl  bool
AllowVideo   bool
AllowAudio   bool
Participants map[string]*Participant
ChatHistory  []ChatMessage
mu           sync.RWMutex
}

type Participant struct {
PeerID    string
Nickname  string
Session   *jsonrpc2.Conn
Video     bool
Audio     bool
IsCreator bool
}

type ChatMessage struct {
Nickname  string    `json:"nickname"`
Message   string    `json:"message"`
Timestamp time.Time `json:"timestamp"`
}

type JoinRequest struct {
RoomID   string `json:"roomId"`
Password string `json:"password"`
Nickname string `json:"nickname"`
PeerID   string `json:"peerId"`
Video    bool   `json:"video"`
Audio    bool   `json:"audio"`
}

type RoomSettings struct {
RoomID     string `json:"roomId"`
AllowVideo bool   `json:"allowVideo"`
AllowAudio bool   `json:"allowAudio"`
}

type WebRTCSignal struct {
PeerID  string `json:"peerId"`
Type    string `json:"type"`
Payload string `json:"payload"`
}

type Server struct {
rooms map[string]*Room
mu    sync.RWMutex
}

func NewServer() *Server {
return &Server{
rooms: make(map[string]*Room),
}
}

func (s *Server) createRoom(roomID, password, creatorNickname string, fullControl, allowVideo, allowAudio bool) *Room {
room := &Room{
ID:           roomID,
Password:     password,
Creator:      creatorNickname,
FullControl:  fullControl,
AllowVideo:   allowVideo,
AllowAudio:   allowAudio,
Participants: make(map[string]*Participant),
ChatHistory:  make([]ChatMessage, 0),
}

	s.mu.Lock()
	s.rooms[roomID] = room
	s.mu.Unlock()
	return room
}

func (s *Server) joinRoom(conn *jsonrpc2.Conn, req JoinRequest) (*Room, *Participant, error) {
s.mu.RLock()
room, exists := s.rooms[req.RoomID]
s.mu.RUnlock()

	if !exists {
		return nil, nil, errors.New("room does not exist")
	}

	room.mu.Lock()
	defer room.mu.Unlock()

	// Check password
	if room.Password != "" && room.Password != req.Password {
		return nil, nil, errors.New("incorrect password")
	}

	// Check nickname uniqueness
	for _, p := range room.Participants {
		if p.Nickname == req.Nickname {
			return nil, nil, errors.New("nickname already in use")
		}
	}

	// Check if creator is joining
	isCreator := req.Nickname == room.Creator

	participant := &Participant{
		PeerID:    req.PeerID,
		Nickname:  req.Nickname,
		Session:   conn,
		Video:     req.Video && (room.AllowVideo || isCreator),
		Audio:     req.Audio && (room.AllowAudio || isCreator),
		IsCreator: isCreator,
	}

	room.Participants[req.PeerID] = participant
	return room, participant, nil
}

func (s *Server) handleWebSocket(w http.ResponseWriter, r *http.Request) {
conn, err := upgrader.Upgrade(w, r, nil)
if err != nil {
log.Printf("Failed to upgrade websocket: %v", err)
return
}
defer conn.Close()

	jsonRPCConn := jsonrpc2.NewConn(r.Context(), websocketjsonrpc2.NewObjectStream(conn), jsonrpc2.AsyncHandler(s))
	<-jsonRPCConn.DisconnectNotify()
}

func (s *Server) Handle(ctx context.Context, conn *jsonrpc2.Conn, req *jsonrpc2.Request) {
switch req.Method {
case "createRoom":
var params struct {
RoomID      string `json:"roomId"`
Password    string `json:"password"`
Nickname    string `json:"nickname"`
FullControl bool   `json:"fullControl"`
AllowVideo  bool   `json:"allowVideo"`
AllowAudio  bool   `json:"allowAudio"`
}
if err := json.Unmarshal(*req.Params, &params); err != nil {
conn.ReplyWithError(ctx, req.ID, &jsonrpc2.Error{Code: -32602, Message: "Invalid params"})
return
}

		room := s.createRoom(params.RoomID, params.Password, params.Nickname, params.FullControl, params.AllowVideo, params.AllowAudio)
		conn.Reply(ctx, req.ID, map[string]interface{}{
			"roomId":      room.ID,
			"fullControl": room.FullControl,
			"allowVideo":  room.AllowVideo,
			"allowAudio":  room.AllowAudio,
		})

	case "joinRoom":
		var joinReq JoinRequest
		if err := json.Unmarshal(*req.Params, &joinReq); err != nil {
			conn.ReplyWithError(ctx, req.ID, &jsonrpc2.Error{Code: -32602, Message: "Invalid params"})
			return
		}

		room, participant, err := s.joinRoom(conn, joinReq)
		if err != nil {
			conn.ReplyWithError(ctx, req.ID, &jsonrpc2.Error{Code: -32000, Message: err.Error()})
			return
		}

		// Notify others about new participant
		for _, p := range room.Participants {
			if p.PeerID != participant.PeerID {
				p.Session.Notify(ctx, "newParticipant", map[string]interface{}{
					"peerId":    participant.PeerID,
					"nickname":  participant.Nickname,
					"video":     participant.Video,
					"audio":     participant.Audio,
					"isCreator": participant.IsCreator,
				})
			}
		}

		// Send room info to new participant
		participants := make([]map[string]interface{}, 0)
		for _, p := range room.Participants {
			if p.PeerID != participant.PeerID {
				participants = append(participants, map[string]interface{}{
					"peerId":    p.PeerID,
					"nickname":  p.Nickname,
					"video":     p.Video,
					"audio":     p.Audio,
					"isCreator": p.IsCreator,
				})
			}
		}

		conn.Reply(ctx, req.ID, map[string]interface{}{
			"roomId":       room.ID,
			"fullControl":  room.FullControl,
			"allowVideo":   room.AllowVideo,
			"allowAudio":   room.AllowAudio,
			"participants": participants,
			"chatHistory":  room.ChatHistory,
		})

	case "sendMessage":
		var params struct {
			RoomID   string `json:"roomId"`
			PeerID   string `json:"peerId"`
			Nickname string `json:"nickname"`
			Message  string `json:"message"`
		}
		if err := json.Unmarshal(*req.Params, &params); err != nil {
			conn.ReplyWithError(ctx, req.ID, &jsonrpc2.Error{Code: -32602, Message: "Invalid params"})
			return
		}

		s.mu.RLock()
		room, exists := s.rooms[params.RoomID]
		s.mu.RUnlock()

		if !exists {
			conn.ReplyWithError(ctx, req.ID, &jsonrpc2.Error{Code: -32000, Message: "Room does not exist"})
			return
		}

		msg := ChatMessage{
			Nickname:  params.Nickname,
			Message:   params.Message,
			Timestamp: time.Now(),
		}

		room.mu.Lock()
		room.ChatHistory = append(room.ChatHistory, msg)
		room.mu.Unlock()

		// Broadcast message to all participants
		for _, p := range room.Participants {
			p.Session.Notify(ctx, "newMessage", msg)
		}

		conn.Reply(ctx, req.ID, "Message sent")

	case "updateSettings":
		var params RoomSettings
		if err := json.Unmarshal(*req.Params, &params); err != nil {
			conn.ReplyWithError(ctx, req.ID, &jsonrpc2.Error{Code: -32602, Message: "Invalid params"})
			return
		}

		s.mu.RLock()
		room, exists := s.rooms[params.RoomID]
		s.mu.RUnlock()

		if !exists {
			conn.ReplyWithError(ctx, req.ID, &jsonrpc2.Error{Code: -32000, Message: "Room does not exist"})
			return
		}

		room.mu.Lock()
		room.AllowVideo = params.AllowVideo
		room.AllowAudio = params.AllowAudio
		room.mu.Unlock()

		// Notify all participants about settings change
		for _, p := range room.Participants {
			p.Session.Notify(ctx, "roomSettingsUpdated", map[string]interface{}{
				"allowVideo": params.AllowVideo,
				"allowAudio": params.AllowAudio,
			})
		}

		conn.Reply(ctx, req.ID, "Settings updated")

	case "toggleMedia":
		var params struct {
			RoomID  string `json:"roomId"`
			PeerID  string `json:"peerId"`
			Type    string `json:"type"` // "video" or "audio"
			Enabled bool   `json:"enabled"`
		}
		if err := json.Unmarshal(*req.Params, &params); err != nil {
			conn.ReplyWithError(ctx, req.ID, &jsonrpc2.Error{Code: -32602, Message: "Invalid params"})
			return
		}

		s.mu.RLock()
		room, exists := s.rooms[params.RoomID]
		s.mu.RUnlock()

		if !exists {
			conn.ReplyWithError(ctx, req.ID, &jsonrpc2.Error{Code: -32000, Message: "Room does not exist"})
			return
		}

		room.mu.RLock()
		participant, exists := room.Participants[params.PeerID]
		room.mu.RUnlock()

		if !exists {
			conn.ReplyWithError(ctx, req.ID, &jsonrpc2.Error{Code: -32000, Message: "Participant not found"})
			return
		}

		// Check if participant is creator or if media is allowed
		if params.Type == "video" {
			if !participant.IsCreator && !room.AllowVideo {
				conn.ReplyWithError(ctx, req.ID, &jsonrpc2.Error{Code: -32000, Message: "Video is not allowed"})
				return
			}
			participant.Video = params.Enabled
		} else if params.Type == "audio" {
			if !participant.IsCreator && !room.AllowAudio {
				conn.ReplyWithError(ctx, req.ID, &jsonrpc2.Error{Code: -32000, Message: "Audio is not allowed"})
				return
			}
			participant.Audio = params.Enabled
		}

		// Notify all participants about media change
		for _, p := range room.Participants {
			p.Session.Notify(ctx, "mediaChanged", map[string]interface{}{
				"peerId":  params.PeerID,
				"type":    params.Type,
				"enabled": params.Enabled,
			})
		}

		conn.Reply(ctx, req.ID, "Media updated")

	case "leaveRoom":
		var params struct {
			RoomID string `json:"roomId"`
			PeerID string `json:"peerId"`
		}
		if err := json.Unmarshal(*req.Params, &params); err != nil {
			conn.ReplyWithError(ctx, req.ID, &jsonrpc2.Error{Code: -32602, Message: "Invalid params"})
			return
		}

		s.mu.RLock()
		room, exists := s.rooms[params.RoomID]
		s.mu.RUnlock()

		if !exists {
			conn.Reply(ctx, req.ID, "Room does not exist")
			return
		}

		room.mu.Lock()
		delete(room.Participants, params.PeerID)
		room.mu.Unlock()

		// Notify others about participant leaving
		for _, p := range room.Participants {
			p.Session.Notify(ctx, "participantLeft", map[string]interface{}{
				"peerId": params.PeerID,
			})
		}

		// If room is empty, delete it
		if len(room.Participants) == 0 {
			s.mu.Lock()
			delete(s.rooms, params.RoomID)
			s.mu.Unlock()
		}

		conn.Reply(ctx, req.ID, "Left room")

	case "signal":
		var params WebRTCSignal
		if err := json.Unmarshal(*req.Params, &params); err != nil {
			conn.ReplyWithError(ctx, req.ID, &jsonrpc2.Error{Code: -32602, Message: "Invalid params"})
			return
		}

		s.mu.RLock()
		room, exists := s.rooms[params.PeerID[:8]] // First 8 chars are room ID
		s.mu.RUnlock()

		if !exists {
			conn.ReplyWithError(ctx, req.ID, &jsonrpc2.Error{Code: -32000, Message: "Room does not exist"})
			return
		}

		// Forward the signal to the target peer
		room.mu.RLock()
		target, exists := room.Participants[params.PeerID]
		room.mu.RUnlock()

		if exists {
			target.Session.Notify(ctx, "signal", params)
		}

		conn.Reply(ctx, req.ID, "Signal forwarded")

	default:
		conn.ReplyWithError(ctx, req.ID, &jsonrpc2.Error{Code: -32601, Message: "Method not found"})
	}
}

func main() {
server := NewServer()

	// Configure WebRTC settings
	webrtcCfg := webrtc.Configuration{
		ICEServers: []webrtc.ICEServer{
			{
				URLs: []string{"stun:stun.l.google.com:19302"},
			},
		},
	}

	// This would be used in your WebRTC signaling logic
	_ = webrtcCfg

	http.HandleFunc("/ws", server.handleWebSocket)
	http.Handle("/", http.FileServer(http.Dir("./public")))

	log.Println("Server starting on :8080...")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

react
import React, { useState, useEffect, useRef } from 'react';
import { VideoOnIcon, VideoOffIcon, MicOnIcon, MicOffIcon, SendIcon } from './components/Icons';
import SimplePeer from 'simple-peer';
import './App.css';

const App = () => {
const [step, setStep] = useState('createOrJoin');
const [roomId, setRoomId] = useState('');
const [password, setPassword] = useState('');
const [nickname, setNickname] = useState('');
const [fullControl, setFullControl] = useState(false);
const [allowVideo, setAllowVideo] = useState(true);
const [allowAudio, setAllowAudio] = useState(true);
const [isCreator, setIsCreator] = useState(false);
const [peerId, setPeerId] = useState('');
const [participants, setParticipants] = useState([]);
const [messages, setMessages] = useState([]);
const [message, setMessage] = useState('');
const [videoEnabled, setVideoEnabled] = useState(false);
const [audioEnabled, setAudioEnabled] = useState(false);
const [availableDevices, setAvailableDevices] = useState({ video: [], audio: [] });
const [selectedVideoDevice, setSelectedVideoDevice] = useState('');
const [selectedAudioDevice, setSelectedAudioDevice] = useState('');
const [localStream, setLocalStream] = useState(null);
const [remoteStreams, setRemoteStreams] = useState({});
const [error, setError] = useState('');

    const localVideoRef = useRef(null);
    const remoteVideosRef = useRef({});
    const wsRef = useRef(null);
    const peersRef = useRef({});
    const chatRef = useRef(null);

    useEffect(() => {
        // Generate a random peer ID
        setPeerId(Math.random().toString(36).substring(2, 10));

        // Get available media devices
        navigator.mediaDevices.enumerateDevices()
            .then(devices => {
                const videoDevices = devices.filter(d => d.kind === 'videoinput');
                const audioDevices = devices.filter(d => d.kind === 'audioinput');

                setAvailableDevices({
                    video: videoDevices,
                    audio: audioDevices
                });

                if (videoDevices.length > 0) {
                    setSelectedVideoDevice(videoDevices[0].deviceId);
                }
                if (audioDevices.length > 0) {
                    setSelectedAudioDevice(audioDevices[0].deviceId);
                }
            })
            .catch(err => {
                console.error('Error getting devices:', err);
                setError('Failed to get device list');
            });
    }, []);

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [messages]);

    const initWebRTC = async () => {
        try {
            const constraints = {
                video: videoEnabled ? { deviceId: selectedVideoDevice } : false,
                audio: audioEnabled ? { deviceId: selectedAudioDevice } : false
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            setLocalStream(stream);

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            // Update all existing peers with the new stream
            Object.values(peersRef.current).forEach(peer => {
                if (stream) {
                    peer.addStream(stream);
                }
            });
        } catch (err) {
            console.error('WebRTC error:', err);
            setError(err.message);
        }
    };

    const createRoom = () => {
        if (!roomId || !nickname) {
            setError('Room ID and nickname are required');
            return;
        }

        // Автоматическое определение протокола (wss для https, ws для http)
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}/ws`;

        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
            const request = {
                jsonrpc: '2.0',
                id: 1,
                method: 'createRoom',
                params: {
                    roomId: roomId,
                    password: password,
                    nickname: nickname,
                    fullControl: fullControl,
                    allowVideo: allowVideo,
                    allowAudio: allowAudio
                }
            };

            wsRef.current.send(JSON.stringify(request));
        };

        wsRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.id === 1) {
                // Room created response
                setIsCreator(true);
                setStep('room');
                initWebRTC();
            } else if (data.method === 'newParticipant') {
                setParticipants(prev => [...prev, data.params]);
                createPeer(data.params.peerId, false);
            } else if (data.method === 'participantLeft') {
                setParticipants(prev => prev.filter(p => p.peerId !== data.params.peerId));
                removePeer(data.params.peerId);
            } else if (data.method === 'newMessage') {
                setMessages(prev => [...prev, data.params]);
            } else if (data.method === 'roomSettingsUpdated') {
                setAllowVideo(data.params.allowVideo);
                setAllowAudio(data.params.allowAudio);
            } else if (data.method === 'mediaChanged') {
                setParticipants(prev =>
                    prev.map(p =>
                        p.peerId === data.params.peerId
                            ? { ...p, [data.params.type]: data.params.enabled }
                            : p
                    )
                );
            } else if (data.method === 'signal') {
                const peer = peersRef.current[data.params.PeerID];
                if (peer) {
                    peer.signal(data.params.Payload);
                }
            }
        };

        wsRef.current.onerror = (error) => {
            console.error('WebSocket error:', error);
            setError('Connection error. Please try again.');
        };

        wsRef.current.onclose = () => {
            console.log('WebSocket connection closed');
        };
    };

    const joinRoom = () => {
        if (!roomId || !nickname) {
            setError('Room ID and nickname are required');
            return;
        }

        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}/ws`;

        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
            const request = {
                jsonrpc: '2.0',
                id: 1,
                method: 'joinRoom',
                params: {
                    roomId: roomId,
                    password: password,
                    nickname: nickname,
                    peerId: peerId,
                    video: videoEnabled,
                    audio: audioEnabled
                }
            };

            wsRef.current.send(JSON.stringify(request));
        };

        wsRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.id === 1) {
                // Join room response
                setAllowVideo(data.result.allowVideo);
                setAllowAudio(data.result.allowAudio);
                setFullControl(data.result.fullControl);
                setStep('room');
                setMessages(data.result.chatHistory || []);
                setParticipants(data.result.participants || []);
                initWebRTC();

                // Create peers for existing participants
                data.result.participants.forEach(participant => {
                    createPeer(participant.peerId, true);
                });
            } else if (data.method === 'newParticipant') {
                setParticipants(prev => [...prev, data.params]);
                createPeer(data.params.peerId, false);
            } else if (data.method === 'participantLeft') {
                setParticipants(prev => prev.filter(p => p.peerId !== data.params.peerId));
                removePeer(data.params.peerId);
            } else if (data.method === 'newMessage') {
                setMessages(prev => [...prev, data.params]);
            } else if (data.method === 'roomSettingsUpdated') {
                setAllowVideo(data.params.allowVideo);
                setAllowAudio(data.params.allowAudio);
            } else if (data.method === 'mediaChanged') {
                setParticipants(prev =>
                    prev.map(p =>
                        p.peerId === data.params.peerId
                            ? { ...p, [data.params.type]: data.params.enabled }
                            : p
                    )
                );
            } else if (data.method === 'signal') {
                const peer = peersRef.current[data.params.PeerID];
                if (peer) {
                    peer.signal(data.params.Payload);
                }
            }
        };

        wsRef.current.onerror = (error) => {
            console.error('WebSocket error:', error);
            setError('Connection error. Please try again.');
        };

        wsRef.current.onclose = () => {
            console.log('WebSocket connection closed');
        };
    };

    const createPeer = (targetPeerId, initiator) => {
        if (peersRef.current[targetPeerId]) return;

        const peer = new SimplePeer({
            initiator,
            trickle: true,
            stream: localStream
        });

        peer.on('signal', data => {
            // Send the signaling data to the other peer via the server
            wsRef.current.send(JSON.stringify({
                jsonrpc: '2.0',
                method: 'signal',
                params: {
                    PeerID: targetPeerId,
                    Type: 'signal',
                    Payload: JSON.stringify(data)
                }
            }));
        });

        peer.on('stream', stream => {
            // Got remote video stream
            setRemoteStreams(prev => ({
                ...prev,
                [targetPeerId]: stream
            }));
        });

        peer.on('close', () => {
            removePeer(targetPeerId);
        });

        peer.on('error', err => {
            console.error('Peer error:', err);
            removePeer(targetPeerId);
        });

        peersRef.current[targetPeerId] = peer;
    };

    const removePeer = (peerId) => {
        if (peersRef.current[peerId]) {
            peersRef.current[peerId].destroy();
            delete peersRef.current[peerId];
        }

        setRemoteStreams(prev => {
            const newStreams = { ...prev };
            delete newStreams[peerId];
            return newStreams;
        });
    };

    const updateRoomSettings = () => {
        if (!isCreator) return;

        wsRef.current.send(JSON.stringify({
            jsonrpc: '2.0',
            id: 2,
            method: 'updateSettings',
            params: {
                roomId: roomId,
                allowVideo: allowVideo,
                allowAudio: allowAudio
            }
        }));
    };

    const sendMessage = () => {
        if (!message.trim()) return;

        wsRef.current.send(JSON.stringify({
            jsonrpc: '2.0',
            id: 3,
            method: 'sendMessage',
            params: {
                roomId: roomId,
                peerId: peerId,
                nickname: nickname,
                message: message
            }
        }));

        setMessage('');
    };

    const toggleMedia = async (type) => {
        const currentState = type === 'video' ? videoEnabled : audioEnabled;
        const newState = !currentState;

        // Check permissions if not creator
        if (!isCreator) {
            if (type === 'video' && !allowVideo) {
                setError('Video is not allowed in this room');
                return;
            }
            if (type === 'audio' && !allowAudio) {
                setError('Audio is not allowed in this room');
                return;
            }
        }

        // Update state
        if (type === 'video') {
            setVideoEnabled(newState);
        } else {
            setAudioEnabled(newState);
        }

        // Send update to server
        wsRef.current.send(JSON.stringify({
            jsonrpc: '2.0',
            id: 4,
            method: 'toggleMedia',
            params: {
                roomId: roomId,
                peerId: peerId,
                type: type,
                enabled: newState
            }
        }));

        // Reinitialize media if enabling
        if (newState) {
            await initWebRTC();
        } else if (localStream) {
            // Disable the tracks if disabling
            const tracks = type === 'video'
                ? localStream.getVideoTracks()
                : localStream.getAudioTracks();
            tracks.forEach(track => track.enabled = false);
        }
    };

    const leaveRoom = () => {
        if (wsRef.current) {
            wsRef.current.send(JSON.stringify({
                jsonrpc: '2.0',
                id: 5,
                method: 'leaveRoom',
                params: {
                    roomId: roomId,
                    peerId: peerId
                }
            }));

            // Clean up
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
                setLocalStream(null);
            }

            Object.keys(peersRef.current).forEach(peerId => {
                removePeer(peerId);
            });

            wsRef.current.close();
            setStep('createOrJoin');
            setRemoteStreams({});
            setParticipants([]);
            setMessages([]);
        }
    };

    const formatTime = (dateString) => {
        if (typeof dateString === 'string') {
            return new Date(dateString).toLocaleTimeString();
        }
        return dateString.toLocaleTimeString();
    };

    return (
        <div className="app">
            {step === 'createOrJoin' && (
                <div className="create-join-container">
                    <h1>Video Conference</h1>
                    <div className="form-group">
                        <label>Nickname</label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="Your nickname"
                        />
                    </div>
                    <div className="form-group">
                        <label>Room ID</label>
                        <input
                            type="text"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                            placeholder="Room ID"
                        />
                    </div>
                    <div className="form-group">
                        <label>Password (optional)</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Room password"
                        />
                    </div>
                    <div className="form-group checkbox-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={fullControl}
                                onChange={(e) => setFullControl(e.target.checked)}
                            />
                            Full control (creator only)
                        </label>
                    </div>
                    {fullControl && (
                        <>
                            <div className="form-group checkbox-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={allowVideo}
                                        onChange={(e) => setAllowVideo(e.target.checked)}
                                    />
                                    Allow participants to enable video
                                </label>
                            </div>
                            <div className="form-group checkbox-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={allowAudio}
                                        onChange={(e) => setAllowAudio(e.target.checked)}
                                    />
                                    Allow participants to enable audio
                                </label>
                            </div>
                        </>
                    )}
                    <div className="form-group">
                        <label>Video Device</label>
                        <select
                            value={selectedVideoDevice}
                            onChange={(e) => setSelectedVideoDevice(e.target.value)}
                            disabled={availableDevices.video.length === 0}
                        >
                            {availableDevices.video.map(device => (
                                <option key={device.deviceId} value={device.deviceId}>
                                    {device.label || `Camera ${availableDevices.video.indexOf(device) + 1}`}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Audio Device</label>
                        <select
                            value={selectedAudioDevice}
                            onChange={(e) => setSelectedAudioDevice(e.target.value)}
                            disabled={availableDevices.audio.length === 0}
                        >
                            {availableDevices.audio.map(device => (
                                <option key={device.deviceId} value={device.deviceId}>
                                    {device.label || `Microphone ${availableDevices.audio.indexOf(device) + 1}`}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="button-group">
                        <button className="btn create-btn" onClick={createRoom}>Create Room</button>
                        <button className="btn join-btn" onClick={joinRoom}>Join Room</button>
                    </div>
                    {error && <div className="error-message">{error}</div>}
                </div>
            )}

            {step === 'room' && (
                <div className="room-container">
                    <div className="video-container">
                        <div className="participants-grid">
                            <div className="video-item local">
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className={videoEnabled ? '' : 'disabled'}
                                />
                                <div className="video-info">
                                    <span>{nickname} {isCreator && '(Creator)'}</span>
                                    <div className="media-controls">
                                        <button
                                            onClick={() => toggleMedia('video')}
                                            className={`media-btn ${videoEnabled ? 'active' : ''}`}
                                            disabled={!allowVideo && !isCreator}
                                        >
                                            {videoEnabled ? <VideoOnIcon /> : <VideoOffIcon />}
                                        </button>
                                        <button
                                            onClick={() => toggleMedia('audio')}
                                            className={`media-btn ${audioEnabled ? 'active' : ''}`}
                                            disabled={!allowAudio && !isCreator}
                                        >
                                            {audioEnabled ? <MicOnIcon /> : <MicOffIcon />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {participants.map(participant => (
                                <div key={participant.peerId} className="video-item remote">
                                    <video
                                        ref={el => {
                                            if (el && remoteStreams[participant.peerId]) {
                                                el.srcObject = remoteStreams[participant.peerId];
                                            }
                                        }}
                                        autoPlay
                                        playsInline
                                        className={participant.video ? '' : 'disabled'}
                                    />
                                    <div className="video-info">
                                        <span>{participant.nickname} {participant.isCreator && '(Creator)'}</span>
                                        <div className="media-status">
                                            {participant.video ? <VideoOnIcon className="status-icon" /> : <VideoOffIcon className="status-icon" />}
                                            {participant.audio ? <MicOnIcon className="status-icon" /> : <MicOffIcon className="status-icon" />}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="sidebar">
                        <div className="room-info">
                            <h3>Room: {roomId}</h3>
                            <p>Participants: {participants.length + 1}</p>
                            {isCreator && (
                                <div className="room-settings">
                                    <h4>Room Settings</h4>
                                    <div className="checkbox-group">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={allowVideo}
                                                onChange={(e) => {
                                                    setAllowVideo(e.target.checked);
                                                    updateRoomSettings();
                                                }}
                                            />
                                            Allow video
                                        </label>
                                    </div>
                                    <div className="checkbox-group">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={allowAudio}
                                                onChange={(e) => {
                                                    setAllowAudio(e.target.checked);
                                                    updateRoomSettings();
                                                }}
                                            />
                                            Allow audio
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="chat-container" ref={chatRef}>
                            <div className="chat-messages">
                                {messages.map((msg, index) => (
                                    <div key={index} className="message">
                                        <div className="message-header">
                                            <span className="message-sender">{msg.nickname}</span>
                                            <span className="message-time">{formatTime(msg.timestamp)}</span>
                                        </div>
                                        <div className="message-text">{msg.message}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="chat-input">
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                />
                                <button onClick={sendMessage}><SendIcon /></button>
                            </div>
                        </div>

                        <button className="btn leave-btn" onClick={leaveRoom}>Leave Room</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;


проблема в том что видео не обмениваются пользователями. Сделай так что создателем сразу разрешалось пользователям в комнатах обмениваться видео.
а если создатель поставит галочки при создании комнаты то видео нельзя обмениваться.
так же в других браузерах и устройствах нет возможности выбирать устройства исправь. отвечай на русском