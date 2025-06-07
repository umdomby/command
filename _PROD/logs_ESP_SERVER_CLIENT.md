Отправка двух сообщений Heartbeat с ESP8266:

# Heartbeat Arduino
# В коде Arduino в функции loop() вы отправляете сообщение Heartbeat - OK каждые 10 секунд, если устройство идентифицировано (isIdentified):

if (isIdentified) {
if (millis() - lastHeartbeatTime > 10000) {
lastHeartbeatTime = millis();
sendLogMessage("Heartbeat - OK");
char relayStatus[64];
snprintf(relayStatus, sizeof(relayStatus), "Relay states: D0=%s, 3=%s",
digitalRead(button1) == LOW ? "on" : "off",
digitalRead(button2) == LOW ? "on" : "off");
sendLogMessage(relayStatus);
}
}
Здесь отправляются два сообщения подряд:

Первое: sendLogMessage("Heartbeat - OK") — сообщение типа log с текстом Heartbeat - OK.
Второе: sendLogMessage(relayStatus) — сообщение типа log с информацией о состоянии реле.
Эти сообщения пересылаются сервером на клиент (браузер), что приводит к появлению двух записей в логе клиента.

# HBT Client
# Обработка команды HBT на стороне ESP8266:
Клиент каждую секунду отправляет команду HBT (heartbeat) на сервер, который перенаправляет её на ESP8266. В функции onMessageCallback на ESP8266 при получении команды HBT отправляется ответное сообщение Heartbeat - OK:

else if (strcmp(co, "HBT") == 0) {
lastHeartbeat2Time = millis();
sendLogMessage("Heartbeat - OK");
return;
}
Это дополнительно генерирует сообщение типа log с текстом Heartbeat - OK, которое также доходит до клиента.

# Сообщение cst (command status):
# Когда клиент отправляет команду HBT, сервер подтверждает её доставку на ESP8266, отправляя сообщение типа cst (command status) с состоянием dvd (delivered):

tsx

} else if (data.ty === "cst") {
addLog(`Command ${data.co} delivered`, 'client')
}
Это объясняет появление сообщения {ty: 'cst', st: 'dvd', co: 'HBT', ...} в логе клиента.

Итак, вы получаете:

Два сообщения log с Heartbeat - OK:
Одно из-за периодической отправки Heartbeat - OK каждые 10 секунд в loop().
Второе как ответ на команду HBT, отправляемую клиентом каждую секунду.
Одно сообщение cst как подтверждение доставки команды HBT от сервера.