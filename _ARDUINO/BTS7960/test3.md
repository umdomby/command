# Тестовый код для проверки реверса

#include <Arduino.h>

#define AIN1 D1
#define AIN2 D2
#define BIN1 D3
#define BIN2 D4

void setup() {
pinMode(AIN1, OUTPUT);
pinMode(AIN2, OUTPUT);
pinMode(BIN1, OUTPUT);
pinMode(BIN2, OUTPUT);
analogWriteFreq(1000);
Serial.begin(115200);
}

void loop() {
Serial.println("Testing Reverse (R_PWM): Motor A & B");
analogWrite(AIN1, 0); analogWrite(AIN2, 128); // Мотор A: R_PWM
analogWrite(BIN1, 0); analogWrite(BIN2, 128); // Мотор B: R_PWM
delay(2000);
Serial.println("Testing Forward (L_PWM): Motor A & B");
analogWrite(AIN1, 128); analogWrite(AIN2, 0); // Мотор A: L_PWM
analogWrite(BIN1, 128); analogWrite(BIN2, 0); // Мотор B: L_PWM
delay(2000);
}