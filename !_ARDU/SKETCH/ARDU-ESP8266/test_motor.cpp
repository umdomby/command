#include <Arduino.h>  // <<<--- ОБЯЗАТЕЛЬНО ДОБАВИТЬ!

// Пины для управления BTS7960 (два мотора A и B)
#define PIN_ENA  D1   // PWM для мотора A
#define PIN_IN1  D2   // Направление мотора A
#define PIN_IN2  D3   // Направление мотора A

#define PIN_ENB  D6   // PWM для мотора B
#define PIN_IN3  D4  // Направление мотора B
#define PIN_IN4  D5   // Направление мотора B


const int MOTOR_SPEED = 150;  // ~78% от максимума

void motorForward(int speed);
void motorBackward(int speed);
void stopMotors();

void setup() {
  pinMode(PIN_ENA, OUTPUT);
  pinMode(PIN_IN1, OUTPUT);
  pinMode(PIN_IN2, OUTPUT);

  pinMode(PIN_ENB, OUTPUT);
  pinMode(PIN_IN3, OUTPUT);
  pinMode(PIN_IN4, OUTPUT);

  stopMotors();

  Serial.println("Вперёд 5 секунд");
  motorForward(MOTOR_SPEED);
  delay(2000);

  Serial.println("Стоп 2 секунды");
  stopMotors();
  delay(2000);

  Serial.println("Назад 5 секунд");
  motorBackward(MOTOR_SPEED);
  delay(2000);

  Serial.println("Стоп 2 секунды");
  stopMotors();

  Serial.begin(115200);
  Serial.println("Тест управления моторами BTS7960 начат");
}

void loop() {
//   Serial.println("Вперёд 5 секунд");
//   motorForward(MOTOR_SPEED);
//   delay(2000);
//
//   Serial.println("Стоп 2 секунды");
//   stopMotors();
//   delay(2000);
//
//   Serial.println("Назад 5 секунд");
//   motorBackward(MOTOR_SPEED);
//   delay(2000);
//
//   Serial.println("Стоп 2 секунды");
//   stopMotors();
//   delay(200000);
}

void motorForward(int speed) {
  digitalWrite(PIN_IN1, HIGH);
  digitalWrite(PIN_IN2, LOW);
  analogWrite(PIN_ENA, speed);

  digitalWrite(PIN_IN3, HIGH);
  digitalWrite(PIN_IN4, LOW);
  analogWrite(PIN_ENB, speed);
}

void motorBackward(int speed) {
  digitalWrite(PIN_IN1, LOW);
  digitalWrite(PIN_IN2, HIGH);
  analogWrite(PIN_ENA, speed);

  digitalWrite(PIN_IN3, LOW);
  digitalWrite(PIN_IN4, HIGH);
  analogWrite(PIN_ENB, speed);
}

void stopMotors() {
  analogWrite(PIN_ENA, 0);
  analogWrite(PIN_ENB, 0);

  digitalWrite(PIN_IN1, LOW);
  digitalWrite(PIN_IN2, LOW);
  digitalWrite(PIN_IN3, LOW);
  digitalWrite(PIN_IN4, LOW);
}