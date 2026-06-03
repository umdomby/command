// *******************************************************************
// ESP32 example code for Hoverboard Firmware Hack (Eferu FOC)
// Pins: RX=16, TX=17
// *******************************************************************

#define HOVER_SERIAL_BAUD   115200
#define SERIAL_BAUD         115200
#define START_FRAME         0xABCD
#define TIME_SEND           100      // ms
#define SPEED_MAX_TEST      300
#define SPEED_STEP          20

// ====================== HARDWARE SERIAL ======================
HardwareSerial HoverSerial(2);   // Serial2 на ESP32

// ====================== STRUCTURES ======================
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

SerialCommand Command;
SerialFeedback Feedback;
SerialFeedback NewFeedback;

// Global variables
uint8_t idx = 0;
uint16_t bufStartFrame = 0;
byte *p;
byte incomingByte;
byte incomingBytePrev;

// ====================== SETUP ======================
void setup() {
  Serial.begin(SERIAL_BAUD);           // Для отладки в Serial Monitor
  Serial.println("Hoverboard ESP32 Serial Control v1.0");

  HoverSerial.begin(HOVER_SERIAL_BAUD, SERIAL_8N1, 16, 17);  // RX=16, TX=17

  pinMode(LED_BUILTIN, OUTPUT);
}

// ====================== SEND ======================
void Send(int16_t uSteer, int16_t uSpeed) {
  Command.start    = START_FRAME;
  Command.steer    = uSteer;
  Command.speed    = uSpeed;
  Command.checksum = Command.start ^ Command.steer ^ Command.speed;

  HoverSerial.write((uint8_t *)&Command, sizeof(Command));
}

// ====================== RECEIVE ======================
void Receive() {
  while (HoverSerial.available()) {
    incomingByte = HoverSerial.read();

    bufStartFrame = ((uint16_t)incomingByte << 8) | incomingBytePrev;

    if (bufStartFrame == START_FRAME) {
        p = (byte *)&NewFeedback;
        *p++ = incomingBytePrev;
        *p++ = incomingByte;
        idx = 2;
    }
    else if (idx >= 2 && idx < sizeof(SerialFeedback)) {
        *p++ = incomingByte;
        idx++;
    }

    // Check if full packet received
    if (idx == sizeof(SerialFeedback)) {
        uint16_t checksum = NewFeedback.start ^ NewFeedback.cmd1 ^ NewFeedback.cmd2 ^
                            NewFeedback.speedR_meas ^ NewFeedback.speedL_meas ^
                            NewFeedback.batVoltage ^ NewFeedback.boardTemp ^ NewFeedback.cmdLed;

        if (NewFeedback.start == START_FRAME && checksum == NewFeedback.checksum) {
            memcpy(&Feedback, &NewFeedback, sizeof(SerialFeedback));

            // Вывод в монитор
            Serial.print("1: "); Serial.print(Feedback.cmd1);
            Serial.print("  2: "); Serial.print(Feedback.cmd2);
            Serial.print("  SpeedR: "); Serial.print(Feedback.speedR_meas);
            Serial.print("  SpeedL: "); Serial.print(Feedback.speedL_meas);
            Serial.print("  Bat: "); Serial.print(Feedback.batVoltage / 100.0, 1);
            Serial.print("V  Temp: "); Serial.println(Feedback.boardTemp / 10.0, 1);
        } else {
            Serial.println("Checksum error");
        }
        idx = 0;
    }

    incomingBytePrev = incomingByte;
  }
}

// ====================== LOOP ======================
unsigned long iTimeSend = 0;
int iTest = 0;
int iStep = SPEED_STEP;

void loop() {
  Receive();   // приём данных от hoverboard

  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();

    if (cmd == "f" || cmd == "F")      Send(0, 20);   // вперёд
    else if (cmd == "b" || cmd == "B") Send(0, -20);  // назад
    else if (cmd == "s" || cmd == "S") Send(0, 0);     // стоп
    else if (cmd == "r")               Send(45, 0);   // поворот вправо
    else if (cmd == "l")               Send(-30, 0);  // поворот влево
    else {
      Serial.println("Команды: f = вперед, b = назад, s = стоп, r = право, l = лево");
    }
  }
}

// f → вперёд
// b → назад
// s → стоп
// r / l → поворот