#include <HardwareSerial.h>

HardwareSerial HoverSerial(1);  // UART1

typedef struct {
  uint16_t start;
  int16_t  steer;
  int16_t  speed;
  uint16_t checksum;
} SerialCommand;

typedef struct {
  uint16_t start;
  int16_t  cmd1;
  int16_t  cmd2;
  int16_t  speedR_meas;
  int16_t  speedL_meas;
  int16_t  batVoltage;
  int16_t  boardTemp;
  uint16_t cmdLed;
  uint16_t checksum;
} SerialFeedback;

SerialFeedback Feedback;

void setup() {
  Serial.begin(115200);
  HoverSerial.begin(115200, SERIAL_8N1, 16, 17);  // RX=16, TX=17
  Serial.println("ESP32-S3 + Hoverboard FOC");
}

void sendCommand(int16_t steer, int16_t speed) {
  SerialCommand cmd;
  cmd.start = 0xABCD;
  cmd.steer = steer;
  cmd.speed = speed;
  cmd.checksum = cmd.start ^ cmd.steer ^ cmd.speed;

  HoverSerial.write((uint8_t*)&cmd, sizeof(cmd));
}

void loop() {
  // Пример: едем вперёд с поворотом
  static int speed = 0;
  speed = (speed < 300) ? speed + 5 : 300;

  sendCommand(100, speed);   // steer, speed

  // Читаем ответ
  if (HoverSerial.available() >= sizeof(SerialFeedback)) {
    HoverSerial.readBytes((uint8_t*)&Feedback, sizeof(SerialFeedback));

    if (Feedback.start == 0xABCD) {
      Serial.printf("Speed L: %d | Speed R: %d | Bat: %.1fV | Temp: %d°C\n",
                    Feedback.speedL_meas,
                    Feedback.speedR_meas,
                    Feedback.batVoltage / 100.0,
                    Feedback.boardTemp / 10);
    }
  }

  delay(50);
}