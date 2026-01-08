#include <Arduino.h>
#include <WiFi.h>
#include <WebSocketsClient.h>  // Библиотека Links2004

// Пины для BTS7960 (два мотора)
#define PIN_ENA  18   // PWM для мотора A
#define PIN_IN1  19   // Направление A (или RPWM/LPWM — зависит от модуля)
#define PIN_IN2  20   // Направление A
#define PIN_ENB  15   // PWM для мотора B
#define PIN_IN3  21   // Направление B
#define PIN_IN4  17   // Направление B

// Настройки WiFi и WebSocket
const char* ssid     = "Robolab124";
const char* password = "wifi123123123";
const char* ws_host  = "a.ardu.live";
const uint16_t ws_port = 444;
const char* ws_path  = "/wsar";
const char* DEVICE_ID = "9999999999999999";  // 16 символов

WebSocketsClient client;

bool identified = false;
unsigned long lastStatusTx = 0;
unsigned long lastClientHbTime = 0;
bool enableMotorProtection = false;

// Команды протокола
#define CMD_IDENTIFY       0x01
#define CMD_CLIENT_TYPE    0x02
#define CMD_HEARTBEAT      0x10
#define CMD_HBT_MOTOR      0x11
#define CMD_MOTOR          0x20

#define RSP_FULL_STATUS    0x50

// ────────────────────────────────────────────────────────────────
void sendBinary(const uint8_t* data, size_t len) {
  if (client.isConnected()) {
    client.sendBIN(data, len);
  }
}

// Отправка статуса (только RSSI, так как больше ничего нет)
void sendFullStatus() {
  uint8_t buf[9] = {0};
  buf[0] = RSP_FULL_STATUS;
  // buf[1..7] оставляем 0 (были реле, серво, напряжение)
  buf[8] = (uint8_t)constrain(WiFi.RSSI(), -128, 127);
  sendBinary(buf, sizeof(buf));
}

void stopMotors() {
  analogWrite(PIN_ENA, 0);
  analogWrite(PIN_ENB, 0);
}

// ────────────────────────────────────────────────────────────────
void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("[WS] Disconnected");
      identified = false;
      stopMotors();
      enableMotorProtection = false;
      break;

    case WStype_CONNECTED:
      Serial.printf("[WS] Connected to %s\n", payload);

      // Тип клиента (моторный контроллер)
      {
        uint8_t buf[2] = {CMD_CLIENT_TYPE, 2};
        sendBinary(buf, 2);
      }

      // Идентификация
      {
        uint8_t buf[17];
        buf[0] = CMD_IDENTIFY;
        memcpy(buf + 1, DEVICE_ID, 16);
        sendBinary(buf, 17);
      }

      identified = true;
      break;

    case WStype_BIN:
      if (length == 0) return;

      uint8_t cmd = payload[0];
      Serial.printf("Получено: cmd=0x%02X, len=%d  ", cmd, length);

      switch (cmd) {
        case CMD_HEARTBEAT:
          Serial.println("→ HEARTBEAT");
          break;

        case CMD_HBT_MOTOR:
          Serial.print("HBT_MOTOR ");
          lastClientHbTime = millis();
          enableMotorProtection = true;
          break;

        case CMD_MOTOR:
          if (length < 5) {
            Serial.println("→ CMD_MOTOR: короткое");
            break;
          }
          {
            char motor = payload[1];
            uint8_t speed = payload[2];
            uint8_t dir = payload[3];

            Serial.printf("→ MOTOR %c: speed=%d, dir=%d\n", motor, speed, dir);

            uint8_t pwmPin = (motor == 'A') ? PIN_ENA : PIN_ENB;
            uint8_t inPin1 = (motor == 'A') ? PIN_IN1 : PIN_IN3;
            uint8_t inPin2 = (motor == 'A') ? PIN_IN2 : PIN_IN4;

            // Управление направлением
            if (dir == 1) {          // одно направление
              digitalWrite(inPin1, HIGH);
              digitalWrite(inPin2, LOW);
            } else if (dir == 2) {   // обратное направление
              digitalWrite(inPin1, LOW);
              digitalWrite(inPin2, HIGH);
            } else {                 // стоп
              digitalWrite(inPin1, LOW);
              digitalWrite(inPin2, LOW);
            }

            analogWrite(pwmPin, speed);

            lastClientHbTime = millis();
            enableMotorProtection = true;
          }
          break;

        default:
          Serial.printf("→ НЕИЗВЕСТНО 0x%02X\n", cmd);
      }
      break;
  }
}

// ────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println("\n=== Только моторы BTS7960 + WebSocket ===\n");

  // Инициализация пинов моторов
  pinMode(PIN_ENA, OUTPUT);
  pinMode(PIN_ENB, OUTPUT);
  pinMode(PIN_IN1, OUTPUT);
  pinMode(PIN_IN2, OUTPUT);
  pinMode(PIN_IN3, OUTPUT);
  pinMode(PIN_IN4, OUTPUT);

  stopMotors();
  digitalWrite(PIN_IN1, LOW);
  digitalWrite(PIN_IN2, LOW);
  digitalWrite(PIN_IN3, LOW);
  digitalWrite(PIN_IN4, LOW);

  // Подключение WiFi
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("WiFi ");
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
  }
  Serial.printf("\nIP: %s\n", WiFi.localIP().toString().c_str());

  // WebSocket
  client.beginSSL(ws_host, ws_port, ws_path);
  client.onEvent(webSocketEvent);
  client.setReconnectInterval(3000);
}

void loop() {
  client.loop();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi lost → reconnect");
    WiFi.reconnect();
    delay(2000);
    return;
  }

  unsigned long now = millis();

  // Отправка статуса каждые 30 секунд
  if (identified && now - lastStatusTx >= 30000) {
    lastStatusTx = now;
    sendFullStatus();
  }

  // Защита от потери HBT_MOTOR
  if (identified && enableMotorProtection && now - lastClientHbTime > 700) {
    static bool warned = false;
    if (!warned) {
      Serial.println("\nHBT_MOTOR TIMEOUT → STOP MOTORS");
      warned = true;
    }
    stopMotors();
    enableMotorProtection = false;
  } else if (enableMotorProtection && now - lastClientHbTime <= 700) {
    static unsigned long lastPrint = 0;
    if (now - lastPrint > 299) {
      Serial.print("HBT_MOTOR ");
      lastPrint = now;
    }
  }
}