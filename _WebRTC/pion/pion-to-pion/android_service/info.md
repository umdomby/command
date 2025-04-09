1. WebRTCClient.kt (основной кандидат)
   Здесь обычно реализуется логика обработки медиапотоков:

Создание локального медиапотока (видео/аудио)
Обработка удаленных медиапотоков
Настройка PeerConnection и обработка ICE-кандидатов
Управление MediaStream и RTCPeerConnection

    createLocalMediaStream()
    onAddStream(MediaStream)
    onTrack(RtpTransceiver)
    addIceCandidate()
    createOffer() / createAnswer()

2. WebSocketClient.kt
   Этот файл обычно отвечает только за передачу сигналов (SDP-описаний и ICE-кандидатов), но не за формирование
   медиапотоков.

Локальные потоки создаются при инициализации (обычно в WebRTCClient.kt) через:

    val localStream = peerConnectionFactory.createLocalMediaStream("STREAM_ID")
    val audioTrack = peerConnectionFactory.createAudioTrack(...)
    val videoTrack = peerConnectionFactory.createVideoTrack(...)
    localStream.addTrack(audioTrack)
    localStream.addTrack(videoTrack)

Удаленные потоки обрабатываются в коллбэках:

        override fun onAddStream(mediaStream: MediaStream) {
        // Здесь поток от удаленного пользователя
        remoteVideoView?.let { renderer ->
        mediaStream.videoTracks.first().addSink(renderer)
        }
        }

Передача потока новому пользователю происходит при создании SDP-ответа (в createAnswer или createOffer).
