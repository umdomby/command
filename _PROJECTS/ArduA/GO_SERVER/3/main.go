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
	peers   = make(map[string]*Peer)     // Все подключенные пиры
	rooms   = make(map[string]map[string]*Peer) // Комнаты с пирами
	mu      sync.Mutex                    // Мьютекс для потокобезопасности
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

// Конфигурация WebRTC (STUN/TURN серверы)
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

// Логирование текущего состояния сервера
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

// Отправка информации о комнате всем участникам
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
			err := peer.conn.WriteJSON(map[string]interface{}{
				"type": "room_info",
				"data": roomInfo,
			})
			if err != nil {
				log.Printf("Ошибка отправки информации о комнате для %s: %v", peer.username, err)
			}
		}
	}
}

// Полная очистка пира и его ресурсов
func cleanupPeer(peer *Peer) {
	if peer == nil {
		return
	}

	// Закрываем PeerConnection
	if peer.pc != nil {
		peer.pc.Close()
	}

	// Закрываем WebSocket соединение
	if peer.conn != nil {
		peer.conn.Close()
	}

	mu.Lock()
	defer mu.Unlock()

	// Удаляем из комнаты
	if roomPeers, exists := rooms[peer.room]; exists {
		delete(roomPeers, peer.username)
		if len(roomPeers) == 0 {
			delete(rooms, peer.room)
		} else {
			// Если ушел ведущий, закрываем комнату
			if peer.isLeader {
				for _, p := range roomPeers {
					// Отправляем сообщение о закрытии комнаты
					p.conn.WriteJSON(map[string]interface{}{
						"type": "force_disconnect",
						"data": "Ведущий покинул комнату",
					})
					cleanupPeer(p)
				}
				delete(rooms, peer.room)
			}
		}
	}

	// Удаляем из общего списка пиров
	delete(peers, peer.conn.RemoteAddr().String())
}

// Создание нового предложения (offer) для ведомого
func createNewOffer(peer *Peer) error {
	offer, err := peer.pc.CreateOffer(nil)
	if err != nil {
		return err
	}

	// Устанавливаем локальное описание
	err = peer.pc.SetLocalDescription(offer)
	if err != nil {
		return err
	}

	// Отправляем offer другому участнику комнаты
	mu.Lock()
	defer mu.Unlock()

	for _, p := range rooms[peer.room] {
		if p.username != peer.username {
			err = p.conn.WriteJSON(map[string]interface{}{
				"type": "offer",
				"sdp":  offer,
			})
			if err != nil {
				return err
			}
		}
	}

	return nil
}

// Обработка подключения нового пира
func handlePeerJoin(room string, username string, isLeader bool, conn *websocket.Conn) (*Peer, error) {
	mu.Lock()
	defer mu.Unlock()

	// Создаем комнату, если ее нет
	if _, exists := rooms[room]; !exists {
		if !isLeader {
			// Ведомый не может создать комнату
			return nil, nil
		}
		rooms[room] = make(map[string]*Peer)
	}

	roomPeers := rooms[room]

	// Проверяем, не подключен ли уже пользователь с таким именем
	if _, exists := roomPeers[username]; exists {
		return nil, nil
	}

	// Если это ведущий, удаляем предыдущего ведущего
	if isLeader {
		for _, p := range roomPeers {
			if p.isLeader {
				log.Printf("Заменяем ведущего %s на нового ведущего %s", p.username, username)
				p.conn.WriteJSON(map[string]interface{}{
					"type": "force_disconnect",
					"data": "Заменен новым ведущим",
				})
				cleanupPeer(p)
				break
			}
		}
	} else {
		// Если это ведомый, удаляем предыдущего ведомого
		for _, p := range roomPeers {
			if !p.isLeader {
				log.Printf("Заменяем ведомого %s на нового ведомого %s", p.username, username)
				p.conn.WriteJSON(map[string]interface{}{
					"type": "force_disconnect",
					"data": "Заменен новым зрителем",
				})
				cleanupPeer(p)
				break
			}
		}
	}

	// Проверяем лимит участников (2 - ведущий и ведомый)
	if len(roomPeers) >= 2 {
		return nil, nil
	}

	// Создаем новое PeerConnection
	peerConnection, err := webrtc.NewPeerConnection(getWebRTCConfig())
	if err != nil {
		log.Printf("Ошибка создания PeerConnection: %v", err)
		return nil, err
	}

	peer := &Peer{
		conn:     conn,
		pc:       peerConnection,
		username: username,
		room:     room,
		isLeader: isLeader,
	}

	// Обработчики событий WebRTC
	peerConnection.OnICECandidate(func(c *webrtc.ICECandidate) {
		if c == nil {
			return
		}

		// Отправляем ICE кандидата другому участнику
		candidate := c.ToJSON()
		conn.WriteJSON(map[string]interface{}{
			"type": "ice_candidate",
			"ice":  candidate,
		})
	})

	peerConnection.OnTrack(func(track *webrtc.TrackRemote, receiver *webrtc.RTPReceiver) {
		log.Printf("Получен трек: %s от %s", track.Kind().String(), peer.username)
	})

	peerConnection.OnConnectionStateChange(func(s webrtc.PeerConnectionState) {
		log.Printf("Состояние PeerConnection изменилось для %s: %s", peer.username, s.String())
		if s == webrtc.PeerConnectionStateFailed || s == webrtc.PeerConnectionStateClosed {
			log.Printf("Очищаем пир %s из-за состояния %s", peer.username, s.String())
			cleanupPeer(peer)
			sendRoomInfo(room)
		}
	})

	// Если это ведомый и в комнате уже есть ведущий - создаем новое предложение
	if !isLeader && len(roomPeers) > 0 {
		for _, p := range roomPeers {
			if p.isLeader {
				go func() {
					time.Sleep(500 * time.Millisecond) // Даем время на инициализацию
					err := createNewOffer(p)
					if err != nil {
						log.Printf("Ошибка создания нового предложения: %v", err)
					}
				}()
				break
			}
		}
	}

	// Добавляем пира в комнату
	rooms[room][username] = peer
	peers[conn.RemoteAddr().String()] = peer

	return peer, nil
}

func main() {
	http.HandleFunc("/ws", handleWebSocket)
	http.HandleFunc("/status", func(w http.ResponseWriter, r *http.Request) {
		logStatus()
		w.Write([]byte("Статус записан в лог"))
	})

	log.Println("Сервер запущен на :8080")
	logStatus()
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Ошибка обновления до WebSocket:", err)
		return
	}
	defer func() {
		if r := recover(); r != nil {
			log.Printf("Восстановлено после паники в handleWebSocket: %v", r)
		}
	}()

	remoteAddr := conn.RemoteAddr().String()
	log.Printf("Новое подключение от: %s", remoteAddr)

	var initData struct {
		Room     string `json:"room"`
		Username string `json:"username"`
		IsLeader bool   `json:"isLeader"`
	}

	// Читаем начальные данные
	if err := conn.ReadJSON(&initData); err != nil {
		log.Printf("Ошибка чтения начальных данных от %s: %v", remoteAddr, err)
		return
	}

	log.Printf("Пользователь '%s' (ведущий: %v) присоединяется к комнате '%s'",
		initData.Username, initData.IsLeader, initData.Room)

	// Обрабатываем подключение к комнате
	peer, err := handlePeerJoin(initData.Room, initData.Username, initData.IsLeader, conn)
	if err != nil {
		conn.WriteJSON(map[string]interface{}{
			"type": "error",
			"data": "Не удалось присоединиться к комнате",
		})
		return
	}
	if peer == nil {
		if initData.IsLeader {
			conn.WriteJSON(map[string]interface{}{
				"type": "error",
				"data": "Не удалось создать комнату",
			})
		} else {
			conn.WriteJSON(map[string]interface{}{
				"type": "error",
				"data": "Комната заполнена или не существует",
			})
		}
		return
	}

	log.Printf("Пользователь '%s' присоединился к комнате '%s' как %s",
		initData.Username, initData.Room, map[bool]string{true: "ведущий", false: "ведомый"}[initData.IsLeader])
	logStatus()
	sendRoomInfo(initData.Room)

	// Обработка входящих сообщений
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
			log.Printf("Ошибка JSON от %s: %v", initData.Username, err)
			continue
		}

		// Проверяем тип сообщения
		msgType, ok := data["type"].(string)
		if !ok {
			log.Printf("Неверный тип сообщения от %s", initData.Username)
			continue
		}

		switch msgType {
		case "offer", "answer", "ice_candidate":
			// Пересылаем SDP или ICE кандидата другому участнику
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
			// Переключаем камеру (только для ведущего)
			if peer.isLeader {
				mu.Lock()
				for _, p := range rooms[peer.room] {
					if !p.isLeader {
						if err := p.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
							log.Printf("Ошибка отправки для %s: %v", p.username, err)
						}
					}
				}
				mu.Unlock()
			}

		case "resend_offer":
			// Пересоздаем offer (для восстановления соединения)
			if peer.isLeader {
				err := createNewOffer(peer)
				if err != nil {
					log.Printf("Ошибка создания нового предложения: %v", err)
				}
			}
		}
	}
}