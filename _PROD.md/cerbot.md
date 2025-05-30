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
sudo curl http://localhost/.well-known/acme-challenge/test
sudo curl http://ardua.site/.well-known/acme-challenge/test

# Убедитесь, что /var/www/certbot существует и доступен:
sudo docker exec -it docker-nginx_nginx_1 ls -la /var/www/certbot

# Получение сертификатов с помощью Certbot
sudo docker exec -it docker-nginx_certbot_1 certbot certonly --webroot -w /var/www/certbot -d ardua.site --email umdom2@gmail.com --agree-tos --no-eff-email --force-renewal

# Альтернативный способ: использование --standalone (если NGINX мешает)
sudo docker exec -it docker-nginx_certbot_1 certbot certonly --standalone -d ardua.site --email umdom2@gmail.com --agree-tos --no-eff-email

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


sudo apt update
sudo apt install net-tools
sudo netstat -tulnp | grep -E "80|443|3478|5349|49152|49800"
sudo ss -tulnp | grep 3001
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
sudo kill -9 `sudo lsof -t -i:3001`  or  sudo kill -9 $(sudo lsof -t -i:9001)
sudo kill -9 `sudo lsof -t -i:8081`
