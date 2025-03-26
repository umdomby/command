#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ArduinoWebsockets.h>
#include <ArduinoJson.h>

const char* ssid = "Robolab124";
const char* password = "wifi123123123";
const char* websockets_server = "ws://your-server-address:8080";

using namespace websockets;

WebsocketsClient client;


void onMessageCallback(WebsocketsMessage message) {
  Serial.print("Received: ");
  Serial.println(message.data());

  DynamicJsonDocument doc(1024);
  deserializeJson(doc, message.data());

  if (doc.containsKey("command")) {
    String cmd = doc["command"];

    if (cmd == "forward") {
      // Код для движения вперёд
    } else if (cmd == "backward") {
      // Код для движения назад
    } else if (cmd == "servo") {
      int angle = doc["angle"];
    }
  }
}

void setup() {
  Serial.begin(115200);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("Connected to WiFi");

  // Инициализация ServoEasing

  client.onMessage(onMessageCallback);
  while (!client.connect(websockets_server)) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("Connected to WebSocket");

  client.send("{\"device\":\"esp8266\",\"id\":\"995511\"}");
}

void loop() {
  client.poll();
}