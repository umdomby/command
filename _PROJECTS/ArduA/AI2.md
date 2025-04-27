/*
*  PinDefinitionsAndMore.h
*
*  Contains SERVOX_PIN definitions for ServoEasing examples for various platforms
*  as well as includes and definitions for LED_BUILTIN
*
*  Copyright (C) 2020  Armin Joachimsmeyer
*  armin.joachimsmeyer@gmail.com
*
*  This file is part of ServoEasing https://github.com/ArminJo/ServoEasing.
*
*  IRMP is free software: you can redistribute it and/or modify
*  it under the terms of the GNU General Public License as published by
*  the Free Software Foundation, either version 3 of the License, or
*  (at your option) any later version.
*
*  This program is distributed in the hope that it will be useful,
*  but WITHOUT ANY WARRANTY without even the implied warranty of
*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*  GNU General Public License for more details.
*
*  You should have received a copy of the GNU General Public License
*  along with this program.  If not, see <http://www.gnu.org/licenses/gpl.html>.
*
*/

/*
* Pin mapping table for different platforms
*
* Platform         Servo1      Servo2      Servo3      Analog
* -----------------------------------------------------------
* (Mega)AVR + SAMD   9           10          11          A0
* ESP8266            14 // D5    12 // D6    13 // D7    0
* ESP32              5           18          19          A0
* BluePill           PB7         PB8         PB9         PA0
* APOLLO3            11          12          13          A3
  */

#if defined(ESP8266)
#define SERVO1_PIN 5 // D1
#define SERVO2_PIN 2 // D4
// #define SERVO1_PIN 13 // D7
// #define SERVO2_PIN 15 // D8
// #define SERVO3_PIN 13 // D7
#define SPEED_IN_PIN 0

#elif defined(ESP32)
#define SERVO1_PIN 5
#define SERVO2_PIN 18
#define SERVO3_PIN 19
#define SPEED_IN_PIN A0 // 36/VP
#define MODE_ANALOG_INPUT_PIN A3 // 39

#elif defined(STM32F1xx) || defined(__STM32F1__)
// BluePill in 2 flavors
// STM32F1xx is for "Generic STM32F1 series / STM32:stm32" from STM32 Boards from STM32 cores of Arduino Board manager
// __STM32F1__is for "Generic STM32F103C series / stm32duino:STM32F1" from STM32F1 Boards (STM32duino.com) of Arduino Board manager
#define SERVO1_PIN PB7
#define SERVO2_PIN PB8
#define SERVO3_PIN PB9 // Needs timer 4 for Servo library
#define SPEED_IN_PIN PA0
#define MODE_ANALOG_INPUT_PIN PA1

#elif defined(ARDUINO_ARCH_APOLLO3)
#define SERVO1_PIN 11
#define SERVO2_PIN 12
#define SERVO3_PIN 13
#define SPEED_IN_PIN A2
#define MODE_ANALOG_INPUT_PIN A3

#elif defined(ARDUINO_ARCH_MBED) // Arduino Nano 33 BLE
#define SERVO1_PIN 9
#define SERVO2_PIN 10
#define SERVO3_PIN 11
#define SPEED_IN_PIN A0
#define MODE_ANALOG_INPUT_PIN A1

#elif defined(__AVR__)
#define SERVO1_PIN 9 // For ATmega328 pins 9 + 10 are connected to timer 2 and can therefore be used also by the Lightweight Servo library
#define SERVO2_PIN 10
#define SERVO3_PIN 11
#define SPEED_IN_PIN A0
#define MODE_ANALOG_INPUT_PIN A1

#else
#warning Board / CPU is not detected using pre-processor symbols -> using default values, which may not fit. Please extend PinDefinitionsAndMore.h.
// Default valued for unidentified boards
#define SERVO1_PIN 9
#define SERVO2_PIN 10
#define SERVO3_PIN 11
#define SPEED_IN_PIN A0
#define MODE_ANALOG_INPUT_PIN A1

#endif

#define SERVO_UNDER_TEST_PIN SERVO1_PIN

#define SPEED_OR_POSITION_ANALOG_INPUT_PIN SPEED_IN_PIN
#define POSITION_ANALOG_INPUT_PIN SPEED_IN_PIN

// for ESP32 LED_BUILTIN is defined as: static const uint8_t LED_BUILTIN 2
#if !defined(LED_BUILTIN) && !defined(ESP32)
#define LED_BUILTIN PB1
#endif
// On the Zero and others we switch explicitly to SerialUSB
#if defined(ARDUINO_ARCH_SAMD)
#define Serial SerialUSB
// The Chinese SAMD21 M0-Mini clone has no led connected, if you connect it, it is on pin 24 like on the original board.
// Attention! D2 and D4 are reversed on these boards
//#undef LED_BUILTIN
//#define LED_BUILTIN 25 // Or choose pin 25, it is the RX pin, but active low.
#endif



main.cpp

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ArduinoWebsockets.h>
#include <ArduinoJson.h>
#include "ServoEasing.hpp"
ServoEasing Servo1;


using namespace websockets;

const char* ssid = "Robolab124";
const char* password = "wifi123123123";
const char* websocket_server = "wss://ardu.site/ws";
const char* deviceId = "444";

WebsocketsClient client;
unsigned long lastReconnectAttempt = 0;
unsigned long lastHeartbeatTime = 0;
unsigned long lastHeartbeat2Time = 0;
bool wasConnected = false;
bool isIdentified = false;  // Добавляем флаг идентификации

// Motor pins
#define enA D6
#define in1 D2
#define in2 D7
#define enB D5
#define in3 D3
#define in4 D8

void sendLogMessage(const char* message) {
if(client.available()) {
StaticJsonDocument<128> doc;
doc["type"] = "log";
doc["message"] = message;
doc["deviceId"] = deviceId;
String output;
serializeJson(doc, output);
client.send(output);
}
}

void sendCommandAck(const char* command) {
if(client.available() && isIdentified) {  // Отправляем только после идентификации
StaticJsonDocument<96> doc;
doc["type"] = "command_ack";
doc["command"] = command;
doc["deviceId"] = deviceId;
String output;
serializeJson(doc, output);
client.send(output);
}
}

void stopMotors() {
analogWrite(enA, 0);
analogWrite(enB, 0);
digitalWrite(in1, LOW);
digitalWrite(in2, LOW);
digitalWrite(in3, LOW);
digitalWrite(in4, LOW);
if(isIdentified) {  // Отправляем только если идентифицированы
sendLogMessage("Motors stopped");
}
}

void identifyDevice() {
if(client.available()) {
// 1. Отправляем тип клиента
StaticJsonDocument<128> typeDoc;
typeDoc["type"] = "client_type";
typeDoc["clientType"] = "esp";
String typeOutput;
serializeJson(typeDoc, typeOutput);
client.send(typeOutput);

        // 2. Отправляем идентификацию
        StaticJsonDocument<128> doc;
        doc["type"] = "identify";
        doc["deviceId"] = deviceId;
        String output;
        serializeJson(doc, output);
        client.send(output);

        Serial.println("Identification sent");
    }
}

void connectToServer() {
Serial.println("Connecting to server...");
client.addHeader("Origin", "http://ardu.site");
client.setInsecure(); // Для обхода проверки SSL

    if(client.connect(websocket_server)) {
        Serial.println("WebSocket connected!");
        wasConnected = true;
        isIdentified = false; // Сбрасываем флаг при новом подключении
        
        // Отправляем идентификацию
        identifyDevice();
        
    } else {
        Serial.println("WebSocket connection failed!");
        wasConnected = false;
        isIdentified = false;
    }
}

void onMessageCallback(WebsocketsMessage message) {
StaticJsonDocument<192> doc;
DeserializationError error = deserializeJson(doc, message.data());
if(error) return;

    // Проверяем сообщение об успешной идентификации
    if(doc["type"] == "system" && doc["status"] == "connected") {
        isIdentified = true;
        Serial.println("Successfully identified!");
        sendLogMessage("ESP connected and identified");
        return;
    }

    const char* command = doc["command"];
    if(!command) return;

    if(strcmp(command, "motor_a_forward") == 0) {
        digitalWrite(in1, HIGH);
        digitalWrite(in2, LOW);
    }
    else if(strcmp(command, "motor_a_backward") == 0) {
        digitalWrite(in1, LOW);
        digitalWrite(in2, HIGH);
    }
    else if(strcmp(command, "motor_b_forward") == 0) {
        digitalWrite(in3, HIGH);
        digitalWrite(in4, LOW);
    }
    else if(strcmp(command, "motor_b_backward") == 0) {
        digitalWrite(in3, LOW);
        digitalWrite(in4, HIGH);
    }
    else if(strcmp(command, "set_speed") == 0) {
        const char* motor = doc["params"]["motor"];
        int speed = doc["params"]["speed"];
        if(strcmp(motor, "A") == 0) analogWrite(enA, speed);
        else if(strcmp(motor, "B") == 0) analogWrite(enB, speed);
    }
    else if(strcmp(command, "stop") == 0) {
        stopMotors();
    }
    else if(strcmp(command, "heartbeat2") == 0) {
        lastHeartbeat2Time = millis();
        return;
    }

    if(strcmp(command, "heartbeat2") != 0) {
        sendCommandAck(command);
    }
}

void onEventsCallback(WebsocketsEvent event, String data) {
if(event == WebsocketsEvent::ConnectionOpened) {
Serial.println("Connection opened");
}
else if(event == WebsocketsEvent::ConnectionClosed) {
Serial.println("Connection closed");
if(wasConnected) {
wasConnected = false;
isIdentified = false;
stopMotors();
}
}
else if(event == WebsocketsEvent::GotPing) {
client.pong();
}
}

void setup() {
Serial.begin(115200);

    // Подключение к WiFi
    WiFi.begin(ssid, password);
    while(WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nWiFi connected");
    
    // Настройка WebSocket
    client.onMessage(onMessageCallback);
    client.onEvent(onEventsCallback);
    
    // Первое подключение
    connectToServer();

    // Инициализация моторов
    pinMode(enA, OUTPUT);
    pinMode(enB, OUTPUT);
    pinMode(in1, OUTPUT);
    pinMode(in2, OUTPUT);
    pinMode(in3, OUTPUT);
    pinMode(in4, OUTPUT);
    stopMotors();
}

void loop() {
if(!client.available()) {
if(millis() - lastReconnectAttempt > 5000) {
lastReconnectAttempt = millis();
connectToServer();
}
} else {
client.poll();

        // Heartbeat каждые 10 секунд (только после идентификации)
        if(isIdentified && millis() - lastHeartbeatTime > 10000) {
            lastHeartbeatTime = millis();
            sendLogMessage("Heartbeat - OK");
        }

        // Проверка Heartbeat2
        if(millis() - lastHeartbeat2Time > 2000) {
            stopMotors();
        }

        // Повторная идентификация, если еще не идентифицировались
        if(!isIdentified && millis() - lastReconnectAttempt > 2000) {
            identifyDevice();
        }
    }
}


[env:nodemcuv2]
monitor_speed = 115200
upload_port = COM4
platform = espressif8266
board = nodemcuv2
framework = arduino
lib_deps =
gilmaimon/ArduinoWebsockets@^0.5.3
bblanchon/ArduinoJson@^6.19.4
arminjo/ServoEasing@^2.4.0


мне нужно для теста чтобы сервопривод ServoEasing Servo1; поворачивался туда сюда с задержкой 3 секунды

//servo - походу в setup
#if defined(__AVR_ATmega32U4__) || defined(SERIAL_USB) || defined(SERIAL_PORT_USBVIRTUAL)  || defined(ARDUINO_attiny3217)
delay(4000); // To be able to connect Serial monitor after reset or power up and before first print out. Do not wait for an attached Serial Monitor!
#endif

if (Servo1.attach(SERVO1_PIN, START_DEGREE_VALUE) == INVALID_SERVO) {
    Serial.println(F("Error attaching servo"));
}


управление
Servo1.easeTo(messageLL,450);

дай мне main.cpp c servo test 180 и назад 180 градусов с задержкой 3 секунды на русском, 