


клиент
"use client"
import { useState, useEffect, useRef, useCallback } from 'react';

type MessageType = {
type?: string;
command?: string;
deviceId?: string;
message?: string;
params?: any;
clientId?: number;
status?: string;
timestamp?: string;
origin?: 'client' | 'esp' | 'server' | 'error';
reason?: string;
};

type LogEntry = {
message: string;
type: 'client' | 'esp' | 'server' | 'error';
};

export default function WebsocketController() {
const [log, setLog] = useState<LogEntry[]>([]);
const [isConnected, setIsConnected] = useState(false);
const [isIdentified, setIsIdentified] = useState(false);
const [angle, setAngle] = useState(90);
const [deviceId, setDeviceId] = useState('123');
const [inputDeviceId, setInputDeviceId] = useState('123');
const [espConnected, setEspConnected] = useState(false);
const socketRef = useRef<WebSocket | null>(null);
const commandTimeoutRef = useRef<NodeJS.Timeout | null>(null);
const espWatchdogRef = useRef<NodeJS.Timeout | null>(null);
const reconnectAttemptRef = useRef(0);

    const addLog = useCallback((msg: string, type: LogEntry['type']) => {
        setLog(prev => [...prev.slice(-100), {message: `${new Date().toLocaleTimeString()}: ${msg}`, type}]);
    }, []);

    const resetEspWatchdog = useCallback(() => {
        if (espWatchdogRef.current) clearTimeout(espWatchdogRef.current);
        espWatchdogRef.current = setTimeout(() => {
            if (espConnected) {
                setEspConnected(false);
                addLog(`ESP[${deviceId}] connection lost (timeout)`, 'error');
            }
        }, 15000); // 15 секунд без ответа = потеря связи
    }, [deviceId, addLog, espConnected]);

    const connectWebSocket = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.close();
        }

        reconnectAttemptRef.current = 0;
        const ws = new WebSocket('ws://192.168.0.151:8080');

        ws.onopen = () => {
            setIsConnected(true);
            reconnectAttemptRef.current = 0;
            addLog("Connected to WebSocket server", 'server');

            // Отправляем тип клиента
            ws.send(JSON.stringify({
                type: 'client_type',
                clientType: 'browser'
            }));

            // Идентификация
            ws.send(JSON.stringify({
                type: 'identify',
                deviceId: inputDeviceId
            }));
        };

        ws.onmessage = (event) => {
            try {
                const data: MessageType = JSON.parse(event.data);

                if (data.type === "system") {
                    if (data.status === "connected") {
                        setIsIdentified(true);
                        setDeviceId(inputDeviceId);
                        resetEspWatchdog();
                    }
                    addLog(`System: ${data.message}`, 'server');
                }
                else if (data.type === "error") {
                    addLog(`Error: ${data.message}`, 'error');
                    setIsIdentified(false);
                }
                else if (data.type === "log") {
                    addLog(`ESP: ${data.message}`, 'esp');
                    resetEspWatchdog();
                }
                else if (data.type === "esp_status") {
                    setEspConnected(data.status === "connected");
                    addLog(`ESP ${data.status === "connected" ? "✅ Connected" : "❌ Disconnected"}${data.reason ? ` (${data.reason})` : ''}`,
                        data.status === "connected" ? 'esp' : 'error');
                    if (data.status === "connected") resetEspWatchdog();
                }
                else if (data.type === "command_ack") {
                    if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
                    addLog(`ESP executed command: ${data.command}`, 'esp');
                }
                else if (data.type === "command_status") {
                    addLog(`Command ${data.command} delivered to ESP`, 'server');
                }
            } catch {
                addLog(`Received invalid message: ${event.data}`, 'error');
            }
        };

        ws.onclose = (event) => {
            setIsConnected(false);
            setIsIdentified(false);
            setEspConnected(false);
            addLog(`Disconnected from server${event.reason ? `: ${event.reason}` : ''}`, 'server');
            if (espWatchdogRef.current) clearTimeout(espWatchdogRef.current);

            // Автоматическое переподключение
            if (reconnectAttemptRef.current < 5) {
                reconnectAttemptRef.current += 1;
                const delay = Math.min(1000 * reconnectAttemptRef.current, 5000);
                addLog(`Attempting to reconnect in ${delay/1000} seconds...`, 'server');
                setTimeout(connectWebSocket, delay);
            }
        };

        ws.onerror = (error) => {
            addLog(`WebSocket error: ${error.type}`, 'error');
        };

        socketRef.current = ws;
    }, [addLog, inputDeviceId, resetEspWatchdog]);

    const disconnectWebSocket = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.close();
            setIsConnected(false);
            setIsIdentified(false);
            setEspConnected(false);
            addLog("Disconnected manually", 'server');
            if (espWatchdogRef.current) clearTimeout(espWatchdogRef.current);
            reconnectAttemptRef.current = 5; // Отключаем автореконнект
        }
    }, [addLog]);

    useEffect(() => {
        // Автоподключение при монтировании
        connectWebSocket();

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
            if (espWatchdogRef.current) clearTimeout(espWatchdogRef.current);
            if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
        };
    }, [connectWebSocket]);

    const sendCommand = useCallback((command: string, params?: any) => {
        if (!isIdentified) {
            addLog("Cannot send command: not identified", 'error');
            return;
        }

        if (socketRef.current?.readyState === WebSocket.OPEN) {
            const msg = JSON.stringify({
                command,
                params,
                deviceId,
                timestamp: Date.now(),
                expectAck: true
            });

            socketRef.current.send(msg);
            addLog(`Sent command to ${deviceId}: ${command}`, 'client');

            // Таймаут на подтверждение команды
            if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
            commandTimeoutRef.current = setTimeout(() => {
                if (espConnected) {
                    addLog(`Command ${command} not acknowledged by ESP`, 'error');
                    setEspConnected(false);
                }
            }, 5000);
        } else {
            addLog("WebSocket not ready!", 'error');
        }
    }, [addLog, deviceId, isIdentified, espConnected]);

    return (
        <div className="container">
            <h1>ESP8266 WebSocket Control</h1>

            <div className="status">
                Status: {isConnected ?
                (isIdentified ? `✅ Connected & Identified (ESP: ${espConnected ? '✅' : '❌'})` : "🟡 Connected (Pending)") :
                "❌ Disconnected"}
                {reconnectAttemptRef.current > 0 && reconnectAttemptRef.current < 5 &&
                    ` (Reconnecting ${reconnectAttemptRef.current}/5)`}
            </div>

            <div className="connection-control">
                <div className="device-id-input">
                    <input
                        type="text"
                        placeholder="Enter Device ID"
                        value={inputDeviceId}
                        onChange={(e) => setInputDeviceId(e.target.value)}
                        disabled={isConnected}
                    />
                </div>
                <div className="connection-buttons">
                    <button
                        onClick={connectWebSocket}
                        disabled={isConnected}
                    >
                        Connect
                    </button>
                    <button
                        onClick={disconnectWebSocket}
                        disabled={!isConnected}
                        className="disconnect-btn"
                    >
                        Disconnect
                    </button>
                </div>
            </div>

            <div className="control-panel">
                <div className="device-info">
                    <p>Current Device ID: <strong>{deviceId}</strong></p>
                    <p>ESP Status: <strong>{espConnected ? 'Connected' : 'Disconnected'}</strong></p>
                </div>

                <button onClick={() => sendCommand("forward")} disabled={!isIdentified || !espConnected}>
                    Forward
                </button>
                <button onClick={() => sendCommand("backward")} disabled={!isIdentified || !espConnected}>
                    Backward
                </button>

                <div className="servo-control">
                    <input
                        type="range"
                        min="0"
                        max="180"
                        value={angle}
                        onChange={(e) => setAngle(parseInt(e.target.value))}
                        disabled={!isIdentified || !espConnected}
                    />
                    <span>{angle}°</span>
                    <button
                        onClick={() => sendCommand("servo", { angle })}
                        disabled={!isIdentified || !espConnected}
                    >
                        Set Angle
                    </button>
                </div>
            </div>

            <div className="log-container">
                <h3>Event Log</h3>
                <div className="log-content">
                    {log.slice().reverse().map((entry, index) => (
                        <div key={index} className={`log-entry ${entry.type}`}>
                            {entry.message}
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
                .container {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                    font-family: Arial;
                }
                .status {
                    margin: 10px 0;
                    padding: 10px;
                    background: ${isConnected ?
                (isIdentified ?
                    (espConnected ? '#e6f7e6' : '#fff3e0') :
                    '#fff3e0') :
                '#ffebee'};
                    border: 1px solid ${isConnected ?
                (isIdentified ?
                    (espConnected ? '#4caf50' : '#ffa000') :
                    '#ffa000') :
                '#f44336'};
                    border-radius: 4px;
                }
                .connection-control {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    margin: 15px 0;
                    padding: 15px;
                    background: #f5f5f5;
                    border-radius: 8px;
                }
                .device-id-input input {
                    flex-grow: 1;
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                }
                .connection-buttons {
                    display: flex;
                    gap: 10px;
                }
                button {
                    padding: 10px 15px;
                    background: #2196f3;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                button:disabled {
                    background: #b0bec5;
                    cursor: not-allowed;
                }
                .disconnect-btn {
                    background: #f44336;
                }
                .control-panel {
                    margin: 20px 0;
                    padding: 15px;
                    background: #f5f5f5;
                    border-radius: 8px;
                }
                .device-info {
                    padding: 10px;
                    background: white;
                    border-radius: 4px;
                    margin-bottom: 10px;
                }
                .servo-control {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-top: 10px;
                }
                .log-container {
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    overflow: hidden;
                }
                .log-content {
                    height: 300px;
                    overflow-y: auto;
                    padding: 10px;
                    background: #fafafa;
                }
                .log-entry {
                    margin: 5px 0;
                    padding: 5px;
                    border-bottom: 1px solid #eee;
                    font-family: monospace;
                    font-size: 14px;
                }
                .log-entry.client {
                    color: #2196F3;
                }
                .log-entry.esp {
                    color: #4CAF50;
                }
                .log-entry.server {
                    color: #9C27B0;
                }
                .log-entry.error {
                    color: #F44336;
                    font-weight: bold;
                }
            `}</style>
        </div>
    );
}


сервер
import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { getAllowedDeviceIds } from './app/actions';

const PORT = 8080;

interface ClientInfo {
ws: WebSocket;
deviceId?: string;
ip: string;
isIdentified: boolean;
clientType?: 'browser' | 'esp';
lastActivity: number;
isAlive: boolean;
}

const clients = new Map<number, ClientInfo>();

const wss = new WebSocketServer({ port: PORT });

// Ping clients every 30 seconds
setInterval(() => {
clients.forEach((client, clientId) => {
if (!client.isAlive) {
client.ws.terminate();
clients.delete(clientId);
console.log(`Client ${clientId} terminated (no ping response)`);
return;
}
client.isAlive = false;
client.ws.ping(null, false);
});
}, 30000);

wss.on('connection', async (ws: WebSocket, req: IncomingMessage) => {
const clientId = Date.now();
const ip = req.socket.remoteAddress || 'unknown';
const client: ClientInfo = {
ws,
ip,
isIdentified: false,
lastActivity: Date.now(),
isAlive: true
};
clients.set(clientId, client);

    console.log(`New connection: ${clientId} from ${ip}`);

    ws.on('pong', () => {
        client.isAlive = true;
        client.lastActivity = Date.now();
    });

    ws.send(JSON.stringify({
        type: 'system',
        message: 'Connection established',
        clientId,
        status: 'awaiting_identification'
    }));

    ws.on('message', async (data: Buffer) => {
        try {
            client.lastActivity = Date.now();
            const message = data.toString();
            console.log(`[${clientId}] Received: ${message}`);
            const parsed = JSON.parse(message);

            if (parsed.type === 'client_type') {
                client.clientType = parsed.clientType;
                return;
            }

            if (parsed.type === 'identify') {
                const allowedIds = new Set(await getAllowedDeviceIds());
                if (parsed.deviceId && allowedIds.has(parsed.deviceId)) {
                    client.deviceId = parsed.deviceId;
                    client.isIdentified = true;

                    ws.send(JSON.stringify({
                        type: 'system',
                        message: 'Identification successful',
                        clientId,
                        deviceId: parsed.deviceId,
                        status: 'connected'
                    }));

                    // Notify browser clients about ESP connection
                    if (client.clientType === 'esp') {
                        clients.forEach(targetClient => {
                            if (targetClient.clientType === 'browser' &&
                                targetClient.deviceId === parsed.deviceId) {
                                targetClient.ws.send(JSON.stringify({
                                    type: 'esp_status',
                                    status: 'connected',
                                    deviceId: parsed.deviceId,
                                    timestamp: new Date().toISOString()
                                }));
                            }
                        });
                    }
                } else {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Invalid device ID',
                        clientId,
                        status: 'rejected'
                    }));
                    ws.close();
                }
                return;
            }

            if (!client.isIdentified) {
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Not identified',
                    clientId
                }));
                return;
            }

            // Process logs from ESP
            if (parsed.type === 'log' && client.clientType === 'esp') {
                clients.forEach(targetClient => {
                    if (targetClient.clientType === 'browser' &&
                        targetClient.deviceId === client.deviceId) {
                        targetClient.ws.send(JSON.stringify({
                            type: 'log',
                            message: parsed.message,
                            deviceId: client.deviceId,
                            timestamp: new Date().toISOString(),
                            origin: 'esp'
                        }));
                    }
                });
                return;
            }

            // Process command acknowledgements
            if (parsed.type === 'command_ack' && client.clientType === 'esp') {
                clients.forEach(targetClient => {
                    if (targetClient.clientType === 'browser' &&
                        targetClient.deviceId === client.deviceId) {
                        targetClient.ws.send(JSON.stringify({
                            type: 'command_ack',
                            command: parsed.command,
                            deviceId: client.deviceId,
                            timestamp: new Date().toISOString()
                        }));
                    }
                });
                return;
            }

            // Route commands to ESP
            if (parsed.command && parsed.deviceId) {
                let delivered = false;
                clients.forEach(targetClient => {
                    if (targetClient.deviceId === parsed.deviceId &&
                        targetClient.clientType === 'esp' &&
                        targetClient.isIdentified) {
                        targetClient.ws.send(message);
                        delivered = true;
                    }
                });

                ws.send(JSON.stringify({
                    type: delivered ? 'command_status' : 'error',
                    status: delivered ? 'delivered' : 'esp_not_found',
                    command: parsed.command,
                    deviceId: parsed.deviceId,
                    timestamp: new Date().toISOString()
                }));
            }

        } catch (err) {
            console.error(`[${clientId}] Message error:`, err);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid message format',
                error: (err as Error).message,
                clientId
            }));
        }
    });

    ws.on('close', () => {
        if (client.clientType === 'esp' && client.deviceId) {
            clients.forEach(targetClient => {
                if (targetClient.clientType === 'browser' &&
                    targetClient.deviceId === client.deviceId) {
                    targetClient.ws.send(JSON.stringify({
                        type: 'esp_status',
                        status: 'disconnected',
                        deviceId: client.deviceId,
                        timestamp: new Date().toISOString(),
                        reason: 'connection closed'
                    }));
                }
            });
        }
        clients.delete(clientId);
        console.log(`Client ${clientId} disconnected`);
    });

    ws.on('error', (err) => {
        console.error(`[${clientId}] WebSocket error:`, err);
    });
});

console.log(`WebSocket server running on ws://0.0.0.0:${PORT}`);


ESP8266
#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ArduinoWebsockets.h>
#include <ArduinoJson.h>

using namespace websockets;

const char* ssid = "Robolab124";
const char* password = "wifi123123123";
const char* websocket_server = "ws://192.168.0.151:8080";
const char* deviceId = "123";

WebsocketsClient client;
unsigned long lastReconnectAttempt = 0;
unsigned long lastHeartbeatTime = 0;
unsigned long lastLogTime = 0;
bool wasConnected = false;

void sendLogMessage(const char* message) {
DynamicJsonDocument doc(256);
doc["type"] = "log";
doc["message"] = message;
doc["deviceId"] = deviceId;
String output;
serializeJson(doc, output);
client.send(output);
}

void sendCommandAck(const char* command) {
DynamicJsonDocument doc(128);
doc["type"] = "command_ack";
doc["command"] = command;
doc["deviceId"] = deviceId;
String output;
serializeJson(doc, output);
client.send(output);
}

void onMessageCallback(WebsocketsMessage message) {
Serial.print("Received: ");
Serial.println(message.data());
sendLogMessage("Command received");

DynamicJsonDocument doc(256);
DeserializationError error = deserializeJson(doc, message.data());

if (!error) {
const char* command = doc["command"];
if (command) {
if (strcmp(command, "forward") == 0) {
Serial.println("Executing: FORWARD");
sendLogMessage("Executing FORWARD");
sendCommandAck("forward");
}
else if (strcmp(command, "backward") == 0) {
Serial.println("Executing: BACKWARD");
sendLogMessage("Executing BACKWARD");
sendCommandAck("backward");
}
else if (strcmp(command, "servo") == 0) {
int angle = doc["params"]["angle"];
Serial.printf("Setting servo angle to: %d\n", angle);
char logMsg[50];
snprintf(logMsg, sizeof(logMsg), "Servo set to %d", angle);
sendLogMessage(logMsg);
sendCommandAck("servo");
}
}
}
}

void onEventsCallback(WebsocketsEvent event, String data) {
if (event == WebsocketsEvent::ConnectionOpened) {
Serial.println("Connected to server!");
sendLogMessage("ESP connected to server");
wasConnected = true;

    // Send client type
    DynamicJsonDocument typeDoc(128);
    typeDoc["type"] = "client_type";
    typeDoc["clientType"] = "esp";
    String typeOutput;
    serializeJson(typeDoc, typeOutput);
    client.send(typeOutput);
    
    // Identify device
    DynamicJsonDocument doc(128);
    doc["type"] = "identify";
    doc["deviceId"] = deviceId;
    String output;
    serializeJson(doc, output);
    client.send(output);

    // Send connection status
    DynamicJsonDocument statusDoc(128);
    statusDoc["type"] = "esp_status";
    statusDoc["status"] = "connected";
    statusDoc["deviceId"] = deviceId;
    String statusOutput;
    serializeJson(statusDoc, statusOutput);
    client.send(statusOutput);
}
else if (event == WebsocketsEvent::ConnectionClosed) {
Serial.println("Connection closed");
if (wasConnected) {
wasConnected = false;
if (client.available()) {
DynamicJsonDocument statusDoc(128);
statusDoc["type"] = "esp_status";
statusDoc["status"] = "disconnected";
statusDoc["deviceId"] = deviceId;
statusDoc["reason"] = "connection closed";
String statusOutput;
serializeJson(statusDoc, statusOutput);
client.send(statusOutput);
}
}
}
else if (event == WebsocketsEvent::GotPing) {
client.pong();
}
}

void setup() {
Serial.begin(115200);

// Connect to WiFi
WiFi.begin(ssid, password);
while (WiFi.status() != WL_CONNECTED) {
delay(500);
Serial.print(".");
}
Serial.println("\nWiFi connected");
Serial.print("IP: ");
Serial.println(WiFi.localIP());

// Setup WebSocket
client.onMessage(onMessageCallback);
client.onEvent(onEventsCallback);

// Connect to server
if (client.connect(websocket_server)) {
Serial.println("WebSocket connected");
} else {
Serial.println("WebSocket connection failed!");
}
}

void loop() {
if (!client.available()) {
if (millis() - lastReconnectAttempt > 5000) {
lastReconnectAttempt = millis();
if (client.connect(websocket_server)) {
Serial.println("Reconnected to WebSocket");
sendLogMessage("ESP reconnected");
}
}
} else {
client.poll();

    // Send heartbeat every 10 seconds
    if (millis() - lastHeartbeatTime > 5000) {
      lastHeartbeatTime = millis();
      sendLogMessage("Heartbeat - system OK");
    }
    
    // Send system info every 30 seconds
    if (millis() - lastLogTime > 10000) {
      lastLogTime = millis();
      float voltage = analogRead(A0) * 3.3 / 1024.0;
      char sysMsg[50];
      snprintf(sysMsg, sizeof(sysMsg), "System: %.2fV, %ddBm", 
               voltage, WiFi.RSSI());
      sendLogMessage(sysMsg);
    }
}
}

логи от ESP826 идут
Event Log
14:49:17: ESP: Heartbeat - system OK
14:49:12: ESP: Heartbeat - system OK
14:49:11: ESP: System: 0.01V, -56dBm
14:49:07: ESP: Heartbeat - system OK
14:49:02: ESP: Heartbeat - system OK
14:49:01: ESP: System: 0.01V, -56dBm
14:48:57: ESP: Heartbeat - system OK
14:48:52: ESP: Heartbeat - system OK
14:48:51: ESP: System: 0.01V, -57dBm
14:48:47: ESP: Heartbeat - system OK
14:48:42: ESP: Heartbeat - system OK
14:48:41: ESP: System: 0.01V, -57dBm
14:48:37: ESP: Heartbeat - system OK
14:48:32: ESP: Heartbeat - system OK
14:48:31: ESP: System: 0.01V, -54dBm
14:48:27: ESP: Heartbeat - system OK
но ESP Status: Disconnected
Identified (ESP: ❌)
кнопками управлять не могу
отвечай на русском
