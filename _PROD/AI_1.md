arduino ESP8266
// Полное → Сокращенное
// type → ty
// status → st
// command → co
// angle → an
// speed → sp
// motor → mo
// message → me
// deviceId → de
// params → pa
// timestamp → ts
// origin → or
// reason → re
// clientType → ct

// Команды:
// motor_a_forward → MFA
// motor_a_backward → MRA
// motor_b_forward → MFB
// motor_b_backward → MRB
// set_speed → SPD
// set_servo → SSR
// stop → STP
// heartbeat2 → HBT

// Типы сообщений:
// system → sys
// error → err
// log → log
// acknowledge → ack
// client_type → clt
// identify → idn
// esp_status → est
// command_status → cst

// Статусы:
// connected → con
// disconnected → dis
// awaiting_identification → awi
// rejected → rej
// delivered → dvd
// esp_not_found → enf

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ArduinoWebsockets.h>
#include <ArduinoJson.h>
#include "ServoEasing.hpp"

// Motor pins
#define enA D1
#define in1 D2
#define in2 D3
#define in3 D4
#define in4 D5
#define enB D6

// relay pins
#define button1 D0 // Добавить здесь
#define button2 3  // Реле 2 на пине RX (GPIO3)

// servo pins
#define SERVO1_PIN D7
#define SERVO2_PIN D8
ServoEasing Servo1;

using namespace websockets;

const char *ssid = "Robolab124";
const char *password = "wifi123123123";
const char *websocket_server = "wss://ardua.site:444/wsar";
const char *de = "4444444444444444"; // deviceId → de

WebsocketsClient client;
unsigned long lastReconnectAttempt = 0;
unsigned long lastHeartbeatTime = 0;
unsigned long lastHeartbeat2Time = 0;
bool wasConnected = false;
bool isIdentified = false;
void sendCommandAck(const char *co, int sp = -1); // command → co, speed → sp

// Servo control
unsigned long lastServoMoveTime = 0;
int servoTargetPosition = 90; // Начальная позиция
bool isServoMoving = false;
unsigned long servoMoveStartTime = 0;
int servoStartPosition = 90;
unsigned long servoMoveDuration = 1000; // Длительность движения по умолчанию

void startServoMove(int targetPos, unsigned long duration)
{
if (isServoMoving)
return;

    // Дополнительная проверка на допустимый диапазон (на всякий случай)
    targetPos = constrain(targetPos, 0, 165);

    servoStartPosition = Servo1.read();
    servoTargetPosition = targetPos;
    servoMoveDuration = duration;
    servoMoveStartTime = millis();
    isServoMoving = true;

    Servo1.setSpeed(60); // Убедитесь, что скорость адекватная
    Servo1.easeTo(servoTargetPosition, servoMoveDuration);
}

void updateServoPosition()
{
if (isServoMoving && !Servo1.isMoving())
{
isServoMoving = false;
lastServoMoveTime = millis();
}
}

// Отправка логов
void sendLogMessage(const char* me) {
if (client.available()) {
StaticJsonDocument<256> doc;
doc["ty"] = "log";
doc["me"] = me;
doc["de"] = de;
doc["b1"] = digitalRead(button1); // Состояние реле 1
doc["b2"] = digitalRead(button2); // Состояние реле 2
String output;
serializeJson(doc, output);
client.send(output);
}
}

// Подтверждение команды
void sendCommandAck(const char* co, int sp) {
if (client.available() && isIdentified) {
StaticJsonDocument<256> doc;
doc["ty"] = "ack";
doc["co"] = co;
doc["de"] = de;
if (strcmp(co, "SPD") == 0 && sp != -1) {
doc["sp"] = sp;
}
String output;
serializeJson(doc, output);
Serial.println("Sending ack: " + output); // Отладка
client.send(output);
}
}

void stopMotors()
{
analogWrite(enA, 0);
analogWrite(enB, 0);
digitalWrite(in1, LOW);
digitalWrite(in2, LOW);
digitalWrite(in3, LOW);
digitalWrite(in4, LOW);
if (isIdentified)
{
sendLogMessage("Motors stopped");
}
}

void identifyDevice()
{
if (client.available())
{
StaticJsonDocument<128> typeDoc;
typeDoc["ty"] = "clt"; // type → ty, client_type → clt
typeDoc["ct"] = "esp"; // clientType → ct
String typeOutput;
serializeJson(typeDoc, typeOutput);
client.send(typeOutput);

        StaticJsonDocument<128> doc;
        doc["ty"] = "idn"; // type → ty, identify → idn
        doc["de"] = de;    // deviceId → de
        String output;
        serializeJson(doc, output);
        client.send(output);

        Serial.println("Identification sent");
    }
}

void connectToServer()
{
Serial.println("Connecting to server...");
client.addHeader("Origin", "http://ardua.site");
client.setInsecure();

    if (client.connect(websocket_server))
    {
        Serial.println("WebSocket connected!");
        wasConnected = true;
        isIdentified = false;
        identifyDevice();
    }
    else
    {
        Serial.println("WebSocket connection failed!");
        wasConnected = false;
        isIdentified = false;
    }
}

// Обработка входящих сообщений
void onMessageCallback(WebsocketsMessage message) {
StaticJsonDocument<192> doc;
DeserializationError error = deserializeJson(doc, message.data());
if (error) {
Serial.print("JSON parse error: ");
Serial.println(error.c_str());
return;
}

Serial.println("Received message: " + message.data()); // Отладка

if (doc["ty"] == "sys" && doc["st"] == "con") {
isIdentified = true;
Serial.println("Successfully identified!");
sendLogMessage("ESP connected and identified");
return;
}

const char* co = doc["co"];
if (!co) return;

if (strcmp(co, "SSR") == 0) {
int an = doc["pa"]["an"];
if (an < 0) {
an = 0;
sendLogMessage("Warning: Servo angle clamped to 0");
} else if (an > 165) {
an = 165;
sendLogMessage("Warning: Servo angle clamped to 165");
}
if (an != Servo1.read()) {
startServoMove(an, 500);
sendCommandAck("SSR");
}
} else if (strcmp(co, "MFA") == 0) {
digitalWrite(in1, HIGH);
digitalWrite(in2, LOW);
sendCommandAck("MFA");
} else if (strcmp(co, "MRA") == 0) {
digitalWrite(in1, LOW);
digitalWrite(in2, HIGH);
sendCommandAck("MRA");
} else if (strcmp(co, "MFB") == 0) {
digitalWrite(in3, HIGH);
digitalWrite(in4, LOW);
sendCommandAck("MFB");
} else if (strcmp(co, "MRB") == 0) {
digitalWrite(in3, LOW);
digitalWrite(in4, HIGH);
sendCommandAck("MRB");
} else if (strcmp(co, "SPD") == 0) {
const char* mo = doc["pa"]["mo"];
int speed = doc["pa"]["sp"];
if (strcmp(mo, "A") == 0) {
analogWrite(enA, speed);
sendCommandAck("SPD", speed);
} else if (strcmp(mo, "B") == 0) {
analogWrite(enB, speed);
sendCommandAck("SPD", speed);
}
} else if (strcmp(co, "STP") == 0) {
stopMotors();
sendCommandAck("STP");
} else if (strcmp(co, "HBT") == 0) {
lastHeartbeat2Time = millis();
sendLogMessage("Heartbeat - OK");
return;
} else if (strcmp(co, "RLY") == 0) {
const char* pin = doc["pa"]["pin"];
const char* state = doc["pa"]["state"];

        if (strcmp(pin, "D0") == 0) {
            digitalWrite(button1, strcmp(state, "on") == 0 ? LOW : HIGH); // Инверсия: LOW для включения
            Serial.println("Relay 1 (D0) set to: " + String(digitalRead(button1))); // Отладка
            sendLogMessage(strcmp(state, "on") == 0 ? "Реле 1 (D0) включено" : "Реле 1 (D0) выключено");
        } 
        else if (strcmp(pin, "3") == 0) {
            digitalWrite(button2, strcmp(state, "on") == 0 ? LOW : HIGH); // Инверсия: LOW для включения
            Serial.println("Relay 2 (3) set to: " + String(digitalRead(button2))); // Отладка
            sendLogMessage(strcmp(state, "on") == 0 ? "Реле 2 (3) включено" : "Реле 2 (3) выключено");
        }
        
        // Отправляем подтверждение с текущим состоянием
        StaticJsonDocument<256> ackDoc;
        ackDoc["ty"] = "ack";
        ackDoc["co"] = "RLY";
        ackDoc["de"] = de;
        JsonObject pa = ackDoc.createNestedObject("pa");
        pa["pin"] = pin;
        pa["state"] = digitalRead(strcmp(pin, "D0") == 0 ? button1 : button2) ? "on" : "off";
        
        String output;
        serializeJson(ackDoc, output);
        Serial.println("Sending ack: " + output); // Отладка
        client.send(output);
    }
}

void onEventsCallback(WebsocketsEvent event, String data)
{
if (event == WebsocketsEvent::ConnectionOpened)
{
Serial.println("Connection opened");
}
else if (event == WebsocketsEvent::ConnectionClosed)
{
Serial.println("Connection closed");
if (wasConnected)
{
wasConnected = false;
isIdentified = false;
stopMotors();
}
}
else if (event == WebsocketsEvent::GotPing)
{
client.pong();
}
}

// Инициализация
void setup() {
Serial.begin(115200);
delay(1000);
Serial.println("Starting ESP8266..."); // Отладка

// Инициализация сервопривода
if (Servo1.attach(SERVO1_PIN, 90) == INVALID_SERVO) {
Serial.println("Error attaching servo");
while (1) delay(100);
}
Servo1.setSpeed(60);
Servo1.write(90);

// Подключение к WiFi
WiFi.begin(ssid, password);
Serial.print("Connecting to WiFi");
while (WiFi.status() != WL_CONNECTED) {
delay(500);
Serial.print(".");
}
Serial.println("\nWiFi connected");

// Настройка WebSocket
client.onMessage(onMessageCallback);
client.onEvent(onEventsCallback);
connectToServer();

// Инициализация моторов и реле
pinMode(enA, OUTPUT);
pinMode(enB, OUTPUT);
pinMode(in1, OUTPUT);
pinMode(in2, OUTPUT);
pinMode(in3, OUTPUT);
pinMode(in4, OUTPUT);
pinMode(button1, OUTPUT);
pinMode(button2, OUTPUT);
digitalWrite(button1, LOW);
digitalWrite(button2, LOW);
stopMotors();
Serial.println("Motors and relays initialized"); // Отладка
}

void loop()
{
updateServoPosition();

    // Работа с WebSocket
    if (!client.available())
    {
        if (millis() - lastReconnectAttempt > 5000)
        {
            lastReconnectAttempt = millis();
            connectToServer();
        }
    }
    else
    {
        client.poll();

        if (isIdentified)
        {
            if (millis() - lastHeartbeatTime > 10000)
            {
                lastHeartbeatTime = millis();
                sendLogMessage("Heartbeat - OK");
            }

            if (millis() - lastHeartbeat2Time > 2000)
            {
                stopMotors();
            }
        }
        else if (millis() - lastReconnectAttempt > 3000)
        {
            lastReconnectAttempt = millis();
            identifyDevice();
        }
    }
}

Клиент Next
"use client"
import {useState, useEffect, useRef, useCallback} from 'react'
import {Button} from "@/components/ui/button"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Input} from "@/components/ui/input"
import {ChevronDown, ChevronUp, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Power} from "lucide-react"
import {Checkbox} from "@/components/ui/checkbox"
import {Label} from "@/components/ui/label"
import Joystick from '@/components/control/Joystick'

type MessageType = {
ty?: string // type → ty
sp?: string
co?: string // command → co
de?: string // deviceId → de
me?: string // message → me
mo?: string
pa?: any // params → pa
clientId?: number
st?: string // status → st
ts?: string // timestamp → ts
or?: 'client' | 'esp' | 'server' | 'error' // origin → or
re?: string // reason → re
}

type LogEntry = {
me: string // message → me
ty: 'client' | 'esp' | 'server' | 'error' // type → ty
}

export default function SocketClient() {
const [log, setLog] = useState<LogEntry[]>([])
const [isConnected, setIsConnected] = useState(false)
const [isIdentified, setIsIdentified] = useState(false)
const [de, setDe] = useState('123') // deviceId → de
const [inputDe, setInputDe] = useState('123') // deviceId → de
const [newDe, setNewDe] = useState('') // deviceId → de
const [deviceList, setDeviceList] = useState<string[]>(['123'])
const [espConnected, setEspConnected] = useState(false)
const [controlVisible, setControlVisible] = useState(false)
const [logVisible, setLogVisible] = useState(false)
const [motorASpeed, setMotorASpeed] = useState(0)
const [motorBSpeed, setMotorBSpeed] = useState(0)
const [motorADirection, setMotorADirection] = useState<'forward' | 'backward' | 'stop'>('stop')
const [motorBDirection, setMotorBDirection] = useState<'forward' | 'backward' | 'stop'>('stop')
const [autoReconnect, setAutoReconnect] = useState(false)
const [autoConnect, setAutoConnect] = useState(false)
const [activeTab, setActiveTab] = useState<'webrtc' | 'esp' | 'controls' | null>('esp')
const [servoAngle, setServoAngle] = useState(90)

    const reconnectAttemptRef = useRef(0)
    const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null)
    const socketRef = useRef<WebSocket | null>(null)
    const commandTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const lastMotorACommandRef = useRef<{ sp: number, direction: 'forward' | 'backward' | 'stop' } | null>(null) // speed → sp
    const lastMotorBCommandRef = useRef<{ sp: number, direction: 'forward' | 'backward' | 'stop' } | null>(null) // speed → sp
    const motorAThrottleRef = useRef<NodeJS.Timeout | null>(null)
    const motorBThrottleRef = useRef<NodeJS.Timeout | null>(null)
    const currentDeRef = useRef(inputDe) // deviceId → de

    const [preventDeletion, setPreventDeletion] = useState(false);
    const [isLandscape, setIsLandscape] = useState(false);

    const [button1State, setButton1State] = useState(0); // Состояние реле 1 (0 - выкл, 1 - вкл)
    const [button2State, setButton2State] = useState(0); // Состояние реле 2 (0 - выкл, 1 - вкл)

    useEffect(() => {
        const savedPreventDeletion = localStorage.getItem('preventDeletion');
        if (savedPreventDeletion) {
            setPreventDeletion(savedPreventDeletion === 'true');
        }
    }, []);

    useEffect(() => {
        const checkOrientation = () => {
            if (window.screen.orientation) {
                setIsLandscape(window.screen.orientation.type.includes('landscape'));
            } else {
                setIsLandscape(window.innerWidth > window.innerHeight);
            }
        };

        checkOrientation();

        if (window.screen.orientation) {
            window.screen.orientation.addEventListener('change', checkOrientation);
        } else {
            window.addEventListener('resize', checkOrientation);
        }

        return () => {
            if (window.screen.orientation) {
                window.screen.orientation.removeEventListener('change', checkOrientation);
            } else {
                window.removeEventListener('resize', checkOrientation);
            }
        };
    }, []);

    useEffect(() => {
        currentDeRef.current = inputDe // deviceId → de
    }, [inputDe])

    useEffect(() => {
        const savedDevices = localStorage.getItem('espDeviceList')
        if (savedDevices) {
            const devices = JSON.parse(savedDevices)
            setDeviceList(devices)
            if (devices.length > 0) {
                const savedDe = localStorage.getItem('selectedDeviceId') // deviceId → de
                const initialDe = savedDe && devices.includes(savedDe) // deviceId → de
                    ? savedDe
                    : devices[0]
                setInputDe(initialDe) // deviceId → de
                setDe(initialDe) // deviceId → de
                currentDeRef.current = initialDe // deviceId → de
            }
        }

        const savedAutoReconnect = localStorage.getItem('autoReconnect')
        if (savedAutoReconnect) {
            setAutoReconnect(savedAutoReconnect === 'true')
        }

        const savedAutoConnect = localStorage.getItem('autoConnect')
        if (savedAutoConnect) {
            setAutoConnect(savedAutoConnect === 'true')
        }
    }, [])

    const togglePreventDeletion = useCallback((checked: boolean) => {
        setPreventDeletion(checked);
        localStorage.setItem('preventDeletion', checked.toString());
    }, []);

    const saveNewDe = useCallback(() => { // deviceId → de
        if (newDe && !deviceList.includes(newDe)) { // deviceId → de
            const updatedList = [...deviceList, newDe] // deviceId → de
            setDeviceList(updatedList)
            localStorage.setItem('espDeviceList', JSON.stringify(updatedList))
            setInputDe(newDe) // deviceId → de
            setNewDe('') // deviceId → de
            currentDeRef.current = newDe // deviceId → de
        }
    }, [newDe, deviceList])

    const addLog = useCallback((msg: string, ty: LogEntry['ty']) => { // type → ty
        setLog(prev => [...prev.slice(-100), {me: `${new Date().toLocaleTimeString()}: ${msg}`, ty}]) // message → me, type → ty
    }, [])

    const cleanupWebSocket = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.onopen = null
            socketRef.current.onclose = null
            socketRef.current.onmessage = null
            socketRef.current.onerror = null
            if (socketRef.current.readyState === WebSocket.OPEN) {
                socketRef.current.close()
            }
            socketRef.current = null
        }
    }, [])

    const connectWebSocket = useCallback((deToConnect: string) => { // deviceId → de
        cleanupWebSocket()

        reconnectAttemptRef.current = 0
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current)
            reconnectTimerRef.current = null
        }

        const ws = new WebSocket(process.env.WEBSOCKET_URL_WSAR || 'wss://ardua.site:444/wsar');

        ws.onopen = () => {
            setIsConnected(true)
            reconnectAttemptRef.current = 0
            addLog("Connected to WebSocket server", 'server')

            ws.send(JSON.stringify({
                ty: "clt", // type → ty, client_type → clt
                ct: "browser" // clientType → ct
            }))

            ws.send(JSON.stringify({
                ty: "idn", // type → ty, identify → idn
                de: deToConnect // deviceId → de
            }))
        }

        // Обработка сообщений в connectWebSocket
        ws.onmessage = (event) => {
            try {
                const data: MessageType = JSON.parse(event.data);
                console.log("Received message:", data);

                if (data.ty === "ack") {
                    if (data.co === "RLY" && data.pa) {
                        if (data.pa.pin === "D0") {
                            setButton1State(data.pa.state === "on" ? 1 : 0);
                            addLog(`Реле 1 (D0) ${data.pa.state === "on" ? "включено" : "выключено"}`, 'esp');
                        } else if (data.pa.pin === "3") {
                            setButton2State(data.pa.state === "on" ? 1 : 0);
                            addLog(`Реле 2 (3) ${data.pa.state === "on" ? "включено" : "выключено"}`, 'esp');
                        }
                    } else if (data.co === "SPD" && data.sp !== undefined) {
                        addLog(`Speed set: ${data.sp} for motor ${data.mo || 'unknown'}`, 'esp');
                    } else {
                        addLog(`Command ${data.co} acknowledged`, 'esp');
                    }
                }

                if (data.ty === "sys") {
                    if (data.st === "con") {
                        setIsIdentified(true);
                        setDe(deToConnect);
                        setEspConnected(true);
                    }
                    addLog(`System: ${data.me}`, 'server');
                } else if (data.ty === "err") {
                    addLog(`Error: ${data.me}`, 'error');
                    setIsIdentified(false);
                } else if (data.ty === "log") {
                    addLog(`ESP: ${data.me}`, 'esp');
                    if (data.b1 !== undefined) {
                        setButton1State(data.b1 ? 1 : 0);
                        addLog(`Реле 1 (D0): ${data.b1 ? "включено" : "выключено"}`, 'esp');
                    }
                    if (data.b2 !== undefined) {
                        setButton2State(data.b2 ? 1 : 0);
                        addLog(`Реле 2 (3): ${data.b2 ? "включено" : "выключено"}`, 'esp');
                    }
                } else if (data.ty === "est") {
                    console.log(`Received ESP status: ${data.st}`);
                    setEspConnected(data.st === "con");
                    addLog(
                        `ESP ${data.st === "con" ? "✅ Connected" : "❌ Disconnected"}`,
                        'error'
                    );
                } else if (data.ty === "cst") {
                    addLog(`Command ${data.co} delivered`, 'success');
                }
            } catch (error) {
                console.error("Error processing message:", error);
                addLog(`Received message: ${event.data}`, 'error');
            }
        };

        ws.onclose = (event) => {
            setIsConnected(false)
            setIsIdentified(false)
            setEspConnected(false)
            addLog(`Disconnected from server${event.reason ? `: ${event.reason}` : ''}`, 'server')

            if (reconnectAttemptRef.current < 5) {
                reconnectAttemptRef.current += 1
                const delay = Math.min(5000, reconnectAttemptRef.current * 1000)
                addLog(`Attempting to reconnect in ${delay / 1000} seconds... (attempt ${reconnectAttemptRef.current})`, 'server')

                reconnectTimerRef.current = setTimeout(() => {
                    connectWebSocket(currentDeRef.current) // deviceId → de
                }, delay)
            } else {
                addLog("Max reconnection attempts reached", 'error')
            }
        }

        ws.onerror = (error) => {
            addLog(`WebSocket error: ${error.type}`, 'error')
        }

        socketRef.current = ws
    }, [addLog, cleanupWebSocket])

    useEffect(() => {
        if (autoConnect && !isConnected) {
            connectWebSocket(currentDeRef.current) // deviceId → de
        }
    }, [autoConnect, connectWebSocket, isConnected])

    const handleAutoConnectChange = useCallback((checked: boolean) => {
        setAutoConnect(checked)
        localStorage.setItem('autoConnect', checked.toString())
    }, [])

    const disconnectWebSocket = useCallback(() => {
        return new Promise<void>((resolve) => {
            cleanupWebSocket()
            setIsConnected(false)
            setIsIdentified(false)
            setEspConnected(false)
            addLog("Disconnected manually", 'server')
            reconnectAttemptRef.current = 5

            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current)
                reconnectTimerRef.current = null
            }
            resolve()
        })
    }, [addLog, cleanupWebSocket])

    const handleDeviceChange = useCallback(async (value: string) => {
        setInputDe(value) // deviceId → de
        currentDeRef.current = value // deviceId → de
        localStorage.setItem('selectedDeviceId', value)

        if (autoReconnect) {
            await disconnectWebSocket()
            connectWebSocket(value)
        }
    }, [autoReconnect, disconnectWebSocket, connectWebSocket])

    const toggleAutoReconnect = useCallback((checked: boolean) => {
        setAutoReconnect(checked)
        localStorage.setItem('autoReconnect', checked.toString())
    }, [])

    const sendCommand = useCallback((co: string, pa?: any) => { // command → co, params → pa
        if (!isIdentified) {
            addLog("Cannot send co: not identified", 'error') // command → co
            return
        }

        if (socketRef.current?.readyState === WebSocket.OPEN) {
            const msg = JSON.stringify({
                co, // command → co
                pa, // params → pa
                de, // deviceId → de
                ts: Date.now(), // timestamp → ts
                expectAck: true
            })

            socketRef.current.send(msg)
            addLog(`Sent co to ${de}: ${co}`, 'client') // command → co, deviceId → de

            if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current)
            commandTimeoutRef.current = setTimeout(() => {
                if (espConnected) {
                    addLog(`Command ${co} not acknowledged by ESP`, 'error') // command → co
                    setEspConnected(false)
                }
            }, 5000)
        } else {
            addLog("WebSocket not ready!", 'error')
        }
    }, [addLog, de, isIdentified, espConnected])

    const createMotorHandler = useCallback((mo: 'A' | 'B') => { // motor → mo
        const lastCommandRef = mo === 'A' ? lastMotorACommandRef : lastMotorBCommandRef
        const throttleRef = mo === 'A' ? motorAThrottleRef : motorBThrottleRef
        const setSpeed = mo === 'A' ? setMotorASpeed : setMotorBSpeed
        const setDirection = mo === 'A' ? setMotorADirection : setMotorBDirection

        return (value: number) => {
            let direction: 'forward' | 'backward' | 'stop' = 'stop'
            let sp = 0 // speed → sp

            if (value > 0) {
                direction = 'forward'
                sp = value // speed → sp
            } else if (value < 0) {
                direction = 'backward'
                sp = -value // speed → sp
            }

            setSpeed(sp) // speed → sp
            setDirection(direction)

            const currentCommand = {sp, direction} // speed → sp
            if (JSON.stringify(lastCommandRef.current) === JSON.stringify(currentCommand)) {
                return
            }

            lastCommandRef.current = currentCommand

            if (sp === 0) { // speed → sp
                if (throttleRef.current) {
                    clearTimeout(throttleRef.current)
                    throttleRef.current = null
                }
                sendCommand("SPD", {mo, sp: 0}) // set_speed → SPD, motor → mo, speed → sp
                sendCommand(mo === 'A' ? "MSA" : "MSB")
                return
            }

            if (throttleRef.current) {
                clearTimeout(throttleRef.current)
            }

            throttleRef.current = setTimeout(() => {
                sendCommand("SPD", {mo, sp}) // set_speed → SPD, motor → mo, speed → sp
                sendCommand(direction === 'forward'
                    ? `MF${mo}` // motor_a_forward → MFA, motor_b_forward → MFB
                    : `MR${mo}`) // motor_a_backward → MRA, motor_b_backward → MRB
            }, 40)
        }
    }, [sendCommand])

    const adjustServoAngle = useCallback((delta: number) => {
        const newAngle = Math.max(0, Math.min(180, servoAngle + delta))
        setServoAngle(newAngle)
        sendCommand("SSR", {an: newAngle}) // set_servo → SSR, angle → an
    }, [servoAngle, sendCommand])

    const handleMotorAControl = createMotorHandler('A')
    const handleMotorBControl = createMotorHandler('B')

    const emergencyStop = useCallback(() => {
        sendCommand("SPD", {mo: 'A', sp: 0}) // set_speed → SPD, motor → mo, speed → sp
        sendCommand("SPD", {mo: 'B', sp: 0}) // set_speed → SPD, motor → mo, speed → sp
        setMotorASpeed(0)
        setMotorBSpeed(0)
        setMotorADirection('stop')
        setMotorBDirection('stop')

        if (motorAThrottleRef.current) clearTimeout(motorAThrottleRef.current)
        if (motorBThrottleRef.current) clearTimeout(motorBThrottleRef.current)
    }, [sendCommand])

    useEffect(() => {
        return () => {
            cleanupWebSocket()
            if (motorAThrottleRef.current) clearTimeout(motorAThrottleRef.current)
            if (motorBThrottleRef.current) clearTimeout(motorBThrottleRef.current)
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
        }
    }, [cleanupWebSocket])

    useEffect(() => {
        const interval = setInterval(() => {
            if (isConnected && isIdentified) sendCommand("HBT") // heartbeat2 → HBT
        }, 1000)
        return () => clearInterval(interval)
    }, [isConnected, isIdentified, sendCommand])

    const handleOpenControls = () => {
        setControlVisible(true)
        setActiveTab(null)
    }

    const handleCloseControls = () => {
        setControlVisible(false)
        setActiveTab('esp')
    }

    return (
        <div className="flex flex-col items-center min-h-screen p-4 bg-transparent mt-12">
            {activeTab === 'esp' && (
                <div
                    className="w-full max-w-md space-y-2 bg-transparent rounded-lg p-2 sm:p-2 border border-gray-200 backdrop-blur-sm"
                    style={{maxHeight: '90vh', overflowY: 'auto'}}>
                    <div className="flex flex-col items-center space-y-2">
                        <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${
                                isConnected
                                    ? (isIdentified
                                        ? (espConnected ? 'bg-green-500' : 'bg-yellow-500')
                                        : 'bg-yellow-500')
                                    : 'bg-red-500'
                            }`}></div>
                            <span className="text-xs sm:text-sm font-medium text-gray-600">
                                {isConnected
                                    ? (isIdentified
                                        ? (espConnected ? 'Connected' : 'Waiting for ESP')
                                        : 'Connecting...')
                                    : 'Disconnected'}
                              </span>
                        </div>
                    </div>

                    <Button
                        onClick={handleOpenControls}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 h-8 sm:h-10 text-xs sm:text-sm"
                    >
                        Controls
                    </Button>

                    <div className="flex space-x-2">
                        <Select
                            value={inputDe} // deviceId → de
                            onValueChange={handleDeviceChange}
                            disabled={isConnected && !autoReconnect}
                        >
                            <SelectTrigger className="flex-1 bg-transparent h-8 sm:h-10">
                                <SelectValue placeholder="Select device"/>
                            </SelectTrigger>
                            <SelectContent className="bg-transparent backdrop-blur-sm border border-gray-200">
                                {deviceList.map(id => (
                                    <SelectItem key={id} value={id}
                                                className="hover:bg-gray-100/50 text-xs sm:text-sm">{id}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            onClick={() => {
                                if (!preventDeletion && confirm("Delete ?")) {
                                    const defaultDevice = '123';
                                    setDeviceList([defaultDevice]);
                                    setInputDe(defaultDevice); // deviceId → de
                                    localStorage.setItem('espDeviceList', JSON.stringify([defaultDevice]));
                                }
                            }}
                            disabled={preventDeletion}
                            className="bg-red-600 hover:bg-red-700 h-8 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm"
                        >
                            Del
                        </Button>
                    </div>

                    <div className="space-y-1 sm:space-y-2">
                        <Label className="block text-xs sm:text-sm font-medium text-gray-700">Add New Device</Label>
                        <div className="flex space-x-2">
                            <Input
                                value={newDe} // deviceId → de
                                onChange={(e) => setNewDe(e.target.value)} // deviceId → de
                                placeholder="Enter new device ID"
                                className="flex-1 bg-transparent h-8 sm:h-10 text-xs sm:text-sm"
                            />
                            <Button
                                onClick={saveNewDe} // deviceId → de
                                disabled={!newDe} // deviceId → de
                                className="bg-blue-600 hover:bg-blue-700 h-8 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm"
                            >
                                Add
                            </Button>
                        </div>
                    </div>

                    <div className="flex space-x-2">
                        <Button
                            onClick={() => connectWebSocket(currentDeRef.current)} // deviceId → de
                            disabled={isConnected}
                            className="flex-1 bg-green-600 hover:bg-green-700 h-8 sm:h-10 text-xs sm:text-sm"
                        >
                            Connect
                        </Button>
                        <Button
                            onClick={disconnectWebSocket}
                            disabled={!isConnected || autoConnect}
                            className="flex-1 bg-red-600 hover:bg-red-700 h-8 sm:h-10 text-xs sm:text-sm"
                        >
                            Disconnect
                        </Button>
                    </div>

                    <div className="space-y-2 sm:space-y-3">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="auto-reconnect"
                                checked={autoReconnect}
                                onCheckedChange={toggleAutoReconnect}
                                className="border-gray-300 bg-transparent w-4 h-4 sm:w-5 sm:h-5"
                            />
                            <Label htmlFor="auto-reconnect" className="text-xs sm:text-sm font-medium text-gray-700">
                                Auto reconnect when changing device
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="auto-connect"
                                checked={autoConnect}
                                onCheckedChange={handleAutoConnectChange}
                                className="border-gray-300 bg-transparent w-4 h-4 sm:w-5 sm:h-5"
                            />
                            <Label htmlFor="auto-connect" className="text-xs sm:text-sm font-medium text-gray-700">
                                Auto connect on page load
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="prevent-deletion"
                                checked={preventDeletion}
                                onCheckedChange={togglePreventDeletion}
                                className="border-gray-300 bg-transparent w-4 h-4 sm:w-5 sm:h-5"
                            />
                            <Label htmlFor="prevent-deletion" className="text-xs sm:text-sm font-medium text-gray-700">
                                Запретить удаление устройств
                            </Label>
                        </div>
                    </div>

                    <Button
                        onClick={() => setLogVisible(!logVisible)}
                        variant="outline"
                        className="w-full border-gray-300 bg-transparent hover:bg-gray-100/50 h-8 sm:h-10 text-xs sm:text-sm text-gray-700"
                    >
                        {logVisible ? (
                            <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 mr-2"/>
                        ) : (
                            <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 mr-2"/>
                        )}
                        {logVisible ? "Hide Logs" : "Show Logs"}
                    </Button>

                    {logVisible && (
                        <div
                            className="border border-gray-200 rounded-md overflow-hidden bg-transparent backdrop-blur-sm">
                            <div className="h-32 sm:h-48 overflow-y-auto p-2 bg-transparent text-xs font-mono">
                                {log.length === 0 ? (
                                    <div className="text-gray-500 italic">No logs yet</div>
                                ) : (
                                    log.slice().reverse().map((entry, index) => (
                                        <div
                                            key={index}
                                            className={`truncate py-1 ${
                                                entry.ty === 'client' ? 'text-blue-600' : // type → ty
                                                    entry.ty === 'esp' ? 'text-green-600' : // type → ty
                                                        entry.ty === 'server' ? 'text-purple-600' : // type → ty
                                                            'text-red-600 font-semibold'
                                            }`}
                                        >
                                            {entry.me} // message → me
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {controlVisible && (
                <div>
                    <Joystick
                        mo="A" // motor → mo
                        onChange={handleMotorAControl}
                        direction={motorADirection}
                        sp={motorASpeed} // speed → sp
                    />

                    <Joystick
                        mo="B" // motor → mo
                        onChange={handleMotorBControl}
                        direction={motorBDirection}
                        sp={motorBSpeed} // speed → sp
                    />

                    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-4 z-50">
                        <Button
                            onClick={() => adjustServoAngle(-180)}
                            className="bg-transparent hover:bg-gray-700/30 backdrop-blur-sm border border-gray-600 text-gray-600 p-2 rounded-full transition-all"
                        >
                            <ArrowLeft className="h-5 w-5"/>
                        </Button>

                        <Button
                            onClick={() => adjustServoAngle(15)}
                            className="bg-transparent hover:bg-gray-700/30 backdrop-blur-sm border border-gray-600 text-gray-600 p-2 rounded-full transition-all"
                        >
                            <ArrowDown className="h-5 w-5" />
                        </Button>

                        <Button
                            onClick={() => adjustServoAngle(-15)}
                            className="bg-transparent hover:bg-gray-700/30 backdrop-blur-sm border border-gray-600 text-gray-600 p-2 rounded-full transition-all"
                        >
                            <ArrowUp className="h-5 w-5" />
                        </Button>

                        <Button
                            onClick={() => adjustServoAngle(180)}
                            className="bg-transparent hover:bg-gray-700/30 backdrop-blur-sm border border-gray-600 text-gray-600 p-2 rounded-full transition-all"
                        >
                            <ArrowRight className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-50">
                        {/* Кнопка для реле 1 (D0) */}
                        <Button
                            onClick={() => {
                                const newState = button1State ? "off" : "on";
                                sendCommand("RLY", { pin: "D0", state: newState });
                                setButton1State(newState === "on" ? 1 : 0); // Предварительное обновление
                            }}
                            className={`${
                                button1State ? "bg-green-600 hover:bg-green-700" : "bg-transparent hover:bg-gray-700/30"
                            } backdrop-blur-sm border border-gray-600 text-gray-600 px-4 py-1 sm:px-6 sm:py-2 rounded-full transition-all text-xs sm:text-sm flex items-center`}
                            style={{ minWidth: "6rem" }}
                        >
                            <Power className="h-4 w-4 mr-2" />
                            Реле 1 (D0) {button1State ? "Вкл" : "Выкл"}
                        </Button>

                        {/* Кнопка для реле 2 (3) */}
                        <Button
                            onClick={() => {
                                const newState = button2State ? "off" : "on";
                                sendCommand("RLY", { pin: "3", state: newState });
                                setButton2State(newState === "on" ? 1 : 0); // Предварительное обновление
                            }}
                            className={`${
                                button2State ? "bg-green-600 hover:bg-green-700" : "bg-transparent hover:bg-gray-700/30"
                            } backdrop-blur-sm border border-gray-600 text-gray-600 px-4 py-1 sm:px-6 sm:py-2 rounded-full transition-all text-xs sm:text-sm flex items-center`}
                            style={{ minWidth: "6rem" }}
                        >
                            <Power className="h-4 w-4 mr-2" />
                            Реле 2 (3) {button2State ? "Вкл" : "Выкл"}
                        </Button>

                        {/* Кнопка закрытия панели управления */}
                        <Button
                            onClick={handleCloseControls}
                            className="bg-transparent hover:bg-gray-700/30 backdrop-blur-sm border border-gray-600 text-gray-600 px-4 py-1 sm:px-6 sm:py-2 rounded-full transition-all text-xs sm:text-sm"
                            style={{ minWidth: "6rem" }}
                        >
                            Закрыть
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

Сервер
import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { getAllowedDeviceIds } from './fun';
import { createServer } from 'http';

const PORT = 8096;
const WS_PATH = '/wsar';

const server = createServer();
const wss = new WebSocketServer({
server,
path: WS_PATH
});

interface ClientInfo {
ws: WebSocket;
de?: string; // deviceId → de
ip: string;
isIdentified: boolean;
ct?: 'browser' | 'esp'; // clientType → ct
lastActivity: number;
isAlive: boolean;
}

const clients = new Map<number, ClientInfo>();

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
// Проверяем путь подключения
if (req.url !== WS_PATH) {
ws.close(1002, 'Invalid path');
return;
}

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
        ty: "sys", // type → ty, system → sys
        me: "Connection established", // message → me
        clientId,
        st: "awi" // status → st, awaiting_identification → awi
    }));

    ws.on('message', async (data: Buffer) => {
        try {
            client.lastActivity = Date.now();
            const message = data.toString();
            console.log(`[${clientId}] Received: ${message}`);
            const parsed = JSON.parse(message);

            if (parsed.ty === "clt") { // type → ty, client_type → clt
                client.ct = parsed.ct; // clientType → ct
                return;
            }

            if (parsed.ty === "idn") { // type → ty, identify → idn
                const allowedIds = new Set(await getAllowedDeviceIds());
                if (parsed.de && allowedIds.has(parsed.de)) { // deviceId → de
                    client.de = parsed.de; // deviceId → de
                    client.isIdentified = true;

                    ws.send(JSON.stringify({
                        ty: "sys", // type → ty, system → sys
                        me: "Identification successful", // message → me
                        clientId,
                        de: parsed.de, // deviceId → de
                        st: "con" // status → st, connected → con
                    }));

                    // Notify browser clients about ESP connection
                    if (client.ct === "esp") { // clientType → ct
                        clients.forEach(targetClient => {
                            if (targetClient.ct === "browser" && // clientType → ct
                                targetClient.de === parsed.de) { // deviceId → de
                                console.log(`Notifying browser client ${targetClient.de} about ESP connection`); // deviceId → de
                                targetClient.ws.send(JSON.stringify({
                                    ty: "est", // type → ty, esp_status → est
                                    st: "con", // status → st, connected → con
                                    de: parsed.de, // deviceId → de
                                    ts: new Date().toISOString() // timestamp → ts
                                }));
                            }
                        });
                    }
                } else {
                    ws.send(JSON.stringify({
                        ty: "err", // type → ty, error → err
                        me: "Invalid device ID", // message → me
                        clientId,
                        st: "rej" // status → st, rejected → rej
                    }));
                    ws.close();
                }
                return;
            }

            if (!client.isIdentified) {
                ws.send(JSON.stringify({
                    ty: "err", // type → ty, error → err
                    me: "Not identified", // message → me
                    clientId
                }));
                return;
            }

            // Process logs from ESP
            if (parsed.ty === "log" && client.ct === "esp") { // type → ty, clientType → ct
                clients.forEach(targetClient => {
                    if (targetClient.ct === "browser" && // clientType → ct
                        targetClient.de === client.de) { // deviceId → de
                        targetClient.ws.send(JSON.stringify({
                            ty: "log", // type → ty
                            me: parsed.me, // message → me
                            de: client.de, // deviceId → de
                            ts: new Date().toISOString(), // timestamp → ts
                            or: "esp" // origin → or
                        }));
                    }
                });
                return;
            }

            // Process command acknowledgements
            if (parsed.ty === "ack" && client.ct === "esp") { // type → ty, acknowledge → ack, clientType → ct
                clients.forEach(targetClient => {
                    if (targetClient.ct === "browser" && // clientType → ct
                        targetClient.de === client.de) { // deviceId → de
                        targetClient.ws.send(JSON.stringify({
                            ty: "ack", // type → ty, acknowledge → ack
                            co: parsed.co, // command → co
                            de: client.de, // deviceId → de
                            ts: new Date().toISOString() // timestamp → ts
                        }));
                    }
                });
                return;
            }

            // Route commands to ESP
            if (parsed.co && parsed.de) { // command → co, deviceId → de
                let delivered = false;
                clients.forEach(targetClient => {
                    if (targetClient.de === parsed.de && // deviceId → de
                        targetClient.ct === "esp" && // clientType → ct
                        targetClient.isIdentified) {
                        targetClient.ws.send(message);
                        delivered = true;
                    }
                });

                ws.send(JSON.stringify({
                    ty: delivered ? "cst" : "err", // type → ty, command_status → cst, error → err
                    st: delivered ? "dvd" : "enf", // status → st, delivered → dvd, esp_not_found → enf
                    co: parsed.co, // command → co
                    de: parsed.de, // deviceId → de
                    ts: new Date().toISOString() // timestamp → ts
                }));
            }

        } catch (err) {
            console.error(`[${clientId}] Message error:`, err);
            ws.send(JSON.stringify({
                ty: "err", // type → ty, error → err
                me: "Invalid message format", // message → me
                error: (err as Error).message,
                clientId
            }));
        }
    });

    ws.on('close', () => {
        console.log(`Client ${clientId} disconnected`);
        if (client.ct === "esp" && client.de) { // clientType → ct, deviceId → de
            clients.forEach(targetClient => {
                if (targetClient.ct === "browser" && // clientType → ct
                    targetClient.de === client.de) { // deviceId → de
                    targetClient.ws.send(JSON.stringify({
                        ty: "est", // type → ty, esp_status → est
                        st: "dis", // status → st, disconnected → dis
                        de: client.de, // deviceId → de
                        ts: new Date().toISOString(), // timestamp → ts
                        re: "connection closed" // reason → re
                    }));
                }
            });
        }
        clients.delete(clientId);
    });

    ws.on('error', (err: Error) => {
        console.error(`[${clientId}] WebSocket error:`, err);
    });
});

server.listen(PORT, () => {
console.log(`WebSocket server running on ws://0.0.0.0:${PORT}${WS_PATH}`);
});





так же для меня не понятно все логи которые идут в serialPort, в консоль клиента, в ShowLogs, и логи сервера.
нужно разобраться с логами в ардуино, на сервере и на клиенте в Show Logs и консоли клиента
нужно сделать 5 типа лога
1) -> отправляет
2) <- принимает
3) HBT -> (Heartbeat)
4) HBT <- (Heartbeat)
5) срочные: если HBT на ардуино не пришел, ардуино останавливает моторы, если пропало соединение ардуино останавливает моторы

Везде логи должны быть одинаковые и логика поведения должны быть у всех одинаковая и тексты одинаковые.
Если не пришел HBT от ардуины к клиенту то клиенту должно в логах оповестить, так же долно оповестить в логах ардуине если HBT не пришел от клиента

HBT везде должен быть 2 секунды

Структура логов должна быть везде одинаковая. отвечай на русском , не изменяй весь код измени участки кода, давай код целыми функциями, в функциях ничего не сокращай - это важно!