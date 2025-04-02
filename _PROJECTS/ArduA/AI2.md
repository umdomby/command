SERVER GO
package main

import (
"encoding/json"
"flag"
"github.com/google/uuid"
"github.com/gorilla/websocket"
"log"
"net/http"
"sync"
"time"
)

var upgrader = websocket.Upgrader{
CheckOrigin: func(r *http.Request) bool {
return true
},
}

type Client struct {
conn     *websocket.Conn
roomID   string
clientID string
username string
}

type Message struct {
Event string          `json:"event"`
Data  json.RawMessage `json:"data"`
}

type Room struct {
clients    map[string]*Client // key: clientID
broadcast  chan []byte
register   chan *Client
unregister chan *Client
}

var (
rooms   = make(map[string]*Room)
roomsMu sync.Mutex
)

func main() {
port := flag.String("port", "8080", "port to serve on")
flag.Parse()

	http.HandleFunc("/ws", handleWebSocket)

	log.Printf("WebRTC Signaling Server starting on port %s\n", *port)
	log.Fatal(http.ListenAndServe(":"+*port, nil))
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
conn, err := upgrader.Upgrade(w, r, nil)
if err != nil {
log.Println("Upgrade error:", err)
return
}

	client := &Client{
		conn:     conn,
		clientID: uuid.New().String(),
	}

	go client.readPump()
}

func (c *Client) readPump() {
defer func() {
c.leaveRoom()
c.conn.Close()
}()

	for {
		_, msg, err := c.conn.ReadMessage()
		if err != nil {
			log.Println("Read error:", err)
			break
		}

		var message Message
		if err := json.Unmarshal(msg, &message); err != nil {
			log.Println("Unmarshal error:", err)
			continue
		}

		switch message.Event {
		case "join":
			var data struct {
				RoomID   string `json:"roomId"`
				Username string `json:"username"`
			}
			if err := json.Unmarshal(message.Data, &data); err != nil {
				log.Println("Invalid join data:", err)
				continue
			}
			c.joinRoom(data.RoomID, data.Username)
		case "offer", "answer", "candidate":
			c.handleRTCMessage(message.Event, message.Data)
		case "ping":
			c.sendPong()
		}
	}
}

func (c *Client) joinRoom(roomID, username string) {
roomsMu.Lock()
defer roomsMu.Unlock()

	// Leave previous room if any
	if c.roomID != "" {
		if room, exists := rooms[c.roomID]; exists {
			delete(room.clients, c.clientID)
			if len(room.clients) == 0 {
				delete(rooms, c.roomID)
			}
		}
	}

	if roomID == "" {
		roomID = uuid.New().String()
	}

	room, exists := rooms[roomID]
	if !exists {
		room = &Room{
			clients:    make(map[string]*Client),
			broadcast:  make(chan []byte),
			register:   make(chan *Client),
			unregister: make(chan *Client),
		}
		rooms[roomID] = room
		go room.run()
	}

	// If client with same username exists, remove it
	for _, client := range room.clients {
		if client.username == username {
			delete(room.clients, client.clientID)
			break
		}
	}

	c.roomID = roomID
	c.username = username
	room.clients[c.clientID] = c

	log.Printf("Client %s joined room: %s (total clients: %d)", username, roomID, len(room.clients))

	response := map[string]interface{}{
		"event": "joined",
		"data": map[string]interface{}{
			"roomId":   roomID,
			"username": username,
			"clients":  c.getOtherClients(),
		},
	}
	c.conn.WriteJSON(response)

	// Notify others about new client
	c.broadcastToOthers(map[string]interface{}{
		"event": "user_joined",
		"data": map[string]interface{}{
			"username": username,
		},
	})
}

func (c *Client) leaveRoom() {
roomsMu.Lock()
defer roomsMu.Unlock()

	if c.roomID == "" {
		return
	}

	room, exists := rooms[c.roomID]
	if !exists {
		return
	}

	delete(room.clients, c.clientID)
	log.Printf("Client %s left room: %s (remaining clients: %d)", c.username, c.roomID, len(room.clients))

	if len(room.clients) == 0 {
		delete(rooms, c.roomID)
		log.Println("Room deleted (no clients):", c.roomID)
	} else {
		// Notify others about client leaving
		c.broadcastToOthers(map[string]interface{}{
			"event": "user_left",
			"data": map[string]interface{}{
				"username": c.username,
			},
		})
	}
}

func (c *Client) handleRTCMessage(event string, data json.RawMessage) {
roomsMu.Lock()
defer roomsMu.Unlock()

	if c.roomID == "" {
		return
	}

	room, exists := rooms[c.roomID]
	if !exists {
		return
	}

	message := map[string]interface{}{
		"event": event,
		"data":  json.RawMessage(data),
		"from":  c.username,
	}

	for _, client := range room.clients {
		if client.clientID != c.clientID {
			client.conn.WriteJSON(message)
		}
	}
}

func (c *Client) broadcastToOthers(message interface{}) {
if c.roomID == "" {
return
}

	room, exists := rooms[c.roomID]
	if !exists {
		return
	}

	for _, client := range room.clients {
		if client.clientID != c.clientID {
			client.conn.WriteJSON(message)
		}
	}
}

func (c *Client) getOtherClients() []string {
var clients []string
if c.roomID == "" {
return clients
}

	room, exists := rooms[c.roomID]
	if !exists {
		return clients
	}

	for _, client := range room.clients {
		if client.clientID != c.clientID {
			clients = append(clients, client.username)
		}
	}
	return clients
}

func (c *Client) sendPong() {
c.conn.WriteJSON(map[string]interface{}{
"event": "pong",
"data":  nil,
})
}

func (r *Room) run() {
ticker := time.NewTicker(30 * time.Second)
defer ticker.Stop()

	for {
		select {
		case client := <-r.register:
			r.clients[client.clientID] = client
		case client := <-r.unregister:
			if _, ok := r.clients[client.clientID]; ok {
				delete(r.clients, client.clientID)
			}
		case <-ticker.C:
			// Room maintenance
			if len(r.clients) == 0 {
				return
			}
		}
	}
}



server {
listen 443 ssl http2;
listen [::]:443 ssl http2;
server_name anybet.site;

    ssl_certificate /etc/letsencrypt/live/anybet.site/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/anybet.site/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/anybet.site/chain.pem;

    # SSL optimization
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 24h;
    ssl_session_tickets off;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_stapling on;
    ssl_stapling_verify on;

    # CORS settings
    set $cors_origin "https://anybet.site";
    set $cors_methods "GET, POST, OPTIONS";
    set $cors_headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range";

    location / {
        proxy_pass http://192.168.0.151:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_read_timeout 3600;

        # CORS headers
        add_header 'Access-Control-Allow-Origin' $cors_origin always;
        add_header 'Access-Control-Allow-Methods' $cors_methods always;
        add_header 'Access-Control-Allow-Headers' $cors_headers always;
        add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;

        # Security headers
        add_header Permissions-Policy "camera=*, microphone=*";
        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header Referrer-Policy "strict-origin";

        # Handle OPTIONS requests
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' $cors_origin;
            add_header 'Access-Control-Allow-Methods' $cors_methods;
            add_header 'Access-Control-Allow-Headers' $cors_headers;
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }

    location /ws {
        proxy_pass http://192.168.0.151:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
        proxy_connect_timeout 86400;

        # WebSocket CORS
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' $cors_origin;
            add_header 'Access-Control-Allow-Methods' $cors_methods;
            add_header 'Access-Control-Allow-Headers' $cors_headers;
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }

        add_header 'Access-Control-Allow-Origin' $cors_origin always;
        add_header 'Access-Control-Allow-Methods' $cors_methods always;
        add_header 'Access-Control-Allow-Headers' $cors_headers always;
    }

    # Security headers for all responses
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy "strict-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(self https://anybet.site), camera=(self https://anybet.site)" always;
}


signalingClient.current = new SignalingClient('wss://anybet.site/ws');



ЗАПОМНИ ЭТИ 4 ПУНКТА И придерживайся ЭТИХ четырёх пунктов, это важно?!
1. оставляй заголовки файлов в комментариях
2. отвечай на русском
3. отдавай полный исправленный код с указанием файла
4. никогда не забывай про стили
Дай полный код, не сокращай файлы. Не надо изменять весь код, реши только ошибку.

клиенты подключаются
2025/03/31 15:07:54 Client User483 joined room: 123 (total clients: 2)
2025/03/31 15:07:59 Client User18 joined room: 123 (total clients: 2)


основное - User18
Подключается... но User18 не может подключиться
Статус: disconnected