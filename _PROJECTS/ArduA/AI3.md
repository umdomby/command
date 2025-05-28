клиент может подключиться с определенным кодеком, VP8 и H264   VP8 кодек дает трансляцию, H264 нет
я добавил библиотеки
G:\AndroidStudio\ARduA\app\src\main\jniLibs\arm64-v8a
G:\AndroidStudio\ARduA\app\src\main\jniLibs\arm64-v8a\libopenh264.so
G:\AndroidStudio\ARduA\app\src\main\jniLibs\armeabi-v7a
G:\AndroidStudio\ARduA\app\src\main\jniLibs\armeabi-v7a\libopenh264.so
G:\AndroidStudio\ARduA\app\src\main\jniLibs\x86
G:\AndroidStudio\ARduA\app\src\main\jniLibs\x86\libopenh264.so
G:\AndroidStudio\ARduA\app\src\main\jniLibs\x86_64
G:\AndroidStudio\ARduA\app\src\main\jniLibs\x86_64\libopenh264.so
они должны подключиться автоматически

    defaultConfig {
        applicationId = "com.example.ardua"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"

        ndk {
            abiFilters.addAll(setOf("arm64-v8a", "armeabi-v7a", "x86", "x86_64"))
        }

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }


код андройд
package com.example.ardua
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
        const val ACTION_SERVICE_STATE = "com.example.ardua.SERVICE_STATE"
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
    private val webSocketUrl = "wss://ardua.site/wsgo"

    private val notificationId = 1
    private val channelId = "webrtc_service_channel"
    private val handler = Handler(Looper.getMainLooper())

    private var isStateReceiverRegistered = false
    private var isConnectivityReceiverRegistered = false

    private var isEglBaseReleased = false

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

    private fun isValidSdp(sdp: String, codecName: String): Boolean {
        val hasVideoSection = sdp.contains("m=video")
        val hasCodec = sdp.contains("a=rtpmap:\\d+ $codecName/\\d+".toRegex())
        Log.d("WebRTCService", "SDP validation: hasVideoSection=$hasVideoSection, hasCodec=$hasCodec")
        return hasVideoSection && hasCodec
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

    private val bandwidthEstimationRunnable = object : Runnable {
        override fun run() {
            if (isConnected) {
                adjustVideoQualityBasedOnStats()
            }
            handler.postDelayed(this, 10000) // Каждые 10 секунд
        }
    }

    private fun adjustVideoQualityBasedOnStats() {
        webRTCClient.peerConnection?.getStats { statsReport ->
            try {
                var videoPacketsLost = 0L
                var videoPacketsSent = 0L
                var availableSendBandwidth = 0L
                var roundTripTime = 0.0

                statsReport.statsMap.values.forEach { stats ->
                    when {
                        stats.type == "outbound-rtp" && stats.id.contains("video") -> {
                            videoPacketsLost += stats.members["packetsLost"] as? Long ?: 0L
                            videoPacketsSent += stats.members["packetsSent"] as? Long ?: 1L
                        }
                        stats.type == "candidate-pair" && stats.members["state"] == "succeeded" -> {
                            availableSendBandwidth = stats.members["availableOutgoingBitrate"] as? Long ?: 0L
                            roundTripTime = stats.members["currentRoundTripTime"] as? Double ?: 0.0
                        }
                    }
                }

                if (videoPacketsSent > 0) {
                    val lossRate = videoPacketsLost.toDouble() / videoPacketsSent.toDouble()
                    Log.d("WebRTCService", "Packet loss: $lossRate, Bandwidth: $availableSendBandwidth, RTT: $roundTripTime")
                    handler.post {
                        when {
                            lossRate > 0.05 || roundTripTime > 0.5 -> reduceVideoQuality() // >5% потерь или RTT > 500ms
                            lossRate < 0.02 && availableSendBandwidth > 1000000 -> increaseVideoQuality() // <2% потерь и >1Mbps
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
                webRTCClient.setVideoEncoderBitrate(300000, 400000, 500000)
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
                capturer.startCapture(640, 360, 15)
                webRTCClient.setVideoEncoderBitrate(600000, 800000, 1000000)
                Log.d("WebRTCService", "Increased video quality to 854x480@20fps, 800kbps")
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
            registerNetworkCallback()
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
        try {
            cleanupWebRTCResources()
            eglBase = EglBase.create()
            isEglBaseReleased = false
            val localView = SurfaceViewRenderer(this).apply {
                init(eglBase.eglBaseContext, null)
                setMirror(true)
                setZOrderMediaOverlay(true)
                setScalingType(RendererCommon.ScalingType.SCALE_ASPECT_FIT)
            }
            remoteView = SurfaceViewRenderer(this).apply {
                init(eglBase.eglBaseContext, null)
                setZOrderMediaOverlay(true)
                setScalingType(RendererCommon.ScalingType.SCALE_ASPECT_FIT)
            }
            webRTCClient = WebRTCClient(
                context = this,
                eglBase = eglBase,
                localView = localView,
                remoteView = remoteView,
                observer = createPeerConnectionObserver()
            )
            webRTCClient.setVideoEncoderBitrate(300000, 400000, 500000)
            Log.d("WebRTCService", "WebRTCClient initialized successfully")
        } catch (e: Exception) {
            Log.e("WebRTCService", "Failed to initialize WebRTCClient", e)
            throw e // Или обработайте ошибку иначе
        }
    }
    private fun createPeerConnectionObserver() = object : PeerConnection.Observer {
        override fun onIceCandidate(candidate: IceCandidate?) {
            candidate?.let {
                Log.d("WebRTCService", "Local ICE candidate: ${it.sdpMid}:${it.sdpMLineIndex} ${it.sdp}")
                sendIceCandidate(it)
            }
        }

        override fun onIceConnectionChange(state: PeerConnection.IceConnectionState?) {
            Log.d("WebRTCService", "ICE connection state changed to: $state")
            when (state) {
                PeerConnection.IceConnectionState.CONNECTED -> {
                    updateNotification("Connection established")
                }
                PeerConnection.IceConnectionState.DISCONNECTED -> {
                    updateNotification("Connection lost")
                    scheduleReconnect()
                }
                PeerConnection.IceConnectionState.FAILED -> {
                    Log.e("WebRTCService", "ICE connection failed")
                    scheduleReconnect()
                }
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
                handler.post {
                    track.addSink(remoteView)
                }
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
                Log.d("WebRTCService", "WebRTCClient closed")
            }
            if (::eglBase.isInitialized && !isEglBaseReleased) {
                eglBase.release()
                isEglBaseReleased = true
                Log.d("WebRTCService", "EglBase released")
            }
            if (::remoteView.isInitialized) {
                remoteView.clearImage()
                remoteView.release()
                Log.d("WebRTCService", "remoteView released")
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
                put("preferredCodec", "H264")
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
            val isLeader = message.optBoolean("isLeader", false)

            when (message.optString("type")) {
                "rejoin_and_offer" -> {
                    Log.d("WebRTCService", "Received rejoin_and_offer with codec: ${message.optString("preferredCodec", "H264")}")
                    handler.post {
                        cleanupWebRTCResources()
                        initializeWebRTC()
                        createOffer(message.optString("preferredCodec", "H264"))
                    }
                }
                "create_offer_for_new_follower" -> {
                    Log.d("WebRTCService", "Received request to create offer for new follower")
                    val preferredCodec = message.optString("preferredCodec", "H264")
                    handler.post {
                        createOffer(preferredCodec)
                    }
                }
                "bandwidth_estimation" -> {
                    val estimation = message.optLong("estimation", 1000000)
                    handleBandwidthEstimation(estimation)
                }
                "offer" -> {
                    if (!isLeader) {
                        Log.w("WebRTCService", "Received offer from non-leader, ignoring")
                        return
                    }
                    handleOffer(message)
                }
                "answer" -> handleAnswer(message)
                "ice_candidate" -> handleIceCandidate(message)
                "room_info" -> {}
                "switch_camera" -> {
                    val useBackCamera = message.optBoolean("useBackCamera", false)
                    Log.d("WebRTCService", "Received switch camera command: useBackCamera=$useBackCamera")
                    handler.post {
                        webRTCClient.switchCamera(useBackCamera)
                        sendCameraSwitchAck(useBackCamera)
                    }
                }
                else -> Log.w("WebRTCService", "Unknown message type")
            }
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error handling message", e)
        }
    }

    private fun normalizeSdpForCodec(sdp: String, targetCodec: String, targetBitrateAs: Int = 300): String {
        var newSdp = sdp
        val codecName = when (targetCodec) {
            "H264" -> "H264"
            "VP8" -> "VP8"
            else -> {
                Log.w("WebRTCService", "Unknown target codec: $targetCodec, defaulting to H264")
                "H264"
            }
        }

        Log.d("WebRTCService", "Normalizing SDP for codec: $codecName")

        // Найти payload type для целевого кодека
        val rtpmapRegex = "a=rtpmap:(\\d+) $codecName(?:/\\d+)?".toRegex()
        val rtpmapMatches = rtpmapRegex.findAll(newSdp)
        var targetPayloadTypes = rtpmapMatches.map { it.groupValues[1] }.toList()

        // Если H.264 отсутствует, добавить его минимально
        if (targetPayloadTypes.isEmpty() && codecName == "H264") {
            Log.w("WebRTCService", "H264 payload type not found, adding minimal H264 lines")
            targetPayloadTypes = listOf("126")
            val h264Lines = """
                a=rtpmap:126 H264/90000
                a=fmtp:126 profile-level-id=42e01f;level-asymmetry-allowed=1;packetization-mode=1
                a=rtcp-fb:126 ccm fir
                a=rtcp-fb:126 nack
                a=rtcp-fb:126 nack pli
            """.trimIndent()

            val lines = newSdp.split("\r\n").toMutableList()
            var videoSectionIndex = -1
            for (i in lines.indices) {
                if (lines[i].startsWith("m=video")) {
                    videoSectionIndex = i
                    // Добавить H.264 payload type в m=video
                    lines[i] = lines[i].replace(Regex("(\\d+\\s+UDP/TLS/RTP/SAVPF\\s+)(.*)"), "$1$targetPayloadTypes $2")
                    break
                }
            }
            if (videoSectionIndex != -1) {
                lines.add(videoSectionIndex + 1, h264Lines)
                newSdp = lines.joinToString("\r\n")
            } else {
                Log.e("WebRTCService", "No m=video section found, cannot add H264")
                return sdp
            }
        }

        if (targetPayloadTypes.isEmpty()) {
            Log.e("WebRTCService", "$codecName payload type not found in SDP")
            return sdp
        }

        val targetPayloadType = targetPayloadTypes.first()
        Log.d("WebRTCService", "Found $codecName payload type: $targetPayloadType")

        // Приоритизировать целевой кодек в m=video, сохраняя другие кодеки
        newSdp = newSdp.replace(
            Regex("^(m=video\\s+\\d+\\s+UDP/(?:TLS/)?RTP/SAVPF\\s+)(.*)$", RegexOption.MULTILINE)
        ) { matchResult ->
            val payloads = matchResult.groupValues[2].split(" ").toMutableList()
            if (payloads.contains(targetPayloadType)) {
                payloads.remove(targetPayloadType)
                payloads.add(0, targetPayloadType)
            }
            "${matchResult.groupValues[1]}${payloads.joinToString(" ")}"
        }
        Log.d("WebRTCService", "Updated m=video to prioritize $codecName payload type: $targetPayloadType")

        // Установить битрейт
        newSdp = newSdp.replace(
            Regex("^(a=mid:video\r\n(?:(?!a=mid:).*\r\n)*?)b=(AS|TIAS):\\d+\r\n", RegexOption.MULTILINE),
            "$1"
        )
        newSdp = newSdp.replace("a=mid:video\r\n", "a=mid:video\r\nb=AS:$targetBitrateAs\r\n")
        Log.d("WebRTCService", "Set video bitrate to AS:$targetBitrateAs")

        // Валидация SDP
        if (!isValidSdp(newSdp, codecName)) {
            Log.e("WebRTCService", "Invalid SDP after modification: missing m=video or $codecName")
            return sdp
        }

        Log.d("WebRTCService", "Final normalized SDP:\n$newSdp")
        return newSdp
    }

    private fun createOffer(preferredCodec: String = "H264") {
        try {
            if (!::webRTCClient.isInitialized || !isConnected || webRTCClient.peerConnection == null) {
                Log.e("WebRTCService", "Cannot create offer - not initialized, not connected, or PeerConnection is null")
                return
            }

            Log.d("WebRTCService", "Creating offer with preferred codec: $preferredCodec, PeerConnection state: ${webRTCClient.peerConnection?.signalingState()}")
            // Проверяем состояние PeerConnection
            if (webRTCClient.peerConnection?.signalingState() == PeerConnection.SignalingState.CLOSED) {
                Log.e("WebRTCService", "PeerConnection is closed, reinitializing WebRTC")
                cleanupWebRTCResources()
                initializeWebRTC()
            }

            val constraints = MediaConstraints().apply {
                mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveAudio", "true"))
                mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveVideo", "true"))
                mandatory.add(MediaConstraints.KeyValuePair("googCpuOveruseDetection", "true"))
                mandatory.add(MediaConstraints.KeyValuePair("googScreencastMinBitrate", "300"))
            }

            webRTCClient.peerConnection?.createOffer(object : SdpObserver {
                override fun onCreateSuccess(desc: SessionDescription?) {
                    if (desc == null) {
                        Log.e("WebRTCService", "Created SessionDescription is NULL")
                        return
                    }

                    Log.d("WebRTCService", "Original Local Offer SDP:\n${desc.description}")
                    val modifiedSdp = normalizeSdpForCodec(desc.description, preferredCodec, 300)
                    Log.d("WebRTCService", "Modified Local Offer SDP:\n$modifiedSdp")

                    if (!isValidSdp(modifiedSdp, preferredCodec)) {
                        Log.e("WebRTCService", "Invalid modified SDP, falling back to original")
                        setLocalDescription(desc)
                        return
                    }

                    val modifiedDesc = SessionDescription(desc.type, modifiedSdp)
                    setLocalDescription(modifiedDesc)
                }

                override fun onCreateFailure(error: String?) {
                    Log.e("WebRTCService", "Error creating offer: $error")
                }

                override fun onSetSuccess() {}
                override fun onSetFailure(error: String?) {}
            }, constraints)
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error in createOffer", e)
        }
    }

    private fun setLocalDescription(desc: SessionDescription) {
        webRTCClient.peerConnection?.setLocalDescription(object : SdpObserver {
            override fun onSetSuccess() {
                Log.d("WebRTCService", "Successfully set local description")
                sendSessionDescription(desc)
            }

            override fun onSetFailure(error: String?) {
                Log.e("WebRTCService", "Error setting local description: $error")
                // Пробуем реинициализацию
                handler.postDelayed({
                    cleanupWebRTCResources()
                    initializeWebRTC()
                    createOffer()
                }, 2000)
            }

            override fun onCreateSuccess(p0: SessionDescription?) {}
            override fun onCreateFailure(error: String?) {}
        }, desc)
    }

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

            val preferredCodec = offer.optString("preferredCodec", "H264")

            webRTCClient.peerConnection?.setRemoteDescription(object : SdpObserver {
                override fun onSetSuccess() {
                    val constraints = MediaConstraints().apply {
                        mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveAudio", "true"))
                        mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveVideo", "true"))
                    }
                    createAnswer(constraints, preferredCodec)
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

    private fun createAnswer(constraints: MediaConstraints, preferredCodec: String = "H264") {
        try {
            webRTCClient.peerConnection?.createAnswer(object : SdpObserver {
                override fun onCreateSuccess(desc: SessionDescription?) {
                    if (desc == null) {
                        Log.e("WebRTCService", "Created SessionDescription is NULL")
                        return
                    }

                    Log.d("WebRTCService", "Original Local Answer SDP:\n${desc.description}")
                    val modifiedSdp = normalizeSdpForCodec(desc.description, preferredCodec, 300)
                    Log.d("WebRTCService", "Modified Local Answer SDP:\n$modifiedSdp")

                    if (!isValidSdp(modifiedSdp, preferredCodec)) {
                        Log.e("WebRTCService", "Invalid modified SDP, falling back to original")
                        setLocalDescription(desc)
                        return
                    }

                    val modifiedDesc = SessionDescription(desc.type, modifiedSdp)
                    setLocalDescription(modifiedDesc)
                }

                override fun onCreateFailure(error: String?) {
                    Log.e("WebRTCService", "Error creating answer: $error")
                }

                override fun onSetSuccess() {}
                override fun onSetFailure(error: String?) {}
            }, constraints)
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error creating answer", e)
        }
    }

    private fun sendSessionDescription(desc: SessionDescription) {
        Log.d("WebRTCService", "Sending SDP: ${desc.type} \n${desc.description}")
        try {
            val codec = when {
                desc.description.contains("a=rtpmap:.*H264") -> "H264"
                desc.description.contains("a=rtpmap:.*VP8") -> "VP8"
                else -> "Unknown"
            }

            val message = JSONObject().apply {
                put("type", desc.type.canonicalForm())
                put("sdp", JSONObject().apply {
                    put("type", desc.type.canonicalForm())
                    put("sdp", desc.description)
                })
                put("codec", codec)
                put("room", roomName)
                put("username", userName)
                put("target", "browser")
            }
            Log.d("WebRTCService", "Sending JSON: $message")
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

            webRTCClient.peerConnection?.setRemoteDescription(object : SdpObserver {
                override fun onSetSuccess() {
                    Log.d("WebRTCService", "Answer accepted, connection should be established")
                }

                override fun onSetFailure(error: String) {
                    Log.e("WebRTCService", "Error setting answer: $error")
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
            webRTCClient.peerConnection?.addIceCandidate(iceCandidate)
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
            .setPriority(NotificationCompat.PRIORITY_HIGH)
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
        val workRequest = OneTimeWorkRequestBuilder<WebRTCWorker>()
            .setInitialDelay(1, TimeUnit.MINUTES)
            .setConstraints(
                Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED)
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





логи сервера
2025/05/25 18:17:00 Follower user_425 prefers codec: H264 in room NTKKKM96JMTPRP90
2025/05/25 18:17:00 Sending rejoin_and_offer command to leader PRA-LA1 for new follower user_425 with codec H264
2025/05/25 18:17:00 Successfully sent rejoin_and_offer with codec H264 to leader PRA-LA1
2025/05/25 18:17:00 MediaEngine configured with H.264 (PT: 126) only
2025/05/25 18:17:00 PeerConnection created for user_425 with preferred codec H264
2025/05/25 18:17:00 Sent room_info to user_425
2025/05/25 18:17:00 User 'user_425' successfully joined room 'NTKKKM96JMTPRP90' as follower
2025/05/25 18:17:00 --- Server Status ---
2025/05/25 18:17:00 Total Connections: 3
2025/05/25 18:17:00 Active Rooms: 1
2025/05/25 18:17:00   Room 'NTKKKM96JMTPRP90' (2 users: [PRA-LA1 user_425]) - Leader: [PRA-LA1], Follower: [user_425]
2025/05/25 18:17:00 ---------------------
2025/05/25 18:17:05 Ignoring message with type 'join' from user_425
2025/05/25 18:17:06 Ignoring message with type 'join' from user_425

код сервера
package main
import (
"encoding/json"
"errors"
"fmt"
"log"
"net/http"
"regexp" // Добавлено для normalizeSdpForCodec
"strings" // Добавлено для normalizeSdpForCodec
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
mu       sync.Mutex
}

type RoomInfo struct {
Users    []string `json:"users"`
Leader   string   `json:"leader"`
Follower string   `json:"follower"`
}

var (
peers     = make(map[string]*Peer)
rooms     = make(map[string]map[string]*Peer)
mu        sync.Mutex
// letters = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ") // Не используется, но оставлено для вашего сведения
webrtcAPI *webrtc.API // Глобальный API с настроенным MediaEngine
)

func normalizeSdpForCodec(sdp, preferredCodec string) string {
log.Printf("Normalizing SDP for codec: %s", preferredCodec)
lines := strings.Split(sdp, "\r\n")
var newLines []string
targetPayloadTypes := []string{}
targetCodec := preferredCodec
if targetCodec != "H264" && targetCodec != "VP8" {
targetCodec = "H264"
log.Printf("Invalid codec %s, defaulting to H264", preferredCodec)
}

    // Найти payload types для целевого кодека
    codecRegex := regexp.MustCompile(fmt.Sprintf(`a=rtpmap:(\d+) %s/\d+`, targetCodec))
    for _, line := range lines {
        matches := codecRegex.FindStringSubmatch(line)
        if matches != nil {
            targetPayloadTypes = append(targetPayloadTypes, matches[1])
            log.Printf("Found %s payload type: %s", targetCodec, matches[1])
        }
    }

    // Добавить H.264, если отсутствует
    if len(targetPayloadTypes) == 0 && targetCodec == "H264" {
        log.Printf("No H264 payload types found, adding manually")
        targetPayloadTypes = []string{"126"}
        h264Lines := []string{
            "a=rtpmap:126 H264/90000",
            "a=fmtp:126 profile-level-id=42e01f;level-asymmetry-allowed=1;packetization-mode=1",
            "a=rtcp-fb:126 ccm fir",
            "a=rtcp-fb:126 nack",
            "a=rtcp-fb:126 nack pli",
        }
        videoSectionFound := false
        for i, line := range lines {
            if strings.HasPrefix(line, "m=video") {
                videoSectionFound = true
                newLines = append(lines[:i+1], append(h264Lines, lines[i+1:]...)...)
                newLines[i] = "m=video 9 UDP/TLS/RTP/SAVPF 126"
                break
            }
        }
        if !videoSectionFound {
            log.Printf("No m=video section found, returning original SDP")
            return sdp
        }
    } else {
        newLines = lines
    }

    // Удалить другие кодеки
    otherCodecs := []string{"VP8", "VP9", "AV1"}
    if targetCodec == "VP8" {
        otherCodecs = []string{"H264", "VP9", "AV1"}
    }
    filteredLines := []string{}
    for _, line := range newLines {
        skip := false
        for _, codec := range otherCodecs {
            codecRegex := regexp.MustCompile(fmt.Sprintf(`a=rtpmap:(\d+) %s/\d+`, codec))
            if codecRegex.MatchString(line) || strings.Contains(line, fmt.Sprintf("apt=%s", codec)) {
                log.Printf("Skipping line with codec %s: %s", codec, line)
                skip = true
                break
            }
        }
        if !skip {
            filteredLines = append(filteredLines, line)
        }
    }
    newLines = filteredLines

    // Убедиться, что m=video содержит только целевой payload type
    for i, line := range newLines {
        if strings.HasPrefix(line, "m=video") {
            newLines[i] = fmt.Sprintf("m=video 9 UDP/TLS/RTP/SAVPF %s", targetPayloadTypes[0])
            log.Printf("Updated m=video to use only %s payload type: %s", targetCodec, targetPayloadTypes[0])
            break
        }
    }

    // Установить битрейт
    for i, line := range newLines {
        if strings.HasPrefix(line, "a=mid:video") {
            newLines = append(newLines[:i+1], append([]string{"b=AS:300"}, newLines[i+1:]...)...)
            break
        }
    }

    newSdp := strings.Join(newLines, "\r\n")
    log.Printf("Normalized SDP for %s:\n%s", targetCodec, newSdp)
    return newSdp
}

// contains проверяет, есть ли элемент в срезе
func contains(slice []string, item string) bool {
for _, s := range slice {
if s == item {
return true
}
}
return false
}


// createMediaEngine создает MediaEngine с учетом preferredCodec
func createMediaEngine(preferredCodec string) *webrtc.MediaEngine {
mediaEngine := &webrtc.MediaEngine{}

    if preferredCodec == "H264" {
        // Регистрируем только H.264
        if err := mediaEngine.RegisterCodec(webrtc.RTPCodecParameters{
            RTPCodecCapability: webrtc.RTPCodecCapability{
                MimeType:    webrtc.MimeTypeH264,
                ClockRate:   90000,
                SDPFmtpLine: "level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f",
                RTCPFeedback: []webrtc.RTCPFeedback{
                    {Type: "nack"},
                    {Type: "nack", Parameter: "pli"},
                    {Type: "ccm", Parameter: "fir"},
                    {Type: "goog-remb"},
                },
            },
            PayloadType: 126,
        }, webrtc.RTPCodecTypeVideo); err != nil {
            log.Printf("H264 codec registration error: %v", err)
        }
        log.Printf("MediaEngine configured with H.264 (PT: 126) only")
    } else if preferredCodec == "VP8" {
        // Регистрируем только VP8
        if err := mediaEngine.RegisterCodec(webrtc.RTPCodecParameters{
            RTPCodecCapability: webrtc.RTPCodecCapability{
                MimeType:    webrtc.MimeTypeVP8,
                ClockRate:   90000,
                RTCPFeedback: []webrtc.RTCPFeedback{
                    {Type: "nack"},
                    {Type: "nack", Parameter: "pli"},
                    {Type: "ccm", Parameter: "fir"},
                    {Type: "goog-remb"},
                },
            },
            PayloadType: 96,
        }, webrtc.RTPCodecTypeVideo); err != nil {
            log.Printf("VP8 codec registration error: %v", err)
        }
        log.Printf("MediaEngine configured with VP8 (PT: 96) only")
    } else {
        // По умолчанию H.264
        if err := mediaEngine.RegisterCodec(webrtc.RTPCodecParameters{
            RTPCodecCapability: webrtc.RTPCodecCapability{
                MimeType:    webrtc.MimeTypeH264,
                ClockRate:   90000,
                SDPFmtpLine: "level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f",
                RTCPFeedback: []webrtc.RTCPFeedback{
                    {Type: "nack"},
                    {Type: "nack", Parameter: "pli"},
                    {Type: "ccm", Parameter: "fir"},
                    {Type: "goog-remb"},
                },
            },
            PayloadType: 126,
        }, webrtc.RTPCodecTypeVideo); err != nil {
            log.Printf("H264 codec registration error: %v", err)
        }
        log.Printf("MediaEngine configured with default H.264 (PT: 126)")
    }

    // Регистрируем Opus аудио
    if err := mediaEngine.RegisterCodec(webrtc.RTPCodecParameters{
        RTPCodecCapability: webrtc.RTPCodecCapability{
            MimeType:     webrtc.MimeTypeOpus,
            ClockRate:    48000,
            Channels:     2,
            SDPFmtpLine:  "minptime=10;useinbandfec=1",
            RTCPFeedback: []webrtc.RTCPFeedback{},
        },
        PayloadType: 111,
    }, webrtc.RTPCodecTypeAudio); err != nil {
        log.Printf("Opus codec registration error: %v", err)
    }

    return mediaEngine
}

func init() {
// rand.Seed(time.Now().UnixNano()) // Закомментировано, т.к. randSeq не используется. Если будете использовать math/rand, раскомментируйте.
initializeMediaAPI() // Инициализируем MediaEngine при старте
}

// initializeMediaAPI настраивает MediaEngine только с H.264 и Opus
func initializeMediaAPI() {
mediaEngine := createMediaEngine("H264")
webrtcAPI = webrtc.NewAPI(
webrtc.WithMediaEngine(mediaEngine),
)
log.Println("Global MediaEngine initialized with H.264 (PT: 126) and Opus (PT: 111)")
}

// getWebRTCConfig осталась вашей функцией
func getWebRTCConfig() webrtc.Configuration {
return webrtc.Configuration{
ICEServers: []webrtc.ICEServer{
{URLs: []string{"stun:stun.l.google.com:19302"}},
{URLs: []string{"stun:ardua.site:3478"}},
{URLs: []string{"turn:ardua.site:3478"}, Username: "user1", Credential: "pass1"},
},
ICETransportPolicy: webrtc.ICETransportPolicyAll,
BundlePolicy:       webrtc.BundlePolicyMaxBundle,
RTCPMuxPolicy:      webrtc.RTCPMuxPolicyRequire,
SDPSemantics:       webrtc.SDPSemanticsUnifiedPlan,
}
}

// logStatus осталась вашей функцией
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

// sendRoomInfo осталась вашей функцией
func sendRoomInfo(room string) {
mu.Lock()
defer mu.Unlock()

    roomPeers, exists := rooms[room]
    if !exists || roomPeers == nil {
        return
    }

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

    roomInfo := RoomInfo{Users: users, Leader: leader, Follower: follower}
    for _, peer := range roomPeers {
        peer.mu.Lock()
        conn := peer.conn
        if conn != nil {
            err := conn.WriteJSON(map[string]interface{}{"type": "room_info", "data": roomInfo})
            if err != nil {
                log.Printf("Error sending room info to %s (user: %s): %v", conn.RemoteAddr(), peer.username, err)
            }
        }
        peer.mu.Unlock()
    }
}

// closePeerResources - унифицированная функция для закрытия ресурсов пира
func closePeerResources(peer *Peer, reason string) {
if peer == nil {
return
}
peer.mu.Lock() // Блокируем конкретного пира

    // Сначала закрываем WebRTC соединение
    if peer.pc != nil {
        log.Printf("Closing PeerConnection for %s (Reason: %s)", peer.username, reason)
        // Небольшая задержка может иногда помочь отправить последние данные, но обычно не нужна
        // time.Sleep(100 * time.Millisecond)
        if err := peer.pc.Close(); err != nil {
            // Ошибки типа "invalid PeerConnection state" ожидаемы, если соединение уже закрывается
            // log.Printf("Error closing peer connection for %s: %v", peer.username, err)
        }
        peer.pc = nil // Помечаем как закрытое
    }

    // Затем закрываем WebSocket соединение
    if peer.conn != nil {
        log.Printf("Closing WebSocket connection for %s (Reason: %s)", peer.username, reason)
        // Отправляем управляющее сообщение о закрытии, если возможно
        _ = peer.conn.WriteControl(websocket.CloseMessage,
            websocket.FormatCloseMessage(websocket.CloseNormalClosure, reason),
            time.Now().Add(time.Second)) // Даем немного времени на отправку
        peer.conn.Close()
        peer.conn = nil // Помечаем как закрытое
    }
    peer.mu.Unlock()
}

// handlePeerJoin осталась вашей функцией с изменениями для создания PeerConnection через webrtcAPI
// handlePeerJoin обрабатывает присоединение пира к комнате
func handlePeerJoin(room string, username string, isLeader bool, conn *websocket.Conn, preferredCodec string) (*Peer, error) {
mu.Lock() // Блокируем для работы с глобальными комнатами

    if _, exists := rooms[room]; !exists {
        if !isLeader {
            mu.Unlock()
            _ = conn.WriteJSON(map[string]interface{}{"type": "error", "data": "Room does not exist. Leader must join first."})
            conn.Close()
            return nil, errors.New("room does not exist for follower")
        }
        rooms[room] = make(map[string]*Peer)
    }

    roomPeers := rooms[room] // Получаем ссылку на мапу пиров комнаты

    // Логика замены ведомого
    if !isLeader {
        hasLeader := false
        for _, p := range roomPeers {
            if p.isLeader {
                hasLeader = true
                break
            }
        }
        if !hasLeader {
            mu.Unlock()
            _ = conn.WriteJSON(map[string]interface{}{"type": "error", "data": "No leader in room"})
            conn.Close()
            return nil, errors.New("no leader in room")
        }

        var existingFollower *Peer
        // Используем переданный preferredCodec, по умолчанию H.264
        codec := preferredCodec
        if codec == "" {
            codec = "H264"
        }
        log.Printf("Follower %s prefers codec: %s in room %s", username, codec, room)

        for _, p := range roomPeers {
            if !p.isLeader { // Ищем существующего ведомого
                existingFollower = p
                break
            }
        }

        if existingFollower != nil {
            log.Printf("Replacing old follower %s with new follower %s in room %s", existingFollower.username, username, room)
            // Удаляем старого ведомого из комнаты и глобального списка peers
            delete(roomPeers, existingFollower.username)
            for addr, pItem := range peers {
                if pItem == existingFollower {
                    delete(peers, addr)
                    break
                }
            }
            mu.Unlock()
            // Отправляем команду на отключение и закрываем ресурсы старого ведомого
            existingFollower.mu.Lock()
            if existingFollower.conn != nil {
                _ = existingFollower.conn.WriteJSON(map[string]interface{}{
                    "type": "force_disconnect",
                    "data": "You have been replaced by another viewer",
                })
            }
            existingFollower.mu.Unlock()
            go closePeerResources(existingFollower, "Replaced by new follower")
            mu.Lock()
        }

        var leaderPeer *Peer
        for _, p := range roomPeers {
            if p.isLeader {
                leaderPeer = p
                break
            }
        }
        if leaderPeer != nil {
            log.Printf("Sending rejoin_and_offer command to leader %s for new follower %s with codec %s", leaderPeer.username, username, codec)
            leaderPeer.mu.Lock()
            leaderWsConn := leaderPeer.conn
            leaderPeer.mu.Unlock()

            if leaderWsConn != nil {
                mu.Unlock()
                err := leaderWsConn.WriteJSON(map[string]interface{}{
                    "type":           "rejoin_and_offer",
                    "room":           room,
                    "preferredCodec": codec,
                })
                mu.Lock()
                if err != nil {
                    log.Printf("Error sending rejoin_and_offer command to leader %s: %v", leaderPeer.username, err)
                } else {
                    log.Printf("Successfully sent rejoin_and_offer with codec %s to leader %s", codec, leaderPeer.username)
                }
            } else {
                log.Printf("Leader %s has no active WebSocket connection to send rejoin_and_offer.", leaderPeer.username)
            }
        } else {
            log.Printf("No leader found in room %s to send rejoin_and_offer.", room)
        }
    }

    // Создаем PeerConnection с учетом preferredCodec
    mediaEngine := createMediaEngine(preferredCodec)
    peerAPI := webrtc.NewAPI(webrtc.WithMediaEngine(mediaEngine))
    peerConnection, err := peerAPI.NewPeerConnection(getWebRTCConfig())
    if err != nil {
        mu.Unlock()
        return nil, fmt.Errorf("failed to create PeerConnection: %w", err)
    }
    log.Printf("PeerConnection created for %s with preferred codec %s", username, preferredCodec)

    peer := &Peer{
        conn:     conn,
        pc:       peerConnection,
        username: username,
        room:     room,
        isLeader: isLeader,
    }

if isLeader {
videoTransceiver, err := peerConnection.AddTransceiverFromKind(webrtc.RTPCodecTypeVideo, webrtc.RTPTransceiverInit{
Direction: webrtc.RTPTransceiverDirectionSendonly,
})
if err != nil {
log.Printf("Failed to add video transceiver for leader %s: %v", username, err)
mu.Unlock()
conn.WriteJSON(map[string]interface{}{
"type": "error",
"data": "Failed to add video transceiver",
})
conn.Close()
return nil, fmt.Errorf("failed to add video transceiver: %w", err)
}
go func() {
time.Sleep(5 * time.Second)
peer.mu.Lock()
defer peer.mu.Unlock()
if videoTransceiver.Sender() == nil || videoTransceiver.Sender().Track() == nil {
log.Printf("No video track added by leader %s in room %s", username, room)
if peer.conn != nil {
peer.conn.WriteJSON(map[string]interface{}{
"type": "error",
"data": "No video track detected. Please ensure camera is active.",
})
}
} else {
log.Printf("Video track confirmed for leader %s in room %s", username, room)
}
}()
}

    if _, err := peerConnection.AddTransceiverFromKind(webrtc.RTPCodecTypeAudio, webrtc.RTPTransceiverInit{
        Direction: webrtc.RTPTransceiverDirectionSendrecv,
    }); err != nil {
        log.Printf("Failed to add audio transceiver for %s: %v", username, err)
    }

    // Настройка обработчиков ICE кандидатов и треков
    peerConnection.OnICECandidate(func(c *webrtc.ICECandidate) {
        if c == nil {
            return
        }
        peer.mu.Lock()
        defer peer.mu.Unlock()
        if peer.conn != nil {
            err := peer.conn.WriteJSON(map[string]interface{}{"type": "ice_candidate", "ice": c.ToJSON()})
            if err != nil {
                log.Printf("Error sending ICE candidate to %s: %v", peer.username, err)
            }
        }
    })

    if !isLeader {
        peerConnection.OnTrack(func(track *webrtc.TrackRemote, receiver *webrtc.RTPReceiver) {
            log.Printf("Track received for follower %s in room %s: Codec %s",
                peer.username, peer.room, track.Codec().MimeType)
        })
    }

    rooms[room][username] = peer
    peers[conn.RemoteAddr().String()] = peer

    // Отправляем room_info клиенту
    err = conn.WriteJSON(map[string]interface{}{
        "type": "room_info",
        "data": map[string]interface{}{
            "room":     room,
            "username": username,
            "isLeader": isLeader,
        },
    })
    if err != nil {
        log.Printf("Error sending room_info to %s: %v", username, err)
    } else {
        log.Printf("Sent room_info to %s", username)
    }

    mu.Unlock()
    return peer, nil
}

// main осталась вашей функцией
func main() {
// initializeMediaAPI() // Уже вызывается в init()

    http.HandleFunc("/wsgo", handleWebSocket)
    http.HandleFunc("/status", func(w http.ResponseWriter, r *http.Request) {
        logStatus()
        w.WriteHeader(http.StatusOK)
        if _, err := w.Write([]byte("Status logged to console")); err != nil {
            log.Printf("Error writing /status response: %v", err)
        }
    })

    log.Println("Server starting on :8085 (Logic: Leader Re-joins on Follower connect)")
    log.Println("WebRTC MediaEngine configured for H.264 (video) and Opus (audio).")
    logStatus() // Логируем статус при запуске
    if err := http.ListenAndServe(":8085", nil); err != nil {
        log.Fatalf("Failed to start server: %v", err)
    }
}

// handleWebSocket осталась вашей функцией с минимальными изменениями для очистки
func handleWebSocket(w http.ResponseWriter, r *http.Request) {
conn, err := upgrader.Upgrade(w, r, nil)
if err != nil {
log.Println("WebSocket upgrade error:", err)
return
}
remoteAddr := conn.RemoteAddr().String()
log.Printf("New WebSocket connection attempt from: %s", remoteAddr)

    var initData struct {
        Room           string `json:"room"`
        Username       string `json:"username"`
        IsLeader       bool   `json:"isLeader"`
        PreferredCodec string `json:"preferredCodec"`
    }
    conn.SetReadDeadline(time.Now().Add(10 * time.Second))
    err = conn.ReadJSON(&initData)
    conn.SetReadDeadline(time.Time{})

    if err != nil {
        log.Printf("Read init data error from %s: %v. Closing.", remoteAddr, err)
        conn.Close()
        return
    }
    if initData.Room == "" || initData.Username == "" {
        log.Printf("Invalid init data from %s: Room or Username is empty. Closing.", remoteAddr)
        _ = conn.WriteJSON(map[string]interface{}{"type": "error", "data": "Room and Username cannot be empty"})
        conn.Close()
        return
    }

    log.Printf("User '%s' (isLeader: %v, preferredCodec: %s) attempting to join room '%s' from %s",
        initData.Username, initData.IsLeader, initData.PreferredCodec, initData.Room, remoteAddr)

    currentPeer, err := handlePeerJoin(initData.Room, initData.Username, initData.IsLeader, conn, initData.PreferredCodec)
    if err != nil {
        log.Printf("Error handling peer join for %s: %v", initData.Username, err)
        return
    }
    if currentPeer == nil {
        log.Printf("Peer %s was not created. Connection likely closed by handlePeerJoin.", initData.Username)
        return
    }

    log.Printf("User '%s' successfully joined room '%s' as %s", currentPeer.username, currentPeer.room, map[bool]string{true: "leader", false: "follower"}[currentPeer.isLeader])
    logStatus()
    sendRoomInfo(currentPeer.room)

    // Цикл чтения сообщений от клиента
    for {
        msgType, msgBytes, err := conn.ReadMessage()
        if err != nil {
            if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure, websocket.CloseNormalClosure, websocket.CloseNoStatusReceived) {
                log.Printf("Unexpected WebSocket close error for %s (%s): %v", currentPeer.username, remoteAddr, err)
            } else {
                log.Printf("WebSocket connection closed/read error for %s (%s): %v", currentPeer.username, remoteAddr, err)
            }
            break
        }

        if msgType != websocket.TextMessage {
            log.Printf("Received non-text message type (%d) from %s. Ignoring.", msgType, currentPeer.username)
            continue
        }
        if len(msgBytes) == 0 {
            continue
        }

        var data map[string]interface{}
        if err := json.Unmarshal(msgBytes, &data); err != nil {
            log.Printf("JSON unmarshal error (for logging type) from %s: %v. Message: %s. Forwarding raw.", currentPeer.username, err, string(msgBytes))
        }
        dataType, _ := data["type"].(string)

        mu.Lock()
        roomPeers := rooms[currentPeer.room]
        var targetPeer *Peer
        if roomPeers != nil {
            for _, p := range roomPeers {
                if p.username != currentPeer.username {
                    targetPeer = p
                    break
                }
            }
        }
        mu.Unlock()

        if targetPeer == nil && (dataType == "offer" || dataType == "answer" || dataType == "ice_candidate") {
            continue
        }

        switch dataType {
        case "offer":
            log.Printf("Received offer from %s: %s", currentPeer.username, string(msgBytes))
            if currentPeer.isLeader && targetPeer != nil && !targetPeer.isLeader {
                log.Printf(">>> Forwarding Offer from %s to %s", currentPeer.username, targetPeer.username)
                // Нормализуем SDP
                preferredCodec, _ := data["preferredCodec"].(string)
                if preferredCodec == "" {
                    preferredCodec = initData.PreferredCodec
                    if preferredCodec == "" {
                        preferredCodec = "H264"
                    }
                }
                if sdp, ok := data["sdp"].(string); ok {
                    data["sdp"] = normalizeSdpForCodec(sdp, preferredCodec)
                    msgBytes, _ = json.Marshal(data)
                }
                targetPeer.mu.Lock()
                targetWsConn := targetPeer.conn
                targetPeer.mu.Unlock()
                if targetWsConn != nil {
                    if err := targetWsConn.WriteMessage(websocket.TextMessage, msgBytes); err != nil {
                        log.Printf("!!! Error forwarding offer to %s: %v", targetPeer.username, err)
                    }
                }
            } else {
                log.Printf("WARN: Received 'offer' from non-leader or no target.")
            }

        case "answer":
            if targetPeer != nil && !currentPeer.isLeader && targetPeer.isLeader {
                log.Printf("<<< Forwarding Answer from %s to %s", currentPeer.username, targetPeer.username)
                // Нормализуем SDP
                preferredCodec, _ := data["preferredCodec"].(string)
                if preferredCodec == "" {
                    preferredCodec = initData.PreferredCodec
                    if preferredCodec == "" {
                        preferredCodec = "H264"
                    }
                }
                if sdp, ok := data["sdp"].(string); ok {
                    data["sdp"] = normalizeSdpForCodec(sdp, preferredCodec)
                    msgBytes, _ = json.Marshal(data)
                }
                targetPeer.mu.Lock()
                targetWsConn := targetPeer.conn
                targetPeer.mu.Unlock()
                if targetWsConn != nil {
                    if err := targetWsConn.WriteMessage(websocket.TextMessage, msgBytes); err != nil {
                        log.Printf("!!! Error forwarding answer to %s: %v", targetPeer.username, err)
                    }
                }
            } else {
                log.Printf("WARN: Received 'answer' from non-follower or no target leader.")
            }

        case "ice_candidate":
            if targetPeer != nil {
                log.Printf("... Forwarding ICE candidate from %s to %s", currentPeer.username, targetPeer.username)
                targetPeer.mu.Lock()
                targetWsConn := targetPeer.conn
                targetPeer.mu.Unlock()
                if targetWsConn != nil {
                    if err := targetWsConn.WriteMessage(websocket.TextMessage, msgBytes); err != nil {
                        log.Printf("Error forwarding ICE candidate to %s: %v", targetPeer.username, err)
                    }
                }
            }

        case "switch_camera":
            if targetPeer != nil {
                log.Printf("Forwarding '%s' message from %s to %s", dataType, currentPeer.username, targetPeer.username)
                targetPeer.mu.Lock()
                targetWsConn := targetPeer.conn
                targetPeer.mu.Unlock()
                if targetWsConn != nil {
                    if err := targetWsConn.WriteMessage(websocket.TextMessage, msgBytes); err != nil {
                        log.Printf("Error forwarding '%s' to %s: %v", dataType, targetPeer.username, err)
                    }
                }
            }
        default:
            log.Printf("Ignoring message with type '%s' from %s", dataType, currentPeer.username)
        }
    }

    log.Printf("Cleaning up for %s (Addr: %s) in room %s after WebSocket loop ended.", currentPeer.username, remoteAddr, currentPeer.room)
    go closePeerResources(currentPeer, "WebSocket read loop ended")

    mu.Lock()
    roomName := currentPeer.room
    if currentRoomPeers, roomExists := rooms[roomName]; roomExists {
        delete(currentRoomPeers, currentPeer.username)
        if len(currentRoomPeers) == 0 {
            delete(rooms, roomName)
            log.Printf("Room %s is now empty and has been deleted.", roomName)
            roomName = ""
        }
    }
    delete(peers, remoteAddr)
    mu.Unlock()

    logStatus()
    if roomName != "" {
        sendRoomInfo(roomName)
    }
    log.Printf("Cleanup complete for WebSocket connection %s (User: %s)", remoteAddr, currentPeer.username)
}


мне нужно сделать - когда клиент подключается с кодеком H264  андройд пересоздает соединение с нужным кодеком, мне нужно чтобы работал и H264 