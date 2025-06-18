

при нажатии на
<Button
onClick={async () => {
leaveRoom();
setAutoJoin(false);
setIsJoining(false);
setError(null);
setActiveMainTab('webrtc');
hasAttemptedAutoJoin.current = false;
if (webRTCRetryTimeoutRef.current) {
clearTimeout(webRTCRetryTimeoutRef.current);
webRTCRetryTimeoutRef.current = null;
}
// Вызываем disconnectWebSocket
if (socketClientRef.current.disconnectWebSocket) {
await socketClientRef.current.disconnectWebSocket();
}
setShowDisconnectDialog(true);
setTimeout(() => setShowDisconnectDialog(false), 3000);
}}
className={styles.button}
>
Отключить подключение
</Button>
или
<Button
onClick={async () => {
leaveRoom();
setActiveMainTab('webrtc');
setIsJoining(false);
setAutoJoin(false);
updateAutoConnect(roomId.replace(/-/g, ''), false);
hasAttemptedAutoJoin.current = false;
if (webRTCRetryTimeoutRef.current) {
clearTimeout(webRTCRetryTimeoutRef.current);
webRTCRetryTimeoutRef.current = null;
}
// Вызываем disconnectWebSocket
if (socketClientRef.current.disconnectWebSocket) {
await socketClientRef.current.disconnectWebSocket();
}
}}
disabled={!isConnected}
className={styles.button}
>
Покинуть комнату
</Button>
должно происходить отключение от сокета model Devices idDevice String  \\wsl.localhost\Ubuntu-24.04\home\pi\prod\docker-ardua-444\components\control\SocketClient.tsx
сделай точечные изменения, укажи что изменить , отвечай на русском.