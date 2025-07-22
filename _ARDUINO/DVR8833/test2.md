#include <Arduino.h>

// Пины для DRV8833
#define AIN1 D1 // Мотор A, прямое вращение
#define AIN2 D2 // Мотор A, обратное вращение
#define BIN1 D3 // Мотор B, прямое вращение
#define BIN2 D4 // Мотор B, обратное вращение

void setup() {
// Инициализация пинов
pinMode(AIN1, OUTPUT);
pinMode(AIN2, OUTPUT);
pinMode(BIN1, OUTPUT);
pinMode(BIN2, OUTPUT);
analogWriteFreq(1000); // Частота ШИМ 1 кГц
}

void loop() {
int speeds[] = {0, 50, 150, 255}; // Скорости для прямого и обратного вращения

    // Прямое вращение (0, 50, 150, 255)
    for (int i = 0; i < 4; i++) {
        analogWrite(AIN1, speeds[i]); // Мотор A вперед
        analogWrite(AIN2, 0);
        analogWrite(BIN1, speeds[i]); // Мотор B вперед
        analogWrite(BIN2, 0);
        delay(3000); // 3 секунды на каждую скорость
    }

    // Обратное вращение (255, 150, 50, 0)
    for (int i = 3; i >= 0; i--) {
        analogWrite(AIN1, 0); // Мотор A назад
        analogWrite(AIN2, speeds[i]);
        analogWrite(BIN1, 0); // Мотор B назад
        analogWrite(BIN2, speeds[i]);
        delay(3000); // 3 секунды на каждую скорость
    }
}