Убедитесь, что топик player-updates создан. Вы можете проверить список топиков с помощью команды:
kafka-topics.sh --list --bootstrap-server localhost:9092

Если топик отсутствует, создайте его:
kafka-topics.sh --create --topic player-updates --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1