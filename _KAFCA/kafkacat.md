Установите kafkacat в контейнере ardu1 и выполните команду:

docker exec -it 430c3f7877a3538342bc127bd476972536e8253305784b13d673ec8ed84f10ae /bin/bash
apt-get update && apt-get install -y kafkacat
kafkacat -b kafka:9093 -L

player-updates

kafkacat -b kafka:9093 -t player-updates -C



root@e6d6596eaa83:/# kafkacat -b kafka:9093 -t player-updates -L

    Metadata for player-updates (from broker 1001: kafka:9093/1001):
    1 brokers:
    broker 1001 at kafka:9093 (controller)
    1 topics:
    topic "player-updates" with 1 partitions:
    partition 0, leader 1001, replicas: 1001, isrs: 1001



echo "test message" | kafkacat -b kafka:9093 -t player-updates -P
kafkacat -b kafka:9093 -t player-updates -C

echo "Hello, Kafka!" | kafkacat -b kafka:9093 -t player-updates -P
kafkacat -b kafka:9093 -t player-updates -C



