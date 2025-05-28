G:\AndroidStudio\ARduA\app\src\main\java\com\example\ardua\WebRTCClient.kt
G:\AndroidStudio\ARduA\app\src\main\java\com\example\ardua\WebRTCService.kt
G:\AndroidStudio\ARduA\app\src\main\java\com\example\ardua\WebSocketClient.kt


// file: app/src/main/java/com/example/ardua/WebRTCClient.kt
package com.example.ardua

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
private lateinit var peerConnectionFactory: PeerConnectionFactory
var peerConnection: PeerConnection? = null
private var localVideoTrack: VideoTrack? = null
private var localAudioTrack: AudioTrack? = null
internal var videoCapturer: VideoCapturer? = null
private var surfaceTextureHelper: SurfaceTextureHelper? = null

    init {
        initializePeerConnectionFactory()
        peerConnection = createPeerConnection()
        if (peerConnection == null) {
            Log.e("WebRTCClient", "Failed to create peer connection")
            throw IllegalStateException("Failed to create peer connection")
        }
        createLocalTracks()
    }

    private fun initializePeerConnectionFactory() {
        // 1. Инициализация WebRTC
        try {
            PeerConnectionFactory.initialize(
                PeerConnectionFactory.InitializationOptions.builder(context)
                    .setEnableInternalTracer(true)
                    .setFieldTrials("WebRTC-H264HighProfile/Enabled/")
                    .createInitializationOptions()
            )
            Log.d("WebRTCClient", "WebRTC library initialized successfully")
        } catch (e: Exception) {
            Log.e("WebRTCClient", "Failed to initialize WebRTC library", e)
            throw e
        }

        // 2. Создание фабрик кодеков
        val videoEncoderFactory = DefaultVideoEncoderFactory(
            eglBase.eglBaseContext,
            true,  // enableIntelVp8Encoder
            true   // enableH264HighProfile
        )
        val videoDecoderFactory = DefaultVideoDecoderFactory(eglBase.eglBaseContext)

        // 3. Настройка опций
        val options = PeerConnectionFactory.Options().apply {
            disableEncryption = false
            disableNetworkMonitor = false
        }

        // 4. Создание PeerConnectionFactory
        try {
            peerConnectionFactory = PeerConnectionFactory.builder()
                .setOptions(options)
                .setVideoEncoderFactory(videoEncoderFactory)
                .setVideoDecoderFactory(videoDecoderFactory)
                .createPeerConnectionFactory()
            Log.d("WebRTCClient", "PeerConnectionFactory created successfully")
        } catch (e: Exception) {
            Log.e("WebRTCClient", "Failed to create PeerConnectionFactory", e)
            throw e
        }
    }

    private fun createPeerConnection(): PeerConnection? {
        try {
            val rtcConfig = PeerConnection.RTCConfiguration(
                listOf(
                    //PeerConnection.IceServer.builder("stun:ardua.site:3478").createIceServer(),
                    PeerConnection.IceServer.builder("turn:ardua.site:3478")
                        .setUsername("user1")
                        .setPassword("pass1")
                        .createIceServer()
                )
            ).apply {
                sdpSemantics = PeerConnection.SdpSemantics.UNIFIED_PLAN
                continualGatheringPolicy = PeerConnection.ContinualGatheringPolicy.GATHER_CONTINUALLY
                iceTransportsType = PeerConnection.IceTransportsType.ALL
                bundlePolicy = PeerConnection.BundlePolicy.MAXBUNDLE
                rtcpMuxPolicy = PeerConnection.RtcpMuxPolicy.REQUIRE
                tcpCandidatePolicy = PeerConnection.TcpCandidatePolicy.ENABLED
                candidateNetworkPolicy = PeerConnection.CandidateNetworkPolicy.ALL
                keyType = PeerConnection.KeyType.ECDSA
            }
            val peerConnection = peerConnectionFactory.createPeerConnection(rtcConfig, observer)
            if (peerConnection == null) {
                Log.e("WebRTCClient", "Failed to create PeerConnection")
            }
            return peerConnection
        } catch (e: Exception) {
            Log.e("WebRTCClient", "Error creating PeerConnection", e)
            return null
        }
    }

    internal fun switchCamera(useBackCamera: Boolean) {
        try {
            videoCapturer?.let { capturer ->
                if (capturer is CameraVideoCapturer) {
                    val enumerator = Camera2Enumerator(context)
                    val targetCamera = enumerator.deviceNames.find {
                        if (useBackCamera) !enumerator.isFrontFacing(it) else enumerator.isFrontFacing(it)
                    }
                    if (targetCamera != null) {
                        capturer.switchCamera(object : CameraVideoCapturer.CameraSwitchHandler {
                            override fun onCameraSwitchDone(isFrontCamera: Boolean) {
                                Log.d("WebRTCClient", "Switched to ${if (isFrontCamera) "front" else "back"} camera")
                            }

                            override fun onCameraSwitchError(error: String) {
                                Log.e("WebRTCClient", "Error switching camera: $error")
                            }
                        }, targetCamera)
                    } else {
                        Log.e("WebRTCClient", "No ${if (useBackCamera) "back" else "front"} camera found")
                    }
                } else {
                    Log.w("WebRTCClient", "Video capturer is not a CameraVideoCapturer")
                }
            } ?: Log.w("WebRTCClient", "Video capturer is null")
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
            peerConnection?.addTrack(it, listOf(streamId))
        }

        localVideoTrack?.let {
            stream.addTrack(it)
            peerConnection?.addTrack(it, listOf(streamId))
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
            if (videoCapturer == null) {
                Log.e("WebRTCClient", "Failed to create video capturer")
                throw IllegalStateException("Video capturer is null")
            }

            surfaceTextureHelper = SurfaceTextureHelper.create("CaptureThread", eglBase.eglBaseContext)
            if (surfaceTextureHelper == null) {
                Log.e("WebRTCClient", "Failed to create SurfaceTextureHelper")
                throw IllegalStateException("SurfaceTextureHelper is null")
            }

            val videoSource = peerConnectionFactory.createVideoSource(false)
            videoCapturer?.initialize(surfaceTextureHelper, context, videoSource.capturerObserver)

            val isSamsung = Build.MANUFACTURER.equals("samsung", ignoreCase = true)
            videoCapturer?.startCapture(
                if (isSamsung) 480 else 640,
                if (isSamsung) 360 else 480,
                if (isSamsung) 15 else 20
            )

            localVideoTrack = peerConnectionFactory.createVideoTrack("ARDAMSv0", videoSource).apply {
                addSink(localView)
            }

            setVideoEncoderBitrate(
                if (isSamsung) 150000 else 300000,
                if (isSamsung) 200000 else 400000,
                if (isSamsung) 300000 else 500000
            )
            Log.d("WebRTCClient", "Video track created successfully")
        } catch (e: Exception) {
            Log.e("WebRTCClient", "Error creating video track", e)
            throw e
        }
    }

    fun setVideoEncoderBitrate(minBitrate: Int, currentBitrate: Int, maxBitrate: Int) {
        try {
            val sender = peerConnection?.senders?.find { it.track()?.kind() == "video" }
            sender?.let { videoSender ->
                val parameters = videoSender.parameters
                if (parameters.encodings.isNotEmpty()) {
                    parameters.encodings[0].minBitrateBps = minBitrate
                    parameters.encodings[0].maxBitrateBps = maxBitrate
                    parameters.encodings[0].bitratePriority = 1.0
                    videoSender.parameters = parameters
                    Log.d("WebRTCClient", "Set video bitrate: min=$minBitrate, max=$maxBitrate")
                }
            } ?: Log.w("WebRTCClient", "No video sender found")
        } catch (e: Exception) {
            Log.e("WebRTCClient", "Error setting video bitrate", e)
        }
    }

    private fun createCameraCapturer(): VideoCapturer? {
        val enumerator = Camera2Enumerator(context)
        return enumerator.deviceNames.find { enumerator.isFrontFacing(it) }?.let {
            Log.d("WebRTCClient", "Using front camera: $it")
            enumerator.createCapturer(it, null)
        } ?: enumerator.deviceNames.firstOrNull()?.let {
            Log.d("WebRTCClient", "Using first available camera: $it")
            enumerator.createCapturer(it, null)
        } ?: run {
            Log.e("WebRTCClient", "No cameras available")
            null
        }
    }

    fun close() {
        try {
            videoCapturer?.let { capturer ->
                try {
                    capturer.stopCapture()
                    Log.d("WebRTCClient", "Video capturer stopped")
                } catch (e: Exception) {
                    Log.e("WebRTCClient", "Error stopping capturer", e)
                }
                try {
                    capturer.dispose()
                    Log.d("WebRTCClient", "Video capturer disposed")
                } catch (e: Exception) {
                    Log.e("WebRTCClient", "Error disposing capturer", e)
                }
            }

            localVideoTrack?.let { track ->
                try {
                    track.removeSink(localView)
                    track.dispose()
                    Log.d("WebRTCClient", "Local video track disposed")
                } catch (e: Exception) {
                    Log.e("WebRTCClient", "Error disposing video track", e)
                }
            }

            localAudioTrack?.let { track ->
                try {
                    track.dispose()
                    Log.d("WebRTCClient", "Local audio track disposed")
                } catch (e: Exception) {
                    Log.e("WebRTCClient", "Error disposing audio track", e)
                }
            }

            surfaceTextureHelper?.let { helper ->
                try {
                    helper.dispose()
                    Log.d("WebRTCClient", "SurfaceTextureHelper disposed")
                } catch (e: Exception) {
                    Log.e("WebRTCClient", "Error disposing surface helper", e)
                }
            }

            peerConnection?.let { pc ->
                try {
                    pc.close()
                    Log.d("WebRTCClient", "Peer connection closed")
                } catch (e: Exception) {
                    Log.e("WebRTCClient", "Error closing peer connection", e)
                }
                try {
                    pc.dispose()
                    Log.d("WebRTCClient", "Peer connection disposed")
                } catch (e: Exception) {
                    Log.e("WebRTCClient", "Error disposing peer connection", e)
                }
            }

            try {
                peerConnectionFactory.dispose()
                Log.d("WebRTCClient", "PeerConnectionFactory disposed")
            } catch (e: Exception) {
                Log.e("WebRTCClient", "Error disposing PeerConnectionFactory", e)
            }
        } catch (e: Exception) {
            Log.e("WebRTCClient", "Error in cleanup", e)
        } finally {
            videoCapturer = null
            localVideoTrack = null
            localAudioTrack = null
            surfaceTextureHelper = null
            peerConnection = null
        }
    }
}

// file: app/src/main/java/com/example/ardua/WebRTCService.kt
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

// file: app/src/main/java/com/example/ardua/WebSocketClient.kt
package com.example.ardua
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

логи сервера
webrtc_server  | 2025/05/25 11:37:34 Follower user_809 prefers codec: VP8 in room NTKKKM96JMTPRP90
webrtc_server  | 2025/05/25 11:37:34 Sending rejoin_and_offer command to leader PRA-LA1 for new follower user_809 with codec VP8    
webrtc_server  | 2025/05/25 11:37:34 Successfully sent rejoin_and_offer with codec VP8 to leader PRA-LA1                            
webrtc_server  | 2025/05/25 11:37:34 MediaEngine configured with VP8 (PT: 96) only                                                  
webrtc_server  | 2025/05/25 11:37:34 PeerConnection created for user_809 with preferred codec VP8                                   
webrtc_server  | 2025/05/25 11:37:34 Sent room_info to user_809                                                                     
webrtc_server  | 2025/05/25 11:37:34 User 'user_809' successfully joined room 'NTKKKM96JMTPRP90' as follower                        
webrtc_server  | 2025/05/25 11:37:34 --- Server Status ---                                                                          
webrtc_server  | 2025/05/25 11:37:34 Total Connections: 2                                                                           
webrtc_server  | 2025/05/25 11:37:34 Active Rooms: 1                                                                                
webrtc_server  | 2025/05/25 11:37:34   Room 'NTKKKM96JMTPRP90' (2 users: [PRA-LA1 user_809]) - Leader: [PRA-LA1], Follower: [user_809]                                                                                                                                  
webrtc_server  | 2025/05/25 11:37:34 ---------------------
webrtc_server  | 2025/05/25 11:37:34 Received offer from PRA-LA1: {"type":"offer","sdp":{"type":"offer","sdp":"v=0\r\no=- 363440359847111960 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0 1\r\na=extmap-allow-mixed\r\na=msid-semantic: WMS ARDAMS\r\nm=audio
9 UDP\/TLS\/RTP\/SAVPF 111 63 9 102 0 8 13 110 126\r\nc=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:zqAG\r\na=ice-pwd:L
aO+MWN4sFZu13EqSSOXNmSI\r\na=ice-options:trickle renomination\r\na=fingerprint:sha-256 0F:1D:FB:6E:3A:28:A1:12:36:BC:A7:49:E1:3B:0C:
48:9E:05:3E:26:B5:B1:AE:51:63:86:82:EC:DE:54:AC:7C\r\na=setup:actpass\r\na=mid:0\r\na=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio
-level\r\na=extmap:2 http:\/\/www.webrtc.org\/experiments\/rtp-hdrext\/abs-send-time\r\na=extmap:3 http:\/\/www.ietf.org\/id\/draft-
holmer-rmcat-transport-wide-cc-extensions-01\r\na=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid\r\na=sendrecv\r\na=msid:ARDAMS ARDAMS
a0\r\na=rtcp-mux\r\na=rtpmap:111 opus\/48000\/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\na=rtpmap:6
3 red\/48000\/2\r\na=fmtp:63 111\/111\r\na=rtpmap:9 G722\/8000\r\na=rtpmap:102 ILBC\/8000\r\na=rtpmap:0 PCMU\/8000\r\na=rtpmap:8 PCM
A\/8000\r\na=rtpmap:13 CN\/8000\r\na=rtpmap:110 telephone-event\/48000\r\na=rtpmap:126 telephone-event\/8000\r\na=ssrc:1216672682 cn
ame:xl\/A9umxV7d0GJqh\r\na=ssrc:1216672682 msid:ARDAMS ARDAMSa0\r\nm=video 9 UDP\/TLS\/RTP\/SAVPF 96 97 39 40 98 99 106 107 108\r\nc
=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:zqAG\r\na=ice-pwd:LaO+MWN4sFZu13EqSSOXNmSI\r\na=ice-options:trickle renomi
nation\r\na=fingerprint:sha-256 0F:1D:FB:6E:3A:28:A1:12:36:BC:A7:49:E1:3B:0C:48:9E:05:3E:26:B5:B1:AE:51:63:86:82:EC:DE:54:AC:7C\r\na
=setup:actpass\r\na=mid:1\r\na=extmap:14 urn:ietf:params:rtp-hdrext:toffset\r\na=extmap:2 http:\/\/www.webrtc.org\/experiments\/rtp-
hdrext\/abs-send-time\r\na=extmap:13 urn:3gpp:video-orientation\r\na=extmap:3 http:\/\/www.ietf.org\/id\/draft-holmer-rmcat-transpor
t-wide-cc-extensions-01\r\na=extmap:5 http:\/\/www.webrtc.org\/experiments\/rtp-hdrext\/playout-delay\r\na=extmap:6 http:\/\/www.web
rtc.org\/experiments\/rtp-hdrext\/video-content-type\r\na=extmap:7 http:\/\/www.webrtc.org\/experiments\/rtp-hdrext\/video-timing\r\
na=extmap:8 http:\/\/www.webrtc.org\/experiments\/rtp-hdrext\/color-space\r\na=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid\r\na=ext
map:10 urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id\r\na=extmap:11 urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id\r\na=send
recv\r\na=msid:ARDAMS ARDAMSv0\r\na=rtcp-mux\r\na=rtcp-rsize\r\na=rtpmap:96 VP8\/90000\r\na=rtcp-fb:96 goog-remb\r\na=rtcp-fb:96 tra
nsport-cc\r\na=rtcp-fb:96 ccm fir\r\na=rtcp-fb:96 nack\r\na=rtcp-fb:96 nack pli\r\na=rtpmap:97 rtx\/90000\r\na=fmtp:97 apt=96\r\na=r
tpmap:39 AV1\/90000\r\na=rtcp-fb:39 goog-remb\r\na=rtcp-fb:39 transport-cc\r\na=rtcp-fb:39 ccm fir\r\na=rtcp-fb:39 nack\r\na=rtcp-fb
:39 nack pli\r\na=fmtp:39 level-idx=5;profile=0;tier=0\r\na=rtpmap:40 rtx\/90000\r\na=fmtp:40 apt=39\r\na=rtpmap:98 VP9\/90000\r\na=
rtcp-fb:98 goog-remb\r\na=rtcp-fb:98 transport-cc\r\na=rtcp-fb:98 ccm fir\r\na=rtcp-fb:98 nack\r\na=rtcp-fb:98 nack pli\r\na=fmtp:98
profile-id=0\r\na=rtpmap:99 rtx\/90000\r\na=fmtp:99 apt=98\r\na=rtpmap:106 red\/90000\r\na=rtpmap:107 rtx\/90000\r\na=fmtp:107 apt=
106\r\na=rtpmap:108 ulpfec\/90000\r\na=ssrc-group:FID 4204706990 2977195281\r\na=ssrc:4204706990 cname:xl\/A9umxV7d0GJqh\r\na=ssrc:4
204706990 msid:ARDAMS ARDAMSv0\r\na=ssrc:2977195281 cname:xl\/A9umxV7d0GJqh\r\na=ssrc:2977195281 msid:ARDAMS ARDAMSv0\r\n"},"codec":"Unknown","room":"NTKKKM96JMTPRP90","username":"PRA-LA1","target":"browser"}
webrtc_server  | 2025/05/25 11:37:34 >>> Forwarding Offer from PRA-LA1 to user_809
webrtc_server  | 2025/05/25 11:37:34 ... Forwarding ICE candidate from PRA-LA1 to user_809                                          
webrtc_server  | 2025/05/25 11:37:34 ... Forwarding ICE candidate from PRA-LA1 to user_809
webrtc_server  | 2025/05/25 11:37:34 ... Forwarding ICE candidate from PRA-LA1 to user_809                                          
webrtc_server  | 2025/05/25 11:37:34 ... Forwarding ICE candidate from PRA-LA1 to user_809                                          
webrtc_server  | 2025/05/25 11:37:34 ... Forwarding ICE candidate from PRA-LA1 to user_809                                          
webrtc_server  | 2025/05/25 11:37:34 ... Forwarding ICE candidate from PRA-LA1 to user_809                                          
webrtc_server  | 2025/05/25 11:37:34 ... Forwarding ICE candidate from PRA-LA1 to user_809                                          
webrtc_server  | 2025/05/25 11:37:34 ... Forwarding ICE candidate from PRA-LA1 to user_809
webrtc_server  | 2025/05/25 11:37:34 ... Forwarding ICE candidate from PRA-LA1 to user_809
webrtc_server  | 2025/05/25 11:37:35 <<< Forwarding Answer from user_809 to PRA-LA1
webrtc_server  | 2025/05/25 11:37:35 ... Forwarding ICE candidate from user_809 to PRA-LA1
webrtc_server  | 2025/05/25 11:37:35 ... Forwarding ICE candidate from user_809 to PRA-LA1
webrtc_server  | 2025/05/25 11:37:35 ... Forwarding ICE candidate from user_809 to PRA-LA1                                          
webrtc_server  | 2025/05/25 11:37:35 ... Forwarding ICE candidate from user_809 to PRA-LA1


почему в локальной сети видео соединение работает, а через интернет нет?
отвечай на русском