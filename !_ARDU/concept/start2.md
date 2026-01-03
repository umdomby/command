
1. coturn:
`stun:ardua.site:3478`
`stuns:ardua.site:5349`             
`turn:ardua.site:3478`        
`turns:ardua.site:5349`   


2. ESP32
3. Windows приложение

Исправь включение выключение RGB светодиода

LocalPort = 5001;
и
const uint16_t localUdpPort = 12345;
в роутере нужно делать проброс?
Сделай соединение более устойчивым UDP


и что лучше WebSocket соединение или UDP пакеты? что быстрее для робота и датчиков?


2. ESP32
3. Windows приложение