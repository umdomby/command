Apache Kafka — это распределенная платформа потоковой передачи данных, которая может быть использована для обработки и передачи больших объемов данных в реальном времени. Интеграция Kafka в ваш проект может быть полезна для обработки событий, логирования, аналитики и других задач, связанных с потоками данных.
Шаги для интеграции Kafka
Установите Kafka и Zookeeper.
Настройте Kafka в Docker.
Установите клиент Kafka для Node.js.
Используйте Kafka в вашем проекте.
1. Установка Kafka и Zookeeper
   Kafka требует Zookeeper для управления кластером. Вы можете использовать Docker для развертывания Kafka и Zookeeper.
2. Настройка Kafka в Docker
   Создайте docker-compose.yml для развертывания Kafka и Zookeeper:


    services:
    zookeeper:
    image: wurstmeister/zookeeper:3.4.6
    ports:
    - "2181:2181"
    
    kafka:
    image: wurstmeister/kafka:latest
    ports:
    - "9092:9092"
    expose:
      - "9093"
      environment:
      KAFKA_ADVERTISED_LISTENERS: INSIDE://kafka:9093,OUTSIDE://localhost:9092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: INSIDE:PLAINTEXT,OUTSIDE:PLAINTEXT
      KAFKA_LISTENERS: INSIDE://0.0.0.0:9093,OUTSIDE://0.0.0.0:9092
      KAFKA_INTER_BROKER_LISTENER_NAME: INSIDE
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      volumes:
      - /var/run/docker.sock:/var/run/docker.sock


docker ps | grep kafka
docker exec -it docker-kafka-kafka-1 bash 
kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic player-updates --from-beginning

-log
docker logs ardu1 --tail=50
docker logs docker-kafka-kafka-1


docker exec -it docker-ardu-site-ardu1-1 sh
yarn build

docker exec -it docker-kafka-kafka-1 sh
kafka-topics.sh --bootstrap-server kafka:9092 --create --topic player-updates --partitions 1 --replication-factor 1


Zookeeper (docker-kafka-zookeeper-1) 


Kafka (docker-kafka-kafka-1) 
docker exec -it docker-kafka-kafka-1 sh   
kafka-console-consumer.sh --bootstrap-server kafka:9092 --topic player-updates --from-beginning