docker exec -it docker-anybet-site-nextjs1-1 /bin/bash

apt-get update && apt-get install -y dnsutils
nslookup kafka
KAFKA_URL=172.20.0.4:9093

Non-authoritative answer:
Name:   kafka
Address: 172.20.0.6

    extra_hosts:
      - "kafka:172.20.0.6"


Если apt-get не работает в вашем контейнере (в зависимости от базового образа), попробуйте использовать apk для установки (если образ использует Alpine):
```
apk add --no-cache bind-tools
```

1. Проверьте порты Kafka
docker exec -it dd947496e6b416212185ba1b361206cd6acb73da3a57838ecaf1890cc24afc63 netstat -tuln

2. Проверка соединения внутри контейнера
docker exec -it dd947496e6b416212185ba1b361206cd6acb73da3a57838ecaf1890cc24afc63 bash
nc -zv kafka 9093

3. docker exec -it dd947496e6b416212185ba1b361206cd6acb73da3a57838ecaf1890cc24afc63 bash
echo $KAFKA_URL

-Получите IP-адрес контейнера Kafka:
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' kafka


-docker logs kafka
-ping kafka