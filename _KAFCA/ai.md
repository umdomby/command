const kafkaUrl = process.env.KAFKA_URL ?? "kafka:9093"; // Значение по умолчанию

// Создаем экземпляр Kafka
const kafka = new Kafka({
clientId: 'my-app',
brokers: [kafkaUrl]
});

KAFKA_URL=kafka:9093

services:
ardu1:
build: .
working_dir: /app2
ports:
- "3003:3000"
volumes:
- .:/app2
command: ["yarn", "start"]
env_file:
- .env
networks:
- sharednetwork
restart: always
dns:
- 8.8.8.8  # Использование Google DNS
- 8.8.4.4

networks:
sharednetwork:
external: true


не может найти kafka на docker (docker работает)
services:
zookeeper:
image: zookeeper:3.8
ports:
- "2181:2181"
networks:
- sharednetwork
restart: always

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
networks:
- sharednetwork
restart: always
dns:
- 8.8.8.8  # Использование Google DNS
- 8.8.4.4

networks:
sharednetwork:
external: true