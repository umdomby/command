

const int analogPin = A0;
const float R1 = 150000.0; // 150kΩ
const float R2 = 10000.0;  // 10kΩ

void setup() {
Serial.begin(115200);
}

void loop() {
int raw = analogRead(analogPin);  // 0–1023
float voltageAtA0 = (raw / 10023.0) * 1.0; // Приводим к 1.0 В макс
float inputVoltage = voltageAtA0 * (R1 + R2) / R2;

Serial.print("ADC raw: ");
Serial.print(raw);
Serial.print(" -> Voltage: ");
Serial.print(inputVoltage, 2); // 2 знака после запятой
Serial.println(" V");

delay(500);
}

подается ровно 12 вольт   
ADC raw: 554 -> Voltage: 0.88 V
ADC raw: 548 -> Voltage: 0.87 V

подоется 18 вольт  
ADC raw: 819 -> Voltage: 1.31 V
ADC raw: 820 -> Voltage: 1.31 V
ADC raw: 821 -> Voltage: 1.31 V

сделай расчеты чтобы вольтаж показывал правильно
абстрагируйся от ардуино примени только математический расчет с тех данных что я тебе дал

# код
```
const int analogPin = A0;

void setup() {
  Serial.begin(115200);
}

void loop() {
  int raw = analogRead(analogPin);  // 0–1023
  float inputVoltage = raw * 0.021888; // Correct scaling factor

  Serial.print("ADC raw: ");
  Serial.print(raw);
  Serial.print(" -> Voltage: ");
  Serial.print(inputVoltage, 2); // 2 decimal places
  Serial.println(" V");

  delay(500);
}
```


```
const int analogPin = A0;
const float R1 = 150000.0; // 150kΩ верхний резистор
const float R2 = 10000.0;  // 10kΩ нижний резистор
const float vRef = 5.0;    // Опорное напряжение Arduino (обычно 5В или 3.3В)

void setup() {
Serial.begin(115200);
analogReference(DEFAULT); // Установить опорное напряжение по умолчанию (5В)
}

void loop() {
int raw = analogRead(analogPin);
float inputVoltage = (raw / 731.0) * 16.0;

Serial.print("ADC raw: ");
Serial.print(raw);
Serial.print(" -> Voltage: ");
Serial.print(inputVoltage, 2);
Serial.println(" V");

delay(500);
}
```