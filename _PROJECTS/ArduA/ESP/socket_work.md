сейчас из браузера "use client"
import { useState, useEffect } from 'react';

export default function SocketClient() {
const [inputValue, setInputValue] = useState('');
const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(() => {
        const ws = new WebSocket('ws://192.168.0.151:8080');
        setSocket(ws);

        return () => {
            ws.close();
        };
    }, []);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (socket && inputValue) {
            socket.send(inputValue);
            setInputValue('');
        }
    };

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                />
                <button type="submit">Send</button>
            </form>
        </div>
    );
}
передается на server
// server.js
const { WebSocketServer, WebSocket } = require('ws');

// Создаем WebSocket сервер на порту 8080
const wss = new WebSocketServer({ port: 8080 });

// Подключение к целевому серверу (если нужно)
const TARGET_SERVER = 'ws://192.168.0.151:8081'; // (опционально)
let targetSocket = null;

function connectToTarget() {
targetSocket = new WebSocket(TARGET_SERVER);

    targetSocket.on('open', () => {
        console.log('Connected to target server!');
    });

    targetSocket.on('close', () => {
        console.log('Disconnected from target server. Reconnecting...');
        setTimeout(connectToTarget, 5000);
    });

    targetSocket.on('error', (err) => {
        console.error('Target server error:', err);
    });

    // Пересылаем сообщения от целевого сервера обратно клиентам
    targetSocket.on('message', (data) => {
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data.toString());
            }
        });
    });
}

// Если нужен прокси-сервер, раскомментируйте:
// connectToTarget();

wss.on('connection', (ws) => {
console.log('New client connected!');

    ws.on('message', (data) => {
        console.log('Received:', data.toString());

        // Пересылаем сообщение всем клиентам (включая ESP8266)
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(data.toString());
            }
        });

        // Если есть целевой сервер, пересылаем и туда
        if (targetSocket && targetSocket.readyState === WebSocket.OPEN) {
            targetSocket.send(data.toString());
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

console.log('WebSocket server running on ws://localhost:8080');

мне нужно чтобы из server ретранслировалось на ESP8266
#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ArduinoWebsockets.h>
#include <ArduinoJson.h>

const char* ssid = "Robolab124";
const char* password = "wifi123123123";
const char* websockets_server = "ws://192.168.0.151:8080";  // Убедитесь, что порт совпадает с сервером

using namespace websockets;
WebsocketsClient client;

void onMessageCallback(WebsocketsMessage message) {
Serial.print("Received: ");
Serial.println(message.data());

DynamicJsonDocument doc(1024);
DeserializationError error = deserializeJson(doc, message.data());

if (error) {
Serial.print("JSON parse error: ");
Serial.println(error.c_str());
return;
}

if (doc.containsKey("command")) {
String cmd = doc["command"];
Serial.print("Command: ");
Serial.println(cmd);

    if (cmd == "forward") {
      // Движение вперёд
      Serial.println("Moving FORWARD");
    } else if (cmd == "backward") {
      // Движение назад
      Serial.println("Moving BACKWARD");
    } else if (cmd == "servo") {
      int angle = doc["angle"];
      Serial.print("Setting servo angle: ");
      Serial.println(angle);
    }
}
}

void setup() {
Serial.begin(115200);

// Подключение к Wi-Fi
WiFi.begin(ssid, password);
while (WiFi.status() != WL_CONNECTED) {
delay(500);
Serial.print(".");
}
Serial.println("\nConnected to WiFi!");
Serial.print("IP: ");
Serial.println(WiFi.localIP());

// Подключение к WebSocket серверу
client.onMessage(onMessageCallback);

while (!client.connect(websockets_server)) {
delay(500);
Serial.print(".");
}
Serial.println("Connected to WebSocket!");

// Отправка идентификатора устройства
client.send("{\"device\":\"esp8266\",\"id\":\"995511\"}");
}

void loop() {
client.poll();
}
а из ESP8266 транслировалось обратно на сервер и из сервера на клиент в отдельное поле.

