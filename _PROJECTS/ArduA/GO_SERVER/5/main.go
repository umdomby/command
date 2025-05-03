package main

import (
	"encoding/json"
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
	isLeader bool
}

type RoomInfo struct {
	Users    []string `json:"users"`
	Leader   string   `json:"leader"`
	Follower string   `json:"follower"`
}

var (
	peers   = make(map[string]*Peer)              // Все подключенные пиры
	rooms   = make(map[string]map[string]*Peer)   // Комнаты с пирами
	mu      sync.Mutex                            // Мьютекс для потокобезопасности
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

func getWebRTCConfig() webrtc.Configuration {
	return webrtc.Configuration{
		ICEServers: []webrtc.ICEServer{
			{
				URLs:       []string{"turn:ardua.site:3478"},
				Username:   "user1",
				Credential: "pass1",
			},
			{URLs: []string{"stun:ardua.site:3478"}},
		},
		ICETransportPolicy: webrtc.ICETransportPolicyAll,
		BundlePolicy:       webrtc.BundlePolicyMaxBundle,
		RTCPMuxPolicy:      webrtc.RTCPMuxPolicyRequire,
		SDPSemantics:       webrtc.SDPSemanticsUnifiedPlan,
	}
}

func logStatus() {
	mu.Lock()
	defer mu.Unlock()

	log.Printf("Статус - Подключений: %d, Комнат: %d", len(peers), len(rooms))
	for room, roomPeers := range rooms {
		var leader, follower string
		for _, p := range roomPeers {
			if p.isLeader {
				leader = p.username
			} else {
				follower = p.username
			}
		}
		log.Printf("Комната '%s' - Ведущий: %s, Ведомый: %s", room, leader, follower)
	}
}

func sendRoomInfo(room string) {
	mu.Lock()
	defer mu.Unlock()

	if roomPeers, exists := rooms[room]; exists {
		var leader, follower string
		users := make([]string, 0, len(roomPeers))

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

		for _, peer := range roomPeers {
			if err := peer.conn.WriteJSON(map[string]interface{}{
				"type": "room_info",
				"data": roomInfo,
			}); err != nil {
				log.Printf("Ошибка отправки room_info для %s: %v", peer.username, err)
			}
		}
	}
}

func cleanupPeer(peer *Peer) {
	if peer == nil {
		return
	}

	if peer.pc != nil {
		peer.pc.Close()
	}

	if peer.conn != nil {
		peer.conn.Close()
	}

	mu.Lock()
	defer mu.Unlock()

	if roomPeers, exists := rooms[peer.room]; exists {
		delete(roomPeers, peer.username)
		if len(roomPeers) == 0 {
			delete(rooms, peer.room)
		} else if peer.isLeader {
			// Если ушел ведущий, закрываем комнату
			for _, p := range roomPeers {
				if err := p.conn.WriteJSON(map[string]interface{}{
					"type": "force_disconnect",
					"data": "Ведущий покинул комнату",
				}); err != nil {
					log.Printf("Ошибка отправки force_disconnect: %v", err)
				}
				cleanupPeer(p)
			}
			delete(rooms, peer.room)
		}
	}

	delete(peers, peer.conn.RemoteAddr().String())
}

func createNewOffer(leader *Peer) error {
	if leader.pc.SignalingState() == webrtc.SignalingStateHaveLocalOffer {
		leader.pc.Close()
		newPC, err := webrtc.NewPeerConnection(getWebRTCConfig())
		if err != nil {
			return err
		}
		leader.pc = newPC
		setupPeerConnectionHandlers(leader)
	}

	offer, err := leader.pc.CreateOffer(nil)
	if err != nil {
		return err
	}

	if err := leader.pc.SetLocalDescription(offer); err != nil {
		return err
	}

	return nil
}

func setupPeerConnectionHandlers(peer *Peer) {
	peer.pc.OnICECandidate(func(c *webrtc.ICECandidate) {
		if c == nil {
			return
		}
		if err := peer.conn.WriteJSON(map[string]interface{}{
			"type": "ice_candidate",
			"ice":  c.ToJSON(),
		}); err != nil {
			log.Printf("Ошибка отправки ice_candidate: %v", err)
		}
	})

	peer.pc.OnTrack(func(track *webrtc.TrackRemote, receiver *webrtc.RTPReceiver) {
		log.Printf("Получен трек: %s от %s", track.Kind().String(), peer.username)
	})

	peer.pc.OnConnectionStateChange(func(s webrtc.PeerConnectionState) {
		log.Printf("Состояние PeerConnection изменилось для %s: %s", peer.username, s.String())
		if s == webrtc.PeerConnectionStateFailed || s == webrtc.PeerConnectionStateClosed {
			cleanupPeer(peer)
			sendRoomInfo(peer.room)
		}
	})
}

func handlePeerJoin(room string, username string, isLeader bool, conn *websocket.Conn) (*Peer, error) {
	mu.Lock()
	defer mu.Unlock()

	if _, exists := rooms[room]; !exists {
		if !isLeader {
			return nil, nil
		}
		rooms[room] = make(map[string]*Peer)
	}

	roomPeers := rooms[room]

	if existingPeer, exists := roomPeers[username]; exists {
		cleanupPeer(existingPeer)
	}

	peerConnection, err := webrtc.NewPeerConnection(getWebRTCConfig())
	if err != nil {
		return nil, err
	}

	peer := &Peer{
		conn:     conn,
		pc:       peerConnection,
		username: username,
		room:     room,
		isLeader: isLeader,
	}

	setupPeerConnectionHandlers(peer)
	rooms[room][username] = peer
	peers[conn.RemoteAddr().String()] = peer

	return peer, nil
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Ошибка обновления до WebSocket:", err)
		return
	}
	defer func() {
		if r := recover(); r != nil {
			log.Printf("Восстановлено после паники: %v", r)
		}
	}()

	remoteAddr := conn.RemoteAddr().String()
	log.Printf("Новое подключение от: %s", remoteAddr)

	var initData struct {
		Room     string `json:"room"`
		Username string `json:"username"`
		IsLeader bool   `json:"isLeader"`
	}

	if err := conn.ReadJSON(&initData); err != nil {
		log.Printf("Ошибка чтения начальных данных: %v", err)
		return
	}

	log.Printf("Пользователь '%s' (ведущий: %v) присоединяется к комнате '%s'",
		initData.Username, initData.IsLeader, initData.Room)

	peer, err := handlePeerJoin(initData.Room, initData.Username, initData.IsLeader, conn)
	if err != nil {
		conn.WriteJSON(map[string]interface{}{
			"type": "error",
			"data": "Не удалось присоединиться к комнате",
		})
		return
	}
	if peer == nil {
		conn.WriteJSON(map[string]interface{}{
			"type": "error",
			"data": map[bool]string{
				true:  "Не удалось создать комнату",
				false: "Комната заполнена или не существует",
			}[initData.IsLeader],
		})
		return
	}

	log.Printf("Пользователь '%s' присоединился к комнате '%s' как %s",
		initData.Username, initData.Room, map[bool]string{true: "ведущий", false: "ведомый"}[initData.IsLeader])
	logStatus()
	sendRoomInfo(initData.Room)

	if !initData.IsLeader {
		mu.Lock()
		for _, leader := range rooms[initData.Room] {
			if leader.isLeader {
				time.AfterFunc(1*time.Second, func() {
					mu.Lock()
					defer mu.Unlock()

					if err := createNewOffer(leader); err != nil {
						log.Printf("Ошибка создания offer: %v", err)
						return
					}

					if err := conn.WriteJSON(map[string]interface{}{
						"type": "offer",
						"sdp": map[string]interface{}{
							"type": leader.pc.LocalDescription().Type.String(),
							"sdp":  leader.pc.LocalDescription().SDP,
						},
					}); err != nil {
						log.Printf("Ошибка отправки offer: %v", err)
					}
				})
				break
			}
		}
		mu.Unlock()
	}

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			log.Printf("Соединение закрыто %s: %v", initData.Username, err)
			cleanupPeer(peer)
			sendRoomInfo(initData.Room)
			break
		}

		var data map[string]interface{}
		if err := json.Unmarshal(msg, &data); err != nil {
			log.Printf("Ошибка JSON: %v", err)
			continue
		}

		msgType, ok := data["type"].(string)
		if !ok {
			log.Printf("Неверный тип сообщения")
			continue
		}

		switch msgType {
		case "offer", "answer", "ice_candidate":
			mu.Lock()
			for username, p := range rooms[peer.room] {
				if username != peer.username {
					if err := p.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
						log.Printf("Ошибка отправки для %s: %v", username, err)
					}
				}
			}
			mu.Unlock()

		case "switch_camera":
			if peer.isLeader {
				mu.Lock()
				for _, p := range rooms[peer.room] {
					if !p.isLeader {
						if err := p.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
							log.Printf("Ошибка отправки switch_camera: %v", err)
						}
					}
				}
				mu.Unlock()
			}

		case "resend_offer":
			if peer.isLeader {
				if err := createNewOffer(peer); err != nil {
					log.Printf("Ошибка создания нового предложения: %v", err)
				}
			}
		}
	}
}

func main() {
	http.HandleFunc("/ws", handleWebSocket)
	http.HandleFunc("/status", func(w http.ResponseWriter, r *http.Request) {
		logStatus()
		w.Write([]byte("Статус записан в лог"))
	})

	log.Println("Сервер запущен на :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}