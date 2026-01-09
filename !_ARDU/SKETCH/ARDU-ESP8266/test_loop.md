void loop() {
Serial.println("\n=== ТЕСТ ДРАЙВЕРА ===");

Serial.println("A вперёд 3 сек");
digitalWrite(in1, HIGH); digitalWrite(in2, LOW);
analogWrite(enA, 180);
delay(3000);
analogWrite(enA, 0);
delay(2000);

Serial.println("A назад 3 сек");
digitalWrite(in1, LOW);  digitalWrite(in2, HIGH);
analogWrite(enA, 180);
delay(3000);
analogWrite(enA, 0);
delay(2000);

Serial.println("B вперёд 3 сек");
digitalWrite(in3, HIGH); digitalWrite(in4, LOW);
analogWrite(enB, 180);
delay(3000);
analogWrite(enB, 0);
delay(2000);

Serial.println("B назад 3 сек");
digitalWrite(in3, LOW);  digitalWrite(in4, HIGH);
analogWrite(enB, 180);
delay(3000);
analogWrite(enB, 0);
delay(5000);
}