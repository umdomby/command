package com.example.ardua
import android.annotation.SuppressLint
import android.app.*
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.ServiceInfo
import android.hardware.camera2.CameraAccessException
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
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
    //private val webSocketUrl = "wss://ardua.site/wsgo"
    private val webSocketUrl = "wss://ardua.site:444/wsgo"

    private val notificationId = 1
    private val channelId = "webrtc_service_channel"
    private val handler = Handler(Looper.getMainLooper())

    private var isStateReceiverRegistered = false
    private var isConnectivityReceiverRegistered = false

    private var isEglBaseReleased = false

    private lateinit var cameraManager: CameraManager
    private var flashlightCameraId: String? = null
    private var isFlashlightOn = false

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

            cameraManager = getSystemService(Context.CAMERA_SERVICE) as CameraManager
            try {
                // Ищем камеру с поддержкой фонарика
                for (id in cameraManager.cameraIdList) {
                    val characteristics = cameraManager.getCameraCharacteristics(id)
                    val hasFlash = characteristics.get(android.hardware.camera2.CameraCharacteristics.FLASH_INFO_AVAILABLE) ?: false
                    if (hasFlash) {
                        flashlightCameraId = findAvailableFlashlightCamera()
                        Log.d("WebRTCService", "Камера с фонариком найдена: $id")
                        break
                    }
                }
                if (flashlightCameraId == null) {
                    Log.w("WebRTCService", "Фонарик не найден на устройстве")
                }
            } catch (e: CameraAccessException) {
                Log.e("WebRTCService", "Ошибка доступа к CameraManager: ${e.message}")
            }
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
        if (isInitializing) {
            Log.w("WebRTCService", "Initialization already in progress, skipping")
            return
        }
        isInitializing = true
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
            Log.d("WebRTCService", "WebRTCClient initialized, peerConnection state: ${webRTCClient.peerConnection?.signalingState()}")
            Log.d("WebRTCService", "Video capturer initialized: ${webRTCClient.videoCapturer != null}")
        } catch (e: Exception) {
            Log.e("WebRTCService", "Failed to initialize WebRTCClient", e)
            throw e
        } finally {
            isInitializing = false
        }
    }

    private fun findAvailableFlashlightCamera(): String? {
        try {
            for (id in cameraManager.cameraIdList) {
                val characteristics = cameraManager.getCameraCharacteristics(id)
                val hasFlash = characteristics.get(CameraCharacteristics.FLASH_INFO_AVAILABLE) ?: false
                val lensFacing = characteristics.get(CameraCharacteristics.LENS_FACING)
                if (hasFlash && lensFacing == CameraCharacteristics.LENS_FACING_BACK) {
                    Log.d("WebRTCService", "Тыльная камера с фонариком: $id")
                    return id
                }
            }
            Log.w("WebRTCService", "Камера с фонариком не найдена")
            return null
        } catch (e: CameraAccessException) {
            Log.e("WebRTCService", "Ошибка поиска камеры: ${e.message}")
            return null
        }
    }

    private fun isCameraAvailable(cameraId: String): Boolean {
        return try {
            val characteristics = cameraManager.getCameraCharacteristics(cameraId)
            characteristics != null
        } catch (e: CameraAccessException) {
            Log.e("WebRTCService", "Ошибка проверки доступности камеры: ${e.message}")
            false
        }
    }

    private fun toggleFlashlight() {
        flashlightCameraId = findAvailableFlashlightCamera()
        if (flashlightCameraId == null) {
            Log.w("WebRTCService", "Фонарик недоступен")
            return
        }

        val sharedPrefs = getSharedPreferences("WebRTCPrefs", Context.MODE_PRIVATE)
        val useBackCamera = sharedPrefs.getBoolean("useBackCamera", false)
        Log.d("WebRTCService", "Начало переключения фонарика, cameraId: $flashlightCameraId, isCameraAvailable: ${isCameraAvailable(flashlightCameraId!!)}, useBackCamera: $useBackCamera, isFlashlightOn: $isFlashlightOn")

        try {
            // Если включаем фонарик и используем тыльную камеру, останавливаем захват
            if (!isFlashlightOn && useBackCamera) {
                Log.d("WebRTCService", "Остановка захвата видео для тыльной камеры")
                webRTCClient.videoCapturer?.stopCapture()
            }

            // Задержка для освобождения камеры или немедленное действие для фронтальной камеры
            handler.postDelayed({
                try {
                    isFlashlightOn = !isFlashlightOn
                    if (isCameraAvailable(flashlightCameraId!!)) {
                        cameraManager.setTorchMode(flashlightCameraId!!, isFlashlightOn)
                        Log.d("WebRTCService", "Фонарик ${if (isFlashlightOn) "включен" else "выключен"}")
                    } else {
                        Log.w("WebRTCService", "Камера $flashlightCameraId недоступна, повторная попытка")
                        handler.postDelayed({
                            try {
                                cameraManager.setTorchMode(flashlightCameraId!!, isFlashlightOn)
                                Log.d("WebRTCService", "Фонарик ${if (isFlashlightOn) "включен" else "выключен"} после повторной попытки")
                            } catch (e: CameraAccessException) {
                                Log.e("WebRTCService", "Ошибка повторной попытки: ${e.message}, reason: ${e.reason}")
                                isFlashlightOn = !isFlashlightOn
                            }
                        }, 200)
                    }

                    // Возобновляем захват видео только если выключаем фонарик и используем тыльную камеру
                    if (!isFlashlightOn && useBackCamera) {
                        handler.postDelayed({
                            try {
                                webRTCClient.videoCapturer?.startCapture(640, 480, 20)
                                Log.d("WebRTCService", "Возобновление захвата видео")
                            } catch (e: Exception) {
                                Log.e("WebRTCService", "Ошибка возобновления захвата: ${e.message}")
                            }
                        }, 500)
                    }
                } catch (e: CameraAccessException) {
                    Log.e("WebRTCService", "Ошибка фонарика: ${e.message}, reason: ${e.reason}")
                    isFlashlightOn = !isFlashlightOn
                    // Возобновляем захват, если фонарик не включился и используем тыльную камеру
                    if (!isFlashlightOn && useBackCamera) {
                        handler.postDelayed({
                            try {
                                webRTCClient.videoCapturer?.startCapture(640, 480, 20)
                                Log.d("WebRTCService", "Возобновление захвата после ошибки")
                            } catch (startError: Exception) {
                                Log.e("WebRTCService", "Ошибка возобновления захвата: ${startError.message}")
                            }
                        }, 500)
                    }
                }
            }, if (useBackCamera && !isFlashlightOn) 500 else 0) // Задержка только для тыльной камеры при включении
        } catch (e: Exception) {
            Log.e("WebRTCService", "Общая ошибка: ${e.message}")
        } finally {
            Log.d("WebRTCService", "Завершение переключения фонарика, isFlashlightOn: $isFlashlightOn")
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
                            Log.d("WebRTCService", "Video track received, ID: ${track.id()}, Enabled: ${track.enabled()}")
                            (track as VideoTrack).addSink(remoteView)
                        }
                        "audio" -> {
                            Log.d("WebRTCService", "Audio track received, ID: ${track.id()}")
                        }
                    }
                }
            }
        }
    }
    private var isCleaningUp = false
    private var isInitializing = false

    private fun cleanupWebRTCResources() {
        if (isCleaningUp) {
            Log.w("WebRTCService", "Cleanup already in progress, skipping")
            return
        }
        isCleaningUp = true
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
        } finally {
            isCleaningUp = false
        }
    }

    private fun connectWebSocket() {
        if (isConnected || isConnecting) {
            Log.d("WebRTCService", "Already connected or connecting, skipping")
            return
        }

        isConnecting = true
        webSocketClient = WebSocketClient(webSocketListener)
        try {
            webSocketClient.connect(webSocketUrl)
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error connecting WebSocket", e)
            isConnecting = false
            scheduleReconnect()
        }
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
            reconnect()
        }, delay)
    }

    private fun reconnect() {
        if (isConnected || isConnecting) {
            Log.d("WebRTCService", "Already connected or connecting, skipping manual reconnect")
            return
        }

        Log.d("WebRTCService", "Starting reconnect process, attempt: $reconnectAttempts")
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
                        try {
                            if (!::webRTCClient.isInitialized) {
                                Log.e("WebRTCService", "WebRTCClient not initialized, cannot switch camera")
                                sendCameraSwitchAck(useBackCamera, success = false)
                                return@post
                            }
                            webRTCClient.switchCamera(useBackCamera)
                            Log.d("WebRTCService", "Switch camera command executed for useBackCamera=$useBackCamera")
                            sendCameraSwitchAck(useBackCamera)
                        } catch (e: Exception) {
                            Log.e("WebRTCService", "Error switching camera: ${e.message}")
                            sendCameraSwitchAck(useBackCamera, success = false)
                        }
                    }
                }
                "toggle_flashlight" -> {
                    Log.d("WebRTCService", "Received toggle_flashlight command")
                    handler.post { toggleFlashlight() }
                }
                else -> Log.w("WebRTCService", "Unknown message type")
            }
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error handling message", e)
        }
    }

    private fun normalizeSdpForCodec(sdp: String, targetCodec: String, targetBitrateAs: Int = 300): String {
        Log.d("WebRTCService", "Normalizing SDP for codec: $targetCodec")
        val lines = sdp.split("\r\n").toMutableList()
        val videoSectionIndex = lines.indexOfFirst { it.startsWith("m=video") }
        if (videoSectionIndex == -1) {
            Log.e("WebRTCService", "No video section found in SDP")
            return sdp
        }

        // Extract payload types for the video section
        val videoLineParts = lines[videoSectionIndex].split(" ")
        if (videoLineParts.size < 4) {
            Log.e("WebRTCService", "Invalid video section: ${lines[videoSectionIndex]}")
            return sdp
        }

        val payloadTypes = videoLineParts.drop(3)
        var targetPayloadType: String? = null
        var targetPayloadIndex: Int? = null

        // Find the target codec in rtpmap
        for (i in lines.indices) {
            if (lines[i].startsWith("a=rtpmap:") && lines[i].contains(targetCodec, ignoreCase = true)) {
                val parts = lines[i].split(" ")
                if (parts.size >= 2) {
                    targetPayloadType = parts[0].substringAfter("a=rtpmap:").substringBefore(" ")
                    targetPayloadIndex = i
                    break
                }
            }
        }

        if (targetPayloadType == null) {
            Log.w("WebRTCService", "$targetCodec not found in SDP, leaving SDP unchanged")
            return sdp
        }

        // Ensure target codec is first in the payload list
        val newPayloadTypes = mutableListOf(targetPayloadType).apply {
            addAll(payloadTypes.filter { it != targetPayloadType })
        }
        lines[videoSectionIndex] = videoLineParts.take(3).joinToString(" ") + " " + newPayloadTypes.joinToString(" ")

        // Add bitrate constraints
        if (targetBitrateAs > 0) {
            val bLine = "b=AS:$targetBitrateAs"
            val insertIndex = videoSectionIndex + 1
            if (!lines.contains(bLine)) {
                lines.add(insertIndex, bLine)
                Log.d("WebRTCService", "Added bitrate constraint: $bLine")
            }
        }

        val modifiedSdp = lines.joinToString("\r\n")
        Log.d("WebRTCService", "Modified SDP:\n$modifiedSdp")
        return modifiedSdp
    }

    private fun createOffer(preferredCodec: String = "H264") {
        try {
            if (!::webRTCClient.isInitialized || !isConnected || webRTCClient.peerConnection == null) {
                Log.e("WebRTCService", "Cannot create offer - not initialized, not connected, or PeerConnection is null");
                return;
            }

            Log.d("WebRTCService", "Creating offer with preferred codec: $preferredCodec, PeerConnection state: ${webRTCClient.peerConnection?.signalingState()}");
            if (webRTCClient.peerConnection?.signalingState() == PeerConnection.SignalingState.CLOSED) {
                Log.e("WebRTCService", "PeerConnection is closed, reinitializing WebRTC");
                cleanupWebRTCResources();
                initializeWebRTC();
            }

            val constraints = MediaConstraints().apply {
                mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveAudio", "true"));
                mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveVideo", "true"));
                mandatory.add(MediaConstraints.KeyValuePair("googCpuOveruseDetection", "true"));
                mandatory.add(MediaConstraints.KeyValuePair("googScreencastMinBitrate", "300"));
            };

            webRTCClient.peerConnection?.createOffer(object : SdpObserver {
                override fun onCreateSuccess(desc: SessionDescription?) {
                    if (desc == null) {
                        Log.e("WebRTCService", "Created SessionDescription is NULL");
                        return;
                    }

                    Log.d("WebRTCService", "Original Local Offer SDP:\n${desc.description}");
                    val modifiedSdp = normalizeSdpForCodec(desc.description, preferredCodec, 300);
                    Log.d("WebRTCService", "Modified Local Offer SDP:\n$modifiedSdp");

                    if (!isValidSdp(modifiedSdp, preferredCodec)) {
                        Log.e("WebRTCService", "Invalid modified SDP, falling back to original");
                        setLocalDescription(desc);
                        return;
                    }

                    val modifiedDesc = SessionDescription(desc.type, modifiedSdp);
                    setLocalDescription(modifiedDesc);
                }

                override fun onCreateFailure(error: String?) {
                    Log.e("WebRTCService", "Error creating offer: $error");
                }

                override fun onSetSuccess() {
                    Log.d("WebRTCService", "Offer created successfully");
                }

                override fun onSetFailure(error: String?) {
                    Log.e("WebRTCService", "Error setting offer: $error");
                }
            }, constraints);
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error in createOffer", e);
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

    private fun sendCameraSwitchAck(useBackCamera: Boolean, success: Boolean = true) {
        try {
            val message = JSONObject().apply {
                put("type", "switch_camera_ack")
                put("useBackCamera", useBackCamera)
                put("success", success)
                put("room", roomName)
                put("username", userName)
            }
            webSocketClient.send(message.toString())
            Log.d("WebRTCService", "Sent camera switch ack: success=$success, useBackCamera=$useBackCamera")
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error sending camera switch ack: ${e.message}")
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

        if (isFlashlightOn) {
            try {
                flashlightCameraId?.let { cameraManager.setTorchMode(it, false) }
                isFlashlightOn = false
                Log.d("WebRTCService", "Фонарик выключен при завершении сервиса")
            } catch (e: CameraAccessException) {
                Log.e("WebRTCService", "Ошибка выключения фонарика: ${e.message}")
            }
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