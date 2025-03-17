-copy
-sudo docker cp docker-start-certbot-1:/etc/letsencrypt/archive/anybet.site/ ./letsencrypt/archive/anybet.site/
213.184.249.66

curl http://anycoin.site/.well-known/acme-challenge/test.txt


docker exec -it docker-start-nginx-1 mkdir -p /var/www/certbot
docker exec -it docker-start-nginx-1 sh -c "echo 'test' > /var/www/certbot/test.txt"
docker exec -it docker-start-certbot-1 certbot certonly --webroot -w /var/www/certbot -d anycoin.site

docker-compose restart nginx

# copy права sudo ls -l -d ~/Projects/docker-start/letsencrypt ~/Projects/docker-start/letsencrypt/live
sudo chown -R pi:pi ~/Projects/docker-start/letsencrypt
sudo chmod -R 755 ~/Projects/docker-start/letsencrypt

📌 4. Создание самоподписанных сертификатов для локального теста:

mkdir -p ./letsencrypt/live/{gamerecords.site,anybet.site,anycoin.site,ardu.site,it-startup.site}

for site in gamerecords.site anybet.site anycoin.site ardu.site it-startup.site; do
openssl req -x509 -out ./letsencrypt/live/$site/fullchain.pem -keyout ./letsencrypt/live/$site/privkey.pem \
-newkey rsa:2048 -nodes -sha256 -subj "/CN=$site" -days 365;
done


docker run -d --name nginx -p 80:80 -p 443:443 nginx

docker run -it --rm --name certbot \
-v "/path/to/letsencrypt:/etc/letsencrypt" \
certbot/certbot certonly --standalone -d gamerecords.site

docker run -it --rm --name certbot \
-v "/path/to/letsencrypt:/etc/letsencrypt" \
certbot/certbot certonly --standalone -d ardu.site

# docker stop docker-start-nginx-1
# docker start docker-start-nginx-1
# docker restart docker-start-nginx-1


docker run -it --rm --name certbot \
-v "/path/to/letsencrypt:/etc/letsencrypt" \
-p 80:80 -p 443:443 \
certbot/certbot certonly --standalone -d it-startup.site 


docker run -it --rm --name certbot \
-v "/path/to/letsencrypt:/etc/letsencrypt" \
-p 80:80 -p 443:443 \
certbot/certbot certonly --standalone -d ardu.site

docker-compose stop nginx
docker-compose start nginx

docker cp certbot:/etc/letsencrypt/live/ardu.site ./gamerecords-site-certs

docker run -it --rm --name certbot \
-v /path/to/your/certificates:/etc/letsencrypt \
-v /path/to/your/logs:/var/log/letsencrypt \
-v /path/to/your/webroot:/var/www/html \
certbot/certbot certonly --webroot --webroot-path=/var/www/certbot -d it-startup.site


docker-compose exec certbot certbot certonly --standalone -d gamerecords.site --http-01-port=8080

sudo chown -R 1000:1000 ./letsencrypt
sudo chmod -R 755 ./letsencrypt


docker exec -it docker-start-nginx-1 mkdir -p /var/www/certbot
docker exec -it docker-start-nginx-1 sh -c "echo 'test' > /var/www/certbot/test.txt"
docker exec -it docker-start-certbot-1 certbot certonly --webroot -w /var/www/certbot -d gamerecords.site


docker-compose up -d

5. Использование DNS-01 challenge (если доступ к HTTP портам невозможен)
sudo certbot certonly --dns-cloudflare --dns-cloudflare-credentials /path/to/cloudflare.ini -d gamerecords.site
6. Если ошибка сохраняется, попробуйте выполнить команду Certbot с опцией -v (verbose), чтобы получить дополнительные детали о проблеме:
docker run -it --rm --name certbot \
-v "/path/to/letsencrypt:/etc/letsencrypt" \
certbot/certbot certonly --standalone -d gamerecords.site -v

7. log
cat /var/log/letsencrypt/letsencrypt.log


Проверьте настройки DNS: 213.184.249.66
# nslookup gamerecords.site
# nslookup ardu.site

Проверьте работу вашего сервера:
# curl http://gamerecords.site/.well-known/acme-challenge/test

Решение для WSL2:
# docker run -p 80:80 nginx

🔍 Возможные причины проблемы с SSL:
1. Неверный путь к сертификатам:
Убедитесь, что файлы сертификатов (fullchain.pem и privkey.pem) реально существуют в контейнере в папке /etc/letsencrypt/live/ВАШ_ДОМЕН/.
📌 Проверьте это командой:


docker exec -it <container_id> ls /etc/letsencrypt/live/gamerecords.site/


2. Сертификаты не скопированы в контейнер:
   Если вы используете Docker Compose, добавьте в docker-compose.yml секцию volumes для передачи сертификатов внутрь контейнера. 
Например:
```
volumes:
  - ./letsencrypt:/etc/letsencrypt
```


``` Или, если они хранятся локально:
volumes:
  - /path/to/letsencrypt:/etc/letsencrypt
```

3. Ошибки в конфигурации NGINX:
   Ваш конфиг выглядит нормально, но лучше явно указать ssl в listen, чтобы NGINX точно понял, что нужно использовать HTTPS.
```
listen 443 ssl; 
```
```
listen 443 ssl;
```

4. NGINX не перезапущен:
Если вы изменяли конфиги, убедитесь, что пересобрали и перезапустили контейнеры:
   ```docker-compose down```
   ```docker-compose up --build```
Или просто перезапустите контейнер:
   ```docker restart <container_id>```

5. Проверка синтаксиса конфигов:
   Выполните проверку на ошибки в конфигурационном файле:
```docker exec -it <container_id> nginx -t```
Если всё правильно, вы увидите: nginx: configuration file /etc/nginx/nginx.conf test is successful

6. Открытие порта 443 на WSL2:
   Если вы тестируете локально, убедитесь, что порт 443 открыт.\



docker-compose exec nginx apt-get update && apt-get install iproute2
docker-compose ps

