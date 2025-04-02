server go
package main

import (
"encoding/json"
"log"
"net/http"
"sync"
"time"

	"github.com/gorilla/websocket"
	"github.com/pion/webrtc/v3"
)

var upgrader = websocket.Upgrader{
CheckOrigin: func(r *http.Request) bool { return true },
}

type Client struct {
conn         *websocket.Conn
pc           *webrtc.PeerConnection
lastActivity time.Time
}

var (
clients = make(map[*Client]bool)
mutex   = &sync.Mutex{}
)

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
conn, err := upgrader.Upgrade(w, r, nil)
if err != nil {
log.Println("WebSocket upgrade error:", err)
return
}

	client := &Client{
		conn:         conn,
		lastActivity: time.Now(),
	}

	// Добавляем клиента
	mutex.Lock()
	clients[client] = true
	mutex.Unlock()

	// Запускаем пинг-понг для проверки соединения
	go pingPongHandler(client)

	defer func() {
		cleanupClient(client)
	}()

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			log.Println("Read error:", err)
			return
		}

		client.lastActivity = time.Now()

		var data map[string]interface{}
		if err := json.Unmarshal(msg, &data); err != nil {
			log.Println("JSON unmarshal error:", err)
			continue
		}

		switch data["type"] {
		case "offer":
			handleOffer(client, data["sdp"].(string))
		case "ice":
			handleICE(client, data["candidate"].(map[string]interface{}))
		case "pong":
			// Обработка pong-сообщения
			continue
		}
	}
}

func pingPongHandler(client *Client) {
ticker := time.NewTicker(30 * time.Second)
defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			if time.Since(client.lastActivity) > 45*time.Second {
				log.Println("Connection timeout, closing...")
				cleanupClient(client)
				return
			}

			if err := client.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				log.Println("Ping error:", err)
				cleanupClient(client)
				return
			}
		}
	}
}

func cleanupClient(client *Client) {
mutex.Lock()
defer mutex.Unlock()

	if _, ok := clients[client]; ok {
		if client.pc != nil {
			client.pc.Close()
		}
		if client.conn != nil {
			client.conn.Close()
		}
		delete(clients, client)
		log.Println("Client cleaned up")
	}
}

func handleOffer(client *Client, sdp string) {
config := webrtc.Configuration{
ICEServers: []webrtc.ICEServer{
{URLs: []string{"stun:stun.l.google.com:19302"}},
},
}

	pc, err := webrtc.NewPeerConnection(config)
	if err != nil {
		log.Println("PeerConnection error:", err)
		return
	}

	client.pc = pc

	pc.OnICECandidate(func(c *webrtc.ICECandidate) {
		if c == nil {
			return
		}
		if err := client.conn.WriteJSON(map[string]interface{}{
			"type":      "ice",
			"candidate": c.ToJSON(),
		}); err != nil {
			log.Println("Write ICE candidate error:", err)
		}
	})

	pc.OnConnectionStateChange(func(s webrtc.PeerConnectionState) {
		log.Printf("Connection state changed: %s\n", s.String())
		if s == webrtc.PeerConnectionStateFailed || s == webrtc.PeerConnectionStateClosed {
			cleanupClient(client)
		}
	})

	dataChannel, err := pc.CreateDataChannel("chat", nil)
	if err != nil {
		log.Println("DataChannel error:", err)
		return
	}

	dataChannel.OnOpen(func() {
		log.Println("DataChannel opened!")
		if err := dataChannel.Send([]byte("Hello from Go server!")); err != nil {
			log.Println("Send welcome message error:", err)
		}
	})

	dataChannel.OnMessage(func(msg webrtc.DataChannelMessage) {
		log.Printf("Received message: %s\n", string(msg.Data))
		if err := dataChannel.Send([]byte("Echo: " + string(msg.Data))); err != nil {
			log.Println("Send echo error:", err)
		}
	})

	if err := pc.SetRemoteDescription(webrtc.SessionDescription{
		Type: webrtc.SDPTypeOffer,
		SDP:  sdp,
	}); err != nil {
		log.Println("SetRemoteDescription error:", err)
		return
	}

	answer, err := pc.CreateAnswer(nil)
	if err != nil {
		log.Println("CreateAnswer error:", err)
		return
	}

	if err := pc.SetLocalDescription(answer); err != nil {
		log.Println("SetLocalDescription error:", err)
		return
	}

	if err := client.conn.WriteJSON(map[string]interface{}{
		"type": "answer",
		"sdp":  answer.SDP,
	}); err != nil {
		log.Println("Send answer error:", err)
	}
}

func handleICE(client *Client, candidate map[string]interface{}) {
if client.pc == nil {
return
}

	candidateMap, ok := candidate["candidate"].(map[string]interface{})
	if !ok {
		log.Println("Invalid candidate format")
		return
	}

	iceCandidate := webrtc.ICECandidateInit{
		Candidate: candidateMap["candidate"].(string),
	}

	if sdpMid, ok := candidateMap["sdpMid"].(string); ok {
		iceCandidate.SDPMid = &sdpMid
	}

	if sdpMLineIndex, ok := candidateMap["sdpMLineIndex"].(float64); ok {
		idx := uint16(sdpMLineIndex)
		iceCandidate.SDPMLineIndex = &idx
	}

	if err := client.pc.AddICECandidate(iceCandidate); err != nil {
		log.Println("AddICECandidate error:", err)
	}
}

func main() {
http.HandleFunc("/ws", handleWebSocket)
http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
w.WriteHeader(http.StatusOK)
w.Write([]byte("Server is healthy"))
})

	log.Println("Server starting on :8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal("Server failed:", err)
	}
}

client react

\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\webrtc\react-webrtc\src\App.css
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\webrtc\react-webrtc\src\App.js
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\webrtc\react-webrtc\src\index.css
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\webrtc\react-webrtc\src\index.js
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\webrtc\react-webrtc\src\MediaDevices.js
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\webrtc\react-webrtc\config-overrides.js
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\webrtc\react-webrtc\webpack.config.js


// file: src/App.css
.App {
text-align: center;
min-height: 100vh;
display: flex;
flex-direction: column;
align-items: center;
justify-content: center;
background-color: #282c34;
color: white;
padding: 20px;
}

.App-header {
width: 100%;
max-width: 1200px;
}

.media-container {
margin: 20px 0;
}

.video-container {
display: flex;
justify-content: center;
gap: 20px;
margin-bottom: 20px;
}

video {
background-color: #000;
border-radius: 8px;
max-width: 45%;
max-height: 400px;
}

.local-video {
border: 2px solid #61dafb;
}

.remote-video {
border: 2px solid #4caf50;
}

.controls {
display: flex;
flex-direction: column;
gap: 15px;
align-items: center;
}

.chat {
display: flex;
gap: 10px;
margin-top: 15px;
}

input {
padding: 10px;
font-size: 16px;
width: 300px;
border-radius: 5px;
border: 1px solid #61dafb;
}

button {
padding: 10px 20px;
font-size: 16px;
cursor: pointer;
background-color: #61dafb;
border: none;
border-radius: 5px;
transition: background-color 0.3s;
}

button:hover {
background-color: #4fa8d3;
}

button:disabled {
background-color: #ccc;
cursor: not-allowed;
}

.status {
margin-top: 20px;
padding: 15px;
background-color: #3a3f4b;
border-radius: 8px;
}

.error {
color: #ff6b6b;
margin-top: 10px;
}

.device-controls {
margin-top: 15px;
}

@media (max-width: 768px) {
.video-container {
flex-direction: column;
align-items: center;
}

video {
max-width: 100%;
max-height: 300px;
}
}

// file: src/App.js
import React, { useState, useEffect, useRef } from 'react';
import SimplePeer from 'simple-peer';
import MediaDevices from './MediaDevices';
import './App.css';

function App() {
const [message, setMessage] = useState('');
const [received, setReceived] = useState('');
const [isConnected, setIsConnected] = useState(false);
const [connectionError, setConnectionError] = useState('');
const peerRef = useRef(null);
const wsRef = useRef(null);
const [mediaStream, setMediaStream] = useState(null);

useEffect(() => {
const initWebSocket = () => {
wsRef.current = new WebSocket('ws://192.168.0.151:8080/ws');

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setConnectionError('');
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        cleanupConnection();
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('WebSocket connection failed');
      };

      wsRef.current.onmessage = handleWebSocketMessage;
    };

    initWebSocket();

    return () => {
      cleanupConnection();
      if (wsRef.current) wsRef.current.close();
    };
}, []);

const handleWebSocketMessage = (e) => {
try {
const data = JSON.parse(e.data);
console.log('Received WebSocket message:', data);

      if (!peerRef.current) {
        console.warn('Peer is not initialized');
        return;
      }

      if (data.type === 'answer') {
        peerRef.current.signal(data.sdp);
      } else if (data.type === 'ice' && data.candidate) {
        peerRef.current.signal(data.candidate);
      }
    } catch (err) {
      console.error('Error processing WebSocket message:', err);
    }
};

const cleanupConnection = () => {
if (peerRef.current) {
peerRef.current.destroy();
peerRef.current = null;
}
setIsConnected(false);

    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
};

const startConnection = async () => {
try {
cleanupConnection();

      // Получаем медиапоток (если нужно)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setMediaStream(stream);

      const peer = new SimplePeer({
        initiator: true,
        trickle: true,
        stream: stream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
          ]
        }
      });

      peer.on('signal', (data) => {
        console.log('Peer signal:', data);
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify(data));
        }
      });

      peer.on('connect', () => {
        setIsConnected(true);
        setConnectionError('');
        console.log('P2P connected!');
      });

      peer.on('data', (data) => {
        setReceived(data.toString());
      });

      peer.on('stream', (stream) => {
        console.log('Received remote stream');
        // Здесь можно обработать удаленный поток
      });

      peer.on('error', (err) => {
        console.error('P2P error:', err);
        setConnectionError(`Connection error: ${err.message}`);
        cleanupConnection();
      });

      peer.on('close', () => {
        console.log('P2P connection closed');
        cleanupConnection();
      });

      peerRef.current = peer;
    } catch (err) {
      console.error('Connection error:', err);
      setConnectionError(`Failed to start connection: ${err.message}`);
      cleanupConnection();
    }
};

const sendMessage = () => {
if (peerRef.current && isConnected) {
peerRef.current.send(message);
setMessage('');
}
};

return (
<div className="App">
<header className="App-header">
<h1>WebRTC Video Chat</h1>

          <div className="media-container">
            <MediaDevices
                mediaStream={mediaStream}
                isConnected={isConnected}
            />
          </div>

          <div className="controls">
            <button
                onClick={startConnection}
                disabled={isConnected}
            >
              {isConnected ? 'Connected' : 'Start Connection'}
            </button>

            <div className="chat">
              <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={!isConnected}
                  placeholder="Type your message"
              />
              <button
                  onClick={sendMessage}
                  disabled={!isConnected}
              >
                Send
              </button>
            </div>
          </div>

          <div className="status">
            <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
            <p>Received: {received || 'No messages yet'}</p>
            {connectionError && <p className="error">{connectionError}</p>}
          </div>
        </header>
      </div>
);
}

export default App;

// file: src/index.css
body {
margin: 0;
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
sans-serif;
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
}

code {
font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
monospace;
}


// file: src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
<React.StrictMode>
<App />
</React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals



// file: src/MediaDevices.js
import React, { useEffect, useRef } from 'react';

const MediaDevices = ({ mediaStream, isConnected }) => {
const localVideoRef = useRef(null);
const remoteVideoRef = useRef(null);

    useEffect(() => {
        if (mediaStream && localVideoRef.current) {
            localVideoRef.current.srcObject = mediaStream;
        }

        return () => {
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = null;
            }
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = null;
            }
        };
    }, [mediaStream]);

    return (
        <div className="media-devices">
            <div className="video-container">
                <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="local-video"
                />
                <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="remote-video"
                />
            </div>

            <div className="device-controls">
                {!isConnected && (
                    <button
                        onClick={async () => {
                            try {
                                const stream = await navigator.mediaDevices.getUserMedia({
                                    video: true,
                                    audio: true
                                });
                                localVideoRef.current.srcObject = stream;
                            } catch (err) {
                                console.error('Error accessing media devices:', err);
                            }
                        }}
                    >
                        Test Camera/Mic
                    </button>
                )}
            </div>
        </div>
    );
};

export default MediaDevices;

// file: config-overrides.js
const webpack = require('webpack');
const path = require('path');

module.exports = function override(config) {
// Добавляем полифиллы для Node.js модулей
config.resolve.fallback = {
...config.resolve.fallback,
"crypto": require.resolve("crypto-browserify"),
"stream": require.resolve("stream-browserify"),
"buffer": require.resolve("buffer"),
"http": require.resolve("stream-http"),
"https": require.resolve("https-browserify"),
"url": require.resolve("url"),
"os": require.resolve("os-browserify/browser"),
"assert": require.resolve("assert")
};

    // Добавляем плагины для глобальных переменных
    config.plugins = [
        ...(config.plugins || []),
        new webpack.ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer']
        })
    ];

    return config;
};

// file: webpack.config.js
const webpack = require('webpack');

module.exports = function override(config) {
const fallback = config.resolve.fallback || {};
Object.assign(fallback, {
"crypto": require.resolve("crypto-browserify"),
"stream": require.resolve("stream-browserify"),
"buffer": require.resolve("buffer"),
"http": require.resolve("stream-http"),
"https": require.resolve("https-browserify"),
"url": require.resolve("url"),
"os": require.resolve("os-browserify/browser"),
"assert": require.resolve("assert/")
});
config.resolve.fallback = fallback;

    config.plugins = (config.plugins || []).concat([
        new webpack.ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer']
        })
    ]);

    return config;
};


