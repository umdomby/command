Serial.println("Вперёд 1 секунд");
digitalWrite(PIN_IN1, HIGH);
digitalWrite(PIN_IN2, LOW);
analogWrite(PIN_ENA, 150);

digitalWrite(PIN_IN3, HIGH);
digitalWrite(PIN_IN4, LOW);
analogWrite(PIN_ENB, 150);
delay(1000);

Serial.println("Стоп 1 секунды");
stopMotors();
delay(1000);

Serial.println("Назад 1 секунд");
digitalWrite(PIN_IN1, LOW);
digitalWrite(PIN_IN2, HIGH);
analogWrite(PIN_ENA, 150);

digitalWrite(PIN_IN3, LOW);
digitalWrite(PIN_IN4, HIGH);
analogWrite(PIN_ENB, 150);
delay(1000);

analogWrite(PIN_ENA, 0);
analogWrite(PIN_ENB, 0);

digitalWrite(PIN_IN1, LOW);
digitalWrite(PIN_IN2, LOW);
digitalWrite(PIN_IN3, LOW);
digitalWrite(PIN_IN4, LOW);
