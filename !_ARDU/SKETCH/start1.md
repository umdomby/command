
реши проблему «Я отключаю клиент, а моторы продолжают крутиться».
Нужно добавить везде HBT_MOTOR
ESP ждёт HEARTBEAT каждые 300 мс при активном любом триггере от JoyAnalog, пользователь нажал на курок и клиент отвалился то моторы через 700 мс останавливаются без HEARTBEAT

ыот был пример
useEffect(() => {
if (!isConnected || !isIdentified || (motorASpeed <= 0 && motorBSpeed <= 0)) return;

        const interval = setInterval(() => {
            sendCommand("HBT");
        }, 300);

        return () => clearInterval(interval);
    }, [isConnected, isIdentified, motorASpeed, motorBSpeed, sendCommand]);


на ESP
Если прошло больше 700 мс с последнего HBT
И защита включена (т.е. клиент раньше присылал команды мотора или HBT)
→ ESP мгновенно останавливает моторы

вот был пример ESP
if (millis() - lastHeartbeat2Time > 700) {
if (enableHeartbeatMotorProtection) {
stopMotors();
Serial.print("HBT stopMotors()");
}
}
void stopMotors()
{
analogWrite(enA, 0);
analogWrite(enB, 0);
enableHeartbeatMotorProtection = false;
}
#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ArduinoWebsockets.h>
#include <ArduinoJson.h>
#include "ServoEasing.hpp"

unsigned long lastWiFiCheck = 0;
unsigned long disconnectStartTime = 0;
const unsigned long MAX_DISCONNECT_TIME = 1UL * 60UL * 60UL * 1000UL; // 1 час

const int analogPin = A0;

// Motor pins driver BTS7960
#define enA D1
#define in1 D2
#define in2 D3
#define in3 D4
#define in4 D5
#define enB D6

// Только одно реле — на D0 (GPIO16)
#define button2 D0  // GPIO16 - простое реле

// Servo pins
#define SERVO1_PIN D7
#define SERVO2_PIN D8

ServoEasing Servo1;
ServoEasing Servo2;

bool enableHeartbeatMotorProtection = true;

using namespace websockets;

const char *ssid = "Robolab124";
const char *password = "wifi123123123";
const char *websocket_server = "wss://a.ardu.live:444/wsar";

String alarm = "off";
boolean alarmMotion = false;

const char *de = "9999999999999999"; // deviceId

WebsocketsClient client;
unsigned long lastReconnectAttempt = 0;
unsigned long lastHeartbeatTime = 0;
unsigned long lastAnalogReadTime = 0;
unsigned long lastHeartbeat2Time = 0;
bool wasConnected = false;
bool isIdentified = false;

// Объявления функций
void sendLogMessage(const char *me);
void sendCommandAck(const char *co, int sp = -1);
void stopMotors();
void identifyDevice();
void ensureWiFiConnected();
void connectToServer();
void onMessageCallback(WebsocketsMessage message);
void onEventsCallback(WebsocketsEvent event, String data);

void sendLogMessage(const char *me)
{
if (client.available())
{
StaticJsonDocument<256> doc;
doc["ty"] = "log";
doc["me"] = me;
doc["de"] = de;
doc["b2"] = digitalRead(button2) == LOW ? "off" : "on";  // Только реле на D0
doc["sp1"] = Servo1.read();
doc["sp2"] = Servo2.read();
int raw = analogRead(analogPin);
float inputVoltage = raw * 0.021888;
char voltageStr[8];
dtostrf(inputVoltage, 5, 2, voltageStr);
doc["z"] = voltageStr;
doc["r"] = "Dionis-Moto";
doc["a"] = alarm;
doc["m"] = alarmMotion;
String output;
serializeJson(doc, output);
Serial.println("sendLogMessage: " + output);
client.send(output);
alarmMotion = false;
}
}

void sendCommandAck(const char *co, int sp)
{
if (client.available() && isIdentified)
{
StaticJsonDocument<256> doc;
doc["ty"] = "ack";
doc["co"] = co;
doc["de"] = de;
if (strcmp(co, "SPD") == 0 && sp != -1)
{
doc["sp"] = sp;
}
String output;
serializeJson(doc, output);
Serial.println("Sending ack: " + output);
client.send(output);
}
}

void stopMotors()
{
analogWrite(enA, 0);
analogWrite(enB, 0);
enableHeartbeatMotorProtection = false;
}

void identifyDevice()
{
if (client.available())
{
StaticJsonDocument<128> typeDoc;
typeDoc["ty"] = "clt";
typeDoc["ct"] = "esp";
String typeOutput;
serializeJson(typeDoc, typeOutput);
client.send(typeOutput);

        StaticJsonDocument<128> doc;
        doc["ty"] = "idn";
        doc["de"] = de;
        String output;
        serializeJson(doc, output);
        client.send(output);

        Serial.println("Identification sent");
    }
}

void ensureWiFiConnected() {
if (WiFi.status() != WL_CONNECTED) {
Serial.println("WiFi disconnected, reconnecting...");
WiFi.disconnect();
WiFi.begin(ssid, password);
int attempts = 0;
while (WiFi.status() != WL_CONNECTED && attempts < 20) {
delay(500);
Serial.print(".");
attempts++;
}
if (WiFi.status() == WL_CONNECTED) {
Serial.println("\nWiFi reconnected");
} else {
Serial.println("\nWiFi reconnection failed");
}
}
}

void connectToServer() {
Serial.println("Connecting to server...");
client.close();
client = WebsocketsClient();
client.onMessage(onMessageCallback);
client.onEvent(onEventsCallback);
client.addHeader("Origin", "http://ardua.site");
client.setInsecure();

    if (client.connect(websocket_server)) {
        Serial.println("WebSocket connected!");
        wasConnected = true;
        isIdentified = false;
        disconnectStartTime = 0;
        identifyDevice();
    } else {
        Serial.println("WebSocket connection failed!");
        wasConnected = false;
        isIdentified = false;
        if (disconnectStartTime == 0) {
            disconnectStartTime = millis();
        }
    }
}

void onMessageCallback(WebsocketsMessage message)
{
StaticJsonDocument<192> doc;
DeserializationError error = deserializeJson(doc, message.data());

    if (error)
    {
        Serial.print("JSON parse error: ");
        Serial.println(error.c_str());
        return;
    }
    lastHeartbeat2Time = millis();

    Serial.println("Received message: " + message.data());

    if (doc["ty"] == "sys" && doc["st"] == "con")
    {
        isIdentified = true;
        Serial.println("Successfully identified!");
        sendLogMessage("ESP connected and identified");

        char relayStatus[64];
        snprintf(relayStatus, sizeof(relayStatus), "Relay D0=%s",
                 digitalRead(button2) == LOW ? "off" : "on");
        sendLogMessage(relayStatus);

        Servo1.write(90);
        Servo2.write(90);
        sendLogMessage("Servos initialized to 90 degrees");
        return;
    }

    const char *co = doc["co"];
    if (!co) return;

    if (strcmp(co, "STP") == 0){
        stopMotors();
    }
    else if (strcmp(co, "SPD") == 0) {
        const char *mo = doc["pa"]["mo"];
        int speed = doc["pa"]["sp"];
        Serial.printf("SPD command received: motor=%s, speed=%d\n", mo, speed);
        if (strcmp(mo, "A") == 0) {
            analogWrite(enA, speed);
        } else if(strcmp(mo, "B") == 0) {
            analogWrite(enB, speed);
        }
        sendLogMessage("SPD");
    }
    else if (strcmp(co, "MFA") == 0) {
        digitalWrite(in1, HIGH);
        digitalWrite(in2, LOW);
    }
    else if (strcmp(co, "MRA") == 0) {
        digitalWrite(in1, LOW);
        digitalWrite(in2, HIGH);
    }
    else if (strcmp(co, "MFB") == 0) {
        digitalWrite(in3, HIGH);
        digitalWrite(in4, LOW);
    }
    else if (strcmp(co, "MRB") == 0) {
        digitalWrite(in3, LOW);
        digitalWrite(in4, HIGH);
    }
    else if (strcmp(co, "SAR") == 0)
    {
        int an = doc["pa"]["an"];
        int ak = doc["pa"]["ak"];
        an = constrain(an, 0, 180);
        ak = constrain(ak, 0, 180);
        Servo1.write(an);
        Servo2.write(ak);
    }
    else if (strcmp(co, "SSY") == 0)
    {
        int an = doc["pa"]["an"];
        an = constrain(an, 0, 180);
        Servo1.write(an);
    }
    else if (strcmp(co, "SSX") == 0)
    {
        int an = doc["pa"]["an"];
        an = constrain(an, 0, 180);
        Servo2.write(an);
    }
    else if (strcmp(co, "SSA") == 0)
    {
        int an = doc["pa"]["an"];
        int SSA = Servo1.read();
        if(an > 0){
            if(SSA + an < 180) Servo1.write(SSA + an);
        }else{
            if(SSA + an > 0) Servo1.write(SSA + an);
        }
    }
    else if (strcmp(co, "SSB") == 0)
    {
        int an = doc["pa"]["an"];
        int SSB = Servo2.read();
        if(an > 0){
            if(SSB + an < 180) Servo2.write(SSB + an);
        }else{
            if(SSB + an > 0) Servo2.write(SSB + an);
        }
    }
    else if (strcmp(co, "GET_RELAYS") == 0)
    {
        char relayStatus[64];
        snprintf(relayStatus, sizeof(relayStatus), "Relay D0=%s",
                 digitalRead(button2) == LOW ? "off" : "on");
        sendLogMessage(relayStatus);
        return;
    }
    else if (strcmp(co, "HBT") == 0)
    {
        lastHeartbeat2Time = millis();
        enableHeartbeatMotorProtection = true;
    }
    else if (strcmp(co, "RLY") == 0)
    {
        const char *pin = doc["pa"]["pin"];
        const char *state = doc["pa"]["state"];

        if (!pin || !state) {
            Serial.println("Ошибка: pin или state отсутствуют в JSON!");
            return;
        }

        // Теперь только D0
        if (strcmp(pin, "D0") == 0)
        {
            digitalWrite(button2, strcmp(state, "on") == 0 ? LOW : HIGH);
            Serial.println("Relay D0 set to: " + String(state));
        }

        StaticJsonDocument<256> ackDoc;
        ackDoc["ty"] = "ack";
        ackDoc["co"] = "RLY";
        ackDoc["de"] = de;
        JsonObject pa = ackDoc.createNestedObject("pa");
        pa["pin"] = pin;
        pa["state"] = state;
        String output;
        serializeJson(ackDoc, output);
        Serial.println("Отправка подтверждения RLY: " + output);
        client.send(output);
    }
    else if (strcmp(co, "ALARM") == 0)
    {
        const char *state = doc["pa"]["state"];
        if (!state) return;

        alarm = state;

        StaticJsonDocument<256> ackDoc;
        ackDoc["ty"] = "ack";
        ackDoc["co"] = "ALARM";
        ackDoc["de"] = de;
        JsonObject pa = ackDoc.createNestedObject("pa");
        pa["state"] = alarm;
        String output;
        serializeJson(ackDoc, output);
        client.send(output);
    }
}

void onEventsCallback(WebsocketsEvent event, String data) {
if (event == WebsocketsEvent::ConnectionOpened) {
Serial.println("Connection opened");
} else if (event == WebsocketsEvent::ConnectionClosed) {
Serial.println("Connection closed");
if (wasConnected) {
wasConnected = false;
isIdentified = false;
stopMotors();
}
if (disconnectStartTime == 0) {
disconnectStartTime = millis();
}
} else if (event == WebsocketsEvent::GotPing) {
client.pong();
}
}

void setup()
{
Serial.begin(115200);
delay(1000);
Serial.println("Starting ESP8266...");

    if (Servo1.attach(SERVO1_PIN, 90) == INVALID_SERVO)
    {
        Serial.println("Error attaching servo1");
        while (1) delay(100);
    }
    Servo1.write(90);

    if (Servo2.attach(SERVO2_PIN, 90) == INVALID_SERVO)
    {
        Serial.println("Error attaching servo2");
        while (1) delay(100);
    }
    Servo2.write(90);

    WiFi.begin(ssid, password);
    Serial.print("Connecting to WiFi");
    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nWiFi connected");

    connectToServer();

    pinMode(enA, OUTPUT);
    pinMode(enB, OUTPUT);
    pinMode(in1, OUTPUT);
    pinMode(in2, OUTPUT);
    pinMode(in3, OUTPUT);
    pinMode(in4, OUTPUT);
    pinMode(button2, OUTPUT);  // Только D0

    digitalWrite(button2, HIGH);
    digitalWrite(in1, HIGH);
    digitalWrite(in2, LOW);
    digitalWrite(in3, HIGH);
    digitalWrite(in4, LOW);
    stopMotors();
    Serial.println("Motors and relay initialized");
}

void loop() {
if (millis() - lastWiFiCheck > 30000) {
lastWiFiCheck = millis();
ensureWiFiConnected();
}

    if (!client.available()) {
        if (millis() - lastReconnectAttempt > 5000) {
            lastReconnectAttempt = millis();
            connectToServer();
        }

        if (disconnectStartTime > 0 && (millis() - disconnectStartTime > MAX_DISCONNECT_TIME)) {
            Serial.println("No connection for 1 hour, restarting...");
            ESP.restart();
        }
    } else {
        client.poll();

        if (isIdentified) {
            if (millis() - lastAnalogReadTime > 100) {
                lastAnalogReadTime = millis();
            }

            if (millis() - lastHeartbeatTime > 5000) {
                lastHeartbeatTime = millis();
                sendLogMessage("HBT");
            }

            if (millis() - lastHeartbeat2Time > 700) {
                if (enableHeartbeatMotorProtection) {
                    stopMotors();
                    Serial.print("HBT stopMotors()");
                }
            }
        } else if (millis() - lastReconnectAttempt > 3000) {
            lastReconnectAttempt = millis();
            identifyDevice();
        }
    }
}

внедри логику остановки моторов когда нет HBT_MOTOR

сделай логи в ESP - HBT_MOTOR в линию (не с новой строчки) при активном любом триггере , чтобы я видел что команда идет и когда она останавливается.



вот код сервера клиента и ESP

import { WebSocketServer, WebSocket } from 'ws'
import { IncomingMessage } from 'http'
import { getAllowedDeviceIds, getDeviceTelegramInfo } from './actions'
import { createServer } from 'http'
import axios from 'axios'

const PORT = 8096
const WS_PATH = '/wsar'

let TELEGRAM_BOT_TOKEN: string | null = null
let TELEGRAM_CHAT_ID: string | null = null
let lastTelegramMessageTime = 0
const TELEGRAM_MESSAGE_INTERVAL = 5000

function formatDateTime(date: Date): string {
const moscowOffset = 3 * 60 * 60 * 1000
const moscowDate = new Date(date.getTime() + moscowOffset)
const day = String(moscowDate.getUTCDate()).padStart(2, '0')
const month = String(moscowDate.getUTCMonth() + 1).padStart(2, '0')
const year = moscowDate.getUTCFullYear()
const hours = String(moscowDate.getUTCHours()).padStart(2, '0')
const minutes = String(moscowDate.getUTCMinutes()).padStart(2, '0')
return `${day}.${month}.${year} ${hours}:${minutes}`
}

const server = createServer()
const wss = new WebSocketServer({ server, path: WS_PATH })

interface ClientInfo {
ws: WebSocket
ip: string
isIdentified: boolean
ct?: 'browser' | 'esp'
lastActivity: number
isAlive: boolean
de?: string
}

const clients = new Map<number, ClientInfo>()

// Пинг-понг каждые 30 секунд
setInterval(() => {
clients.forEach((client, id) => {
if (!client.isAlive) {
client.ws.terminate()
clients.delete(id)
console.log(`Клиент ${id} отключен (ping timeout)`)
return
}
client.isAlive = false
client.ws.ping()
})
}, 30000)

wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
if (req.url !== WS_PATH) {
ws.close(1002, 'Invalid path')
return
}

    const clientId = Date.now()
    const ip = req.socket.remoteAddress || 'unknown'

    const client: ClientInfo = {
        ws,
        ip,
        isIdentified: false,
        lastActivity: Date.now(),
        isAlive: true
    }
    clients.set(clientId, client)

    console.log(`Новое подключение: ${clientId} (${ip})`)

    ws.on('pong', () => {
        client.isAlive = true
        client.lastActivity = Date.now()
    })

    ws.on('message', async (data, isBinary) => {
        if (!isBinary) {
            console.log(`[${clientId}] Игнорируем текстовое сообщение`);
            return;
        }

        client.lastActivity = Date.now();

        const buf = Buffer.from(data as ArrayBuffer);
        if (buf.length < 1) return;

        const cmd = buf[0];

        try {
            switch (cmd) {
                case 0x02: // CLIENT_TYPE
                    if (buf.length >= 2) {
                        client.ct = buf[1] === 1 ? 'browser' : 'esp';
                        console.log(`[${clientId}] Тип: ${client.ct}`);
                    }
                    break;

                case 0x01: // IDENTIFY
                    if (buf.length === 17) {
                        const de = buf.subarray(1).toString('utf8').trim();
                        const allowed = new Set(await getAllowedDeviceIds());

                        if (allowed.has(de)) {
                            client.de = de;
                            client.isIdentified = true;

                            const telegramInfo = await getDeviceTelegramInfo(de);
                            TELEGRAM_BOT_TOKEN = telegramInfo?.telegramToken ?? null;
                            TELEGRAM_CHAT_ID = telegramInfo?.telegramId?.toString() ?? null;

                            console.log(`[${clientId}] Успешная идентификация: ${de}`);

                            // Если это ESP → уведомляем всех существующих браузеров
                            if (client.ct === 'esp') {
                                clients.forEach(c => {
                                    if (c.ct === 'browser' && c.de === de && c.isIdentified) {
                                        c.ws.send(new Uint8Array([0x60, 1])); // connected
                                        console.log(`[${clientId}] Уведомил браузер ${c.de} → ESP connected`);
                                    }
                                });
                            }

                            // Если это браузер → проверяем, есть ли уже ESP, и сразу уведомляем
                            else if (client.ct === 'browser') {
                                let espIsOnline = false;
                                clients.forEach(c => {
                                    if (c.ct === 'esp' && c.de === de && c.isIdentified) {
                                        espIsOnline = true;
                                    }
                                });

                                // Отправляем статус новому браузеру
                                client.ws.send(new Uint8Array([0x60, espIsOnline ? 1 : 0]));
                                console.log(`[${clientId}] Новый браузер → статус ESP: ${espIsOnline ? 'connected' : 'disconnected'}`);
                            }
                        } else {
                            ws.close(1008, 'Device not allowed');
                        }
                    }
                    break;

                default:
                    if (client.de && client.isIdentified) {
                        const isFromBrowser = client.ct === 'browser';
                        const targetType = isFromBrowser ? 'esp' : 'browser';

                        let forwarded = false;
                        clients.forEach(c => {
                            if (c.de === client.de && c.ct === targetType && c.isIdentified) {
                                c.ws.send(buf);
                                forwarded = true;

                                // ПОДРОБНЫЙ ЛОГ
                                const cmdName = {
                                    0x10: 'HEARTBEAT',
                                    0x20: 'MOTOR',
                                    0x30: 'SERVO_ABS',
                                    0x40: 'RELAY',
                                    0x41: 'ALARM',
                                    0x50: 'FULL_STATUS',
                                    0x51: 'ACK',
                                    0x60: 'ESP_STATUS',
                                }[cmd] || `UNKNOWN(0x${cmd.toString(16)})`;

                                console.log(`[${clientId}] ${isFromBrowser ? 'Браузер → ESP' : 'ESP → Браузер'} | ${cmdName} | de=${client.de} | len=${buf.length}`);
                            }
                        });

                        if (!forwarded) {
                            console.log(`[${clientId}] НЕ НАЙДЕН ${targetType} для de=${client.de} (cmd 0x${cmd.toString(16)})`);
                        }
                    } else {
                        console.log(`[${clientId}] Команда отклонена: не идентифицирован или нет de`);
                    }
            }
        } catch (err) {
            console.error(`[${clientId}] Ошибка:`, err);
        }
    });

    ws.on('close', () => {
        console.log(`Клиент ${clientId} отключился`)
        if (client.ct === 'esp' && client.de) {
            clients.forEach(c => {
                if (c.ct === 'browser' && c.de === client.de) {
                    c.ws.send(new Uint8Array([0x60, 0])) // 0x60 = esp disconnected
                }
            })
        }
        clients.delete(clientId)
    })

    ws.on('error', err => {
        console.error(`[${clientId}] WS ошибка:`, err)
    })
})

server.listen(PORT, () => {
console.log(`Binary WebSocket сервер запущен на ws://0.0.0.0:${PORT}${WS_PATH}`)
})

"use client"
import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown, ChevronUp } from "lucide-react"
import Joystick from '@/components/control/Joystick'
import JoystickUp from '@/components/control/JoystickUp'
import JoyAnalog from '@/components/control/JoyAnalog'
import Keyboard from '@/components/control/Keyboard'
import ButtonControl from "@/components/control/ButtonControl"
import VirtualBox from "@/components/control/VirtualBox"

type LogEntry = { me: string; ty: 'client' | 'esp' | 'server' | 'error' | 'success' | 'info' }

// Бинарные константы — должны совпадать с ESP
const CMD_CLIENT_TYPE   = 0x02
const CMD_IDENTIFY      = 0x01
const CMD_HEARTBEAT     = 0x10
const CMD_MOTOR         = 0x20
const CMD_SERVO_ABS     = 0x30
const CMD_RELAY         = 0x40
const CMD_ALARM         = 0x41

const RSP_FULL_STATUS   = 0x50
const RSP_ACK           = 0x51

export default function SocketClient() {
const [log, setLog] = useState<LogEntry[]>([])
const [isConnected, setIsConnected] = useState(false)
const [isIdentified, setIsIdentified] = useState(false)
const [espConnected, setEspConnected] = useState(false)

    const [deviceId, setDeviceId] = useState<string>(() =>
        typeof window !== 'undefined' ? localStorage.getItem('currentDeviceId') || '' : ''
    )
    const [inputDeviceId, setInputDeviceId] = useState(deviceId)
    const [logVisible, setLogVisible] = useState(false)

    const [servo1Angle, setServo1Angle] = useState(90)
    const [servo2Angle, setServo2Angle] = useState(90)
    const [inputVoltage, setInputVoltage] = useState<number | null>(null)
    const [alarmState, setAlarmState] = useState(false)
    const [relayD0State, setRelayD0State] = useState<boolean | null>(null)

    const [showServos, setShowServos] = useState<boolean>(() => {
        const saved = localStorage.getItem('showServos')
        return saved !== null ? JSON.parse(saved) : false
    })

    const [selectedJoystick, setSelectedJoystick] = useState<'Joystick' | 'JoystickUp' | 'JoyAnalog' | 'Keyboard' | 'ButtonControl'>(
        (typeof window !== 'undefined' && localStorage.getItem('selectedJoystick') as any) || 'ButtonControl'
    )

    const [isVirtualBoxActive, setIsVirtualBoxActive] = useState<boolean>(() => {
        const saved = localStorage.getItem('isVirtualBoxActive')
        return saved !== null ? JSON.parse(saved) : false
    })

    const socketRef = useRef<WebSocket | null>(null)

    // Троттлинг и кэш команд моторов
    const motorAThrottleRef = useRef<NodeJS.Timeout | null>(null)
    const motorBThrottleRef = useRef<NodeJS.Timeout | null>(null)
    const lastMotorACommandRef = useRef<{ speed: number; dir: 0|1|2 } | null>(null)
    const lastMotorBCommandRef = useRef<{ speed: number; dir: 0|1|2 } | null>(null)

    const [motorASpeed, setMotorASpeed] = useState(0)
    const [motorBSpeed, setMotorBSpeed] = useState(0)
    const [motorADirection, setMotorADirection] = useState<0|1|2>(0) // 0=stop, 1=forward, 2=backward
    const [motorBDirection, setMotorBDirection] = useState<0|1|2>(0)

    const addLog = useCallback((msg: string, ty: LogEntry['ty'] = 'info') => {
        setLog(prev => [...prev.slice(-100), { me: `${new Date().toLocaleTimeString()}: ${msg}`, ty }])
    }, [])

    // localStorage
    useEffect(() => { localStorage.setItem('currentDeviceId', deviceId) }, [deviceId])
    useEffect(() => { localStorage.setItem('showServos', JSON.stringify(showServos)) }, [showServos])
    useEffect(() => { localStorage.setItem('selectedJoystick', selectedJoystick) }, [selectedJoystick])
    useEffect(() => { localStorage.setItem('isVirtualBoxActive', JSON.stringify(isVirtualBoxActive)) }, [isVirtualBoxActive])

    const cleanupWebSocket = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.close()
            socketRef.current = null
        }
    }, [])

    const connectWebSocket = useCallback(() => {
        if (!deviceId || deviceId.length !== 16) {
            addLog('deviceId должен быть 16 символов', 'error')
            return
        }

        cleanupWebSocket()
        const url = process.env.NEXT_PUBLIC_WEB_SOCKET_URL || 'wss://a.ardu.live/wsar'
        const ws = new WebSocket(url)

        ws.binaryType = 'arraybuffer'

        ws.onopen = () => {
            setIsConnected(true)
            addLog('Подключено к серверу', 'success')

            // 1. Тип клиента
            ws.send(new Uint8Array([CMD_CLIENT_TYPE, 1]))

            // 2. Идентификация
            const idBuf = new Uint8Array(17)
            idBuf[0] = CMD_IDENTIFY
            const encoder = new TextEncoder()
            const idBytes = encoder.encode(deviceId.padEnd(16, ' '))
            idBuf.set(idBytes, 1)
            ws.send(idBuf)

            // *** КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ ***
            setIsIdentified(true)  // ← Добавь эту строку!
        }

        ws.onmessage = (event) => {
            if (!(event.data instanceof ArrayBuffer)) return

            const data = new Uint8Array(event.data)
            if (data.length === 0) return

            const type = data[0]



            if (type === RSP_FULL_STATUS && data.length >= 9) {
                // FULL_STATUS от ESP
                const relayOn = data[1] === 1
                const s1 = data[2]
                const s2 = data[3]
                const voltRaw = (data[4] << 8) | data[5]
                const voltage = voltRaw * 0.021888  // ваш коэффициент из ESP

                setRelayD0State(relayOn)
                setServo1Angle(s1)
                setServo2Angle(s2)
                setInputVoltage(voltage)

                if (!espConnected) {
                    setEspConnected(true)
                    addLog('ESP подключён (бинарный статус)', 'success')
                }
            }
            else if (type === 0x60) {  // esp status от сервера
                const status = data[1];
                if (status === 1) {
                    setEspConnected(true);
                    addLog('ESP подключён (уведомление от сервера)', 'success');
                } else {
                    setEspConnected(false);
                    addLog('ESP отключился', 'error');
                }
            }
            else if (type === RSP_ACK) {
                // Можно добавить обработку подтверждений если нужно
                // addLog(`Получено подтверждение команды 0x${data[1].toString(16)}`, 'success')
            }
        }

        ws.onclose = () => {
            setIsConnected(false)
            setIsIdentified(false)
            setEspConnected(false)
            addLog('Соединение закрыто', 'error')
        }

        ws.onerror = () => {
            addLog('Ошибка WebSocket-соединения', 'error')
        }

        socketRef.current = ws
    }, [deviceId, cleanupWebSocket, addLog, espConnected])

    // Отправка бинарных данных
    const sendBinary = useCallback((data: Uint8Array) => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;  // ← Убрали !isIdentified
        socketRef.current.send(data)
    }, [])

    const sendHeartbeat = useCallback(() => {
        sendBinary(new Uint8Array([CMD_HEARTBEAT]))
    }, [sendBinary])

    const sendMotor = useCallback((motor: 'A'|'B', speed: number, dir: 0|1|2) => {
        const buf = new Uint8Array(5)
        buf[0] = CMD_MOTOR
        buf[1] = motor === 'A' ? 65 : 66           // 'A'=65, 'B'=66
        buf[2] = Math.min(255, Math.max(0, speed))
        buf[3] = dir

        // Проверка дубликата
        const ref = motor === 'A' ? lastMotorACommandRef : lastMotorBCommandRef
        if (ref.current?.speed === buf[2] && ref.current?.dir === dir) return
        ref.current = { speed: buf[2], dir }

        sendBinary(buf)
    }, [sendBinary])

    // Управление моторами с троттлингом и мгновенной остановкой
// Внутри компонента, заменить handleMotorControl на эту версию:
const handleMotorControl = useCallback((motor: 'A'|'B', value: number) => {
const abs = Math.abs(value)
const dir: 0|1|2 = value > 0 ? 1 : value < 0 ? 2 : 0
const speed = Math.round(abs)

        if (motor === 'A') {
            setMotorASpeed(speed)
            setMotorADirection(dir)
        } else {
            setMotorBSpeed(speed)
            setMotorBDirection(dir)
        }

        // МГНОВЕННАЯ ОТПРАВКА для JoyAnalog (курки и стики)
        // Определяем, от какого источника пришла команда
        const isFromGamepad = Math.abs(value) > 0 && (value !== Math.floor(value) || Math.abs(value) > 100)
        // Если это от геймпада — отправляем сразу, без троттлинга
        if (isFromGamepad || speed === 0) {
            addLog(`Мотор ${motor}: speed=${speed}, dir=${dir} (мгновенно от JoyAnalog)`, 'info')
            sendMotor(motor, speed, dir)
            return
        }

        // Для остальных джойстиков — оставляем троттлинг 40 мс
        const throttleRef = motor === 'A' ? motorAThrottleRef : motorBThrottleRef
        const lastRef = motor === 'A' ? lastMotorACommandRef : lastMotorBCommandRef

        if (JSON.stringify(lastRef.current) === JSON.stringify({ speed, dir })) return
        lastRef.current = { speed, dir }

        if (throttleRef.current) clearTimeout(throttleRef.current)

        throttleRef.current = setTimeout(() => {
            addLog(`Мотор ${motor}: speed=${speed}, dir=${dir} (троттлинг)`, 'info')
            sendMotor(motor, speed, dir)
        }, 40)
    }, [sendMotor, addLog])

    const handleDualAxisControl = useCallback(({ x, y }: { x: number; y: number }) => {
        handleMotorControl('A', Math.round(x))
        handleMotorControl('B', Math.round(y))
    }, [handleMotorControl])

    // Абсолютное положение серво (замена SSY/SSX)
    const adjustServo = useCallback((servoId: '1'|'2', value: number, isAbsolute: boolean) => {
        const current = servoId === '1' ? servo1Angle : servo2Angle
        const angle = isAbsolute ? value : current + value
        const clamped = Math.max(0, Math.min(180, Math.round(angle)))

        const buf = new Uint8Array(4)
        buf[0] = CMD_SERVO_ABS
        buf[1] = servoId === '1' ? 1 : 2
        buf[2] = clamped

        sendBinary(buf)

        if (servoId === '1') setServo1Angle(clamped)
        else setServo2Angle(clamped)
    }, [servo1Angle, servo2Angle, sendBinary])

    // Переключение реле D0
    const toggleRelay = useCallback(() => {
        const desiredState = relayD0State === null ? 1 : (relayD0State ? 0 : 1);

        const buf = new Uint8Array([CMD_RELAY, desiredState, 0]);
        sendBinary(buf);

        addLog(`Реле D0 → ${desiredState ? 'ВКЛ' : 'ВЫКЛ'} (отправлена команда 0x40)`, 'info');

        // Оптимистическое обновление интерфейса
        setRelayD0State(desiredState === 1);
    }, [relayD0State, sendBinary, addLog]);

    // Переключение тревоги
    const toggleAlarm = useCallback(() => {
        const newState = !alarmState

        const buf = new Uint8Array([CMD_ALARM, newState ? 1 : 0])
        sendBinary(buf)

        setAlarmState(newState)
    }, [alarmState, sendBinary])

    // Heartbeat каждые 300 мс при активных моторах
    useEffect(() => {
        if (!isConnected || !isIdentified || (motorASpeed <= 0 && motorBSpeed <= 0)) return

        const interval = setInterval(sendHeartbeat, 300)
        return () => clearInterval(interval)
    }, [isConnected, isIdentified, motorASpeed, motorBSpeed, sendHeartbeat])

    const disabled = !isConnected || !isIdentified

    return (
        <div className="flex flex-col items-center min-h-screen bg-black relative">
            {/* Панель подключения */}
            <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-black/80 rounded-lg p-4 z-50 w-full max-w-md">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`w-4 h-4 rounded-full ${isConnected && isIdentified && espConnected ? 'bg-green-500' : isConnected ? 'bg-yellow-500' : 'bg-red-500'}`} />
                    <span className="text-white">
                        {isConnected && isIdentified && espConnected ? 'Подключено' : isConnected ? 'Ожидание ESP' : 'Отключено'}
                    </span>
                </div>
                <div className="flex gap-2">
                    <Input
                        value={inputDeviceId}
                        onChange={(e) => setInputDeviceId(e.target.value.toUpperCase().replace(/[^0-9A-F]/g, ''))}
                        placeholder="deviceId (16 символов)"
                        maxLength={16}
                    />
                    <Button onClick={() => {
                        if (inputDeviceId.length === 16) {
                            setDeviceId(inputDeviceId)
                            connectWebSocket()
                        }
                    }} disabled={inputDeviceId.length !== 16}>
                        Подключить
                    </Button>
                    <Button onClick={cleanupWebSocket} variant="destructive" disabled={!isConnected}>
                        Отключить
                    </Button>
                </div>
                <Button onClick={() => setLogVisible(!logVisible)} className="mt-2 w-full">
                    {logVisible ? <ChevronUp /> : <ChevronDown />} Логи
                </Button>
                {logVisible && (
                    <div className="mt-2 max-h-48 overflow-y-auto bg-black/50 rounded p-2 text-xs">
                        {log.slice().reverse().map((e, i) => (
                            <div key={i} className="text-gray-400">{e.me}</div>
                        ))}
                    </div>
                )}
            </div>

            {/* Управление */}
            <div className="mt-32 relative w-full h-screen">
                {(selectedJoystick === 'Joystick' || selectedJoystick === 'JoystickUp') && (
                    <>
                        {selectedJoystick === 'Joystick' ? (
                            <Joystick
                                mo="A"
                                onChange={(v) => handleMotorControl('A', v)}
                                disabled={disabled}
                                direction={motorADirection === 1 ? 'forward' : motorADirection === 2 ? 'backward' : 'stop'}
                                sp={motorASpeed}
                            />
                        ) : (
                            <JoystickUp
                                mo="A"
                                onChange={(v) => handleMotorControl('A', v)}
                                disabled={disabled}
                                direction={motorADirection === 1 ? 'forward' : motorADirection === 2 ? 'backward' : 'stop'}
                                sp={motorASpeed}
                            />
                        )}
                        {selectedJoystick === 'Joystick' ? (
                            <Joystick
                                mo="B"
                                onChange={(v) => handleMotorControl('B', v)}
                                disabled={disabled}
                                direction={motorBDirection === 1 ? 'forward' : motorBDirection === 2 ? 'backward' : 'stop'}
                                sp={motorBSpeed}
                            />
                        ) : (
                            <JoystickUp
                                mo="B"
                                onChange={(v) => handleMotorControl('B', v)}
                                disabled={disabled}
                                direction={motorBDirection === 1 ? 'forward' : motorBDirection === 2 ? 'backward' : 'stop'}
                                sp={motorBSpeed}
                            />
                        )}
                    </>
                )}

                {selectedJoystick === 'JoyAnalog' && (
                    <JoyAnalog
                        onChange={handleDualAxisControl}
                        onServoChange={adjustServo}
                        onServoChangeCheck={adjustServo}
                        onRelayChange={(pin, state) => {
                            if (pin === "D0" && state === "toggle") toggleRelay()
                        }}
                        disabled={disabled}
                    />
                )}

                {selectedJoystick === 'Keyboard' && (
                    <Keyboard
                        onChange={handleDualAxisControl}
                        onServoChange={adjustServo}
                        onServoChangeCheck={adjustServo}
                        onRelayChange={(pin, state) => {
                            if (pin === "D0" && state === "toggle") toggleRelay()
                        }}
                        disabled={disabled}
                    />
                )}

                {selectedJoystick === 'ButtonControl' && (
                    <ButtonControl
                        onChange={handleDualAxisControl}
                        onServoChange={adjustServo}
                        onServoChangeCheck={adjustServo}
                        onRelayChange={(pin, state) => {
                            if (pin === "D0" && state === "toggle") toggleRelay()
                        }}
                        disabled={disabled}
                    />
                )}

                {isVirtualBoxActive && (
                    <VirtualBox
                        onServoChange={adjustServo}
                        isVirtualBoxActive={true}
                        hasOrientationPermission={true}
                        hasMotionPermission={true}
                        isOrientationSupported={true}
                        isMotionSupported={true}
                        disabled={disabled}
                    />
                )}
            </div>

            {/* Нижняя панель */}
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-50">
                {showServos && (
                    <div className="bg-black/70 px-4 py-2 rounded text-green-400">
                        V: {servo1Angle}° | H: {servo2Angle}°
                    </div>
                )}
                <div className="flex gap-4 items-center">
                    {inputVoltage !== null && (
                        <span className="text-3xl font-bold text-green-500 bg-black/70 px-6 py-3 rounded-full">
                            {inputVoltage.toFixed(2)}V
                        </span>
                    )}
                    <Button onClick={toggleAlarm}>
                        <img src={alarmState ? "/alarm/alarm-on.svg" : "/alarm/alarm-off.svg"} className="w-10 h-10" alt="Alarm" />
                    </Button>
                    {relayD0State !== null && (
                        <Button onClick={toggleRelay}>
                            <img src={relayD0State ? "/off.svg" : "/on.svg"} className="w-10 h-10" alt="Relay" />
                        </Button>
                    )}
                    <Button onClick={() => setShowServos(!showServos)}>
                        <img src={showServos ? "/turn2.svg" : "/turn1.svg"} className="w-10 h-10" alt="Servos" />
                    </Button>
                    <Button onClick={() => {
                        const options: typeof selectedJoystick[] = ['ButtonControl', 'Joystick', 'JoystickUp', 'JoyAnalog', 'Keyboard']
                        const i = options.indexOf(selectedJoystick)
                        setSelectedJoystick(options[(i + 1) % options.length])
                    }}>
                        <img
                            src={
                                selectedJoystick === 'Joystick' ? '/control/arrows-down.svg' :
                                    selectedJoystick === 'JoystickUp' ? '/control/arrows-up.svg' :
                                        selectedJoystick === 'JoyAnalog' ? '/control/xbox-controller.svg' :
                                            selectedJoystick === 'Keyboard' ? '/control/keyboard.svg' :
                                                '/control/button-control.svg'
                            }
                            className="w-12 h-12"
                            alt="Switch control"
                        />
                    </Button>
                    <Button
                        onClick={() => setIsVirtualBoxActive(!isVirtualBoxActive)}
                        className={isVirtualBoxActive ? 'border-4 border-green-500' : ''}
                    >
                        <img src="/control/axis-arrow.svg" className="w-12 h-12" alt="VirtualBox" />
                    </Button>
                </div>
            </div>
        </div>
    )
}



#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ArduinoWebsockets.h>
#include <ServoEasing.hpp>

using namespace websockets;

// Пины
#define PIN_ENA     D1
#define PIN_IN1     D2
#define PIN_IN2     D3
#define PIN_IN3     D4
#define PIN_IN4     D5
#define PIN_ENB     D6
#define PIN_RELAY   D0      // active LOW
#define PIN_SERVO1  D7
#define PIN_SERVO2  D8
#define PIN_VOLTAGE A0

// Настройки
const char* ssid       = "Robolab124";
const char* password   = "wifi123123123";
const char* ws_url     = "wss://a.ardu.live:444/wsar";
const char* DEVICE_ID  = "9999999999999999";  // 16 символов

ServoEasing Servo1, Servo2;
WebsocketsClient client;

bool identified = false;
unsigned long lastHbTx = 0;
unsigned long lastHbRx = 0;
unsigned long lastStatusTx = 0;

// Типы сообщений
#define CMD_IDENTIFY       0x01
#define CMD_CLIENT_TYPE    0x02
#define CMD_HEARTBEAT      0x10
#define CMD_MOTOR          0x20
#define CMD_SERVO_ABS      0x30
#define CMD_RELAY          0x40
#define CMD_ALARM          0x41

#define RSP_FULL_STATUS    0x50
#define RSP_ACK            0x51

// ────────────────────────────────────────────────────────────────
void sendBinary(const uint8_t* data, size_t len) {
if (client.available()) {
client.sendBinary((const char*)data, len);  // Явное приведение
}
}

void sendHeartbeat() {
uint8_t buf[1] = {CMD_HEARTBEAT};
sendBinary(buf, 1);
}

void sendFullStatus() {
uint8_t buf[9] = {0};
buf[0] = RSP_FULL_STATUS;
buf[1] = (digitalRead(PIN_RELAY) == LOW) ? 1 : 0;   // relay
buf[2] = Servo1.read();                             // servo1
buf[3] = Servo2.read();                             // servo2

    int raw = analogRead(PIN_VOLTAGE);
    buf[4] = highByte(raw);
    buf[5] = lowByte(raw);

    buf[6] = 0;  // alarm
    buf[7] = 0;  // motion
    buf[8] = (uint8_t)constrain(WiFi.RSSI(), -128, 127);  // rssi

    sendBinary(buf, sizeof(buf));
}

void sendAck(uint8_t cmd, uint8_t value = 0) {
uint8_t buf[3] = {RSP_ACK, cmd, value};
sendBinary(buf, 3);
}

// ────────────────────────────────────────────────────────────────
void onMessageCallback(WebsocketsMessage message) {
if (!message.isBinary()) {
Serial.println("Получено НЕ бинарное сообщение — игнорируем");
return;
}

    const uint8_t* data = reinterpret_cast<const uint8_t*>(message.c_str());
    size_t len = message.length();

    if (len == 0) {
        Serial.println("Получено пустое сообщение");
        return;
    }

    Serial.printf("Получено бинарное: cmd=0x%02X, len=%d  ", data[0], len);

    switch (data[0]) {
        case CMD_HEARTBEAT:
            Serial.println("→ HEARTBEAT (обновляю таймер)");
            lastHbRx = millis();
            break;

        case CMD_MOTOR:
            if (len < 5) {
                Serial.println("→ CMD_MOTOR: слишком короткое");
                return;
            }
            {
                char motor = data[1];
                uint8_t speed = data[2];
                uint8_t dir = data[3];

                Serial.printf("→ MOTOR %c: speed=%d, dir=%d\n", motor, speed, dir);

                uint8_t pwmPin = (motor == 'A') ? PIN_ENA : PIN_ENB;
                analogWrite(pwmPin, speed);

                if (dir == 1) {         // forward
                    if (motor == 'A') { 
                        digitalWrite(PIN_IN1, HIGH); 
                        digitalWrite(PIN_IN2, LOW); 
                    } else { 
                        digitalWrite(PIN_IN3, HIGH); 
                        digitalWrite(PIN_IN4, LOW); 
                    }
                } else if (dir == 2) {  // backward
                    if (motor == 'A') { 
                        digitalWrite(PIN_IN1, LOW);  
                        digitalWrite(PIN_IN2, HIGH);
                    } else { 
                        digitalWrite(PIN_IN3, LOW);  
                        digitalWrite(PIN_IN4, HIGH);
                    }
                }
                sendAck(CMD_MOTOR, speed);
            }
            break;

        case CMD_SERVO_ABS:
            if (len < 4) {
                Serial.println("→ CMD_SERVO_ABS: слишком короткое");
                return;
            }
            {
                uint8_t num = data[1];
                uint8_t angle = constrain(data[2], 0, 180);
                Serial.printf("→ SERVO %d → angle=%d\n", num, angle);

                if (num == 1) Servo1.write(angle);
                else if (num == 2) Servo2.write(angle);

                sendAck(CMD_SERVO_ABS, angle);
            }
            break;

        case CMD_RELAY:
            if (len < 3) {
                Serial.println("→ CMD_RELAY: слишком короткое");
                return;
            }
            {
                uint8_t state = data[1];
                Serial.printf("→ RELAY state=%d\n", state);
                digitalWrite(PIN_RELAY, state ? LOW : HIGH);
                sendAck(CMD_RELAY, state);
            }
            break;

        case CMD_ALARM:
            if (len < 2) {
                Serial.println("→ CMD_ALARM: слишком короткое");
                return;
            }
            Serial.printf("→ ALARM state=%d\n", data[1]);
            sendAck(CMD_ALARM, data[1]);
            break;

        default:
            Serial.printf("→ НЕИЗВЕСТНАЯ КОМАНДА 0x%02X\n", data[0]);
    }
}

void onEventsCallback(WebsocketsEvent event, String data) {
switch (event) {
case WebsocketsEvent::ConnectionOpened:
Serial.println("[WS] Connected");
identified = false;

            // Тип клиента
            {
                uint8_t buf[2] = {CMD_CLIENT_TYPE, 2}; // 2 = esp
                sendBinary(buf, 2);
            }

            // Идентификация
            {
                uint8_t buf[17];
                buf[0] = CMD_IDENTIFY;
                memcpy(buf + 1, DEVICE_ID, 16);
                sendBinary(buf, 17);
            }
            break;

        case WebsocketsEvent::ConnectionClosed:
            Serial.println("[WS] Disconnected");
            identified = false;
            analogWrite(PIN_ENA, 0);
            analogWrite(PIN_ENB, 0);
            break;
    }
}

// ────────────────────────────────────────────────────────────────
void setup() {
Serial.begin(115200);
delay(200);
Serial.println("\n=== Binary Protocol 2026 ===\n");

    Servo1.attach(PIN_SERVO1, 90);
    Servo2.attach(PIN_SERVO2, 90);
    Servo1.write(90);
    Servo2.write(90);

    pinMode(PIN_ENA,  OUTPUT);
    pinMode(PIN_ENB,  OUTPUT);
    pinMode(PIN_IN1,  OUTPUT);
    pinMode(PIN_IN2,  OUTPUT);
    pinMode(PIN_IN3,  OUTPUT);
    pinMode(PIN_IN4,  OUTPUT);
    pinMode(PIN_RELAY, OUTPUT);
    digitalWrite(PIN_RELAY, HIGH); // выключено

    analogWrite(PIN_ENA, 0);
    analogWrite(PIN_ENB, 0);

    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password);

    Serial.print("WiFi ");
    while (WiFi.status() != WL_CONNECTED) {
        delay(400);
        Serial.print(".");
    }
    Serial.printf("\nIP: %s\n", WiFi.localIP().toString().c_str());

    client.onMessage(onMessageCallback);
    client.onEvent(onEventsCallback);
    client.setInsecure();
}

void loop() {
if (WiFi.status() != WL_CONNECTED) {
Serial.println("WiFi lost → reconnect");
WiFi.reconnect();
delay(2000);
return;
}

    if (!client.available()) {
        Serial.print("WS reconnect... ");
        if (client.connect(ws_url)) {
            Serial.println("OK");
        } else {
            Serial.println("fail");
        }
        delay(3000);
        return;
    }

    client.poll();

    unsigned long now = millis();

    // Heartbeat каждые ~2.5 сек
    if (now - lastHbTx >= 2500) {
        lastHbTx = now;
        sendHeartbeat();
    }

    // Статус каждые ~800 мс
    if (identified && now - lastStatusTx >= 800) {
        lastStatusTx = now;
        sendFullStatus();
    }

    // Защита моторов по таймауту heartbeat
    if (identified && now - lastHbRx > 5000UL) {
        static bool warned = false;
        if (!warned) {
            Serial.println("HEARTBEAT TIMEOUT → STOP MOTORS");
            warned = true;
        }
        analogWrite(PIN_ENA, 0);
        analogWrite(PIN_ENB, 0);
    } else {
        static bool warned = false;
        if (warned) warned = false;
    }
}
так же когда клиент отключается кнопкой отключить моторы должны останавливаться

в коде есть #define CMD_HEARTBEAT      0x10 - это отправка от ESP к серверу чтобы соединение не затерлось

сделай другое имя например HBT_MOTOR



