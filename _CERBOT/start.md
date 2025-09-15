```nginx
http {
    
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    include /etc/nginx/mime.types;
    sendfile on;
    keepalive_timeout 65;
    http2 on;

    server {
        listen 80 default_server;
        listen [::]:80 default_server;
        server_name _;

        root /usr/share/nginx/ip;
        index index.html;

        location / {
            try_files $uri $uri/ =404;
        }
    }

    server {
        listen 80;
        listen [::]:80;
        server_name ardua.site www.ardua.site;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
            try_files $uri $uri/ =404;
        }

        location / {
            return 301 https://ardua.site$request_uri;
        }
    }
}
```
sudo curl http://localhost/.well-known/acme-challenge/test.txt
sudo curl http://ardua.site/.well-known/acme-challenge/test.txt

# Убедитесь, что /var/www/certbot существует и доступен:
sudo docker exec -it docker-nginx_nginx_1 ls -la /var/www/certbot

# Получение сертификатов с помощью Certbot
sudo docker exec -it docker-nginx_certbot_1 certbot certonly --webroot -w /var/www/certbot -d ardua.site --email umdom2@gmail.com --agree-tos --no-eff-email --force-renewal

# Альтернативный способ: использование --standalone (если NGINX мешает)
sudo docker exec -it docker-nginx_certbot_1 certbot certonly --standalone -d ardua.site --email umdom2@gmail.com --agree-tos --no-eff-email

```docker-nginx-444
# Получение сертификатов с помощью Certbot
sudo docker exec -it docker-nginx-444-certbot-1 certbot certonly --webroot -w /var/www/certbot -d ardua.site --email umdom2@gmail.com --agree-tos --no-eff-email --force-renewal
sudo docker exec -it docker-nginx-444-certbot-1 certbot certonly --webroot -w /var/www/certbot -d it-startup.site --email umdom2@gmail.com --agree-tos --no-eff-email --force-renewal

# Альтернативный способ: использование --standalone (если NGINX мешает)
sudo docker exec -it docker-nginx-444-certbot-1 certbot certonly --standalone -d ardua.site --email umdom2@gmail.com --agree-tos --no-eff-email
```

Где:
    -w /var/www/certbot — путь к веб-корню, куда Certbot размещает временные файлы для проверки домена.
    -d ardua.site — ваш домен (можно указать несколько через запятую, например -d ardua.site -d www.ardua.site).
    --email — ваш email для уведомлений.
    --agree-tos — согласие с условиями Let's Encrypt.
    --no-eff-email — отказ от подписки на рассылку EFF.
    --force-renewal — принудительное обновление (если сертификат уже существует).

# проверить их наличие
ls -la ./letsencrypt/live/ardua.site/


# Проверьте логи для деталей ошибки
sudo docker logs docker-nginx_nginx_1       # Логи NGINX
sudo docker logs docker-nginx_certbot_1    # Логи Certbot
sudo cat /var/log/letsencrypt/letsencrypt.log

# 80 lighttpd
sudo netstat -tuln | grep 80
sudo lsof -i :80
sudo ps aux | grep lighttpd
sudo systemctl stop lighttpd
sudo systemctl disable lighttpd
docker exec -it docker-nginx-2-nginx-1 ls -l /var/www/certbot/.well-known/acme-challenge/  # файл есть в контейнере Nginx:

# logs
docker exec -it docker-nginx-2-nginx-1 cat /var/log/nginx/access.log
docker exec -it docker-nginx-2-nginx-1 cat /var/log/nginx/error.log
docker exec -it docker-nginx-2-certbot-1 cat /var/log/letsencrypt/letsencrypt.log

sudo apt update
sudo apt install net-tools
sudo netstat -tulnp | grep -E "80|443|3478|5349|49152|49800"
sudo ss -tulnp | grep 80
sudo ss -tulnp | grep 49891
sudo netstat -tulnp | grep ':8085'
sudo netstat -tulnp | grep ':49940'
sudo kill -9 49940
sudo netstat -ltpn
netstat -ntlp | grep LISTEN   
sudo lsof -nP -i | grep LISTEN
# Вы можете использовать lsof, чтобы увидеть, какое приложение прослушивает порт 80:
sudo lsof -i TCP:8085
sudo lsof -i TCP:3003
# Убить процесс
sudo kill -9 `sudo lsof -t -i:80`  or  sudo kill -9 $(sudo lsof -t -i:80)
sudo kill -9 `sudo lsof -t -i:80`

# autoUpdate
sudo systemctl status certbot.timer
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

cat /etc/cron.d/certbot
```Пример содержимого:
SHELL=/bin/sh
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
0 */12 * * * root certbot -q renew
```
sudo nano /etc/cron.d/certbot
add
0 */12 * * * root certbot -q renew --nginx  # для Nginx

# Тестирование автопродления
sudo certbot renew --dry-run
```Пример успешного вывода:
Congratulations, all simulated renewals succeeded:
  /etc/letsencrypt/live/your_domain/fullchain.pem (success)
```
# Проверка сертификатов
sudo certbot certificates  OR docker exec -it edea6483f3867b0fb5c7c6d67e40cfa5c26b5d31c0b5b5edb491a93bf6ac9e5a certbot certificates
```
Saving debug log to /var/log/letsencrypt/letsencrypt.log

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Found the following certs:
  Certificate Name: ardua.site
    Serial Number: 5cdfeb5725e9a1fe467e09ec0fe9dc76de0
    Key Type: ECDSA
    Domains: ardua.site
    Expiry Date: 2025-10-13 13:31:15+00:00 (VALID: 89 days)
    Certificate Path: /etc/letsencrypt/live/ardua.site/fullchain.pem
    Private Key Path: /etc/letsencrypt/live/ardua.site/privkey.pem
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
```

openssl x509 -in ./certbot/conf/live/ardua.site/fullchain.pem -text -noout
cat ./certbot/logs/letsencrypt.log
docker logs edea6483f3867b0fb5c7c6d67e40cfa5c26b5d31c0b5b5edb491a93bf6ac9e5a