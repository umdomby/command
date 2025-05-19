G:\AndroidStudio\MyTest\app\src\main\java\com\example\mytest\MainActivity.kt
G:\AndroidStudio\MyTest\app\src\main\java\com\example\mytest\WebRTCClient.kt
G:\AndroidStudio\MyTest\app\src\main\java\com\example\mytest\WebRTCService.kt
G:\AndroidStudio\MyTest\app\src\main\java\com\example\mytest\WebSocketClient.kt

// file: app/src/main/java/com/example/mytest/MainActivity.kt
package com.example.mytest

import android.Manifest
import android.annotation.SuppressLint
import android.app.AlertDialog
import android.content.BroadcastReceiver
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.media.projection.MediaProjectionManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import android.text.Editable
import android.text.TextWatcher
import android.util.Log
import android.view.View
import android.view.WindowManager
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.result.registerForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import com.example.mytest.databinding.ActivityMainBinding
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import org.json.JSONArray
import java.util.*
import kotlin.random.Random

class MainActivity : ComponentActivity() {
private lateinit var binding: ActivityMainBinding
private lateinit var sharedPreferences: SharedPreferences
private var currentRoomName: String = ""
private var isServiceRunning: Boolean = false
private val roomList = mutableListOf<String>()
private lateinit var roomListAdapter: ArrayAdapter<String>

    private val requiredPermissions = arrayOf(
        Manifest.permission.CAMERA,
        Manifest.permission.RECORD_AUDIO,
        Manifest.permission.POST_NOTIFICATIONS
    )

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        if (permissions.all { it.value }) {
            if (isCameraPermissionGranted()) {
                val mediaManager = getSystemService(MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
                mediaProjectionLauncher.launch(mediaManager.createScreenCaptureIntent())
                checkBatteryOptimization()
            } else {
                showToast("Camera permission required")
                finish()
            }
        } else {
            showToast("Not all permissions granted")
            finish()
        }
    }

    private val mediaProjectionLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == RESULT_OK && result.data != null) {
            // Сохраняем текущее имя комнаты при успешном запуске сервиса
            saveCurrentRoom()
            startWebRTCService(result.data!!)
        } else {
            showToast("Screen recording access denied")
            finish()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_STATE_HIDDEN)

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        sharedPreferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
        loadRoomList()
        setupUI()
        setupRoomListAdapter()

        // Проверяем состояние сервиса при создании активности
        isServiceRunning = WebRTCService.isRunning
        updateButtonStates()
    }

    private fun loadRoomList() {
        // Загружаем список комнат
        val jsonString = sharedPreferences.getString(ROOM_LIST_KEY, null)
        jsonString?.let {
            val jsonArray = JSONArray(it)
            for (i in 0 until jsonArray.length()) {
                roomList.add(jsonArray.getString(i))
            }
        }

        // Загружаем последнее использованное имя комнаты
        currentRoomName = sharedPreferences.getString(LAST_USED_ROOM_KEY, "") ?: ""

        // Если нет сохраненных комнат или последнее имя пустое, генерируем новое
        if (roomList.isEmpty()) {
            currentRoomName = generateRandomRoomName()
            roomList.add(currentRoomName)
            saveRoomList()
            saveCurrentRoom()
        } else if (currentRoomName.isEmpty()) {
            currentRoomName = roomList.first()
            saveCurrentRoom()
        }

        // Устанавливаем последнее использованное имя в поле ввода
        binding.roomCodeEditText.setText(formatRoomName(currentRoomName))
    }

    private fun saveCurrentRoom() {
        sharedPreferences.edit()
            .putString(LAST_USED_ROOM_KEY, currentRoomName)
            .apply()
    }

    private fun saveRoomList() {
        val jsonArray = JSONArray()
        roomList.forEach { jsonArray.put(it) }
        sharedPreferences.edit()
            .putString(ROOM_LIST_KEY, jsonArray.toString())
            .apply()
    }

    private fun setupRoomListAdapter() {
        roomListAdapter = ArrayAdapter(
            this,
            com.google.android.material.R.layout.support_simple_spinner_dropdown_item,
            roomList
        )
        binding.roomListView.adapter = roomListAdapter
        binding.roomListView.setOnItemClickListener { _, _, position, _ ->
            currentRoomName = roomList[position]
            binding.roomCodeEditText.setText(formatRoomName(currentRoomName))
            updateButtonStates()
        }
    }

    private fun setupUI() {
        binding.roomCodeEditText.addTextChangedListener(object : TextWatcher {
            private var isFormatting = false
            private var deletingHyphen = false
            private var hyphenPositions = listOf(4, 9, 14)

            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {
                if (isFormatting) return

                if (count == 1 && after == 0 && hyphenPositions.contains(start)) {
                    deletingHyphen = true
                } else {
                    deletingHyphen = false
                }
            }

            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}

            override fun afterTextChanged(s: Editable?) {
                if (isFormatting || isServiceRunning) return

                isFormatting = true

                val text = s.toString().replace("-", "")
                if (text.length > 16) {
                    s?.replace(0, s.length, formatRoomName(currentRoomName))
                } else {
                    val formatted = StringBuilder()
                    for (i in text.indices) {
                        if (i > 0 && i % 4 == 0) {
                            formatted.append('-')
                        }
                        formatted.append(text[i])
                    }

                    val cursorPos = binding.roomCodeEditText.selectionStart
                    if (deletingHyphen && cursorPos > 0 && cursorPos < formatted.length &&
                        formatted[cursorPos] == '-') {
                        formatted.deleteCharAt(cursorPos)
                    }

                    s?.replace(0, s.length, formatted.toString())
                }

                isFormatting = false

                val cleanName = binding.roomCodeEditText.text.toString().replace("-", "")
                binding.saveCodeButton.isEnabled = cleanName.length == 16 &&
                        !roomList.contains(cleanName)
            }
        })

        binding.generateCodeButton.setOnClickListener {
            currentRoomName = generateRandomRoomName()
            binding.roomCodeEditText.setText(formatRoomName(currentRoomName))
            showToast("Generated: $currentRoomName")
        }

        binding.deleteRoomButton.setOnClickListener {
            val selectedRoom = binding.roomCodeEditText.text.toString().replace("-", "")
            if (roomList.contains(selectedRoom)) {
                showDeleteConfirmationDialog(selectedRoom)
            } else {
                showToast(getString(R.string.room_not_found))
            }
        }

        binding.saveCodeButton.setOnClickListener {
            val newRoomName = binding.roomCodeEditText.text.toString().replace("-", "")
            if (newRoomName.length == 16) {
                if (!roomList.contains(newRoomName)) {
                    roomList.add(0, newRoomName)
                    currentRoomName = newRoomName
                    saveRoomList()
                    saveCurrentRoom()
                    roomListAdapter.notifyDataSetChanged()
                    showToast("Room saved: ${formatRoomName(newRoomName)}")
                } else {
                    showToast("Room already exists")
                }
            }
        }

        binding.copyCodeButton.setOnClickListener {
            val roomName = binding.roomCodeEditText.text.toString()
            val clipboard = getSystemService(CLIPBOARD_SERVICE) as ClipboardManager
            val clip = ClipData.newPlainText("Room name", roomName)
            clipboard.setPrimaryClip(clip)
            showToast("Copied: $roomName")
        }

        binding.shareCodeButton.setOnClickListener {
            val roomName = binding.roomCodeEditText.text.toString()
            val shareIntent = Intent().apply {
                action = Intent.ACTION_SEND
                putExtra(Intent.EXTRA_TEXT, "Join my room: $roomName")
                type = "text/plain"
            }
            startActivity(Intent.createChooser(shareIntent, "Share Room"))
        }

        binding.startButton.setOnClickListener {
            if (isServiceRunning) {
                showToast("Service already running")
                return@setOnClickListener
            }

            currentRoomName = binding.roomCodeEditText.text.toString().replace("-", "")
            if (currentRoomName.isEmpty()) {
                showToast("Enter room name")
                return@setOnClickListener
            }

            if (checkAllPermissionsGranted() && isCameraPermissionGranted()) {
                val mediaManager = getSystemService(MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
                mediaProjectionLauncher.launch(mediaManager.createScreenCaptureIntent())
                checkBatteryOptimization()
            } else {
                requestPermissionLauncher.launch(requiredPermissions)
            }
        }

        binding.stopButton.setOnClickListener {
            if (!isServiceRunning) {
                showToast("Service not running")
                return@setOnClickListener
            }
            stopWebRTCService()
        }
    }

    private fun formatRoomName(name: String): String {
        if (name.length != 16) return name

        return buildString {
            for (i in 0 until 16) {
                if (i > 0 && i % 4 == 0) append('-')
                append(name[i])
            }
        }
    }

    private fun showDeleteConfirmationDialog(roomName: String) {
        if (roomList.size <= 1) {
            showToast(getString(R.string.cannot_delete_last))
            return
        }

        MaterialAlertDialogBuilder(this)
            .setTitle(getString(R.string.delete_confirm_title))
            .setMessage(getString(R.string.delete_confirm_message, formatRoomName(roomName)))
            .setPositiveButton(getString(R.string.delete_button)) { _, _ ->
                roomList.remove(roomName)
                saveRoomList()
                roomListAdapter.notifyDataSetChanged()

                if (currentRoomName == roomName) {
                    currentRoomName = roomList.first()
                    binding.roomCodeEditText.setText(formatRoomName(currentRoomName))
                    saveCurrentRoom()
                }

                showToast("Room deleted")
                updateButtonStates()
            }
            .setNegativeButton(getString(R.string.cancel_button), null)
            .show()
    }

    private fun generateRandomRoomName(): String {
        val chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        val random = Random.Default
        val code = StringBuilder()

        repeat(16) {
            code.append(chars[random.nextInt(chars.length)])
        }

        return code.toString()
    }

    private fun startWebRTCService(resultData: Intent) {
        try {
            // Сохраняем текущее имя комнаты перед запуском сервиса
            currentRoomName = binding.roomCodeEditText.text.toString().replace("-", "")
            saveCurrentRoom()

            WebRTCService.currentRoomName = currentRoomName
            val serviceIntent = Intent(this, WebRTCService::class.java).apply {
                putExtra("resultCode", RESULT_OK)
                putExtra("resultData", resultData)
                putExtra("roomName", currentRoomName)
            }
            ContextCompat.startForegroundService(this, serviceIntent)
            isServiceRunning = true
            updateButtonStates()
            showToast("Service started: ${formatRoomName(currentRoomName)}")
        } catch (e: Exception) {
            showToast("Start error: ${e.message}")
            Log.e("MainActivity", "Service start error", e)
        }
    }

    private fun stopWebRTCService() {
        try {
            val stopIntent = Intent(this, WebRTCService::class.java).apply {
                action = "STOP"
            }
            startService(stopIntent)
            isServiceRunning = false
            updateButtonStates()
            showToast("Service stopped")
        } catch (e: Exception) {
            showToast("Stop error: ${e.message}")
            Log.e("MainActivity", "Service stop error", e)
        }
    }

    private fun updateButtonStates() {
        binding.apply {
            // START активен только если сервис не работает
            startButton.isEnabled = !isServiceRunning

            // STOP активен только если сервис работает
            stopButton.isEnabled = isServiceRunning

            roomCodeEditText.isEnabled = !isServiceRunning
            saveCodeButton.isEnabled = !isServiceRunning &&
                    binding.roomCodeEditText.text.toString().replace("-", "").length == 16 &&
                    !roomList.contains(binding.roomCodeEditText.text.toString().replace("-", ""))
            generateCodeButton.isEnabled = !isServiceRunning
            deleteRoomButton.isEnabled = !isServiceRunning &&
                    roomList.contains(binding.roomCodeEditText.text.toString().replace("-", "")) &&
                    roomList.size > 1

            startButton.setBackgroundColor(
                ContextCompat.getColor(
                    this@MainActivity,
                    if (isServiceRunning) android.R.color.darker_gray else R.color.green
                )
            )
            stopButton.setBackgroundColor(
                ContextCompat.getColor(
                    this@MainActivity,
                    if (isServiceRunning) R.color.red else android.R.color.darker_gray
                )
            )
        }
    }

    private val serviceStateReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            if (intent.action == WebRTCService.ACTION_SERVICE_STATE) {
                isServiceRunning = intent.getBooleanExtra(WebRTCService.EXTRA_IS_RUNNING, false)
                updateButtonStates()
            }
        }
    }

    private fun checkAllPermissionsGranted() = requiredPermissions.all {
        ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED
    }

    private fun isCameraPermissionGranted(): Boolean {
        return ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.CAMERA
        ) == PackageManager.PERMISSION_GRANTED
    }

    private fun checkBatteryOptimization() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val powerManager = getSystemService(PowerManager::class.java)
            if (!powerManager.isIgnoringBatteryOptimizations(packageName)) {
                val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                    data = Uri.parse("package:$packageName")
                }
                startActivity(intent)
            }
        }
    }

    private fun showToast(text: String) {
        Toast.makeText(this, text, Toast.LENGTH_LONG).show()
    }

    @SuppressLint("UnspecifiedRegisterReceiverFlag")
    override fun onResume() {
        super.onResume()
        registerReceiver(serviceStateReceiver, IntentFilter(WebRTCService.ACTION_SERVICE_STATE))
        // Обновляем состояние при возвращении в активность
        isServiceRunning = WebRTCService.isRunning
        updateButtonStates()
    }

    override fun onPause() {
        super.onPause()
        unregisterReceiver(serviceStateReceiver)
    }

    companion object {
        private const val PREFS_NAME = "WebRTCPrefs"
        private const val ROOM_LIST_KEY = "room_list"
        private const val LAST_USED_ROOM_KEY = "last_used_room"
    }
}

// file: app/src/main/java/com/example/mytest/WebRTCClient.kt
package com.example.mytest

import android.content.Context
import android.os.Build
import android.util.Log
import org.webrtc.*
import org.webrtc.PeerConnectionFactory.InitializationOptions

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
            throw IllegalStateException("Failed to create peer connection")
        }
        createLocalTracks()
    }

    private fun initializePeerConnectionFactory() {
        // Инициализация WebRTC
        val initializationOptions = InitializationOptions.builder(context)
            .setEnableInternalTracer(true)
            .setFieldTrials("WebRTC-H264HighProfile/Enabled/")
            .createInitializationOptions()
        PeerConnectionFactory.initialize(initializationOptions)

        // Проверка кодеков
        val tempEncoderFactory = DefaultVideoEncoderFactory(eglBase.eglBaseContext, true, true)
        val supportedCodecs = tempEncoderFactory.supportedCodecs
        Log.d("WebRTCClient", "Supported codecs: ${supportedCodecs.joinToString { it.name }}")

        // Выбор videoEncoderFactory
        val videoEncoderFactory = if (supportedCodecs.any { it.name.equals("H264", ignoreCase = true) }) {
            Log.d("WebRTCClient", "Using hardware H.264 encoder")
            tempEncoderFactory
        } else {
            Log.w("WebRTCClient", "H.264 not supported by hardware, using software fallback")
            SoftwareVideoEncoderFactory()
        }

        val videoDecoderFactory = DefaultVideoDecoderFactory(eglBase.eglBaseContext)

        // Создание PeerConnectionFactory
        peerConnectionFactory = PeerConnectionFactory.builder()
            .setVideoEncoderFactory(videoEncoderFactory)
            .setVideoDecoderFactory(videoDecoderFactory)
            .setOptions(PeerConnectionFactory.Options().apply {
                disableEncryption = false
                disableNetworkMonitor = false
            })
            .createPeerConnectionFactory()
    }

    private fun createPeerConnection(): PeerConnection? {
        val rtcConfig = PeerConnection.RTCConfiguration(
            listOf(
                PeerConnection.IceServer.builder("stun:ardua.site:3478").createIceServer(),
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

        return peerConnectionFactory.createPeerConnection(rtcConfig, observer)
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
                return
            }

            surfaceTextureHelper = SurfaceTextureHelper.create("CaptureThread", eglBase.eglBaseContext)
            if (surfaceTextureHelper == null) {
                Log.e("WebRTCClient", "Failed to create SurfaceTextureHelper")
                return
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

// file: app/src/main/java/com/example/mytest/WebRTCService.kt
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
        const val ACTION_SERVICE_STATE = "com.example.mytest.SERVICE_STATE"
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

// file: app/src/main/java/com/example/mytest/WebSocketClient.kt
package com.example.mytest

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

приложение запустилось но при нажатии на кнопку START свернулось
-19 23:22:53.304  4667-4673  zygote64                com.example.mytest                   I  Do full code cache collection, code=239KB, data=185KB
2025-05-19 23:22:53.305  4667-4673  zygote64                com.example.mytest                   I  After code cache collection, code=236KB, data=154KB
2025-05-19 23:22:53.318  4667-4667  WebRTCClient            com.example.mytest                   D  Supported codecs: VP8, AV1, VP9
2025-05-19 23:22:53.318  4667-4667  WebRTCClient            com.example.mytest                   W  H.264 not supported by hardware, using software fallback
2025-05-19 23:22:53.320  4667-4667  AndroidRuntime          com.example.mytest                   D  Shutting down VM
2025-05-19 23:22:53.322  4667-4667  AndroidRuntime          com.example.mytest                   E  FATAL EXCEPTION: main
Process: com.example.mytest, PID: 4667
java.lang.NoClassDefFoundError: Failed resolution of: Lorg/webrtc/Environment;
at org.webrtc.PeerConnectionFactory$Builder.<init>(PeerConnectionFactory.java:166)
at org.webrtc.PeerConnectionFactory$Builder.<init>(Unknown Source:0)
at org.webrtc.PeerConnectionFactory.builder(PeerConnectionFactory.java:295)
at com.example.mytest.WebRTCClient.initializePeerConnectionFactory(WebRTCClient.kt:57)
at com.example.mytest.WebRTCClient.<init>(WebRTCClient.kt:24)
at com.example.mytest.WebRTCService.initializeWebRTC(WebRTCService.kt:327)
at com.example.mytest.WebRTCService.onCreate(WebRTCService.kt:267)
at android.app.ActivityThread.handleCreateService(ActivityThread.java:3961)
at android.app.ActivityThread.-wrap5(Unknown Source:0)
at android.app.ActivityThread$H.handleMessage(ActivityThread.java:2092)
at android.os.Handler.dispatchMessage(Handler.java:108)
at android.os.Looper.loop(Looper.java:166)
at android.app.ActivityThread.main(ActivityThread.java:7523)
at java.lang.reflect.Method.invoke(Native Method)
at com.android.internal.os.Zygote$MethodAndArgsCaller.run(Zygote.java:245)
at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:921)
Caused by: java.lang.ClassNotFoundException: Didn't find class "org.webrtc.Environment" on path: DexPathList[[zip file "/data/app/com.example.mytest-8WfugUtnK8nWcGgccbNN1Q==/base.apk"],nativeLibraryDirectories=[/data/app/com.example.mytest-8WfugUtnK8nWcGgccbNN1Q==/lib/arm64, /data/app/com.example.mytest-8WfugUtnK8nWcGgccbNN1Q==/base.apk!/lib/arm64-v8a, /system/lib64, /vendor/lib64, /product/lib64]]
at dalvik.system.BaseDexClassLoader.findClass(BaseDexClassLoader.java:93)
at java.lang.ClassLoader.loadClass(ClassLoader.java:379)
at java.lang.ClassLoader.loadClass(ClassLoader.java:312)
at org.webrtc.PeerConnectionFactory$Builder.<init>(PeerConnectionFactory.java:166) 
at org.webrtc.PeerConnectionFactory$Builder.<init>(Unknown Source:0) 
                                                                                                    	at org.webrtc.PeerConnectionFactory.builder(PeerConnectionFactory.java:295) 
                                                                                                    	at com.example.mytest.WebRTCClient.initializePeerConnectionFactory(WebRTCClient.kt:57) 
                                                                                                    	at com.example.mytest.WebRTCClient.<init>(WebRTCClient.kt:24) 
                                                                                                    	at com.example.mytest.WebRTCService.initializeWebRTC(WebRTCService.kt:327) 
                                                                                                    	at com.example.mytest.WebRTCService.onCreate(WebRTCService.kt:267) 
                                                                                                    	at android.app.ActivityThread.handleCreateService(ActivityThread.java:3961) 
                                                                                                    	at android.app.ActivityThread.-wrap5(Unknown Source:0) 
                                                                                                    	at android.app.ActivityThread$H.handleMessage(ActivityThread.java:2092) 
at android.os.Handler.dispatchMessage(Handler.java:108) 
at android.os.Looper.loop(Looper.java:166) 
at android.app.ActivityThread.main(ActivityThread.java:7523) 
at java.lang.reflect.Method.invoke(Native Method) 
at com.android.internal.os.Zygote$MethodAndArgsCaller.run(Zygote.java:245) 
                                                                                                    	at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:921) 
2025-05-19 23:22:53.337  4667-4667  Process                 com.example.mytest                   I  Sending signal. PID: 4667 SIG: 9
---------------------------- PROCESS ENDED (4667) for package com.example.mytest ----------------------------
2025-05-19 23:22:53.445  1249-1392  InputDispatcher         system_server                        E  channel '8cb24e3 com.example.mytest/com.example.mytest.MainActivity (server)' ~ Channel is unrecoverably broken and will be disposed!
---------------------------- PROCESS STARTED (4773) for package com.example.mytest ----------------------------
2025-05-19 23:22:54.598  4773-4773  HwFLClassLoader         com.example.mytest                   D  get used feature list :/feature/used-list failed!
2025-05-19 23:22:54.598  4773-4773  HwFLClassLoader         com.example.mytest                   D  USE_FEATURE_LIST had not init!
2025-05-19 23:22:54.605  4773-4794  HwApiCacheMangerEx      com.example.mytest                   I  apicache mCurPackageName=com.example.mytest uptimes=792182173
2025-05-19 23:22:54.608  4773-4794  HwApiCacheMangerEx      com.example.mytest                   I  apicache oUid null
2025-05-19 23:22:54.610  4773-4794  HwApiCacheMangerEx      com.example.mytest                   I  apicache volumes null
2025-05-19 23:22:54.612  4773-4794  HwApiCacheMangerEx      com.example.mytest                   I  apicache path=/storage/emulated/0 state=mounted key=com.example.mytest#10123#256
2025-05-19 23:22:54.614  4773-4794  HwApiCacheMangerEx      com.example.mytest                   I  apicache oUid 10123
2025-05-19 23:22:54.614  4773-4794  HwApiCacheMangerEx      com.example.mytest                   I  apicache volumes null
2025-05-19 23:22:54.618  4773-4794  HwApiCacheMangerEx      com.example.mytest                   I  apicache path=/storage/emulated/0 state=mounted key=com.example.mytest#10123#0
2025-05-19 23:22:54.619  4773-4794  HwApiCacheMangerEx      com.example.mytest                   I  apicache async read begin packageName=com.example.mytest userid=0
2025-05-19 23:22:54.620  4773-4794  HwApiCacheMangerEx      com.example.mytest                   I  apicache pi null
2025-05-19 23:22:54.623  4773-4794  chatty                  com.example.mytest                   I  uid=10123(u0_a123) queued-work-loo identical 1 line
2025-05-19 23:22:54.628  4773-4794  HwApiCacheMangerEx      com.example.mytest                   I  apicache pi null
2025-05-19 23:22:54.631  4773-4773  HwApiCacheMangerEx      com.example.mytest                   I  apicache pi null
2025-05-19 23:22:54.631  4773-4794  HwApiCacheMangerEx      com.example.mytest                   I  apicache oUid null
2025-05-19 23:22:54.633  4773-4794  HwApiCacheMangerEx      com.example.mytest                   I  apicache async read finished packageName=com.example.mytest userid=0 totalus=14262
2025-05-19 23:22:54.661  4773-4773  WM-WrkMgrInitializer    com.example.mytest                   D  Initializing WorkManager with default configuration.
2025-05-19 23:22:54.680  4773-4773  HwCust                  com.example.mytest                   I  Constructor found for class android.net.HwCustConnectivityManagerImpl
2025-05-19 23:22:54.680  4773-4773  HwCust                  com.example.mytest                   D  Create obj success use class android.net.HwCustConnectivityManagerImpl
2025-05-19 23:22:54.708  4773-4773  Minikin                 com.example.mytest                   E  Could not get cmap table size!
2025-05-19 23:22:54.709  4773-4794  MemoryLeak...torManager com.example.mytest                   E  MemoryLeakMonitor.jar is not exist!
2025-05-19 23:22:54.731  4773-4773  WebRTCService           com.example.mytest                   D  Service created with room:
2025-05-19 23:22:54.748  4773-4773  WebRTCService           com.example.mytest                   D  Initializing new WebRTC connection
2025-05-19 23:22:54.748  4773-4773  WebRTCService           com.example.mytest                   D  WebRTC resources cleaned up
2025-05-19 23:22:54.761  4773-4773  org.webrtc.Logging      com.example.mytest                   I  EglBase14Impl: Using OpenGL ES version 2
2025-05-19 23:22:54.773  4773-4773  HwWidgetFactory         com.example.mytest                   V  : successes to get AllImpl object and return....
2025-05-19 23:22:54.788  4773-4773  ResourceType            com.example.mytest                   W  No known package when getting name for resource number 0xffffffff
2025-05-19 23:22:54.796  4773-4820  org.webrtc.Logging      com.example.mytest                   I  EglBase14Impl: Using OpenGL ES version 2
2025-05-19 23:22:54.799  4773-4773  org.webrtc.Logging      com.example.mytest                   I  EglRenderer: Initializing EglRenderer
2025-05-19 23:22:54.801  4773-4773  ResourceType            com.example.mytest                   W  No known package when getting name for resource number 0xffffffff
2025-05-19 23:22:54.803  4773-4821  org.webrtc.Logging      com.example.mytest                   I  EglBase14Impl: Using OpenGL ES version 2
2025-05-19 23:22:54.807  4773-4773  org.webrtc.Logging      com.example.mytest                   I  EglRenderer: Initializing EglRenderer
2025-05-19 23:22:54.809  4773-4773  org.webrtc.Logging      com.example.mytest                   I  NativeLibrary: Loading native library: jingle_peerconnection_so
2025-05-19 23:22:54.809  4773-4773  org.webrtc.Logging      com.example.mytest                   I  NativeLibrary: Loading library: jingle_peerconnection_so
2025-05-19 23:22:54.815  4773-4773  linker                  com.example.mytest                   W  "/data/app/com.example.mytest-8WfugUtnK8nWcGgccbNN1Q==/base.apk!/lib/arm64-v8a/libjingle_peerconnection_so.so" unused DT entry: type 0x70000001 arg 0x0
2025-05-19 23:22:54.817  4773-4773  jni_onload.cc           com.example.mytest                   I  (line 24): Entering JNI_OnLoad in jni_onload.cc
2025-05-19 23:22:54.818  4773-4773  jvm_android.cc          com.example.mytest                   I  (line 214): JVM::Initialize
2025-05-19 23:22:54.818  4773-4773  jvm_android.cc          com.example.mytest                   I  (line 245): JVM::JVM
2025-05-19 23:22:54.818  4773-4773  jvm_android.cc          com.example.mytest                   I  (line 36): LoadClasses:
2025-05-19 23:22:54.818  4773-4773  peer_conne...factory.cc com.example.mytest                   I  (line 214): initializeFieldTrials: WebRTC-H264HighProfile/Enabled/
2025-05-19 23:22:54.819  4773-4773  field_trial.cc          com.example.mytest                   I  (line 164): Setting field trial string:WebRTC-H264HighProfile/Enabled/
2025-05-19 23:22:54.819  4773-4773  org.webrtc.Logging      com.example.mytest                   I  PeerConnectionFactory: PeerConnectionFactory was initialized without an injected Loggable. Any existing Loggable will be deleted.
2025-05-19 23:22:54.886  4773-4773  VideoCapabilities       com.example.mytest                   W  Unrecognized profile/level 1/32 for video/mp4v-es
2025-05-19 23:22:54.886  4773-4773  VideoCapabilities       com.example.mytest                   I  Unsupported profile 16384 for video/mp4v-es
2025-05-19 23:22:54.886  4773-4773  VideoCapabilities       com.example.mytest                   I  Unsupported profile 16384 for video/mp4v-es
2025-05-19 23:22:54.898  4773-4773  VideoCapabilities       com.example.mytest                   W  Unsupported mime video/x-pn-realvideo
2025-05-19 23:22:54.903  4773-4773  VideoCapabilities       com.example.mytest                   W  Unsupported mime video/mpeg
2025-05-19 23:22:54.906  4773-4773  VideoCapabilities       com.example.mytest                   W  Unrecognized profile/level 0/0 for video/mpeg2
2025-05-19 23:22:54.907  4773-4773  VideoCapabilities       com.example.mytest                   W  Unrecognized profile/level 0/2 for video/mpeg2
2025-05-19 23:22:54.907  4773-4773  VideoCapabilities       com.example.mytest                   W  Unrecognized profile/level 0/3 for video/mpeg2
2025-05-19 23:22:54.911  4773-4773  VideoCapabilities       com.example.mytest                   W  Unrecognized profile/level 32768/2 for video/mp4v-es
2025-05-19 23:22:54.919  4773-4773  VideoCapabilities       com.example.mytest                   W  Unsupported mime video/vc1
2025-05-19 23:22:54.926  4773-4773  VideoCapabilities       com.example.mytest                   W  Unsupported mime video/x-flv
2025-05-19 23:22:54.953  4773-4773  VideoCapabilities       com.example.mytest                   I  Unsupported profile 4 for video/mp4v-es
2025-05-19 23:22:54.975  4773-4773  WebRTCClient            com.example.mytest                   D  Supported codecs: VP8, AV1, VP9
2025-05-19 23:22:54.975  4773-4773  WebRTCClient            com.example.mytest                   W  H.264 not supported by hardware, using software fallback
2025-05-19 23:22:54.977  4773-4773  AndroidRuntime          com.example.mytest                   D  Shutting down VM
2025-05-19 23:22:54.980  4773-4773  AndroidRuntime          com.example.mytest                   E  FATAL EXCEPTION: main
Process: com.example.mytest, PID: 4773
java.lang.NoClassDefFoundError: Failed resolution of: Lorg/webrtc/Environment;
at org.webrtc.PeerConnectionFactory$Builder.<init>(PeerConnectionFactory.java:166)
at org.webrtc.PeerConnectionFactory$Builder.<init>(Unknown Source:0)
at org.webrtc.PeerConnectionFactory.builder(PeerConnectionFactory.java:295)
at com.example.mytest.WebRTCClient.initializePeerConnectionFactory(WebRTCClient.kt:57)
at com.example.mytest.WebRTCClient.<init>(WebRTCClient.kt:24)
at com.example.mytest.WebRTCService.initializeWebRTC(WebRTCService.kt:327)
at com.example.mytest.WebRTCService.onCreate(WebRTCService.kt:267)
at android.app.ActivityThread.handleCreateService(ActivityThread.java:3961)
at android.app.ActivityThread.-wrap5(Unknown Source:0)
at android.app.ActivityThread$H.handleMessage(ActivityThread.java:2092)
at android.os.Handler.dispatchMessage(Handler.java:108)
at android.os.Looper.loop(Looper.java:166)
at android.app.ActivityThread.main(ActivityThread.java:7523)
at java.lang.reflect.Method.invoke(Native Method)
at com.android.internal.os.Zygote$MethodAndArgsCaller.run(Zygote.java:245)
at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:921)
Caused by: java.lang.ClassNotFoundException: Didn't find class "org.webrtc.Environment" on path: DexPathList[[zip file "/data/app/com.example.mytest-8WfugUtnK8nWcGgccbNN1Q==/base.apk"],nativeLibraryDirectories=[/data/app/com.example.mytest-8WfugUtnK8nWcGgccbNN1Q==/lib/arm64, /data/app/com.example.mytest-8WfugUtnK8nWcGgccbNN1Q==/base.apk!/lib/arm64-v8a, /system/lib64, /vendor/lib64, /product/lib64]]
at dalvik.system.BaseDexClassLoader.findClass(BaseDexClassLoader.java:93)
at java.lang.ClassLoader.loadClass(ClassLoader.java:379)
at java.lang.ClassLoader.loadClass(ClassLoader.java:312)
at org.webrtc.PeerConnectionFactory$Builder.<init>(PeerConnectionFactory.java:166) 
at org.webrtc.PeerConnectionFactory$Builder.<init>(Unknown Source:0) 
                                                                                                    	at org.webrtc.PeerConnectionFactory.builder(PeerConnectionFactory.java:295) 
                                                                                                    	at com.example.mytest.WebRTCClient.initializePeerConnectionFactory(WebRTCClient.kt:57) 
                                                                                                    	at com.example.mytest.WebRTCClient.<init>(WebRTCClient.kt:24) 
                                                                                                    	at com.example.mytest.WebRTCService.initializeWebRTC(WebRTCService.kt:327) 
                                                                                                    	at com.example.mytest.WebRTCService.onCreate(WebRTCService.kt:267) 
                                                                                                    	at android.app.ActivityThread.handleCreateService(ActivityThread.java:3961) 
                                                                                                    	at android.app.ActivityThread.-wrap5(Unknown Source:0) 
                                                                                                    	at android.app.ActivityThread$H.handleMessage(ActivityThread.java:2092) 
at android.os.Handler.dispatchMessage(Handler.java:108) 
at android.os.Looper.loop(Looper.java:166) 
at android.app.ActivityThread.main(ActivityThread.java:7523) 
at java.lang.reflect.Method.invoke(Native Method) 
at com.android.internal.os.Zygote$MethodAndArgsCaller.run(Zygote.java:245) 
                                                                                                    	at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:921) 

отвечай на русском
