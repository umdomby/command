
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

a=ssrc:3661632311 cname:7c6899fMm7kfTLUU
2025/04/22 02:31:48 Video in SDP: true
2025/04/22 02:31:48 ICE from user_13: 0:0 candidate:2395925881 1 udp 2122260223 172.30.32.1 49907 typ host generation 0 ufrag 8E8Z network-id 1
2025/04/22 02:31:48 ICE from user_13: 0:0 candidate:1003763695 1 udp 2122194687 172.19.32.1 49908 typ host generation 0 ufrag 8E8Z network-id 2
2025/04/22 02:31:48 ICE from user_13: 0:0 candidate:426245894 1 udp 2122129151 192.168.1.151 49909 typ host generation 0 ufrag 8E8Z network-id 3
2025/04/22 02:31:48 ICE from user_13: 0:0 candidate:3634997324 1 udp 1685921535 213.184.249.66 49909 typ srflx raddr 192.168.1.151 rport 49909 generation 0 ufrag 8E8Z network-id 3
2025/04/22 02:31:48 ICE from user_13: 0:0 candidate:1885616621 1 tcp 1518280447 172.30.32.1 9 typ host tcptype active generation 0 ufrag 8E8Z network-id 1
2025/04/22 02:31:48 ICE from user_13: 0:0 candidate:3313427323 1 tcp 1518214911 172.19.32.1 9 typ host tcptype active generation 0 ufrag 8E8Z network-id 2
2025/04/22 02:31:48 ICE from user_13: 0:0 candidate:3888982930 1 tcp 1518149375 192.168.1.151 9 typ host tcptype active generation 0 ufrag 8E8Z network-id 3
2025/04/22 02:31:49 Pong from 172.30.32.1:53923
2025/04/22 02:31:54 Connection closed by user_13: websocket: close 1005 (no status)
2025/04/22 02:31:58 New connection from: 172.30.32.1:53980
2025/04/22 02:31:58 User 'user_13' joining room 'room1' as slave
2025/04/22 02:31:59 Ping from 172.30.32.1:53923
2025/04/22 02:32:02 Pong from 172.30.32.1:53923
2025/04/22 02:32:03 Ping error to user_13: websocket: close sent
2025/04/22 02:32:10 New connection from: 172.30.32.1:53993
2025/04/22 02:32:10 User 'user_13' joining room 'room1' as slave
2025/04/22 02:32:18 Pong from 172.30.32.1:53923
2025/04/22 02:32:18 Ping from 172.30.32.1:53923
2025/04/22 02:32:22 New connection from: 172.30.32.1:54001
2025/04/22 02:32:22 User 'user_13' joining room 'room1' as slave
2025/04/22 02:32:32 Pong from 172.30.32.1:53923
2025/04/22 02:32:35 New connection from: 172.30.32.1:54009
2025/04/22 02:32:35 User 'user_13' joining room 'room1' as slave
2025/04/22 02:32:38 Ping from 172.30.32.1:53923
2025/04/22 02:32:47 New connection from: 172.30.32.1:54020
2025/04/22 02:32:47 User 'user_13' joining room 'room1' as slave
2025/04/22 02:32:49 Pong from 172.30.32.1:53923
2025/04/22 02:32:59 Ping from 172.30.32.1:53923
2025/04/22 02:32:59 New connection from: 172.30.32.1:54028
2025/04/22 02:32:59 User 'user_13' joining room 'room1' as slave
2025/04/22 02:33:02 Pong from 172.30.32.1:53923

Android
D:\AndroidStudio\MyTest\app\src\main\java\com\example\mytest\WebRTCClient.kt
D:\AndroidStudio\MyTest\app\src\main\java\com\example\mytest\WebRTCService.kt
D:\AndroidStudio\MyTest\app\src\main\java\com\example\mytest\WebSocketClient.kt


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
            true,
            true
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

    private val roomName = "room1"
    private val userName = Build.MODEL ?: "AndroidDevice"
    private val webSocketUrl = "wss://ardua.site/ws"
    private val isLeader = true

    private val notificationId = 1
    private val channelId = "webrtc_service_channel"

    private val handler = Handler(Looper.getMainLooper())
    private val reconnectHandler = Handler(Looper.getMainLooper())
    private val pingHandler = Handler(Looper.getMainLooper())

    private var reconnectAttempts = 0
    private val maxReconnectAttempts = 10
    private val baseReconnectDelay = 5000L
    private val maxReconnectDelay = 30000L
    private var lastPongTime = 0L

    // Состояние подключения
    private var isOfferCreated = false
    private var isInRoom = false
    private var hasSlave = false
    private var isConnectionEstablished = false
    private var shouldReconnect = false

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
        startForeground(notificationId, createNotification())
        initializeWebRTC()
        connectWebSocket()
    }

    private fun isNetworkAvailable(): Boolean {
        val connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val activeNetwork: NetworkInfo? = connectivityManager.activeNetworkInfo
        return activeNetwork?.isConnectedOrConnecting == true
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

    private fun createNotification(text: String = "Active in room: $roomName"): Notification {
        return NotificationCompat.Builder(this, channelId)
            .setContentTitle("WebRTC Service")
            .setContentText(text)
            .setSmallIcon(R.drawable.ic_notification)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build()
    }

    private fun updateNotification(text: String) {
        (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
            .notify(notificationId, createNotification(text))
    }

    private fun initializeWebRTC() {
        Log.d(TAG, "Initializing WebRTC")
        cleanupWebRTCResources()

        eglBase = EglBase.create()
        webRTCClient = WebRTCClient(
            context = this,
            eglBase = eglBase,
            observer = createPeerConnectionObserver()
        )

        webRTCClient.setIceCandidateListener(object : WebRTCClient.IceCandidateListener {
            override fun onIceCandidate(candidate: IceCandidate) {
                sendIceCandidate(candidate)
            }
        })
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
                PeerConnection.IceConnectionState.DISCONNECTED -> {
                    updateNotification("Connection lost, reconnecting...")
                    handler.postDelayed({ checkAndReconnect() }, 2000)
                }
                PeerConnection.IceConnectionState.FAILED -> {
                    updateNotification("Connection failed, reconnecting...")
                    handler.postDelayed({ checkAndReconnect() }, 2000)
                }
                PeerConnection.IceConnectionState.CONNECTED -> {
                    updateNotification("Connection established")
                    reconnectAttempts = 0
                    isConnectionEstablished = true
                }
                PeerConnection.IceConnectionState.COMPLETED -> {
                    isConnectionEstablished = true
                }
                else -> {}
            }
        }

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

    private fun checkAndReconnect() {
        if (!isConnectionEstablished && !shouldReconnect) {
            shouldReconnect = true
            reconnect()
        }
    }

    private fun connectWebSocket() {
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
                createWebSocketConnection()
            } catch (e: Exception) {
                Log.e(TAG, "Error connecting to WebSocket", e)
                connectWebSocket()
            }
        }, delay)
    }

    private fun calculateReconnectDelay(): Long {
        return minOf(baseReconnectDelay * (1 shl (reconnectAttempts - 1)), maxReconnectDelay)
    }

    private fun createWebSocketConnection() {
        webSocketClient = WebSocketClient(object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                Log.d(TAG, "WebSocket connected")
                updateNotification("Connected to server")
                reconnectAttempts = 0
                isInRoom = false
                hasSlave = false
                isOfferCreated = false
                isConnectionEstablished = false
                shouldReconnect = false
                joinRoom()
                startPingPong()
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                try {
                    if (text == "pong") {
                        lastPongTime = System.currentTimeMillis()
                        return
                    }

                    val message = JSONObject(text)
                    when (message.optString("type")) {
                        "room_info" -> handleRoomInfo(message)
                        "error" -> {
                            val error = message.optString("data")
                            Log.e(TAG, "WebSocket error: $error")
                            if (error.contains("already has leader") || error.contains("Room is full")) {
                                handler.postDelayed({ reconnect() }, 1000)
                            }
                        }
                        else -> handleWebSocketMessage(message)
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "WebSocket message parse error", e)
                }
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                Log.d(TAG, "WebSocket disconnected: $reason")
                updateNotification("Disconnected from server")
                stopPingPong()
                if (code != 1000) {
                    connectWebSocket()
                }
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                Log.e(TAG, "WebSocket error: ${t.message}")
                updateNotification("Connection error")
                stopPingPong()
                connectWebSocket()
            }
        })

        webSocketClient.connect(webSocketUrl)
    }

    private fun startPingPong() {
        lastPongTime = System.currentTimeMillis()
        pingHandler.postDelayed(object : Runnable {
            override fun run() {
                if (System.currentTimeMillis() - lastPongTime > 30000) {
                    Log.w(TAG, "Ping timeout, reconnecting...")
                    reconnect()
                    return
                }

                if (isConnected()) {
                    webSocketClient.send("ping")
                }
                pingHandler.postDelayed(this, 15000)
            }
        }, 15000)
    }

    private fun stopPingPong() {
        pingHandler.removeCallbacksAndMessages(null)
    }

    private fun joinRoom() {
        try {
            val message = JSONObject().apply {
                put("action", "join")
                put("room", roomName)
                put("username", userName)
                put("isLeader", isLeader)
            }
            webSocketClient.send(message.toString())
        } catch (e: Exception) {
            Log.e(TAG, "Error joining room", e)
        }
    }

    private fun isConnected(): Boolean {
        return ::webSocketClient.isInitialized && webSocketClient.isConnected()
    }

    private fun canCreateOffer(): Boolean {
        return ::webRTCClient.isInitialized &&
                ::webSocketClient.isInitialized &&
                webSocketClient.isConnected() &&
                isLeader &&
                isInRoom &&
                !hasSlave &&
                !isOfferCreated
    }

    private fun handleWebSocketMessage(message: JSONObject) {
        Log.d(TAG, "Received: ${message.toString().take(200)}...")

        try {
            when (message.optString("type")) {
                "offer" -> handleOffer(message)
                "answer" -> handleAnswer(message)
                "ice_candidate" -> handleIceCandidate(message)
                "room_info" -> handleRoomInfo(message)
                "error" -> handleError(message)
                else -> Log.w(TAG, "Unknown message type")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error handling message", e)
        }
    }

    private fun handleOffer(offer: JSONObject) {
        // Ведущий не должен обрабатывать офферы
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
                        hasSlave = true
                        isConnectionEstablished = true
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
            hasSlave = data.optBoolean("hasSlave", false)
            val users = data.optJSONArray("users")?.let {
                (0 until it.length()).map { i -> it.getString(i) }
            } ?: emptyList()

            isInRoom = users.contains(userName)
            Log.d(TAG, "Room info: hasSlave=$hasSlave, users=$users, isInRoom=$isInRoom")

            if (isLeader && isInRoom) {
                if (users.size > 2) {
                    // Если в комнате больше 2 пользователей - переподключаемся
                    Log.w(TAG, "Room has too many users, reconnecting...")
                    reconnect()
                } else if (!hasSlave && !isOfferCreated) {
                    // Если нет ведомого и оффер еще не создан - создаем оффер
                    handler.postDelayed({
                        if (canCreateOffer()) {
                            createAndSendOffer()
                        }
                    }, 1000)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error handling room info", e)
        }
    }

    private fun handleError(message: JSONObject) {
        val error = message.optString("data", "Unknown error")
        Log.e(TAG, "Server error: $error")

        if (error.contains("already has leader") ||
            error.contains("Room is full") ||
            error.contains("Room already has")) {
            reconnect()
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

            Log.d(TAG, "Creating offer...")
            webRTCClient.peerConnection.createOffer(object : SdpObserver {
                override fun onCreateSuccess(desc: SessionDescription) {
                    Log.d(TAG, "Offer created successfully")
                    isOfferCreated = true
                    webRTCClient.peerConnection.setLocalDescription(object : SdpObserver {
                        override fun onSetSuccess() {
                            Log.d(TAG, "Local description set successfully")
                            sendSessionDescription(desc)
                        }
                        override fun onSetFailure(error: String) {
                            Log.e(TAG, "Error setting local description: $error")
                            isOfferCreated = false
                        }
                        override fun onCreateSuccess(desc: SessionDescription?) {}
                        override fun onCreateFailure(error: String) {}
                    }, desc)
                }
                override fun onCreateFailure(error: String) {
                    Log.e(TAG, "Error creating offer: $error")
                    isOfferCreated = false
                }
                override fun onSetSuccess() {}
                override fun onSetFailure(error: String) {}
            }, constraints)
        } catch (e: Exception) {
            Log.e(TAG, "Error in createAndSendOffer", e)
            isOfferCreated = false
        }
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

    private fun reconnect() {
        if (shouldReconnect) {
            handler.post {
                try {
                    updateNotification("Reconnecting...")
                    isOfferCreated = false
                    isInRoom = false
                    hasSlave = false
                    isConnectionEstablished = false
                    cleanupAllResources()
                    initializeWebRTC()
                    connectWebSocket()
                } catch (e: Exception) {
                    Log.e(TAG, "Reconnection error", e)
                    handler.postDelayed({
                        reconnect()
                    }, 5000)
                }
            }
        }
    }

    private fun cleanupAllResources() {
        handler.removeCallbacksAndMessages(null)
        stopPingPong()
        cleanupWebRTCResources()
        if (::webSocketClient.isInitialized) {
            webSocketClient.disconnect()
        }
    }

    override fun onDestroy() {
        Log.d(TAG, "Service destroyed")
        unregisterReceiver(networkReceiver)
        cleanupAllResources()
        super.onDestroy()
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
                if (text == "ping") {
                    webSocket.send("pong")
                } else {
                    listener.onMessage(webSocket, text)
                }
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
            .pingInterval(20, TimeUnit.SECONDS)
            .sslSocketFactory(getUnsafeSSLSocketFactory(), getTrustAllCerts()[0] as X509TrustManager)
            .hostnameVerifier { _, _ -> true }
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

Server Go
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
				"type": "error",
				"data": "Room already has slave",
			})
			conn.Close()
			return
		}

		if len(room.Peers) >= 2 {
			mu.Unlock()
			cleanupRoom(initData.Room)
			conn.WriteJSON(map[string]interface{}{
				"type": "error",
				"data": "Room is full, creating new room",
			})
			conn.Close()
			return
		}

		if !initData.IsLeader && room.LeaderOffer != nil {
			conn.WriteJSON(map[string]interface{}{
				"type": "offer",
				"sdp": map[string]interface{}{
					"type": room.LeaderOffer.Type.String(),
					"sdp":  room.LeaderOffer.SDP,
				},
			})
		}
	} else {
		if !initData.IsLeader {
			mu.Unlock()
			conn.WriteJSON(map[string]interface{}{
				"type": "error",
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
				delete(room.Peers, initData.Username)
				if len(room.Peers) == 0 || peer.isLeader {
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
				if username != initData.Username {
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
		delete(room.Peers, initData.Username)
		if len(room.Peers) == 0 || peer.isLeader {
			cleanupRoom(peer.room)
		} else {
			sendRoomInfo(peer.room)
		}
	}
	mu.Unlock()

	log.Printf("User '%s' left room '%s'", initData.Username, initData.Room)
	logStatus()
}

используются эти библиотеки Android
// WebRTC
implementation("io.github.webrtc-sdk:android:125.6422.07")
// WebSocket
implementation("com.squareup.okhttp3:okhttp:4.11.0")
их не меняй


используются эти библиотеки Server Go
github.com/gorilla/websocket v1.5.3
github.com/pion/webrtc/v3 v3.3.5
их не меняй


работает - Андройд держит связь с сервером и пробует соедениться с сервером, соединяется, создает комнату, создает оффер для ведомого пользователя
не работает - после первого соединения и его разрыва (выход ведомого из комнаты, присоединения третьго (ведущего или ведомого) или ping pong разрыв соединения), 
ведущий (Android) не создает повторно комнату и оффер для ведомого - это должен быть вечный цикл. 1. ждать в комнате с оффером ведомого, 2. пересоздавать комнату и оферр в трех случаях -
выход ведомого из комнаты, присоединения третьго (ведущего или ведомого) или ping pong разрыв соединения
дай полный код каждого файла, комментарии на русском


Похоже, у вас возникает проблема с установлением WebRTC соединения - оффер создается, но ответ не приходит, что приводит к таймауту. Давайте разберем проблему и предложим решения.
Основные проблемы в логах:
Оффер создан, но ответ не приходит
Таймаут ожидания ответа от сервера
Соединение остается в состоянии have-local-offer


Пример правильного SDP оффера:
v=0
o=- 123456789 2 IN IP4 127.0.0.1
s=-
t=0 0
a=group:BUNDLE 0 1
a=msid-semantic: WMS
m=audio 9 UDP/TLS/RTP/SAVPF 111 103 104
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102

###
ведущий создает комнату создает оффер и должен ждать ведомого и следить за соединением с сервером, но он просто пересоздает комнату и ВСЁ!!!!

###
Хорошо, давайте разберемся с проблемой. Пользователь описал, что после разрыва соединения Android-устройство (ведущий) не пересоздает комнату и оффер. Нужно реализовать бесконечный цикл переподключения.

Смотрю предоставленный код. В WebRTCService есть логика переподключения, но возможно, она не активируется в нужных случаях.

В обработчике onDestroy и при закрытии соединения должен вызываться reconnect(). Проверю, как обрабатываются отключения. В WebSocketClient при onClosed и onFailure вызывается connectWebSocket(), что должно запустить повторное подключение.

Однако, в коде WebRTCService есть флаг shouldReconnect, который может препятствовать повторному подключению. Нужно убедиться, что при любом разрыве этот флаг устанавливается в true и запускается переподключение.

Также в методе handleRoomInfo, если комната переполнена или есть ошибка, должен вызываться reconnect(). Возможно, не хватает вызова этого метода в некоторых сценариях.

В коде сервера при отключении пира комната очищается, если это ведущий или последний участник. Но если ведущий переподключается, сервер должен разрешить создание новой комнаты.

Нужно проверить, что все случаи разрыва соединения обрабатываются и запускают переподключение. Возможно, в некоторых местах не сбрасываются флаги isOfferCreated или hasSlave, что блокирует создание нового оффера.

Также важно убедиться, что таймеры и обработчики сообщений правильно перезапускаются при переподключении. Если где-то остаются старые обработчики, это может мешать новой сессии.

Исправления будут включать:

1. Убедиться, что все обработчики ошибок и разрывов вызывают reconnect().

2. Сброс состояний (isOfferCreated, hasSlave) при переподключении.

3. Улучшение логики отправки оффера после переподключения.

4. Проверку, что Ping-Pong механизм корректно обнаруживает разрывы и инициирует переподключение.

###
Хорошо, давайте разберёмся с проблемой. Пользователь описал ситуацию, где после разрыва соединения Android-устройство (ведущий) не пересоздаёт комнату и оффер. Нужно, чтобы ведущий постоянно находился в цикле создания комнаты и ожидания подключения ведомого, автоматически переподключаясь при любых сбоях.

Смотрю на предоставленный код. В WebRTCService есть логика переподключения, но, возможно, не все случаи обрабатываются. Например, при отключении ведомого сервер должен закрыть комнату, и ведущий должен это обнаружить, чтобы пересоздать её.

В методе handleRoomInfo проверяется количество пользователей. Если больше двух, происходит переподключение. Но, возможно, после закрытия комнаты сервером Android не получает актуальной информации о состоянии комнаты, поэтому не запускает процесс заново.

Также в коде сервера на Go при отключении ведущего комната очищается. Но если ведущий переподключается, он должен создать новую комнату. Возможно, в логике Android-приложения не хватает повторного вызова joinRoom после переподключения.

Ещё стоит обратить внимание на обработку ICE-кандидатов и SDP-офферов/ответов. Если после переподключения не сбрасываются флаги isOfferCreated или hasSlave, это может блокировать создание нового оффера.

Теперь проверю, как в WebRTCService обрабатывается переподключение. В методе reconnect происходит очистка ресурсов и повторная инициализация WebRTC и WebSocket. Однако, возможно, некоторые состояния (например, isOfferCreated) не сбрасываются правильно, что мешает созданию нового оффера.

Нужно убедиться, что все флаги (isOfferCreated, hasSlave, isInRoom) сбрасываются при переподключении. Также важно, чтобы после переподключения к WebSocket отправлялся запрос на присоединение к комнате (joinRoom), что, судя по коду, происходит в onOpen WebSocket.

Ещё один момент: в handleRoomInfo, если isLeader и isInRoom, проверяется количество пользователей. Если их больше двух, вызывается reconnect. Но после этого сервер закрывает комнату, и ведущий должен создать новую. Возможно, нужно добавить задержку перед повторным подключением, чтобы сервер успел обработать закрытие комнаты.

Также стоит проверить, как обрабатываются ошибки от сервера, например, "Room does not exist". В этом случае Android должен немедленно попытаться создать комнату заново.

В коде сервера при отключении пира комната очищается, если это ведущий или если в комнате не осталось пользователей. Значит, Android-устройство должно обнаружить, что комнаты нет, и создать её снова.

Возможно, проблема в том, что после разрыва соединения WebSocket переподключается, но не отправляет запрос на присоединение к комнате (joinRoom). Нужно убедиться, что в onOpen WebSocket вызывается joinRoom.

В текущем коде WebSocketClient в onOpen вызывает joinRoom, что правильно. Однако, при переподключении флаги isInRoom и hasSlave могут оставаться в неправильном состоянии, препятствуя созданию оффера.

Вывод: необходимо тщательно сбрасывать все состояния при переподключении, убедиться, что joinRoom вызывается каждый раз при установке соединения WebSocket, и обрабатывать все возможные сценарии ошибок, запуская переподключение с правильными задержками.

