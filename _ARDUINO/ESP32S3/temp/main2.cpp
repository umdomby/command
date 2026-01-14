#include <Arduino.h>
#include <WiFi.h>
#include <WebSocketsClient.h>  // Links2004
#include <ServoEasing.hpp>

// Пины для ESP32-S3
#define PIN_ENA     18
#define PIN_IN1     19
#define PIN_IN2     20
#define PIN_IN3     21
#define PIN_IN4     17
#define PIN_ENB     15
#define PIN_RELAY   16      // active LOW
#define PIN_SERVO1  13
#define PIN_SERVO2  14
#define PIN_VOLTAGE 4

// Настройки
const char* ssid       = "Robolab124";
const char* password   = "wifi123123123";
const char* ws_host    = "a.ardu.live";
const uint16_t ws_port = 444;
const char* ws_path    = "/wsar";
const char* DEVICE_ID  = "9999999999999999";  // 16 символов


#define PWM_FREQ    400     // 25 кГц — хороший компромисс (тишина + нормальная работа моторов)
#define PWM_RES     8         // 8 бит → значения 0..255 как раньше
unsigned long lastDebug = 0;

ServoEasing Servo1, Servo2;
WebSocketsClient client;

bool identified = false;
unsigned long lastStatusTx = 0;
unsigned long lastClientHbTime = 0;
bool enableMotorProtection = false;

unsigned long now = millis();
unsigned long nowcmd = millis();

// Типы сообщений
#define CMD_IDENTIFY       0x01
#define CMD_CLIENT_TYPE    0x02
#define CMD_HEARTBEAT      0x10
#define CMD_HBT_MOTOR      0x11
#define CMD_MOTOR          0x20
#define CMD_SERVO_ABS      0x30
#define CMD_RELAY          0x40
#define CMD_ALARM          0x41

#define RSP_FULL_STATUS    0x50
#define RSP_ACK            0x51

// ────────────────────────────────────────────────────────────────
void sendBinary(const uint8_t* data, size_t len) {
  if (client.isConnected()) {
    client.sendBIN(data, len);
  }
}

void sendFullStatus() {
  uint8_t buf[9] = {0};
  buf[0] = RSP_FULL_STATUS;
  buf[1] = (digitalRead(PIN_RELAY) == LOW) ? 1 : 0;
  buf[2] = Servo1.read();
  buf[3] = Servo2.read();

  int raw = analogRead(PIN_VOLTAGE);
  buf[4] = highByte(raw);
  buf[5] = lowByte(raw);

  buf[6] = 0;
  buf[7] = 0;
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
      Serial.printf("[WS] Connected to url: %s\n", payload);

      // Тип клиента
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
      nowcmd = millis();
      uint8_t cmd = payload[0];
      Serial.printf("Получено бинарное: cmd=0x%02X, len=%d  ", cmd, length);

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
        {
            if (length < 5) {
                Serial.println("→ CMD_MOTOR: слишком короткое");
                break;
            }

            char motor = payload[1];
            uint8_t speed = payload[2];
            uint8_t dir   = payload[3];

            Serial.printf("→ MOTOR %c: speed=%d, dir=%d\n", motor, speed, dir);

            uint8_t inPin1 = (motor == 'A') ? PIN_IN1 : PIN_IN3;
            uint8_t inPin2 = (motor == 'A') ? PIN_IN2 : PIN_IN4;

            // направление
            if (dir == 1) {
                digitalWrite(inPin1, HIGH);
                digitalWrite(inPin2, LOW);
            } else if (dir == 2) {
                digitalWrite(inPin1, LOW);
                digitalWrite(inPin2, HIGH);
            } else {
                digitalWrite(inPin1, LOW);
                digitalWrite(inPin2, LOW);
                speed = 0;           // стоп → принудительно 0
            }

            // скорость (уже с ledcWrite из предыдущего совета)
            if (motor == 'A') {
                ledcWrite(0, speed);
            } else {
                ledcWrite(1, speed);
            }

            lastClientHbTime = millis();
            enableMotorProtection = true;
        }
        break;
      }
  }
}

// ────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println("\n=== Binary Protocol 2026 with HBT_MOTOR на ESP32-S3 ===\n");

  Servo1.attach(PIN_SERVO1, 90);
  Servo2.attach(PIN_SERVO2, 90);
  Servo1.write(90);
  Servo2.write(90);

  pinMode(PIN_ENA, OUTPUT);
  pinMode(PIN_ENB, OUTPUT);
  pinMode(PIN_IN1, OUTPUT);
  pinMode(PIN_IN2, OUTPUT);
  pinMode(PIN_IN3, OUTPUT);
  pinMode(PIN_IN4, OUTPUT);
  pinMode(PIN_RELAY, OUTPUT);
  digitalWrite(PIN_RELAY, HIGH);

  stopMotors();

  digitalWrite(PIN_IN1, LOW);
  digitalWrite(PIN_IN2, LOW);
  digitalWrite(PIN_IN3, LOW);
  digitalWrite(PIN_IN4, LOW);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  Serial.print("WiFi ");
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
  }
  Serial.printf("\nIP: %s\n", WiFi.localIP().toString().c_str());

  client.beginSSL(ws_host, ws_port, ws_path);  // WSS подключение
  client.onEvent(webSocketEvent);
  client.setReconnectInterval(3000);  // Автоматический реконнект


  // Настраиваем PWM для обоих каналов (ENA и ENB)
  ledcSetup(0, PWM_FREQ, PWM_RES);   // канал 0 для ENA
  ledcSetup(1, PWM_FREQ, PWM_RES);   // канал 1 для ENB

  ledcAttachPin(PIN_ENA, 0);
  ledcAttachPin(PIN_ENB, 1);

  // начальное значение — моторы выключены
  ledcWrite(0, 0);
  ledcWrite(1, 0);
}

void loop() {
  client.loop();  // Делает всё: poll, reconnect, обработку событий

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi lost → reconnect");
    WiFi.reconnect();
    delay(2000);
    return;
  }

  now = millis();

  if (identified && now - lastStatusTx >= 5000  && now - nowcmd >= 2000) {
    lastStatusTx = now;
    sendFullStatus();
  }

  if (now - lastDebug > 400) {
    lastDebug = now;
    Serial.printf("PWM A: %d   PWM B: %d   Hb age: %lu ms   Prot: %d\n",
                  ledcRead(0), ledcRead(1),
                  now - lastClientHbTime,
                  enableMotorProtection);
  }

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