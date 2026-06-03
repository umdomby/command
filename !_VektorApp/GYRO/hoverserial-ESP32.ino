// *******************************************************************
//  ESP32-S3 code for Hoverboard Firmware Hack
//  Подключение: GPIO15(RX) -> Hoverboard TX (зеленый)
//              GPIO16(TX) -> Hoverboard RX (желтый)
//              GND -> GND
// *******************************************************************

// ########################## DEFINES ##########################
#define HOVER_SERIAL_BAUD   115200
#define SERIAL_BAUD         115200
#define START_FRAME         0xABCD
#define TIME_SEND           100
#define SPEED_MAX_TEST      600
#define SPEED_STEP          20

// ====================== ESP32-S3: HardwareSerial ======================
HardwareSerial HoverSerial(1);  // Serial1

// ====================== STRUCTURES ======================
typedef struct {
   uint16_t start;
   int16_t  steer;
   int16_t  speed;
   uint16_t checksum;
} SerialCommand;
SerialCommand Command;

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
SerialFeedback NewFeedback;

// Global variables
uint8_t idx = 0;
uint16_t bufStartFrame = 0;
byte *p;
byte incomingByte;
byte incomingBytePrev;

// ########################## SETUP ##########################
void setup()
{
  Serial.begin(SERIAL_BAUD);
  Serial.println("Hoverboard ESP32-S3 v1.0");

  // ESP32-S3: Serial1, RX=15, TX=16
  HoverSerial.begin(HOVER_SERIAL_BAUD, SERIAL_8N1, 15, 16);

  pinMode(LED_BUILTIN, OUTPUT);
}

// ########################## SEND ##########################
void Send(int16_t uSteer, int16_t uSpeed)
{
  Command.start    = START_FRAME;
  Command.steer    = uSteer;
  Command.speed    = uSpeed;
  Command.checksum = Command.start ^ Command.steer ^ Command.speed;

  HoverSerial.write((uint8_t *)&Command, sizeof(Command));
}

// ########################## RECEIVE ##########################
void Receive()
{
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

        // ВЫВОД ВСЕХ ДАННЫХ С ГИРОСКУТЕРА
        Serial.print("1: ");   Serial.print(Feedback.cmd1);
        Serial.print("  2: ");  Serial.print(Feedback.cmd2);
        Serial.print("  SpeedR: ");  Serial.print(Feedback.speedR_meas);
        Serial.print("  SpeedL: ");  Serial.print(Feedback.speedL_meas);
        Serial.print("  Bat: ");  Serial.print(Feedback.batVoltage / 100.0, 1);
        Serial.print("V  Temp: ");  Serial.println(Feedback.boardTemp / 10.0, 1);
      } else {
        Serial.println("Checksum error");
      }
      idx = 0;
    }

    incomingBytePrev = incomingByte;
  }
}

// ########################## LOOP ##########################
unsigned long iTimeSend = 0;
int iTest = 0;
int iStep = SPEED_STEP;

void loop()
{
  unsigned long timeNow = millis();

  // ВСЕГДА читаем данные с гироскутера
  Receive();

  // Отправка команд
  if (iTimeSend <= timeNow) {
    iTimeSend = timeNow + TIME_SEND;
    Send(0, iTest);

    // Calculate test command signal
    iTest += iStep;

    // invert step if reaching limit
    if (iTest >= SPEED_MAX_TEST || iTest <= -SPEED_MAX_TEST)
      iStep = -iStep;

    // Blink the LED
    digitalWrite(LED_BUILTIN, (timeNow % 2000) < 1000);
  }
}