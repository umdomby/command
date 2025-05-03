package com.example.mytest

// --- ВАШИ ИМПОРТЫ ---
import android.annotation.SuppressLint
import android.app.*
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.ServiceInfo
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkRequest
import android.os.*
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.work.*
import okhttp3.WebSocketListener
import org.json.JSONObject
import org.webrtc.*
import java.util.concurrent.TimeUnit


class WebRTCService : Service() {

    companion object {
        var isRunning = false
            private set
        var currentRoomName = "" // Статическое поле для хранения имени комнаты между запусками
        const val ACTION_SERVICE_STATE = "com.example.mytest.SERVICE_STATE"
        const val EXTRA_IS_RUNNING = "is_running"
    }

    // --- Стандартные поля сервиса ---
    private val binder = LocalBinder()
    private lateinit var webSocketClient: WebSocketClient
    private lateinit var webRTCClient: WebRTCClient // Отвечает за WebRTC логику
    private lateinit var eglBase: EglBase

    private var isConnected = false // Флаг WebSocket подключения
    private var isConnecting = false // Флаг процесса WebSocket подключения

    private var reconnectAttempts = 0
    private val maxReconnectAttempts = 10 // Можно увеличить
    // private val reconnectDelay = 5000L // Заменено на динамическую задержку

    private lateinit var remoteView: SurfaceViewRenderer // Для ОТОБРАЖЕНИЯ видео от ведомого (в нашем случае не используется)

    private var roomName = "default_room" // Будет перезаписано при старте
    private val userName = Build.MODEL ?: "AndroidDevice_${System.currentTimeMillis() % 1000}" // Имя лидера
    private val webSocketUrl = "wss://ardua.site/ws" // Убедитесь, что URL правильный

    private val notificationId = 1
    private val channelId = "webrtc_service_channel"
    private val handler = Handler(Looper.getMainLooper())

    private var isUserStopped = false // Флаг, что сервис был остановлен пользователем
    private var isStateReceiverRegistered = false
    private var isConnectivityReceiverRegistered = false

    // --- Переменные для WebRTC логики ---
    // Храним имя ТЕКУЩЕГО ведомого, с которым установлено или устанавливается соединение
    private var currentFollowerUsername: String? = null

    // --- Реализация Binder ---
    inner class LocalBinder : Binder() {
        fun getService(): WebRTCService = this@WebRTCService
    }

    override fun onBind(intent: Intent?): IBinder = binder

    // --- BroadcastReceiver для состояния сети (старый способ) ---
    private val connectivityReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            if (!isConnected && !isConnecting && !isUserStopped) {
                Log.d("WebRTCService", "ConnectivityReceiver: Network change, reconnecting...")
                reconnect()
            }
        }
    }

    // --- WebSocket Listener ---
    private val webSocketListener = object : WebSocketListener() {
        // --- onMessage ВАЖНО: запускает обработку в основном потоке ---
        override fun onMessage(webSocket: okhttp3.WebSocket, text: String) {
            Log.d("WebRTCService", "WebSocket Received: $text")
            try {
                val message = JSONObject(text)
                handler.post { handleWebSocketMessage(message) } // Обработка в Main Thread
            } catch (e: Exception) {
                Log.e("WebRTCService", "WebSocket message parse error", e)
            }
        }

        override fun onOpen(webSocket: okhttp3.WebSocket, response: okhttp3.Response) {
            Log.i("WebRTCService", "WebSocket ПОДКЛЮЧЕН для комнаты: $roomName")
            handler.post {
                isConnected = true
                isConnecting = false
                reconnectAttempts = 0
                updateNotification("Подключен к серверу ($roomName)")
                sendJoinMessage() // Отправляем сообщение о входе
            }
        }

        override fun onClosing(webSocket: okhttp3.WebSocket, code: Int, reason: String) {
            Log.d("WebRTCService", "WebSocket закрывается: код=$code, причина=$reason")
            handler.post {
                isConnected = false
                isConnecting = false
            }
        }

        override fun onClosed(webSocket: okhttp3.WebSocket, code: Int, reason: String) {
            Log.w("WebRTCService", "WebSocket ОТКЛЮЧЕН: код=$code, причина=$reason")
            handler.post {
                isConnected = false
                isConnecting = false
                val previousFollower = currentFollowerUsername // Сохраняем для лога
                currentFollowerUsername = null // Сбрасываем текущего ведомого
                if (::webRTCClient.isInitialized) {
                    webRTCClient.closePeerConnection("WebSocket closed") // Закрываем PC
                }
                if (code != 1000 && !isUserStopped) { // 1000 = Normal Closure
                    updateNotification("Соединение потеряно ($code). Переподключение...")
                    Log.d("WebRTCService", "WebSocket closed abnormally, scheduling reconnect. Was connected to: $previousFollower")
                    scheduleReconnect()
                } else if (isUserStopped) {
                    updateNotification("Остановлен пользователем.")
                    Log.d("WebRTCService", "WebSocket closed by user stop request.")
                } else {
                    updateNotification("Соединение закрыто.")
                    Log.d("WebRTCService", "WebSocket closed normally.")
                }
            }
        }

        override fun onFailure(webSocket: okhttp3.WebSocket, t: Throwable, response: okhttp3.Response?) {
            Log.e("WebRTCService", "WebSocket ОШИБКА: ${t.message}", t)
            handler.post {
                isConnected = false
                isConnecting = false
                val previousFollower = currentFollowerUsername
                currentFollowerUsername = null
                if (::webRTCClient.isInitialized) {
                    webRTCClient.closePeerConnection("WebSocket failure")
                }
                updateNotification("Ошибка сети: ${t.message?.take(30)}...")
                if (!isUserStopped) {
                    Log.e("WebRTCService", "WebSocket failure, scheduling reconnect. Was connected to: $previousFollower")
                    scheduleReconnect()
                }
            }
        }
    }

    // --- NetworkCallback для современного отслеживания сети ---
    private val networkCallback = object : ConnectivityManager.NetworkCallback() {
        private var wasAvailable = ConnectivityManagerCompat.isNetworkAvailable(getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager) // Проверяем начальное состояние
        override fun onAvailable(network: Network) {
            super.onAvailable(network)
            Log.i("WebRTCService", "NetworkCallback: Сеть ДОСТУПНА.")
            if (!wasAvailable && !isConnected && !isConnecting && !isUserStopped) {
                Log.i("WebRTCService", "NetworkCallback: Сеть стала доступна, пытаемся переподключиться.")
                handler.post { reconnect() }
            }
            wasAvailable = true
        }

        override fun onLost(network: Network) {
            super.onLost(network)
            Log.w("WebRTCService", "NetworkCallback: Сеть ПОТЕРЯНА.")
            wasAvailable = false
            handler.post { updateNotification("Сеть потеряна") }
        }
    }

    // --- Runnable для периодической проверки "здоровья" сервиса ---
    private val healthCheckRunnable = object : Runnable {
        override fun run() {
            if (!isUserStopped) {
                Log.d("WebRTCService", "Health Check...")
                if (!isConnected && !isConnecting) {
                    Log.w("WebRTCService", "Health Check: Обнаружено отсутствие соединения WebSocket, попытка переподключения.")
                    reconnect()
                } else if (isConnected && currentFollowerUsername != null && (!::webRTCClient.isInitialized || webRTCClient.peerConnection == null || webRTCClient.peerConnection.connectionState() == PeerConnection.PeerConnectionState.FAILED || webRTCClient.peerConnection.connectionState() == PeerConnection.PeerConnectionState.CLOSED)) {
                    Log.w("WebRTCService", "Health Check: Обнаружено WebSocket=OK, но PeerConnection не в порядке (State: ${webRTCClient.peerConnection?.connectionState()}). Попытка сброса и нового оффера.")
                    // Сбрасываем и пробуем заново предложить соединение текущему ведомому
                    resetAndInitiateOffer(currentFollowerUsername)
                }
                handler.postDelayed(this, 60000) // Проверка каждую минуту
            }
        }
    }

    // --- Runnable для адаптации качества видео ---
    private val bandwidthEstimationRunnable = object : Runnable {
        override fun run() {
            if (isConnected && currentFollowerUsername != null && ::webRTCClient.isInitialized && webRTCClient.peerConnection != null && webRTCClient.peerConnection.connectionState() == PeerConnection.PeerConnectionState.CONNECTED) {
                adjustVideoQualityBasedOnStats()
            }
            // Планируем следующий запуск независимо от текущего состояния
            handler.postDelayed(this, 15000) // Каждые 15 секунд
        }
    }

    // ========================================================================
    // Lifecycle Methods (onCreate, onStartCommand, onDestroy)
    // ========================================================================
    @SuppressLint("UnspecifiedRegisterReceiverFlag")
    override fun onCreate() {
        super.onCreate()
        isRunning = true
        isUserStopped = false

        roomName = if (currentRoomName.isNotEmpty()) currentRoomName else "default_room_${(System.currentTimeMillis() % 10000)}"
        Log.i("WebRTCService", "onCreate: Сервис создается для комнаты: '$roomName'")
        currentRoomName = roomName

        sendServiceStateUpdate()

        try {
            // Регистрация ресиверов
            val intentFilterConnectivity = IntentFilter(ConnectivityManager.CONNECTIVITY_ACTION)
            val intentFilterState = IntentFilter(ACTION_SERVICE_STATE)

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                registerReceiver(connectivityReceiver, intentFilterConnectivity, RECEIVER_NOT_EXPORTED)
                registerReceiver(stateReceiver, intentFilterState, RECEIVER_NOT_EXPORTED)
            } else {
                registerReceiver(connectivityReceiver, intentFilterConnectivity)
                registerReceiver(stateReceiver, intentFilterState)
            }
            isConnectivityReceiverRegistered = true
            isStateReceiverRegistered = true
            Log.d("WebRTCService", "BroadcastReceivers зарегистрированы.")

            createNotificationChannel()
            startForegroundService()
            initializeWebRTC()
            connectWebSocket()
            registerNetworkCallback()
            handler.postDelayed(healthCheckRunnable, 30000) // Первый health check через 30 сек
            handler.postDelayed(bandwidthEstimationRunnable, 15000) // Первый запуск оценки через 15 сек

        } catch (e: Exception) {
            Log.e("WebRTCService", "КРИТИЧЕСКАЯ ОШИБКА в onCreate", e)
            setErrorState("Ошибка инициализации сервиса: ${e.message}")
            isUserStopped = true
            stopEverything()
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d("WebRTCService", "onStartCommand: Action=${intent?.action}, Flags=$flags")

        when (intent?.action) {
            "STOP" -> {
                Log.w("WebRTCService", "Получена команда STOP")
                isUserStopped = true
                stopEverything()
                return START_NOT_STICKY // Не перезапускать
            }
            // Другие actions...
            else -> {
                isUserStopped = false

                // Обновляем имя комнаты из SharedPreferences
                val sharedPrefs = getSharedPreferences("WebRTCPrefs", Context.MODE_PRIVATE)
                val lastRoomName = sharedPrefs.getString("last_used_room", "") ?: ""
                roomName = if (lastRoomName.isNotEmpty()) lastRoomName else "default_room_${(System.currentTimeMillis() % 10000)}"
                currentRoomName = roomName // Обновляем статическое поле

                Log.i("WebRTCService", "Сервис стартует/перезапускается для комнаты: '$roomName'")
                updateNotification("Активен в комнате: $roomName")

                if (!isConnected && !isConnecting) {
                    Log.d("WebRTCService", "onStartCommand: Соединение отсутствует, инициируем подключение.")
                    // Проверяем и инициализируем WebRTC, если нужно (после убийства процесса)
                    if (!::eglBase.isInitialized || !::webRTCClient.isInitialized) {
                        Log.w("WebRTCService", "onStartCommand: WebRTC не инициализирован, выполняем initializeWebRTC()")
                        initializeWebRTC()
                    }
                    connectWebSocket() // Пытаемся подключиться
                }

                isRunning = true
                sendServiceStateUpdate()
                return START_STICKY // Перезапускать, если система убьет
            }
        }
    }

    override fun onDestroy() {
        Log.w("WebRTCService", "onDestroy: Сервис уничтожается...")
        isRunning = false
        sendServiceStateUpdate()

        cleanupReceiversAndCallbacks()
        handler.removeCallbacksAndMessages(null) // Удаляем ВСЕ задачи из handler

        // Очищаем ресурсы, только если не остановлено пользователем (он уже вызвал stopEverything)
        if (!isUserStopped) {
            Log.d("WebRTCService", "onDestroy: Очистка ресурсов (не по команде STOP).")
            cleanupWebSocketAndWebRTC()
        } else {
            Log.d("WebRTCService", "onDestroy: Сервис остановлен пользователем, ресурсы уже очищены.")
        }

        Log.w("WebRTCService", "--- Сервис ПОЛНОСТЬЮ УНИЧТОЖЕН ---")
        super.onDestroy()
    }


    // ========================================================================
    // Инициализация и очистка (вспомогательные)
    // ========================================================================

    private fun startForegroundService() {
        val notification = createNotification("Инициализация...")
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(
                    notificationId, notification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA or ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
                )
            } else {
                startForeground(notificationId, notification)
            }
            Log.d("WebRTCService", "Сервис запущен в Foreground режиме.")
        } catch (e: Exception) {
            Log.e("WebRTCService", "Ошибка startForeground", e)
            try { startForeground(notificationId, notification) } catch (e2: Exception) {} // Повторная попытка
        }
    }

    private fun initializeWebRTC() {
        Log.i("WebRTCService", "--- Начало инициализации WebRTC ---")
        if (::webRTCClient.isInitialized && ::eglBase.isInitialized) {
            Log.w("WebRTCService", "WebRTC уже инициализирован, пропускаем.")
            // Если PeerConnection мертв, нужно его пересоздать внутри WebRTCClient
            if (webRTCClient.peerConnection == null ||
                webRTCClient.peerConnection.connectionState() == PeerConnection.PeerConnectionState.CLOSED ||
                webRTCClient.peerConnection.connectionState() == PeerConnection.PeerConnectionState.FAILED)
            {
                Log.w("WebRTCService", "PeerConnection не готов, пытаемся пересоздать внутри WebRTCClient...")
                webRTCClient.recreatePeerConnection() // Предполагаем, что такой метод есть или будет добавлен
            }
            return
        }

        cleanupWebRTCResources() // Очищаем предыдущие ресурсы

        try {
            Log.d("WebRTCService", "Создание EglBase...")
            eglBase = EglBase.create()
            Log.d("WebRTCService", "EglBase создан: ${eglBase.eglBaseContext}")

            val localView = SurfaceViewRenderer(this).apply {
                init(eglBase.eglBaseContext, null)
                setMirror(true)
                setEnableHardwareScaler(true)
            }
            remoteView = SurfaceViewRenderer(this).apply { // remoteView поле класса
                init(eglBase.eglBaseContext, null)
                setEnableHardwareScaler(true)
            }
            Log.d("WebRTCService", "SurfaceViewRenderers инициализированы.")

            webRTCClient = WebRTCClient(
                context = this.applicationContext,
                eglBase = eglBase,
                localView = localView,
                remoteView = remoteView, // Передаем для консистентности, хотя видео не отображаем
                observer = createPeerConnectionObserver()
            )
            Log.i("WebRTCService", "WebRTCClient создан УСПЕШНО.")

            // Запускаем локальное видео
            webRTCClient.startLocalVideo() // Предполагаем, что этот метод есть в WebRTCClient
            Log.d("WebRTCService", "Локальный захват видео запущен.")
            Log.i("WebRTCService", "--- Инициализация WebRTC ЗАВЕРШЕНА ---")

        } catch (e: Exception) {
            Log.e("WebRTCService", "КРИТИЧЕСКАЯ ОШИБКА инициализации WebRTC", e)
            setErrorState("Ошибка инициализации WebRTC: ${e.message}")
            // Не пытаемся подключить WebSocket, если WebRTC упал
            isUserStopped = true // Считаем ошибкой, не перезапускаем
            stopEverything()
        }
    }

    // --- ВАЖНО: Observer для событий PeerConnection ---
    private fun createPeerConnectionObserver() = object : PeerConnection.Observer {
        override fun onIceCandidate(candidate: IceCandidate?) {
            candidate?.let {
                // Отправляем кандидата ТЕКУЩЕМУ ведомому
                sendIceCandidate(it, currentFollowerUsername)
            }
        }

        override fun onIceConnectionChange(newState: PeerConnection.IceConnectionState?) {
            Log.d("WebRTC_Observer", "Состояние ICE соединения: $newState")
            handler.post { updateNotification("ICE: ${newState?.name}") }
            if (newState == PeerConnection.IceConnectionState.FAILED) {
                Log.e("WebRTC_Observer", "ICE Connection Failed! Попытка рестарта ICE (не реализовано) или сброса.")
                // Можно попробовать ICE restart, но проще полный сброс
                // resetAndInitiateOffer(currentFollowerUsername) // ОСТОРОЖНО: может вызвать цикл
            }
        }

        override fun onConnectionChange(newState: PeerConnection.PeerConnectionState?) {
            Log.d("WebRTC_Observer", "ОБЩЕЕ состояние PeerConnection: $newState")
            handler.post {
                updateNotification("P2P: ${newState?.name}")
                if (newState == PeerConnection.PeerConnectionState.FAILED || newState == PeerConnection.PeerConnectionState.CLOSED || newState == PeerConnection.PeerConnectionState.DISCONNECTED) {
                    Log.w("WebRTC_Observer", "P2P состояние $newState для $currentFollowerUsername. Закрываем PC и сбрасываем follower.")
                    webRTCClient.closePeerConnection("PeerConnection state: $newState")
                    currentFollowerUsername = null // Важно сбросить здесь
                }
                if (newState == PeerConnection.PeerConnectionState.CONNECTED) {
                    Log.i("WebRTC_Observer", "P2P Соединение с $currentFollowerUsername УСТАНОВЛЕНО!")
                }
            }
        }

        override fun onTrack(transceiver: RtpTransceiver?) {
            // ЛИДЕР ИГНОРИРУЕТ ВИДЕО ОТ ВЕДОМОГО
            transceiver?.receiver?.track()?.let { track ->
                if (track.kind() == MediaStreamTrack.VIDEO_TRACK_KIND) {
                    Log.d("WebRTC_Observer", "Получен VIDEO track от $currentFollowerUsername. Игнорируем.")
                } else if (track.kind() == MediaStreamTrack.AUDIO_TRACK_KIND) {
                    Log.d("WebRTC_Observer", "Получен AUDIO track от $currentFollowerUsername.")
                    // Аудио обрабатывается автоматически
                }
            }
        }

        // --- Остальные методы Observer ---
        override fun onSignalingChange(p0: PeerConnection.SignalingState?) {}
        override fun onIceConnectionReceivingChange(p0: Boolean) {}
        override fun onIceGatheringChange(p0: PeerConnection.IceGatheringState?) {}
        override fun onIceCandidatesRemoved(p0: Array<out IceCandidate>?) {}
        override fun onAddStream(p0: MediaStream?) {} // Устаревший
        override fun onRemoveStream(p0: MediaStream?) {} // Устаревший
        override fun onDataChannel(p0: DataChannel?) {}
        override fun onRenegotiationNeeded() {
            Log.d("WebRTC_Observer", "onRenegotiationNeeded вызван. В нашей логике игнорируем, ждем команды сервера.")
        }
        override fun onAddTrack(p0: RtpReceiver?, p1: Array<out MediaStream>?) {}
    }


    private fun cleanupWebRTCResources() {
        Log.d("WebRTCService", "Очистка WebRTC ресурсов...")
        try {
            if (::webRTCClient.isInitialized) {
                webRTCClient.close()
            }
            if (::eglBase.isInitialized) {
                eglBase.release()
            }
            Log.d("WebRTCService", "WebRTC ресурсы очищены.")
        } catch (e: Exception) {
            Log.e("WebRTCService", "Ошибка очистки WebRTC ресурсов", e)
        }
    }

    private fun cleanupWebSocketClient() {
        Log.d("WebRTCService", "Очистка WebSocket клиента...")
        try {
            if (::webSocketClient.isInitialized) {
                webSocketClient.disconnect()
            }
            Log.d("WebRTCService", "WebSocket клиент отключен.")
        } catch (e: Exception) {
            Log.e("WebRTCService", "Ошибка отключения WebSocket", e)
        }
    }

    private fun cleanupReceiversAndCallbacks() {
        Log.d("WebRTCService", "Очистка ресиверов и NetworkCallback...")
        try {
            if (isConnectivityReceiverRegistered) {
                unregisterReceiver(connectivityReceiver)
                isConnectivityReceiverRegistered = false
            }
            if (isStateReceiverRegistered) {
                unregisterReceiver(stateReceiver)
                isStateReceiverRegistered = false
            }
            val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
            cm?.unregisterNetworkCallback(networkCallback)
            Log.d("WebRTCService", "Ресиверы и NetworkCallback сняты с регистрации.")
        } catch (e: Exception) {
            Log.w("WebRTCService", "Ошибка снятия регистрации ресивера/колбэка: ${e.message}")
        }
    }

    private fun cleanupWebSocketAndWebRTC() {
        Log.d("WebRTCService", "Очистка WebSocket и WebRTC...")
        cleanupWebRTCResources()
        cleanupWebSocketClient()
    }

    private fun cleanupAllResources() {
        Log.i("WebRTCService", "--- Полная очистка всех ресурсов ---")
        handler.removeCallbacksAndMessages(null)
        cleanupWebSocketAndWebRTC()
        cleanupReceiversAndCallbacks()
        Log.i("WebRTCService", "--- Полная очистка завершена ---")
    }

    private fun stopEverything() {
        Log.w("WebRTCService", "--- ВЫЗОВ stopEverything ---")
        isRunning = false
        isConnected = false
        isConnecting = false
        sendServiceStateUpdate()
        cleanupAllResources()
        stopForeground(true)
        stopSelf()
        Log.w("WebRTCService", "--- Сервис остановлен ---")
    }

    // ========================================================================
    // WebSocket Communication
    // ========================================================================

    private fun connectWebSocket() {
        if (!::webRTCClient.isInitialized || !::eglBase.isInitialized) {
            Log.e("WebRTCService", "ОШИБКА: Попытка подключить WebSocket до инициализации WebRTC!")
            setErrorState("Внутренняя ошибка инициализации.")
            return
        }
        if (isConnected || isConnecting || isUserStopped) {
            Log.d("WebRTCService", "connectWebSocket: Пропуск (Connected=$isConnected, Connecting=$isConnecting, Stopped=$isUserStopped)")
            return
        }

        Log.i("WebRTCService", "Запуск подключения WebSocket к $webSocketUrl")
        isConnecting = true
        updateNotification("Подключение...")
        webSocketClient = WebSocketClient(webSocketListener)
        webSocketClient.connect(webSocketUrl)
    }

    private fun sendJoinMessage() {
        if (!isConnected) {
            Log.w("WebRTCService", "Не могу отправить join: WebSocket не подключен.")
            return
        }
        try {
            // Используем формат, который ожидает ваш Go сервер при первом чтении
            val message = JSONObject().apply {
                put("room", roomName)
                put("username", userName)
                put("isLeader", true) // Android всегда Лидер
            }
            Log.d("WebRTCService", ">>> Отправка init/join сообщения: ${message.toString()}")
            webSocketClient.send(message.toString())
        } catch (e: Exception) {
            Log.e("WebRTCService", "Ошибка отправки join сообщения", e)
            setErrorState("Ошибка отправки данных на сервер.")
        }
    }

    // --- ГЛАВНЫЙ ОБРАБОТЧИК СООБЩЕНИЙ ОТ СЕРВЕРА ---
    private fun handleWebSocketMessage(message: JSONObject) {
        val messageType = message.optString("type", "")
        Log.v("WebRTCService", "Обработка сообщения типа '$messageType'") // Verbose log

        try {
            when (messageType) {
                // --- КОМАНДА ОТ СЕРВЕРА: ПЕРЕПОДКЛЮЧИТЬСЯ И ОТПРАВИТЬ ОФФЕР ---
                "rejoin_and_offer" -> {
                    // *** ВАЖНО: Предполагаем, что сервер присылает имя ведомого ***
                    val follower = message.optString("followerUsername")
                    if (follower.isNotEmpty()) {
                        Log.i("WebRTCService", "<<< Получена команда REJOIN_AND_OFFER для ведомого '$follower'")
                        // Запускаем полный сброс и инициацию оффера
                        resetAndInitiateOffer(follower)
                    } else {
                        // *** ЕСЛИ СЕРВЕР НЕ ПРИСЫЛАЕТ followerUsername - ЭТО ОШИБКА ЛОГИКИ ***
                        Log.e("WebRTCService", "Получена команда 'rejoin_and_offer' БЕЗ 'followerUsername'! Невозможно создать оффер.")
                        setErrorState("Ошибка протокола сервера (нет followerUsername).")
                    }
                }

                // --- ОТВЕТ (ANSWER) ОТ ВЕДОМОГО ---
                "answer" -> {
                    val answerSdp = message.optJSONObject("sdp")
                    val caller = message.optString("caller") // Имя ведомого
                    if (answerSdp != null && caller.isNotEmpty()) {
                        // Обрабатываем ответ ТОЛЬКО от ТЕКУЩЕГО ожидаемого ведомого
                        if (caller == currentFollowerUsername) {
                            Log.i("WebRTCService", "<<< Получен ОТВЕТ (Answer) от ведомого '$caller'")
                            handleAnswer(answerSdp) // Обрабатываем SDP ответа
                        } else {
                            Log.w("WebRTCService", "Получен ответ от НЕОЖИДАЕМОГО ведомого '$caller' (ожидался '$currentFollowerUsername'). Игнорируем.")
                        }
                    } else {
                        Log.w("WebRTCService", "Получен некорректный 'answer': $message")
                    }
                }

                // --- ICE КАНДИДАТ ОТ ВЕДОМОГО ---
                "ice_candidate" -> {
                    val iceData = message.optJSONObject("ice")
                    // Сервер Go не присылает caller для ICE, поэтому проверяем currentFollowerUsername
                    if (iceData != null && currentFollowerUsername != null) {
                        Log.d("WebRTCService", "<<< Получен ICE кандидат (ожидаем от '$currentFollowerUsername')")
                        handleIceCandidate(iceData) // Обрабатываем кандидат
                    } else {
                        if (iceData == null) Log.w("WebRTCService", "Получен некорректный 'ice_candidate' (нет 'ice'): $message")
                        if (currentFollowerUsername == null) Log.w("WebRTCService", "Получен ICE кандидат, но нет активного ведомого ('currentFollowerUsername' is null).")
                    }
                }

                // --- КОМАНДА ПЕРЕКЛЮЧЕНИЯ КАМЕРЫ ОТ ВЕДОМОГО ---
                "switch_camera" -> {
                    val useBack = message.optBoolean("useBackCamera", false)
                    Log.i("WebRTCService", "<<< Получена команда ПЕРЕКЛЮЧИТЬ КАМЕРУ (useBack=$useBack)")
                    if (::webRTCClient.isInitialized) {
                        webRTCClient.switchCamera(useBack) { success ->
                            sendCameraSwitchAck(useBack, success)
                        }
                    } else {
                        Log.e("WebRTCService", "Не могу переключить камеру: WebRTCClient не инициализирован.")
                        sendCameraSwitchAck(useBack, false) // Отправляем ошибку
                    }
                }

                // --- ИНФОРМАЦИЯ О КОМНАТЕ (Для отладки) ---
                "room_info" -> {
                    val data = message.optJSONObject("data")
                    val leader = data?.optString("Leader")
                    val follower = data?.optString("Follower")
                    Log.d("WebRTCService", "<<< Info: Лидер='$leader', Ведомый='$follower'")
                    // Можем обновить currentFollowerUsername, если он изменился и мы не в процессе установки
                    if (follower != null && follower.isNotEmpty() && follower != currentFollowerUsername && webRTCClient.peerConnection?.connectionState() != PeerConnection.PeerConnectionState.CONNECTING) {
                        Log.i("WebRTCService", "room_info показывает нового ведомого '$follower', но команда rejoin_and_offer не приходила? Возможно, нужно инициировать оффер.")
                        // Можно добавить логику инициации оффера здесь, если сервер не шлет rejoin_and_offer
                        // resetAndInitiateOffer(follower)
                    } else if (follower.isNullOrEmpty() && currentFollowerUsername != null) {
                        Log.i("WebRTCService", "room_info показывает отсутствие ведомого. Сбрасываем currentFollowerUsername.")
                        currentFollowerUsername = null
                        // Возможно, нужно закрыть PeerConnection
                        webRTCClient.closePeerConnection("Follower left based on room_info")
                    }
                }

                // --- ПРИНУДИТЕЛЬНОЕ ОТКЛЮЧЕНИЕ ---
                "force_disconnect" -> {
                    val reason = message.optString("data", "Принудительное отключение")
                    Log.w("WebRTCService", "<<< Получена команда FORCE_DISCONNECT. Причина: $reason")
                    setErrorState("Отключен сервером: $reason")
                    isUserStopped = true
                    stopEverything()
                }

                // --- ОШИБКА ОТ СЕРВЕРА ---
                "error" -> {
                    val errorMsg = message.optString("data", "Неизвестная ошибка")
                    Log.e("WebRTCService", "<<< Получена ОШИБКА от сервера: $errorMsg")
                    setErrorState("Ошибка сервера: $errorMsg")
                }


                // --- УДАЛЕНО: Лидер не обрабатывает "offer" ---
                // "offer" -> { Log.w("WebRTCService", "Получен 'offer', но Android (Лидер) игнорирует его.") }

                // --- Опционально: Оценка сети от сервера ---
                "bandwidth_estimation" -> { /* ... обработка ... */ }

                else -> Log.w("WebRTCService", "Получен неизвестный тип сообщения: '$messageType'")
            }
        } catch (e: Exception) {
            Log.e("WebRTCService", "Критическая ошибка при обработке WebSocket сообщения ($messageType)", e)
            setErrorState("Ошибка обработки сообщения: ${e.message}")
        }
    }


    // ========================================================================
    // WebRTC SDP and ICE Handling (Leader Role - Отправка Оффера, Прием Ответа)
    // ========================================================================

    // --- НОВЫЙ МЕТОД: Сброс WebRTC и инициация оффера ---
    private fun resetAndInitiateOffer(targetUsername: String?) {
        if (targetUsername.isNullOrEmpty()) {
            Log.e("WebRTCService", "resetAndInitiateOffer: Не указан 'targetUsername'.")
            setErrorState("Ошибка: нет цели для оффера.")
            return
        }
        Log.i("WebRTCService", "--- Запуск resetAndInitiateOffer для '$targetUsername' ---")
        updateNotification("Переподключение к '$targetUsername'...")

        // 1. Полный сброс WebRTC клиента
        // cleanupWebRTCResources() // Закрываем старые ресурсы
        // initializeWebRTC()     // Создаем новые

        // --- Альтернатива: Пересоздание только PeerConnection ---
        if (::webRTCClient.isInitialized) {
            Log.d("WebRTCService", "Пересоздаем PeerConnection внутри WebRTCClient...")
            webRTCClient.recreatePeerConnection() // ПРЕДПОЛАГАЕМ НАЛИЧИЕ ЭТОГО МЕТОДА В WebRTCClient
        } else {
            Log.w("WebRTCService", "WebRTCClient не инициализирован, выполняем полную инициализацию...")
            initializeWebRTC()
        }
        // --- Конец альтернативы ---


        // 2. Сохраняем имя нового ведомого
        currentFollowerUsername = targetUsername

        // 3. Инициируем создание оффера (с небольшой задержкой для надежности)
        handler.postDelayed({
            if (::webRTCClient.isInitialized && webRTCClient.peerConnection != null) {
                Log.d("WebRTCService", "Вызов createOffer для '$targetUsername' после сброса.")
                createOffer(targetUsername) // Вызываем создание оффера
            } else {
                Log.e("WebRTCService", "Не удалось инициировать оффер после сброса: WebRTCClient или PeerConnection не готовы.")
                setErrorState("Ошибка WebRTC после сброса.")
                currentFollowerUsername = null // Сбрасываем, т.к. оффер не создан
            }
        }, 500) // 0.5 сек задержка
    }


    // --- ИЗМЕНЕНО: Создание Оффера (теперь принимает targetUsername) ---
    private fun createOffer(targetUsername: String) {
        if (!::webRTCClient.isInitialized || webRTCClient.peerConnection == null) {
            Log.e("WebRTCService", "createOffer: WebRTCClient или PeerConnection не инициализирован.")
            setErrorState("Ошибка WebRTC: не готово к офферу.")
            return
        }
        Log.i("WebRTCService", ">>> Создание ОФФЕРА для '$targetUsername'...")
        updateNotification("Создание оффера для '$targetUsername'")

        // Ограничения для оффера (что мы готовы ПРИНИМАТЬ)
        val constraints = MediaConstraints().apply {
            mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveAudio", "true")) // Принимаем аудио
            mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveVideo", "false")) // НЕ принимаем видео
        }

        try {
            webRTCClient.peerConnection.createOffer(object : SdpObserverAdapter() { // Используем адаптер
                override fun onCreateSuccess(offerDescription: SessionDescription) {
                    Log.i("WebRTCService", ">>> Оффер УСПЕШНО создан для '$targetUsername'")
                    // Устанавливаем оффер как ЛОКАЛЬНОЕ описание
                    setLocalDescription(offerDescription, targetUsername)
                }
                override fun onCreateFailure(error: String?) {
                    Log.e("WebRTCService", "XXX Ошибка создания оффера для '$targetUsername': $error")
                    setErrorState("Ошибка создания оффера: $error")
                    if (targetUsername == currentFollowerUsername) currentFollowerUsername = null // Сбрасываем цель
                }
            }, constraints)
        } catch (e: Exception) {
            Log.e("WebRTCService", "Критическая ошибка вызова createOffer", e)
            setErrorState("Ошибка WebRTC: ${e.message}")
            if (targetUsername == currentFollowerUsername) currentFollowerUsername = null
        }
    }

    // --- НОВЫЙ МЕТОД: Установка локального описания (после создания оффера) ---
    private fun setLocalDescription(desc: SessionDescription, targetUsername: String) {
        if (!::webRTCClient.isInitialized || webRTCClient.peerConnection == null) {
            Log.e("WebRTCService", "setLocalDescription: WebRTCClient или PeerConnection не инициализирован.")
            return
        }
        // Проверяем, что цель все еще актуальна
        if (targetUsername != currentFollowerUsername) {
            Log.w("WebRTCService", "setLocalDescription: Цель '$targetUsername' уже не актуальна (текущая: '$currentFollowerUsername'). Отмена установки.")
            return
        }
        Log.d("WebRTCService", ">>> Установка ЛОКАЛЬНОГО описания (${desc.type}) для '$targetUsername'")
        webRTCClient.peerConnection.setLocalDescription(object : SdpObserverAdapter() {
            override fun onSetSuccess() {
                Log.i("WebRTCService", ">>> Локальное описание (${desc.type}) УСПЕШНО установлено для '$targetUsername'. Отправка...")
                // После успеха отправляем оффер на сервер
                sendSdpOffer(desc, targetUsername)
            }
            override fun onSetFailure(error: String?) {
                Log.e("WebRTCService", "XXX Ошибка установки локального описания (${desc.type}) для '$targetUsername': $error")
                setErrorState("Ошибка установки SDP: $error")
                if (targetUsername == currentFollowerUsername) currentFollowerUsername = null
            }
        }, desc)
    }

    // --- НОВЫЙ МЕТОД: Отправка Оффера на сервер ---
    private fun sendSdpOffer(desc: SessionDescription, targetUsername: String) {
        if (targetUsername != currentFollowerUsername) {
            Log.w("WebRTCService", "sendSdpOffer: Цель '$targetUsername' уже не актуальна (текущая: '$currentFollowerUsername'). Отмена отправки.")
            return
        }
        if (!isConnected) {
            Log.w("WebRTCService", "Не могу отправить оффер: WebSocket не подключен.")
            return
        }
        Log.i("WebRTCService", ">>> Отправка ОФФЕРА ведомому '$targetUsername'...")
        try {
            val sdpJson = JSONObject().apply {
                put("type", desc.type.canonicalForm())
                put("sdp", desc.description)
            }
            val message = JSONObject().apply {
                put("type", "offer")
                put("target", targetUsername) // ВАЖНО: Указываем цель
                put("sdp", sdpJson)
                put("room", roomName)
                put("username", userName)
            }
            webSocketClient.send(message.toString())
            Log.d("WebRTCService", "Оффер отправлен.")
            updateNotification("Оффер отправлен '$targetUsername'")
        } catch (e: Exception) {
            Log.e("WebRTCService", "XXX Ошибка отправки оффера", e)
            setErrorState("Ошибка отправки SDP: ${e.message}")
            if (targetUsername == currentFollowerUsername) currentFollowerUsername = null
        }
    }

    // --- ИЗМЕНЕНО: Обработка Ответа (Answer) ---
    private fun handleAnswer(answerSdpJson: JSONObject) {
        if (currentFollowerUsername == null) {
            Log.w("WebRTCService", "handleAnswer: Получен ответ, но нет активного 'currentFollowerUsername'. Игнорируем.")
            return
        }
        if (!::webRTCClient.isInitialized || webRTCClient.peerConnection == null) {
            Log.e("WebRTCService", "handleAnswer: WebRTCClient или PeerConnection не инициализирован.")
            return
        }
        try {
            val sdpType = answerSdpJson.optString("type", "").lowercase()
            val sdpDescription = answerSdpJson.optString("sdp", "")

            if (sdpType != "answer" || sdpDescription.isEmpty()) {
                Log.e("WebRTCService", "Некорректный формат SDP ответа: $answerSdpJson")
                setErrorState("Неверный формат ответа.")
                return
            }

            val answerDescription = SessionDescription(SessionDescription.Type.ANSWER, sdpDescription)

            Log.d("WebRTCService", "<<< Установка УДАЛЕННОГО описания (Answer) от '$currentFollowerUsername'")
            webRTCClient.peerConnection.setRemoteDescription(object : SdpObserverAdapter() {
                override fun onSetSuccess() {
                    Log.i("WebRTCService", "<<< Удаленное описание (Answer) от '$currentFollowerUsername' УСПЕШНО установлено.")
                    updateNotification("Соединение с '$currentFollowerUsername' устанавливается...")
                    // Здесь ICE кандидаты должны начать обмен, и соединение установится
                }
                override fun onSetFailure(error: String?) {
                    Log.e("WebRTCService", "XXX Ошибка установки удаленного описания (Answer) от '$currentFollowerUsername': $error")
                    setErrorState("Ошибка обработки ответа: $error")
                    // Если не удалось установить ответ, соединение не будет установлено
                    webRTCClient.closePeerConnection("Failed to set remote answer")
                    currentFollowerUsername = null // Сбрасываем ведомого
                }
            }, answerDescription)
        } catch (e: Exception) {
            Log.e("WebRTCService", "Критическая ошибка при обработке ответа", e)
            setErrorState("Ошибка обработки ответа: ${e.message}")
            webRTCClient.closePeerConnection("Answer handling error")
            currentFollowerUsername = null
        }
    }

    // --- ИЗМЕНЕНО: Отправка локального ICE кандидата ---
    private fun sendIceCandidate(candidate: IceCandidate, targetUsername: String?) {
        if (targetUsername == null) {
            // Log.v("WebRTCService", "sendIceCandidate: Пропуск, нет targetUsername.") // Verbose log
            return // Не отправляем, если не знаем кому
        }
        // Проверяем, что цель все еще актуальна
        if (targetUsername != currentFollowerUsername) {
            Log.w("WebRTCService", "sendIceCandidate: Цель '$targetUsername' уже не актуальна (текущая: '$currentFollowerUsername'). Отмена отправки.")
            return
        }
        if (!isConnected) {
            Log.w("WebRTCService", "Не могу отправить ICE: WebSocket не подключен.")
            return
        }
        // Log.d("WebRTCService", ">>> Отправка ICE кандидата ведомому '$targetUsername'...") // Logged in observer
        try {
            val iceJson = JSONObject().apply {
                put("sdpMid", candidate.sdpMid)
                put("sdpMLineIndex", candidate.sdpMLineIndex)
                put("candidate", candidate.sdp)
            }
            val message = JSONObject().apply {
                put("type", "ice_candidate")
                put("target", targetUsername) // ВАЖНО: Указываем цель
                put("ice", iceJson)
                put("room", roomName)
                put("username", userName)
            }
            webSocketClient.send(message.toString())
        } catch (e: Exception) {
            Log.e("WebRTCService", "XXX Ошибка отправки ICE кандидата", e)
        }
    }


    // --- ИЗМЕНЕНО: Обработка ICE кандидата от ведомого ---
    private fun handleIceCandidate(iceJson: JSONObject) {
        if (currentFollowerUsername == null) {
            Log.w("WebRTCService", "handleIceCandidate: Получен ICE, но нет активного 'currentFollowerUsername'. Игнорируем.")
            return
        }
        if (!::webRTCClient.isInitialized || webRTCClient.peerConnection == null) {
            Log.e("WebRTCService", "handleIceCandidate: WebRTCClient или PeerConnection не инициализирован.")
            return
        }
        try {
            val sdpMid = iceJson.optString("sdpMid")
            val sdpMLineIndex = iceJson.optInt("sdpMLineIndex", -1)
            val sdp = iceJson.optString("candidate")

            if (sdpMid.isNullOrEmpty() || sdpMLineIndex == -1 || sdp.isNullOrEmpty()) {
                Log.e("WebRTCService", "Некорректный формат ICE кандидата: $iceJson")
                return
            }

            val iceCandidate = IceCandidate(sdpMid, sdpMLineIndex, sdp)

            Log.d("WebRTCService", "<<< Добавление полученного ICE кандидата от '$currentFollowerUsername'")
            // Добавляем кандидат в PeerConnection
            webRTCClient.peerConnection.addIceCandidate(iceCandidate)

        } catch (e: Exception) {
            Log.e("WebRTCService", "Критическая ошибка при обработке ICE кандидата", e)
            setErrorState("Ошибка обработки ICE: ${e.message}")
        }
    }

    // --- ОТПРАВКА ПОДТВЕРЖДЕНИЯ ПЕРЕКЛЮЧЕНИЯ КАМЕРЫ ---
    private fun sendCameraSwitchAck(useBackCamera: Boolean, success: Boolean) {
        if (!isConnected) return
        val targetPeer = currentFollowerUsername // Отправляем текущему ведомому
        if (targetPeer == null) {
            Log.w("WebRTCService", "sendCameraSwitchAck: Некому отправлять (currentFollowerUsername is null)")
            return
        }
        try {
            val message = JSONObject().apply {
                put("type", "switch_camera_ack")
                put("useBackCamera", useBackCamera)
                put("success", success)
                put("target", targetPeer) // Указываем цель
                put("room", roomName)
                put("username", userName)
            }
            webSocketClient.send(message.toString())
            Log.d("WebRTCService", ">>> Отправлено подтверждение switch_camera (success=$success) для '$targetPeer'")
        } catch (e: Exception) {
            Log.e("WebRTCService", "Ошибка отправки switch_camera_ack", e)
        }
    }

    // --- Адаптация качества видео ---
    private fun adjustVideoQualityBasedOnStats() {
        if (!::webRTCClient.isInitialized || webRTCClient.peerConnection == null) return

        webRTCClient.peerConnection.getStats { statsReport ->
            if (statsReport == null) return@getStats
            try {
                var videoPacketsLost = 0L
                var videoPacketsSent = 0L
                var availableSendBandwidth = 0.0 // Используем Double

                statsReport.statsMap.values.forEach { stats ->
                    when (stats.type) {
                        "outbound-rtp" -> {
                            // Проверяем, что это видео поток
                            if (stats.members["mediaType"] == "video" || stats.id.contains("video", ignoreCase = true)) {
                                videoPacketsLost += (stats.members["packetsLost"] as? Number)?.toLong() ?: 0L
                                videoPacketsSent += (stats.members["packetsSent"] as? Number)?.toLong() ?: 1L // Избегаем деления на ноль
                            }
                        }
                        "candidate-pair" -> {
                            if (stats.members["state"] == "succeeded" && stats.members["writable"] == true) {
                                // availableOutgoingBitrate может быть Double или Long
                                val bw = stats.members["availableOutgoingBitrate"]
                                availableSendBandwidth = when(bw) {
                                    is Number -> bw.toDouble()
                                    else -> 0.0
                                }
                            }
                        }
                    }
                }

                if (videoPacketsSent > 50) { // Анализируем только при достаточном количестве пакетов
                    val lossRate = if (videoPacketsSent > 0) videoPacketsLost.toDouble() / videoPacketsSent.toDouble() else 0.0
                    Log.d("WebRTCService", "Stats: LossRate=${String.format("%.3f", lossRate)}, AvailableBW=${String.format("%.0f", availableSendBandwidth / 1000)} kbps, PacketsSent=$videoPacketsSent")

                    handler.post { // Выполняем изменения в основном потоке
                        // Логика адаптации (примерная, можно настроить)
                        val currentMaxBitrate = webRTCClient.getCurrentMaxBitrate() // Нужен метод в WebRTCClient
                        val currentWidth = webRTCClient.getCurrentCaptureWidth() // Нужен метод в WebRTCClient

                        when {
                            // Сильное ухудшение: большие потери или очень низкая пропускная способность -> Мин. качество
                            lossRate > 0.15 || (availableSendBandwidth > 0 && availableSendBandwidth < 250000) -> {
                                if (currentWidth > 480 || currentMaxBitrate > 300000) reduceVideoQuality(480, 360, 15, 150000, 200000, 300000)
                            }
                            // Умеренное ухудшение: средние потери или низкая пропускная способность -> Среднее/низкое качество
                            lossRate > 0.08 || (availableSendBandwidth > 0 && availableSendBandwidth < 450000) -> {
                                if (currentWidth > 640 || currentMaxBitrate > 500000) reduceVideoQuality(640, 480, 15, 250000, 350000, 500000)
                            }
                            // Улучшение: низкие потери и достаточная пропускная способность -> Среднее/высокое качество
                            lossRate < 0.03 && availableSendBandwidth > 800000 -> {
                                if (currentWidth < 854 || currentMaxBitrate < 800000) increaseVideoQuality(854, 480, 20, 500000, 650000, 800000)
                            }
                            // Значительное улучшение: очень низкие потери и высокая пропускная способность -> Высокое качество (осторожно)
                            lossRate < 0.01 && availableSendBandwidth > 1500000 -> {
                                if (currentWidth < 1280 || currentMaxBitrate < 1200000) increaseVideoQuality(1280, 720, 24, 800000, 1000000, 1200000)
                            }
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e("WebRTCService", "Ошибка обработки статистики WebRTC", e)
            }
        }
    }

    // Обновленные функции изменения качества
    private fun reduceVideoQuality(width: Int, height: Int, fps: Int, minRate: Int, startRate: Int, maxRate: Int) {
        if (!::webRTCClient.isInitialized) return
        Log.w("WebRTCService", "--- Снижение качества видео до ${width}x${height}@${fps}fps, Rate: ${startRate/1000} kbps ---")
        try {
            webRTCClient.changeCaptureFormat(width, height, fps) // Нужен метод в WebRTCClient
            webRTCClient.setVideoEncoderBitrate(minRate, startRate, maxRate)
            updateNotification("Качество снижено (${width}p)")
        } catch (e: Exception) {
            Log.e("WebRTCService", "Ошибка снижения качества видео", e)
        }
    }

    private fun increaseVideoQuality(width: Int, height: Int, fps: Int, minRate: Int, startRate: Int, maxRate: Int) {
        if (!::webRTCClient.isInitialized) return
        Log.i("WebRTCService", "+++ Повышение качества видео до ${width}x${height}@${fps}fps, Rate: ${startRate/1000} kbps +++")
        try {
            webRTCClient.changeCaptureFormat(width, height, fps) // Нужен метод в WebRTCClient
            webRTCClient.setVideoEncoderBitrate(minRate, startRate, maxRate)
            updateNotification("Качество повышено (${width}p)")
        } catch (e: Exception) {
            Log.e("WebRTCService", "Ошибка повышения качества видео", e)
        }
    }


    // --- УДАЛЕНО: handleOffer() и createAnswer() ---

    // --- Вспомогательные функции без изменений ---
    private fun scheduleReconnect() {
        if (isUserStopped || isConnecting) return
        handler.removeCallbacksAndMessages(null) // ОСТОРОЖНО: удаляет и health check/bandwidth
        reconnectAttempts++
        val delay = (5000L * Math.pow(1.5, (reconnectAttempts - 1).toDouble())).toLong().coerceAtMost(60000L)
        Log.d("WebRTCService", "Планируем реконнект через ${delay / 1000} сек (попытка $reconnectAttempts)")
        updateNotification("Реконнект через ${delay / 1000}с...")
        handler.postDelayed({ if (!isConnected && !isUserStopped) reconnect() }, delay)
        // Перезапускаем health check и bandwidth estimation
        handler.postDelayed(healthCheckRunnable, 60000)
        handler.postDelayed(bandwidthEstimationRunnable, 15000)
    }

    private fun reconnect() {
        if (isConnected || isConnecting || isUserStopped) return
        Log.i("WebRTCService", "--- Запуск RECONNECT ---")
        updateNotification("Переподключение...")
        cleanupWebSocketAndWebRTC()
        isConnecting = false
        isConnected = false
        currentFollowerUsername = null
        handler.postDelayed({
            if (!isUserStopped) {
                initializeWebRTC() // Переинициализация WebRTC
                connectWebSocket() // Новая попытка подключения WS
            }
        }, 500)
    }

    private fun setErrorState(errorMessage: String?) {
        val message = errorMessage ?: "Неизвестная ошибка"
        Log.e("WebRTCService", "Установлено состояние ошибки: $message")
        updateNotification("Ошибка: ${message.take(40)}...")
        // sendErrorBroadcast(message) // Если нужно уведомлять Activity
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(channelId, "WebRTC Service", NotificationManager.IMPORTANCE_LOW)
            (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).createNotificationChannel(channel)
        }
    }

    private fun createNotification(contentText: String = "Активен"): Notification {
        val stopIntent = Intent(this, WebRTCService::class.java).apply { action = "STOP" }
        val stopPendingIntent: PendingIntent = PendingIntent.getService(this, 0, stopIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val mainActivityIntent = Intent(this, MainActivity::class.java).apply { flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK; putExtra("room_name", roomName) }
        val mainActivityPendingIntent: PendingIntent = PendingIntent.getActivity(this, 1, mainActivityIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

        return NotificationCompat.Builder(this, channelId)
            .setContentTitle("Ardua Vision (Лидер)")
            .setContentText(contentText)
            .setSmallIcon(R.drawable.ic_notification)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .setContentIntent(mainActivityPendingIntent)
            .addAction(R.drawable.ic_stop, "Стоп", stopPendingIntent)
            .build()
    }

    private fun updateNotification(text: String) {
        val notification = createNotification(text)
        try {
            (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).notify(notificationId, notification)
        } catch (e: Exception) { Log.e("WebRTCService", "Ошибка обновления уведомления", e)}
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

    fun isInitialized(): Boolean = ::webSocketClient.isInitialized && ::webRTCClient.isInitialized && ::eglBase.isInitialized

    private fun sendServiceStateUpdate(){
        val intent = Intent(ACTION_SERVICE_STATE).apply {
            putExtra(EXTRA_IS_RUNNING, isRunning)
        }
        sendBroadcast(intent)
    }

    // Обертка для Compat методов
    object ConnectivityManagerCompat {
        fun isNetworkAvailable(cm: ConnectivityManager?): Boolean {
            if (cm == null) return false
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val network = cm.activeNetwork ?: return false
                val capabilities = cm.getNetworkCapabilities(network) ?: return false
                return capabilities.hasCapability(android.net.NetworkCapabilities.NET_CAPABILITY_INTERNET)
            } else {
                @Suppress("DEPRECATION")
                val networkInfo = cm.activeNetworkInfo ?: return false
                @Suppress("DEPRECATION")
                return networkInfo.isConnected
            }
        }
    }

} // --- Конец класса WebRTCService ---

// --- Вспомогательный адаптер для SdpObserver ---
open class SdpObserverAdapter : SdpObserver {
override fun onCreateSuccess(desc: SessionDescription?) {}
override fun onCreateFailure(error: String?) {}
override fun onSetSuccess() {}
override fun onSetFailure(error: String?) {}
}

// --- НЕ ЗАБУДЬТЕ ДОБАВИТЬ МЕТОДЫ В WebRTCClient.kt ---
// Вам нужно добавить следующие методы в WebRTCClient.kt (или аналогичные):
// fun recreatePeerConnection() // Должен закрыть старый PC и создать новый с тем же observer
// fun startLocalVideo() // Должен запустить захват с камеры
// fun changeCaptureFormat(width: Int, height: Int, fps: Int) // Для изменения разрешения/fps
// fun getCurrentMaxBitrate(): Int // Должен возвращать текущее значение maxBitrateBps
// fun getCurrentCaptureWidth(): Int // Должен возвращать текущую ширину захвата
// fun closePeerConnection(reason: String) // Должен безопасно закрывать только PeerConnection
// --- КОНЕЦ НАПОМИНАНИЯ ---