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
URLs: []string{"stun:ardua.site:3478"},
},
{
URLs:       []string{"turn:ardua.site:3478"},
Username:   "user1",
Credential: "pass1",
},
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
mu.Lock()
defer mu.Unlock()

    // Создаем комнату, если ее нет
    if _, exists := rooms[room]; !exists {
        if !isLeader {
            conn.WriteJSON(map[string]interface{}{"type": "error", "data": "Room does not exist. Leader must join first."})
            conn.Close()
            return nil, errors.New("room does not exist for follower")
        }
        rooms[room] = make(map[string]*Peer)
    }

    roomPeers := rooms[room]

    // Логика замены ведомого
    if !isLeader {
        // Отключаем предыдущего ведомого, если он есть
        var existingFollower *Peer
        for _, p := range roomPeers {
            if !p.isLeader {
                existingFollower = p
                break
            }
        }

        if existingFollower != nil {
            log.Printf("Replacing old follower %s with new follower %s", existingFollower.username, username)

            // Отправляем команду на отключение старому ведомому
            existingFollower.mu.Lock()
            if existingFollower.conn != nil {
                existingFollower.conn.WriteJSON(map[string]interface{}{
                    "type": "force_disconnect",
                    "data": "You have been replaced by another viewer",
                })
            }
            existingFollower.mu.Unlock()

            // Удаляем старого ведомого
            delete(roomPeers, existingFollower.username)
            for addr, p := range peers {
                if p == existingFollower {
                    delete(peers, addr)
                    break
                }
            }
        }

        // Находим лидера и отправляем ему команду на переподключение
        var leaderPeer *Peer
        for _, p := range roomPeers {
            if p.isLeader {
                leaderPeer = p
                break
            }
        }

        if leaderPeer != nil {
            log.Printf("Sending rejoin command to leader %s", leaderPeer.username)
            leaderPeer.mu.Lock()
            leaderConn := leaderPeer.conn
            leaderPeer.mu.Unlock()

            if leaderConn != nil {
                err := leaderConn.WriteJSON(map[string]interface{}{
                    "type": "rejoin_and_offer",
                    "room": room,
                })
                if err != nil {
                    log.Printf("Error sending rejoin command to leader: %v", err)
                }
            }
        }
    }

    // Остальная логика создания пира...
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

    // Настройка обработчиков ICE кандидатов и треков...
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

    // Добавляем пира в комнату
    rooms[room][username] = peer
    peers[conn.RemoteAddr().String()] = peer

    return peer, nil
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

почему происходит игноринг?
может потому что на клиенте
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
// Добавляем новый тип сообщения
force_disconnect?: boolean;
}

interface CustomRTCRtpCodecParameters extends RTCRtpCodecParameters {
parameters?: {
'level-asymmetry-allowed'?: number;
'packetization-mode'?: number;
'profile-level-id'?: string;
[key: string]: any;
};
}

export const useWebRTC = (
deviceIds: { video: string; audio: string },
username: string,
roomId: string
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
    const videoCheckTimeout = useRef<NodeJS.Timeout | null>(null);
    const retryAttempts = useRef(0);

    const [platform, setPlatform] = useState<'desktop' | 'ios' | 'android'>('desktop');


    useEffect(() => {
        const userAgent = navigator.userAgent;
        if (/iPad|iPhone|iPod/.test(userAgent)) {
            setPlatform('ios');
        } else if (/Android/i.test(userAgent)) {
            setPlatform('android');
        } else {
            setPlatform('desktop');
        }
    }, []);

    // Максимальное количество попыток переподключения
    const MAX_RETRIES = 10;
    const VIDEO_CHECK_TIMEOUT = 4000; // 4 секунд для проверки видео



    // 1. Улучшенная функция для получения параметров видео для Huawei
    const getVideoConstraints = () => {
        const isHuawei = /huawei/i.test(navigator.userAgent);
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
            /iPad|iPhone|iPod/.test(navigator.userAgent);

        // Специальные параметры для Huawei
        if (isHuawei) {
            return {
                width: { ideal: 480, max: 640 },
                height: { ideal: 360, max: 480 },
                frameRate: { ideal: 20, max: 25 },
                // Huawei лучше работает с этими параметрами
                facingMode: 'environment',
                resizeMode: 'crop-and-scale'
            };
        }

        // Базовые параметры для всех устройств
        const baseConstraints = {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 }
        };

        // Специфичные настройки для Huawei
        if (isHuawei) {
            return {
                ...baseConstraints,
                width: { ideal: 480 },
                height: { ideal: 360 },
                frameRate: { ideal: 20 },
                advanced: [{ width: { max: 480 } }]
            };
        }

        // Специфичные настройки для Safari
        if (isSafari) {
            return {
                ...baseConstraints,
                frameRate: { ideal: 25 }, // Чуть меньше FPS для стабильности
                advanced: [
                    { frameRate: { max: 25 } },
                    { width: { max: 640 }, height: { max: 480 } }
                ]
            };
        }

        return baseConstraints;
    };

// 2. Конфигурация видео-трансмиттера для Huawei
const configureVideoSender = (sender: RTCRtpSender) => {
const isHuawei = /huawei/i.test(navigator.userAgent);

        if (isHuawei && sender.track?.kind === 'video') {
            const parameters = sender.getParameters();

            if (!parameters.encodings) {
                parameters.encodings = [{}];
            }

            // Используем только стандартные параметры
            parameters.encodings[0] = {
                ...parameters.encodings[0],
                maxBitrate: 300000,    // 300 kbps
                scaleResolutionDownBy: 1.5,
                maxFramerate: 20,
                priority: 'low'
            };

            try {
                sender.setParameters(parameters);
            } catch (err) {
                console.error('Ошибка настройки параметров видео:', err);
            }
        }
    };

// 3. Специальная нормализация SDP для Huawei
const normalizeSdpForHuawei = (sdp: string): string => {
const isHuawei = /huawei/i.test(navigator.userAgent);

        if (!isHuawei) return sdp;

        return sdp
            // Приоритет H.264 baseline profile
            .replace(/a=rtpmap:(\d+) H264\/\d+/g,
                'a=rtpmap:$1 H264/90000\r\n' +
                'a=fmtp:$1 profile-level-id=42e01f;packetization-mode=1;level-asymmetry-allowed=1\r\n')
            // Уменьшаем размер GOP
            .replace(/a=fmtp:\d+/, '$&;sprop-parameter-sets=J0LgC5Q9QEQ=,KM4=;')
            // Оптимизации буферизации и битрейта
            .replace(/a=mid:video\r\n/g,
                'a=mid:video\r\n' +
                'b=AS:250\r\n' +  // Уменьшенный битрейт для Huawei
                'b=TIAS:250000\r\n' +
                'a=rtcp-fb:* ccm fir\r\n' +
                'a=rtcp-fb:* nack\r\n' +
                'a=rtcp-fb:* nack pli\r\n');
    };

// 4. Мониторинг производительности для Huawei
const startHuaweiPerformanceMonitor = () => {
const isHuawei = /huawei/i.test(navigator.userAgent);
if (!isHuawei) return () => {};


        const monitorInterval = setInterval(async () => {
            if (!pc.current || !isCallActive) return;

            try {
                const stats = await pc.current.getStats();
                let videoStats: any = null;
                let connectionStats: any = null;

                stats.forEach(report => {
                    if (report.type === 'outbound-rtp' && report.kind === 'video') {
                        videoStats = report;
                    }
                    if (report.type === 'candidate-pair' && report.selected) {
                        connectionStats = report;
                    }
                });

                if (videoStats && connectionStats) {
                    // Адаптация при высокой потере пакетов или задержке
                    if (videoStats.packetsLost > 5 ||
                        (connectionStats.currentRoundTripTime && connectionStats.currentRoundTripTime > 0.5)) {
                        console.log('Высокие потери или задержка, уменьшаем качество');
                        adjustVideoQuality('lower');
                    }
                }
            } catch (err) {
                console.error('Ошибка мониторинга:', err);
            }
        }, 3000); // Более частый мониторинг для Huawei

        return () => clearInterval(monitorInterval);
    };

// 5. Функция адаптации качества видео
const adjustVideoQuality = (direction: 'higher' | 'lower') => {
const senders = pc.current?.getSenders() || [];
const isHuawei = /huawei/i.test(navigator.userAgent);
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
/iPad|iPhone|iPod/.test(navigator.userAgent);

        senders.forEach(sender => {
            if (sender.track?.kind === 'video') {
                const parameters = sender.getParameters();

                if (!parameters.encodings || parameters.encodings.length === 0) {
                    parameters.encodings = [{}];
                }

                // Базовые параметры для всех устройств
                const baseEncoding: RTCRtpEncodingParameters = {
                    ...parameters.encodings[0],
                    active: true,
                };

                // Специфичные настройки для Huawei
                if (isHuawei) {
                    parameters.encodings[0] = {
                        ...baseEncoding,
                        maxBitrate: direction === 'higher' ? 300000 : 150000,
                        scaleResolutionDownBy: direction === 'higher' ? undefined : 1.5,
                        maxFramerate: direction === 'higher' ? 20 : 15,
                        priority: direction === 'higher' ? 'medium' : 'low',
                    };

                    // Безопасная установка параметров кодека для Huawei
                    if (parameters.codecs) {
                        parameters.codecs = parameters.codecs.map(codec => {
                            const customCodec = codec as CustomRTCRtpCodecParameters;
                            if (customCodec.mimeType === 'video/H264') {
                                return {
                                    ...customCodec,
                                    parameters: {
                                        ...(customCodec.parameters || {}),
                                        'level-asymmetry-allowed': 1,
                                        'packetization-mode': 1,
                                        'profile-level-id': '42e01f'
                                    }
                                };
                            }
                            return codec;
                        });
                    }
                }
                else if (isSafari) {
                    parameters.encodings[0] = {
                        ...baseEncoding,
                        maxBitrate: direction === 'higher' ? 600000 : 300000,
                        scaleResolutionDownBy: direction === 'higher' ? 1.0 : 1.3,
                        maxFramerate: direction === 'higher' ? 25 : 15,
                    };
                }
                else {
                    parameters.encodings[0] = {
                        ...baseEncoding,
                        maxBitrate: direction === 'higher' ? 800000 : 400000,
                        scaleResolutionDownBy: direction === 'higher' ? 1.0 : 1.5,
                        maxFramerate: direction === 'higher' ? 30 : 20,
                    };
                }

                try {
                    sender.setParameters(parameters).then(() => {
                        console.log(`Качество видео ${direction === 'higher' ? 'увеличено' : 'уменьшено'}`);
                    }).catch(err => {
                        console.error('Ошибка применения параметров:', err);
                    });
                } catch (err) {
                    console.error('Критическая ошибка изменения параметров:', err);
                }
            }
        });
    };

    const normalizeSdp = (sdp: string | undefined): string => {
        if (!sdp) return '';

        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
            /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isHuawei = /huawei/i.test(navigator.userAgent);

        let optimized = sdp;

        // Оптимизации только для Huawei
        if (isHuawei) {
            optimized = normalizeSdpForHuawei(optimized);
        }

        // Общие оптимизации для всех устройств
        optimized = optimized
            .replace(/a=mid:video\r\n/g, 'a=mid:video\r\nb=AS:800\r\nb=TIAS:800000\r\n')
            .replace(/a=rtpmap:(\d+) H264\/\d+/g, 'a=rtpmap:$1 H264/90000\r\na=fmtp:$1 profile-level-id=42e01f;level-asymmetry-allowed=1;packetization-mode=1')
            .replace(/a=rtpmap:\d+ rtx\/\d+\r\n/g, '')
            .replace(/a=fmtp:\d+ apt=\d+\r\n/g, '');

        // Дополнительные оптимизации для Safari
        if (isSafari) {
            optimized = optimized
                .replace(/a=rtcp-fb:\d+ transport-cc\r\n/g, '')
                .replace(/a=extmap:\d+ urn:ietf:params:rtp-hdrext:sdes:mid\r\n/g, '')
                .replace(/a=rtcp-fb:\d+ nack\r\n/g, '')
                .replace(/a=rtcp-fb:\d+ nack pli\r\n/g, '');
        }

        return optimized;
    };

// Функция определения Android
const isAndroid = (): boolean => {
return /Android/i.test(navigator.userAgent);
};

    const validateSdp = (sdp: string): boolean => {
        // Проверяем основные обязательные части SDP
        return sdp.includes('v=') &&
            sdp.includes('m=audio') &&
            sdp.includes('m=video') &&
            sdp.includes('a=rtpmap');
    };

    let cleanup = () => {
        console.log('Выполняется полная очистка ресурсов');

        // Очистка таймеров
        [connectionTimeout, statsInterval, videoCheckTimeout].forEach(timer => {
            if (timer.current) {
                clearTimeout(timer.current);
                timer.current = null;
            }
        });

        // Полная очистка PeerConnection
        if (pc.current) {
            console.log('Закрытие PeerConnection');
            // Отключаем все обработчики событий
            pc.current.onicecandidate = null;
            pc.current.ontrack = null;
            pc.current.onnegotiationneeded = null;
            pc.current.oniceconnectionstatechange = null;
            pc.current.onicegatheringstatechange = null;
            pc.current.onsignalingstatechange = null;
            pc.current.onconnectionstatechange = null;

            // Закрываем все трансцепторы
            pc.current.getTransceivers().forEach(transceiver => {
                try {
                    transceiver.stop();
                } catch (err) {
                    console.warn('Ошибка при остановке трансцептора:', err);
                }
            });

            // Закрываем соединение
            try {
                pc.current.close();
            } catch (err) {
                console.warn('Ошибка при закрытии PeerConnection:', err);
            }
            pc.current = null;
        }

        // Остановка и очистка медиапотоков
        [localStream, remoteStream].forEach(stream => {
            if (stream) {
                console.log(`Остановка ${stream === localStream ? 'локального' : 'удаленного'} потока`);
                stream.getTracks().forEach(track => {
                    try {
                        track.stop();
                        track.dispatchEvent(new Event('ended'));
                    } catch (err) {
                        console.warn('Ошибка при остановке трека:', err);
                    }
                });
            }
        });

        // Сброс состояний
        setLocalStream(null);
        setRemoteStream(null);
        pendingIceCandidates.current = [];
        isNegotiating.current = false;
        shouldCreateOffer.current = false;
        setIsCallActive(false);

        console.log('Очистка завершена');
    };


    const leaveRoom = () => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            try {
                ws.current.send(JSON.stringify({
                    type: 'leave',
                    room: roomId,
                    username
                }));
            } catch (e) {
                console.error('Error sending leave message:', e);
            }
        }
        cleanup();
        setUsers([]);
        setIsInRoom(false);
        ws.current?.close();
        ws.current = null;
        setRetryCount(0);
    };

    const startVideoCheckTimer = () => {
        // Очищаем предыдущий таймер, если он есть
        if (videoCheckTimeout.current) {
            clearTimeout(videoCheckTimeout.current);
        }

        // Устанавливаем новый таймер
        videoCheckTimeout.current = setTimeout(() => {
            if (!remoteStream || remoteStream.getVideoTracks().length === 0 ||
                !remoteStream.getVideoTracks()[0].readyState) {
                console.log('Удаленное видео не получено в течение .. секунд, перезапускаем соединение...');
                resetConnection();
            }
        }, VIDEO_CHECK_TIMEOUT);
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

                // Добавляем обработку switch_camera
                if (data.type === 'switch_camera_ack') {
                    console.log('Камера на Android успешно переключена');
                    // Можно показать уведомление пользователю
                }

                // Добавляем обработку reconnect_request
                if (data.type === 'reconnect_request') {
                    console.log('Server requested reconnect');
                    setTimeout(() => {
                        resetConnection();
                    }, 1000);
                    return;
                }

                if (data.type === 'force_disconnect') {
                    // Обработка принудительного отключения
                    console.log('Получена команда принудительного отключения');
                    setError('Вы были отключены, так как подключился другой зритель');

                    // Останавливаем все медиапотоки
                    if (remoteStream) {
                        remoteStream.getTracks().forEach(track => track.stop());
                    }

                    // Закрываем PeerConnection
                    if (pc.current) {
                        pc.current.close();
                        pc.current = null;
                    }
                    leaveRoom();
                    // Очищаем состояние
                    setRemoteStream(null);
                    setIsCallActive(false);
                    setIsInRoom(false);

                    return;
                }


                if (data.type === 'room_info') {
                    setUsers(data.data.users || []);
                }
                else if (data.type === 'error') {
                    setError(data.data);
                }
                if (data.type === 'offer') {
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

                            // Запускаем проверку получения видео
                            startVideoCheckTimer();

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
            // Создаем оффер с учетом платформы
            const offerOptions: RTCOfferOptions = {
                offerToReceiveAudio: true,
                offerToReceiveVideo: true,
                iceRestart: false,
                ...(platform === 'android' && {
                    voiceActivityDetection: false
                }),
                ...(platform === 'ios' && {
                    iceRestart: true
                })
            };

            const offer = await pc.current.createOffer(offerOptions);

            // Нормализуем SDP оффера
            const standardizedOffer = {
                ...offer,
                sdp: normalizeSdp(offer.sdp)
            };

            console.log('Normalized SDP:', standardizedOffer.sdp);

            // Валидация SDP перед установкой
            if (!validateSdp(standardizedOffer.sdp)) {
                throw new Error('Invalid SDP format after normalization');
            }

            await pc.current.setLocalDescription(standardizedOffer);

            ws.current.send(JSON.stringify({
                type: "offer",
                sdp: standardizedOffer,
                room: roomId,
                username
            }));

            setIsCallActive(true);
            startVideoCheckTimer();
        } catch (err) {
            console.error('Offer creation error:', err);
            setError(`Offer failed: ${err instanceof Error ? err.message : String(err)}`);
            resetConnection();
        }
    };

    // Функция определения Safari
    const isSafari = (): boolean => {
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
            /iPad|iPhone|iPod/.test(navigator.userAgent);
    };

    const initializeWebRTC = async () => {
        try {
            cleanup();

            const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
                /iPad|iPhone|iPod/.test(navigator.userAgent);
            const isHuawei = /huawei/i.test(navigator.userAgent);

            const config: RTCConfiguration = {
                iceServers: [
                    { urls: 'stun:ardua.site:3478' },
                    {
                        urls: 'turn:ardua.site:3478',
                        username: 'user1',
                        credential: 'pass1'
                    }
                ],
                iceTransportPolicy: 'all',
                bundlePolicy: 'max-bundle',
                rtcpMuxPolicy: 'require',
                iceCandidatePoolSize: 0,
                // Специфичные настройки для Huawei
                ...(isHuawei && {
                    iceTransportPolicy: 'all', // Только relay для Huawei
                    bundlePolicy: 'max-bundle',
                    rtcpMuxPolicy: 'require',
                    iceCandidatePoolSize: 1,
                    iceCheckInterval: 3000, // Более частые проверки
                    iceServers: [
                        { urls: 'stun:ardua.site:3478' },
                        {
                            urls: 'turn:ardua.site:3478',
                            username: 'user1',
                            credential: 'pass1'
                        }

                    ]
                }),
                // Специфичные настройки для Safari
                ...(isSafari && {
                    iceTransportPolicy: 'relay',
                    encodedInsertableStreams: false,
                    iceServers: [
                        {
                            urls: 'turn:ardua.site:3478',
                            username: 'user1',
                            credential: 'pass1'
                        }
                    ]
                })
            };

            pc.current = new RTCPeerConnection(config);

            pc.current.addEventListener('icecandidate', event => {
                if (event.candidate) {
                    console.log('Using candidate type:',
                        event.candidate.candidate.split(' ')[7]);
                }
            });

            // Особые обработчики для Safari
            if (isSafari) {
                // @ts-ignore - свойство для Safari
                pc.current.addEventListener('negotiationneeded', async () => {
                    if (shouldCreateOffer.current) {
                        await createAndSendOffer();
                    }
                });
            }
            if (isHuawei) {
                pc.current.oniceconnectionstatechange = () => {
                    if (!pc.current) return;

                    console.log('Huawei ICE состояние:', pc.current.iceConnectionState);

                    // Более агрессивное восстановление для Huawei
                    if (pc.current.iceConnectionState === 'disconnected' ||
                        pc.current.iceConnectionState === 'failed') {
                        console.log('Huawei: соединение прервано, переподключение...');
                        setTimeout(resetConnection, 1000);
                    }
                };
            }



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
                    ...getVideoConstraints()
                } : getVideoConstraints(),
                audio: deviceIds.audio ? {
                    deviceId: { exact: deviceIds.audio },
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } : true
            });

            // Применяем настройки для Huawei
            pc.current.getSenders().forEach(configureVideoSender);

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
                        if (shouldSendIceCandidate(event.candidate)) {
                            ws.current.send(JSON.stringify({
                                type: 'ice_candidate',
                                ice: event.candidate.toJSON(),
                                room: roomId,
                                username
                            }));
                        }
                    } catch (err) {
                        console.error('Ошибка отправки ICE кандидата:', err);
                    }
                }
            };

            const shouldSendIceCandidate = (candidate: RTCIceCandidate) => {

                const isHuawei = /huawei/i.test(navigator.userAgent);

                // Для Huawei отправляем только relay-кандидаты
                if (isHuawei) {
                    return candidate.candidate.includes('typ relay');
                }
                // Не отправляем пустые кандидаты
                if (!candidate.candidate || candidate.candidate.length === 0) return false;

                // Приоритет для relay-кандидатов
                if (candidate.candidate.includes('typ relay')) return true;

                // Игнорируем host-кандидаты после первого подключения
                if (retryAttempts.current > 0 && candidate.candidate.includes('typ host')) {
                    return false;
                }

                return true;
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

                                // Видео получено, очищаем таймер проверки
                                if (videoCheckTimeout.current) {
                                    clearTimeout(videoCheckTimeout.current);
                                    videoCheckTimeout.current = null;
                                }
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

                const isHuawei = /huawei/i.test(navigator.userAgent);

                if (pc.current.iceConnectionState === 'connected' && isHuawei) {
                    // Сохраняем функцию остановки для cleanup
                    const stopHuaweiMonitor = startHuaweiPerformanceMonitor();

                    // Автоматическая остановка при разрыве
                    pc.current.onconnectionstatechange = () => {
                        if (pc.current?.connectionState === 'disconnected') {
                            stopHuaweiMonitor();
                        }
                    };

                    // Также останавливаем при ручной очистке
                    const originalCleanup = cleanup;
                    cleanup = () => {
                        stopHuaweiMonitor();
                        originalCleanup();
                    };
                }

                if (isHuawei && pc.current.iceConnectionState === 'disconnected') {
                    // Более агрессивный перезапуск для Huawei
                    setTimeout(resetConnection, 1000);
                }

                console.log('Состояние ICE соединения:', pc.current.iceConnectionState);

                switch (pc.current.iceConnectionState) {
                    case 'failed':
                        console.log('Ошибка ICE, перезапуск...');
                        resetConnection();
                        break;

                    case 'disconnected':
                        console.log('Соединение прервано...');
                        setIsCallActive(false);
                        resetConnection();
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

    const adjustVideoQualityForSafari = (direction: 'higher' | 'lower') => {
        const senders = pc.current?.getSenders() || [];

        senders.forEach(sender => {
            if (sender.track?.kind === 'video') {
                const parameters = sender.getParameters();

                if (!parameters.encodings) return;

                parameters.encodings[0] = {
                    ...parameters.encodings[0],
                    maxBitrate: direction === 'higher' ? 800000 : 400000,
                    scaleResolutionDownBy: direction === 'higher' ? 1.0 : 1.5,
                    maxFramerate: direction === 'higher' ? 25 : 15
                };

                try {
                    sender.setParameters(parameters);
                } catch (err) {
                    console.error('Ошибка изменения параметров:', err);
                }
            }
        });
    };

    const startConnectionMonitoring = () => {
        if (statsInterval.current) {
            clearInterval(statsInterval.current);
        }

        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
            /iPad|iPhone|iPod/.test(navigator.userAgent);

        statsInterval.current = setInterval(async () => {
            if (!pc.current || !isCallActive) return;

            try {
                const stats = await pc.current.getStats();
                let hasActiveVideo = false;
                let packetsLost = 0;
                let totalPackets = 0;
                let videoJitter = 0;

                stats.forEach(report => {
                    if (report.type === 'inbound-rtp' && report.kind === 'video') {
                        if (report.bytesReceived > 0) hasActiveVideo = true;
                        if (report.packetsLost !== undefined) packetsLost += report.packetsLost;
                        if (report.packetsReceived !== undefined) totalPackets += report.packetsReceived;
                        if (report.jitter !== undefined) videoJitter = report.jitter;
                    }
                });

                // Общая проверка для всех устройств
                if (!hasActiveVideo && isCallActive) {
                    console.warn('Нет активного видеопотока, пытаемся восстановить...');
                    resetConnection();
                    return;
                }

                // Специфичные проверки для Safari
                if (isSafari) {
                    // Проверка на высокую задержку
                    if (videoJitter > 0.3) { // Jitter в секундах
                        console.log('Высокий jitter на Safari, уменьшаем битрейт');
                        adjustVideoQualityForSafari('lower');
                    }
                    // Проверка потери пакетов
                    else if (totalPackets > 0 && packetsLost / totalPackets > 0.05) { // >5% потерь
                        console.warn('Высокий уровень потерь пакетов на Safari, переподключение...');
                        resetConnection();
                        return;
                    }
                }
            } catch (err) {
                console.error('Ошибка получения статистики:', err);
            }
        }, 5000);

        return () => {
            if (statsInterval.current) {
                clearInterval(statsInterval.current);
            }
        };
    };

    const resetConnection = async () => {
        if (retryAttempts.current >= MAX_RETRIES) {
            setError('Не удалось восстановить соединение после нескольких попыток');
            leaveRoom();
            return;
        }

        // Увеличиваем таймаут с каждой попыткой
        const retryDelay = Math.min(2000 * (retryAttempts.current + 1), 10000);

        console.log(`Попытка переподключения #${retryAttempts.current + 1}, задержка: ${retryDelay}ms`);

        cleanup();
        retryAttempts.current += 1;
        setRetryCount(retryAttempts.current);

        setTimeout(async () => {
            try {
                await joinRoom(username);
                retryAttempts.current = 0;
            } catch (err) {
                console.error('Ошибка переподключения:', err);
                if (retryAttempts.current < MAX_RETRIES) {
                    resetConnection();
                }
            }
        }, retryDelay);
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

            // 3. Отправляем запрос на присоединение к комнате
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
                        } else if (data.type === 'error') {
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
                }, 10000);

                ws.current.addEventListener('message', onMessage);
                ws.current.send(JSON.stringify({
                    action: "join",
                    room: roomId,
                    username: uniqueUsername,
                    isLeader: false // Браузер всегда ведомый
                }));
            });

            // 4. Успешное подключение
            setIsInRoom(true);
            shouldCreateOffer.current = false; // Ведомый никогда не должен создавать оффер

            // 5. Создаем оффер, если мы первые в комнате
            if (users.length === 0) {
                await createAndSendOffer();
            }

            // 6. Запускаем таймер проверки видео
            startVideoCheckTimer();

        } catch (err) {
            console.error('Ошибка входа в комнату:', err);
            setError(`Ошибка входа в комнату: ${err instanceof Error ? err.message : String(err)}`);

            // Полная очистка при ошибке
            cleanup();
            if (ws.current) {
                ws.current.close();
                ws.current = null;
            }

            // Автоматическая повторная попытка
            if (retryAttempts.current < MAX_RETRIES) {
                setTimeout(() => {
                    joinRoom(uniqueUsername).catch(console.error);
                }, 2000 * (retryAttempts.current + 1));
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
        restartMediaDevices,
        ws: ws.current, // Возвращаем текущее соединение
    };
};
...(isSafari && {
iceTransportPolicy: 'relay',
encodedInsertableStreams: false,
iceServers: [
{
urls: 'turn:ardua.site:3478',
username: 'user1',
credential: 'pass1'
}
]
}) TURN предчительнее а на сервере STUN ? отвечай на русском

на Андройде тоже STUN
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
        Log.d("WebRTCService", "Initializing new WebRTC connection")

        // 1. Полная очистка предыдущих ресурсов
        cleanupWebRTCResources()

        // 2. Создание нового EglBase
        eglBase = EglBase.create()

        // 3. Инициализация нового клиента WebRTC
        val localView = SurfaceViewRenderer(this).apply {
            init(eglBase.eglBaseContext, null)
            setMirror(true)
        }

        remoteView = SurfaceViewRenderer(this).apply {
            init(eglBase.eglBaseContext, null)
        }

        webRTCClient = WebRTCClient(
            context = this,
            eglBase = eglBase,
            localView = localView,
            remoteView = remoteView,
            observer = createPeerConnectionObserver()
        )

        // 4. Установка начального битрейта
        webRTCClient.setVideoEncoderBitrate(300000, 400000, 500000)
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

            // Очищаем remoteView если нужно
            if (::remoteView.isInitialized) {
                remoteView.clearImage()
                remoteView.release()
            }

            Log.d("WebRTCService", "WebRTC resources cleaned up")
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
                "rejoin_and_offer" -> {
                    Log.d("WebRTCService", "Received rejoin command from server")
                    handler.post {
                        // 1. Очищаем текущее соединение
                        cleanupWebRTCResources()

                        // 2. Инициализируем новое соединение
                        initializeWebRTC()

                        // 3. Создаем новый оффер
                        createOffer()
                    }
                }
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

    // Модифицируем createOffer для принудительного создания нового оффера
    private fun createOffer() {
        try {
            // Убедимся, что у нас есть активное соединение
            if (!::webRTCClient.isInitialized || !isConnected) {
                Log.w("WebRTCService", "Cannot create offer - not initialized or connected")
                return
            }

            val constraints = MediaConstraints().apply {
                mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveAudio", "true"))
                mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveVideo", "true"))
                // Оптимизации для Huawei и других устройств
                mandatory.add(MediaConstraints.KeyValuePair("googCodecPreferences", "{\"video\":[\"H264\"]}"))
                mandatory.add(MediaConstraints.KeyValuePair("googCpuOveruseDetection", "true"))
            }

            webRTCClient.peerConnection.createOffer(object : SdpObserver {
                override fun onCreateSuccess(desc: SessionDescription) {
                    // Модифицируем SDP для лучшей совместимости
                    var modifiedSdp = desc.description
                        .replace("a=fmtp:126", "a=fmtp:126 profile-level-id=42e01f;level-asymmetry-allowed=1;packetization-mode=1")
                        .replace("a=mid:video", "a=mid:video\r\nb=AS:500\r\n")

                    val modifiedDesc = SessionDescription(desc.type, modifiedSdp)

                    webRTCClient.peerConnection.setLocalDescription(object : SdpObserver {
                        override fun onSetSuccess() {
                            Log.d("WebRTCService", "Successfully set local description")
                            sendSessionDescription(modifiedDesc)
                        }
                        override fun onSetFailure(error: String) {
                            Log.e("WebRTCService", "Error setting local description: $error")
                            // Повторяем попытку через 2 секунды
                            handler.postDelayed({ createOffer() }, 2000)
                        }
                        override fun onCreateSuccess(p0: SessionDescription?) {}
                        override fun onCreateFailure(error: String) {}
                    }, modifiedDesc)
                }

                override fun onCreateFailure(error: String) {
                    Log.e("WebRTCService", "Error creating offer: $error")
                    // Повторяем попытку через 2 секунды
                    handler.postDelayed({ createOffer() }, 2000)
                }

                override fun onSetSuccess() {}
                override fun onSetFailure(error: String) {}
            }, constraints)
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error in createOffer", e)
            // Повторяем попытку через 2 секунды
            handler.postDelayed({ createOffer() }, 2000)
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
а isSafari  на клиенте TURN
может по каким нибудь другим причинам?
