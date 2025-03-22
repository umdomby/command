✅ Kafka запущена в контейнере:

Zookeeper (docker-kafka-zookeeper-1)
Kafka (docker-kafka-kafka-1)

✅ Топик уже создан: player-updates

Тебе нужно убедиться, что:

Продюсер может отправлять сообщения
Консумер их получает

1. Запуск консумера (прослушивание сообщений)
docker exec -it docker-kafka-kafka-1 sh
kafka-console-consumer.sh --bootstrap-server kafka:9093 --topic player-updates --from-beginning

2. Отправка тестового сообщения (проверяем продюсер)
# docker exec -it docker-kafka-kafka-1 sh 
# kafka-console-producer.sh --broker-list kafka:9093 --topic player-updates
# Hello Kafka!

-Если ничего не работает, можно посмотреть логи контейнера:
docker logs docker-kafka-kafka-1 --tail 50

21. Если хочешь протестировать отправку сообщений в player-updates, попробуй:
docker exec -it docker-kafka-kafka-1 sh
kafka-console-producer.sh --bootstrap-server kafka:9093 --topic player-updates

3.
538613ba3e51   wurstmeister/kafka:latest     "start-kafka.sh"   Up 33 minutes   0.0.0.0:9092->9092/tcp, 9093/tcp
Это значит, что Kafka доступна снаружи на localhost:9092, а внутри Docker-сети она работает на kafka:9092.

Порт 9093 тоже открыт, но он не используется по умолчанию. 
В wurstmeister/kafka его часто применяют для внешних подключений (например, если Kafka настроена с SSL или несколькими брокерами).


4. Какой порт указывать в --bootstrap-server?
Если ты работаешь внутри контейнера Kafka, используй:
kafka-console-consumer.sh --bootstrap-server kafka:9092 --topic player-updates --from-beginning

Если ты запускаешь Kafka CLI на хост-машине (вне Docker), попробуй:
kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic player-updates --from-beginning

5. Как проверить, на каком порту реально слушает Kafka? 
netstat -tulnp | grep LISTEN