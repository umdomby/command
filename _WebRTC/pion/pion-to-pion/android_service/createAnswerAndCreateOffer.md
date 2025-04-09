    private fun createAnswer(constraints: MediaConstraints) {
        try {
            webRTCClient.peerConnection.createAnswer(object : SdpObserver {
                override fun onCreateSuccess(desc: SessionDescription) {
                    Log.d("WebRTCService", "Created answer: ${desc.description}")
                    webRTCClient.peerConnection.setLocalDescription(object : SdpObserver {
                        override fun onSetSuccess() {
                            sendSessionDescription(desc)
                        }
                        override fun onSetFailure(error: String) {
                            Log.e("WebRTCService", "Error setting local description: $error")
                        }
                        override fun onCreateSuccess(p0: SessionDescription?) {}
                        override fun onCreateFailure(error: String) {}
                    }, desc)
                }
                override fun onCreateFailure(error: String) {
                    Log.e("WebRTCService", "Error creating answer: $error")
                }
                override fun onSetSuccess() {}
                override fun onSetFailure(error: String) {}
            }, constraints)
        } catch (e: Exception) {
            Log.e("WebRTCService", "Error creating answer", e)
        }
    }

