Android - ведущий!
D:\AndroidStudio\MyTest\app\src\main\java\com\example\mytest\MainActivity.kt
D:\AndroidStudio\MyTest\app\src\main\java\com\example\mytest\WebRTCClient.kt
D:\AndroidStudio\MyTest\app\src\main\java\com\example\mytest\WebRTCService.kt
D:\AndroidStudio\MyTest\app\src\main\java\com\example\mytest\WebSocketClient.kt


используются эти библиотеки
// WebRTC
implementation("io.github.webrtc-sdk:android:125.6422.07")
// WebSocket
implementation("com.squareup.okhttp3:okhttp:4.11.0")
их не меняй

Next 15 js - ведомый
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\webrtc\components
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\webrtc
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\webrtc\lib
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\webrtc\VideoCallApp.tsx
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\webrtc\hooks
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\webrtc\types.ts
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\webrtc\lib\signaling.ts
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\webrtc\lib\webrtc.ts
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\webrtc\hooks\useWebRTC.ts
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\webrtc\components\DeviceSelector.tsx
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\webrtc\components\VideoPlayer.tsx

Server Go
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-go\main.go



сервер Go
package main

import (
"encoding/json"
"log"
"math/rand"
"net/http"
"strings"
"sync"
"time"

	"github.com/gorilla/websocket"
	"github.com/pion/webrtc/v3"
)

var upgrader = websocket.Upgrader{
CheckOrigin: func(r *http.Request) bool { return true },
}

type Room struct {
Peers       map[string]*Peer
LeaderOffer *webrtc.SessionDescription
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
HasSlave bool     `json:"hasSlave"`
}

var (
peers   = make(map[string]*Peer)
rooms   = make(map[string]*Room)
mu      sync.Mutex
letters = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")
)

func init() {
rand.Seed(time.Now().UnixNano())
}

func randSeq(n int) string {
b := make([]rune, n)
for i := range b {
b[i] = letters[rand.Intn(len(letters))]
}
return string(b)
}

func logStatus() {
mu.Lock()
defer mu.Unlock()

	log.Printf("Status - Connections: %d, Rooms: %d", len(peers), len(rooms))
	for roomName, room := range rooms {
		log.Printf("Room '%s' (%d users): %v", roomName, len(room.Peers), getUsernames(room.Peers))
	}
}

func getUsernames(peers map[string]*Peer) []string {
usernames := make([]string, 0, len(peers))
for username := range peers {
usernames = append(usernames, username)
}
return usernames
}

func sendRoomInfo(roomName string) {
mu.Lock()
defer mu.Unlock()

	if room, exists := rooms[roomName]; exists {
		users := getUsernames(room.Peers)
		var leader string
		hasSlave := false

		for _, peer := range room.Peers {
			if peer.isLeader {
				leader = peer.username
			} else {
				hasSlave = true
			}
		}

		roomInfo := RoomInfo{
			Users:    users,
			Leader:   leader,
			HasSlave: hasSlave,
		}

		for _, peer := range room.Peers {
			peer.mu.Lock()
			err := peer.conn.WriteJSON(map[string]interface{}{
				"type": "room_info",
				"data": roomInfo,
			})
			peer.mu.Unlock()
			if err != nil {
				log.Printf("Error sending room info to %s: %v", peer.username, err)
			}
		}
	}
}

func cleanupRoom(roomName string) {
mu.Lock()
defer mu.Unlock()

	if room, exists := rooms[roomName]; exists {
		for _, peer := range room.Peers {
			peer.mu.Lock()
			if peer.pc != nil {
				peer.pc.Close()
			}
			if peer.conn != nil {
				peer.conn.Close()
			}
			delete(peers, peer.conn.RemoteAddr().String())
			peer.mu.Unlock()
		}
		delete(rooms, roomName)
		log.Printf("Room %s cleaned up", roomName)
	}
}

func main() {
http.HandleFunc("/ws", handleWebSocket)
http.HandleFunc("/status", func(w http.ResponseWriter, r *http.Request) {
logStatus()
w.Write([]byte("Status logged to console"))
})

	log.Println("Server started on :8080")
	logStatus()
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
conn, err := upgrader.Upgrade(w, r, nil)
if err != nil {
log.Println("WebSocket upgrade error:", err)
return
}
defer conn.Close()

	// Настройка ping-pong обработчиков
	conn.SetPingHandler(func(message string) error {
		log.Printf("Ping from %s", conn.RemoteAddr())
		return conn.WriteControl(websocket.PongMessage, []byte(message), time.Now().Add(5*time.Second))
	})

	conn.SetPongHandler(func(message string) error {
		log.Printf("Pong from %s", conn.RemoteAddr())
		return nil
	})

	remoteAddr := conn.RemoteAddr().String()
	log.Printf("New connection from: %s", remoteAddr)

	var initData struct {
		Room     string `json:"room"`
		Username string `json:"username"`
		IsLeader bool   `json:"isLeader"`
	}
	if err := conn.ReadJSON(&initData); err != nil {
		log.Printf("Read init data error from %s: %v", remoteAddr, err)
		return
	}

	log.Printf("User '%s' joining room '%s' as %s", initData.Username, initData.Room, map[bool]string{true: "leader", false: "slave"}[initData.IsLeader])

	mu.Lock()
	if room, exists := rooms[initData.Room]; exists {
		var leaderExists, slaveExists bool
		for _, peer := range room.Peers {
			if peer.isLeader {
				leaderExists = true
			} else {
				slaveExists = true
			}
		}

		if !initData.IsLeader {
			if room.LeaderOffer != nil {
				conn.WriteJSON(map[string]interface{}{
					"type": "offer",
					"sdp": map[string]interface{}{
						"type": room.LeaderOffer.Type.String(),
						"sdp":  room.LeaderOffer.SDP,
					},
				})
			}
		}

		if initData.IsLeader && leaderExists {
			mu.Unlock()
			conn.WriteJSON(map[string]interface{}{
				"type": "error",
				"data": "Room already has leader",
			})
			conn.Close()
			return
		}

		if !initData.IsLeader && slaveExists {
			mu.Unlock()
			conn.WriteJSON(map[string]interface{}{
				"type": "notification",
				"data": "Room already has slave",
			})
			conn.Close()
			return
		}
	} else {
		if !initData.IsLeader {
			mu.Unlock()
			conn.WriteJSON(map[string]interface{}{
				"type": "notification",
				"data": "Room does not exist",
			})
			conn.Close()
			return
		}
		rooms[initData.Room] = &Room{
			Peers: make(map[string]*Peer),
		}
	}
	mu.Unlock()

	config := webrtc.Configuration{
		ICEServers: []webrtc.ICEServer{
			{URLs: []string{"stun:stun.l.google.com:19302"}},
			{URLs: []string{"stun:stun1.l.google.com:19302"}},
			{URLs: []string{"stun:stun2.l.google.com:19302"}},
			{URLs: []string{"stun:stun3.l.google.com:19302"}},
			{URLs: []string{"stun:stun4.l.google.com:19302"}},
		},
		ICETransportPolicy: webrtc.ICETransportPolicyAll,
		BundlePolicy:       webrtc.BundlePolicyMaxBundle,
		RTCPMuxPolicy:      webrtc.RTCPMuxPolicyRequire,
		SDPSemantics:       webrtc.SDPSemanticsUnifiedPlan,
	}

	peerConnection, err := webrtc.NewPeerConnection(config)
	if err != nil {
		log.Printf("PeerConnection error for %s: %v", initData.Username, err)
		return
	}

	peer := &Peer{
		conn:     conn,
		pc:       peerConnection,
		username: initData.Username,
		room:     initData.Room,
		isLeader: initData.IsLeader,
	}

	mu.Lock()
	rooms[initData.Room].Peers[initData.Username] = peer
	peers[remoteAddr] = peer
	mu.Unlock()

	log.Printf("User '%s' joined room '%s'", initData.Username, initData.Room)
	logStatus()
	sendRoomInfo(initData.Room)

	// Отправка ping каждые 15 секунд
	go func() {
		ticker := time.NewTicker(15 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				peer.mu.Lock()
				if peer.conn != nil {
					if err := peer.conn.WriteControl(websocket.PingMessage, []byte{}, time.Now().Add(5*time.Second)); err != nil {
						log.Printf("Ping error to %s: %v", peer.username, err)
						peer.mu.Unlock()
						return
					}
				}
				peer.mu.Unlock()
			}
		}
	}()

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			log.Printf("Connection closed by %s: %v", initData.Username, err)

			mu.Lock()
			delete(peers, remoteAddr)
			if room, exists := rooms[peer.room]; exists {
				delete(room.Peers, peer.username)
				if peer.isLeader || len(room.Peers) == 0 {
					cleanupRoom(peer.room)
				} else {
					sendRoomInfo(peer.room)
				}
			}
			mu.Unlock()
			break
		}

		var data map[string]interface{}
		if err := json.Unmarshal(msg, &data); err != nil {
			log.Printf("JSON error from %s: %v", initData.Username, err)
			continue
		}

		if sdp, ok := data["sdp"].(map[string]interface{}); ok {
			sdpType := sdp["type"].(string)
			sdpStr := sdp["sdp"].(string)

			log.Printf("SDP %s from %s (%s)\n%s",
				sdpType, initData.Username, initData.Room, sdpStr)

			hasVideo := strings.Contains(sdpStr, "m=video")
			log.Printf("Video in SDP: %v", hasVideo)

			if !hasVideo && sdpType == "offer" {
				log.Printf("WARNING: Offer from %s contains no video!", initData.Username)
			}

			if sdpType == "offer" && initData.IsLeader {
				mu.Lock()
				rooms[initData.Room].LeaderOffer = &webrtc.SessionDescription{
					Type: webrtc.SDPTypeOffer,
					SDP:  sdpStr,
				}
				mu.Unlock()
			}
		} else if ice, ok := data["ice"].(map[string]interface{}); ok {
			log.Printf("ICE from %s: %s:%v %s",
				initData.Username,
				ice["sdpMid"].(string),
				ice["sdpMLineIndex"].(float64),
				ice["candidate"].(string))
		}

		mu.Lock()
		if room, exists := rooms[peer.room]; exists {
			for username, p := range room.Peers {
				if username != peer.username {
					p.mu.Lock()
					if err := p.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
						log.Printf("Error sending to %s: %v", username, err)
					}
					p.mu.Unlock()
				}
			}
		}
		mu.Unlock()
	}

	mu.Lock()
	delete(peers, remoteAddr)
	if room, exists := rooms[peer.room]; exists {
		delete(room.Peers, peer.username)
		if peer.isLeader || len(room.Peers) == 0 {
			cleanupRoom(peer.room)
		} else {
			sendRoomInfo(peer.room)
		}
	}
	mu.Unlock()

	log.Printf("User '%s' left room '%s'", peer.username, peer.room)
	logStatus()
}



Next

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
}

export const useWebRTC = (
deviceIds: { video: string; audio: string },
username: string,
roomId: string,
isLeader: boolean = false
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

    // Максимальное количество попыток переподключения
    const MAX_RETRIES = 3;

    const normalizeSdp = (sdp: string | undefined): string => {
        if (!sdp) return '';

        let normalized = sdp.trim();
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

        // Очистка WebRTC соединения
        if (pc.current) {
            pc.current.onicecandidate = null;
            pc.current.ontrack = null;
            pc.current.onnegotiationneeded = null;
            pc.current.oniceconnectionstatechange = null;
            pc.current.close();
            pc.current = null;
        }

        // Остановка медиапотоков
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }

        if (remoteStream) {
            remoteStream.getTracks().forEach(track => track.stop());
            setRemoteStream(null);
        }

        setIsCallActive(false);
        pendingIceCandidates.current = [];
        isNegotiating.current = false;
        shouldCreateOffer.current = false;
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
        setRetryCount(0);
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
                offerToReceiveVideo: true
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
                            'stun:stun.l.google.com:19302',
                            'stun:stun1.l.google.com:19302',
                            'stun:stun2.l.google.com:19302',
                            'stun:stun3.l.google.com:19302',
                            'stun:stun4.l.google.com:19302'
                        ]
                    }
                ],
                iceTransportPolicy: 'all',
                bundlePolicy: 'balanced',
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
        if (retryCount >= MAX_RETRIES) {
            setError('Не удалось восстановить соединение после нескольких попыток');
            leaveRoom();
            return;
        }

        setRetryCount(prev => prev + 1);
        console.log(`Попытка восстановления #${retryCount + 1}`);

        try {
            await leaveRoom();
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
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

            // 3. Отправляем запрос на присоединение к комнате с указанием роли
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
                        } else if (data.type === 'error' || data.type === 'notification') {
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
                    reject(new Error('Connection timeout'));
                }, 10000);

                ws.current.addEventListener('message', onMessage);

                // Отправляем сообщение с указанием роли
                ws.current.send(JSON.stringify({
                    action: "join",
                    room: roomId,
                    username: uniqueUsername,
                    isLeader: isLeader  // Добавляем параметр роли
                }));
            });

            setIsInRoom(true);

            // Если мы ведущий - сразу создаем оффер
            if (isLeader) {
                await createAndSendOffer();
            }

        } catch (err) {
            console.error('Ошибка входа в комнату:', err);
            setError(`Ошибка входа в комнату: ${err instanceof Error ? err.message : String(err)}`);
            cleanup();
            if (ws.current) {
                ws.current.close();
                ws.current = null;
            }

            if (retryCount < MAX_RETRIES) {
                setTimeout(() => {
                    joinRoom(uniqueUsername).catch(console.error);
                }, 2000 * (retryCount + 1));
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
        restartMediaDevices
    };
};

// file: docker-ardua/components/webrtc/lib/webrtc.ts
//app\webrtc\lib\webrtc.ts
export function checkWebRTCSupport(): boolean {
if (typeof window === 'undefined') return false;

    // Основные API WebRTC
    const requiredAPIs = [
        'RTCPeerConnection',
        'RTCSessionDescription',
        'RTCIceCandidate',
        'MediaStream',
        'navigator.mediaDevices.getUserMedia'
    ];

    // Проверка каждого API
    const hasAPIs = requiredAPIs.every(api => {
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

    if (!hasAPIs) return false;

    // Дополнительная проверка функциональности
    try {
        const pc = new RTCPeerConnection();
        const canCreateOffer = typeof pc.createOffer === 'function';
        const canCreateDataChannel = typeof pc.createDataChannel === 'function';
        pc.close();

        return canCreateOffer && canCreateDataChannel;
    } catch (e) {
        console.error('WebRTC support check failed:', e);
        return false;
    }
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
// file: docker-ardua/components/webrtc/index.tsx

'use client'

import { VideoCallApp } from './VideoCallApp';
import { useEffect, useState } from 'react';
import { checkWebRTCSupport } from './lib/webrtc';
import styles from './styles.module.css';

export default function WebRTCPage() {
const [isSupported, setIsSupported] = useState<boolean | null>(null);
const [browserRecommendation, setBrowserRecommendation] = useState('');

    useEffect(() => {
        const checkSupport = async () => {
            const supported = checkWebRTCSupport();
            setIsSupported(supported);

            if (!supported) {
                // Определяем браузер для более точного сообщения
                const userAgent = navigator.userAgent;
                let recommendation = 'Please use a modern browser like Chrome, Firefox or Edge';

                if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
                    recommendation = 'For Safari, please enable WebRTC in settings or use Chrome/Firefox';
                } else if (userAgent.includes('IE') || userAgent.includes('Trident')) {
                    recommendation = 'Internet Explorer does not support WebRTC. Please use Chrome, Firefox or Edge';
                }

                setBrowserRecommendation(recommendation);
            }
        };

        checkSupport();
    }, []);

    if (isSupported === false) {
        return (
            <div className={styles.unsupportedContainer}>
                <h2>WebRTC is not supported in your browser</h2>
                <p>{browserRecommendation}</p>
                <div className={styles.browserList}>
                    <p>Supported browsers:</p>
                    <ul>
                        <li>Google Chrome 28+</li>
                        <li>Mozilla Firefox 22+</li>
                        <li>Microsoft Edge 12+</li>
                        <li>Safari 11+ (with limitations)</li>
                        <li>Opera 18+</li>
                    </ul>
                </div>
                <p className={styles.note}>
                    Note: Some browsers may require HTTPS connection for WebRTC to work.
                </p>
            </div>
        );
    }

    return (
        <div>
            {isSupported === null ? (
                <div>Checking browser compatibility...</div>
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
height: 133%;
object-fit: contain;
transition: transform 0.3s ease;
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
import { ChevronDown, ChevronUp } from "lucide-react"
import SocketClient from '../control/SocketClient'

type VideoSettings = {
rotation: number
flipH: boolean
flipV: boolean
}

export const VideoCallApp = () => {
const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
const [selectedDevices, setSelectedDevices] = useState({
video: '',
audio: ''
})
const [showLocalVideo, setShowLocalVideo] = useState(true);
const [videoTransform, setVideoTransform] = useState('')
const [roomId, setRoomId] = useState('room1')
const [username, setUsername] = useState('user_' + Math.floor(Math.random() * 1000))
const [hasPermission, setHasPermission] = useState(false)
const [devicesLoaded, setDevicesLoaded] = useState(false)
const [isJoining, setIsJoining] = useState(false)
const [autoJoin, setAutoJoin] = useState(false)
const [activeTab, setActiveTab] = useState<'webrtc' | 'esp' | 'controls' | null>('esp')
const [logVisible, setLogVisible] = useState(false)
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
        retryCount,
        resetConnection,
        restartMediaDevices
    } = useWebRTC(
        selectedDevices,
        username,
        roomId,
        false // Явно указываем, что это ведомый
    );

    // Загрузка настроек звука из localStorage
    useEffect(() => {
        const savedMuteLocal = localStorage.getItem('muteLocalAudio')
        if (savedMuteLocal !== null) {
            setMuteLocalAudio(savedMuteLocal === 'true')
        }

        const savedMuteRemote = localStorage.getItem('muteRemoteAudio')
        if (savedMuteRemote !== null) {
            setMuteRemoteAudio(savedMuteRemote === 'true')
        }
    }, [])

    // Применение настроек звука к локальному потоку
    useEffect(() => {
        if (localStream) {
            localAudioTracks.current = localStream.getAudioTracks()
            localAudioTracks.current.forEach(track => {
                track.enabled = !muteLocalAudio
            })
        }
    }, [localStream, muteLocalAudio])

    // Применение настроек звука к удаленному потоку
    useEffect(() => {
        if (remoteStream) {
            remoteStream.getAudioTracks().forEach(track => {
                track.enabled = !muteRemoteAudio
            })
        }
    }, [remoteStream, muteRemoteAudio])

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

    const saveSettings = (settings: VideoSettings) => {
        localStorage.setItem('videoSettings', JSON.stringify(settings))
    }

    const applyVideoTransform = (settings: VideoSettings) => {
        const { rotation, flipH, flipV } = settings
        let transform = ''
        if (rotation !== 0) transform += `rotate(${rotation}deg) `
        transform += `scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`
        setVideoTransform(transform)

        if (remoteVideoRef.current) {
            remoteVideoRef.current.style.transform = transform
            remoteVideoRef.current.style.transformOrigin = 'center center'
            remoteVideoRef.current.style.width = '100%'
            remoteVideoRef.current.style.height = '100%'
            remoteVideoRef.current.style.objectFit = 'contain'
        }
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

            const videoDevice = devices.find(d =>
                d.kind === 'videoinput' &&
                (savedVideoDevice ? d.deviceId === savedVideoDevice : true)
            )
            const audioDevice = devices.find(d =>
                d.kind === 'audioinput' &&
                (savedAudioDevice ? d.deviceId === savedAudioDevice : true)
            )

            setSelectedDevices({
                video: videoDevice?.deviceId || '',
                audio: audioDevice?.deviceId || ''
            })
        } catch (error) {
            console.error('Device access error:', error)
            setHasPermission(false)
            setDevicesLoaded(true)
        }
    }

    useEffect(() => {
        const savedShowLocalVideo = localStorage.getItem('showLocalVideo');
        if (savedShowLocalVideo !== null) {
            setShowLocalVideo(savedShowLocalVideo === 'true');
        }
    }, []);

    const toggleLocalVideo = () => {
        const newState = !showLocalVideo;
        setShowLocalVideo(newState);
        localStorage.setItem('showLocalVideo', String(newState));
    };

    useEffect(() => {
        const savedAutoJoin = localStorage.getItem('autoJoin') === 'true'
        setAutoJoin(savedAutoJoin)
        loadSettings()
        loadDevices()

        const handleFullscreenChange = () => {
            const isNowFullscreen = !!document.fullscreenElement
            setIsFullscreen(isNowFullscreen)

            if (remoteVideoRef.current) {
                setTimeout(() => {
                    applyVideoTransform(videoSettings)
                }, 50)
            }
        }

        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange)
        }
    }, [])

    useEffect(() => {
        if (autoJoin && hasPermission && devicesLoaded && selectedDevices.video && selectedDevices.audio) {
            joinRoom(username)
        }
    }, [autoJoin, hasPermission, devicesLoaded, selectedDevices])

    useEffect(() => {
        if (selectedDevices.video) localStorage.setItem('videoDevice', selectedDevices.video)
        if (selectedDevices.audio) localStorage.setItem('audioDevice', selectedDevices.audio)
    }, [selectedDevices])

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
    }

    const handleJoinRoom = async () => {
        setIsJoining(true)
        try {
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
                setTimeout(() => {
                    applyVideoTransform(videoSettings)
                }, 50)
            } else {
                await document.exitFullscreen()
            }
        } catch (err) {
            console.error('Fullscreen error:', err)
        }
    }

    // Функции для управления звуком
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
        updateVideoSettings({ rotation: degrees })
    }

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
        setActiveTab(activeTab === tab ? null : tab)
    }

    return (
        <div className={styles.container}>
            <div ref={videoContainerRef} className={styles.remoteVideoContainer}>
                <VideoPlayer
                    stream={remoteStream}
                    className={styles.remoteVideo}
                    transform={videoTransform}
                />
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
                        className={`${styles.tabButton} ${activeTab === 'webrtc' ? styles.activeTab : ''}`}
                    >
                        {activeTab === 'webrtc' ? '▲' : '▼'} <img src="/cam.svg" alt="Camera" />
                    </button>

                    <button
                        onClick={() => toggleTab('esp')}
                        className={`${styles.tabButton} ${activeTab === 'esp' ? styles.activeTab : ''}`}
                    >
                        {activeTab === 'esp' ? '▲' : '▼'} <img src="/joy.svg" alt="Joystick" />
                    </button>

                    <button
                        onClick={() => toggleTab('controls')}
                        className={`${styles.tabButton} ${activeTab === 'controls' ? styles.activeTab : ''}`}
                    >
                        {activeTab === 'controls' ? '▲' : '▼'} <img src="/img.svg" alt="Image" />
                    </button>
                </div>
            </div>

            {activeTab === 'webrtc' && (
                <div className={styles.tabContent}>
                    {error && <div className={styles.error}>{error}</div>}
                    <div className={styles.controls}>
                        <div className={styles.connectionStatus}>
                            Статус: {isConnected ? (isInRoom ? `В комнате ${roomId}` : 'Подключено') : 'Отключено'}
                            {isCallActive && ' (Звонок активен)'}
                        </div>

                        <div className={styles.inputGroup}>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="autoJoin"
                                    checked={autoJoin}
                                    onCheckedChange={(checked) => {
                                        setAutoJoin(!!checked)
                                        localStorage.setItem('autoJoin', checked ? 'true' : 'false')
                                    }}
                                />
                                <Label htmlFor="autoJoin">Автоматическое подключение</Label>
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <Input
                                id="room"
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value)}
                                disabled={isInRoom}
                                placeholder="ID комнаты"
                            />
                        </div>

                        <div className={styles.inputGroup}>
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
                                disabled={!hasPermission || isJoining || (autoJoin && isInRoom)}
                                className={styles.button}
                            >
                                {isJoining ? 'Подключение...' : 'Войти в комнату'}
                            </Button>
                        ) : (
                            <Button onClick={leaveRoom} className={styles.button}>
                                Покинуть комнату
                            </Button>
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

            {activeTab === 'esp' && (
                <div className={styles.tabContent}>
                    <SocketClient/>
                </div>
            )}

            {activeTab === 'controls' && (
                <div className={styles.tabContent}>
                    <div className={styles.videoControlsTab}>
                        <div className={styles.controlButtons}>
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
                            {/* Кнопка управления исходящим звуком */}
                            <button
                                onClick={toggleMuteLocalAudio}
                                className={`${styles.controlButton} ${muteLocalAudio ? styles.active : ''}`}
                                title={muteLocalAudio ? 'Включить микрофон' : 'Отключить микрофон'}
                            >
                                {muteLocalAudio ? '🎤🔇' : '🎤'}
                            </button>
                            {/* Кнопка управления входящим звуком */}
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
        </div>
    )
}

// file: docker-ardua/components/webrtc/components/VideoPlayer.tsx
import { useEffect, useRef, useState } from 'react'

interface VideoPlayerProps {
stream: MediaStream | null;
muted?: boolean;
className?: string;
transform?: string;
}

type VideoSettings = {
rotation: number;
flipH: boolean;
flipV: boolean;
};

export const VideoPlayer = ({ stream, muted = false, className, transform }: VideoPlayerProps) => {
const videoRef = useRef<HTMLVideoElement>(null)
const [computedTransform, setComputedTransform] = useState<string>('')

    useEffect(() => {
        // Применяем трансформации при каждом обновлении transform
        if (typeof transform === 'string') {
            setComputedTransform(transform)
        } else {
            try {
                const saved = localStorage.getItem('videoSettings')
                if (saved) {
                    const { rotation, flipH, flipV } = JSON.parse(saved) as VideoSettings
                    let fallbackTransform = ''
                    if (rotation !== 0) fallbackTransform += `rotate(${rotation}deg) `
                    fallbackTransform += `scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`
                    setComputedTransform(fallbackTransform)
                } else {
                    setComputedTransform('')
                }
            } catch (e) {
                console.error('Error parsing saved video settings:', e)
                setComputedTransform('')
            }
        }
    }, [transform])

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleCanPlay = () => {
            video.play().catch(e => {
                console.error('Playback failed:', e);
                // Пытаемся снова с отключенным звуком
                video.muted = true;
                video.play().catch(e => console.error('Muted playback also failed:', e));
            });
        };

        const handleLoadedMetadata = () => {
            console.log('Video metadata loaded, dimensions:',
                video.videoWidth, 'x', video.videoHeight);
            if (video.videoWidth === 0 || video.videoHeight === 0) {
                console.warn('Video stream has zero dimensions');
            }
        };

        video.addEventListener('canplay', handleCanPlay);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);

        if (stream) {
            console.log('Setting video srcObject with stream:', stream.id);
            video.srcObject = stream;
        } else {
            console.log('Clearing video srcObject');
            video.srcObject = null;
        }

        return () => {
            video.removeEventListener('canplay', handleCanPlay);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
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
            style={{ transform: computedTransform, transformOrigin: 'center center' }}
        />
    )
}


Android

// file: src/main/java/com/example/mytest/WebRTCClient.kt
package com.example.mytest

import android.content.Context
import android.util.Log
import org.webrtc.*

class WebRTCClient(
private val context: Context,
private val eglBase: EglBase,
private val observer: PeerConnection.Observer
) {
lateinit var peerConnectionFactory: PeerConnectionFactory
lateinit var peerConnection: PeerConnection
private var localVideoTrack: VideoTrack? = null
private var localAudioTrack: AudioTrack? = null
private var videoCapturer: VideoCapturer? = null
private var surfaceTextureHelper: SurfaceTextureHelper? = null

    interface IceCandidateListener {
        fun onIceCandidate(candidate: IceCandidate)
    }

    private var iceCandidateListener: IceCandidateListener? = null

    init {
        initializePeerConnectionFactory()
        peerConnection = createPeerConnection()
        createLocalTracks()
    }

    private fun initializePeerConnectionFactory() {
        val initializationOptions = PeerConnectionFactory.InitializationOptions.builder(context)
            .setEnableInternalTracer(true)
            .createInitializationOptions()
        PeerConnectionFactory.initialize(initializationOptions)

        val videoEncoderFactory = DefaultVideoEncoderFactory(
            eglBase.eglBaseContext,
            true,  // enableIntelVp8Encoder
            true   // enableH264HighProfile
        )

        val videoDecoderFactory = DefaultVideoDecoderFactory(eglBase.eglBaseContext)

        peerConnectionFactory = PeerConnectionFactory.builder()
            .setVideoEncoderFactory(videoEncoderFactory)
            .setVideoDecoderFactory(videoDecoderFactory)
            .createPeerConnectionFactory()
    }

    private fun createPeerConnection(): PeerConnection {
        val rtcConfig = PeerConnection.RTCConfiguration(listOf(
            PeerConnection.IceServer.builder("stun:stun.l.google.com:19302").createIceServer(),
            PeerConnection.IceServer.builder("stun:stun1.l.google.com:19302").createIceServer(),
            PeerConnection.IceServer.builder("stun:stun2.l.google.com:19302").createIceServer()
        )).apply {
            sdpSemantics = PeerConnection.SdpSemantics.UNIFIED_PLAN
            continualGatheringPolicy = PeerConnection.ContinualGatheringPolicy.GATHER_CONTINUALLY
            iceTransportsType = PeerConnection.IceTransportsType.ALL
            bundlePolicy = PeerConnection.BundlePolicy.MAXBUNDLE
            rtcpMuxPolicy = PeerConnection.RtcpMuxPolicy.REQUIRE
            iceCandidatePoolSize = 5
        }

        return peerConnectionFactory.createPeerConnection(rtcConfig, observer) ?:
        throw IllegalStateException("Failed to create PeerConnection")
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

                localVideoTrack = peerConnectionFactory.createVideoTrack("ARDAMSv0", videoSource)
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

    fun setIceCandidateListener(listener: IceCandidateListener) {
        this.iceCandidateListener = listener
    }

    fun close() {
        try {
            videoCapturer?.let {
                it.stopCapture()
                it.dispose()
            }
            localVideoTrack?.dispose()
            localAudioTrack?.dispose()
            surfaceTextureHelper?.dispose()
            peerConnection.close()
            peerConnection.dispose()
            PeerConnectionFactory.stopInternalTracingCapture()
            PeerConnectionFactory.shutdownInternalTracer()
        } catch (e: Exception) {
            Log.e("WebRTCClient", "Error closing resources", e)
        }
    }
}

// file: src/main/java/com/example/mytest/WebRTCService.kt
package com.example.mytest

import android.app.*
import android.content.*
import android.content.pm.ServiceInfo
import android.net.ConnectivityManager
import android.net.NetworkInfo
import android.os.*
import android.util.Log
import androidx.core.app.NotificationCompat
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import org.json.JSONObject
import org.webrtc.*

class WebRTCService : Service() {
private val binder = LocalBinder()
private lateinit var webSocketClient: WebSocketClient
private lateinit var webRTCClient: WebRTCClient
private lateinit var eglBase: EglBase

    // Конфигурация
    private val roomName = "room1"
    private val userName = Build.MODEL ?: "AndroidDevice"
    private val webSocketUrl = "wss://ardua.site/ws"
    private val isLeader = true

    // Управление уведомлениями
    private val notificationId = 1
    private val channelId = "webrtc_service_channel"

    // Обработчики
    private val handler = Handler(Looper.getMainLooper())
    private val reconnectHandler = Handler(Looper.getMainLooper())

    // Переподключение
    private var reconnectAttempts = 0
    private val maxReconnectAttempts = 10
    private val baseReconnectDelay = 5000L
    private val maxReconnectDelay = 30000L

    // Мониторинг сети
    private val networkReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            if (isNetworkAvailable() && !isConnected()) {
                reconnect()
            }
        }
    }

    inner class LocalBinder : Binder() {
        fun getService(): WebRTCService = this@WebRTCService
    }

    override fun onBind(intent: Intent?): IBinder = binder

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "Service created")
        registerReceiver(networkReceiver, IntentFilter(ConnectivityManager.CONNECTIVITY_ACTION))
        createNotificationChannel()
        startForegroundService()
        initializeWebRTC()
        connectWebSocketWithRetry()
    }

    private fun initializeWebRTC() {
        Log.d("WebRTCService", "Initializing WebRTC")
        cleanupWebRTCResources()

        eglBase = EglBase.create()
        webRTCClient = WebRTCClient(
            context = this,
            eglBase = eglBase,
            observer = createPeerConnectionObserver()
        )

        // Установка обработчика ICE кандидатов
        webRTCClient.setIceCandidateListener(object : WebRTCClient.IceCandidateListener {
            override fun onIceCandidate(candidate: IceCandidate) {
                sendIceCandidate(candidate)
            }
        })
    }

    private fun createPeerConnectionObserver() = object : PeerConnection.Observer {
        override fun onIceCandidate(candidate: IceCandidate?) {
            candidate?.let {
                Log.d(TAG, "Local ICE candidate: ${it.sdpMid}:${it.sdpMLineIndex} ${it.sdp}")
                sendIceCandidate(it)
            }
        }

        override fun onIceConnectionChange(state: PeerConnection.IceConnectionState?) {
            Log.d(TAG, "ICE connection state: $state")
            when (state) {
                PeerConnection.IceConnectionState.DISCONNECTED,
                PeerConnection.IceConnectionState.FAILED -> {
                    updateNotification("Connection lost, reconnecting...")
                    reconnect()
                }
                PeerConnection.IceConnectionState.CONNECTED -> {
                    updateNotification("Connection established")
                    reconnectAttempts = 0
                }
                else -> {}
            }
        }

        // Остальные методы Observer оставляем пустыми
        override fun onSignalingChange(state: PeerConnection.SignalingState?) {}
        override fun onIceConnectionReceivingChange(receiving: Boolean) {}
        override fun onIceGatheringChange(state: PeerConnection.IceGatheringState?) {}
        override fun onIceCandidatesRemoved(candidates: Array<out IceCandidate>?) {}
        override fun onAddStream(stream: MediaStream?) {}
        override fun onRemoveStream(stream: MediaStream?) {}
        override fun onDataChannel(channel: DataChannel?) {}
        override fun onRenegotiationNeeded() {}
        override fun onAddTrack(receiver: RtpReceiver?, streams: Array<out MediaStream>?) {}
        override fun onTrack(transceiver: RtpTransceiver?) {}
    }

    private fun connectWebSocketWithRetry() {
        if (reconnectAttempts >= maxReconnectAttempts) {
            Log.e(TAG, "Max reconnect attempts reached")
            stopSelf()
            return
        }

        reconnectAttempts++
        val delay = calculateReconnectDelay()
        Log.d(TAG, "Attempting to connect to WebSocket (attempt $reconnectAttempts), delay: ${delay}ms")

        reconnectHandler.postDelayed({
            try {
                if (::webSocketClient.isInitialized) {
                    webSocketClient.disconnect()
                }
                connectWebSocket()
            } catch (e: Exception) {
                Log.e(TAG, "Error connecting to WebSocket", e)
                connectWebSocketWithRetry()
            }
        }, delay)
    }

    private fun calculateReconnectDelay(): Long {
        return minOf(baseReconnectDelay * (1 shl (reconnectAttempts - 1)), maxReconnectDelay)
    }

    private fun connectWebSocket() {
        webSocketClient = WebSocketClient(object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                Log.d(TAG, "WebSocket connected")
                updateNotification("Connected to server")
                reconnectAttempts = 0
                joinRoom()
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                try {
                    val message = JSONObject(text)
                    handleWebSocketMessage(message)
                } catch (e: Exception) {
                    Log.e(TAG, "WebSocket message parse error", e)
                }
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                Log.d(TAG, "WebSocket disconnected: $reason")
                updateNotification("Disconnected from server")
                connectWebSocketWithRetry()
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                Log.e(TAG, "WebSocket error: ${t.message}")
                updateNotification("Connection error")
                connectWebSocketWithRetry()
            }
        })

        webSocketClient.connect(webSocketUrl)
    }

    private fun joinRoom() {
        try {
            val message = JSONObject().apply {
                put("action", "join")
                put("room", roomName)
                put("username", userName)
                put("isLeader", isLeader)
                put("reconnecting", reconnectAttempts > 1)
            }
            webSocketClient.send(message.toString())

            if (isLeader) {
                handler.postDelayed({
                    if (isConnected()) {
                        createAndSendOffer()
                    } else {
                        Log.w(TAG, "Not connected, skipping offer creation")
                    }
                }, 1000)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error joining room", e)
        }
    }

    private fun handleWebSocketMessage(message: JSONObject) {
        Log.d(TAG, "Received: ${message.toString().take(200)}...")

        try {
            when (message.optString("type")) {
                "offer" -> handleOffer(message)
                "answer" -> handleAnswer(message)
                "ice_candidate" -> handleIceCandidate(message)
                "room_info" -> handleRoomInfo(message)
                else -> Log.w(TAG, "Unknown message type")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error handling message", e)
        }
    }

    private fun handleOffer(offer: JSONObject) {
        if (!isLeader) {
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
                        Log.e(TAG, "Error setting remote description: $error")
                    }
                    override fun onCreateSuccess(desc: SessionDescription?) {}
                    override fun onCreateFailure(error: String) {}
                }, sessionDescription)
            } catch (e: Exception) {
                Log.e(TAG, "Error handling offer", e)
            }
        }
    }

    private fun createAnswer(constraints: MediaConstraints) {
        try {
            webRTCClient.peerConnection.createAnswer(object : SdpObserver {
                override fun onCreateSuccess(desc: SessionDescription) {
                    webRTCClient.peerConnection.setLocalDescription(object : SdpObserver {
                        override fun onSetSuccess() {
                            sendSessionDescription(desc)
                        }
                        override fun onSetFailure(error: String) {
                            Log.e(TAG, "Error setting local description: $error")
                        }
                        override fun onCreateSuccess(desc: SessionDescription?) {}
                        override fun onCreateFailure(error: String) {}
                    }, desc)
                }
                override fun onCreateFailure(error: String) {
                    Log.e(TAG, "Error creating answer: $error")
                }
                override fun onSetSuccess() {}
                override fun onSetFailure(error: String) {}
            }, constraints)
        } catch (e: Exception) {
            Log.e(TAG, "Error creating answer", e)
        }
    }

    private fun handleAnswer(answer: JSONObject) {
        if (isLeader) {
            try {
                val sdp = answer.getJSONObject("sdp")
                val sessionDescription = SessionDescription(
                    SessionDescription.Type.fromCanonicalForm(sdp.getString("type")),
                    sdp.getString("sdp")
                )

                webRTCClient.peerConnection.setRemoteDescription(object : SdpObserver {
                    override fun onSetSuccess() {
                        Log.d(TAG, "Answer accepted")
                    }
                    override fun onSetFailure(error: String) {
                        Log.e(TAG, "Error setting answer: $error")
                    }
                    override fun onCreateSuccess(desc: SessionDescription?) {}
                    override fun onCreateFailure(error: String) {}
                }, sessionDescription)
            } catch (e: Exception) {
                Log.e(TAG, "Error handling answer", e)
            }
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
            Log.e(TAG, "Error handling ICE candidate", e)
        }
    }

    private fun handleRoomInfo(message: JSONObject) {
        try {
            val data = message.getJSONObject("data")
            val hasSlave = data.optBoolean("hasSlave", false)

            if (isLeader && !hasSlave) {
                handler.postDelayed({
                    if (isConnected()) {
                        createAndSendOffer()
                    }
                }, 1000)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error handling room info", e)
        }
    }

    private fun createAndSendOffer() {
        if (!canCreateOffer()) {
            Log.w(TAG, "Cannot create offer - not ready")
            return
        }

        try {
            val constraints = MediaConstraints().apply {
                mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveAudio", "true"))
                mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveVideo", "true"))
            }

            webRTCClient.peerConnection.createOffer(object : SdpObserver {
                override fun onCreateSuccess(desc: SessionDescription) {
                    Log.d(TAG, "Offer created successfully")
                    webRTCClient.peerConnection.setLocalDescription(object : SdpObserver {
                        override fun onSetSuccess() {
                            Log.d(TAG, "Local description set successfully")
                            sendSessionDescription(desc)
                        }
                        override fun onSetFailure(error: String) {
                            Log.e(TAG, "Error setting local description: $error")
                            handler.postDelayed({ createAndSendOffer() }, 1000)
                        }
                        override fun onCreateSuccess(desc: SessionDescription?) {}
                        override fun onCreateFailure(error: String) {}
                    }, desc)
                }
                override fun onCreateFailure(error: String) {
                    Log.e(TAG, "Error creating offer: $error")
                    handler.postDelayed({ createAndSendOffer() }, 1000)
                }
                override fun onSetSuccess() {}
                override fun onSetFailure(error: String) {}
            }, constraints)
        } catch (e: Exception) {
            Log.e(TAG, "Error in createAndSendOffer", e)
            handler.postDelayed({ createAndSendOffer() }, 1000)
        }
    }

    private fun canCreateOffer(): Boolean {
        return ::webRTCClient.isInitialized &&
                ::webSocketClient.isInitialized &&
                webSocketClient.isConnected() &&
                isLeader
    }

    private fun sendSessionDescription(desc: SessionDescription) {
        try {
            val message = JSONObject().apply {
                put("type", desc.type.canonicalForm())
                put("sdp", JSONObject().apply {
                    put("type", desc.type.canonicalForm())
                    put("sdp", desc.description)
                })
                put("room", roomName)
                put("username", userName)
            }
            webSocketClient.send(message.toString())
        } catch (e: Exception) {
            Log.e(TAG, "Error sending SDP", e)
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
            Log.e(TAG, "Error sending ICE candidate", e)
        }
    }

    fun reconnect() {
        handler.post {
            try {
                updateNotification("Reconnecting...")
                cleanupAllResources()
                initializeWebRTC()
                connectWebSocket()

                if (isLeader) {
                    handler.postDelayed({
                        if (isConnected()) {
                            createAndSendOffer()
                        }
                    }, 2000)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Reconnection error", e)
                handler.postDelayed({
                    reconnect()
                }, 5000)
            }
        }
    }

    private fun cleanupAllResources() {
        handler.removeCallbacksAndMessages(null)
        cleanupWebRTCResources()
        if (::webSocketClient.isInitialized) {
            webSocketClient.disconnect()
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
            Log.e(TAG, "Error cleaning WebRTC resources", e)
        }
    }

    private fun isNetworkAvailable(): Boolean {
        val connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val activeNetwork: NetworkInfo? = connectivityManager.activeNetworkInfo
        return activeNetwork?.isConnectedOrConnecting == true
    }

    fun isConnected(): Boolean {
        return ::webSocketClient.isInitialized && webSocketClient.isConnected()
    }

    fun isInitialized(): Boolean {
        return ::webSocketClient.isInitialized &&
                ::webRTCClient.isInitialized &&
                ::eglBase.isInitialized
    }

    // Управление уведомлениями
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
                Log.e(TAG, "SecurityException: ${e.message}")
                startForeground(notificationId, notification)
            }
        } else {
            startForeground(notificationId, notification)
        }
    }

    private fun createNotification(): Notification {
        return NotificationCompat.Builder(this, channelId)
            .setContentTitle("WebRTC Service")
            .setContentText("Active in room: $roomName")
            .setSmallIcon(R.drawable.ic_notification)
            .setPriority(NotificationCompat.PRIORITY_LOW)
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
        Log.d(TAG, "Service destroyed")
        unregisterReceiver(networkReceiver)
        cleanupAllResources()
        reconnectHandler.removeCallbacksAndMessages(null)
        super.onDestroy()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        intent?.action?.let {
            if (it == "RECONNECT") {
                reconnect()
            }
        }
        return START_STICKY
    }

    companion object {
        private const val TAG = "WebRTCService"
    }
}

// file: src/main/java/com/example/mytest/WebSocketClient.kt
package com.example.mytest

import android.annotation.SuppressLint
import android.util.Log
import okhttp3.*
import java.security.cert.X509Certificate
import java.util.concurrent.TimeUnit
import javax.net.ssl.*

class WebSocketClient(private val listener: WebSocketListener) {
private var webSocket: WebSocket? = null
private var isConnectionActive = false
private val client: OkHttpClient = createUnsafeOkHttpClient()

    fun connect(url: String) {
        val request = Request.Builder()
            .url(url)
            .build()

        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                isConnectionActive = true
                listener.onOpen(webSocket, response)
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                listener.onMessage(webSocket, text)
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                isConnectionActive = false
                listener.onClosed(webSocket, code, reason)
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                isConnectionActive = false
                listener.onFailure(webSocket, t, response)
            }
        })
    }

    fun send(message: String): Boolean {
        return if (isConnected()) {
            webSocket?.send(message) ?: false
        } else {
            false
        }
    }

    fun disconnect() {
        webSocket?.close(1000, "Normal closure")
        client.dispatcher.executorService.shutdown()
        isConnectionActive = false
    }

    fun isConnected(): Boolean {
        return isConnectionActive && webSocket != null
    }

    @SuppressLint("CustomX509TrustManager")
    private fun createUnsafeOkHttpClient(): OkHttpClient {
        return OkHttpClient.Builder()
            .pingInterval(20, TimeUnit.SECONDS) // Ping каждые 20 секунд для поддержания соединения
            .sslSocketFactory(getUnsafeSSLSocketFactory(), getTrustAllCerts()[0] as X509TrustManager)
            .hostnameVerifier { _, _ -> true } // Пропускаем проверку SSL
            .build()
    }

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
                override fun checkClientTrusted(chain: Array<X509Certificate>, authType: String) {}

                @SuppressLint("TrustAllX509TrustManager")
                override fun checkServerTrusted(chain: Array<X509Certificate>, authType: String) {}

                override fun getAcceptedIssuers(): Array<X509Certificate> = arrayOf()
            }
        )
    }
}


РЕАЛИЗОВАНО:
В комнате должно находиться только два пользователя, один из них ведущий (тот кто создает комнату и оффер подключения)- это Android устройство,
и ведомый кто подсоединяется к комнате (ведомый комнату не создает, а только подключается).
если ведомый хочет подсоединиться к комнате, а комнаты нету то идет оповещение, что комнаты нет. Оповещение не как ошибка, а как "оповещение".
если ведомый хочет присоединиться к комнате, а там уже есть два пользователя: ведомый и ведущий, комната удаляется, ведущий автоматически перезайдет на сервер создаст новую комнату и оффер, и будет ждать нового соединения с ведомым.
если ведомый хочет присоединиться к комнате, а комната есть и в ней нет ведомых, ведомый присоединяется к комнате.
если ведущий хочет присоединиться к комнате которая уже создана, то комната которая создана удаляется, ведущий автоматически перезаходит на сервер и создает оффер подключения.
- это сделано для лучшения связей получение ICE candidate , обновлений комнат и 100% подключений двухсторонней связи. если надо улучши переподключение, если подключение сразу не удается.
  андройд устройство должно работать в бесконечном цикле: создавать комнату и ждать подключения для трансляции, если создать не получается комнату -
  сервер недоступен - сделать бесконечый цикл подключения к серверу и пробовать создать комнату для видеотрансляции с ведомым.


Сервер теперь строго контролирует:

Только 1 ведущий на комнату
Только 1 ведомый на комнату

Автоматически закрывает комнату при отключении участника
Android:
Создает оффер только когда уверен, что он единственный ведущий
Добавляет задержки для стабильного подключения
Улучшает логику переподключения
При отключении ведомого:
Комната автоматически закрывается
Ведущий создает новую комнату пи оффер для нового ведомого.


Проблемы которые надо исправить
1. Ведущий первый раз соединяется с сервером, создает комнату и оффер, потом сам же пересоединяется к серверу, создает комнату и не создает оффер.
   Должен присоединиться к серверу создать комнату и оффер, если он находится в комнате и создал оффер - ждать подключения ведомого. Проверять наличие соединения ping pong с сервером, если соединения нет перезаходить на сервер, если комната такая есть она удаляется, создается новая комната и создается оффер для ведомого.. и ждать ведомого и проверять соединения ... и так в бесконечном цикле.
2. Если комната создана ведущий и ведомый уже в трансляции, и присоденяется ведущий или ведомый - комната закрывается, ведущий перезаходит создает новую комнату и оффер, а ведомый присоединяется к новой комнате.
Дай полный код каждого файла.




###
ведущий создал комнату и оффер - ему нужно запретить удалять и создавать новую комнату и оффер, потому что он уже создал. создавать новую комнату и оффер нужно :
1. Если присоединяется третий ведущий или ведомый
2. Если ведущий присоединяется к комнате а эта комната уже есть
3. если ping pong нету связи с сервером.