Разница между --bootstrap-server и --broker-list в Kafka:

1. --bootstrap-server (новый вариант)
   Используется в новых версиях Kafka (Kafka 0.10.0+).
   Это рекомендуемый способ подключения.
   Позволяет клиенту подключаться к любому из брокеров кластера.
   Используется для всех новых утилит Kafka, включая kafka-console-producer.sh и kafka-console-consumer.sh.
   Пример:

kafka-console-producer.sh --bootstrap-server kafka:9092 --topic my-topic


2. --broker-list (старый вариант)
   Использовался в старых версиях Kafka (до 0.10.0).
   Требует указания конкретных брокеров вручную.
   Не поддерживает автоматическое обнаружение других брокеров.
   Пример:

kafka-console-producer.sh --broker-list kafka1:9092,kafka2:9092 --topic my-topic