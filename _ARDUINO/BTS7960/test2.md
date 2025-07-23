#include <Arduino.h>

// Пины для управления моторами (совместимо с BTS7960 или DRV8833)
#define AIN1 D1 // Прямое вращение мотора A
#define AIN2 D2 // Обратное вращение мотора A
#define BIN1 D3 // Прямое вращение мотора B
#define BIN2 D4 // Обратное вращение мотора B

// Параметры
const int maxSpeed = 255; // Максимальная скорость (0–255 для ШИМ)
const int minSpeed = 0;   // Минимальная скорость
const int speedStep = 5;  // Шаг изменения скорости
const int delayTime = 50; // Задержка между шагами (в миллисекундах)

int currentSpeed = minSpeed; // Текущая скорость
bool increasing = true;      // Флаг направления изменения скорости
bool forward = true;         // Флаг направления вращения (true: вперед, false: назад)

void setup() {
// Инициализация пинов
pinMode(AIN1, OUTPUT);
pinMode(AIN2, OUTPUT);
pinMode(BIN1, OUTPUT);
pinMode(BIN2, OUTPUT);

// Установка частоты ШИМ (10 кГц для BTS7960)
analogWriteFreq(10000);

// Начальная остановка моторов
analogWrite(AIN1, 0);
analogWrite(AIN2, 0);
analogWrite(BIN1, 0);
analogWrite(BIN2, 0);

Serial.begin(115200);
Serial.println("Motor control started");
}

void loop() {
// Вращение вперед
analogWrite(AIN1, 0); // Мотор A вперед
analogWrite(AIN2, 255);
analogWrite(BIN1, 0); // Мотор B вперед
analogWrite(BIN2, 255);

}