    private fun initializeWebRTC() {
        if (isInitializing) {
            Log.w("WebRTCService", "Initialization already in progress, skipping")
            return
        }
        isInitializing = true
        Log.d("WebRTCService", "Initializing new WebRTC connection")
        try {
            cleanupWebRTCResources() // Ensure resources are cleaned before initializing
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
            try {
                isFlashlightOn = !isFlashlightOn
                cameraManager.setTorchMode(flashlightCameraId!!, isFlashlightOn)
                Log.d("WebRTCService", "Фонарик ${if (isFlashlightOn) "включен" else "выключен"}")
                webRTCClient.videoCapturer?.startCapture(640, 480, 20)
            } catch (e: Exception) {
                Log.e("WebRTCService", "Ошибка фонарика: ${e.message}")
                isFlashlightOn = !isFlashlightOn
            }
        }, 2000)
    }

когда включена фронтальаня камера, фонарик включается и выключается, когда включена тыльная камера, фонарик включается видио останавливается, когда фонарик отключаешь трансляция возобновляется, отвечай на русском
библиотека     implementation("io.github.webrtc-sdk:android:125.6422.07") используй только ее 
