1. Браузер-Ведомый (useWebRTC.tsx)
   Браузер будет отправлять предпочтительный кодек (H.264 или VP8) при подключении к комнате. Кодек выбирается на основе типа устройства/браузера для оптимальной совместимости.

Измененная функция: joinRoom
typescript

Копировать
const joinRoom = async (uniqueUsername: string) => {
setError(null);
setIsInRoom(false);
setIsConnected(false);
setIsLeader(false);

    try {
        // Определяем платформу и выбираем предпочтительный кодек
        const { isHuawei, isSafari, isIOS, isChrome } = detectPlatform();
        let preferredCodec: string;

        if (isHuawei) {
            preferredCodec = 'H264'; // Huawei лучше работает с H.264
        } else if (isSafari || isIOS) {
            preferredCodec = 'H264'; // Safari/iOS предпочитают H.264 для стабильности
        } else if (isChrome) {
            preferredCodec = 'VP8';  // Chrome хорошо работает с VP8
        } else {
            preferredCodec = 'H264'; // По умолчанию H.264 для максимальной совместимости
        }

        // 1. Подключаем WebSocket
        if (!(await connectWebSocket())) {
            throw new Error('Не удалось подключиться к WebSocket');
        }

        setupWebSocketListeners();

        // 2. Инициализируем WebRTC
        if (!(await initializeWebRTC())) {
            throw new Error('Не удалось инициализировать WebRTC');
        }

        // 3. Отправляем запрос на присоединение к комнате с указанием кодека
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

            // Отправляем запрос с указанием роли и предпочтительного кодека
            ws.current.send(JSON.stringify({
                action: "join",
                room: roomId,
                username: uniqueUsername,
                isLeader: false,
                preferredCodec // Добавляем предпочтительный кодек
            }));
        });

        // 4. Успешное подключение
        setIsInRoom(true);
        shouldCreateOffer.current = false;

        // 5. Запускаем таймер проверки видео
        startVideoCheckTimer();

    } catch (err) {
        console.error('Ошибка входа в комнату:', err);
        setError(`Ошибка входа в комнату: ${err instanceof Error ? err.message : String(err)}`);

        cleanup();
        if (ws.current) {
            ws.current.close();
            ws.current = null;
        }

        if (retryAttempts.current < MAX_RETRIES) {
            setTimeout(() => {
                joinRoom(uniqueUsername).catch(console.error);
            }, 2000 * (retryAttempts.current + 1));
        }
    }
};
Комментарии:

В функции joinRoom добавлено определение предпочтительного кодека на основе платформы (preferredCodec).
Huawei и Safari/iOS используют H.264 для лучшей совместимости, Chrome предпочитает VP8, остальные платформы по умолчанию используют H.264.
Предпочтительный кодек отправляется в сообщении join на сервер как поле preferredCodec.
2. Сервер Go (main.go)
   Сервер должен:

Принимать предпочтительный кодек от ведомого при подключении.
Передавать эту информацию лидеру (Android) в сообщении rejoin_and_offer.
Обеспечивать корректную инициализацию MediaEngine с поддержкой обоих кодеков (H.264 и VP8).
Измененная функция: initializeMediaAPI
go

Копировать
func initializeMediaAPI() {
mediaEngine := &webrtc.MediaEngine{}

    // Регистрируем H.264 с конкретными параметрами
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
        panic(fmt.Sprintf("H264 codec registration error: %v", err))
    }

    // Регистрируем VP8
    if err := mediaEngine.RegisterCodec(webrtc.RTPCodecParameters{
        RTPCodecCapability: webrtc.RTPCodecCapability{
            MimeType:     webrtc.MimeTypeVP8,
            ClockRate:    90000,
            RTCPFeedback: []webrtc.RTCPFeedback{
                {Type: "nack"},
                {Type: "nack", Parameter: "pli"},
                {Type: "ccm", Parameter: "fir"},
                {Type: "goog-remb"},
            },
        },
        PayloadType: 96,
    }, webrtc.RTPCodecTypeVideo); err != nil {
        panic(fmt.Sprintf("VP8 codec registration error: %v", err))
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
        panic(fmt.Sprintf("Opus codec registration error: %v", err))
    }

    // Создаем API с нашими настройками
    webrtcAPI = webrtc.NewAPI(
        webrtc.WithMediaEngine(mediaEngine),
    )
    log.Println("MediaEngine initialized with H.264, VP8 (video) and Opus (audio)")
}
Измененная функция: handlePeerJoin
go

Копировать
func handlePeerJoin(room string, username string, isLeader bool, conn *websocket.Conn) (*Peer, error) {
mu.Lock()

    // Сохраняем предпочтительный кодек ведомого
    var preferredCodec string
    if !isLeader {
        // Парсим входные данные для получения preferredCodec
        var initData struct {
            PreferredCodec string `json:"preferredCodec"`
        }
        if err := conn.ReadJSON(&initData); err == nil && initData.PreferredCodec != "" {
            if initData.PreferredCodec == "H264" || initData.PreferredCodec == "VP8" {
                preferredCodec = initData.PreferredCodec
                log.Printf("Follower %s prefers codec: %s", username, preferredCodec)
            } else {
                preferredCodec = "H264" // По умолчанию H.264
                log.Printf("Follower %s specified invalid codec, defaulting to H264", username)
            }
        } else {
            preferredCodec = "H264" // По умолчанию H.264
            log.Printf("Follower %s did not specify codec, defaulting to H264", username)
        }
    }

    if _, exists := rooms[room]; !exists {
        if !isLeader {
            mu.Unlock()
            _ = conn.WriteJSON(map[string]interface{}{"type": "error", "data": "Room does not exist. Leader must join first."})
            conn.Close()
            return nil, errors.New("room does not exist for follower")
        }
        rooms[room] = make(map[string]*Peer)
    }

    roomPeers := rooms[room]

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
        for _, p := range roomPeers {
            if !p.isLeader {
                existingFollower = p
                break
            }
        }

        if existingFollower != nil {
            log.Printf("Replacing old follower %s with new follower %s in room %s", existingFollower.username, username, room)
            delete(roomPeers, existingFollower.username)
            for addr, pItem := range peers {
                if pItem == existingFollower {
                    delete(peers, addr)
                    break
                }
            }
            mu.Unlock()
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
            log.Printf("Sending rejoin_and_offer command to leader %s for new follower %s with codec %s", leaderPeer.username, username, preferredCodec)
            leaderPeer.mu.Lock()
            leaderWsConn := leaderPeer.conn
            leaderPeer.mu.Unlock()

            if leaderWsConn != nil {
                mu.Unlock()
                err := leaderWsConn.WriteJSON(map[string]interface{}{
                    "type":           "rejoin_and_offer",
                    "room":           room,
                    "preferredCodec": preferredCodec, // Передаем кодек
                })
                mu.Lock()
                if err != nil {
                    log.Printf("Error sending rejoin_and_offer command to leader %s: %v", leaderPeer.username, err)
                }
            } else {
                log.Printf("Leader %s has no active WebSocket connection to send rejoin_and_offer.", leaderPeer.username)
            }
        } else {
            log.Printf("No leader found in room %s to send rejoin_and_offer.", room)
        }
    }

    peerConnection, err := webrtcAPI.NewPeerConnection(getWebRTCConfig())
    if err != nil {
        mu.Unlock()
        return nil, fmt.Errorf("failed to create PeerConnection: %w", err)
    }
    log.Printf("PeerConnection created for %s using H.264/VP8 MediaEngine.", username)

    peer := &Peer{
        conn:     conn,
        pc:       peerConnection,
        username: username,
        room:     room,
        isLeader: isLeader,
    }

    if isLeader {
        if _, err := peerConnection.AddTransceiverFromKind(webrtc.RTPCodecTypeVideo, webrtc.RTPTransceiverInit{
            Direction: webrtc.RTPTransceiverDirectionSendonly,
        }); err != nil {
            log.Printf("Failed to add video transceiver for leader %s: %v", username, err)
        }
    } else {
        if _, err := peerConnection.AddTransceiverFromKind(webrtc.RTPCodecTypeVideo, webrtc.RTPTransceiverInit{
            Direction: webrtc.RTPTransceiverDirectionRecvonly,
        }); err != nil {
            log.Printf("Failed to add video transceiver for follower %s: %v", username, err)
        }
    }

    if _, err := peerConnection.AddTransceiverFromKind(webrtc.RTPCodecTypeAudio, webrtc.RTPTransceiverInit{
        Direction: webrtc.RTPTransceiverDirectionSendrecv,
    }); err != nil {
        log.Printf("Failed to add audio transceiver for %s: %v", username, err)
    }

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
    mu.Unlock()

    return peer, nil
}
Комментарии:

В initializeMediaAPI добавлена регистрация кодека VP8 с PayloadType 96 и стандартными RTCPFeedback для совместимости.
В handlePeerJoin парсится preferredCodec из сообщения join от ведомого. Если кодек не указан или неверный, по умолчанию используется H.264.
При отправке команды rejoin_and_offer лидеру добавляется поле preferredCodec, чтобы сообщить, какой кодек предпочитает ведомый.
3. Android-Ведущий (WebRTCService.kt)
   Android должен:

Принимать команду rejoin_and_offer с указанием preferredCodec.
При переподключении настраивать PeerConnectionFactory для предпочтительного кодека.
Модифицировать SDP для приоритизации указанного кодека.
Измененная функция: initializePeerConnectionFactory (в WebRTCClient.kt)
kotlin

Копировать
private fun initializePeerConnectionFactory(preferredCodec: String = "H264") {
val initializationOptions = PeerConnectionFactory.InitializationOptions.builder(context)
.setEnableInternalTracer(true)
.setFieldTrials(
when (preferredCodec) {
"VP8" -> "WebRTC-VP8/Enabled/"
else -> "WebRTC-H264HighProfile/Enabled/WebRTC-H264PacketizationMode/Enabled/"
}
)
.createInitializationOptions()
PeerConnectionFactory.initialize(initializationOptions)

    val videoEncoderFactory: VideoEncoderFactory = DefaultVideoEncoderFactory(
        eglBase.eglBaseContext,
        false, // disable Intel VP8 encoder
        preferredCodec == "H264" // enable H264 High Profile
    )

    val videoDecoderFactory: VideoDecoderFactory = DefaultVideoDecoderFactory(eglBase.eglBaseContext)

    peerConnectionFactory = PeerConnectionFactory.builder()
        .setVideoEncoderFactory(videoEncoderFactory)
        .setVideoDecoderFactory(videoDecoderFactory)
        .setOptions(PeerConnectionFactory.Options().apply {
            disableEncryption = false
            disableNetworkMonitor = false
        })
        .createPeerConnectionFactory()
}
Измененная функция: initializeWebRTC (в WebRTCService.kt)
kotlin

Копировать
private fun initializeWebRTC(preferredCodec: String = "H264") {
Log.d("WebRTCService", "Initializing new WebRTC connection with codec: $preferredCodec")

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
        observer = createPeerConnectionObserver(),
        preferredCodec = preferredCodec // Передаем кодек
    )

    // 4. Установка начального битрейта
    webRTCClient.setVideoEncoderBitrate(50000, 100000, 150000)
}
Измененная функция: forceH264AndNormalizeSdp (в WebRTCService.kt, переименована в forceCodecAndNormalizeSdp)
kotlin

Копировать
private fun forceCodecAndNormalizeSdp(sdp: String, preferredCodec: String = "H264", targetBitrateAs: Int = 500): String {
var newSdp = sdp
var codecPayloadType: String? = null
val codecName = if (preferredCodec == "VP8") "VP8" else "H264"

    // 1. Найти payload type для выбранного кодека
    val rtpmapRegex = "a=rtpmap:(\\d+) $codecName(?:/\\d+)?".toRegex()
    val rtpmapMatches = rtpmapRegex.findAll(newSdp)
    val codecPayloadTypes = rtpmapMatches.map { it.groupValues[1] }.toList()

    if (codecPayloadTypes.isEmpty()) {
        Log.w("WebRTCService", "$codecName payload type not found in SDP. Cannot force $codecName specific fmtp.")
        return newSdp
    }

    codecPayloadType = codecPayloadTypes.first()
    Log.d("WebRTCService", "Found $codecName payload type: $codecPayloadType")

    // 2. Удалить другие видеокодеки
    val videoCodecsToRemove = if (preferredCodec == "H264") listOf("VP8", "VP9", "AV1") else listOf("H264", "VP9", "AV1")
    for (codecToRemove in videoCodecsToRemove) {
        val ptToRemoveRegex = "a=rtpmap:(\\d+) $codecToRemove(?:/\\d+)?\r\n".toRegex()
        var matchResult = ptToRemoveRegex.find(newSdp)
        while (matchResult != null) {
            val pt = matchResult.groupValues[1]
            newSdp = newSdp.replace("a=rtpmap:$pt $codecToRemove(?:/\\d+)?\r\n".toRegex(), "")
            newSdp = newSdp.replace("a=fmtp:$pt .*\r\n".toRegex(), "")
            newSdp = newSdp.replace("a=rtcp-fb:$pt .*\r\n".toRegex(), "")
            Log.d("WebRTCService", "Removed $codecToRemove (PT: $pt) from SDP")
            matchResult = ptToRemoveRegex.find(newSdp)
        }
    }

    // 3. Модифицировать fmtp для выбранного кодека
    if (preferredCodec == "H264") {
        val desiredFmtp = "profile-level-id=42e01f;level-asymmetry-allowed=1;packetization-mode=1"
        for (pt in codecPayloadTypes) {
            val fmtpSearchRegex = "a=fmtp:$pt .*\r\n".toRegex()
            val newFmtpLine = "a=fmtp:$pt $desiredFmtp\r\n"
            if (newSdp.contains(fmtpSearchRegex)) {
                newSdp = newSdp.replace(fmtpSearchRegex, newFmtpLine)
            } else {
                newSdp = newSdp.replace("a=rtpmap:$pt $codecName(?:/\\d+)?\r\n",
                    "a=rtpmap:$pt $codecName/90000\r\n$newFmtpLine")
            }
            Log.d("WebRTCService", "Set $codecName (PT: $pt) fmtp to: $desiredFmtp")
        }
    }

    // 4. Убедиться, что выбранный кодек - первый в m=video линии
    val mLineRegex = "^(m=video\\s+\\d+\\s+UDP/(?:TLS/)?RTP/SAVPF\\s+)(.*)".toRegex(RegexOption.MULTILINE)
    newSdp = mLineRegex.replace(newSdp) { mLineMatchResult ->
        val prefix = mLineMatchResult.groupValues[1]
        var payloads = mLineMatchResult.groupValues[2].split(" ").toMutableList()
        val activePayloadTypesInSdp = "a=rtpmap:(\\d+)".toRegex().findAll(newSdp).map { it.groupValues[1] }.toSet()
        payloads = payloads.filter { activePayloadTypesInSdp.contains(it) }.toMutableList()
        val codecPtsInOrder = codecPayloadTypes.filter { payloads.contains(it) }
        codecPtsInOrder.forEach { payloads.remove(it) }
        payloads.addAll(0, codecPtsInOrder)
        Log.d("WebRTCService", "Reordered m=video payloads to: ${payloads.joinToString(" ")}")
        prefix + payloads.joinToString(" ")
    }

    // 5. Установить битрейт для видео секции
    newSdp = newSdp.replace(Regex("^(a=mid:video\r\n(?:(?!a=mid:).*\r\n)*?)b=(AS|TIAS):\\d+\r\n", RegexOption.MULTILINE), "$1")
    newSdp = newSdp.replace("a=mid:video\r\n", "a=mid:video\r\nb=AS:$targetBitrateAs\r\n")
    Log.d("WebRTCService", "Set video bitrate to AS:$targetBitrateAs")

    return newSdp
}
Измененная функция: createOffer (в WebRTCService.kt)
kotlin

Копировать
private fun createOffer(preferredCodec: String = "H264") {
try {
if (!::webRTCClient.isInitialized || !isConnected) {
Log.w("WebRTCService", "Cannot create offer - not initialized or connected")
return
}

        webRTCClient.peerConnection?.transceivers?.filter {
            it.mediaType == MediaStreamTrack.MediaType.MEDIA_TYPE_VIDEO && it.sender != null
        }?.forEach { transceiver ->
            try {
                val sender = transceiver.sender
                val parameters = sender.parameters
                if (parameters != null) {
                    val targetCodecs = parameters.codecs.filter { codecInfo ->
                        codecInfo.name.equals(preferredCodec, ignoreCase = true)
                    }
                    if (targetCodecs.isNotEmpty()) {
                        parameters.codecs = ArrayList(targetCodecs)
                        val result = sender.setParameters(parameters)
                        if (result) {
                            Log.d("WebRTCService", "Successfully set $preferredCodec as preferred codec for video sender.")
                        } else {
                            Log.w("WebRTCService", "Failed to set $preferredCodec as preferred codec for video sender.")
                        }
                    } else {
                        Log.w("WebRTCService", "$preferredCodec codec not found in sender parameters.")
                    }
                }
            } catch (e: Exception) {
                Log.e("WebRTCService", "Error setting codec preferences for transceiver", e)
            }
        }

        val constraints = MediaConstraints().apply {
            mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveAudio", "true"))
            mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveVideo", "true"))
            mandatory.add(MediaConstraints.KeyValuePair("googCpuOveruseDetection", "true"))
            mandatory.add(MediaConstraints.KeyValuePair("googScreencastMinBitrate", "300"))
        }

        webRTCClient.peerConnection?.createOffer(object : SdpObserver {
            override fun onCreateSuccess(desc: SessionDescription) {
                Log.d("WebRTCService", "Original Local Offer SDP:\n${desc.description}")
                val modifiedSdp = forceCodecAndNormalizeSdp(desc.description, preferredCodec, 300)
                Log.d("WebRTCService", "Modified Local Offer SDP:\n$modifiedSdp")

                val modifiedDesc = SessionDescription(desc.type, modifiedSdp)

                webRTCClient.peerConnection!!.setLocalDescription(object : SdpObserver {
                    override fun onSetSuccess() {
                        Log.d("WebRTCService", "Successfully set local description")
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
        Log.e("WebRTCService", "Error in createOffer", e)
    }
}
Измененная функция: handleWebSocketMessage (в WebRTCService.kt)
kotlin

Копировать
private fun handleWebSocketMessage(message: JSONObject) {
Log.d("WebRTCService", "Received: $message")

    try {
        val isLeader = message.optBoolean("isLeader", false)

        when (message.optString("type")) {
            "rejoin_and_offer" -> {
                val preferredCodec = message.optString("preferredCodec", "H264")
                Log.d("WebRTCService", "Received rejoin command from server with codec: $preferredCodec")
                handler.post {
                    // 1. Очищаем текущее соединение
                    cleanupWebRTCResources()

                    // 2. Инициализируем новое соединение с указанным кодеком
                    initializeWebRTC(preferredCodec)

                    // 3. Создаем новый оффер с указанным кодеком
                    createOffer(preferredCodec)
                }
            }
            "create_offer_for_new_follower" -> {
                val preferredCodec = message.optString("preferredCodec", "H264")
                Log.d("WebRTCService", "Received request to create offer for new follower with codec: $preferredCodec")
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

браузер (клиент-ведомый) подключается к серверу со своим преподчитаемым кодеком (установи на клиенте каждому типу устройства свой кодек),
сервер говорит ведущему андройду-ведущему, что ведомый с определенным кодеком хочет подключиться к комнате, Ведущий Андройд перезаходит в комнату с нужным кодеком.
Цель: Позволить клиенту-ведомому (браузеру) указать предпочтительный видеокодек (например, H.264 или VP8) при подключении к комнате, передать эту информацию через сервер ведущему (Android), инициировать переподключение ведущего с настройкой соответствующего кодека, чтобы обеспечить совместимость и оптимальное качество трансляции.