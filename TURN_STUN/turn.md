Проверка TURN:

fetch('https://network-check.example.com/turn-config')
.then(res => res.json())
.then(config => {
const pc = new RTCPeerConnection({iceServers: config});
pc.createDataChannel('test');
return pc.createOffer();
})
.then(offer => console.log('TURN test offer:', offer.sdp));






7. Фикс для "вечного подключения"
   Добавьте таймаут в useWebRTC.ts:

typescript
Copy
useEffect(() => {
const timer = setTimeout(() => {
if (connectionStatus === 'connecting') {
setError('Connection timeout. Please check your network.');
stopCall();
}
}, 30000); // 30 секунд таймаут

    return () => clearTimeout(timer);
}, [connectionStatus]);