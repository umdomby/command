213.184.249.66
docker stop $(docker ps -q)
docker start $(docker ps -a -q)

# docker network create sharednetwork
# docker network ls
# docker-compose down -v
# docker-compose up --build
# docker-compose up --build -d

# docker network create sharednetwork
# docker network ls
# docker compose down -v
# docker compose up --build
# docker compose up --build -d
- Запущенные контейнеры: 
# docker ps

# Зайди в контейнер (он у тебя называется docker-ardu-ardu-1):
docker exec -it docker-ardu-ardu-1 sh
cd /app2/public/bank
ls -la
# Выйди из контейнера (exit) и выполни:
docker logs docker-ardu-ardu-1 | grep -i error   or   docker logs --tail 100 docker-ardu-ardu-1

# NGINX
docker exec -it docker-nginx-444-nginx-1 nginx -t

# Статус Docker daemon
sudo systemctl status docker
# Логи Docker
sudo journalctl -u docker -n 100
# Права доступа к сокету
ls -l /var/run/docker.sock

- Все контейнеры (включая остановленные): 
# docker ps -a

docker stop <container_id_or_name>
# Чтобы остановить все запущенные контейнеры
docker stop $(docker ps -q)
# Удалить контейнер он должен быть остановлен
docker rm <container_id_or_name>
# Чтобы удалить все остановленные контейнеры
docker container prune
# Если контейнер всё ещё запущен и вы хотите удалить его без предварительной остановки
docker rm -f <container_id_or_name>

DOCKER COMPOSE 
# Остановить все контейнеры, запущенные через docker compose останавливает и удаляет все контейнеры, созданные для
docker compose down
# удалить образы, созданные при сборке (например, docker-go-server), выполните:
docker compose down --rmi all
# Посмотреть образы Docker
docker images
or
docker image ls
# Удалите образ по его имени или ID
docker rmi <image_id_or_name>
# Чтобы удалить все образы, которые не связаны с контейнерами
docker image prune
# Чтобы удалить все образы, включая используемые (осторожно, это удалит все образы на системе):
docker image rm $(docker image ls -q) -f





# settings
groups
# Если docker отсутствует в списке, добавьте пользователя в группу:
sudo usermod -aG docker pi
newgrp docker
export DOCKER_HOST=unix:///var/run/docker.sock

# Проверьте права доступа к сокету:
ls -l /var/run/docker.sock
```Ожидаемый вывод:
srw-rw---- 1 root docker 0 Jul 16 11:33 /var/run/docker.sock
```

groups
sudo usermod -aG docker pi
newgrp docker

- name:
- docker-start-nginx-1

Зайдите в контейнер, чтобы выполнить команду NGINX:
# docker exec -it docker-start-nginx-1 bash
# nginx -t

yarn cache clean

пересборка
# docker-compose build
# docker-compose up -d
# docker-compose exec ardu1 yarn install
# docker-compose exec ardu1 yarn build
- docker-compose exec ardu1 yarn next clear
- 
# docker-compose restart ardu

# #################
# docker-compose exec ardu1 sh
# rm -rf .next/cache
# #################

const PORT = process.env.WS_PORT || 8085; // Добавлена возможность переопределения порта

# docker exec -it docker-start-nginx-1 nginx -t
-nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
-nginx: configuration file /etc/nginx/nginx.conf test is successful

Проверка сертификатов:
# docker exec -it docker-start-nginx-1 ls /etc/letsencrypt/live/gamerecords.site/
# docker exec -it docker-start-nginx-1 cat /etc/nginx/nginx.conf
Проверьте конфиги на синтаксические ошибки:
# docker exec -it docker-start-nginx-1 nginx -t
Проверьте сертификаты вручную:
# docker exec -it docker-start-nginx-1 openssl x509 -in /etc/letsencrypt/live/gamerecords.site/fullchain.pem -text -noout

📌 Перезапуск контейнера (если вносили изменения):
# docker restart docker-start-nginx-1


Сообщение ERR_CERT_AUTHORITY_INVALID означает, что браузер не доверяет сертификату, потому что:
Сертификат не подписан доверенным центром сертификации (CA).
Сертификат самоподписанный или создан неправильно.
Домен не совпадает с указанным в сертификате.


Проверка конфигов NGINX на ошибки:
# docker exec -it docker-start-nginx-1 nginx -t
# nginx: configuration file /etc/nginx/nginx.conf test is successful
