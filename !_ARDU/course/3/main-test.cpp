#include <Arduino.h>
#include <ESP32Servo.h>

Servo myservo;
const int servoPin = 4;

void setup() {
  Serial.begin(115200);
  delay(500);
  myservo.attach(servoPin, 500, 2400);
  Serial.println("Тест одного SG90 → должен двигаться!");
  myservo.write(90);
  delay(1500);
}

void loop() {
  Serial.println("→ 0°");
  myservo.write(0);
  delay(2000);

  Serial.println("→ 90°");
  myservo.write(90);
  delay(2000);

  Serial.println("→ 180°");
  myservo.write(180);
  delay(2000);
}