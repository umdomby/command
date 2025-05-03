package com.example.mytest

import android.content.Context
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import org.webrtc.*
import org.webrtc.audio.JavaAudioDeviceModule
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class WebRTCClient(
    private val context: Context,
    private val eglBase: EglBase,
    private val localView: SurfaceViewRenderer,
    // Убираем remoteView из конструктора, т.к. лидер его не использует для отображения
    // private val remoteView: SurfaceViewRenderer,
    private val observer: PeerConnection.Observer
) {
    lateinit var peerConnectionFactory: PeerConnectionFactory
    var peerConnection: PeerConnection? = null // Делаем nullable для безопасной очистки
    private var localVideoTrack: VideoTrack? = null
    private var localAudioTrack: AudioTrack? = null
    internal var videoCapturer: VideoCapturer? = null
    private var videoSource: VideoSource? = null // Храним ссылку для управления
    private var audioSource: AudioSource? = null // Храним ссылку для управления
    private var surfaceTextureHelper: SurfaceTextureHelper? = null

    // Используем отдельный поток для WebRTC операций, чтобы не блокировать UI
    private val executor: ExecutorService = Executors.newSingleThreadExecutor()

    init {
        // Выполняем инициализацию в фоновом потоке
        executor.execute {
            initializePeerConnectionFactory()
            peerConnection = createPeerConnection()
            // Создаем треки, но НЕ запускаем видео сразу
            createLocalTracks()
        }
    }

    private fun initializePeerConnectionFactory() {
        val initializationOptions = PeerConnectionFactory.InitializationOptions.builder(context)
            .setEnableInternalTracer(true)
            // Пример включения фичи (может потребоваться обновление имени)
            // .setFieldTrials("WebRTC-H264HighProfile/Enabled/")
            .createInitializationOptions()
        PeerConnectionFactory.initialize(initializationOptions)

        // Используем аппаратное ускорение, если возможно
        val videoEncoderFactory = DefaultVideoEncoderFactory(
            eglBase.eglBaseContext,
            true, // enableIntelVp8Encoder
            true  // enableH264HighProfile
        )
        val videoDecoderFactory = DefaultVideoDecoderFactory(eglBase.eglBaseContext)

        // Добавляем настройки аудио модуля
        val audioDeviceModule = JavaAudioDeviceModule.builder(context)
            // .setSamplesReadyCallback(null) // Доп. настройки при необходимости
            // .setUseHardwareAcousticEchoCanceler(true) // Попытка использовать аппаратный AEC
            // .setUseHardwareNoiseSuppressor(true) // Попытка использовать аппаратный NS
            .createAudioDeviceModule()

        peerConnectionFactory = PeerConnectionFactory.builder()
            .setVideoEncoderFactory(videoEncoderFactory)
            .setVideoDecoderFactory(videoDecoderFactory)
            .setAudioDeviceModule(audioDeviceModule) // Добавляем аудио модуль
            .setOptions(PeerConnectionFactory.Options().apply {
                // disableEncryption = true // Опасно, ТОЛЬКО для локальной отладки без TURN
                // disableNetworkMonitor = true // Не рекомендуется отключать
            })
            .createPeerConnectionFactory()

        // Освобождаем аудио модуль после создания фабрики
        audioDeviceModule.release()
    }

    private fun createPeerConnection(): PeerConnection? { // Возвращаем nullable
        val iceServers = listOf(
            PeerConnection.IceServer.builder("stun:stun.l.google.com:19302").createIceServer(),
            // Добавьте ваш TURN сервер, если нужен
            PeerConnection.IceServer.builder("turn:ardua.site:3478")
                .setUsername("user1")
                .setPassword("pass1")
                .createIceServer(),
            PeerConnection.IceServer.builder("stun:ardua.site:3478").createIceServer(),
        )

        val rtcConfig = PeerConnection.RTCConfiguration(iceServers).apply {
            sdpSemantics = PeerConnection.SdpSemantics.UNIFIED_PLAN
            // bundlePolicy = PeerConnection.BundlePolicy.MAXBUNDLE // Включено по умолчанию
            // rtcpMuxPolicy = PeerConnection.RtcpMuxPolicy.REQUIRE // Включено по умолчанию
            continualGatheringPolicy = PeerConnection.ContinualGatheringPolicy.GATHER_CONTINUALLY
            // Управление кандидатами
            iceTransportsType = PeerConnection.IceTransportsType.ALL // Разрешаем UDP и TCP
            tcpCandidatePolicy = PeerConnection.TcpCandidatePolicy.ENABLED // Разрешаем TCP
            candidateNetworkPolicy = PeerConnection.CandidateNetworkPolicy.ALL // Собираем со всех интерфейсов

            // Настройки Jitter буфера (можно подбирать экспериментально)
            // audioJitterBufferMaxPackets = 50 // Пример
            // audioJitterBufferFastAccelerate = true // Пример
            iceConnectionReceivingTimeout = 5000 // 5 секунд таймаут

            // Проверка KeyType (ECDSA обычно по умолчанию)
            // keyType = PeerConnection.KeyType.ECDSA
        }

        // Важно: вызывать createPeerConnection на том же потоке, где была создана Factory
        return peerConnectionFactory.createPeerConnection(rtcConfig, observer)
    }

    // Переключаем камеру, добавив callback
    internal fun switchCamera(useBackCamera: Boolean, callback: (success: Boolean) -> Unit) {
        executor.execute { // Выполняем в потоке WebRTC
            videoCapturer?.let { capturer ->
                if (capturer is CameraVideoCapturer) {
                    val cameraEnumerator = Camera2Enumerator(context) // Используем Camera2 если возможно
                    val deviceNames = cameraEnumerator.deviceNames
                    val targetDeviceName = if (useBackCamera) {
                        deviceNames.find { !cameraEnumerator.isFrontFacing(it) }
                    } else {
                        deviceNames.find { cameraEnumerator.isFrontFacing(it) }
                    }

                    if (targetDeviceName != null) {
                        capturer.switchCamera(object : CameraVideoCapturer.CameraSwitchHandler {
                            override fun onCameraSwitchDone(isFrontCamera: Boolean) {
                                Log.d("WebRTCClient", "Камера переключена. Фронтальная: $isFrontCamera")
                                // Вызываем callback в основном потоке, если он будет обновлять UI
                                Handler(Looper.getMainLooper()).post { callback(true) }
                            }

                            override fun onCameraSwitchError(error: String) {
                                Log.e("WebRTCClient", "Ошибка переключения камеры: $error")
                                Handler(Looper.getMainLooper()).post { callback(false) }
                            }
                        }, targetDeviceName) // Передаем имя устройства для переключения
                    } else {
                        Log.e("WebRTCClient", "Не найдена ${if (useBackCamera) "задняя" else "передняя"} камера.")
                        Handler(Looper.getMainLooper()).post { callback(false) }
                    }
                } else {
                    Log.w("WebRTCClient", "Переключение камеры поддерживается только для CameraVideoCapturer")
                    Handler(Looper.getMainLooper()).post { callback(false) }
                }
            } ?: run {
                Log.w("WebRTCClient", "VideoCapturer не инициализирован, переключение невозможно.")
                Handler(Looper.getMainLooper()).post { callback(false) }
            }
        }
    }

    // Создаем локальные треки, но не запускаем видео
    private fun createLocalTracks() {
        // Важно: вызывать на том же потоке, где была создана Factory
        createAudioTrack()
        createVideoTrack() // Только создает трек и VideoSource

        val streamId = "ARDAMS"
        // Создаем треки и добавляем их в PeerConnection
        localAudioTrack?.let { audio ->
            peerConnection?.addTrack(audio, listOf(streamId))
        }
        localVideoTrack?.let { video ->
            peerConnection?.addTrack(video, listOf(streamId))
        }
    }

    private fun createAudioTrack() {
        val audioConstraints = MediaConstraints().apply {
            // Стандартные ограничения для улучшения качества звука
            mandatory.add(MediaConstraints.KeyValuePair("googEchoCancellation", "true"))
            mandatory.add(MediaConstraints.KeyValuePair("googAutoGainControl", "true"))
            mandatory.add(MediaConstraints.KeyValuePair("googHighpassFilter", "true"))
            mandatory.add(MediaConstraints.KeyValuePair("googNoiseSuppression", "true"))
        }
        audioSource = peerConnectionFactory.createAudioSource(audioConstraints)
        localAudioTrack = peerConnectionFactory.createAudioTrack("ARDAMSa0", audioSource)
        localAudioTrack?.setEnabled(true) // Убедимся, что трек включен
    }

    private fun createVideoTrack() {
        try {
            videoCapturer = createCameraCapturer()
            videoCapturer?.let { capturer ->
                surfaceTextureHelper = SurfaceTextureHelper.create("CaptureThread", eglBase.eglBaseContext)
                videoSource = peerConnectionFactory.createVideoSource(capturer.isScreencast)

                // Инициализируем капчурер
                capturer.initialize(surfaceTextureHelper, context, videoSource?.capturerObserver)

                // Создаем видео трек
                localVideoTrack = peerConnectionFactory.createVideoTrack("ARDAMSv0", videoSource).apply {
                    setEnabled(true) // Включаем трек
                    addSink(localView) // Добавляем рендерер для локального превью
                }
                Log.d("WebRTCClient", "Видео трек создан")
            } ?: run {
                Log.e("WebRTCClient", "Не удалось создать video capturer")
            }
        } catch (e: Exception) {
            Log.e("WebRTCClient", "Ошибка создания видео трека", e)
        }
    }

    // Новый метод для старта захвата видео
    fun startLocalVideo() {
        executor.execute {
            videoCapturer?.let { capturer ->
                try {
                    // Стандартные параметры, можно сделать настраиваемыми
                    capturer.startCapture(640, 480, 30)
                    Log.i("WebRTCClient", "Захват видео запущен (640x480 @ 30fps)")
                } catch (e: RuntimeException) {
                    // Часто возникает, если камера уже используется или недоступна
                    Log.e("WebRTCClient", "Ошибка запуска захвата видео", e)
                }
            } ?: Log.w("WebRTCClient", "Не могу запустить видео: videoCapturer не создан.")
        }
    }

    // Метод для остановки захвата видео (если нужно)
    fun stopLocalVideo() {
        executor.execute {
            videoCapturer?.let { capturer ->
                try {
                    capturer.stopCapture()
                    Log.i("WebRTCClient", "Захват видео остановлен")
                } catch (e: InterruptedException) {
                    Thread.currentThread().interrupt()
                    Log.e("WebRTCClient", "Прервано во время остановки захвата", e)
                } catch (e: Exception) {
                    Log.e("WebRTCClient", "Ошибка остановки захвата видео", e)
                }
            }
        }
    }


    private fun createCameraCapturer(): VideoCapturer? {
        val enumerator: CameraEnumerator = if (Camera2Enumerator.isSupported(context)) {
            Log.d("WebRTCClient", "Используем Camera2 API")
            Camera2Enumerator(context)
        } else {
            Log.d("WebRTCClient", "Используем Camera1 API")
            Camera1Enumerator(true)
        }

        // Пытаемся найти фронтальную камеру
        val frontCamera = enumerator.deviceNames.find { enumerator.isFrontFacing(it) }
        if (frontCamera != null) {
            Log.d("WebRTCClient", "Найдена фронтальная камера: $frontCamera")
            return enumerator.createCapturer(frontCamera, null)
        }

        // Если фронтальной нет, берем любую доступную
        val anyCamera = enumerator.deviceNames.firstOrNull()
        if (anyCamera != null) {
            Log.d("WebRTCClient", "Фронтальная не найдена, используем первую доступную: $anyCamera")
            return enumerator.createCapturer(anyCamera, null)
        }

        Log.e("WebRTCClient", "Камеры не найдены!")
        return null
    }

    // Метод закрытия с причиной (опционально)
    fun close(reason: String? = null) {
        executor.execute { // Выполняем очистку в том же потоке
            Log.w("WebRTCClient", "Закрытие WebRTCClient. Причина: ${reason ?: "Не указана"}")
            try {
                // 1. Остановить захват видео
                stopLocalVideo() // Используем новый метод

                // 2. Убрать рендерер
                localVideoTrack?.removeSink(localView)

                // 3. Освободить треки и источники
                localVideoTrack?.dispose()
                localVideoTrack = null
                localAudioTrack?.dispose()
                localAudioTrack = null

                videoSource?.dispose()
                videoSource = null
                audioSource?.dispose()
                audioSource = null

                // 4. Освободить VideoCapturer
                videoCapturer?.dispose()
                videoCapturer = null

                // 5. Освободить SurfaceTextureHelper
                surfaceTextureHelper?.dispose()
                surfaceTextureHelper = null

                // 6. Закрыть PeerConnection
                peerConnection?.close() // Сначала close
                peerConnection?.dispose() // Затем dispose
                peerConnection = null

                // 7. Освободить Factory (если больше не нужна)
                // peerConnectionFactory.dispose() // Обычно фабрику держат дольше

                Log.i("WebRTCClient", "Ресурсы WebRTCClient освобождены.")

            } catch (e: Exception) {
                Log.e("WebRTCClient", "Ошибка при закрытии ресурсов WebRTCClient", e)
            }
        }
        // Завершаем работу ExecutorService после выполнения задачи очистки
        executor.shutdown()
    }
}