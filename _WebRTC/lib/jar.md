unzip -p classes.jar META-INF/MANIFEST.MF
pi@PC1:~$ file /home/pi/classes.jar
/home/pi/classes.jar: Zip archive data, at least v2.0 to extract, compression method=store
pi@PC1:~$ unzip -l /home/pi/classes.jar
Archive:  /home/pi/classes.jar
Length      Date    Time    Name
---------  ---------- -----   ----
      936  2001-01-01 00:00   org/webrtc/ContextUtils.class
      366  2001-01-01 00:00   org/webrtc/Loggable.class
     1348  2001-01-01 00:00   org/webrtc/Logging$Severity.class
     4924  2001-01-01 00:00   org/webrtc/Logging.class
     1278  2001-01-01 00:00   org/webrtc/Size.class
      796  2001-01-01 00:00   org/webrtc/ThreadUtils$1.class
      584  2001-01-01 00:00   org/webrtc/ThreadUtils$1CaughtException.class
      584  2001-01-01 00:00   org/webrtc/ThreadUtils$1Result.class
      854  2001-01-01 00:00   org/webrtc/ThreadUtils$2.class
     1574  2001-01-01 00:00   org/webrtc/ThreadUtils$3.class
     1003  2001-01-01 00:00   org/webrtc/ThreadUtils$4.class
      309  2001-01-01 00:00   org/webrtc/ThreadUtils$BlockingOperation.class
      933  2001-01-01 00:00   org/webrtc/ThreadUtils$ThreadChecker.class
     5197  2001-01-01 00:00   org/webrtc/ThreadUtils.class
      192  2001-01-01 00:00   org/webrtc/AudioDecoderFactoryFactory.class
      192  2001-01-01 00:00   org/webrtc/AudioEncoderFactoryFactory.class
      941  2001-01-01 00:00   org/webrtc/audio/AudioDeviceModule.class
      532  2001-01-01 00:00   org/webrtc/ApplicationContextProvider.class
      472  2001-01-01 00:00   org/webrtc/CalledByNative.class
      471  2001-01-01 00:00   org/webrtc/CalledByNativeUnchecked.class
     1130  2001-01-01 00:00   org/webrtc/Histogram.class
      550  2001-01-01 00:00   org/webrtc/JniCommon.class
     1278  2001-01-01 00:00   org/webrtc/JniHelper.class
     1004  2001-01-01 00:00   org/webrtc/Predicate$1.class
     1004  2001-01-01 00:00   org/webrtc/Predicate$2.class
      903  2001-01-01 00:00   org/webrtc/Predicate$3.class
     1233  2001-01-01 00:00   org/webrtc/Predicate.class
     1565  2001-01-01 00:00   org/webrtc/RefCountDelegate.class
      237  2001-01-01 00:00   org/webrtc/RefCounted.class
     1320  2001-01-01 00:00   org/webrtc/RtcError.class
      387  2001-01-01 00:00   org/webrtc/RtcException.class
      725  2001-01-01 00:00   org/webrtc/WebRtcClassLoader.class
      550  2001-01-01 00:00   org/webrtc/BuiltinAudioDecoderFactoryFactory.class
      550  2001-01-01 00:00   org/webrtc/BuiltinAudioEncoderFactoryFactory.class
     3175  2001-01-01 00:00   org/webrtc/Camera1Capturer.class
     8382  2001-01-01 00:00   org/webrtc/Camera1Enumerator.class
     1907  2001-01-01 00:00   org/webrtc/Camera1Session$1.class
     3852  2001-01-01 00:00   org/webrtc/Camera1Session$2.class
     1275  2001-01-01 00:00   org/webrtc/Camera1Session$SessionState.class
    13126  2001-01-01 00:00   org/webrtc/Camera1Session.class
     3546  2001-01-01 00:00   org/webrtc/Camera2Capturer.class
    10919  2001-01-01 00:00   org/webrtc/Camera2Enumerator.class
     1647  2001-01-01 00:00   org/webrtc/Camera2Session$CameraCaptureCallback.class
     5077  2001-01-01 00:00   org/webrtc/Camera2Session$CameraStateCallback.class
     8546  2001-01-01 00:00   org/webrtc/Camera2Session$CaptureSessionCallback.class
     1275  2001-01-01 00:00   org/webrtc/Camera2Session$SessionState.class
    10082  2001-01-01 00:00   org/webrtc/Camera2Session.class
     4645  2001-01-01 00:00   org/webrtc/CameraCapturer$1.class
     3716  2001-01-01 00:00   org/webrtc/CameraCapturer$2.class
      941  2001-01-01 00:00   org/webrtc/CameraCapturer$3.class
     1369  2001-01-01 00:00   org/webrtc/CameraCapturer$4.class
     1483  2001-01-01 00:00   org/webrtc/CameraCapturer$5.class
      824  2001-01-01 00:00   org/webrtc/CameraCapturer$6.class
     1986  2001-01-01 00:00   org/webrtc/CameraCapturer$7.class
     1159  2001-01-01 00:00   org/webrtc/CameraCapturer$8.class
     1031  2001-01-01 00:00   org/webrtc/CameraCapturer$9.class
     1331  2001-01-01 00:00   org/webrtc/CameraCapturer$SwitchState.class
    10333  2001-01-01 00:00   org/webrtc/CameraCapturer.class
     2109  2001-01-01 00:00   org/webrtc/CameraEnumerationAndroid$1.class
     1181  2001-01-01 00:00   org/webrtc/CameraEnumerationAndroid$2.class
     1575  2001-01-01 00:00   org/webrtc/CameraEnumerationAndroid$CaptureFormat$FramerateRange.class
     2666  2001-01-01 00:00   org/webrtc/CameraEnumerationAndroid$CaptureFormat.class
     1057  2001-01-01 00:00   org/webrtc/CameraEnumerationAndroid$ClosestComparator.class
     2970  2001-01-01 00:00   org/webrtc/CameraEnumerationAndroid.class
      918  2001-01-01 00:00   org/webrtc/CameraEnumerator.class
      516  2001-01-01 00:00   org/webrtc/CameraSession$CreateSessionCallback.class
      586  2001-01-01 00:00   org/webrtc/CameraSession$Events.class
     1263  2001-01-01 00:00   org/webrtc/CameraSession$FailureType.class
     1883  2001-01-01 00:00   org/webrtc/CameraSession.class
      536  2001-01-01 00:00   org/webrtc/CameraVideoCapturer$CameraEventsHandler.class
     2290  2001-01-01 00:00   org/webrtc/CameraVideoCapturer$CameraStatistics$1.class
     2256  2001-01-01 00:00   org/webrtc/CameraVideoCapturer$CameraStatistics.class
      424  2001-01-01 00:00   org/webrtc/CameraVideoCapturer$CameraSwitchHandler.class
      487  2001-01-01 00:00   org/webrtc/CameraVideoCapturer$MediaRecorderHandler.class
     1694  2001-01-01 00:00   org/webrtc/CameraVideoCapturer.class
     2541  2001-01-01 00:00   org/webrtc/DefaultVideoDecoderFactory.class
     2333  2001-01-01 00:00   org/webrtc/DefaultVideoEncoderFactory.class
      649  2001-01-01 00:00   org/webrtc/FileVideoCapturer$1.class
      309  2001-01-01 00:00   org/webrtc/FileVideoCapturer$VideoReader.class
     5215  2001-01-01 00:00   org/webrtc/FileVideoCapturer$VideoReaderY4M.class
     3179  2001-01-01 00:00   org/webrtc/FileVideoCapturer.class
     1277  2001-01-01 00:00   org/webrtc/VideoFileRenderer$1.class
     7665  2001-01-01 00:00   org/webrtc/VideoFileRenderer.class
     1119  2001-01-01 00:00   org/webrtc/AndroidVideoDecoder$1.class
      666  2001-01-01 00:00   org/webrtc/AndroidVideoDecoder$DecodedTextureMetadata.class
      581  2001-01-01 00:00   org/webrtc/AndroidVideoDecoder$FrameInfo.class
    19494  2001-01-01 00:00   org/webrtc/AndroidVideoDecoder.class
      869  2001-01-01 00:00   org/webrtc/BaseBitrateAdjuster.class
      357  2001-01-01 00:00   org/webrtc/BitrateAdjuster.class
     1892  2001-01-01 00:00   org/webrtc/DynamicBitrateAdjuster.class
      630  2001-01-01 00:00   org/webrtc/FramerateBitrateAdjuster.class
      970  2001-01-01 00:00   org/webrtc/HardwareVideoDecoderFactory$1.class
     1979  2001-01-01 00:00   org/webrtc/HardwareVideoDecoderFactory.class
      845  2001-01-01 00:00   org/webrtc/HardwareVideoEncoder$1.class
     1530  2001-01-01 00:00   org/webrtc/HardwareVideoEncoder$BusyCount.class
    23387  2001-01-01 00:00   org/webrtc/HardwareVideoEncoder.class
      884  2001-01-01 00:00   org/webrtc/HardwareVideoEncoderFactory$1.class
     8774  2001-01-01 00:00   org/webrtc/HardwareVideoEncoderFactory.class
      848  2001-01-01 00:00   org/webrtc/MediaCodecUtils$1.class
     4829  2001-01-01 00:00   org/webrtc/MediaCodecUtils.class
     5098  2001-01-01 00:00   org/webrtc/MediaCodecVideoDecoderFactory.class
     1238  2001-01-01 00:00   org/webrtc/MediaCodecWrapper.class
      306  2001-01-01 00:00   org/webrtc/MediaCodecWrapperFactory.class
     3253  2001-01-01 00:00   org/webrtc/MediaCodecWrapperFactoryImpl$MediaCodecWrapperImpl.class
      908  2001-01-01 00:00   org/webrtc/MediaCodecWrapperFactoryImpl.class
     2571  2001-01-01 00:00   org/webrtc/NV12Buffer.class
      995  2001-01-01 00:00   org/webrtc/PlatformSoftwareVideoDecoderFactory$1.class
     1380  2001-01-01 00:00   org/webrtc/PlatformSoftwareVideoDecoderFactory.class
      703  2001-01-01 00:00   org/webrtc/audio/JavaAudioDeviceModule$AudioRecordErrorCallback.class
     1519  2001-01-01 00:00   org/webrtc/audio/JavaAudioDeviceModule$AudioRecordStartErrorCode.class
      361  2001-01-01 00:00   org/webrtc/audio/JavaAudioDeviceModule$AudioRecordStateCallback.class
     1039  2001-01-01 00:00   org/webrtc/audio/JavaAudioDeviceModule$AudioSamples.class
      695  2001-01-01 00:00   org/webrtc/audio/JavaAudioDeviceModule$AudioTrackErrorCallback.class
     1510  2001-01-01 00:00   org/webrtc/audio/JavaAudioDeviceModule$AudioTrackStartErrorCode.class
      357  2001-01-01 00:00   org/webrtc/audio/JavaAudioDeviceModule$AudioTrackStateCallback.class
     8365  2001-01-01 00:00   org/webrtc/audio/JavaAudioDeviceModule$Builder.class
      499  2001-01-01 00:00   org/webrtc/audio/JavaAudioDeviceModule$SamplesReadyCallback.class
     5047  2001-01-01 00:00   org/webrtc/audio/JavaAudioDeviceModule.class
     2223  2001-01-01 00:00   org/webrtc/audio/LowLatencyAudioBufferManager.class
     1650  2001-01-01 00:00   org/webrtc/audio/VolumeLogger$LogVolumeTask.class
     2191  2001-01-01 00:00   org/webrtc/audio/VolumeLogger.class
     5951  2001-01-01 00:00   org/webrtc/audio/WebRtcAudioEffects.class
     4072  2001-01-01 00:00   org/webrtc/audio/WebRtcAudioManager.class
     1507  2001-01-01 00:00   org/webrtc/audio/WebRtcAudioRecord$1.class
     4140  2001-01-01 00:00   org/webrtc/audio/WebRtcAudioRecord$AudioRecordThread.class
    21659  2001-01-01 00:00   org/webrtc/audio/WebRtcAudioRecord.class
     3080  2001-01-01 00:00   org/webrtc/audio/WebRtcAudioTrack$AudioTrackThread.class
    14863  2001-01-01 00:00   org/webrtc/audio/WebRtcAudioTrack.class
     8537  2001-01-01 00:00   org/webrtc/audio/WebRtcAudioUtils.class
      585  2001-01-01 00:00   org/webrtc/LibaomAv1Encoder.class
      262  2001-01-01 00:00   org/webrtc/Empty.class
     1155  2001-01-01 00:00   org/webrtc/Metrics$HistogramInfo.class
     1257  2001-01-01 00:00   org/webrtc/Metrics.class
      508  2001-01-01 00:00   org/webrtc/LibvpxVp8Decoder.class
      585  2001-01-01 00:00   org/webrtc/LibvpxVp8Encoder.class
      536  2001-01-01 00:00   org/webrtc/LibvpxVp9Decoder.class
      613  2001-01-01 00:00   org/webrtc/LibvpxVp9Encoder.class
     1084  2001-01-01 00:00   org/webrtc/JNILogging.class
      318  2001-01-01 00:00   org/webrtc/AddIceObserver.class
      529  2001-01-01 00:00   org/webrtc/AudioProcessingFactory.class
      474  2001-01-01 00:00   org/webrtc/AudioSource.class
      678  2001-01-01 00:00   org/webrtc/AudioTrack.class
     1360  2001-01-01 00:00   org/webrtc/CallSessionFileRotatingLogSink.class
      834  2001-01-01 00:00   org/webrtc/CandidatePairChangeEvent.class
     1284  2001-01-01 00:00   org/webrtc/CryptoOptions$Builder.class
      777  2001-01-01 00:00   org/webrtc/CryptoOptions$SFrame.class
     1158  2001-01-01 00:00   org/webrtc/CryptoOptions$Srtp.class
     1366  2001-01-01 00:00   org/webrtc/CryptoOptions.class
      650  2001-01-01 00:00   org/webrtc/DataChannel$Buffer.class
     1309  2001-01-01 00:00   org/webrtc/DataChannel$Init.class
      577  2001-01-01 00:00   org/webrtc/DataChannel$Observer.class
     1557  2001-01-01 00:00   org/webrtc/DataChannel$State.class
     2804  2001-01-01 00:00   org/webrtc/DataChannel.class
     1666  2001-01-01 00:00   org/webrtc/DtmfSender.class
      193  2001-01-01 00:00   org/webrtc/FecControllerFactoryFactoryInterface.class
      160  2001-01-01 00:00   org/webrtc/FrameDecryptor.class
      160  2001-01-01 00:00   org/webrtc/FrameEncryptor.class
     2796  2001-01-01 00:00   org/webrtc/IceCandidate.class
      756  2001-01-01 00:00   org/webrtc/IceCandidateErrorEvent.class
     1926  2001-01-01 00:00   org/webrtc/MediaConstraints$KeyValuePair.class
     2466  2001-01-01 00:00   org/webrtc/MediaConstraints.class
     1556  2001-01-01 00:00   org/webrtc/MediaSource$State.class
     2202  2001-01-01 00:00   org/webrtc/MediaSource.class
     5147  2001-01-01 00:00   org/webrtc/MediaStream.class
     2358  2001-01-01 00:00   org/webrtc/MediaStreamTrack$MediaType.class
     1490  2001-01-01 00:00   org/webrtc/MediaStreamTrack$State.class
     2611  2001-01-01 00:00   org/webrtc/MediaStreamTrack.class
     3326  2001-01-01 00:00   org/webrtc/NativeAndroidVideoTrackSource.class
     2058  2001-01-01 00:00   org/webrtc/NativeCapturerObserver.class
     1236  2001-01-01 00:00   org/webrtc/NativeLibrary$DefaultLoader.class
     1782  2001-01-01 00:00   org/webrtc/NativeLibrary.class
      206  2001-01-01 00:00   org/webrtc/NativeLibraryLoader.class
      189  2001-01-01 00:00   org/webrtc/NativePeerConnectionFactory.class
      171  2001-01-01 00:00   org/webrtc/NetEqFactoryFactory.class
     1953  2001-01-01 00:00   org/webrtc/NetworkChangeDetector$ConnectionType.class
      690  2001-01-01 00:00   org/webrtc/NetworkChangeDetector$IPAddress.class
     1891  2001-01-01 00:00   org/webrtc/NetworkChangeDetector$NetworkInformation.class
     1199  2001-01-01 00:00   org/webrtc/NetworkChangeDetector$Observer.class
      860  2001-01-01 00:00   org/webrtc/NetworkChangeDetector.class
      454  2001-01-01 00:00   org/webrtc/NetworkChangeDetectorFactory.class
      207  2001-01-01 00:00   org/webrtc/NetworkControllerFactoryFactory.class
     1125  2001-01-01 00:00   org/webrtc/NetworkMonitor$1.class
     2296  2001-01-01 00:00   org/webrtc/NetworkMonitor$2.class
      541  2001-01-01 00:00   org/webrtc/NetworkMonitor$InstanceHolder.class
      487  2001-01-01 00:00   org/webrtc/NetworkMonitor$NetworkObserver.class
    11042  2001-01-01 00:00   org/webrtc/NetworkMonitor.class
    11429  2001-01-01 00:00   org/webrtc/NetworkMonitorAutoDetect$ConnectivityManagerDelegate.class
     1236  2001-01-01 00:00   org/webrtc/NetworkMonitorAutoDetect$NetworkState.class
     4509  2001-01-01 00:00   org/webrtc/NetworkMonitorAutoDetect$SimpleNetworkCallback.class
     6794  2001-01-01 00:00   org/webrtc/NetworkMonitorAutoDetect$WifiDirectManagerDelegate.class
     1551  2001-01-01 00:00   org/webrtc/NetworkMonitorAutoDetect$WifiManagerDelegate.class
     9962  2001-01-01 00:00   org/webrtc/NetworkMonitorAutoDetect.class
      487  2001-01-01 00:00   org/webrtc/NetworkPreference.class
      219  2001-01-01 00:00   org/webrtc/NetworkStatePredictorFactoryFactory.class
     2797  2001-01-01 00:00   org/webrtc/PeerConnection$AdapterType.class
     1330  2001-01-01 00:00   org/webrtc/PeerConnection$BundlePolicy.class
     1342  2001-01-01 00:00   org/webrtc/PeerConnection$CandidateNetworkPolicy.class
     1374  2001-01-01 00:00   org/webrtc/PeerConnection$ContinualGatheringPolicy.class
     1858  2001-01-01 00:00   org/webrtc/PeerConnection$IceConnectionState.class
     1626  2001-01-01 00:00   org/webrtc/PeerConnection$IceGatheringState.class
     3365  2001-01-01 00:00   org/webrtc/PeerConnection$IceServer$Builder.class
     6262  2001-01-01 00:00   org/webrtc/PeerConnection$IceServer.class
     1400  2001-01-01 00:00   org/webrtc/PeerConnection$IceTransportsType.class
     1234  2001-01-01 00:00   org/webrtc/PeerConnection$KeyType.class
     3023  2001-01-01 00:00   org/webrtc/PeerConnection$Observer.class
     1810  2001-01-01 00:00   org/webrtc/PeerConnection$PeerConnectionState.class
      420  2001-01-01 00:00   org/webrtc/PeerConnection$PortAllocatorFlags.class
     1384  2001-01-01 00:00   org/webrtc/PeerConnection$PortPrunePolicy.class
     9949  2001-01-01 00:00   org/webrtc/PeerConnection$RTCConfiguration.class
     1284  2001-01-01 00:00   org/webrtc/PeerConnection$RtcpMuxPolicy.class
     1371  2001-01-01 00:00   org/webrtc/PeerConnection$SdpSemantics.class
     1808  2001-01-01 00:00   org/webrtc/PeerConnection$SignalingState.class
     1318  2001-01-01 00:00   org/webrtc/PeerConnection$TcpCandidatePolicy.class
     1331  2001-01-01 00:00   org/webrtc/PeerConnection$TlsCertPolicy.class
    15587  2001-01-01 00:00   org/webrtc/PeerConnection.class
     1219  2001-01-01 00:00   org/webrtc/PeerConnectionDependencies$Builder.class
     1379  2001-01-01 00:00   org/webrtc/PeerConnectionDependencies.class
     7361  2001-01-01 00:00   org/webrtc/PeerConnectionFactory$Builder.class
     2688  2001-01-01 00:00   org/webrtc/PeerConnectionFactory$InitializationOptions$Builder.class
     1749  2001-01-01 00:00   org/webrtc/PeerConnectionFactory$InitializationOptions.class
     1253  2001-01-01 00:00   org/webrtc/PeerConnectionFactory$Options.class
      854  2001-01-01 00:00   org/webrtc/PeerConnectionFactory$ThreadInfo.class
    14716  2001-01-01 00:00   org/webrtc/PeerConnectionFactory.class
      518  2001-01-01 00:00   org/webrtc/Priority.class
     3054  2001-01-01 00:00   org/webrtc/RTCStats.class
      313  2001-01-01 00:00   org/webrtc/RTCStatsCollectorCallback.class
     2040  2001-01-01 00:00   org/webrtc/RTCStatsReport.class
     1603  2001-01-01 00:00   org/webrtc/RtcCertificatePem.class
     2295  2001-01-01 00:00   org/webrtc/RtpCapabilities$CodecCapability.class
     1107  2001-01-01 00:00   org/webrtc/RtpCapabilities$HeaderExtensionCapability.class
     1508  2001-01-01 00:00   org/webrtc/RtpCapabilities.class
     2089  2001-01-01 00:00   org/webrtc/RtpParameters$Codec.class
     1729  2001-01-01 00:00   org/webrtc/RtpParameters$DegradationPreference.class
     2934  2001-01-01 00:00   org/webrtc/RtpParameters$Encoding.class
     1033  2001-01-01 00:00   org/webrtc/RtpParameters$HeaderExtension.class
      865  2001-01-01 00:00   org/webrtc/RtpParameters$Rtcp.class
     2839  2001-01-01 00:00   org/webrtc/RtpParameters.class
      513  2001-01-01 00:00   org/webrtc/RtpReceiver$Observer.class
     2725  2001-01-01 00:00   org/webrtc/RtpReceiver.class
     4173  2001-01-01 00:00   org/webrtc/RtpSender.class
     2626  2001-01-01 00:00   org/webrtc/RtpTransceiver$RtpTransceiverDirection.class
     2522  2001-01-01 00:00   org/webrtc/RtpTransceiver$RtpTransceiverInit.class
     4175  2001-01-01 00:00   org/webrtc/RtpTransceiver.class
      277  2001-01-01 00:00   org/webrtc/SSLCertificateVerifier.class
      453  2001-01-01 00:00   org/webrtc/SdpObserver.class
     1856  2001-01-01 00:00   org/webrtc/SessionDescription$Type.class
      968  2001-01-01 00:00   org/webrtc/SessionDescription.class
      282  2001-01-01 00:00   org/webrtc/StatsObserver.class
      968  2001-01-01 00:00   org/webrtc/StatsReport$Value.class
     1360  2001-01-01 00:00   org/webrtc/StatsReport.class
      992  2001-01-01 00:00   org/webrtc/TurnCustomizer.class
      928  2001-01-01 00:00   org/webrtc/VideoProcessor$FrameAdaptationParameters.class
     1881  2001-01-01 00:00   org/webrtc/VideoProcessor.class
     2320  2001-01-01 00:00   org/webrtc/VideoSource$1.class
      639  2001-01-01 00:00   org/webrtc/VideoSource$AspectRatio.class
     4263  2001-01-01 00:00   org/webrtc/VideoSource.class
     2181  2001-01-01 00:00   org/webrtc/VideoTrack.class
     1624  2001-01-01 00:00   org/webrtc/ScreenCapturerAndroid$1.class
     5872  2001-01-01 00:00   org/webrtc/ScreenCapturerAndroid.class
     6064  2001-01-01 00:00   org/webrtc/SurfaceEglRenderer.class
     9685  2001-01-01 00:00   org/webrtc/SurfaceViewRenderer.class
     1028  2001-01-01 00:00   org/webrtc/SoftwareVideoDecoderFactory$1.class
     2348  2001-01-01 00:00   org/webrtc/SoftwareVideoDecoderFactory.class
     1112  2001-01-01 00:00   org/webrtc/SoftwareVideoEncoderFactory$1.class
     2348  2001-01-01 00:00   org/webrtc/SoftwareVideoEncoderFactory.class
      307  2001-01-01 00:00   org/webrtc/CapturerObserver.class
     2608  2001-01-01 00:00   org/webrtc/EncodedImage$Builder.class
     2359  2001-01-01 00:00   org/webrtc/EncodedImage$FrameType.class
     2626  2001-01-01 00:00   org/webrtc/EncodedImage.class
     3350  2001-01-01 00:00   org/webrtc/VideoCodecInfo.class
     2053  2001-01-01 00:00   org/webrtc/VideoCodecStatus.class
      373  2001-01-01 00:00   org/webrtc/VideoDecoder$Callback.class
      558  2001-01-01 00:00   org/webrtc/VideoDecoder$DecodeInfo.class
      675  2001-01-01 00:00   org/webrtc/VideoDecoder$Settings.class
     1097  2001-01-01 00:00   org/webrtc/VideoDecoder.class
      603  2001-01-01 00:00   org/webrtc/VideoDecoderFactory.class
      927  2001-01-01 00:00   org/webrtc/VideoEncoder$BitrateAllocation.class
      438  2001-01-01 00:00   org/webrtc/VideoEncoder$Callback.class
      589  2001-01-01 00:00   org/webrtc/VideoEncoder$Capabilities.class
      418  2001-01-01 00:00   org/webrtc/VideoEncoder$CodecSpecificInfo.class
      480  2001-01-01 00:00   org/webrtc/VideoEncoder$CodecSpecificInfoAV1.class
      483  2001-01-01 00:00   org/webrtc/VideoEncoder$CodecSpecificInfoH264.class
      480  2001-01-01 00:00   org/webrtc/VideoEncoder$CodecSpecificInfoVP8.class
      480  2001-01-01 00:00   org/webrtc/VideoEncoder$CodecSpecificInfoVP9.class
      735  2001-01-01 00:00   org/webrtc/VideoEncoder$EncodeInfo.class
      906  2001-01-01 00:00   org/webrtc/VideoEncoder$EncoderInfo.class
      827  2001-01-01 00:00   org/webrtc/VideoEncoder$RateControlParameters.class
     1185  2001-01-01 00:00   org/webrtc/VideoEncoder$ResolutionBitrateLimits.class
     1948  2001-01-01 00:00   org/webrtc/VideoEncoder$ScalingSettings.class
     1442  2001-01-01 00:00   org/webrtc/VideoEncoder$Settings.class
     3132  2001-01-01 00:00   org/webrtc/VideoEncoder.class
      954  2001-01-01 00:00   org/webrtc/VideoEncoderFactory$VideoEncoderSelector.class
      909  2001-01-01 00:00   org/webrtc/VideoEncoderFactory.class
     1038  2001-01-01 00:00   org/webrtc/VideoFrame$Buffer.class
      789  2001-01-01 00:00   org/webrtc/VideoFrame$I420Buffer.class
     1582  2001-01-01 00:00   org/webrtc/VideoFrame$TextureBuffer$Type.class
     1195  2001-01-01 00:00   org/webrtc/VideoFrame$TextureBuffer.class
     1956  2001-01-01 00:00   org/webrtc/VideoFrame.class
      680  2001-01-01 00:00   org/webrtc/VideoFrameBufferType.class
      267  2001-01-01 00:00   org/webrtc/VideoSink.class
     2581  2001-01-01 00:00   org/webrtc/EglBase$ConfigBuilder.class
      292  2001-01-01 00:00   org/webrtc/EglBase$Context.class
     1671  2001-01-01 00:00   org/webrtc/EglBase$EglConnection.class
     4995  2001-01-01 00:00   org/webrtc/EglBase.class
      342  2001-01-01 00:00   org/webrtc/EglBase10$Context.class
      553  2001-01-01 00:00   org/webrtc/EglBase10$EglConnection.class
      301  2001-01-01 00:00   org/webrtc/EglBase10.class
     2511  2001-01-01 00:00   org/webrtc/EglBase10Impl$1FakeSurfaceHolder.class
     3515  2001-01-01 00:00   org/webrtc/EglBase10Impl$Context.class
     5493  2001-01-01 00:00   org/webrtc/EglBase10Impl$EglConnection.class
     9457  2001-01-01 00:00   org/webrtc/EglBase10Impl.class
      326  2001-01-01 00:00   org/webrtc/EglBase14$Context.class
      445  2001-01-01 00:00   org/webrtc/EglBase14$EglConnection.class
      301  2001-01-01 00:00   org/webrtc/EglBase14.class
      884  2001-01-01 00:00   org/webrtc/EglBase14Impl$Context.class
     4621  2001-01-01 00:00   org/webrtc/EglBase14Impl$EglConnection.class
     8300  2001-01-01 00:00   org/webrtc/EglBase14Impl.class
      823  2001-01-01 00:00   org/webrtc/EglRenderer$1.class
     1308  2001-01-01 00:00   org/webrtc/EglRenderer$2.class
     1937  2001-01-01 00:00   org/webrtc/EglRenderer$EglSurfaceCreation.class
      254  2001-01-01 00:00   org/webrtc/EglRenderer$ErrorCallback.class
      309  2001-01-01 00:00   org/webrtc/EglRenderer$FrameListener.class
      998  2001-01-01 00:00   org/webrtc/EglRenderer$FrameListenerAndParams.class
      294  2001-01-01 00:00   org/webrtc/EglRenderer$RenderListener.class
    24043  2001-01-01 00:00   org/webrtc/EglRenderer.class
     2188  2001-01-01 00:00   org/webrtc/EglThread$HandlerWithExceptionCallbacks.class
      308  2001-01-01 00:00   org/webrtc/EglThread$ReleaseMonitor.class
      281  2001-01-01 00:00   org/webrtc/EglThread$RenderUpdate.class
     6962  2001-01-01 00:00   org/webrtc/EglThread.class
      488  2001-01-01 00:00   org/webrtc/GlGenericDrawer$ShaderCallbacks.class
     1307  2001-01-01 00:00   org/webrtc/GlGenericDrawer$ShaderType.class
     6584  2001-01-01 00:00   org/webrtc/GlGenericDrawer.class
      953  2001-01-01 00:00   org/webrtc/GlRectDrawer$ShaderCallbacks.class
     1347  2001-01-01 00:00   org/webrtc/GlRectDrawer.class
     4305  2001-01-01 00:00   org/webrtc/GlShader.class
     2722  2001-01-01 00:00   org/webrtc/GlTextureFrameBuffer.class
      537  2001-01-01 00:00   org/webrtc/GlUtil$GlOutOfMemoryException.class
     2242  2001-01-01 00:00   org/webrtc/GlUtil.class
     2178  2001-01-01 00:00   org/webrtc/H264Utils.class
     6541  2001-01-01 00:00   org/webrtc/JavaI420Buffer.class
     2352  2001-01-01 00:00   org/webrtc/NV21Buffer.class
      298  2001-01-01 00:00   org/webrtc/RenderSynchronizer$Listener.class
     5034  2001-01-01 00:00   org/webrtc/RenderSynchronizer.class
      603  2001-01-01 00:00   org/webrtc/RendererCommon$GlDrawer.class
      390  2001-01-01 00:00   org/webrtc/RendererCommon$RendererEvents.class
     1351  2001-01-01 00:00   org/webrtc/RendererCommon$ScalingType.class
     2393  2001-01-01 00:00   org/webrtc/RendererCommon$VideoLayoutMeasure.class
     3096  2001-01-01 00:00   org/webrtc/RendererCommon.class
     2717  2001-01-01 00:00   org/webrtc/SurfaceTextureHelper$1.class
     1594  2001-01-01 00:00   org/webrtc/SurfaceTextureHelper$2.class
     1548  2001-01-01 00:00   org/webrtc/SurfaceTextureHelper$3.class
      566  2001-01-01 00:00   org/webrtc/SurfaceTextureHelper$FrameRefMonitor.class
    11293  2001-01-01 00:00   org/webrtc/SurfaceTextureHelper.class
     1378  2001-01-01 00:00   org/webrtc/TextureBufferImpl$1.class
     1178  2001-01-01 00:00   org/webrtc/TextureBufferImpl$2.class
      407  2001-01-01 00:00   org/webrtc/TextureBufferImpl$RefCountMonitor.class
     6633  2001-01-01 00:00   org/webrtc/TextureBufferImpl.class
     1171  2001-01-01 00:00   org/webrtc/TimestampAligner.class
      596  2001-01-01 00:00   org/webrtc/VideoCapturer.class
     1600  2001-01-01 00:00   org/webrtc/VideoCodecMimeType.class
      784  2001-01-01 00:00   org/webrtc/VideoDecoderFallback.class
     1545  2001-01-01 00:00   org/webrtc/VideoDecoderWrapper.class
      915  2001-01-01 00:00   org/webrtc/VideoEncoderFallback.class
     2342  2001-01-01 00:00   org/webrtc/VideoEncoderWrapper.class
      868  2001-01-01 00:00   org/webrtc/VideoFrameDrawer$1.class
     2806  2001-01-01 00:00   org/webrtc/VideoFrameDrawer$YuvUploader.class
     6113  2001-01-01 00:00   org/webrtc/VideoFrameDrawer.class
     2609  2001-01-01 00:00   org/webrtc/WrappedNativeI420Buffer.class
     1555  2001-01-01 00:00   org/webrtc/WrappedNativeVideoDecoder.class
     2138  2001-01-01 00:00   org/webrtc/WrappedNativeVideoEncoder.class
     1877  2001-01-01 00:00   org/webrtc/YuvConverter$ShaderCallbacks.class
     5787  2001-01-01 00:00   org/webrtc/YuvConverter.class
     7667  2001-01-01 00:00   org/webrtc/YuvHelper.class
      463  2001-01-01 00:00   org/jni_zero/CheckDiscard.class
      229  2001-01-01 00:00   org/jni_zero/JniStaticTestMocker.class
      753  2001-01-01 00:00   org/jni_zero/JniTestInstanceHolder.class
      395  2001-01-01 00:00   org/jni_zero/internal/NullUnmarked.class
      391  2001-01-01 00:00   org/jni_zero/internal/Nullable.class
      534  2001-01-01 00:00   org/jni_zero/AccessedByNative.class
      550  2001-01-01 00:00   org/jni_zero/CalledByNative.class
      570  2001-01-01 00:00   org/jni_zero/CalledByNativeForTesting.class
      549  2001-01-01 00:00   org/jni_zero/CalledByNativeUnchecked.class
      419  2001-01-01 00:00   org/jni_zero/JNINamespace.class
     2356  2001-01-01 00:00   org/jni_zero/JniInit.class
     2105  2001-01-01 00:00   org/jni_zero/JniTestInstancesSnapshot.class
      411  2001-01-01 00:00   org/jni_zero/JniType.class
     1837  2001-01-01 00:00   org/jni_zero/JniUtil.class
      445  2001-01-01 00:00   org/jni_zero/NativeClassQualifiedName.class
      452  2001-01-01 00:00   org/jni_zero/NativeMethods.class
      405  2001-01-01 00:00   org/jni_zero/UsedReflectively.class
---------                     -------
911362                     390 files
pi@PC1:~$ mkdir temp_classes
pi@PC1:~$ unzip /home/pi/classes.jar -d temp_classes
Archive:  /home/pi/classes.jar
extracting: temp_classes/org/webrtc/ContextUtils.class
extracting: temp_classes/org/webrtc/Loggable.class
extracting: temp_classes/org/webrtc/Logging$Severity.class
extracting: temp_classes/org/webrtc/Logging.class
extracting: temp_classes/org/webrtc/Size.class
extracting: temp_classes/org/webrtc/ThreadUtils$1.class
extracting: temp_classes/org/webrtc/ThreadUtils$1CaughtException.class
extracting: temp_classes/org/webrtc/ThreadUtils$1Result.class
extracting: temp_classes/org/webrtc/ThreadUtils$2.class
extracting: temp_classes/org/webrtc/ThreadUtils$3.class
extracting: temp_classes/org/webrtc/ThreadUtils$4.class
extracting: temp_classes/org/webrtc/ThreadUtils$BlockingOperation.class
extracting: temp_classes/org/webrtc/ThreadUtils$ThreadChecker.class
extracting: temp_classes/org/webrtc/ThreadUtils.class
extracting: temp_classes/org/webrtc/AudioDecoderFactoryFactory.class
extracting: temp_classes/org/webrtc/AudioEncoderFactoryFactory.class
extracting: temp_classes/org/webrtc/audio/AudioDeviceModule.class
extracting: temp_classes/org/webrtc/ApplicationContextProvider.class
extracting: temp_classes/org/webrtc/CalledByNative.class
extracting: temp_classes/org/webrtc/CalledByNativeUnchecked.class
extracting: temp_classes/org/webrtc/Histogram.class
extracting: temp_classes/org/webrtc/JniCommon.class
extracting: temp_classes/org/webrtc/JniHelper.class
extracting: temp_classes/org/webrtc/Predicate$1.class
extracting: temp_classes/org/webrtc/Predicate$2.class
extracting: temp_classes/org/webrtc/Predicate$3.class
extracting: temp_classes/org/webrtc/Predicate.class
extracting: temp_classes/org/webrtc/RefCountDelegate.class
extracting: temp_classes/org/webrtc/RefCounted.class
extracting: temp_classes/org/webrtc/RtcError.class
extracting: temp_classes/org/webrtc/RtcException.class
extracting: temp_classes/org/webrtc/WebRtcClassLoader.class
extracting: temp_classes/org/webrtc/BuiltinAudioDecoderFactoryFactory.class
extracting: temp_classes/org/webrtc/BuiltinAudioEncoderFactoryFactory.class
extracting: temp_classes/org/webrtc/Camera1Capturer.class
extracting: temp_classes/org/webrtc/Camera1Enumerator.class
extracting: temp_classes/org/webrtc/Camera1Session$1.class
extracting: temp_classes/org/webrtc/Camera1Session$2.class
extracting: temp_classes/org/webrtc/Camera1Session$SessionState.class
extracting: temp_classes/org/webrtc/Camera1Session.class
extracting: temp_classes/org/webrtc/Camera2Capturer.class
extracting: temp_classes/org/webrtc/Camera2Enumerator.class
extracting: temp_classes/org/webrtc/Camera2Session$CameraCaptureCallback.class
extracting: temp_classes/org/webrtc/Camera2Session$CameraStateCallback.class
extracting: temp_classes/org/webrtc/Camera2Session$CaptureSessionCallback.class
extracting: temp_classes/org/webrtc/Camera2Session$SessionState.class
extracting: temp_classes/org/webrtc/Camera2Session.class
extracting: temp_classes/org/webrtc/CameraCapturer$1.class
extracting: temp_classes/org/webrtc/CameraCapturer$2.class
extracting: temp_classes/org/webrtc/CameraCapturer$3.class
extracting: temp_classes/org/webrtc/CameraCapturer$4.class
extracting: temp_classes/org/webrtc/CameraCapturer$5.class
extracting: temp_classes/org/webrtc/CameraCapturer$6.class
extracting: temp_classes/org/webrtc/CameraCapturer$7.class
extracting: temp_classes/org/webrtc/CameraCapturer$8.class
extracting: temp_classes/org/webrtc/CameraCapturer$9.class
extracting: temp_classes/org/webrtc/CameraCapturer$SwitchState.class
extracting: temp_classes/org/webrtc/CameraCapturer.class
extracting: temp_classes/org/webrtc/CameraEnumerationAndroid$1.class
extracting: temp_classes/org/webrtc/CameraEnumerationAndroid$2.class
extracting: temp_classes/org/webrtc/CameraEnumerationAndroid$CaptureFormat$FramerateRange.class
extracting: temp_classes/org/webrtc/CameraEnumerationAndroid$CaptureFormat.class
extracting: temp_classes/org/webrtc/CameraEnumerationAndroid$ClosestComparator.class
extracting: temp_classes/org/webrtc/CameraEnumerationAndroid.class
extracting: temp_classes/org/webrtc/CameraEnumerator.class
extracting: temp_classes/org/webrtc/CameraSession$CreateSessionCallback.class
extracting: temp_classes/org/webrtc/CameraSession$Events.class
extracting: temp_classes/org/webrtc/CameraSession$FailureType.class
extracting: temp_classes/org/webrtc/CameraSession.class
extracting: temp_classes/org/webrtc/CameraVideoCapturer$CameraEventsHandler.class
extracting: temp_classes/org/webrtc/CameraVideoCapturer$CameraStatistics$1.class
extracting: temp_classes/org/webrtc/CameraVideoCapturer$CameraStatistics.class
extracting: temp_classes/org/webrtc/CameraVideoCapturer$CameraSwitchHandler.class
extracting: temp_classes/org/webrtc/CameraVideoCapturer$MediaRecorderHandler.class
extracting: temp_classes/org/webrtc/CameraVideoCapturer.class
extracting: temp_classes/org/webrtc/DefaultVideoDecoderFactory.class
extracting: temp_classes/org/webrtc/DefaultVideoEncoderFactory.class
extracting: temp_classes/org/webrtc/FileVideoCapturer$1.class
extracting: temp_classes/org/webrtc/FileVideoCapturer$VideoReader.class
extracting: temp_classes/org/webrtc/FileVideoCapturer$VideoReaderY4M.class
extracting: temp_classes/org/webrtc/FileVideoCapturer.class
extracting: temp_classes/org/webrtc/VideoFileRenderer$1.class
extracting: temp_classes/org/webrtc/VideoFileRenderer.class
extracting: temp_classes/org/webrtc/AndroidVideoDecoder$1.class
extracting: temp_classes/org/webrtc/AndroidVideoDecoder$DecodedTextureMetadata.class
extracting: temp_classes/org/webrtc/AndroidVideoDecoder$FrameInfo.class
extracting: temp_classes/org/webrtc/AndroidVideoDecoder.class
extracting: temp_classes/org/webrtc/BaseBitrateAdjuster.class
extracting: temp_classes/org/webrtc/BitrateAdjuster.class
extracting: temp_classes/org/webrtc/DynamicBitrateAdjuster.class
extracting: temp_classes/org/webrtc/FramerateBitrateAdjuster.class
extracting: temp_classes/org/webrtc/HardwareVideoDecoderFactory$1.class
extracting: temp_classes/org/webrtc/HardwareVideoDecoderFactory.class
extracting: temp_classes/org/webrtc/HardwareVideoEncoder$1.class
extracting: temp_classes/org/webrtc/HardwareVideoEncoder$BusyCount.class
extracting: temp_classes/org/webrtc/HardwareVideoEncoder.class
extracting: temp_classes/org/webrtc/HardwareVideoEncoderFactory$1.class
extracting: temp_classes/org/webrtc/HardwareVideoEncoderFactory.class
extracting: temp_classes/org/webrtc/MediaCodecUtils$1.class
extracting: temp_classes/org/webrtc/MediaCodecUtils.class
extracting: temp_classes/org/webrtc/MediaCodecVideoDecoderFactory.class
extracting: temp_classes/org/webrtc/MediaCodecWrapper.class
extracting: temp_classes/org/webrtc/MediaCodecWrapperFactory.class
extracting: temp_classes/org/webrtc/MediaCodecWrapperFactoryImpl$MediaCodecWrapperImpl.class
extracting: temp_classes/org/webrtc/MediaCodecWrapperFactoryImpl.class
extracting: temp_classes/org/webrtc/NV12Buffer.class
extracting: temp_classes/org/webrtc/PlatformSoftwareVideoDecoderFactory$1.class
extracting: temp_classes/org/webrtc/PlatformSoftwareVideoDecoderFactory.class
extracting: temp_classes/org/webrtc/audio/JavaAudioDeviceModule$AudioRecordErrorCallback.class
extracting: temp_classes/org/webrtc/audio/JavaAudioDeviceModule$AudioRecordStartErrorCode.class
extracting: temp_classes/org/webrtc/audio/JavaAudioDeviceModule$AudioRecordStateCallback.class
extracting: temp_classes/org/webrtc/audio/JavaAudioDeviceModule$AudioSamples.class
extracting: temp_classes/org/webrtc/audio/JavaAudioDeviceModule$AudioTrackErrorCallback.class
extracting: temp_classes/org/webrtc/audio/JavaAudioDeviceModule$AudioTrackStartErrorCode.class
extracting: temp_classes/org/webrtc/audio/JavaAudioDeviceModule$AudioTrackStateCallback.class
extracting: temp_classes/org/webrtc/audio/JavaAudioDeviceModule$Builder.class
extracting: temp_classes/org/webrtc/audio/JavaAudioDeviceModule$SamplesReadyCallback.class
extracting: temp_classes/org/webrtc/audio/JavaAudioDeviceModule.class
extracting: temp_classes/org/webrtc/audio/LowLatencyAudioBufferManager.class
extracting: temp_classes/org/webrtc/audio/VolumeLogger$LogVolumeTask.class
extracting: temp_classes/org/webrtc/audio/VolumeLogger.class
extracting: temp_classes/org/webrtc/audio/WebRtcAudioEffects.class
extracting: temp_classes/org/webrtc/audio/WebRtcAudioManager.class
extracting: temp_classes/org/webrtc/audio/WebRtcAudioRecord$1.class
extracting: temp_classes/org/webrtc/audio/WebRtcAudioRecord$AudioRecordThread.class
extracting: temp_classes/org/webrtc/audio/WebRtcAudioRecord.class
extracting: temp_classes/org/webrtc/audio/WebRtcAudioTrack$AudioTrackThread.class
extracting: temp_classes/org/webrtc/audio/WebRtcAudioTrack.class
extracting: temp_classes/org/webrtc/audio/WebRtcAudioUtils.class
extracting: temp_classes/org/webrtc/LibaomAv1Encoder.class
extracting: temp_classes/org/webrtc/Empty.class
extracting: temp_classes/org/webrtc/Metrics$HistogramInfo.class
extracting: temp_classes/org/webrtc/Metrics.class
extracting: temp_classes/org/webrtc/LibvpxVp8Decoder.class
extracting: temp_classes/org/webrtc/LibvpxVp8Encoder.class
extracting: temp_classes/org/webrtc/LibvpxVp9Decoder.class
extracting: temp_classes/org/webrtc/LibvpxVp9Encoder.class
extracting: temp_classes/org/webrtc/JNILogging.class
extracting: temp_classes/org/webrtc/AddIceObserver.class
extracting: temp_classes/org/webrtc/AudioProcessingFactory.class
extracting: temp_classes/org/webrtc/AudioSource.class
extracting: temp_classes/org/webrtc/AudioTrack.class
extracting: temp_classes/org/webrtc/CallSessionFileRotatingLogSink.class
extracting: temp_classes/org/webrtc/CandidatePairChangeEvent.class
extracting: temp_classes/org/webrtc/CryptoOptions$Builder.class
extracting: temp_classes/org/webrtc/CryptoOptions$SFrame.class
extracting: temp_classes/org/webrtc/CryptoOptions$Srtp.class
extracting: temp_classes/org/webrtc/CryptoOptions.class
extracting: temp_classes/org/webrtc/DataChannel$Buffer.class
extracting: temp_classes/org/webrtc/DataChannel$Init.class
extracting: temp_classes/org/webrtc/DataChannel$Observer.class
extracting: temp_classes/org/webrtc/DataChannel$State.class
extracting: temp_classes/org/webrtc/DataChannel.class
extracting: temp_classes/org/webrtc/DtmfSender.class
extracting: temp_classes/org/webrtc/FecControllerFactoryFactoryInterface.class
extracting: temp_classes/org/webrtc/FrameDecryptor.class
extracting: temp_classes/org/webrtc/FrameEncryptor.class
extracting: temp_classes/org/webrtc/IceCandidate.class
extracting: temp_classes/org/webrtc/IceCandidateErrorEvent.class
extracting: temp_classes/org/webrtc/MediaConstraints$KeyValuePair.class
extracting: temp_classes/org/webrtc/MediaConstraints.class
extracting: temp_classes/org/webrtc/MediaSource$State.class
extracting: temp_classes/org/webrtc/MediaSource.class
extracting: temp_classes/org/webrtc/MediaStream.class
extracting: temp_classes/org/webrtc/MediaStreamTrack$MediaType.class
extracting: temp_classes/org/webrtc/MediaStreamTrack$State.class
extracting: temp_classes/org/webrtc/MediaStreamTrack.class
extracting: temp_classes/org/webrtc/NativeAndroidVideoTrackSource.class
extracting: temp_classes/org/webrtc/NativeCapturerObserver.class
extracting: temp_classes/org/webrtc/NativeLibrary$DefaultLoader.class
extracting: temp_classes/org/webrtc/NativeLibrary.class
extracting: temp_classes/org/webrtc/NativeLibraryLoader.class
extracting: temp_classes/org/webrtc/NativePeerConnectionFactory.class
extracting: temp_classes/org/webrtc/NetEqFactoryFactory.class
extracting: temp_classes/org/webrtc/NetworkChangeDetector$ConnectionType.class
extracting: temp_classes/org/webrtc/NetworkChangeDetector$IPAddress.class
extracting: temp_classes/org/webrtc/NetworkChangeDetector$NetworkInformation.class
extracting: temp_classes/org/webrtc/NetworkChangeDetector$Observer.class
extracting: temp_classes/org/webrtc/NetworkChangeDetector.class
extracting: temp_classes/org/webrtc/NetworkChangeDetectorFactory.class
extracting: temp_classes/org/webrtc/NetworkControllerFactoryFactory.class
extracting: temp_classes/org/webrtc/NetworkMonitor$1.class
extracting: temp_classes/org/webrtc/NetworkMonitor$2.class
extracting: temp_classes/org/webrtc/NetworkMonitor$InstanceHolder.class
extracting: temp_classes/org/webrtc/NetworkMonitor$NetworkObserver.class
extracting: temp_classes/org/webrtc/NetworkMonitor.class
extracting: temp_classes/org/webrtc/NetworkMonitorAutoDetect$ConnectivityManagerDelegate.class
extracting: temp_classes/org/webrtc/NetworkMonitorAutoDetect$NetworkState.class
extracting: temp_classes/org/webrtc/NetworkMonitorAutoDetect$SimpleNetworkCallback.class
extracting: temp_classes/org/webrtc/NetworkMonitorAutoDetect$WifiDirectManagerDelegate.class
extracting: temp_classes/org/webrtc/NetworkMonitorAutoDetect$WifiManagerDelegate.class
extracting: temp_classes/org/webrtc/NetworkMonitorAutoDetect.class
extracting: temp_classes/org/webrtc/NetworkPreference.class
extracting: temp_classes/org/webrtc/NetworkStatePredictorFactoryFactory.class
extracting: temp_classes/org/webrtc/PeerConnection$AdapterType.class
extracting: temp_classes/org/webrtc/PeerConnection$BundlePolicy.class
extracting: temp_classes/org/webrtc/PeerConnection$CandidateNetworkPolicy.class
extracting: temp_classes/org/webrtc/PeerConnection$ContinualGatheringPolicy.class
extracting: temp_classes/org/webrtc/PeerConnection$IceConnectionState.class
extracting: temp_classes/org/webrtc/PeerConnection$IceGatheringState.class
extracting: temp_classes/org/webrtc/PeerConnection$IceServer$Builder.class
extracting: temp_classes/org/webrtc/PeerConnection$IceServer.class
extracting: temp_classes/org/webrtc/PeerConnection$IceTransportsType.class
extracting: temp_classes/org/webrtc/PeerConnection$KeyType.class
extracting: temp_classes/org/webrtc/PeerConnection$Observer.class
extracting: temp_classes/org/webrtc/PeerConnection$PeerConnectionState.class
extracting: temp_classes/org/webrtc/PeerConnection$PortAllocatorFlags.class
extracting: temp_classes/org/webrtc/PeerConnection$PortPrunePolicy.class
extracting: temp_classes/org/webrtc/PeerConnection$RTCConfiguration.class
extracting: temp_classes/org/webrtc/PeerConnection$RtcpMuxPolicy.class
extracting: temp_classes/org/webrtc/PeerConnection$SdpSemantics.class
extracting: temp_classes/org/webrtc/PeerConnection$SignalingState.class
extracting: temp_classes/org/webrtc/PeerConnection$TcpCandidatePolicy.class
extracting: temp_classes/org/webrtc/PeerConnection$TlsCertPolicy.class
extracting: temp_classes/org/webrtc/PeerConnection.class
extracting: temp_classes/org/webrtc/PeerConnectionDependencies$Builder.class
extracting: temp_classes/org/webrtc/PeerConnectionDependencies.class
extracting: temp_classes/org/webrtc/PeerConnectionFactory$Builder.class
extracting: temp_classes/org/webrtc/PeerConnectionFactory$InitializationOptions$Builder.class
extracting: temp_classes/org/webrtc/PeerConnectionFactory$InitializationOptions.class
extracting: temp_classes/org/webrtc/PeerConnectionFactory$Options.class
extracting: temp_classes/org/webrtc/PeerConnectionFactory$ThreadInfo.class
extracting: temp_classes/org/webrtc/PeerConnectionFactory.class
extracting: temp_classes/org/webrtc/Priority.class
extracting: temp_classes/org/webrtc/RTCStats.class
extracting: temp_classes/org/webrtc/RTCStatsCollectorCallback.class
extracting: temp_classes/org/webrtc/RTCStatsReport.class
extracting: temp_classes/org/webrtc/RtcCertificatePem.class
extracting: temp_classes/org/webrtc/RtpCapabilities$CodecCapability.class
extracting: temp_classes/org/webrtc/RtpCapabilities$HeaderExtensionCapability.class
extracting: temp_classes/org/webrtc/RtpCapabilities.class
extracting: temp_classes/org/webrtc/RtpParameters$Codec.class
extracting: temp_classes/org/webrtc/RtpParameters$DegradationPreference.class
extracting: temp_classes/org/webrtc/RtpParameters$Encoding.class
extracting: temp_classes/org/webrtc/RtpParameters$HeaderExtension.class
extracting: temp_classes/org/webrtc/RtpParameters$Rtcp.class
extracting: temp_classes/org/webrtc/RtpParameters.class
extracting: temp_classes/org/webrtc/RtpReceiver$Observer.class
extracting: temp_classes/org/webrtc/RtpReceiver.class
extracting: temp_classes/org/webrtc/RtpSender.class
extracting: temp_classes/org/webrtc/RtpTransceiver$RtpTransceiverDirection.class
extracting: temp_classes/org/webrtc/RtpTransceiver$RtpTransceiverInit.class
extracting: temp_classes/org/webrtc/RtpTransceiver.class
extracting: temp_classes/org/webrtc/SSLCertificateVerifier.class
extracting: temp_classes/org/webrtc/SdpObserver.class
extracting: temp_classes/org/webrtc/SessionDescription$Type.class
extracting: temp_classes/org/webrtc/SessionDescription.class
extracting: temp_classes/org/webrtc/StatsObserver.class
extracting: temp_classes/org/webrtc/StatsReport$Value.class
extracting: temp_classes/org/webrtc/StatsReport.class
extracting: temp_classes/org/webrtc/TurnCustomizer.class
extracting: temp_classes/org/webrtc/VideoProcessor$FrameAdaptationParameters.class
extracting: temp_classes/org/webrtc/VideoProcessor.class
extracting: temp_classes/org/webrtc/VideoSource$1.class
extracting: temp_classes/org/webrtc/VideoSource$AspectRatio.class
extracting: temp_classes/org/webrtc/VideoSource.class
extracting: temp_classes/org/webrtc/VideoTrack.class
extracting: temp_classes/org/webrtc/ScreenCapturerAndroid$1.class
extracting: temp_classes/org/webrtc/ScreenCapturerAndroid.class
extracting: temp_classes/org/webrtc/SurfaceEglRenderer.class
extracting: temp_classes/org/webrtc/SurfaceViewRenderer.class
extracting: temp_classes/org/webrtc/SoftwareVideoDecoderFactory$1.class
extracting: temp_classes/org/webrtc/SoftwareVideoDecoderFactory.class
extracting: temp_classes/org/webrtc/SoftwareVideoEncoderFactory$1.class
extracting: temp_classes/org/webrtc/SoftwareVideoEncoderFactory.class
extracting: temp_classes/org/webrtc/CapturerObserver.class
extracting: temp_classes/org/webrtc/EncodedImage$Builder.class
extracting: temp_classes/org/webrtc/EncodedImage$FrameType.class
extracting: temp_classes/org/webrtc/EncodedImage.class
extracting: temp_classes/org/webrtc/VideoCodecInfo.class
extracting: temp_classes/org/webrtc/VideoCodecStatus.class
extracting: temp_classes/org/webrtc/VideoDecoder$Callback.class
extracting: temp_classes/org/webrtc/VideoDecoder$DecodeInfo.class
extracting: temp_classes/org/webrtc/VideoDecoder$Settings.class
extracting: temp_classes/org/webrtc/VideoDecoder.class
extracting: temp_classes/org/webrtc/VideoDecoderFactory.class
extracting: temp_classes/org/webrtc/VideoEncoder$BitrateAllocation.class
extracting: temp_classes/org/webrtc/VideoEncoder$Callback.class
extracting: temp_classes/org/webrtc/VideoEncoder$Capabilities.class
extracting: temp_classes/org/webrtc/VideoEncoder$CodecSpecificInfo.class
extracting: temp_classes/org/webrtc/VideoEncoder$CodecSpecificInfoAV1.class
extracting: temp_classes/org/webrtc/VideoEncoder$CodecSpecificInfoH264.class
extracting: temp_classes/org/webrtc/VideoEncoder$CodecSpecificInfoVP8.class
extracting: temp_classes/org/webrtc/VideoEncoder$CodecSpecificInfoVP9.class
extracting: temp_classes/org/webrtc/VideoEncoder$EncodeInfo.class
extracting: temp_classes/org/webrtc/VideoEncoder$EncoderInfo.class
extracting: temp_classes/org/webrtc/VideoEncoder$RateControlParameters.class
extracting: temp_classes/org/webrtc/VideoEncoder$ResolutionBitrateLimits.class
extracting: temp_classes/org/webrtc/VideoEncoder$ScalingSettings.class
extracting: temp_classes/org/webrtc/VideoEncoder$Settings.class
extracting: temp_classes/org/webrtc/VideoEncoder.class
extracting: temp_classes/org/webrtc/VideoEncoderFactory$VideoEncoderSelector.class
extracting: temp_classes/org/webrtc/VideoEncoderFactory.class
extracting: temp_classes/org/webrtc/VideoFrame$Buffer.class
extracting: temp_classes/org/webrtc/VideoFrame$I420Buffer.class
extracting: temp_classes/org/webrtc/VideoFrame$TextureBuffer$Type.class
extracting: temp_classes/org/webrtc/VideoFrame$TextureBuffer.class
extracting: temp_classes/org/webrtc/VideoFrame.class
extracting: temp_classes/org/webrtc/VideoFrameBufferType.class
extracting: temp_classes/org/webrtc/VideoSink.class
extracting: temp_classes/org/webrtc/EglBase$ConfigBuilder.class
extracting: temp_classes/org/webrtc/EglBase$Context.class
extracting: temp_classes/org/webrtc/EglBase$EglConnection.class
extracting: temp_classes/org/webrtc/EglBase.class
extracting: temp_classes/org/webrtc/EglBase10$Context.class
extracting: temp_classes/org/webrtc/EglBase10$EglConnection.class
extracting: temp_classes/org/webrtc/EglBase10.class
extracting: temp_classes/org/webrtc/EglBase10Impl$1FakeSurfaceHolder.class
extracting: temp_classes/org/webrtc/EglBase10Impl$Context.class
extracting: temp_classes/org/webrtc/EglBase10Impl$EglConnection.class
extracting: temp_classes/org/webrtc/EglBase10Impl.class
extracting: temp_classes/org/webrtc/EglBase14$Context.class
extracting: temp_classes/org/webrtc/EglBase14$EglConnection.class
extracting: temp_classes/org/webrtc/EglBase14.class
extracting: temp_classes/org/webrtc/EglBase14Impl$Context.class
extracting: temp_classes/org/webrtc/EglBase14Impl$EglConnection.class
extracting: temp_classes/org/webrtc/EglBase14Impl.class
extracting: temp_classes/org/webrtc/EglRenderer$1.class
extracting: temp_classes/org/webrtc/EglRenderer$2.class
extracting: temp_classes/org/webrtc/EglRenderer$EglSurfaceCreation.class
extracting: temp_classes/org/webrtc/EglRenderer$ErrorCallback.class
extracting: temp_classes/org/webrtc/EglRenderer$FrameListener.class
extracting: temp_classes/org/webrtc/EglRenderer$FrameListenerAndParams.class
extracting: temp_classes/org/webrtc/EglRenderer$RenderListener.class
extracting: temp_classes/org/webrtc/EglRenderer.class
extracting: temp_classes/org/webrtc/EglThread$HandlerWithExceptionCallbacks.class
extracting: temp_classes/org/webrtc/EglThread$ReleaseMonitor.class
extracting: temp_classes/org/webrtc/EglThread$RenderUpdate.class
extracting: temp_classes/org/webrtc/EglThread.class
extracting: temp_classes/org/webrtc/GlGenericDrawer$ShaderCallbacks.class
extracting: temp_classes/org/webrtc/GlGenericDrawer$ShaderType.class
extracting: temp_classes/org/webrtc/GlGenericDrawer.class
extracting: temp_classes/org/webrtc/GlRectDrawer$ShaderCallbacks.class
extracting: temp_classes/org/webrtc/GlRectDrawer.class
extracting: temp_classes/org/webrtc/GlShader.class
extracting: temp_classes/org/webrtc/GlTextureFrameBuffer.class
extracting: temp_classes/org/webrtc/GlUtil$GlOutOfMemoryException.class
extracting: temp_classes/org/webrtc/GlUtil.class
extracting: temp_classes/org/webrtc/H264Utils.class
extracting: temp_classes/org/webrtc/JavaI420Buffer.class
extracting: temp_classes/org/webrtc/NV21Buffer.class
extracting: temp_classes/org/webrtc/RenderSynchronizer$Listener.class
extracting: temp_classes/org/webrtc/RenderSynchronizer.class
extracting: temp_classes/org/webrtc/RendererCommon$GlDrawer.class
extracting: temp_classes/org/webrtc/RendererCommon$RendererEvents.class
extracting: temp_classes/org/webrtc/RendererCommon$ScalingType.class
extracting: temp_classes/org/webrtc/RendererCommon$VideoLayoutMeasure.class
extracting: temp_classes/org/webrtc/RendererCommon.class
extracting: temp_classes/org/webrtc/SurfaceTextureHelper$1.class
extracting: temp_classes/org/webrtc/SurfaceTextureHelper$2.class
extracting: temp_classes/org/webrtc/SurfaceTextureHelper$3.class
extracting: temp_classes/org/webrtc/SurfaceTextureHelper$FrameRefMonitor.class
extracting: temp_classes/org/webrtc/SurfaceTextureHelper.class
extracting: temp_classes/org/webrtc/TextureBufferImpl$1.class
extracting: temp_classes/org/webrtc/TextureBufferImpl$2.class
extracting: temp_classes/org/webrtc/TextureBufferImpl$RefCountMonitor.class
extracting: temp_classes/org/webrtc/TextureBufferImpl.class
extracting: temp_classes/org/webrtc/TimestampAligner.class
extracting: temp_classes/org/webrtc/VideoCapturer.class
extracting: temp_classes/org/webrtc/VideoCodecMimeType.class
extracting: temp_classes/org/webrtc/VideoDecoderFallback.class
extracting: temp_classes/org/webrtc/VideoDecoderWrapper.class
extracting: temp_classes/org/webrtc/VideoEncoderFallback.class
extracting: temp_classes/org/webrtc/VideoEncoderWrapper.class
extracting: temp_classes/org/webrtc/VideoFrameDrawer$1.class
extracting: temp_classes/org/webrtc/VideoFrameDrawer$YuvUploader.class
extracting: temp_classes/org/webrtc/VideoFrameDrawer.class
extracting: temp_classes/org/webrtc/WrappedNativeI420Buffer.class
extracting: temp_classes/org/webrtc/WrappedNativeVideoDecoder.class
extracting: temp_classes/org/webrtc/WrappedNativeVideoEncoder.class
extracting: temp_classes/org/webrtc/YuvConverter$ShaderCallbacks.class
extracting: temp_classes/org/webrtc/YuvConverter.class
extracting: temp_classes/org/webrtc/YuvHelper.class
extracting: temp_classes/org/jni_zero/CheckDiscard.class
extracting: temp_classes/org/jni_zero/JniStaticTestMocker.class
extracting: temp_classes/org/jni_zero/JniTestInstanceHolder.class
extracting: temp_classes/org/jni_zero/internal/NullUnmarked.class
extracting: temp_classes/org/jni_zero/internal/Nullable.class
extracting: temp_classes/org/jni_zero/AccessedByNative.class
extracting: temp_classes/org/jni_zero/CalledByNative.class
extracting: temp_classes/org/jni_zero/CalledByNativeForTesting.class
extracting: temp_classes/org/jni_zero/CalledByNativeUnchecked.class
extracting: temp_classes/org/jni_zero/JNINamespace.class
extracting: temp_classes/org/jni_zero/JniInit.class
extracting: temp_classes/org/jni_zero/JniTestInstancesSnapshot.class
extracting: temp_classes/org/jni_zero/JniType.class
extracting: temp_classes/org/jni_zero/JniUtil.class
extracting: temp_classes/org/jni_zero/NativeClassQualifiedName.class
extracting: temp_classes/org/jni_zero/NativeMethods.class
extracting: temp_classes/org/jni_zero/UsedReflectively.class
pi@PC1:~$ ls -R temp_classes
temp_classes:
org

temp_classes/org:
jni_zero  webrtc

temp_classes/org/jni_zero:
AccessedByNative.class          CalledByNativeUnchecked.class  JniInit.class                JniTestInstancesSnapshot.class  NativeClassQualifiedName.class  internal
CalledByNative.class            CheckDiscard.class             JniStaticTestMocker.class    JniType.class                   NativeMethods.class
CalledByNativeForTesting.class  JNINamespace.class             JniTestInstanceHolder.class  JniUtil.class                   UsedReflectively.class

temp_classes/org/jni_zero/internal:
NullUnmarked.class  Nullable.class

temp_classes/org/webrtc:
AddIceObserver.class                                           GlGenericDrawer.class                                         RenderSynchronizer.class
'AndroidVideoDecoder$1.class'                                  'GlRectDrawer$ShaderCallbacks.class'                          'RendererCommon$GlDrawer.class'
'AndroidVideoDecoder$DecodedTextureMetadata.class'              GlRectDrawer.class                                           'RendererCommon$RendererEvents.class'
'AndroidVideoDecoder$FrameInfo.class'                           GlShader.class                                               'RendererCommon$ScalingType.class'
AndroidVideoDecoder.class                                      GlTextureFrameBuffer.class                                   'RendererCommon$VideoLayoutMeasure.class'
ApplicationContextProvider.class                              'GlUtil$GlOutOfMemoryException.class'                          RendererCommon.class
AudioDecoderFactoryFactory.class                               GlUtil.class                                                  RtcCertificatePem.class
AudioEncoderFactoryFactory.class                               H264Utils.class                                               RtcError.class
AudioProcessingFactory.class                                  'HardwareVideoDecoderFactory$1.class'                          RtcException.class
AudioSource.class                                              HardwareVideoDecoderFactory.class                            'RtpCapabilities$CodecCapability.class'
AudioTrack.class                                              'HardwareVideoEncoder$1.class'                                'RtpCapabilities$HeaderExtensionCapability.class'
BaseBitrateAdjuster.class                                     'HardwareVideoEncoder$BusyCount.class'                         RtpCapabilities.class
BitrateAdjuster.class                                          HardwareVideoEncoder.class                                   'RtpParameters$Codec.class'
BuiltinAudioDecoderFactoryFactory.class                       'HardwareVideoEncoderFactory$1.class'                         'RtpParameters$DegradationPreference.class'
BuiltinAudioEncoderFactoryFactory.class                        HardwareVideoEncoderFactory.class                            'RtpParameters$Encoding.class'
CallSessionFileRotatingLogSink.class                           Histogram.class                                              'RtpParameters$HeaderExtension.class'
CalledByNative.class                                           IceCandidate.class                                           'RtpParameters$Rtcp.class'
CalledByNativeUnchecked.class                                  IceCandidateErrorEvent.class                                  RtpParameters.class
Camera1Capturer.class                                          JNILogging.class                                             'RtpReceiver$Observer.class'
Camera1Enumerator.class                                        JavaI420Buffer.class                                          RtpReceiver.class
'Camera1Session$1.class'                                        JniCommon.class                                               RtpSender.class
'Camera1Session$2.class'                                        JniHelper.class                                              'RtpTransceiver$RtpTransceiverDirection.class'
'Camera1Session$SessionState.class'                             LibaomAv1Encoder.class                                       'RtpTransceiver$RtpTransceiverInit.class'
Camera1Session.class                                           LibvpxVp8Decoder.class                                        RtpTransceiver.class
Camera2Capturer.class                                          LibvpxVp8Encoder.class                                        SSLCertificateVerifier.class
Camera2Enumerator.class                                        LibvpxVp9Decoder.class                                       'ScreenCapturerAndroid$1.class'
'Camera2Session$CameraCaptureCallback.class'                    LibvpxVp9Encoder.class                                        ScreenCapturerAndroid.class
'Camera2Session$CameraStateCallback.class'                      Loggable.class                                                SdpObserver.class
'Camera2Session$CaptureSessionCallback.class'                  'Logging$Severity.class'                                      'SessionDescription$Type.class'
'Camera2Session$SessionState.class'                             Logging.class                                                 SessionDescription.class
Camera2Session.class                                          'MediaCodecUtils$1.class'                                      Size.class
'CameraCapturer$1.class'                                        MediaCodecUtils.class                                        'SoftwareVideoDecoderFactory$1.class'
'CameraCapturer$2.class'                                        MediaCodecVideoDecoderFactory.class                           SoftwareVideoDecoderFactory.class
'CameraCapturer$3.class'                                        MediaCodecWrapper.class                                      'SoftwareVideoEncoderFactory$1.class'
'CameraCapturer$4.class'                                        MediaCodecWrapperFactory.class                                SoftwareVideoEncoderFactory.class
'CameraCapturer$5.class'                                       'MediaCodecWrapperFactoryImpl$MediaCodecWrapperImpl.class'     StatsObserver.class
'CameraCapturer$6.class'                                        MediaCodecWrapperFactoryImpl.class                           'StatsReport$Value.class'
'CameraCapturer$7.class'                                       'MediaConstraints$KeyValuePair.class'                          StatsReport.class
'CameraCapturer$8.class'                                        MediaConstraints.class                                        SurfaceEglRenderer.class
'CameraCapturer$9.class'                                       'MediaSource$State.class'                                     'SurfaceTextureHelper$1.class'
'CameraCapturer$SwitchState.class'                              MediaSource.class                                            'SurfaceTextureHelper$2.class'
CameraCapturer.class                                           MediaStream.class                                            'SurfaceTextureHelper$3.class'
'CameraEnumerationAndroid$1.class'                             'MediaStreamTrack$MediaType.class'                            'SurfaceTextureHelper$FrameRefMonitor.class'
'CameraEnumerationAndroid$2.class'                             'MediaStreamTrack$State.class'                                 SurfaceTextureHelper.class
'CameraEnumerationAndroid$CaptureFormat$FramerateRange.class'   MediaStreamTrack.class                                        SurfaceViewRenderer.class
'CameraEnumerationAndroid$CaptureFormat.class'                 'Metrics$HistogramInfo.class'                                 'TextureBufferImpl$1.class'
'CameraEnumerationAndroid$ClosestComparator.class'              Metrics.class                                                'TextureBufferImpl$2.class'
CameraEnumerationAndroid.class                                 NV12Buffer.class                                             'TextureBufferImpl$RefCountMonitor.class'
CameraEnumerator.class                                         NV21Buffer.class                                              TextureBufferImpl.class
'CameraSession$CreateSessionCallback.class'                     NativeAndroidVideoTrackSource.class                          'ThreadUtils$1.class'
'CameraSession$Events.class'                                    NativeCapturerObserver.class                                 'ThreadUtils$1CaughtException.class'
'CameraSession$FailureType.class'                              'NativeLibrary$DefaultLoader.class'                           'ThreadUtils$1Result.class'
CameraSession.class                                            NativeLibrary.class                                          'ThreadUtils$2.class'
'CameraVideoCapturer$CameraEventsHandler.class'                 NativeLibraryLoader.class                                    'ThreadUtils$3.class'
'CameraVideoCapturer$CameraStatistics$1.class'                  NativePeerConnectionFactory.class                            'ThreadUtils$4.class'
'CameraVideoCapturer$CameraStatistics.class'                    NetEqFactoryFactory.class                                    'ThreadUtils$BlockingOperation.class'
'CameraVideoCapturer$CameraSwitchHandler.class'                'NetworkChangeDetector$ConnectionType.class'                  'ThreadUtils$ThreadChecker.class'
'CameraVideoCapturer$MediaRecorderHandler.class'               'NetworkChangeDetector$IPAddress.class'                        ThreadUtils.class
CameraVideoCapturer.class                                     'NetworkChangeDetector$NetworkInformation.class'               TimestampAligner.class
CandidatePairChangeEvent.class                                'NetworkChangeDetector$Observer.class'                         TurnCustomizer.class
CapturerObserver.class                                         NetworkChangeDetector.class                                   VideoCapturer.class
ContextUtils.class                                             NetworkChangeDetectorFactory.class                            VideoCodecInfo.class
'CryptoOptions$Builder.class'                                   NetworkControllerFactoryFactory.class                         VideoCodecMimeType.class
'CryptoOptions$SFrame.class'                                   'NetworkMonitor$1.class'                                       VideoCodecStatus.class
'CryptoOptions$Srtp.class'                                     'NetworkMonitor$2.class'                                      'VideoDecoder$Callback.class'
CryptoOptions.class                                           'NetworkMonitor$InstanceHolder.class'                         'VideoDecoder$DecodeInfo.class'
'DataChannel$Buffer.class'                                     'NetworkMonitor$NetworkObserver.class'                        'VideoDecoder$Settings.class'
'DataChannel$Init.class'                                        NetworkMonitor.class                                          VideoDecoder.class
'DataChannel$Observer.class'                                   'NetworkMonitorAutoDetect$ConnectivityManagerDelegate.class'   VideoDecoderFactory.class
'DataChannel$State.class'                                      'NetworkMonitorAutoDetect$NetworkState.class'                  VideoDecoderFallback.class
DataChannel.class                                             'NetworkMonitorAutoDetect$SimpleNetworkCallback.class'         VideoDecoderWrapper.class
DefaultVideoDecoderFactory.class                              'NetworkMonitorAutoDetect$WifiDirectManagerDelegate.class'    'VideoEncoder$BitrateAllocation.class'
DefaultVideoEncoderFactory.class                              'NetworkMonitorAutoDetect$WifiManagerDelegate.class'          'VideoEncoder$Callback.class'
DtmfSender.class                                               NetworkMonitorAutoDetect.class                               'VideoEncoder$Capabilities.class'
DynamicBitrateAdjuster.class                                   NetworkPreference.class                                      'VideoEncoder$CodecSpecificInfo.class'
'EglBase$ConfigBuilder.class'                                   NetworkStatePredictorFactoryFactory.class                    'VideoEncoder$CodecSpecificInfoAV1.class'
'EglBase$Context.class'                                        'PeerConnection$AdapterType.class'                            'VideoEncoder$CodecSpecificInfoH264.class'
'EglBase$EglConnection.class'                                  'PeerConnection$BundlePolicy.class'                           'VideoEncoder$CodecSpecificInfoVP8.class'
EglBase.class                                                 'PeerConnection$CandidateNetworkPolicy.class'                 'VideoEncoder$CodecSpecificInfoVP9.class'
'EglBase10$Context.class'                                      'PeerConnection$ContinualGatheringPolicy.class'               'VideoEncoder$EncodeInfo.class'
'EglBase10$EglConnection.class'                                'PeerConnection$IceConnectionState.class'                     'VideoEncoder$EncoderInfo.class'
EglBase10.class                                               'PeerConnection$IceGatheringState.class'                      'VideoEncoder$RateControlParameters.class'
'EglBase10Impl$1FakeSurfaceHolder.class'                       'PeerConnection$IceServer$Builder.class'                      'VideoEncoder$ResolutionBitrateLimits.class'
'EglBase10Impl$Context.class'                                  'PeerConnection$IceServer.class'                              'VideoEncoder$ScalingSettings.class'
'EglBase10Impl$EglConnection.class'                            'PeerConnection$IceTransportsType.class'                      'VideoEncoder$Settings.class'
EglBase10Impl.class                                           'PeerConnection$KeyType.class'                                 VideoEncoder.class
'EglBase14$Context.class'                                      'PeerConnection$Observer.class'                               'VideoEncoderFactory$VideoEncoderSelector.class'
'EglBase14$EglConnection.class'                                'PeerConnection$PeerConnectionState.class'                     VideoEncoderFactory.class
EglBase14.class                                               'PeerConnection$PortAllocatorFlags.class'                      VideoEncoderFallback.class
'EglBase14Impl$Context.class'                                  'PeerConnection$PortPrunePolicy.class'                         VideoEncoderWrapper.class
'EglBase14Impl$EglConnection.class'                            'PeerConnection$RTCConfiguration.class'                       'VideoFileRenderer$1.class'
EglBase14Impl.class                                           'PeerConnection$RtcpMuxPolicy.class'                           VideoFileRenderer.class
'EglRenderer$1.class'                                          'PeerConnection$SdpSemantics.class'                           'VideoFrame$Buffer.class'
'EglRenderer$2.class'                                          'PeerConnection$SignalingState.class'                         'VideoFrame$I420Buffer.class'
'EglRenderer$EglSurfaceCreation.class'                         'PeerConnection$TcpCandidatePolicy.class'                     'VideoFrame$TextureBuffer$Type.class'
'EglRenderer$ErrorCallback.class'                              'PeerConnection$TlsCertPolicy.class'                          'VideoFrame$TextureBuffer.class'
'EglRenderer$FrameListener.class'                               PeerConnection.class                                          VideoFrame.class
'EglRenderer$FrameListenerAndParams.class'                     'PeerConnectionDependencies$Builder.class'                     VideoFrameBufferType.class
'EglRenderer$RenderListener.class'                              PeerConnectionDependencies.class                             'VideoFrameDrawer$1.class'
EglRenderer.class                                             'PeerConnectionFactory$Builder.class'                         'VideoFrameDrawer$YuvUploader.class'
'EglThread$HandlerWithExceptionCallbacks.class'                'PeerConnectionFactory$InitializationOptions$Builder.class'    VideoFrameDrawer.class
'EglThread$ReleaseMonitor.class'                               'PeerConnectionFactory$InitializationOptions.class'           'VideoProcessor$FrameAdaptationParameters.class'
'EglThread$RenderUpdate.class'                                 'PeerConnectionFactory$Options.class'                          VideoProcessor.class
EglThread.class                                               'PeerConnectionFactory$ThreadInfo.class'                       VideoSink.class
Empty.class                                                    PeerConnectionFactory.class                                  'VideoSource$1.class'
'EncodedImage$Builder.class'                                   'PlatformSoftwareVideoDecoderFactory$1.class'                 'VideoSource$AspectRatio.class'
'EncodedImage$FrameType.class'                                  PlatformSoftwareVideoDecoderFactory.class                     VideoSource.class
EncodedImage.class                                            'Predicate$1.class'                                            VideoTrack.class
FecControllerFactoryFactoryInterface.class                    'Predicate$2.class'                                            WebRtcClassLoader.class
'FileVideoCapturer$1.class'                                    'Predicate$3.class'                                            WrappedNativeI420Buffer.class
'FileVideoCapturer$VideoReader.class'                           Predicate.class                                               WrappedNativeVideoDecoder.class
'FileVideoCapturer$VideoReaderY4M.class'                        Priority.class                                                WrappedNativeVideoEncoder.class
FileVideoCapturer.class                                        RTCStats.class                                               'YuvConverter$ShaderCallbacks.class'
FrameDecryptor.class                                           RTCStatsCollectorCallback.class                               YuvConverter.class
FrameEncryptor.class                                           RTCStatsReport.class                                          YuvHelper.class
FramerateBitrateAdjuster.class                                 RefCountDelegate.class                                        audio
'GlGenericDrawer$ShaderCallbacks.class'                         RefCounted.class
'GlGenericDrawer$ShaderType.class'                             'RenderSynchronizer$Listener.class'

temp_classes/org/webrtc/audio:
AudioDeviceModule.class                                 'JavaAudioDeviceModule$Builder.class'               'WebRtcAudioRecord$1.class'
'JavaAudioDeviceModule$AudioRecordErrorCallback.class'   'JavaAudioDeviceModule$SamplesReadyCallback.class'  'WebRtcAudioRecord$AudioRecordThread.class'
'JavaAudioDeviceModule$AudioRecordStartErrorCode.class'   JavaAudioDeviceModule.class                         WebRtcAudioRecord.class
'JavaAudioDeviceModule$AudioRecordStateCallback.class'    LowLatencyAudioBufferManager.class                 'WebRtcAudioTrack$AudioTrackThread.class'
'JavaAudioDeviceModule$AudioSamples.class'               'VolumeLogger$LogVolumeTask.class'                   WebRtcAudioTrack.class
'JavaAudioDeviceModule$AudioTrackErrorCallback.class'     VolumeLogger.class                                  WebRtcAudioUtils.class
'JavaAudioDeviceModule$AudioTrackStartErrorCode.class'    WebRtcAudioEffects.class
'JavaAudioDeviceModule$AudioTrackStateCallback.class'     WebRtcAudioManager.class
pi@PC1:~$ grep -r -i "version\|webrtc\|m[0-9]\{2,3\}" temp_classes
grep: temp_classes/org/webrtc/EglThread$ReleaseMonitor.class: binary file matches
grep: temp_classes/org/webrtc/PeerConnection$PortPrunePolicy.class: binary file matches
grep: temp_classes/org/webrtc/RendererCommon$RendererEvents.class: binary file matches
grep: temp_classes/org/webrtc/ThreadUtils$1Result.class: binary file matches
grep: temp_classes/org/webrtc/PeerConnectionFactory$InitializationOptions.class: binary file matches
grep: temp_classes/org/webrtc/Predicate$1.class: binary file matches
grep: temp_classes/org/webrtc/RenderSynchronizer.class: binary file matches
grep: temp_classes/org/webrtc/SoftwareVideoDecoderFactory$1.class: binary file matches
grep: temp_classes/org/webrtc/MediaCodecUtils.class: binary file matches
grep: temp_classes/org/webrtc/PeerConnection$BundlePolicy.class: binary file matches
grep: temp_classes/org/webrtc/HardwareVideoEncoderFactory.class: binary file matches
grep: temp_classes/org/webrtc/SoftwareVideoDecoderFactory.class: binary file matches
grep: temp_classes/org/webrtc/VideoSource$AspectRatio.class: binary file matches
grep: temp_classes/org/webrtc/Metrics$HistogramInfo.class: binary file matches
grep: temp_classes/org/webrtc/HardwareVideoDecoderFactory$1.class: binary file matches
grep: temp_classes/org/webrtc/PeerConnection$RtcpMuxPolicy.class: binary file matches
grep: temp_classes/org/webrtc/EglRenderer$FrameListenerAndParams.class: binary file matches
grep: temp_classes/org/webrtc/SurfaceTextureHelper$1.class: binary file matches
grep: temp_classes/org/webrtc/SurfaceTextureHelper$FrameRefMonitor.class: binary file matches
grep: temp_classes/org/webrtc/VideoSource$1.class: binary file matches
grep: temp_classes/org/webrtc/DataChannel$State.class: binary file matches
grep: temp_classes/org/webrtc/RtpReceiver$Observer.class: binary file matches
grep: temp_classes/org/webrtc/NetworkPreference.class: binary file matches
grep: temp_classes/org/webrtc/YuvConverter.class: binary file matches
grep: temp_classes/org/webrtc/PlatformSoftwareVideoDecoderFactory.class: binary file matches
grep: temp_classes/org/webrtc/NativeLibrary.class: binary file matches
grep: temp_classes/org/webrtc/NetworkMonitorAutoDetect$ConnectivityManagerDelegate.class: binary file matches
grep: temp_classes/org/webrtc/SurfaceTextureHelper$3.class: binary file matches
grep: temp_classes/org/webrtc/VideoFrame$I420Buffer.class: binary file matches
grep: temp_classes/org/webrtc/DataChannel$Init.class: binary file matches
grep: temp_classes/org/webrtc/VideoEncoderFactory.class: binary file matches
grep: temp_classes/org/webrtc/VideoEncoder$BitrateAllocation.class: binary file matches
grep: temp_classes/org/webrtc/NetworkMonitorAutoDetect.class: binary file matches
grep: temp_classes/org/webrtc/TextureBufferImpl$RefCountMonitor.class: binary file matches
grep: temp_classes/org/webrtc/PeerConnection$PortAllocatorFlags.class: binary file matches
grep: temp_classes/org/webrtc/HardwareVideoDecoderFactory.class: binary file matches
grep: temp_classes/org/webrtc/RtpParameters$Rtcp.class: binary file matches
grep: temp_classes/org/webrtc/AndroidVideoDecoder$DecodedTextureMetadata.class: binary file matches
grep: temp_classes/org/webrtc/VideoCodecStatus.class: binary file matches
grep: temp_classes/org/webrtc/VideoEncoder$ScalingSettings.class: binary file matches
grep: temp_classes/org/webrtc/VideoEncoder$CodecSpecificInfoVP9.class: binary file matches
grep: temp_classes/org/webrtc/NetworkMonitorAutoDetect$WifiManagerDelegate.class: binary file matches
grep: temp_classes/org/webrtc/DefaultVideoEncoderFactory.class: binary file matches
grep: temp_classes/org/webrtc/CryptoOptions.class: binary file matches
grep: temp_classes/org/webrtc/RtpCapabilities$CodecCapability.class: binary file matches
grep: temp_classes/org/webrtc/CameraCapturer$3.class: binary file matches
grep: temp_classes/org/webrtc/NetworkMonitor$InstanceHolder.class: binary file matches
grep: temp_classes/org/webrtc/RtcError.class: binary file matches
grep: temp_classes/org/webrtc/MediaStreamTrack$State.class: binary file matches
grep: temp_classes/org/webrtc/CameraCapturer$SwitchState.class: binary file matches
grep: temp_classes/org/webrtc/CameraSession.class: binary file matches
grep: temp_classes/org/webrtc/LibvpxVp8Encoder.class: binary file matches
grep: temp_classes/org/webrtc/EglRenderer.class: binary file matches
grep: temp_classes/org/webrtc/AndroidVideoDecoder.class: binary file matches
grep: temp_classes/org/webrtc/VideoDecoderFactory.class: binary file matches
grep: temp_classes/org/webrtc/RtpSender.class: binary file matches
grep: temp_classes/org/webrtc/MediaCodecWrapperFactory.class: binary file matches
grep: temp_classes/org/webrtc/AudioProcessingFactory.class: binary file matches
grep: temp_classes/org/webrtc/ScreenCapturerAndroid.class: binary file matches
grep: temp_classes/org/webrtc/IceCandidateErrorEvent.class: binary file matches
grep: temp_classes/org/webrtc/VideoEncoder$RateControlParameters.class: binary file matches
grep: temp_classes/org/webrtc/Priority.class: binary file matches
grep: temp_classes/org/webrtc/RTCStats.class: binary file matches
grep: temp_classes/org/webrtc/LibvpxVp9Encoder.class: binary file matches
grep: temp_classes/org/webrtc/PeerConnection$IceServer.class: binary file matches
grep: temp_classes/org/webrtc/WrappedNativeVideoEncoder.class: binary file matches
grep: temp_classes/org/webrtc/CameraEnumerationAndroid$CaptureFormat.class: binary file matches
grep: temp_classes/org/webrtc/VideoCodecInfo.class: binary file matches
grep: temp_classes/org/webrtc/StatsReport.class: binary file matches
grep: temp_classes/org/webrtc/RendererCommon$VideoLayoutMeasure.class: binary file matches
grep: temp_classes/org/webrtc/RtpParameters$HeaderExtension.class: binary file matches
grep: temp_classes/org/webrtc/GlUtil.class: binary file matches
grep: temp_classes/org/webrtc/LibvpxVp8Decoder.class: binary file matches
grep: temp_classes/org/webrtc/Loggable.class: binary file matches
grep: temp_classes/org/webrtc/VideoEncoder$Settings.class: binary file matches
grep: temp_classes/org/webrtc/AndroidVideoDecoder$FrameInfo.class: binary file matches
grep: temp_classes/org/webrtc/RtpCapabilities$HeaderExtensionCapability.class: binary file matches
grep: temp_classes/org/webrtc/NativePeerConnectionFactory.class: binary file matches
grep: temp_classes/org/webrtc/MediaCodecVideoDecoderFactory.class: binary file matches
grep: temp_classes/org/webrtc/VideoEncoderWrapper.class: binary file matches
grep: temp_classes/org/webrtc/NativeCapturerObserver.class: binary file matches
grep: temp_classes/org/webrtc/PeerConnection$PeerConnectionState.class: binary file matches
grep: temp_classes/org/webrtc/VideoTrack.class: binary file matches
grep: temp_classes/org/webrtc/EglRenderer$RenderListener.class: binary file matches
grep: temp_classes/org/webrtc/EglBase.class: binary file matches
grep: temp_classes/org/webrtc/RendererCommon.class: binary file matches
grep: temp_classes/org/webrtc/VideoDecoderFallback.class: binary file matches
grep: temp_classes/org/webrtc/SessionDescription$Type.class: binary file matches
grep: temp_classes/org/webrtc/PeerConnection$IceTransportsType.class: binary file matches
grep: temp_classes/org/webrtc/CameraEnumerationAndroid$CaptureFormat$FramerateRange.class: binary file matches
grep: temp_classes/org/webrtc/NetworkChangeDetector.class: binary file matches
grep: temp_classes/org/webrtc/SSLCertificateVerifier.class: binary file matches
grep: temp_classes/org/webrtc/EglThread$HandlerWithExceptionCallbacks.class: binary file matches
grep: temp_classes/org/webrtc/LibvpxVp9Decoder.class: binary file matches
grep: temp_classes/org/webrtc/ThreadUtils$2.class: binary file matches
grep: temp_classes/org/webrtc/EglThread$RenderUpdate.class: binary file matches
grep: temp_classes/org/webrtc/GlUtil$GlOutOfMemoryException.class: binary file matches
grep: temp_classes/org/webrtc/PeerConnectionFactory$InitializationOptions$Builder.class: binary file matches
grep: temp_classes/org/webrtc/ContextUtils.class: binary file matches
grep: temp_classes/org/webrtc/Camera1Enumerator.class: binary file matches
grep: temp_classes/org/webrtc/BuiltinAudioEncoderFactoryFactory.class: binary file matches
grep: temp_classes/org/webrtc/RenderSynchronizer$Listener.class: binary file matches
grep: temp_classes/org/webrtc/Camera1Session$2.class: binary file matches
grep: temp_classes/org/webrtc/CameraSession$FailureType.class: binary file matches
grep: temp_classes/org/webrtc/CameraEnumerationAndroid$ClosestComparator.class: binary file matches
grep: temp_classes/org/webrtc/VideoEncoder$ResolutionBitrateLimits.class: binary file matches
grep: temp_classes/org/webrtc/SoftwareVideoEncoderFactory$1.class: binary file matches
grep: temp_classes/org/webrtc/VideoEncoderFallback.class: binary file matches
grep: temp_classes/org/webrtc/MediaSource$State.class: binary file matches
grep: temp_classes/org/webrtc/PeerConnectionFactory.class: binary file matches
grep: temp_classes/org/webrtc/CalledByNativeUnchecked.class: binary file matches
grep: temp_classes/org/webrtc/SurfaceTextureHelper.class: binary file matches
grep: temp_classes/org/webrtc/EglBase$ConfigBuilder.class: binary file matches
grep: temp_classes/org/webrtc/RtpParameters$DegradationPreference.class: binary file matches
grep: temp_classes/org/webrtc/Camera2Enumerator.class: binary file matches
grep: temp_classes/org/webrtc/NativeLibrary$DefaultLoader.class: binary file matches
grep: temp_classes/org/webrtc/MediaStreamTrack$MediaType.class: binary file matches
grep: temp_classes/org/webrtc/NetworkMonitorAutoDetect$NetworkState.class: binary file matches
grep: temp_classes/org/webrtc/EglBase$EglConnection.class: binary file matches
grep: temp_classes/org/webrtc/VideoEncoder$CodecSpecificInfo.class: binary file matches
grep: temp_classes/org/webrtc/PeerConnection$Observer.class: binary file matches
grep: temp_classes/org/webrtc/VideoEncoder$Callback.class: binary file matches
grep: temp_classes/org/webrtc/NetworkChangeDetector$IPAddress.class: binary file matches
grep: temp_classes/org/webrtc/VideoEncoder.class: binary file matches
grep: temp_classes/org/webrtc/TextureBufferImpl$1.class: binary file matches
grep: temp_classes/org/webrtc/Camera1Session.class: binary file matches
grep: temp_classes/org/webrtc/EglBase14Impl$Context.class: binary file matches
grep: temp_classes/org/webrtc/EglBase10Impl$1FakeSurfaceHolder.class: binary file matches
grep: temp_classes/org/webrtc/EglBase14$Context.class: binary file matches
grep: temp_classes/org/webrtc/DtmfSender.class: binary file matches
grep: temp_classes/org/webrtc/ThreadUtils$ThreadChecker.class: binary file matches
grep: temp_classes/org/webrtc/AndroidVideoDecoder$1.class: binary file matches
grep: temp_classes/org/webrtc/YuvConverter$ShaderCallbacks.class: binary file matches
grep: temp_classes/org/webrtc/TextureBufferImpl.class: binary file matches
grep: temp_classes/org/webrtc/RTCStatsCollectorCallback.class: binary file matches
grep: temp_classes/org/webrtc/PeerConnectionFactory$Options.class: binary file matches
grep: temp_classes/org/webrtc/JavaI420Buffer.class: binary file matches
grep: temp_classes/org/webrtc/PeerConnection$RTCConfiguration.class: binary file matches
grep: temp_classes/org/webrtc/MediaCodecWrapperFactoryImpl.class: binary file matches
grep: temp_classes/org/webrtc/StatsReport$Value.class: binary file matches
grep: temp_classes/org/webrtc/VideoFileRenderer$1.class: binary file matches
grep: temp_classes/org/webrtc/VideoEncoder$EncoderInfo.class: binary file matches
grep: temp_classes/org/webrtc/CameraCapturer.class: binary file matches
grep: temp_classes/org/webrtc/VideoEncoder$EncodeInfo.class: binary file matches
grep: temp_classes/org/webrtc/CameraSession$CreateSessionCallback.class: binary file matches
grep: temp_classes/org/webrtc/SessionDescription.class: binary file matches
grep: temp_classes/org/webrtc/CameraCapturer$4.class: binary file matches
grep: temp_classes/org/webrtc/PeerConnection$CandidateNetworkPolicy.class: binary file matches
grep: temp_classes/org/webrtc/PeerConnection$SdpSemantics.class: binary file matches
grep: temp_classes/org/webrtc/YuvHelper.class: binary file matches
grep: temp_classes/org/webrtc/NetworkChangeDetectorFactory.class: binary file matches
grep: temp_classes/org/webrtc/CryptoOptions$Builder.class: binary file matches
grep: temp_classes/org/webrtc/ScreenCapturerAndroid$1.class: binary file matches
grep: temp_classes/org/webrtc/SurfaceViewRenderer.class: binary file matches
grep: temp_classes/org/webrtc/NetworkStatePredictorFactoryFactory.class: binary file matches
grep: temp_classes/org/webrtc/CameraCapturer$6.class: binary file matches
grep: temp_classes/org/webrtc/CameraVideoCapturer$CameraStatistics$1.class: binary file matches
grep: temp_classes/org/webrtc/EglBase14$EglConnection.class: binary file matches
grep: temp_classes/org/webrtc/VideoFrameBufferType.class: binary file matches
grep: temp_classes/org/webrtc/Camera1Session$SessionState.class: binary file matches
grep: temp_classes/org/webrtc/NetworkChangeDetector$ConnectionType.class: binary file matches
grep: temp_classes/org/webrtc/DynamicBitrateAdjuster.class: binary file matches
grep: temp_classes/org/webrtc/CameraVideoCapturer.class: binary file matches
grep: temp_classes/org/webrtc/RtpParameters$Encoding.class: binary file matches
grep: temp_classes/org/webrtc/CandidatePairChangeEvent.class: binary file matches
grep: temp_classes/org/webrtc/EncodedImage$FrameType.class: binary file matches
grep: temp_classes/org/webrtc/JNILogging.class: binary file matches
grep: temp_classes/org/webrtc/EglRenderer$ErrorCallback.class: binary file matches
grep: temp_classes/org/webrtc/EglRenderer$1.class: binary file matches
grep: temp_classes/org/webrtc/EglRenderer$FrameListener.class: binary file matches
grep: temp_classes/org/webrtc/EglRenderer$2.class: binary file matches
grep: temp_classes/org/webrtc/ApplicationContextProvider.class: binary file matches
grep: temp_classes/org/webrtc/IceCandidate.class: binary file matches
grep: temp_classes/org/webrtc/CameraCapturer$9.class: binary file matches
grep: temp_classes/org/webrtc/ThreadUtils.class: binary file matches
grep: temp_classes/org/webrtc/CapturerObserver.class: binary file matches
grep: temp_classes/org/webrtc/PeerConnection$SignalingState.class: binary file matches
grep: temp_classes/org/webrtc/EglBase10.class: binary file matches
grep: temp_classes/org/webrtc/BaseBitrateAdjuster.class: binary file matches
grep: temp_classes/org/webrtc/ThreadUtils$3.class: binary file matches
grep: temp_classes/org/webrtc/VideoDecoder$Settings.class: binary file matches
grep: temp_classes/org/webrtc/FileVideoCapturer$VideoReaderY4M.class: binary file matches
grep: temp_classes/org/webrtc/HardwareVideoEncoderFactory$1.class: binary file matches
grep: temp_classes/org/webrtc/PeerConnection$AdapterType.class: binary file matches
grep: temp_classes/org/webrtc/Logging.class: binary file matches
grep: temp_classes/org/webrtc/Size.class: binary file matches
grep: temp_classes/org/webrtc/EglBase10Impl$EglConnection.class: binary file matches
grep: temp_classes/org/webrtc/CameraVideoCapturer$CameraSwitchHandler.class: binary file matches
grep: temp_classes/org/webrtc/VideoProcessor$FrameAdaptationParameters.class: binary file matches
grep: temp_classes/org/webrtc/RtpParameters.class: binary file matches
grep: temp_classes/org/webrtc/CameraEnumerator.class: binary file matches
grep: temp_classes/org/webrtc/Empty.class: binary file matches
grep: temp_classes/org/webrtc/Camera2Session$CameraStateCallback.class: binary file matches
grep: temp_classes/org/webrtc/RtpTransceiver$RtpTransceiverInit.class: binary file matches
grep: temp_classes/org/webrtc/SurfaceEglRenderer.class: binary file matches
grep: temp_classes/org/webrtc/NetworkControllerFactoryFactory.class: binary file matches
grep: temp_classes/org/webrtc/Predicate$3.class: binary file matches
grep: temp_classes/org/webrtc/HardwareVideoEncoder.class: binary file matches
grep: temp_classes/org/webrtc/audio/WebRtcAudioRecord$AudioRecordThread.class: binary file matches
grep: temp_classes/org/webrtc/audio/AudioDeviceModule.class: binary file matches
grep: temp_classes/org/webrtc/audio/JavaAudioDeviceModule$AudioRecordStateCallback.class: binary file matches
grep: temp_classes/org/webrtc/audio/WebRtcAudioEffects.class: binary file matches
grep: temp_classes/org/webrtc/audio/JavaAudioDeviceModule$AudioRecordStartErrorCode.class: binary file matches
grep: temp_classes/org/webrtc/audio/WebRtcAudioUtils.class: binary file matches
grep: temp_classes/org/webrtc/audio/JavaAudioDeviceModule.class: binary file matches
grep: temp_classes/org/webrtc/audio/JavaAudioDeviceModule$AudioSamples.class: binary file matches
grep: temp_classes/org/webrtc/audio/JavaAudioDeviceModule$SamplesReadyCallback.class: binary file matches
grep: temp_classes/org/webrtc/audio/WebRtcAudioRecord.class: binary file matches
grep: temp_classes/org/webrtc/audio/JavaAudioDeviceModule$Builder.class: binary file matches
grep: temp_classes/org/webrtc/audio/VolumeLogger.class: binary file matches
grep: temp_classes/org/webrtc/audio/JavaAudioDeviceModule$AudioTrackStateCallback.class: binary file matches
grep: temp_classes/org/webrtc/audio/VolumeLogger$LogVolumeTask.class: binary file matches
grep: temp_classes/org/webrtc/audio/WebRtcAudioManager.class: binary file matches
grep: temp_classes/org/webrtc/audio/WebRtcAudioTrack$AudioTrackThread.class: binary file matches
grep: temp_classes/org/webrtc/audio/LowLatencyAudioBufferManager.class: binary file matches
grep: temp_classes/org/webrtc/audio/WebRtcAudioRecord$1.class: binary file matches
grep: temp_classes/org/webrtc/audio/WebRtcAudioTrack.class: binary file matches
grep: temp_classes/org/webrtc/audio/JavaAudioDeviceModule$AudioRecordErrorCallback.class: binary file matches
grep: temp_classes/org/webrtc/audio/JavaAudioDeviceModule$AudioTrackStartErrorCode.class: binary file matches
grep: temp_classes/org/webrtc/audio/JavaAudioDeviceModule$AudioTrackErrorCallback.class: binary file matches
grep: temp_classes/org/webrtc/PeerConnectionDependencies.class: binary file matches
grep: temp_classes/org/webrtc/VideoEncoder$CodecSpecificInfoAV1.class: binary file matches
grep: temp_classes/org/webrtc/SdpObserver.class: binary file matches
grep: temp_classes/org/webrtc/EglBase10$EglConnection.class: binary file matches
grep: temp_classes/org/webrtc/VideoFileRenderer.class: binary file matches
grep: temp_classes/org/webrtc/SoftwareVideoEncoderFactory.class: binary file matches
grep: temp_classes/org/webrtc/GlRectDrawer$ShaderCallbacks.class: binary file matches
grep: temp_classes/org/webrtc/VideoFrame$TextureBuffer$Type.class: binary file matches
grep: temp_classes/org/webrtc/VideoEncoder$CodecSpecificInfoVP8.class: binary file matches
grep: temp_classes/org/webrtc/GlGenericDrawer$ShaderType.class: binary file matches
grep: temp_classes/org/webrtc/CalledByNative.class: binary file matches
grep: temp_classes/org/webrtc/RtcException.class: binary file matches
grep: temp_classes/org/webrtc/H264Utils.class: binary file matches
grep: temp_classes/org/webrtc/AudioSource.class: binary file matches
grep: temp_classes/org/webrtc/PeerConnection.class: binary file matches
grep: temp_classes/org/webrtc/HardwareVideoEncoder$BusyCount.class: binary file matches
grep: temp_classes/org/webrtc/Camera1Session$1.class: binary file matches
grep: temp_classes/org/webrtc/NV21Buffer.class: binary file matches
grep: temp_classes/org/webrtc/StatsObserver.class: binary file matches
grep: temp_classes/org/webrtc/PeerConnection$TcpCandidatePolicy.class: binary file matches
grep: temp_classes/org/webrtc/RendererCommon$GlDrawer.class: binary file matches
grep: temp_classes/org/webrtc/CameraEnumerationAndroid$1.class: binary file matches
grep: temp_classes/org/webrtc/CameraVideoCapturer$CameraEventsHandler.class: binary file matches
grep: temp_classes/org/webrtc/CameraCapturer$5.class: binary file matches
grep: temp_classes/org/webrtc/CameraCapturer$1.class: binary file matches
grep: temp_classes/org/webrtc/NativeLibraryLoader.class: binary file matches
grep: temp_classes/org/webrtc/CameraVideoCapturer$CameraStatistics.class: binary file matches
grep: temp_classes/org/webrtc/ThreadUtils$1.class: binary file matches
grep: temp_classes/org/webrtc/PeerConnection$IceServer$Builder.class: binary file matches
grep: temp_classes/org/webrtc/Camera1Capturer.class: binary file matches
grep: temp_classes/org/webrtc/GlGenericDrawer$ShaderCallbacks.class: binary file matches
grep: temp_classes/org/webrtc/VideoFrame$Buffer.class: binary file matches
grep: temp_classes/org/webrtc/NetworkMonitor$2.class: binary file matches
grep: temp_classes/org/webrtc/WrappedNativeVideoDecoder.class: binary file matches
grep: temp_classes/org/webrtc/AddIceObserver.class: binary file matches
grep: temp_classes/org/webrtc/BuiltinAudioDecoderFactoryFactory.class: binary file matches
grep: temp_classes/org/webrtc/MediaConstraints.class: binary file matches
grep: temp_classes/org/webrtc/PeerConnectionDependencies$Builder.class: binary file matches
grep: temp_classes/org/webrtc/CameraCapturer$2.class: binary file matches
grep: temp_classes/org/webrtc/RtpReceiver.class: binary file matches
grep: temp_classes/org/webrtc/HardwareVideoEncoder$1.class: binary file matches
grep: temp_classes/org/webrtc/PeerConnection$IceGatheringState.class: binary file matches
grep: temp_classes/org/webrtc/EglBase14Impl$EglConnection.class: binary file matches
grep: temp_classes/org/webrtc/NetworkMonitor$NetworkObserver.class: binary file matches
grep: temp_classes/org/webrtc/NativeAndroidVideoTrackSource.class: binary file matches
grep: temp_classes/org/webrtc/ThreadUtils$BlockingOperation.class: binary file matches
grep: temp_classes/org/webrtc/PeerConnectionFactory$ThreadInfo.class: binary file matches
grep: temp_classes/org/webrtc/Camera2Capturer.class: binary file matches
grep: temp_classes/org/webrtc/CameraCapturer$7.class: binary file matches
grep: temp_classes/org/webrtc/MediaCodecWrapperFactoryImpl$MediaCodecWrapperImpl.class: binary file matches
grep: temp_classes/org/webrtc/PeerConnection$KeyType.class: binary file matches
grep: temp_classes/org/webrtc/EglBase10$Context.class: binary file matches
grep: temp_classes/org/webrtc/NV12Buffer.class: binary file matches
grep: temp_classes/org/webrtc/VideoFrame.class: binary file matches
grep: temp_classes/org/webrtc/RtpTransceiver.class: binary file matches
grep: temp_classes/org/webrtc/AudioEncoderFactoryFactory.class: binary file matches
grep: temp_classes/org/webrtc/CameraCapturer$8.class: binary file matches
grep: temp_classes/org/webrtc/MediaCodecWrapper.class: binary file matches
grep: temp_classes/org/webrtc/DataChannel$Observer.class: binary file matches
grep: temp_classes/org/webrtc/NetworkMonitorAutoDetect$WifiDirectManagerDelegate.class: binary file matches
grep: temp_classes/org/webrtc/EglBase10Impl.class: binary file matches
grep: temp_classes/org/webrtc/MediaCodecUtils$1.class: binary file matches
grep: temp_classes/org/webrtc/VideoDecoderWrapper.class: binary file matches
grep: temp_classes/org/webrtc/EglThread.class: binary file matches
grep: temp_classes/org/webrtc/NetworkChangeDetector$Observer.class: binary file matches
grep: temp_classes/org/webrtc/RefCounted.class: binary file matches
grep: temp_classes/org/webrtc/DataChannel.class: binary file matches
grep: temp_classes/org/webrtc/FrameEncryptor.class: binary file matches
grep: temp_classes/org/webrtc/CameraSession$Events.class: binary file matches
grep: temp_classes/org/webrtc/PeerConnection$ContinualGatheringPolicy.class: binary file matches
grep: temp_classes/org/webrtc/FecControllerFactoryFactoryInterface.class: binary file matches
grep: temp_classes/org/webrtc/EglBase14.class: binary file matches
grep: temp_classes/org/webrtc/FrameDecryptor.class: binary file matches
grep: temp_classes/org/webrtc/TextureBufferImpl$2.class: binary file matches
grep: temp_classes/org/webrtc/RendererCommon$ScalingType.class: binary file matches
grep: temp_classes/org/webrtc/PeerConnection$TlsCertPolicy.class: binary file matches
grep: temp_classes/org/webrtc/MediaConstraints$KeyValuePair.class: binary file matches
grep: temp_classes/org/webrtc/VideoFrameDrawer$1.class: binary file matches
grep: temp_classes/org/webrtc/DefaultVideoDecoderFactory.class: binary file matches
grep: temp_classes/org/webrtc/VideoFrameDrawer.class: binary file matches
grep: temp_classes/org/webrtc/VideoFrame$TextureBuffer.class: binary file matches
grep: temp_classes/org/webrtc/NetworkMonitorAutoDetect$SimpleNetworkCallback.class: binary file matches
grep: temp_classes/org/webrtc/RTCStatsReport.class: binary file matches
grep: temp_classes/org/webrtc/VideoSink.class: binary file matches
grep: temp_classes/org/webrtc/Logging$Severity.class: binary file matches
grep: temp_classes/org/webrtc/FileVideoCapturer$VideoReader.class: binary file matches
grep: temp_classes/org/webrtc/VideoCodecMimeType.class: binary file matches
grep: temp_classes/org/webrtc/CameraVideoCapturer$MediaRecorderHandler.class: binary file matches
grep: temp_classes/org/webrtc/VideoEncoderFactory$VideoEncoderSelector.class: binary file matches
grep: temp_classes/org/webrtc/EncodedImage.class: binary file matches
grep: temp_classes/org/webrtc/JniCommon.class: binary file matches
grep: temp_classes/org/webrtc/GlShader.class: binary file matches
grep: temp_classes/org/webrtc/GlTextureFrameBuffer.class: binary file matches
grep: temp_classes/org/webrtc/Camera2Session.class: binary file matches
grep: temp_classes/org/webrtc/JniHelper.class: binary file matches
grep: temp_classes/org/webrtc/VideoDecoder$DecodeInfo.class: binary file matches
grep: temp_classes/org/webrtc/Predicate$2.class: binary file matches
grep: temp_classes/org/webrtc/GlRectDrawer.class: binary file matches
grep: temp_classes/org/webrtc/VideoSource.class: binary file matches
grep: temp_classes/org/webrtc/RtpCapabilities.class: binary file matches
grep: temp_classes/org/webrtc/Histogram.class: binary file matches
grep: temp_classes/org/webrtc/VideoDecoder$Callback.class: binary file matches
grep: temp_classes/org/webrtc/WebRtcClassLoader.class: binary file matches
grep: temp_classes/org/webrtc/AudioTrack.class: binary file matches
grep: temp_classes/org/webrtc/VideoDecoder.class: binary file matches
grep: temp_classes/org/webrtc/ThreadUtils$1CaughtException.class: binary file matches
grep: temp_classes/org/webrtc/VideoEncoder$Capabilities.class: binary file matches
grep: temp_classes/org/webrtc/FileVideoCapturer.class: binary file matches
grep: temp_classes/org/webrtc/RtpParameters$Codec.class: binary file matches
grep: temp_classes/org/webrtc/AudioDecoderFactoryFactory.class: binary file matches
grep: temp_classes/org/webrtc/SurfaceTextureHelper$2.class: binary file matches
grep: temp_classes/org/webrtc/MediaSource.class: binary file matches
grep: temp_classes/org/webrtc/CameraEnumerationAndroid$2.class: binary file matches
grep: temp_classes/org/webrtc/VideoEncoder$CodecSpecificInfoH264.class: binary file matches
grep: temp_classes/org/webrtc/NetworkMonitor.class: binary file matches
grep: temp_classes/org/webrtc/EglBase14Impl.class: binary file matches
grep: temp_classes/org/webrtc/Camera2Session$SessionState.class: binary file matches
grep: temp_classes/org/webrtc/RtcCertificatePem.class: binary file matches
grep: temp_classes/org/webrtc/FileVideoCapturer$1.class: binary file matches
grep: temp_classes/org/webrtc/CallSessionFileRotatingLogSink.class: binary file matches
grep: temp_classes/org/webrtc/EglRenderer$EglSurfaceCreation.class: binary file matches
grep: temp_classes/org/webrtc/DataChannel$Buffer.class: binary file matches
grep: temp_classes/org/webrtc/Predicate.class: binary file matches
grep: temp_classes/org/webrtc/WrappedNativeI420Buffer.class: binary file matches
grep: temp_classes/org/webrtc/RtpTransceiver$RtpTransceiverDirection.class: binary file matches
grep: temp_classes/org/webrtc/TimestampAligner.class: binary file matches
grep: temp_classes/org/webrtc/PlatformSoftwareVideoDecoderFactory$1.class: binary file matches
grep: temp_classes/org/webrtc/Metrics.class: binary file matches
grep: temp_classes/org/webrtc/EglBase$Context.class: binary file matches
grep: temp_classes/org/webrtc/BitrateAdjuster.class: binary file matches
grep: temp_classes/org/webrtc/EncodedImage$Builder.class: binary file matches
grep: temp_classes/org/webrtc/VideoProcessor.class: binary file matches
grep: temp_classes/org/webrtc/Camera2Session$CaptureSessionCallback.class: binary file matches
grep: temp_classes/org/webrtc/NetworkChangeDetector$NetworkInformation.class: binary file matches
grep: temp_classes/org/webrtc/PeerConnectionFactory$Builder.class: binary file matches
grep: temp_classes/org/webrtc/GlGenericDrawer.class: binary file matches
grep: temp_classes/org/webrtc/VideoCapturer.class: binary file matches
grep: temp_classes/org/webrtc/EglBase10Impl$Context.class: binary file matches
grep: temp_classes/org/webrtc/ThreadUtils$4.class: binary file matches
grep: temp_classes/org/webrtc/NetEqFactoryFactory.class: binary file matches
grep: temp_classes/org/webrtc/MediaStreamTrack.class: binary file matches
grep: temp_classes/org/webrtc/NetworkMonitor$1.class: binary file matches
grep: temp_classes/org/webrtc/PeerConnection$IceConnectionState.class: binary file matches
grep: temp_classes/org/webrtc/CameraEnumerationAndroid.class: binary file matches
grep: temp_classes/org/webrtc/TurnCustomizer.class: binary file matches
grep: temp_classes/org/webrtc/CryptoOptions$Srtp.class: binary file matches
grep: temp_classes/org/webrtc/MediaStream.class: binary file matches
grep: temp_classes/org/webrtc/VideoFrameDrawer$YuvUploader.class: binary file matches
grep: temp_classes/org/webrtc/Camera2Session$CameraCaptureCallback.class: binary file matches
grep: temp_classes/org/webrtc/RefCountDelegate.class: binary file matches
grep: temp_classes/org/webrtc/CryptoOptions$SFrame.class: binary file matches
grep: temp_classes/org/webrtc/FramerateBitrateAdjuster.class: binary file matches
grep: temp_classes/org/webrtc/LibaomAv1Encoder.class: binary file matches