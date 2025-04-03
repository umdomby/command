import React, { useEffect, useRef } from 'react';

function App() {
const localVideoRef = useRef();
const remoteVideoRef = useRef();
const ws = useRef();
const pc = useRef();

useEffect(() => {
// Подключаемся к WebSocket серверу
ws.current = new WebSocket('wss://anybet.site/ws');

    // Настраиваем WebRTC
    const config = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };

    pc.current = new RTCPeerConnection(config);

    // Получаем видеопоток с камеры
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
          localVideoRef.current.srcObject = stream;
          stream.getTracks().forEach(track => {
            pc.current.addTrack(track, stream);
          });
        });

    // Обработка ICE кандидатов
    pc.current.onicecandidate = (event) => {
      if (event.candidate) {
        ws.current.send(JSON.stringify({ ice: event.candidate }));
      }
    };

    // Получаем удаленный поток
    pc.current.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    // Обработка сообщений от сервера
    ws.current.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (data.sdp) {
        await pc.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
        if (data.sdp.type === 'offer') {
          const answer = await pc.current.createAnswer();
          await pc.current.setLocalDescription(answer);
          ws.current.send(JSON.stringify({ sdp: answer }));
        }
      } else if (data.ice) {
        await pc.current.addIceCandidate(new RTCIceCandidate(data.ice));
      }
    };

    return () => {
      pc.current.close();
      ws.current.close();
    };
}, []);

const startCall = async () => {
const offer = await pc.current.createOffer();
await pc.current.setLocalDescription(offer);
ws.current.send(JSON.stringify({ sdp: offer }));
};

return (
<div>
<video ref={localVideoRef} autoPlay muted width="300" />
<video ref={remoteVideoRef} autoPlay width="300" />
<button onClick={startCall}>Start Call</button>
</div>
);
}

export default App;
.App {
text-align: center;
}

.App-logo {
height: 40vmin;
pointer-events: none;
}

@media (prefers-reduced-motion: no-preference) {
.App-logo {
animation: App-logo-spin infinite 20s linear;
}
}

.App-header {
background-color: #282c34;
min-height: 100vh;
display: flex;
flex-direction: column;
align-items: center;
justify-content: center;
font-size: calc(10px + 2vmin);
color: white;
}

.App-link {
color: #61dafb;
}

@keyframes App-logo-spin {
from {
transform: rotate(0deg);
}
to {
transform: rotate(360deg);
}
}


server Go
package main

import (
"fmt"
"log"
"net/http"
"sync"

	"github.com/gorilla/websocket"
	"github.com/pion/webrtc/v3"
)

var upgrader = websocket.Upgrader{
CheckOrigin: func(r *http.Request) bool { return true },
}

type Peer struct {
conn *websocket.Conn
pc   *webrtc.PeerConnection
}

var peers = make(map[string]*Peer)
var mu sync.Mutex

func main() {
http.HandleFunc("/ws", handleWebSocket)
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

	// Создаем PeerConnection
	config := webrtc.Configuration{
		ICEServers: []webrtc.ICEServer{{URLs: []string{"stun:stun.l.google.com:19302"}}},
	}

	peerConnection, err := webrtc.NewPeerConnection(config)
	if err != nil {
		log.Println("PeerConnection error:", err)
		return
	}

	peer := &Peer{conn: conn, pc: peerConnection}
	mu.Lock()
	peers[conn.RemoteAddr().String()] = peer
	mu.Unlock()

	// Обработка сообщений от клиента
	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			log.Println("Read error:", err)
			break
		}

		// Передаем SDP/ICE кандидаты между пирами
		for _, p := range peers {
			if p.conn != conn {
				p.conn.WriteMessage(websocket.TextMessage, msg)
			}
		}
	}
}


добавь комнаты, добавь ники (чтобы сразу подставлялись ники и комната стандартная например room1  И UserRandom) добавь стили, кнопкуи звонить положить трубку, стили чтобы видео зделасть на весь экран. Сколько пользователей находится в комнате. Нельзя находиться пользователям в комнате с одинаковыми никами. 
