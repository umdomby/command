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

    // Плавное увеличение скорости вперед (8 секунд)
    for (int speed = 0; speed <= 255; speed += 2) {
        analogWrite(AIN1, speed); // Мотор A вперед
        analogWrite(AIN2, 0);
        analogWrite(BIN1, speed); // Мотор B вперед
        analogWrite(BIN2, 0);
        delay(62); // 8000 мс / 128 шагов = ~62 мс на шаг
    }

    // Плавное уменьшение скорости назад (8 секунд)
    for (int speed = 255; speed >= 0; speed -= 2) {
        analogWrite(AIN1, 0); // Мотор A назад
        analogWrite(AIN2, speed);
        analogWrite(BIN1, 0); // Мотор B назад
        analogWrite(BIN2, speed);
        delay(62); // 8000 мс / 128 шагов = ~62 мс на шаг
    }
}