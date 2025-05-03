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
import android.net.NetworkCapabilities // Нужен для проверки типа сети
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
    private var webRTCClient: WebRTCClient? = null // Сделаем nullable для безопасности
    private lateinit var eglBase: EglBase

    private var isConnected = false // Флаг WebSocket подключения
    private var isConnecting = false // Флаг процесса WebSocket подключения

    private var reconnectAttempts = 0
    // private val maxReconnectAttempts = 10 // Можно использовать, но экспоненциальная задержка уже ограничивает
    private val handler = Handler(Looper.getMainLooper()) // Handler для основного потока

    // SurfaceViewRenderer для локального превью создается внутри сервиса
    private lateinit var localView: SurfaceViewRenderer
    // remoteView не нужен Лидеру для отображения

    private var roomName = "default_room" // Будет перезаписано при старте
    private val userName = Build.MODEL ?: "AndroidDevice_${System.currentTimeMillis() % 1000}"
    private val webSocketUrl = "wss://ardua.site/ws" // Убедитесь, что URL правильный

    private val notificationId = 1
    private val channelId = "webrtc_service_channel"


    private var isUserStopped = false // Флаг, что сервис был остановлен пользователем
    private var isConnectivityReceiverRegistered = false
    // private var isStateReceiverRegistered = false // Убираем флаг для stateReceiver

    // --- Переменные для WebRTC логики ---
    private var currentFollowerUsername: String? = null // Храним имя текущего ведомого

    inner class LocalBinder : Binder() {
        fun getService(): WebRTCService = this@WebRTCService
    }

    override fun onBind(intent: Intent?): IBinder = binder

    // --- BroadcastReceiver для состояния сети (старый способ, оставляем как fallback) ---
    private val connectivityReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            if (intent.action == ConnectivityManager.CONNECTIVITY_ACTION) {
                val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
                val activeNetwork = cm.activeNetworkInfo // Устаревший способ, но для ресивера подходит
                val hasConnection = activeNetwork?.isConnectedOrConnecting == true

                Log.d("WebRTCService", "ConnectivityReceiver: Network change detected. Has connection: $hasConnection")
                if (hasConnection && !isConnected && !isConnecting && !isUserStopped) {
                    Log.d("WebRTCService", "ConnectivityReceiver: Connection available, attempting reconnect if needed.")
                    // Вызываем reconnect через handler для выполнения в основном потоке
                    handler.post { reconnect() }
                }
            }
        }
    }

    // --- WebSocket Listener ---
    private val webSocketListener = object : WebSocketListener() {
        override fun onMessage(webSocket: okhttp3.WebSocket, text: String) {
            Log.d("WebRTCService", "WebSocket Received: $text")
            try {
                val message = JSONObject(text)
                // Запускаем обработку в основном потоке, т.к. могут быть UI операции или вызовы WebRTC API
                handler.post { handleWebSocketMessage(message) }
            } catch (e: Exception) {
                Log.e("WebRTCService", "WebSocket message parse error", e)
            }
        }

        override fun onOpen(webSocket: okhttp3.WebSocket, response: okhttp3.Response) {
            Log.d("WebRTCService", "WebSocket ПОДКЛЮЧЕН для комнаты: $roomName")
            handler.post {
                isConnected = true
                isConnecting = false
                reconnectAttempts = 0 // Сбрасываем счетчик попыток
                updateNotification("Подключен к комнате: $roomName")
                // Отправляем сообщение о входе на сервер
                sendJoinMessage()
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
            Log.d("WebRTCService", "WebSocket ОТКЛЮЧЕН: код=$code, причина=$reason")
            handler.post {
                isConnected = false
                isConnecting = false
                val wasConnectedToFollower = currentFollowerUsername != null
                currentFollowerUsername = null // Сбрасываем ведомого

                // Закрываем WebRTCClient, если он был инициализирован
                if (wasConnectedToFollower) {
                    webRTCClient?.close("WebSocket closed (code=$code)")
                }

                if (code != 1000 && !isUserStopped) { // 1000 - нормальное закрытие
                    updateNotification("Соединение потеряно ($code). Переподключение...")
                    scheduleReconnect()
                } else if (isUserStopped) {
                    updateNotification("Остановлен пользователем.")
                    // Не переподключаемся
                } else {
                    updateNotification("Соединение закрыто.")
                    // Можно запланировать реконнект, если это не было штатное закрытие из логики приложения
                    if (!isUserStopped) scheduleReconnect()
                }
            }
        }

        override fun onFailure(webSocket: okhttp3.WebSocket, t: Throwable, response: okhttp3.Response?) {
            Log.e("WebRTCService", "WebSocket ОШИБКА: ${t.message}", t)
            handler.post {
                isConnected = false
                isConnecting = false
                val wasConnectedToFollower = currentFollowerUsername != null
                currentFollowerUsername = null // Сбрасываем ведомого

                // Закрываем WebRTCClient, если он был инициализирован
                if (wasConnectedToFollower) {
                    webRTCClient?.close("WebSocket failure: ${t.message}")
                }

                updateNotification("Ошибка сети: ${t.message?.take(30)}...")
                if (!isUserStopped) {
                    scheduleReconnect()
                }
            }
        }
    }

    // --- NetworkCallback для современного отслеживания сети ---
    private val networkCallback = object : ConnectivityManager.NetworkCallback() {
        private val activeNetworks = mutableSetOf<Network>()

        override fun onAvailable(network: Network) {
            super.onAvailable(network)
            activeNetworks.add(network)
            val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
            val capabilities = cm.getNetworkCapabilities(network)
            val hasInternet = capabilities?.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) == true
            Log.d("WebRTCService", "NetworkCallback: Сеть ДОСТУПНА ${network}. Has internet: $hasInternet")

            // Пытаемся переподключиться, если появилась хотя бы одна сеть с интернетом
            // и если мы не подключены, не в процессе подключения и не остановлены
            if (hasInternet && !isConnected && !isConnecting && !isUserStopped) {
                Log.d("WebRTCService", "NetworkCallback: Сеть с интернетом доступна, пытаемся переподключиться.")
                // Запускаем reconnect через handler
                handler.post { reconnect() }
            }
        }

        override fun onLost(network: Network) {
            super.onLost(network)
            activeNetworks.remove(network)
            Log.w("WebRTCService", "NetworkCallback: Сеть ПОТЕРЯНА ${network}.")
            if (activeNetworks.isEmpty()) {
                Log.w("WebRTCService", "NetworkCallback: Все сети потеряны.")
                // Можно обновить уведомление, но не пытаемся переподключаться здесь
                handler.post {
                    if (!isUserStopped) updateNotification("Сеть потеряна")
                }
            }
        }
    }

    // --- Runnable для периодической проверки "здоровья" сервиса ---
    private val healthCheckRunnable = object : Runnable {
        override fun run() {
            if (!isUserStopped) {
                Log.d("WebRTCService", "Health Check: Проверка состояния...")
                if (!isConnected && !isConnecting) {
                    Log.w("WebRTCService", "Health Check: Обнаружено отсутствие WebSocket соединения, попытка переподключения.")
                    reconnect() // Используем основную функцию reconnect
                }
                // Планируем следующую проверку только если сервис все еще работает
                if (isRunning) {
                    handler.postDelayed(this, 60000) // Проверка каждую минуту
                }
            } else {
                Log.d("WebRTCService", "Health Check: Сервис остановлен пользователем, проверка отменена.")
            }
        }
    }

    // ========================================================================
    // Lifecycle Methods (onCreate, onStartCommand, onDestroy)
    // ========================================================================

    @SuppressLint("UnspecifiedRegisterReceiverFlag", "MissingPermission") // Добавили MissingPermission
    override fun onCreate() {
        super.onCreate()
        isRunning = true
        isUserStopped = false // Сбрасываем флаг

        // Инициализация имени комнаты
        val sharedPrefs = getSharedPreferences("WebRTCPrefs", Context.MODE_PRIVATE)
        roomName = sharedPrefs.getString("last_used_room", "") ?: "default_room_${System.currentTimeMillis() % 1000}"
        currentRoomName = roomName
        Log.d("WebRTCService", "onCreate: Сервис создается для комнаты: $roomName")

        sendServiceStateUpdate() // Уведомляем о старте

        try {
            // Инициализация EglBase ДО WebRTC клиента
            eglBase = EglBase.create()
            Log.d("WebRTCService", "EglBase создан: ${eglBase.eglBaseContext}")

            // Создаем SurfaceViewRenderer для локального превью
            localView = SurfaceViewRenderer(this).apply {
                init(eglBase.eglBaseContext, null)
                setMirror(true) // Обычно для фронтальной камеры
                setEnableHardwareScaler(true)
            }
            Log.d("WebRTCService", "Local SurfaceViewRenderer инициализирован")


            // Регистрация ресиверов и колбэков
            // ИспользуемContextCompat для API 33+ (если нужно будет экспортировать)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                registerReceiver(connectivityReceiver, IntentFilter(ConnectivityManager.CONNECTIVITY_ACTION), RECEIVER_NOT_EXPORTED)
                // registerReceiver(stateReceiver, IntentFilter(ACTION_SERVICE_STATE), RECEIVER_NOT_EXPORTED) // УБРАЛИ stateReceiver
            } else {
                registerReceiver(connectivityReceiver, IntentFilter(ConnectivityManager.CONNECTIVITY_ACTION))
                // registerReceiver(stateReceiver, IntentFilter(ACTION_SERVICE_STATE)) // УБРАЛИ stateReceiver
            }
            isConnectivityReceiverRegistered = true
            // isStateReceiverRegistered = true // УБРАЛИ

            createNotificationChannel()
            startForegroundService() // Запуск в Foreground режиме

            initializeWebRTC() // Инициализация WebRTC клиента (без старта видео)
            // Старт видео будет после инициализации клиента
            webRTCClient?.startLocalVideo() // Запускаем видео здесь

            registerNetworkCallback() // Регистрация современного NetworkCallback

            connectWebSocket() // Подключение к WebSocket ПОСЛЕ инициализации WebRTC

            // Запуск health check через 30 сек
            handler.postDelayed(healthCheckRunnable, 30000)

        } catch (e: Exception) {
            Log.e("WebRTCService", "КРИТИЧЕСКАЯ ОШИБКА в onCreate", e)
            isUserStopped = true // Считаем это фатальной ошибкой
            setErrorState("Критическая ошибка запуска: ${e.message}")
            stopEverything() // Пытаемся корректно остановить
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d("WebRTCService", "onStartCommand: Action = ${intent?.action}, Flags = $flags")

        when (intent?.action) {
            "STOP" -> {
                Log.i("WebRTCService", "Получена команда STOP")
                isUserStopped = true // Устанавливаем флаг
                stopEverything()
                return START_NOT_STICKY // Не перезапускать
            }
            else -> {
                // Обычный запуск или перезапуск системой
                isUserStopped = false // Сбрасываем флаг

                // Обновляем имя комнаты при перезапуске
                val sharedPrefs = getSharedPreferences("WebRTCPrefs", Context.MODE_PRIVATE)
                val lastRoomName = sharedPrefs.getString("last_used_room", "") ?: ""
                if (lastRoomName.isNotEmpty() && lastRoomName != roomName) {
                    Log.w("WebRTCService", "Обнаружено изменение имени комнаты при перезапуске: $lastRoomName (было $roomName)")
                    roomName = lastRoomName
                    currentRoomName = roomName
                    // TODO: Нужно ли переподключаться к новой комнате? Вероятно, да.
                    // handler.post { reconnect() } // Переподключиться с новым именем
                } else {
                    roomName = if (lastRoomName.isNotEmpty()) lastRoomName else "default_room_${System.currentTimeMillis() % 1000}"
                    currentRoomName = roomName
                }


                Log.d("WebRTCService", "Сервис стартует/перезапускается для комнаты: $roomName")
                updateNotification("Активен в комнате: $roomName")

                // Проверяем, нужно ли инициализировать WebRTC (если сервис был убит)
                if (webRTCClient == null || !::eglBase.isInitialized) {
                    Log.w("WebRTCService", "onStartCommand: WebRTC не инициализирован, инициализируем заново.")
                    // Нужен EglBase
                    if (!::eglBase.isInitialized) {
                        eglBase = EglBase.create()
                        // Нужен localView
                        localView = SurfaceViewRenderer(this).apply {
                            init(eglBase.eglBaseContext, null)
                            setMirror(true)
                            setEnableHardwareScaler(true)
                        }
                    }
                    initializeWebRTC()
                    webRTCClient?.startLocalVideo() // Запускаем видео после инициализации
                }

                // Пытаемся подключиться к WebSocket, если еще не
                if (!isConnected && !isConnecting) {
                    Log.d("WebRTCService", "onStartCommand: Не подключены к WS, запускаем процесс подключения.")
                    connectWebSocket()
                } else {
                    Log.d("WebRTCService", "onStartCommand: Уже подключены к WS или в процессе подключения.")
                }

                isRunning = true
                sendServiceStateUpdate()
                return START_STICKY // Перезапускать сервис
            }
        }
    }

    override fun onDestroy() {
        Log.w("WebRTCService", "onDestroy: Сервис уничтожается. IsUserStopped: $isUserStopped")
        isRunning = false
        sendServiceStateUpdate() // Уведомляем об остановке

        // Снимаем колбэки и ресиверы
        cleanupReceiversAndCallbacks()

        // Останавливаем health check
        handler.removeCallbacks(healthCheckRunnable)
        // Отменяем запланированные реконнекты
        handler.removeCallbacksAndMessages(null) // Удаляем ВСЕ сообщения из очереди handler'а

        // Закрываем ресурсы, если это не остановка пользователем (т.к. stopEverything уже был вызван)
        if (!isUserStopped) {
            Log.d("WebRTCService", "onDestroy: Сервис не был остановлен пользователем, очищаем ресурсы.")
            cleanupWebSocketAndWebRTC() // Закрываем соединения и WebRTC
        } else {
            Log.d("WebRTCService", "onDestroy: Сервис был остановлен пользователем, ресурсы должны быть уже очищены.")
        }

        // Освобождаем EglBase только при полном уничтожении
        if (::eglBase.isInitialized) {
            eglBase.release()
            Log.d("WebRTCService", "EglBase освобожден в onDestroy.")
        }

        super.onDestroy()
        Log.w("WebRTCService", "onDestroy: Завершено.")
    }

    // ========================================================================
    // Инициализация и очистка
    // ========================================================================

    @SuppressLint("ForegroundServiceType") // Используем правильные типы выше
    private fun startForegroundService() {
        val notification = createNotification("Инициализация...")
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // Указываем типы для Android 10+
                startForeground(
                    notificationId,
                    notification,
                    // Добавляем ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE если взаимодействуем с Bluetooth/USB и т.п.
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA or ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
                )
                Log.d("WebRTCService", "startForeground с типами CAMERA, MICROPHONE")
            } else {
                startForeground(notificationId, notification)
                Log.d("WebRTCService", "startForeground (legacy)")
            }
        } catch (e: Exception) {
            Log.e("WebRTCService", "Ошибка при вызове startForeground", e)
            // Попытка запасного варианта без типов (может не сработать на новых API)
            try {
                startForeground(notificationId, notification)
                Log.d("WebRTCService", "startForeground (fallback)")
            } catch (eFallback: Exception) {
                Log.e("WebRTCService", "Повторная ошибка startForeground", eFallback)
            }
        }
    }

    // Инициализация ТОЛЬКО WebRTC клиента (EglBase и Views создаются раньше)
    private fun initializeWebRTC() {
        Log.d("WebRTCService", "Инициализация WebRTCClient для комнаты: $roomName")
        // Очищаем предыдущий клиент, если он был
        cleanupWebRTCClient()

        if (!::eglBase.isInitialized || !::localView.isInitialized) {
            Log.e("WebRTCService", "КРИТИЧЕСКАЯ ОШИБКА: Попытка инициализировать WebRTCClient без EglBase или LocalView!")
            setErrorState("Ошибка инициализации EglBase/View")
            stopEverything() // Критическая ошибка
            return
        }

        try {
            // Создаем WebRTCClient
            webRTCClient = WebRTCClient(
                context = this.applicationContext,
                eglBase = eglBase,
                localView = localView,
                // remoteView = remoteView, // Не передаем remoteView
                observer = createPeerConnectionObserver()
            )
            Log.d("WebRTCService", "WebRTCClient создан")

            // Старт видео теперь вызывается отдельно после этой функции

        } catch (e: Exception) {
            Log.e("WebRTCService", "КРИТИЧЕСКАЯ ОШИБКА инициализации WebRTCClient", e)
            setErrorState("Ошибка WebRTC: ${e.message}")
            webRTCClient = null // Убедимся, что ссылка пуста при ошибке
        }
    }

    // Observer для отслеживания событий PeerConnection
    private fun createPeerConnectionObserver() = object : PeerConnection.Observer {
        // Локальный ICE кандидат сгенерирован
        override fun onIceCandidate(candidate: IceCandidate?) {
            candidate?.let {
                Log.d("WebRTC_Observer", "Локальный ICE кандидат: ${it.sdpMid}:${it.sdpMLineIndex}")
                // Отправляем кандидата на сервер сигнализации ТЕКУЩЕМУ ведомому
                sendIceCandidate(it) // targetUsername будет взят из currentFollowerUsername
            }
        }

        // Изменение состояния ICE соединения
        override fun onIceConnectionChange(newState: PeerConnection.IceConnectionState?) {
            Log.d("WebRTC_Observer", "Состояние ICE соединения: $newState")
            handler.post {
                val statusText = when (newState) {
                    PeerConnection.IceConnectionState.CHECKING -> "Проверка ICE..."
                    PeerConnection.IceConnectionState.CONNECTED, PeerConnection.IceConnectionState.COMPLETED -> {
                        // Не главный индикатор P2P, но показывает успешный ICE
                        "ICE установлено"
                    }
                    PeerConnection.IceConnectionState.DISCONNECTED -> "ICE потеряно (временно?)"
                    PeerConnection.IceConnectionState.FAILED -> "ICE не удалось!"
                    PeerConnection.IceConnectionState.CLOSED -> "ICE закрыто"
                    else -> "ICE: $newState"
                }
                if (newState != PeerConnection.IceConnectionState.CHECKING && newState != PeerConnection.IceConnectionState.CONNECTED && newState != PeerConnection.IceConnectionState.COMPLETED) {
                    // Логируем или обновляем только значимые изменения
                    updateNotification(statusText)
                }
                // При FAILED можно инициировать очистку P2P
                if (newState == PeerConnection.IceConnectionState.FAILED) {
                    Log.e("WebRTC_Observer", "ICE Connection Failed!")
                    // Закрываем соединение с текущим ведомым
                    webRTCClient?.close("ICE Failed")
                    currentFollowerUsername = null
                    updateNotification("Ошибка P2P (ICE)")
                }
            }
        }

        // Изменение ОБЩЕГО состояния PeerConnection (более надежный индикатор P2P)
        override fun onConnectionChange(newState: PeerConnection.PeerConnectionState?) {
            Log.d("WebRTC_Observer", "ОБЩЕЕ состояние PeerConnection: $newState")
            handler.post {
                val statusText = when (newState) {
                    PeerConnection.PeerConnectionState.NEW -> "P2P создан"
                    PeerConnection.PeerConnectionState.CONNECTING -> "Установка P2P..."
                    PeerConnection.PeerConnectionState.CONNECTED -> "P2P СОЕДИНЕНО с $currentFollowerUsername"
                    PeerConnection.PeerConnectionState.DISCONNECTED -> "P2P ПОТЕРЯНО с $currentFollowerUsername"
                    PeerConnection.PeerConnectionState.FAILED -> "P2P НЕ УДАЛОСЬ с $currentFollowerUsername"
                    PeerConnection.PeerConnectionState.CLOSED -> "P2P ЗАКРЫТО с $currentFollowerUsername"
                    else -> "P2P статус: $newState"
                }
                updateNotification(statusText)

                // Очищаем ресурсы, если соединение окончательно разорвано или не удалось
                if (newState == PeerConnection.PeerConnectionState.FAILED || newState == PeerConnection.PeerConnectionState.CLOSED) {
                    Log.w("WebRTC_Observer", "P2P состояние $newState, закрываем соединение с $currentFollowerUsername")
                    // webRTCClient?.close() уже вызывается при Closed? Проверить.
                    // Если нет, то раскомментировать:
                    // webRTCClient?.close("PeerConnection state: $newState")
                    currentFollowerUsername = null // Сбрасываем текущего ведомого
                }
                // При DISCONNECTED можно подождать восстановления или запустить таймер очистки
                if (newState == PeerConnection.PeerConnectionState.DISCONNECTED) {
                    Log.w("WebRTC_Observer", "P2P Disconnected, возможно восстановление...")
                    // Можно запустить таймер, по истечении которого считать соединение потерянным
                }
            }
        }

        // Получение медиа трека от удаленного пира (Ведомого)
        override fun onTrack(transceiver: RtpTransceiver?) {
            transceiver?.receiver?.track()?.let { track ->
                Log.d("WebRTC_Observer", "ПОЛУЧЕН удаленный трек: ID=${track.id()}, Kind=${track.kind()}, State=${track.state()}")
                handler.post {
                    if (track.kind() == MediaStreamTrack.VIDEO_TRACK_KIND) {
                        Log.d("WebRTCService", "Получен ВИДЕО трек от ведомого. Игнорируем отображение.")
                        // Лидер НЕ отображает видео ведомого, ничего не делаем
                        // val videoTrack = track as VideoTrack
                        // videoTrack.addSink(remoteView) // НЕ ДОБАВЛЯЕМ SINK
                    } else if (track.kind() == MediaStreamTrack.AUDIO_TRACK_KIND) {
                        Log.d("WebRTCService", "Получен АУДИО трек от ведомого.")
                        // WebRTC само обрабатывает аудио. Можно добавить управление громкостью и т.п.
                        // Убедимся, что аудио включено
                        track.setEnabled(true)
                    }
                }
            } ?: run {
                Log.w("WebRTC_Observer", "onTrack вызван, но track is null")
            }
        }

        // --- Остальные методы Observer ---
        override fun onSignalingChange(newState: PeerConnection.SignalingState?) {
            Log.d("WebRTC_Observer", "Состояние сигнализации: $newState")
        }
        override fun onIceConnectionReceivingChange(receiving: Boolean) {
            // Log.d("WebRTC_Observer", "Изменение получения ICE: $receiving")
        }
        override fun onIceGatheringChange(newState: PeerConnection.IceGatheringState?) {
            Log.d("WebRTC_Observer", "Состояние сбора ICE: $newState")
        }
        override fun onIceCandidatesRemoved(candidates: Array<out IceCandidate>?) {
            Log.d("WebRTC_Observer", "ICE кандидаты удалены: ${candidates?.size}")
        }
        override fun onAddStream(stream: MediaStream?) { /* Устаревший, используем onTrack */ }
        override fun onRemoveStream(stream: MediaStream?) { /* Устаревший */ }
        override fun onDataChannel(dataChannel: DataChannel?) {
            Log.d("WebRTC_Observer", "Получен DataChannel: ${dataChannel?.label()}")
            // TODO: Обработка DataChannel, если он используется
        }
        override fun onRenegotiationNeeded() {
            // Вызывается, когда нужно пересогласование (например, изменились треки)
            // В нашем случае, Лидер инициирует соединение только по команде сервера.
            // Если Ведомый изменит свои треки, он должен будет инициировать новый обмен SDP (не наш сценарий).
            Log.w("WebRTC_Observer", "ТРЕБУЕТСЯ ПЕРЕСОГЛАСОВАНИЕ (onRenegotiationNeeded). Игнорируем, ждем команды сервера.")
            // НЕ СОЗДАЕМ ОФФЕР ЗДЕСЬ
        }
        override fun onAddTrack(receiver: RtpReceiver?, mediaStreams: Array<out MediaStream>?) {
            // Вызывается когда трек УЖЕ добавлен и ассоциирован с PeerConnection
            Log.d("WebRTC_Observer", "onAddTrack вызван (современный)")
        }
    }

    // Очистка ТОЛЬКО WebRTC клиента
    private fun cleanupWebRTCClient() {
        Log.d("WebRTCService", "Очистка WebRTC клиента...")
        try {
            webRTCClient?.close("Cleanup request")
            webRTCClient = null
            Log.d("WebRTCService", "WebRTCClient очищен.")
        } catch (e: Exception) {
            Log.e("WebRTCService", "Ошибка при очистке WebRTC клиента", e)
        }
    }

    // Очистка ТОЛЬКО WebSocket клиента
    private fun cleanupWebSocketClient() {
        Log.d("WebRTCService", "Очистка WebSocket клиента...")
        try {
            if (::webSocketClient.isInitialized) {
                webSocketClient.disconnect()
                Log.d("WebRTCService", "WebSocket клиент отключен.")
            }
        } catch (e: Exception) {
            Log.e("WebRTCService", "Ошибка при отключении WebSocket", e)
        }
        // Не удаляем ссылку, т.к. connectWebSocket создаст новый объект
    }

    // Очистка ресиверов и колбэков
    @SuppressLint("MissingPermission") // Права проверяются при регистрации
    private fun cleanupReceiversAndCallbacks() {
        Log.d("WebRTCService", "Очистка ресиверов и NetworkCallback...")
        try {
            if (isConnectivityReceiverRegistered) {
                unregisterReceiver(connectivityReceiver)
                isConnectivityReceiverRegistered = false
                Log.d("WebRTCService", "ConnectivityReceiver снят с регистрации.")
            }
            // if (isStateReceiverRegistered) { // Убрали stateReceiver
            //     unregisterReceiver(stateReceiver)
            //     isStateReceiverRegistered = false
            //     Log.d("WebRTCService", "StateReceiver снят с регистрации.")
            // }
            val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
            cm?.unregisterNetworkCallback(networkCallback) // Безопасно вызывать, даже если не был зарегистрирован
            Log.d("WebRTCService", "NetworkCallback снят с регистрации.")
        } catch (e: IllegalArgumentException) {
            Log.w("WebRTCService", "Ошибка при снятии регистрации ресивера/колбэка (возможно, уже снят): ${e.message}")
        } catch (e: Exception) {
            Log.e("WebRTCService", "Неизвестная ошибка при очистке ресиверов/колбэков", e)
        }
    }

    // Очистка ВСЕХ ресурсов сервиса
    private fun cleanupAllResources() {
        Log.i("WebRTCService", "--- Запуск полной очистки всех ресурсов ---")
        handler.removeCallbacksAndMessages(null) // Останавливаем все запланированные задачи (реконнект, health check)
        cleanupWebSocketAndWebRTC() // Закрываем соединения и WebRTC клиент
        cleanupReceiversAndCallbacks() // Отписываемся от событий системы
        Log.i("WebRTCService", "--- Полная очистка завершена ---")
    }

    // Очистка только соединений и WebRTC
    private fun cleanupWebSocketAndWebRTC() {
        cleanupWebRTCClient()
        cleanupWebSocketClient()
    }

    // Полная остановка сервиса
    private fun stopEverything() {
        Log.w("WebRTCService", "--- ВЫЗОВ stopEverything ---")
        isUserStopped = true // Убедимся, что флаг установлен
        isRunning = false
        isConnected = false
        isConnecting = false
        sendServiceStateUpdate() // Уведомляем об остановке

        cleanupAllResources() // Выполняем полную очистку

        // Останавливаем Foreground сервис и само Service
        stopForeground(STOP_FOREGROUND_REMOVE) // true = Убрать уведомление
        stopSelf() // Останавливаем сам сервис
        Log.w("WebRTCService", "--- Сервис остановлен ---")
    }

    // ========================================================================
    // WebSocket Communication
    // ========================================================================

    @SuppressLint("MissingPermission") // Права проверяются в другом месте (манифест, при старте)
    private fun registerNetworkCallback() {
        try {
            val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
            val networkRequest = NetworkRequest.Builder()
                .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) // Интересуют сети с интернетом
                .build()
            cm.registerNetworkCallback(networkRequest, networkCallback)
            Log.d("WebRTCService", "NetworkCallback зарегистрирован.")
        } catch (e: SecurityException) {
            Log.e("WebRTCService", "Нет прав для регистрации NetworkCallback (ACCESS_NETWORK_STATE)", e)
            setErrorState("Ошибка прав доступа к сети")
        } catch (e: Exception) {
            Log.e("WebRTCService", "Ошибка регистрации NetworkCallback", e)
            setErrorState("Ошибка мониторинга сети")
        }
    }

    private fun connectWebSocket() {
        if (webRTCClient == null) { // Проверяем, что WebRTC клиент инициализирован
            Log.e("WebRTCService", "ОШИБКА: Попытка подключить WebSocket до инициализации WebRTCClient!")
            setErrorState("Внутренняя ошибка инициализации WebRTC.")
            // Возможно, стоит попробовать инициализировать WebRTC здесь?
            // initializeWebRTC() // Раскомментировать с осторожностью
            // if (webRTCClient == null) return // Если все равно не создался, выходим
            return
        }
        if (isConnected) {
            Log.d("WebRTCService", "connectWebSocket: Уже подключен.")
            // Если уже подключены, но не в комнате, отправить join?
            // sendJoinMessage() // Можно раскомментировать, если нужно повторно войти
            return
        }
        if (isConnecting) {
            Log.d("WebRTCService", "connectWebSocket: Уже в процессе подключения.")
            return
        }
        if (isUserStopped) {
            Log.d("WebRTCService", "connectWebSocket: Сервис остановлен пользователем, подключение отменено.")
            return
        }

        Log.i("WebRTCService", "Запуск подключения WebSocket к $webSocketUrl для комнаты $roomName")
        isConnecting = true
        updateNotification("Подключение к $roomName...")

        // Создаем НОВЫЙ клиент при каждой попытке
        webSocketClient = WebSocketClient(webSocketListener)
        webSocketClient.connect(webSocketUrl) // Должен быть неблокирующим
    }

    // Отправка сообщения о входе в комнату
    private fun sendJoinMessage() {
        if (!isConnected) {
            Log.w("WebRTCService", "Не могу отправить join: WebSocket не подключен.")
            return
        }
        try {
            // Сервер ожидает данные в корне при первом сообщении
            val message = JSONObject().apply {
                put("room", roomName)
                put("username", userName)
                put("isLeader", true) // Android всегда Лидер
            }
            Log.d("WebRTCService", "Отправка init/join сообщения: ${message.toString()}")
            webSocketClient.send(message.toString())
        } catch (e: Exception) {
            Log.e("WebRTCService", "Ошибка отправки join сообщения для комнаты: $roomName", e)
            setErrorState("Ошибка отправки данных на сервер.")
            // Возможно, стоит закрыть WS и попробовать переподключиться?
            // webSocketClient.disconnect()
            // scheduleReconnect()
        }
    }

    // Обработка входящих сообщений от WebSocket сервера
    private fun handleWebSocketMessage(message: JSONObject) {
        val messageType = message.optString("type", "") // Получаем тип сообщения

        try {
            when (messageType) {
                // Команда от сервера: создай оффер для нового ведомого
                "create_offer_for_new_follower" -> {
                    val follower = message.optString("followerUsername")
                    if (follower.isNotEmpty()) {
                        Log.i("WebRTCService", "<<< Получена команда: СОЗДАТЬ ОФФЕР для ведомого '$follower'")
                        // Закрываем предыдущее соединение, если оно было с другим пользователем
                        if (currentFollowerUsername != null && currentFollowerUsername != follower) {
                            Log.w("WebRTCService", "Новый ведомый '$follower'. Закрываем соединение с предыдущим '$currentFollowerUsername'.")
                            webRTCClient?.close("New follower request") // Закрываем старый PC
                            // Нужно пересоздать PeerConnection
                            initializeWebRTC() // Пересоздаем WebRTCClient и PeerConnection
                            webRTCClient?.startLocalVideo() // Запускаем видео
                        }
                        // Сохраняем имя НОВОГО текущего ведомого
                        currentFollowerUsername = follower
                        // Инициируем создание и отправку оффера
                        initiateOffer(follower)
                    } else {
                        Log.w("WebRTCService", "Получена команда 'create_offer_for_new_follower' без имени ведомого.")
                    }
                }

                // Ответ (Answer) от ведомого на наш оффер
                "answer" -> {
                    val answerSdpJson = message.optJSONObject("sdp")
                    val caller = message.optString("caller") // Имя ведомого
                    if (answerSdpJson != null && caller.isNotEmpty()) {
                        // Проверяем, что ответ пришел от ОЖИДАЕМОГО ведомого
                        if (caller == currentFollowerUsername) {
                            Log.i("WebRTCService", "<<< Получен ОТВЕТ (Answer) от ведомого '$caller'")
                            handleAnswer(answerSdpJson)
                        } else {
                            Log.w("WebRTCService", "Получен ответ от НЕОЖИДАЕМОГО ведомого '$caller' (ожидался '$currentFollowerUsername'). Игнорируем.")
                        }
                    } else {
                        Log.w("WebRTCService", "Получен некорректный 'answer': $message")
                    }
                }

                // ICE кандидат от ведомого
                "ice_candidate" -> {
                    val iceData = message.optJSONObject("ice")
                    val caller = message.optString("caller")
                    val candidateSource = if (caller.isNotEmpty()) caller else currentFollowerUsername // От кого кандидат

                    if (iceData != null && candidateSource != null) {
                        // Проверяем, что кандидат от текущего ожидаемого ведомого
                        if (candidateSource == currentFollowerUsername) {
                            Log.d("WebRTCService", "<<< Получен ICE кандидат от '$candidateSource'")
                            handleIceCandidate(iceData)
                        } else {
                            Log.w("WebRTCService", "Получен ICE кандидат от НЕОЖИДАЕМОГО ведомого '$candidateSource' (ожидался '$currentFollowerUsername'). Игнорируем.")
                        }
                    } else {
                        if (iceData == null) Log.w("WebRTCService", "Получен некорректный 'ice_candidate' (отсутствует 'ice'): $message")
                        if (candidateSource == null) Log.w("WebRTCService", "Получен ICE кандидат, но неизвестен источник (currentFollowerUsername не установлен).")
                    }
                }

                // Команда переключения камеры от ведомого
                "switch_camera" -> {
                    val useBack = message.optBoolean("useBackCamera", false)
                    Log.i("WebRTCService", "<<< Получена команда: ПЕРЕКЛЮЧИТЬ КАМЕРУ (useBack=$useBack)")
                    // Используем обновленный метод switchCamera с callback'ом
                    webRTCClient?.switchCamera(useBack) { success ->
                        // Отправляем подтверждение обратно
                        sendCameraSwitchAck(useBack, success)
                    }
                }

                // Информация о комнате (может приходить при изменениях)
                "room_info" -> {
                    val data = message.optJSONObject("data")
                    val leader = data?.optString("Leader")
                    val follower = data?.optString("Follower") // Может быть "" или null, если ведомого нет
                    val users = data?.optJSONArray("Users")
                    Log.d("WebRTCService", "<<< Room Info: Leader='$leader', Follower='$follower', Users=$users")

                    // Если информация говорит, что ведомого больше нет, а у нас он еще записан
                    if ((follower == null || follower.isEmpty()) && currentFollowerUsername != null) {
                        Log.w("WebRTCService", "Room Info: Ведомый '$currentFollowerUsername' больше не в комнате. Закрываем соединение.")
                        webRTCClient?.close("Follower left room (detected by room_info)")
                        currentFollowerUsername = null
                        updateNotification("Ведомый отключился")
                    }
                    // Если появился новый ведомый (хотя обычно придет create_offer...)
                    else if (follower != null && follower.isNotEmpty() && follower != currentFollowerUsername) {
                        Log.w("WebRTCService", "Room Info: Обнаружен новый ведомый '$follower'. Ожидаем команду create_offer...")
                        // Не инициируем оффер здесь, ждем команды сервера
                        // currentFollowerUsername = follower // Обновляем на всякий случай
                    }
                }

                // Принудительное отключение от сервера
                "force_disconnect" -> {
                    val reason = message.optString("data", "Принудительное отключение сервером")
                    Log.w("WebRTCService", "<<< Получена команда FORCE_DISCONNECT. Причина: $reason")
                    setErrorState("Отключен сервером: $reason")
                    isUserStopped = true // Считаем окончательной остановкой
                    stopEverything()
                }

                // Сообщение об ошибке от сервера
                "error" -> {
                    val errorMsg = message.optString("data", "Неизвестная ошибка от сервера")
                    Log.e("WebRTCService", "<<< Получена ОШИБКА от сервера: $errorMsg")
                    setErrorState("Ошибка сервера: $errorMsg")
                    // Решаем, нужно ли останавливаться
                    if (errorMsg.contains("Room already has a leader")) {
                        Log.e("WebRTCService", "Критическая ошибка: Комната уже занята лидером!")
                        isUserStopped = true;
                        stopEverything();
                    } else if (errorMsg.contains("Invalid message")) {
                        // Возможно, ошибка в формате отправляемых нами сообщений
                        Log.e("WebRTCService", "Сервер сообщил о неверном формате сообщения.")
                    }
                }

                // Оценка пропускной способности (если сервер присылает)
                "bandwidth_estimation" -> {
                    val estimationBps = message.optLong("estimation", -1)
                    if (estimationBps > 0) {
                        Log.d("WebRTCService", "<<< Оценка пропускной способности: ${estimationBps / 1000} kbps")
                        // TODO: Реализовать адаптацию битрейта видео на основе этой оценки
                        // webRTCClient?.setVideoBitrate(estimationBps) // Нужен метод в WebRTCClient
                    }
                }

                else -> Log.w("WebRTCService", "Получен неизвестный тип сообщения WebSocket: '$messageType'")
            }
        } catch (e: Exception) {
            Log.e("WebRTCService", "Критическая ошибка при обработке WebSocket сообщения ($messageType)", e)
            setErrorState("Ошибка обработки WS: ${e.message}")
        }
    }

    // ========================================================================
    // WebRTC SDP and ICE Handling (Leader Role)
    // ========================================================================

    // --- Инициирование создания и отправки Оффера ---
    private fun initiateOffer(targetUsername: String?) {
        if (targetUsername == null) {
            Log.e("WebRTCService", "Невозможно инициировать оффер: не указан 'targetUsername'.")
            return
        }
        val pc = webRTCClient?.peerConnection // Получаем PeerConnection
        if (pc == null) {
            Log.e("WebRTCService", "Невозможно инициировать оффер: PeerConnection не инициализирован.")
            setErrorState("Ошибка WebRTC: не готово к офферу.")
            return
        }

        Log.i("WebRTCService", ">>> Инициируем создание ОФФЕРА для ведомого '$targetUsername'")
        currentFollowerUsername = targetUsername // Запоминаем, кому отправляем

        // Ограничения для оффера (что мы готовы ПРИНИМАТЬ от ведомого)
        val constraints = MediaConstraints().apply {
            mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveAudio", "true")) // Готовы принимать аудио
            mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveVideo", "false")) // НЕ готовы принимать видео
            // Можно добавить ICE Restart, если нужно пересоздать ICE кандидатов
            // mandatory.add(MediaConstraints.KeyValuePair("IceRestart", "true"))
        }

        // Создаем оффер, используя ЯВНУЮ реализацию SdpObserver
        pc.createOffer(object : SdpObserver {
            override fun onCreateSuccess(offerDescription: SessionDescription?) {
                if (offerDescription != null) {
                    Log.i("WebRTCService", ">>> Оффер УСПЕШНО создан для '$targetUsername'")
                    // Устанавливаем созданный оффер как ЛОКАЛЬНОЕ описание
                    setLocalDescription(offerDescription, targetUsername)
                } else {
                    onCreateFailure("Созданный offerDescription is null")
                }
            }

            override fun onCreateFailure(error: String?) {
                Log.e("WebRTCService", "XXX Ошибка создания оффера для '$targetUsername': $error")
                setErrorState("Ошибка создания оффера: $error")
                currentFollowerUsername = null // Сбрасываем цель при ошибке
            }
            // Пустые реализации остальных методов SdpObserver (они нужны для установки описания)
            override fun onSetSuccess() {}
            override fun onSetFailure(error: String?) {}
        }, constraints)
    }

    // --- Установка локального описания (Offer) ---
    private fun setLocalDescription(desc: SessionDescription, targetUsername: String?) {
        val pc = webRTCClient?.peerConnection
        if (pc == null) {
            Log.e("WebRTCService", "Невозможно установить локальное описание: PeerConnection не инициализирован.")
            return
        }
        Log.d("WebRTCService", ">>> Установка ЛОКАЛЬНОГО описания (${desc.type}) для '$targetUsername'")

        // Используем ЯВНУЮ реализацию SdpObserver
        pc.setLocalDescription(object : SdpObserver {
            override fun onSetSuccess() {
                Log.i("WebRTCService", ">>> Локальное описание (${desc.type}) УСПЕШНО установлено для '$targetUsername'. Отправка на сервер...")
                // После успешной установки локального описания, ОТПРАВЛЯЕМ его на сервер
                sendSdpOffer(desc, targetUsername)
            }

            override fun onSetFailure(error: String?) {
                Log.e("WebRTCService", "XXX Ошибка установки локального описания (${desc.type}) для '$targetUsername': $error")
                setErrorState("Ошибка установки SDP: $error")
                currentFollowerUsername = null // Сбрасываем цель
            }
            // Пустые реализации остальных методов SdpObserver
            override fun onCreateSuccess(p0: SessionDescription?) {}
            override fun onCreateFailure(p0: String?) {}
        }, desc)
    }

    // --- Отправка Оффера на сервер ---
    private fun sendSdpOffer(desc: SessionDescription, targetUsername: String?) {
        if (targetUsername == null) {
            Log.e("WebRTCService", "Невозможно отправить оффер: не указан 'targetUsername'.")
            return
        }
        if (!isConnected) {
            Log.w("WebRTCService", "Не могу отправить оффер: WebSocket не подключен.")
            // Можно попробовать сохранить и отправить позже? Или считать ошибкой.
            setErrorState("Ошибка отправки Offer: нет WS")
            return
        }
        Log.i("WebRTCService", ">>> Отправка ОФФЕРА ведомому '$targetUsername' через сервер...")
        try {
            val sdpJson = JSONObject().apply {
                put("type", desc.type.canonicalForm()) // "offer"
                put("sdp", desc.description)
            }
            val message = JSONObject().apply {
                put("type", "offer")           // Тип сообщения для сервера
                put("target", targetUsername)  // Кому предназначен оффер
                put("sdp", sdpJson)            // Само SDP описание
                put("room", roomName)          // Наша комната
                put("username", userName)      // Наше имя (лидер)
            }
            webSocketClient.send(message.toString())
            Log.d("WebRTCService", "Оффер отправлен: ${message.toString().take(100)}...")
        } catch (e: Exception) {
            Log.e("WebRTCService", "XXX Ошибка отправки оффера", e)
            setErrorState("Ошибка отправки SDP: ${e.message}")
            currentFollowerUsername = null // Сбрасываем цель при ошибке
        }
    }

    // --- Обработка Ответа (Answer) от ведомого ---
    private fun handleAnswer(answerSdpJson: JSONObject) {
        val pc = webRTCClient?.peerConnection
        if (pc == null) {
            Log.e("WebRTCService", "Невозможно обработать ответ: PeerConnection не инициализирован.")
            return
        }
        try {
            val sdpTypeStr = answerSdpJson.optString("type", "").uppercase() // Приводим к верхнему регистру
            val sdpDescription = answerSdpJson.optString("sdp", "")

            if (sdpTypeStr != SessionDescription.Type.ANSWER.canonicalForm().uppercase() || sdpDescription.isEmpty()) {
                Log.e("WebRTCService", "Некорректный формат SDP ответа: $answerSdpJson")
                setErrorState("Неверный формат ответа от клиента.")
                return
            }

            val answerDescription = SessionDescription(
                SessionDescription.Type.ANSWER, // Используем Enum
                sdpDescription
            )

            Log.d("WebRTCService", "<<< Установка УДАЛЕННОГО описания (Answer) от '$currentFollowerUsername'")
            // Используем ЯВНУЮ реализацию SdpObserver
            pc.setRemoteDescription(object : SdpObserver {
                override fun onSetSuccess() {
                    Log.i("WebRTCService", "<<< Удаленное описание (Answer) от '$currentFollowerUsername' УСПЕШНО установлено.")
                    // Соединение должно начать устанавливаться (ICE обмен)
                    updateNotification("P2P устанавливается с $currentFollowerUsername")
                }

                override fun onSetFailure(error: String?) {
                    Log.e("WebRTCService", "XXX Ошибка установки удаленного описания (Answer) от '$currentFollowerUsername': $error")
                    setErrorState("Ошибка обработки Answer: $error")
                    // Ответ не принят, закрываем попытку соединения
                    webRTCClient?.close("Failed to set remote answer")
                    currentFollowerUsername = null
                }
                // Пустые реализации остальных методов SdpObserver
                override fun onCreateSuccess(p0: SessionDescription?) {}
                override fun onCreateFailure(p0: String?) {}
            }, answerDescription)

        } catch (e: Exception) {
            Log.e("WebRTCService", "Критическая ошибка при обработке ответа", e)
            setErrorState("Ошибка обработки Answer: ${e.message}")
            webRTCClient?.close("Answer handling error")
            currentFollowerUsername = null
        }
    }

    // --- Отправка локального ICE кандидата на сервер ---
    private fun sendIceCandidate(candidate: IceCandidate) {
        val targetPeer = currentFollowerUsername // Отправляем текущему ведомому
        if (targetPeer == null) {
            // Кандидаты могут генерироваться до того, как придет ответ, это нормально.
            // Но отправлять их нужно только после того, как мы узнали, кому (т.е., есть currentFollowerUsername).
            // Сервер обычно кеширует их, если получает до SDP. Но лучше отправлять после установки RemoteDescription.
            // Однако, PeerConnection генерирует их раньше. Отправляем сразу.
            Log.w("WebRTCService", "sendIceCandidate: currentFollowerUsername еще не установлен. Кандидат будет отправлен без target.")
            // return // Раскомментировать, если сервер НЕ кеширует кандидаты без target
        }
        if (!isConnected) {
            Log.w("WebRTCService", "Не могу отправить ICE кандидат: WebSocket не подключен.")
            return
        }
        // Log.d("WebRTCService", ">>> Отправка ICE кандидата ведомому '$targetPeer'...")
        try {
            val iceJson = JSONObject().apply {
                put("sdpMid", candidate.sdpMid)
                put("sdpMLineIndex", candidate.sdpMLineIndex)
                put("candidate", candidate.sdp)
                // Добавляем поле sdp, чтобы было как в JS версии (хотя candidate.sdp это то же самое)
                put("sdp", candidate.sdp)
            }
            val message = JSONObject().apply {
                put("type", "ice_candidate") // Тип сообщения
                if (targetPeer != null) {
                    put("target", targetPeer) // Кому предназначен (если известен)
                }
                put("ice", iceJson)          // Сам кандидат
                put("room", roomName)        // Наша комната
                put("username", userName)    // Отправитель (лидер)
            }
            // Log.d("WebRTCService", "Отправка ICE: ${message.toString()}")
            webSocketClient.send(message.toString())
        } catch (e: Exception) {
            Log.e("WebRTCService", "XXX Ошибка отправки ICE кандидата", e)
        }
    }


    // --- Обработка ICE кандидата от ведомого ---
    private fun handleIceCandidate(iceJson: JSONObject) {
        val pc = webRTCClient?.peerConnection
        if (pc == null) {
            Log.e("WebRTCService", "Невозможно обработать ICE кандидат: PeerConnection не инициализирован.")
            return
        }
        // Проверяем состояние сигнализации. Кандидаты можно добавлять только после setRemoteDescription.
        if (pc.signalingState() == PeerConnection.SignalingState.CLOSED) {
            Log.w("WebRTCService", "handleIceCandidate: PeerConnection закрыт, кандидат проигнорирован.")
            return
        }
        // Если Remote Description еще не установлено, кандидат может быть добавлен позже самой библиотекой,
        // но лучше дождаться состояния STABLE или HAVE_REMOTE_OFFER/PRANSWER
        // if (pc.remoteDescription == null) {
        //    Log.w("WebRTCService", "handleIceCandidate: Remote description еще не установлено. Попытка добавить кандидата...")
        // }


        try {
            // Сервер Go присылает кандидата внутри поля "ice"
            val sdpMid = iceJson.optString("sdpMid", iceJson.optString("sdpMid")) // Пробуем оба варианта написания
            val sdpMLineIndex = iceJson.optInt("sdpMLineIndex", iceJson.optInt("sdpMLineIndex", -1))
            // Поле с самим кандидатом может называться "candidate" или "sdp"
            val sdp = iceJson.optString("candidate", iceJson.optString("sdp", ""))


            if (sdpMid.isEmpty() || sdpMLineIndex == -1 || sdp.isEmpty()) {
                Log.e("WebRTCService", "Некорректный формат ICE кандидата от ведомого: $iceJson")
                return
            }

            val iceCandidate = IceCandidate(sdpMid, sdpMLineIndex, sdp)

            Log.d("WebRTCService", "<<< Добавление полученного ICE кандидата от '$currentFollowerUsername'")
            pc.addIceCandidate(iceCandidate)
            // WebRTC сама обработает добавление

        } catch (e: Exception) {
            Log.e("WebRTCService", "Критическая ошибка при обработке ICE кандидата", e)
            setErrorState("Ошибка обработки ICE: ${e.message}")
        }
    }


    // ========================================================================
    // Вспомогательные функции
    // ========================================================================

    // Отправка подтверждения переключения камеры
    private fun sendCameraSwitchAck(useBackCamera: Boolean, success: Boolean) {
        if (!isConnected) return
        try {
            val message = JSONObject().apply {
                put("type", "switch_camera_ack")
                put("useBackCamera", useBackCamera)
                put("success", success)
                // Отправляем текущему ведомому
                put("target", currentFollowerUsername ?: "unknown")
                put("room", roomName)
                put("username", userName)
            }
            webSocketClient.send(message.toString())
            Log.d("WebRTCService", ">>> Отправлено подтверждение переключения камеры (success=$success)")
        } catch (e: Exception) {
            Log.e("WebRTCService", "Ошибка отправки подтверждения переключения камеры", e)
        }
    }

    private fun scheduleReconnect() {
        if (isUserStopped) {
            Log.d("WebRTCService", "Service stopped by user, not scheduling reconnect.")
            return
        }
        if (isConnecting) {
            Log.d("WebRTCService", "Already trying to connect, not scheduling another reconnect yet.")
            return
        }

        // Удаляем ПРЕДЫДУЩИЕ запланированные попытки реконнекта
        // (Используем токен для удаления только задач реконнекта)
        val RECONNECT_TOKEN = "reconnect_token"
        handler.removeCallbacksAndMessages(RECONNECT_TOKEN)

        reconnectAttempts++
        // Экспоненциальная задержка с ограничением и небольшим джиттером
        val baseDelay = 5000L
        val maxDelay = 60000L // 1 минута
        val attemptsFactor = Math.pow(1.8, (reconnectAttempts - 1).toDouble()) // Увеличиваем базу множителя
        var delay = (baseDelay * attemptsFactor).toLong().coerceAtMost(maxDelay)
        // Добавляем джиттер +/- 1 секунда
        delay += (Math.random() * 2000).toLong() - 1000
        delay = delay.coerceAtLeast(1000L) // Минимум 1 секунда

        Log.d("WebRTCService", "Планируем переподключение через ${delay / 1000} сек (попытка $reconnectAttempts)")
        updateNotification("Переподключение через ${delay / 1000} сек...")

        // Используем postDelayed с токеном
        handler.postDelayed({
            if (!isConnected && !isUserStopped && !isConnecting) { // Проверяем снова
                Log.d("WebRTCService", "Выполняем запланированное переподключение (попытка $reconnectAttempts)")
                reconnect()
            } else {
                Log.d("WebRTCService", "Отмена запланированного переподключения (уже подключен, остановлен или подключается).")
            }
        }, RECONNECT_TOKEN, delay) // Передаем токен

        // Перезапускаем health check, если он не был запланирован
        // handler.removeCallbacks(healthCheckRunnable) // Убрать, т.к. удалили все сообщения выше
        // handler.postDelayed(healthCheckRunnable, 60000)
    }

    // Основная логика переподключения
    private fun reconnect() {
        // Двойная проверка флагов
        if (isConnected || isConnecting || isUserStopped) {
            Log.d("WebRTCService", "Reconnect(): Пропускаем (Connected=$isConnected, Connecting=$isConnecting, Stopped=$isUserStopped)")
            return
        }

        Log.i("WebRTCService", "--- Запуск процесса RECONNECT (Попытка: $reconnectAttempts) ---")
        updateNotification("Переподключение...")
        isConnecting = true // Устанавливаем флаг В НАЧАЛЕ

        // 1. Очищаем старые соединения (WebSocket и WebRTC P2P)
        // Не нужно пересоздавать WebRTCClient полностью, только закрыть текущий PC
        webRTCClient?.close("Reconnecting") // Закрываем старый PeerConnection
        cleanupWebSocketClient() // Отключаем старый WebSocket

        // 2. Сбрасываем связанные состояния
        isConnected = false
        currentFollowerUsername = null

        // Небольшая пауза перед новой попыткой (опционально)
        handler.postDelayed({
            if (isUserStopped) {
                Log.d("WebRTCService", "Reconnect(): Остановлен пользователем во время паузы.")
                isConnecting = false // Сбрасываем флаг
                return@postDelayed
            }
            // 3. Пересоздаем PeerConnection внутри WebRTCClient (если нужно)
            //    ИЛИ просто подключаем WebSocket, если WebRTCClient еще жив
            //    Предпочтительно: WebRTCClient остается, создается новый PC при необходимости (в initiateOffer)

            // 4. Пытаемся подключить WebSocket
            connectWebSocket() // Эта функция установит isConnecting = false при успехе/ошибке
        }, 500) // 0.5 сек пауза
    }

    // Установка состояния ошибки
    private fun setErrorState(errorMessage: String?) {
        val message = errorMessage ?: "Неизвестная ошибка"
        Log.e("WebRTCService", "Установлено состояние ошибки: $message")
        updateNotification("Ошибка: ${message.take(40)}...")
        // TODO: Отправить broadcast для Activity
        // sendServiceStateUpdate(error = message)
    }

    // Создание канала уведомлений
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Ardua Vision Service", // Имя канала
                NotificationManager.IMPORTANCE_LOW // Низкий приоритет
            ).apply {
                description = "Фоновый сервис стриминга WebRTC"
                // setSound(null, null) // Без звука
                // enableVibration(false) // Без вибрации
            }
            (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
                .createNotificationChannel(channel)
            Log.d("WebRTCService", "Notification channel '$channelId' создан.")
        }
    }

    // Создание объекта уведомления
    private fun createNotification(contentText: String = "Активен"): Notification {
        // Интент для остановки сервиса
        val stopIntent = Intent(this, WebRTCService::class.java).apply { action = "STOP" }
        val stopPendingIntent: PendingIntent = PendingIntent.getService(
            this, 0, stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Интент для открытия MainActivity
        val mainActivityIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            putExtra("room_name", roomName)
        }
        val mainActivityPendingIntent: PendingIntent = PendingIntent.getActivity(
            this, 1, mainActivityIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, channelId)
            .setContentTitle("Ardua Vision (Лидер)")
            .setContentText(contentText)
            .setSmallIcon(R.drawable.ic_notification) // Убедитесь, что иконка есть
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true) // Нельзя смахнуть
            .setContentIntent(mainActivityPendingIntent) // Открыть приложение по клику
            .addAction(R.drawable.ic_stop, "Стоп", stopPendingIntent) // Кнопка Стоп (убедитесь, что иконка есть)
            // .setCategory(NotificationCompat.CATEGORY_SERVICE) // Категория сервиса
            // .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE) // Показывать сразу
            .build()
    }

    // Обновление текста уведомления
    private fun updateNotification(text: String) {
        if (!isRunning && !isUserStopped) {
            // Не обновляем уведомление, если сервис уже остановлен (кроме случая ошибки при остановке)
            Log.w("WebRTCService", "Попытка обновить уведомление для неработающего сервиса: $text")
            return
        }
        val notification = createNotification(text)
        try {
            (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
                .notify(notificationId, notification)
        } catch (e: Exception) { // Ловим RuntimeException на некоторых API при попытке обновить после stopForeground
            Log.e("WebRTCService", "Ошибка обновления уведомления ($notificationId): $text", e)
        }
    }

    // Отправка состояния сервиса (можно добавить параметры)
    private fun sendServiceStateUpdate(error: String? = null) {
        val intent = Intent(ACTION_SERVICE_STATE).apply {
            putExtra(EXTRA_IS_RUNNING, isRunning)
            putExtra("room_name", roomName)
            putExtra("is_connected_ws", isConnected) // Статус WebSocket
            putExtra("is_connected_p2p", currentFollowerUsername != null) // Статус P2P (примерно)
            putExtra("follower_username", currentFollowerUsername)
            if (error != null) {
                putExtra("error", error)
            }
            // Добавить другие нужные данные о состоянии
        }
        try {
            sendBroadcast(intent)
        } catch (e: IllegalStateException) {
            Log.w("WebRTCService", "Не удалось отправить broadcast о состоянии сервиса (возможно, уже уничтожается): ${e.message}")
        }
    }


    // --- WorkManager для перезапуска (если нужен) ---
    /*
    private fun scheduleRestartWithWorkManager() {
        // ... (код из вашего примера)
    }
    */

    // Проверка инициализации (пример)
    fun isInitializedProperly(): Boolean {
        return ::eglBase.isInitialized &&
                webRTCClient != null &&
                ::webSocketClient.isInitialized // Проверяем основные компоненты
    }
}

// Убираем SdpObserverAdapter, т.к. используем явную реализацию SdpObserver
// open class SdpObserverAdapter : SdpObserver { ... }