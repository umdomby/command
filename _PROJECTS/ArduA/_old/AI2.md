SERVER GO


package main

import (
"encoding/json"
"errors" // <--- ДОБАВЛЕН ИМПОРТ
"log"
"math/rand"
"net/http"
// "strings" // Не нужен
"sync"
"time"

	"github.com/gorilla/websocket"
	"github.com/pion/webrtc/v3"
)

var upgrader = websocket.Upgrader{
CheckOrigin: func(r *http.Request) bool { return true }, // Разрешаем соединения с любых источников
}

// Peer представляет подключенного пользователя (ведущего или ведомого)
// Используем структуру из первой версии
type Peer struct {
conn     *websocket.Conn
pc       *webrtc.PeerConnection
username string
room     string
isLeader bool
mu       sync.Mutex // Мьютекс для защиты conn и pc
}

// RoomInfo содержит информацию о комнате для отправки клиентам
type RoomInfo struct {
Users    []string `json:"users"`
Leader   string   `json:"leader"`
Follower string   `json:"follower"`
}

var (
peers   = make(map[string]*Peer)             // Карта всех активных соединений (ключ - RemoteAddr)
rooms   = make(map[string]map[string]*Peer) // Карта комнат (ключ - имя комнаты, значение - карта пиров в комнате по username)
mu      sync.Mutex                           // Глобальный мьютекс для защиты peers и rooms
letters = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")
)

// Инициализация генератора случайных чисел
func init() {
rand.Seed(time.Now().UnixNano())
}

// Генерация случайной строки (не используется)
func randSeq(n int) string {
b := make([]rune, n)
for i := range b {
b[i] = letters[rand.Intn(len(letters))]
}
return string(b)
}

// Конфигурация WebRTC (используем стандартную из первой версии)
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

// Логирование статуса (без изменений)
func logStatus() {
mu.Lock()
defer mu.Unlock()

	log.Printf("--- Server Status ---")
	log.Printf("Total Connections: %d", len(peers))
	log.Printf("Active Rooms: %d", len(rooms))
	for room, roomPeers := range rooms {
		var leader, follower string
		users := []string{}
		for username, p := range roomPeers {
			users = append(users, username)
			if p.isLeader {
				leader = p.username
			} else {
				follower = p.username
			}
		}
		log.Printf("  Room '%s' (%d users: %v) - Leader: [%s], Follower: [%s]",
			room, len(roomPeers), users, leader, follower)
	}
	log.Printf("---------------------")
}

// Отправка информации о комнате (без изменений)
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
			peer.mu.Lock()
			conn := peer.conn
			if conn != nil {
				// log.Printf("Sending room_info to %s in room %s", peer.username, room) // Можно раскомментировать для детального лога
				err := conn.WriteJSON(map[string]interface{}{
					"type": "room_info",
					"data": roomInfo,
				})
				if err != nil {
					log.Printf("Error sending room info to %s (user: %s), attempting close: %v", conn.RemoteAddr(), peer.username, err)
					time.Sleep(100 * time.Millisecond)
					conn.WriteControl(websocket.CloseMessage,
						websocket.FormatCloseMessage(websocket.CloseInternalServerErr, "Cannot send room info"),
						time.Now().Add(time.Second))
					// Не закрываем соединение здесь явно, позволяем read-циклу завершиться
				}
			}
			peer.mu.Unlock()
		}
	}
}

// Безопасное закрытие соединений пира (из первой версии)
func closePeerConnection(peer *Peer, reason string) {
if peer == nil {
return
}
peer.mu.Lock()
defer peer.mu.Unlock()

	// Закрываем WebRTC
	if peer.pc != nil {
		log.Printf("Closing PeerConnection for %s (Reason: %s)", peer.username, reason)
		// Небольшая задержка может помочь отправить последние сообщения
		// time.Sleep(100 * time.Millisecond)
		if err := peer.pc.Close(); err != nil {
			// Игнорируем ошибку "invalid PeerConnection state", если уже закрывается
			// if !strings.Contains(err.Error(), "invalid PeerConnection state") {
			// 	log.Printf("Error closing peer connection for %s: %v", peer.username, err)
			// }
		}
		peer.pc = nil
	}

	// Закрываем WebSocket
	if peer.conn != nil {
		log.Printf("Closing WebSocket connection for %s (Reason: %s)", peer.username, reason)
		peer.conn.WriteControl(websocket.CloseMessage,
			websocket.FormatCloseMessage(websocket.CloseNormalClosure, reason),
			time.Now().Add(time.Second))
		peer.conn.Close()
		peer.conn = nil
	}
}

// Обработка присоединения нового пользователя (ключевые изменения здесь)
func handlePeerJoin(room string, username string, isLeader bool, conn *websocket.Conn) (*Peer, error) {
mu.Lock() // Блокируем доступ к общим ресурсам rooms и peers
defer mu.Unlock()

	// Создаем комнату, если ее нет
	if _, exists := rooms[room]; !exists {
		if !isLeader {
			// Ведомый не может создать комнату, лидер должен быть первым
			log.Printf("Follower '%s' attempted to join non-existent room '%s'. Leader must join first.", username, room)
			conn.WriteJSON(map[string]interface{}{"type": "error", "data": "Room does not exist. Leader must join first."})
			conn.Close()
			return nil, errors.New("room does not exist for follower") // <--- ИСПОЛЬЗОВАНИЕ errors.New
		}
		log.Printf("Leader '%s' creating new room: %s", username, room)
		rooms[room] = make(map[string]*Peer)
	}

	roomPeers := rooms[room]

	// --- Логика Замены Ведомого (только если новый - ведомый) ---
	if !isLeader {
		var existingFollower *Peer = nil
		for _, p := range roomPeers {
			if !p.isLeader {
				existingFollower = p
				break
			}
		}

		// Если есть старый ведомый, отключаем его
		if existingFollower != nil {
			log.Printf("Follower '%s' already exists in room '%s'. Disconnecting old follower to replace with new follower '%s'.", existingFollower.username, room, username)
			existingFollower.mu.Lock()
			if existingFollower.conn != nil {
				existingFollower.conn.WriteJSON(map[string]interface{}{
					"type": "force_disconnect",
					"data": "You have been replaced by another viewer.",
				})
			}
			existingFollower.mu.Unlock()

			// Запускаем закрытие соединений старого ведомого в отдельной горутине
			go closePeerConnection(existingFollower, "Replaced by new follower")

			// Удаляем старого ведомого из комнаты и глобального списка
			delete(roomPeers, existingFollower.username)
			var oldAddr string
			for addr, p := range peers {
				if p == existingFollower {
					oldAddr = addr
					break
				}
			}
			if oldAddr != "" {
				delete(peers, oldAddr)
			} else if existingFollower.conn != nil {
				// Попытка удалить по адресу из объекта, если не нашли по ссылке
				delete(peers, existingFollower.conn.RemoteAddr().String())
			}
			log.Printf("Old follower %s removed from room %s.", existingFollower.username, room)
		}
	}

	// --- Проверка Лимита Участников ---
	var currentLeaderCount, currentFollowerCount int
	for _, p := range roomPeers {
		if p.isLeader {
			currentLeaderCount++
		} else {
			currentFollowerCount++
		}
	}

	// Проверяем, можно ли добавить нового участника
	if isLeader && currentLeaderCount > 0 {
		log.Printf("Room '%s' already has a leader. Cannot add another leader '%s'.", room, username)
		conn.WriteJSON(map[string]interface{}{"type": "error", "data": "Room already has a leader"})
		conn.Close()
		return nil, nil // Пир не создан, но не ошибка сервера
	}
	if !isLeader && currentFollowerCount > 0 {
		log.Printf("Room '%s' already has a follower. Cannot add another follower '%s'. (This should not happen due to replacement logic).", room, username)
		conn.WriteJSON(map[string]interface{}{"type": "error", "data": "Room already has a follower (Internal Server Error?)"})
		conn.Close()
		return nil, nil
	}
	// Проверка на общее кол-во > 2 (на всякий случай)
	if len(roomPeers) >= 2 {
		log.Printf("Room '%s' is full (already has 2 participants). Cannot add '%s'.", room, username)
		conn.WriteJSON(map[string]interface{}{"type": "error", "data": "Room is full"})
		conn.Close()
		return nil, nil
	}

	// --- Создание PeerConnection для нового пира ---
	log.Printf("Creating new PeerConnection for %s (isLeader: %v) in room %s", username, isLeader, room)
	peerConnection, err := webrtc.NewPeerConnection(getWebRTCConfig())
	if err != nil {
		log.Printf("Failed to create peer connection for %s: %v", username, err)
		return nil, err // Возвращаем ошибку сервера
	}

	peer := &Peer{
		conn:     conn,
		pc:       peerConnection,
		username: username,
		room:     room,
		isLeader: isLeader,
	}

	// --- Настройка обработчиков PeerConnection ---

	// Отправка ICE кандидатов клиенту, который их сгенерировал
	peerConnection.OnICECandidate(func(c *webrtc.ICECandidate) {
		if c == nil {
			// log.Printf("ICE candidate gathering complete for %s", peer.username) // Можно логировать для отладки
			return
		}
		// Отправляем кандидата немедленно
		peer.mu.Lock()
		conn := peer.conn // Копируем под мьютексом
		peer.mu.Unlock()
		if conn != nil {
			// log.Printf("Sending ICE candidate from %s: %s...", peer.username, c.ToJSON().Candidate[:30]) // Лог кандидата
			err := conn.WriteJSON(map[string]interface{}{
				"type": "ice_candidate",
				"ice":  c.ToJSON(), // Отправляем полный объект
			})
			if err != nil {
				// log.Printf("Error sending ICE candidate to %s: %v", peer.username, err) // Лог ошибки отправки
			}
		}
	})

	// Обработка входящих треков (только логируем)
	peerConnection.OnTrack(func(track *webrtc.TrackRemote, receiver *webrtc.RTPReceiver) {
		log.Printf("Track received for %s in room %s: Type: %s, Codec: %s",
			peer.username, peer.room, track.Kind(), track.Codec().MimeType)
		// Читаем данные, чтобы не блокировать буфер
		go func() {
			buffer := make([]byte, 1500)
			for {
				_, _, readErr := track.Read(buffer)
				if readErr != nil {
					return
				}
			}
		}()
	})

	// Логирование смены состояний (для отладки)
	peerConnection.OnICEConnectionStateChange(func(state webrtc.ICEConnectionState) {
		log.Printf("ICE State Change for %s: %s", peer.username, state.String())
	})
	peerConnection.OnConnectionStateChange(func(s webrtc.PeerConnectionState) {
		log.Printf("PeerConnection State Change for %s: %s", peer.username, s.String())
	})

	// --- Добавление пира в структуры ---
	rooms[room][username] = peer
	peers[conn.RemoteAddr().String()] = peer
	log.Printf("Peer %s (isLeader: %v) added to room %s", username, isLeader, room)

	// --- *** НОВАЯ ЛОГИКА: Запрос "перезахода" лидеру *** ---
	if !isLeader { // Если подключился ВЕДОМЫЙ
		// Ищем лидера в этой комнате
		var leaderPeer *Peer = nil
		for _, p := range roomPeers {
			if p.isLeader {
				leaderPeer = p
				break
			}
		}

		// Если лидер найден, отправляем ему команду "перезайти и предложить"
		if leaderPeer != nil {
			log.Printf(">>> Sending 'rejoin_and_offer' command to leader %s for room %s", leaderPeer.username, room)
			leaderPeer.mu.Lock()
			leaderConn := leaderPeer.conn
			leaderPeer.mu.Unlock()

			if leaderConn != nil {
				err := leaderConn.WriteJSON(map[string]interface{}{
					"type": "rejoin_and_offer", // Новая команда для клиента лидера
					"room": room, // Передаем ID комнаты
				})
				if err != nil {
					log.Printf("Error sending 'rejoin_and_offer' to leader %s: %v", leaderPeer.username, err)
					conn.WriteJSON(map[string]interface{}{"type": "error", "data": "Failed to contact leader to start session"})
				}
			} else {
				log.Printf("Cannot send 'rejoin_and_offer', leader %s connection is nil", leaderPeer.username)
				conn.WriteJSON(map[string]interface{}{"type": "error", "data": "Leader seems disconnected"})
			}
		} else {
			// Этого не должно произойти, так как мы проверяли существование комнаты ранее
			log.Printf("CRITICAL ERROR: Follower %s joined room %s, but no leader found!", peer.username, room)
			conn.WriteJSON(map[string]interface{}{"type": "error", "data": "Internal server error: Leader not found"})
			conn.Close()
			// Удаляем только что добавленного пира
			delete(rooms[room], peer.username)
			delete(peers, conn.RemoteAddr().String())
			return nil, errors.New("leader disappeared unexpectedly") // <--- ИСПОЛЬЗОВАНИЕ errors.New
		}
	}

	return peer, nil // Возвращаем успешно созданный пир
}

// Главная функция (без изменений от первой версии)
func main() {
http.HandleFunc("/ws", handleWebSocket)
http.HandleFunc("/status", func(w http.ResponseWriter, r *http.Request) {
logStatus()
w.Write([]byte("Status logged to console"))
})

	log.Println("Server starting on :8080 (Logic: Leader Re-joins on Follower connect)")
	logStatus()
	log.Fatal(http.ListenAndServe(":8080", nil))
}

// Обработчик WebSocket соединений (изменения в логике пересылки)
func handleWebSocket(w http.ResponseWriter, r *http.Request) {
conn, err := upgrader.Upgrade(w, r, nil)
if err != nil {
log.Println("WebSocket upgrade error:", err)
return
}
remoteAddr := conn.RemoteAddr().String()
log.Printf("New WebSocket connection attempt from: %s", remoteAddr)

	// --- Чтение первого сообщения для идентификации ---
	var initData struct {
		Room     string `json:"room"`
		Username string `json:"username"`
		IsLeader bool   `json:"isLeader"`
	}
	conn.SetReadDeadline(time.Now().Add(10 * time.Second))
	err = conn.ReadJSON(&initData)
	conn.SetReadDeadline(time.Time{}) // Сброс таймаута

	if err != nil {
		log.Printf("Read init data error from %s: %v. Closing.", remoteAddr, err)
		conn.Close()
		return
	}
	if initData.Room == "" || initData.Username == "" {
		log.Printf("Invalid init data from %s: Room or Username is empty. Closing.", remoteAddr)
		conn.WriteJSON(map[string]interface{}{"type": "error", "data": "Room and Username cannot be empty"})
		conn.Close()
		return
	}

	log.Printf("User '%s' (isLeader: %v) attempting to join room '%s' from %s", initData.Username, initData.IsLeader, initData.Room, remoteAddr)

	// --- Присоединение пира к комнате ---
	peer, err := handlePeerJoin(initData.Room, initData.Username, initData.IsLeader, conn)
	if err != nil {
		log.Printf("Error handling peer join for %s: %v", initData.Username, err)
		// Сообщение об ошибке и закрытие соединения уже произошли в handlePeerJoin
		return
	}
	if peer == nil {
		log.Printf("Peer %s was not created. Connection closed by handlePeerJoin.", initData.Username)
		return
	}

	// Успешное добавление пира
	log.Printf("User '%s' successfully joined room '%s' as %s", peer.username, peer.room, map[bool]string{true: "leader", false: "follower"}[peer.isLeader])
	logStatus()
	sendRoomInfo(peer.room) // Отправляем всем обновленную информацию

	// --- Цикл чтения сообщений от клиента ---
	for {
		msgType, msg, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure, websocket.CloseNormalClosure) {
				log.Printf("Unexpected WebSocket close error for %s: %v", peer.username, err)
			} else {
				log.Printf("WebSocket connection closed for %s (Reason: %v)", peer.username, err)
			}
			break // Выходим из цикла чтения
		}

		// Обрабатываем только текстовые сообщения (JSON)
		if msgType != websocket.TextMessage {
			continue
		}

		// Парсим JSON
		var data map[string]interface{}
		if err := json.Unmarshal(msg, &data); err != nil {
			log.Printf("JSON unmarshal error from %s: %v", peer.username, err)
			continue
		}

		dataType, _ := data["type"].(string)
		// log.Printf("Received '%s' from %s", dataType, peer.username) // Детальный лог типа сообщения

		// --- Логика пересылки сообщений ---
		mu.Lock() // Блокируем для безопасного доступа к rooms
		roomPeers := rooms[peer.room]
		var targetPeer *Peer = nil
		if roomPeers != nil {
			for _, p := range roomPeers {
				if p.username != peer.username { // Находим другого пира в комнате
					targetPeer = p
					break
				}
			}
		}
		mu.Unlock() // Разблокируем как можно скорее

		// Пересылаем только если есть кому (targetPeer != nil)
		if targetPeer == nil {
			// log.Printf("No target peer found for message type '%s' from %s in room %s. Ignoring.", dataType, peer.username, peer.room)
			continue // Если второго участника нет, игнорируем сообщения сигнализации
		}

		// Пересылка конкретных типов сообщений нужному адресату
		switch dataType {
		case "offer":
			// Оффер от Лидера -> Ведомому
			if peer.isLeader && !targetPeer.isLeader {
				log.Printf(">>> Forwarding Offer from %s to %s", peer.username, targetPeer.username)
				targetPeer.mu.Lock()
				conn := targetPeer.conn
				targetPeer.mu.Unlock()
				if conn != nil {
					// Используем WriteMessage для отправки исходного байтового среза msg
					if err := conn.WriteMessage(websocket.TextMessage, msg); err != nil {
						log.Printf("!!! Error forwarding offer to %s: %v", targetPeer.username, err)
					}
				}
			} else {
				log.Printf("WARN: Received 'offer' from unexpected peer %s (isLeader: %v) or target %s (isLeader: %v). Ignoring.",
					peer.username, peer.isLeader, targetPeer.username, targetPeer.isLeader)
			}

		case "answer":
			// Ответ от Ведомого -> Лидеру
			if !peer.isLeader && targetPeer.isLeader {
				log.Printf("<<< Forwarding Answer from %s to %s", peer.username, targetPeer.username)
				targetPeer.mu.Lock()
				conn := targetPeer.conn
				targetPeer.mu.Unlock()
				if conn != nil {
					// Используем WriteMessage для отправки исходного байтового среза msg
					if err := conn.WriteMessage(websocket.TextMessage, msg); err != nil {
						log.Printf("!!! Error forwarding answer to %s: %v", targetPeer.username, err)
					}
				}
			} else {
				log.Printf("WARN: Received 'answer' from unexpected peer %s (isLeader: %v) or target %s (isLeader: %v). Ignoring.",
					peer.username, peer.isLeader, targetPeer.username, targetPeer.isLeader)
			}

		case "ice_candidate":
			// ICE кандидаты -> Другому участнику
			// log.Printf("... Forwarding ICE candidate from %s to %s", peer.username, targetPeer.username) // Можно добавить для отладки
			targetPeer.mu.Lock()
			conn := targetPeer.conn
			targetPeer.mu.Unlock()
			if conn != nil {
				// Используем WriteMessage для отправки исходного байтового среза msg
				if err := conn.WriteMessage(websocket.TextMessage, msg); err != nil {
					// log.Printf("!!! Error forwarding ICE candidate to %s: %v", targetPeer.username, err) // Лог ошибки
				}
			}

		case "switch_camera":
			// Любые другие типы сообщений, которые нужно просто переслать
			log.Printf("Forwarding '%s' message from %s to %s", dataType, peer.username, targetPeer.username)
			targetPeer.mu.Lock()
			conn := targetPeer.conn
			targetPeer.mu.Unlock()
			if conn != nil {
				// Используем WriteMessage для отправки исходного байтового среза msg
				if err := conn.WriteMessage(websocket.TextMessage, msg); err != nil {
					log.Printf("Error forwarding '%s' to %s: %v", dataType, targetPeer.username, err)
				}
			}

		default:
			log.Printf("Ignoring message with unknown type '%s' from %s", dataType, peer.username)
		}
	}

	// --- Очистка после завершения цикла чтения ---
	log.Printf("Cleaning up resources for disconnected user '%s' in room '%s'", peer.username, peer.room)

	// Запускаем закрытие соединений в горутине
	go closePeerConnection(peer, "WebSocket connection closed")

	// Удаляем пира из комнаты и глобального списка
	mu.Lock()
	roomName := peer.room // Сохраняем имя комнаты
	if currentRoomPeers, roomExists := rooms[roomName]; roomExists {
		delete(currentRoomPeers, peer.username)
		log.Printf("Removed %s from room %s map.", peer.username, roomName)
		if len(currentRoomPeers) == 0 {
			delete(rooms, roomName)
			log.Printf("Room %s is now empty and deleted.", roomName)
			roomName = "" // Комнаты больше нет для отправки room_info
		}
	}
	delete(peers, remoteAddr)
	log.Printf("Removed %s (addr: %s) from global peers map.", peer.username, remoteAddr)
	mu.Unlock()

	logStatus() // Логируем статус после очистки

	// Отправляем обновленную информацию оставшимся в комнате
	if roomName != "" {
		sendRoomInfo(roomName)
	}
	log.Printf("Cleanup complete for connection %s.", remoteAddr)
} // Конец handleWebSocket


Android ведущий
D:\AndroidStudio\MyTest\app\src\main\java\com\example\mytest\WebRTCClient.kt
D:\AndroidStudio\MyTest\app\src\main\java\com\example\mytest\WebRTCService.kt
D:\AndroidStudio\MyTest\app\src\main\java\com\example\mytest\WebSocketClient.kt

// file: D:/AndroidStudio/MyTest/app/src/main/java/com/example/mytest/WebRTCClient.kt
package com.example.mytest

import android.content.Context
import android.os.Build
import android.util.Log
import org.webrtc.*

class WebRTCClient(
private val context: Context,
private val eglBase: EglBase,
private val localView: SurfaceViewRenderer,
private val remoteView: SurfaceViewRenderer,
private val observer: PeerConnection.Observer
) {
lateinit var peerConnectionFactory: PeerConnectionFactory
var peerConnection: PeerConnection
private var localVideoTrack: VideoTrack? = null
private var localAudioTrack: AudioTrack? = null
internal var videoCapturer: VideoCapturer? = null
private var surfaceTextureHelper: SurfaceTextureHelper? = null

    init {
        initializePeerConnectionFactory()
        peerConnection = createPeerConnection()
        createLocalTracks()
    }

    private fun initializePeerConnectionFactory() {
        val initializationOptions = PeerConnectionFactory.InitializationOptions.builder(context)
            .setEnableInternalTracer(true)
            .setFieldTrials("WebRTC-H264HighProfile/Enabled/")
            .createInitializationOptions()
        PeerConnectionFactory.initialize(initializationOptions)

        val videoEncoderFactory = DefaultVideoEncoderFactory(
            eglBase.eglBaseContext,
            true,  // enableIntelVp8Encoder
            false  // enableH264HighProfile
        )

        val videoDecoderFactory = DefaultVideoDecoderFactory(eglBase.eglBaseContext)

        peerConnectionFactory = PeerConnectionFactory.builder()
            .setVideoEncoderFactory(videoEncoderFactory)
            .setVideoDecoderFactory(videoDecoderFactory)
            .setOptions(PeerConnectionFactory.Options().apply {
                disableEncryption = false
                disableNetworkMonitor = false
            })
            .createPeerConnectionFactory()
    }


    // Функция для параметров H.264
    private fun getDefaultH264Params(isHighProfile: Boolean): Map<String, String> {
        return mapOf(
            "profile-level-id" to if (isHighProfile) "640c1f" else "42e01f",
            "level-asymmetry-allowed" to "1",
            "packetization-mode" to "1",
            // Устанавливаем низкий битрейт
            "max-bitrate" to "500000", // 500 kbps
            "start-bitrate" to "300000", // 300 kbps
            "min-bitrate" to "200000" // 200 kbps
        )
    }

    private fun createPeerConnection(): PeerConnection {
        val rtcConfig = PeerConnection.RTCConfiguration(listOf(
            PeerConnection.IceServer.builder("turn:ardua.site:3478")
                .setUsername("user1")
                .setPassword("pass1")
                .createIceServer(),
            PeerConnection.IceServer.builder("stun:ardua.site:3478").createIceServer()
        )).apply {
            sdpSemantics = PeerConnection.SdpSemantics.UNIFIED_PLAN
            continualGatheringPolicy = PeerConnection.ContinualGatheringPolicy.GATHER_CONTINUALLY
            iceTransportsType = PeerConnection.IceTransportsType.ALL
            bundlePolicy = PeerConnection.BundlePolicy.MAXBUNDLE
            rtcpMuxPolicy = PeerConnection.RtcpMuxPolicy.REQUIRE
            tcpCandidatePolicy = PeerConnection.TcpCandidatePolicy.ENABLED
            candidateNetworkPolicy = PeerConnection.CandidateNetworkPolicy.ALL
            keyType = PeerConnection.KeyType.ECDSA

            // Оптимизации для H264
            audioJitterBufferMaxPackets = 50
            audioJitterBufferFastAccelerate = true
            iceConnectionReceivingTimeout = 5000
        }

        return peerConnectionFactory.createPeerConnection(rtcConfig, observer) ?:
        throw IllegalStateException("Failed to create peer connection")
    }

    // В WebRTCClient.kt добавляем обработку переключения камеры
    internal fun switchCamera(useBackCamera: Boolean) {
        try {
            videoCapturer?.let { capturer ->
                if (capturer is CameraVideoCapturer) {
                    if (useBackCamera) {
                        // Switch to back camera
                        val cameraEnumerator = Camera2Enumerator(context)
                        val deviceNames = cameraEnumerator.deviceNames
                        deviceNames.find { !cameraEnumerator.isFrontFacing(it) }?.let { backCameraId ->
                            capturer.switchCamera(object : CameraVideoCapturer.CameraSwitchHandler {
                                override fun onCameraSwitchDone(isFrontCamera: Boolean) {
                                    Log.d("WebRTCClient", "Switched to back camera")
                                }

                                override fun onCameraSwitchError(error: String) {
                                    Log.e("WebRTCClient", "Error switching to back camera: $error")
                                }
                            })
                        }
                    } else {
                        // Switch to front camera
                        val cameraEnumerator = Camera2Enumerator(context)
                        val deviceNames = cameraEnumerator.deviceNames
                        deviceNames.find { cameraEnumerator.isFrontFacing(it) }?.let { frontCameraId ->
                            capturer.switchCamera(object : CameraVideoCapturer.CameraSwitchHandler {
                                override fun onCameraSwitchDone(isFrontCamera: Boolean) {
                                    Log.d("WebRTCClient", "Switched to front camera")
                                }

                                override fun onCameraSwitchError(error: String) {
                                    Log.e("WebRTCClient", "Error switching to front camera: $error")
                                }
                            })
                        }
                    }
                }
            }
        } catch (e: Exception) {
            Log.e("WebRTCClient", "Error switching camera", e)
        }
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
            mandatory.add(MediaConstraints.KeyValuePair("googHighpassFilter", "true"))
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

                // Старт с низким разрешением и FPS
                capturer.startCapture(640, 480, 15)

                localVideoTrack = peerConnectionFactory.createVideoTrack("ARDAMSv0", videoSource).apply {
                    addSink(localView)
                }
            } ?: run {
                Log.e("WebRTCClient", "Failed to create video capturer")
            }
        } catch (e: Exception) {
            Log.e("WebRTCClient", "Error creating video track", e)
        }
    }

    // Функция для установки битрейта
    fun setVideoEncoderBitrate(minBitrate: Int, currentBitrate: Int, maxBitrate: Int) {
        try {
            val sender = peerConnection.senders.find { it.track()?.kind() == "video" }
            sender?.let { videoSender ->
                val parameters = videoSender.parameters
                if (parameters.encodings.isNotEmpty()) {
                    parameters.encodings[0].minBitrateBps = minBitrate
                    parameters.encodings[0].maxBitrateBps = maxBitrate
                    parameters.encodings[0].bitratePriority = 1.0
                    videoSender.parameters = parameters
                }
            }
        } catch (e: Exception) {
            Log.e("WebRTCClient", "Error setting video bitrate", e)
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

    fun close() {
        try {
            videoCapturer?.let {
                it.stopCapture()
                it.dispose()
            }
            localVideoTrack?.let {
                it.removeSink(localView)
                it.dispose()
            }
            localAudioTrack?.dispose()
            surfaceTextureHelper?.dispose()
            peerConnection.close()
            peerConnection.dispose()
        } catch (e: Exception) {
            Log.e("WebRTCClient", "Error closing resources", e)
        }
    }
}

// file: D:/AndroidStudio/MyTest/app/src/main/java/com/example/mytest/WebRTCService.kt
// file: src/main/java/com/example/mytest/WebRTCService.kt
package com.example.mytest

import android.annotation.SuppressLint
import android.app.*
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.ServiceInfo
import android.net.ConnectivityManager
import android.net.Network
import android.os.*
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import org.json.JSONObject
import org.webrtc.*
import okhttp3.WebSocketListener
import java.util.concurrent.TimeUnit
import android.net.NetworkRequest
import androidx.work.Constraints
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType

class WebRTCService : Service() {

    companion object {
        var isRunning = false
            private set
        var currentRoomName = ""
        const val ACTION_SERVICE_STATE = "com.example.mytest.SERVICE_STATE"
        const val EXTRA_IS_RUNNING = "is_running"
    }

    private val stateReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            if (intent.action == ACTION_SERVICE_STATE) {
                val isRunning = intent.getBooleanExtra(EXTRA_IS_RUNNING, false)
                // Можно обновить UI активности, если она видима
            }
        }
    }

    private fun sendServiceStateUpdate() {
        val intent = Intent(ACTION_SERVICE_STATE).apply {
            putExtra(EXTRA_IS_RUNNING, isRunning)
        }
        sendBroadcast(intent)
    }

    private var isConnected = false // Флаг подключения
    private var isConnecting = false // Флаг процесса подключения

    private var shouldStop = false
    private var isUserStopped = false

    private val binder = LocalBinder()
    private lateinit var webSocketClient: WebSocketClient
    private lateinit var webRTCClient: WebRTCClient
    private lateinit var eglBase: EglBase

    private var reconnectAttempts = 0
    private val maxReconnectAttempts = 10
    private val reconnectDelay = 5000L // 5 секунд

    private lateinit var remoteView: SurfaceViewRenderer

    private var roomName = "room1" // Будет перезаписано при старте
    private val userName = Build.MODEL ?: "AndroidDevice"
    private val webSocketUrl = "wss://ardua.site/ws"

    private val notificationId = 1
    private val channelId = "webrtc_service_channel"
    private val handler = Handler(Looper.getMainLooper())

    private var isStateReceiverRegistered = false
    private var isConnectivityReceiverRegistered = false

    inner class LocalBinder : Binder() {
        fun getService(): WebRTCService = this@WebRTCService
    }

    override fun onBind(intent: Intent?): IBinder = binder

    private val connectivityReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            if (!isInitialized() || !webSocketClient.isConnected()) {
                reconnect()
            }
        }
    }

    private val webSocketListener = object : WebSocketListener() {
        override fun onMessage(webSocket: okhttp3.WebSocket, text: String) {
            try {
                val message = JSONObject(text)
                handleWebSocketMessage(message)
            } catch (e: Exception) {
                Log.e("WebRTCService", "WebSocket message parse error", e)
            }
        }

        override fun onOpen(webSocket: okhttp3.WebSocket, response: okhttp3.Response) {
            Log.d("WebRTCService", "WebSocket connected for room: $roomName")
            isConnected = true
            isConnecting = false
            reconnectAttempts = 0 // Сбрасываем счетчик попыток
            updateNotification("Connected to server")
            joinRoom()
        }

        override fun onClosed(webSocket: okhttp3.WebSocket, code: Int, reason: String) {
            Log.d("WebRTCService", "WebSocket disconnected, code: $code, reason: $reason")
            isConnected = false
            if (code != 1000) { // Если это не нормальное закрытие
                scheduleReconnect()
            }
        }

        override fun onFailure(webSocket: okhttp3.WebSocket, t: Throwable, response: okhttp3.Response?) {
            Log.e("WebRTCService", "WebSocket error: ${t.message}")
            isConnected = false
            isConnecting = false
            updateNotification("Error: ${t.message?.take(30)}...")
            scheduleReconnect()
        }
    }

    private val networkCallback = object : ConnectivityManager.NetworkCallback() {
        override fun onAvailable(network: Network) {
            super.onAvailable(network)
            handler.post { reconnect() }
        }

        override fun onLost(network: Network) {
            super.onLost(network)
            handler.post { updateNotification("Network lost") }
        }
    }

    private val healthCheckRunnable = object : Runnable {
        override fun run() {
            if (!isServiceActive()) {
                reconnect()
            }
            handler.postDelayed(this, 30000) // Проверка каждые 30 секунд
        }
    }

    // Добавляем в класс WebRTCService
    private val bandwidthEstimationRunnable = object : Runnable {
        override fun run() {
            if (isConnected) {
                adjustVideoQualityBasedOnStats()
            }
            handler.postDelayed(this, 10000) // Каждые 10 секунд
        }
    }

    private fun adjustVideoQualityBasedOnStats() {
        webRTCClient.peerConnection.getStats { statsReport ->
            try {
                var videoPacketsLost = 0L
                var videoPacketsSent = 0L
                var availableSendBandwidth = 0L

                statsReport.statsMap.values.forEach { stats ->
                    when {
                        stats.type == "outbound-rtp" && stats.id.contains("video") -> {
                            videoPacketsLost += stats.members["packetsLost"] as? Long ?: 0L
                            videoPacketsSent += stats.members["packetsSent"] as? Long ?: 1L
                        }
                        stats.type == "candidate-pair" && stats.members["state"] == "succeeded" -> {
                            availableSendBandwidth = stats.members["availableOutgoingBitrate"] as? Long ?: 0L
                        }
                    }
                }

                if (videoPacketsSent > 0) {
                    val lossRate = videoPacketsLost.toDouble() / videoPacketsSent.toDouble()
                    handler.post {
                        when {
                            lossRate > 0.1 -> reduceVideoQuality() // >10% потерь
                            lossRate < 0.05 && availableSendBandwidth > 700000 -> increaseVideoQuality() // <5% потерь и хорошая пропускная способность
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e("WebRTCService", "Error processing stats", e)
            }
        }
    }

    private fun reduceVideoQuality() {
        try {
            webRTCClient.videoCapturer?.let { capturer ->
                capturer.stopCapture()
                capturer.startCapture(480, 360, 15)
                webRTCClient.setVideoEncoderBitrate(150000, 200000, 300000)
                Log.d("WebRTCService", "Reduced video quality to 480x360@15fps, 200kbps")
            }
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error reducing video quality", e)
        }
    }

    private fun increaseVideoQuality() {
        try {
            webRTCClient.videoCapturer?.let { capturer ->
                capturer.stopCapture()
                capturer.startCapture(640, 480, 20)
                webRTCClient.setVideoEncoderBitrate(300000, 400000, 500000)
                Log.d("WebRTCService", "Increased video quality to 640x480@20fps, 400kbps")
            }
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error increasing video quality", e)
        }
    }

    @SuppressLint("UnspecifiedRegisterReceiverFlag")
    override fun onCreate() {
        super.onCreate()
        isRunning = true

        // Инициализация имени комнаты из статического поля
        roomName = currentRoomName

        val alarmManager = getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(this, WebRTCService::class.java).apply {
            action = "CHECK_CONNECTION"
        }
        val pendingIntent = PendingIntent.getService(
            this, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        handler.post(healthCheckRunnable)

        alarmManager.setInexactRepeating(
            AlarmManager.ELAPSED_REALTIME_WAKEUP,
            SystemClock.elapsedRealtime() + AlarmManager.INTERVAL_FIFTEEN_MINUTES,
            AlarmManager.INTERVAL_FIFTEEN_MINUTES,
            pendingIntent
        )

        Log.d("WebRTCService", "Service created with room: $roomName")
        sendServiceStateUpdate()
        handler.post(bandwidthEstimationRunnable)
        try {
            registerReceiver(connectivityReceiver, IntentFilter(ConnectivityManager.CONNECTIVITY_ACTION))
            isConnectivityReceiverRegistered = true
            registerReceiver(stateReceiver, IntentFilter(ACTION_SERVICE_STATE))
            isStateReceiverRegistered = true
            createNotificationChannel()
            startForegroundService()
            initializeWebRTC()
            connectWebSocket()
            registerNetworkCallback() // Добавлен вызов регистрации коллбэка сети
        } catch (e: Exception) {
            Log.e("WebRTCService", "Initialization failed", e)
            stopSelf()
        }
    }

    private fun registerNetworkCallback() {
        val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            cm.registerDefaultNetworkCallback(networkCallback)
        } else {
            val request = NetworkRequest.Builder().build()
            cm.registerNetworkCallback(request, networkCallback)
        }
    }

    private fun isServiceActive(): Boolean {
        return ::webSocketClient.isInitialized && webSocketClient.isConnected()
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
                Log.e("WebRTCService", "SecurityException: ${e.message}")
                startForeground(notificationId, notification)
            }
        } else {
            startForeground(notificationId, notification)
        }
    }

    private fun initializeWebRTC() {
        Log.d("WebRTCService", "Initializing WebRTC for room: $roomName")
        cleanupWebRTCResources()

        eglBase = EglBase.create()
        val localView = SurfaceViewRenderer(this).apply {
            init(eglBase.eglBaseContext, null)
            setMirror(true)
            setEnableHardwareScaler(true)
        }

        remoteView = SurfaceViewRenderer(this).apply {
            init(eglBase.eglBaseContext, null)
            setEnableHardwareScaler(true)
        }

        webRTCClient = WebRTCClient(
            context = this,
            eglBase = eglBase,
            localView = localView,
            remoteView = remoteView,
            observer = createPeerConnectionObserver()
        )
    }

    private fun createPeerConnectionObserver() = object : PeerConnection.Observer {
        override fun onIceCandidate(candidate: IceCandidate?) {
            candidate?.let {
                Log.d("WebRTCService", "Local ICE candidate: ${it.sdpMid}:${it.sdpMLineIndex} ${it.sdp}")
                sendIceCandidate(it)
            }
        }

        override fun onIceConnectionChange(state: PeerConnection.IceConnectionState?) {
            Log.d("WebRTCService", "ICE connection state: $state")
            when (state) {
                PeerConnection.IceConnectionState.CONNECTED ->
                    updateNotification("Connection established")
                PeerConnection.IceConnectionState.DISCONNECTED ->
                    updateNotification("Connection lost")
                else -> {}
            }
        }

        override fun onSignalingChange(p0: PeerConnection.SignalingState?) {}
        override fun onIceConnectionReceivingChange(p0: Boolean) {}
        override fun onIceGatheringChange(p0: PeerConnection.IceGatheringState?) {}
        override fun onIceCandidatesRemoved(p0: Array<out IceCandidate>?) {}
        override fun onAddStream(stream: MediaStream?) {
            stream?.videoTracks?.forEach { track ->
                Log.d("WebRTCService", "Adding remote video track from stream")
                track.addSink(remoteView)
            }
        }
        override fun onRemoveStream(p0: MediaStream?) {}
        override fun onDataChannel(p0: DataChannel?) {}
        override fun onRenegotiationNeeded() {}
        override fun onAddTrack(p0: RtpReceiver?, p1: Array<out MediaStream>?) {}
        override fun onTrack(transceiver: RtpTransceiver?) {
            transceiver?.receiver?.track()?.let { track ->
                handler.post {
                    when (track.kind()) {
                        "video" -> {
                            Log.d("WebRTCService", "Video track received")
                            (track as VideoTrack).addSink(remoteView)
                        }
                        "audio" -> {
                            Log.d("WebRTCService", "Audio track received")
                        }
                    }
                }
            }
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
            Log.e("WebRTCService", "Error cleaning WebRTC resources", e)
        }
    }

    private fun connectWebSocket() {
        if (isConnected || isConnecting) {
            Log.d("WebRTCService", "Already connected or connecting, skipping")
            return
        }

        isConnecting = true
        webSocketClient = WebSocketClient(webSocketListener)
        webSocketClient.connect(webSocketUrl)
    }

    private fun scheduleReconnect() {
        if (isUserStopped) {
            Log.d("WebRTCService", "Service stopped by user, not reconnecting")
            return
        }

        handler.removeCallbacksAndMessages(null)

        reconnectAttempts++
        val delay = when {
            reconnectAttempts < 5 -> 5000L
            reconnectAttempts < 10 -> 15000L
            else -> 60000L
        }

        Log.d("WebRTCService", "Scheduling reconnect in ${delay/1000} seconds (attempt $reconnectAttempts)")
        updateNotification("Reconnecting in ${delay/1000}s...")

        handler.postDelayed({
            if (!isConnected && !isConnecting) {
                Log.d("WebRTCService", "Executing reconnect attempt $reconnectAttempts")
                reconnect()
            } else {
                Log.d("WebRTCService", "Already connected or connecting, skipping scheduled reconnect")
            }
        }, delay)
    }

    private fun reconnect() {
        if (isConnected || isConnecting) {
            Log.d("WebRTCService", "Already connected or connecting, skipping manual reconnect")
            return
        }

        handler.post {
            try {
                Log.d("WebRTCService", "Starting reconnect process")

                // Получаем последнее сохраненное имя комнаты
                val sharedPrefs = getSharedPreferences("WebRTCPrefs", Context.MODE_PRIVATE)
                val lastRoomName = sharedPrefs.getString("last_used_room", "")

                // Если имя комнаты пустое, используем дефолтное значение
                roomName = if (lastRoomName.isNullOrEmpty()) {
                    "default_room_${System.currentTimeMillis()}"
                } else {
                    lastRoomName
                }

                // Обновляем текущее имя комнаты
                currentRoomName = roomName
                Log.d("WebRTCService", "Reconnecting to room: $roomName")

                // Очищаем предыдущие соединения
                if (::webSocketClient.isInitialized) {
                    webSocketClient.disconnect()
                }

                // Инициализируем заново
                initializeWebRTC()
                connectWebSocket()

            } catch (e: Exception) {
                Log.e("WebRTCService", "Reconnection error", e)
                isConnecting = false
                scheduleReconnect()
            }
        }
    }

    private fun joinRoom() {
        try {
            val message = JSONObject().apply {
                put("action", "join")
                put("room", roomName)
                put("username", userName)
                put("isLeader", true)
            }
            webSocketClient.send(message.toString())
            Log.d("WebRTCService", "Sent join request for room: $roomName")
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error joining room: $roomName", e)
        }
    }

    private fun handleBandwidthEstimation(estimation: Long) {
        handler.post {
            try {
                // Адаптируем качество видео в зависимости от доступной полосы
                val width = when {
                    estimation > 1500000 -> 1280 // 1.5 Mbps+
                    estimation > 500000 -> 854  // 0.5-1.5 Mbps
                    else -> 640                // <0.5 Mbps
                }

                val height = (width * 9 / 16)

                webRTCClient.videoCapturer?.let { capturer ->
                    capturer.stopCapture()
                    capturer.startCapture(width, height, 24)
                    Log.d("WebRTCService", "Adjusted video to ${width}x${height} @24fps")
                }
            } catch (e: Exception) {
                Log.e("WebRTCService", "Error adjusting video quality", e)
            }
        }
    }

    private fun handleWebSocketMessage(message: JSONObject) {
        Log.d("WebRTCService", "Received: $message")

        try {
            when (message.optString("type")) {
                "create_offer_for_new_follower" -> {
                    Log.d("WebRTCService", "Received request to create offer for new follower")
                    handler.post {
                        createOffer() // Создаем оффер по запросу сервера
                    }
                }
                "bandwidth_estimation" -> {
                    val estimation = message.optLong("estimation", 1000000)
                    handleBandwidthEstimation(estimation)
                }
                "offer" -> handleOffer(message)
                "answer" -> handleAnswer(message)
                "ice_candidate" -> handleIceCandidate(message)
                "room_info" -> {}
                "switch_camera" -> {
                    // Обрабатываем команду переключения камеры
                    val useBackCamera = message.optBoolean("useBackCamera", false)
                    Log.d("WebRTCService", "Received switch camera command: useBackCamera=$useBackCamera")
                    handler.post {
                        webRTCClient.switchCamera(useBackCamera)
                        // Отправляем подтверждение
                        sendCameraSwitchAck(useBackCamera)
                    }
                }
                else -> Log.w("WebRTCService", "Unknown message type")
            }
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error handling message", e)
        }
    }

    private fun createOffer() {
        try {
            val constraints = MediaConstraints().apply {
                mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveAudio", "true"))
                mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveVideo", "true"))
                // Принудительно указываем H264
                mandatory.add(MediaConstraints.KeyValuePair("googCodecPreferences", "{\"video\":[\"H264\"]}"))
            }

            webRTCClient.peerConnection.createOffer(object : SdpObserver {
                override fun onCreateSuccess(desc: SessionDescription) {
                    // Модифицируем SDP для H264
                    val modifiedSdp = desc.description.replace(
                        "a=fmtp:126",
                        "a=fmtp:126 profile-level-id=42e01f;level-asymmetry-allowed=1;packetization-mode=1"
                    )
                    val modifiedDesc = SessionDescription(desc.type, modifiedSdp)

                    webRTCClient.peerConnection.setLocalDescription(object : SdpObserver {
                        override fun onSetSuccess() {
                            sendSessionDescription(modifiedDesc)
                        }
                        override fun onSetFailure(error: String) {
                            Log.e("WebRTCService", "Error setting local description: $error")
                        }
                        override fun onCreateSuccess(p0: SessionDescription?) {}
                        override fun onCreateFailure(error: String) {}
                    }, modifiedDesc)
                }
                override fun onCreateFailure(error: String) {
                    Log.e("WebRTCService", "Error creating offer: $error")
                }
                override fun onSetSuccess() {}
                override fun onSetFailure(error: String) {}
            }, constraints)
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error creating offer", e)
        }
    }

    // Метод для отправки подтверждения переключения камеры
    private fun sendCameraSwitchAck(useBackCamera: Boolean) {
        try {
            val message = JSONObject().apply {
                put("type", "switch_camera_ack")
                put("useBackCamera", useBackCamera)
                put("success", true)
                put("room", roomName)
                put("username", userName)
            }
            webSocketClient.send(message.toString())
            Log.d("WebRTCService", "Sent camera switch ack")
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error sending camera switch ack", e)
        }
    }

    private fun handleOffer(offer: JSONObject) {
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
                    Log.e("WebRTCService", "Error setting remote description: $error")
                }
                override fun onCreateSuccess(p0: SessionDescription?) {}
                override fun onCreateFailure(error: String) {}
            }, sessionDescription)
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error handling offer", e)
        }
    }

    private fun createAnswer(constraints: MediaConstraints) {
        try {
            webRTCClient.peerConnection.createAnswer(object : SdpObserver {
                override fun onCreateSuccess(desc: SessionDescription) {
                    Log.d("WebRTCService", "Created answer: ${desc.description}")
                    webRTCClient.peerConnection.setLocalDescription(object : SdpObserver {
                        override fun onSetSuccess() {
                            sendSessionDescription(desc)
                        }
                        override fun onSetFailure(error: String) {
                            Log.e("WebRTCService", "Error setting local description: $error")
                        }
                        override fun onCreateSuccess(p0: SessionDescription?) {}
                        override fun onCreateFailure(error: String) {}
                    }, desc)
                }
                override fun onCreateFailure(error: String) {
                    Log.e("WebRTCService", "Error creating answer: $error")
                }
                override fun onSetSuccess() {}
                override fun onSetFailure(error: String) {}
            }, constraints)
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error creating answer", e)
        }
    }

    private fun sendSessionDescription(desc: SessionDescription) {
        Log.d("WebRTCService", "Sending SDP: ${desc.type} \n${desc.description}")
        try {
            val message = JSONObject().apply {
                put("type", desc.type.canonicalForm())
                put("sdp", JSONObject().apply {
                    put("type", desc.type.canonicalForm())
                    put("sdp", desc.description)
                })
                put("room", roomName)
                put("username", userName)
                put("target", "browser")
            }
            webSocketClient.send(message.toString())
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error sending SDP", e)
        }
    }

    private fun handleAnswer(answer: JSONObject) {
        try {
            val sdp = answer.getJSONObject("sdp")
            val sessionDescription = SessionDescription(
                SessionDescription.Type.fromCanonicalForm(sdp.getString("type")),
                sdp.getString("sdp")
            )

            webRTCClient.peerConnection.setRemoteDescription(object : SdpObserver {
                override fun onSetSuccess() {
                    Log.d("WebRTCService", "Answer accepted, connection should be established")
                }
                override fun onSetFailure(error: String) {
                    Log.e("WebRTCService", "Error setting answer: $error")
                    // При ошибке запрашиваем новый оффер
                    handler.postDelayed({ createOffer() }, 2000)
                }
                override fun onCreateSuccess(p0: SessionDescription?) {}
                override fun onCreateFailure(error: String) {}
            }, sessionDescription)
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error handling answer", e)
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
            Log.e("WebRTCService", "Error handling ICE candidate", e)
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
            Log.e("WebRTCService", "Error sending ICE candidate", e)
        }
    }

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

    private fun createNotification(): Notification {
        return NotificationCompat.Builder(this, channelId)
            .setContentTitle("WebRTC Service")
            .setContentText("Active in room: $roomName")
            .setSmallIcon(R.drawable.ic_notification)
            .setPriority(NotificationCompat.PRIORITY_HIGH) // Измените на HIGH
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
        if (!isUserStopped) {
            if (isConnectivityReceiverRegistered) {
                unregisterReceiver(connectivityReceiver)
            }
            if (isStateReceiverRegistered) {
                unregisterReceiver(stateReceiver)
            }
            // Автоматический перезапуск только если не было явной остановки
            scheduleRestartWithWorkManager()
        }
        super.onDestroy()
    }

    private fun cleanupAllResources() {
        handler.removeCallbacksAndMessages(null)
        cleanupWebRTCResources()
        if (::webSocketClient.isInitialized) {
            webSocketClient.disconnect()
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            "STOP" -> {
                isUserStopped = true
                isConnected = false
                isConnecting = false
                stopEverything()
                return START_NOT_STICKY
            }
            else -> {
                isUserStopped = false

                // Получаем последнее сохраненное имя комнаты
                val sharedPrefs = getSharedPreferences("WebRTCPrefs", Context.MODE_PRIVATE)
                val lastRoomName = sharedPrefs.getString("last_used_room", "")

                roomName = if (lastRoomName.isNullOrEmpty()) {
                    "default_room_${System.currentTimeMillis()}"
                } else {
                    lastRoomName
                }

                currentRoomName = roomName

                Log.d("WebRTCService", "Starting service with room: $roomName")

                if (!isConnected && !isConnecting) {
                    initializeWebRTC()
                    connectWebSocket()
                }

                isRunning = true
                return START_STICKY
            }
        }
    }

    private fun stopEverything() {
        isRunning = false
        isConnected = false
        isConnecting = false

        try {
            handler.removeCallbacksAndMessages(null)
            unregisterReceiver(connectivityReceiver)
            val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
            cm?.unregisterNetworkCallback(networkCallback)
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error during cleanup", e)
        }

        cleanupAllResources()

        if (isUserStopped) {
            stopSelf()
            android.os.Process.killProcess(android.os.Process.myPid())
        }
    }

    private fun scheduleRestartWithWorkManager() {
        // Убедитесь, что используете ApplicationContext
        val workRequest = OneTimeWorkRequestBuilder<WebRTCWorker>()
            .setInitialDelay(1, TimeUnit.MINUTES)
            .setConstraints(
                Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED) // Только при наличии сети
                    .build()
            )
            .build()

        WorkManager.getInstance(applicationContext).enqueueUniqueWork(
            "WebRTCServiceRestart",
            ExistingWorkPolicy.REPLACE,
            workRequest
        )
    }

    fun isInitialized(): Boolean {
        return ::webSocketClient.isInitialized &&
                ::webRTCClient.isInitialized &&
                ::eglBase.isInitialized
    }
}

// file: D:/AndroidStudio/MyTest/app/src/main/java/com/example/mytest/WebSocketClient.kt
package com.example.mytest

import android.annotation.SuppressLint
import android.util.Log
import okhttp3.*
import org.json.JSONObject
import java.security.cert.X509Certificate
import java.util.concurrent.TimeUnit
import javax.net.ssl.*

class WebSocketClient(private val listener: okhttp3.WebSocketListener) {
private var webSocket: WebSocket? = null
private var currentUrl: String = ""
private val client = OkHttpClient.Builder()
.pingInterval(20, TimeUnit.SECONDS)
.pingInterval(20, TimeUnit.SECONDS)
.hostnameVerifier { _, _ -> true }
.sslSocketFactory(getUnsafeSSLSocketFactory(), getTrustAllCerts()[0] as X509TrustManager)
.build()

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
                override fun checkClientTrusted(chain: Array<X509Certificate>, authType: String) {
                }

                @SuppressLint("TrustAllX509TrustManager")
                override fun checkServerTrusted(chain: Array<X509Certificate>, authType: String) {
                }

                override fun getAcceptedIssuers(): Array<X509Certificate> = arrayOf()
            })
    }
    fun isConnected(): Boolean {
        return webSocket != null
    }

    fun connect(url: String) {
        currentUrl = url
        val request = Request.Builder()
            .url(url)
            .build()

        webSocket = client.newWebSocket(request, listener)
    }

    fun reconnect() {
        disconnect()
        connect(currentUrl)
    }

    fun send(message: String) {
        webSocket?.send(message)
    }

    fun disconnect() {
        webSocket?.close(1000, "Normal closure")
        client.dispatcher.executorService.shutdown()
    }
}


использую только эти библиотеки
// WebRTC
implementation("io.github.webrtc-sdk:android:125.6422.07")
// WebSocket
implementation("com.squareup.okhttp3:okhttp:4.11.0")

Хорошо, я понял идею. Вы хотите придерживаться структуры первого варианта кода (где лидер постоянно находится в комнате), но добавить механизм, который заставляет лидера "перезайти" в комнату (создать новое WebRTC соединение), как только подключается новый ведомый. Это может помочь решить проблемы с "зависшим" видео, так как каждая сессия для ведомого будет начинаться с абсолютно чистого WebRTC состояния у лидера.

Этот подход действительно проще, чем логика с "ожидающим" лидером, и может быть эффективным решением проблемы.

Давайте возьмем ваш первый предоставленный код за основу и внедрим эту логику "перезахода" лидера.

Изменения:

handlePeerJoin: Когда подключается ведомый (!isLeader) к комнате, где уже есть лидер:
Логика замены старого ведомого (если он был) остается.
Создается Peer и PeerConnection для нового ведомого.
Вместо того, чтобы просто просить лидера отправить оффер, сервер отправляет лидеру новую команду, например, {"type": "rejoin_and_offer", "room": roomID}.
Клиент Лидера (Android - требуется ваша доработка): Должен обработать команду rejoin_and_offer:
Закрыть текущий RTCPeerConnection.
Создать новый RTCPeerConnection.
Добавить медиа треки к новому соединению.
Создать новый offer.
Отправить этот offer серверу сообщением {"type": "offer", ...}.
handleWebSocket (Сервер):
При получении сообщения offer от лидера, сервер пересылает его ведомому в той же комнате.
При получении answer от ведомого, сервер пересылает его лидеру.
При получении ice_candidate, сервер пересылает его другому участнику комнаты.
Важно: Сервер не будет пересоздавать объект peer.pc для лидера на своей стороне. Мы предполагаем, что новый цикл offer/answer и обмен ICE кандидатами через тот же WebSocket будет достаточен для установки нового WebRTC соединения, инициированного клиентом лидера.


Пояснения к изменениям:

База: Код взят из вашего первого варианта, без lastActivity, без модификации SDP на сервере, без сложной логики ожидания лидера.
handlePeerJoin:
При подключении ведомого, если лидер уже есть, вместо create_offer_for_new_follower теперь отправляется команда {"type": "rejoin_and_offer", "room": roomID} клиенту лидера.
Остальная логика handlePeerJoin (проверки, создание PeerConnection для подключающегося, замена старого ведомого) осталась прежней.
handleWebSocket:
Цикл чтения и основная структура остались прежними.
Логика пересылки сообщений (offer, answer, ice_candidate) уточнена: она проверяет роли отправителя и получателя (как в исправленной версии ранее), чтобы гарантировать правильную маршрутизацию, и пересылает сообщение только если второй участник (targetPeer) найден в комнате.
Убрана любая логика, где сервер пытался сам создать или повторно отправить оффер (типа resend_offer). Вся инициатива по созданию оффера теперь лежит на клиенте лидера после получения команды rejoin_and_offer.
Клиент Лидера (Важно!): Вам необходимо доработать код вашего Android-клиента (лидера), чтобы он слушал и обрабатывал новое сообщение {"type": "rejoin_and_offer"} от сервера. При получении этого сообщения клиент должен выполнить шаги, описанные выше: закрыть старый RTCPeerConnection, создать новый, добавить треки, создать новый offer и отправить его на сервер.
Этот вариант сохраняет простоту управления комнатами из первого кода, но добавляет механизм принудительного обновления WebRTC-сессии со стороны лидера при каждом подключении ведомого, что, как вы надеетесь, решит проблему с задержками видео на мобильных браузерах.


### 
Пояснения к основным изменениям:

handleWebSocketMessage:

Удалена обработка сообщения "offer". Лидер не принимает офферы.
Добавлена обработка нового сообщения "rejoin_and_offer".
Извлекается followerUsername ( предполагается, что сервер его присылает!).
Вызывается новый метод resetAndInitiateOffer(followerUsername).
Обработка "answer" теперь проверяет, совпадает ли caller с currentFollowerUsername.
Обработка "ice_candidate" теперь добавляет кандидат, только если currentFollowerUsername не null (т.е. мы ожидаем кандидата от конкретного ведомого).
resetAndInitiateOffer(targetUsername: String?):

Новый метод.
Проверяет targetUsername.
Выполняет полный сброс WebRTC через cleanupWebRTCResources() и initializeWebRTC(). Это гарантирует абсолютно чистое состояние PeerConnection и пере-добавление локальных треков.
Сохраняет targetUsername в currentFollowerUsername.
Вызывает createOffer(targetUsername) после небольшой задержки.
createOffer(targetUsername: String):

Теперь принимает targetUsername в качестве параметра.
Удалена ручная модификация SDP для H264 (это ненадежно, лучше настраивать кодеки через PeerConnectionFactory или setCodecPreferences, если необходимо). Оставлена стандартная генерация оффера.
В onCreateSuccess вызывает setLocalDescription(offerDescription, targetUsername).
setLocalDescription(desc: SessionDescription, targetUsername: String):

Новый метод.
Принимает targetUsername.
Устанавливает локальное описание.
В onSetSuccess вызывает sendSdpOffer(desc, targetUsername).
sendSdpOffer(desc: SessionDescription, targetUsername: String):

Новый метод (заменяет старый sendSessionDescription для оффера).
Принимает targetUsername.
Формирует JSON с полем "target": targetUsername и отправляет на сервер.
Удалены handleOffer и createAnswer: Эти методы больше не нужны Лидеру.

handleAnswer:

Добавлена проверка if (caller == currentFollowerUsername).
Удален вызов createOffer() при ошибке onSetFailure. Теперь просто логируется ошибка и закрывается соединение (webRTCClient.closePeerConnection).
sendIceCandidate(candidate: IceCandidate, targetUsername: String?):

Теперь принимает targetUsername.
Отправляет кандидата только если targetUsername не null и совпадает с currentFollowerUsername.
Включает "target": targetUsername в JSON.
createPeerConnectionObserver:

onIceCandidate теперь вызывает sendIceCandidate(it, currentFollowerUsername).
onConnectionChange при состояниях FAILED, CLOSED, DISCONNECTED теперь сбрасывает currentFollowerUsername.
Адаптация качества (bandwidthEstimationRunnable и связанные методы):

Логика адаптации качества немного улучшена (использует availableOutgoingBitrate, проверяет количество пакетов).
ВАЖНО: Для работы этой логики вам нужно добавить методы getCurrentMaxBitrate(), getCurrentCaptureWidth() и changeCaptureFormat(width, height, fps) в ваш класс WebRTCClient.kt.
Сброс PeerConnection: Вместо добавления recreatePeerConnection() в WebRTCClient, я использовал существующую связку cleanupWebRTCResources() + initializeWebRTC() в resetAndInitiateOffer, так как это проще и гарантирует полный сброс. Если вы предпочитаете более гранулярный контроль, можете добавить recreatePeerConnection в WebRTCClient.

Напоминание: Убедитесь, что ваш сервер Go действительно отправляет followerUsername в сообщении rejoin_and_offer. Без этого Android не будет знать, кому отправлять оффер.

дай аобсолютно полные кода без сокращений  WebRTCClient и WebRTCService , комментарии на русском