213.184.249.66
docker stop $(docker ps -q)
docker start $(docker ps -a -q)

# docker-compose down -v
# docker-compose up --build

- Запущенные контейнеры: 
# docker ps

- Все контейнеры (включая остановленные): 
# docker ps -a

- name:
- docker-start-nginx-1

Зайдите в контейнер, чтобы выполнить команду NGINX:
# docker exec -it docker-start-nginx-1 bash
# nginx -t


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
