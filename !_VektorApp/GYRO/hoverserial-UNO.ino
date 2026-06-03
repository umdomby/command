// *******************************************************************
//  Arduino Uno example code
//  for   https://github.com/EmanuelFeru/hoverboard-firmware-hack-FOC
//
//  Adapted for Arduino Uno
// *******************************************************************
// INFO:
// • Uses SoftwareSerial on pins 2 and 3 to communicate with hoverboard
// • Hardware Serial (pins 0/1) used for debugging via Serial Monitor
//
// CONFIGURATION on the hoverboard side in config.h:
// • Recommended: Serial on Right Sensor cable (short cable)
//   #define CONTROL_SERIAL_USART3
//   #define FEEDBACK_SERIAL_USART3
// *******************************************************************

#define HOVER_SERIAL_BAUD   115200
#define SERIAL_BAUD         115200
#define START_FRAME         0xABCD
#define TIME_SEND           100         // ms
#define SPEED_MAX_TEST      300
#define SPEED_STEP          20

#include <SoftwareSerial.h>

// Для Uno: RX=2, TX=3 (можно поменять при необходимости)
SoftwareSerial HoverSerial(2, 3);        // RX, TX

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
uint16_t bufStartFrame;
byte incomingByte;
byte incomingBytePrev;
byte *p;

// ====================== SETUP ======================
void setup() {
  Serial.begin(SERIAL_BAUD);
  Serial.println("Hoverboard Serial Uno v1.0");

  HoverSerial.begin(HOVER_SERIAL_BAUD);
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
  if (HoverSerial.available()) {
    incomingByte = HoverSerial.read();
    bufStartFrame = ((uint16_t)incomingByte << 8) | incomingBytePrev;
  } else {
    return;
  }

  // Debug all bytes (раскомментируй при необходимости)
  // #define DEBUG_RX
  #ifdef DEBUG_RX
    Serial.print(incomingByte);
    Serial.print(" ");
    return;
  #endif

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

  if (idx == sizeof(SerialFeedback)) {
    uint16_t checksum = NewFeedback.start ^ NewFeedback.cmd1 ^ NewFeedback.cmd2 ^
                        NewFeedback.speedR_meas ^ NewFeedback.speedL_meas ^
                        NewFeedback.batVoltage ^ NewFeedback.boardTemp ^ NewFeedback.cmdLed;

    if (NewFeedback.start == START_FRAME && checksum == NewFeedback.checksum) {
      memcpy(&Feedback, &NewFeedback, sizeof(SerialFeedback));

      Serial.print("1: ");  Serial.print(Feedback.cmd1);
      Serial.print(" 2: "); Serial.print(Feedback.cmd2);
      Serial.print(" 3: "); Serial.print(Feedback.speedR_meas);
      Serial.print(" 4: "); Serial.print(Feedback.speedL_meas);
      Serial.print(" 5: "); Serial.print(Feedback.batVoltage);
      Serial.print(" 6: "); Serial.print(Feedback.boardTemp);
      Serial.print(" 7: "); Serial.println(Feedback.cmdLed);
    } else {
      Serial.println("Non-valid data skipped");
    }
    idx = 0;
  }

  incomingBytePrev = incomingByte;
}

// ====================== LOOP ======================
unsigned long iTimeSend = 0;
int iTest = 0;
int iStep = SPEED_STEP;

void loop() {
  unsigned long timeNow = millis();

  Receive();

  if (timeNow < iTimeSend) return;
  iTimeSend = timeNow + TIME_SEND;

  Send(0, iTest);        // steer = 0, speed = iTest

  iTest += iStep;

  if (iTest >= SPEED_MAX_TEST || iTest <= -SPEED_MAX_TEST) {
    iStep = -iStep;
  }

  digitalWrite(LED_BUILTIN, (timeNow % 2000) < 1000);
}