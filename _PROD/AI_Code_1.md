scheduleReconnect

Логика проверки состояния соединения:
В методе reconnect() есть проверки, которые предотвращают переподключение, если сервис уже подключен или находится в процессе подключения:
if (isConnected || isConnecting) {
Log.d("WebRTCService", "Already connected or connecting, skipping manual reconnect")
return
}

private fun connectWebSocket()
private fun initializeWebRTC()
private fun reconnect()
override fun onFailure

https://grok.com/chat/c90d1f13-2ba6-4116-b47e-55777f8d34c4
https://chat.deepseek.com/a/chat/s/fe6b1ff1-95e0-44b3-b316-5465a53511f6


222