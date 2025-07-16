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

- Все контейнеры (включая остановленные): 
# docker ps -a

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
