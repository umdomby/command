#include <SPI.h>
#include <MFRC522.h>

#define RST_PIN         9        // Пин rfid модуля RST
#define SS_PIN          10       // Пин rfid модуля SS

MFRC522 rfid(SS_PIN, RST_PIN);   // Объект rfid модуля
MFRC522::MIFARE_Key key;         // Объект ключа
MFRC522::StatusCode status;      // Объект статуса

void setup() {
  Serial.begin(9600);              // Инициализация Serial
  SPI.begin();                     // Инициализация SPI
  rfid.PCD_Init();                 // Инициализация модуля
  rfid.PCD_SetAntennaGain(rfid.RxGain_max);  // Установка усиления антенны
  rfid.PCD_AntennaOff();           // Перезагружаем антенну
  rfid.PCD_AntennaOn();            // Включаем антенну
  for (byte i = 0; i < 6; i++) {   // Наполняем ключ
    key.keyByte[i] = 0xFF;         // Ключ по умолчанию 0xFFFFFFFFFFFF
  }
}

void loop() {
  // Занимаемся чем угодно

  static uint32_t rebootTimer = millis(); // Важный костыль против зависания модуля!
  if (millis() - rebootTimer >= 1000) {   // Таймер с периодом 1000 мс
    rebootTimer = millis();               // Обновляем таймер
    digitalWrite(RST_PIN, HIGH);          // Сбрасываем модуль
    delayMicroseconds(2);                 // Ждем 2 мкс
    digitalWrite(RST_PIN, LOW);           // Отпускаем сброс
    rfid.PCD_Init();                      // Инициализируем заного
  }

  if (!rfid.PICC_IsNewCardPresent()) return;  // Если новая метка не поднесена - вернуться в начало loop
  if (!rfid.PICC_ReadCardSerial()) return;    // Если метка не читается - вернуться в начало loop

  /* Аутентификация сектора, указываем блок безопасности #7 и ключ A */
  status = rfid.PCD_Authenticate(MFRC522::PICC_CMD_MF_AUTH_KEY_A, 7, &key, &(rfid.uid));
  if (status != MFRC522::STATUS_OK) {     // Если не окэй
    Serial.println("Auth error");         // Выводим ошибку
    return;
  }

  /* Чтение блока, указываем блок данных #6 */
  uint8_t dataBlock[255];                          // Буфер для чтения
  uint8_t size = sizeof(dataBlock);               // Размер буфера
  status = rfid.MIFARE_Read(6, dataBlock, &size); // Читаем 6 блок в буфер
  if (status != MFRC522::STATUS_OK) {             // Если не окэй
    Serial.println("Read error");                 // Выводим ошибку
    return;
  }

  Serial.print("Data HEX: ");                          // Выводим 16 байт в формате HEX
  for (uint8_t i = 0; i < 255; i++) {
    Serial.print("0x");
    Serial.print(dataBlock[i], HEX);
    Serial.print(", ");
  }
  Serial.println("");


  Serial.print("Data DEC: ");                          // Выводим 16 байт в формате DEC
  for (uint8_t i = 0; i < 255; i++) {
    Serial.print(dataBlock[i], DEC);
    Serial.print(", ");
  }
  Serial.println("");
  
  // Serial.print("Data ARRAY:");                          // Выводим 16 байт в формате ARRAY
  // for (uint8_t i = 0; i < 16; i++) {
  //   Serial.print(myInts[i]);
  //   Serial.print(", ");
  // }
  // Serial.println("");

  rfid.PICC_HaltA();                              // Завершаем работу с меткой
  rfid.PCD_StopCrypto1();
}