package main

import (
"encoding/json"
"fmt"
"log"
"math/rand"
"net/http"
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
}

type RoomInfo struct {
Users []string `json:"users"`
}

var (
peers     = make(map[string]*Peer) // key: conn.RemoteAddr().String()
rooms     = make(map[string]map[string]*Peer) // key: room name
mu        sync.Mutex
letters   = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")
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

func main() {
http.HandleFunc("/ws", handleWebSocket)
http.HandleFunc("/rooms", listRooms)
fs := http.FileServer(http.Dir("./static"))
http.Handle("/", fs)

	fmt.Println("Сервер запущен на :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
conn, err := upgrader.Upgrade(w, r, nil)
if err != nil {
log.Println("WebSocket upgrade error:", err)
return
}
defer conn.Close()

	// Получаем начальные данные (комнату и ник)
	var initData struct {
		Room     string `json:"room"`
		Username string `json:"username"`
	}
	err = conn.ReadJSON(&initData)
	if err != nil {
		log.Println("Read init data error:", err)
		return
	}

	// Проверяем уникальность ника в комнате
	mu.Lock()
	if roomPeers, exists := rooms[initData.Room]; exists {
		if _, userExists := roomPeers[initData.Username]; userExists {
			conn.WriteJSON(map[string]interface{}{
				"type": "error",
				"data": "Username already exists in this room",
			})
			mu.Unlock()
			return
		}
	}
	mu.Unlock()

	// Создаем PeerConnection
	config := webrtc.Configuration{
		ICEServers: []webrtc.ICEServer{{URLs: []string{"stun:stun.l.google.com:19302"}}},
	}

	peerConnection, err := webrtc.NewPeerConnection(config)
	if err != nil {
		log.Println("PeerConnection error:", err)
		return
	}

	peer := &Peer{
		conn:     conn,
		pc:       peerConnection,
		username: initData.Username,
		room:     initData.Room,
	}

	// Добавляем в комнату
	mu.Lock()
	if _, exists := rooms[initData.Room]; !exists {
		rooms[initData.Room] = make(map[string]*Peer)
	}
	rooms[initData.Room][initData.Username] = peer
	peers[conn.RemoteAddr().String()] = peer
	mu.Unlock()

	// Отправляем информацию о комнате
	sendRoomInfo(initData.Room)

	// Обработка сообщений от клиента
	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			log.Println("Read error:", err)
			break
		}

		var data map[string]interface{}
		if err := json.Unmarshal(msg, &data); err != nil {
			log.Println("JSON unmarshal error:", err)
			continue
		}

		// Передаем только WebRTC данные другим участникам комнаты
		if _, isRTCMessage := data["sdp"]; isRTCMessage || data["ice"] != nil {
			mu.Lock()
			for username, p := range rooms[peer.room] {
				if username != peer.username {
					p.conn.WriteMessage(websocket.TextMessage, msg)
				}
			}
			mu.Unlock()
		}
	}

	// Удаляем при отключении
	mu.Lock()
	delete(peers, conn.RemoteAddr().String())
	delete(rooms[peer.room], peer.username)
	if len(rooms[peer.room]) == 0 {
		delete(rooms, peer.room)
	}
	mu.Unlock()

	// Обновляем информацию о комнате
	sendRoomInfo(peer.room)
}

func sendRoomInfo(room string) {
mu.Lock()
defer mu.Unlock()

	if roomPeers, exists := rooms[room]; exists {
		users := make([]string, 0, len(roomPeers))
		for username := range roomPeers {
			users = append(users, username)
		}

		roomInfo := RoomInfo{Users: users}

		for _, peer := range roomPeers {
			peer.conn.WriteJSON(map[string]interface{}{
				"type": "room_info",
				"data": roomInfo,
			})
		}
	}
}

func listRooms(w http.ResponseWriter, r *http.Request) {
mu.Lock()
defer mu.Unlock()

	roomList := make(map[string][]string)
	for room, peers := range rooms {
		users := make([]string, 0, len(peers))
		for user := range peers {
			users = append(users, user)
		}
		roomList[room] = users
	}

	json.NewEncoder(w).Encode(roomList)
}

import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
const [username, setUsername] = useState(`User${Math.floor(Math.random() * 1000)}`);
const [room, setRoom] = useState('room1');
const [users, setUsers] = useState([]);
const [isCallActive, setIsCallActive] = useState(false);
const [error, setError] = useState('');
const [isConnected, setIsConnected] = useState(false);

const localVideoRef = useRef();
const remoteVideoRef = useRef();
const ws = useRef();
const pc = useRef();

const cleanup = () => {
// Закрываем WebRTC соединение
if (pc.current) {
pc.current.onicecandidate = null;
pc.current.ontrack = null;
pc.current.close();
pc.current = null;
}

    // Останавливаем медиапотоки
    if (localVideoRef.current?.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current?.srcObject) {
      remoteVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      remoteVideoRef.current.srcObject = null;
    }

    setIsCallActive(false);
};

const connectWebSocket = () => {
try {
ws.current = new WebSocket('wss://anybet.site/ws');

      ws.current.onopen = () => {
        setIsConnected(true);
        // Отправляем данные для подключения (комната и ник)
        ws.current.send(JSON.stringify({
          room,
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

      return true;
    } catch (err) {
      console.error('WebSocket connection failed:', err);
      setError('Failed to connect to server');
      return false;
    }
};

const initializeWebRTC = async () => {
try {
// Очищаем предыдущее соединение
if (pc.current) {
cleanup();
}

      const config = {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      };

      pc.current = new RTCPeerConnection(config);

      // Получаем видеопоток с камеры
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        stream.getTracks().forEach(track => {
          pc.current.addTrack(track, stream);
        });
      } catch (err) {
        console.error('Error accessing media devices:', err);
        setError('Could not access camera/microphone');
        return;
      }

      // Обработка ICE кандидатов
      pc.current.onicecandidate = (event) => {
        if (event.candidate && ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({ ice: event.candidate }));
        }
      };

      // Получаем удаленный поток
      pc.current.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Обработка сообщений от сервера
      ws.current.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'room_info') {
            setUsers(data.data.users);
          }
          else if (data.type === 'error') {
            setError(data.data);
          }
          else if (data.sdp && pc.current) {
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
      console.error('WebRTC initialization failed:', err);
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
      setError('');
    } catch (err) {
      console.error('Error starting call:', err);
      setError('Failed to start call');
    }
};

const endCall = () => {
cleanup();
};

const joinRoom = async () => {
setError('');

    if (!connectWebSocket()) {
      return;
    }

    // Даем время на установку WebSocket соединения
    await new Promise(resolve => setTimeout(resolve, 500));

    if (!(await initializeWebRTC())) {
      return;
    }
};

useEffect(() => {
// Автоподключение при монтировании
joinRoom();

    return () => {
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
Status: {isConnected ? 'Connected' : 'Disconnected'}
</div>

          <div className="input-group">
            <label>Room:</label>
            <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Username:</label>
            <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <button onClick={joinRoom} disabled={isConnected}>
            {isConnected ? 'Joined' : 'Join Room'}
          </button>

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
                <button onClick={startCall} disabled={!isConnected || users.length < 2}>
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
                className="local-video"
            />
            <div className="video-label">You ({username})</div>
          </div>

          <div className="video-wrapper">
            <video
                ref={remoteVideoRef}
                autoPlay
                className="remote-video"
            />
            <div className="video-label">Remote</div>
          </div>
        </div>
      </div>
);
}

export default App;

скажи, соединение тут происходит между клиентами?  сервер видео-потоки не обрабатывает?

https://chat.deepseek.com/

В данном коде соединение происходит напрямую между клиентами (peer-to-peer) с использованием технологии WebRTC, а сервер выступает только в роли сигнального сервера (signaling server). Вот ключевые моменты:

Роль сервера (Go код):

Сервер только помогает установить соединение между клиентами (сигналинг)

Передает SDP-описания и ICE-кандидаты между клиентами

Не обрабатывает и не видит сами видео/аудио потоки

Ведет учет комнат и пользователей

Роль клиентов (React код):

Клиенты устанавливают прямое P2P-соединение (WebRTC)

Видео/аудио потоки идут напрямую между браузерами

Сервер не участвует в передаче медиаданных

Как это работает:

Клиенты подключаются к WebSocket серверу и сообщают о своей комнате

Когда один клиент создает offer (предложение соединения), сервер пересылает его другим клиентам в комнате

Клиенты обмениваются ICE-кандидатами через сервер для установки оптимального соединения

После установки соединения медиаданные идут напрямую между клиентами

Преимущества такого подхода:

Сервер не нагружается медиапотоками

Меньшая задержка между клиентами

Меньшая нагрузка на серверную инфраструктуру

Ограничения:

Для работы может потребоваться TURN-сервер, если клиенты находятся за сложными NAT

В текущем коде реализована только 1:1 связь (хотя архитектура позволяет расширить до многих участников)

Сервер действительно не обрабатывает видео-потоки - он только помогает клиентам найти друг друга и договориться о параметрах соединения, после чего медиаданные передаются напрямую между браузерами.