🔐 NGINX с Let's Encrypt (SSL) и автоматическим обновлением сертификатов
📂 Структура проекта:

my-ssl-nginx/
├── docker-compose.yml
├── nginx/
│   └── nginx.conf
├── site1/
│   └── index.html
├── site2/
│   └── index.html

📌 1. Кастомный конфиг NGINX (nginx/nginx.conf)
```
events {}

http {
    # Указываем путь к сертификатам
    ssl_certificate_key /etc/letsencrypt/live/site1.local/privkey.pem;
    ssl_certificate /etc/letsencrypt/live/site1.local/fullchain.pem;

    ssl_certificate_key /etc/letsencrypt/live/site2.local/privkey.pem;
    ssl_certificate /etc/letsencrypt/live/site2.local/fullchain.pem;

    # Сайт 1
    server {
        listen 80;
        server_name site1.local;
        
        # Редирект с HTTP на HTTPS
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl;
        server_name site1.local;

        location / {
            root /usr/share/nginx/html/site1;
            index index.html;
        }
    }

    # Сайт 2
    server {
        listen 80;
        server_name site2.local;

        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl;
        server_name site2.local;

        location / {
            root /usr/share/nginx/html/site2;
            index index.html;
        }
    }
}
```
📌 2. Создание docker-compose.yml
```
version: '3'
services:
  nginx:
    image: nginx:latest
    container_name: my-ssl-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./site1:/usr/share/nginx/html/site1
      - ./site2:/usr/share/nginx/html/site2
      - ./certbot/conf:/etc/letsencrypt  # Храним сертификаты
      - ./certbot/www:/var/www/certbot    # Для подтверждения домена
    networks:
      - my_network

  certbot:
    image: certbot/certbot
    container_name: certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    networks:
      - my_network

networks:
  my_network:
```
📌 3. Генерация SSL-сертификатов с Certbot
Сначала запусти nginx контейнер: ``` docker-compose up -d nginx ```

Теперь выполни команду для каждого домена (site1.local и site2.local):
```
docker-compose run --rm certbot certonly --webroot -w /var/www/certbot -d site1.local
docker-compose run --rm certbot certonly --webroot -w /var/www/certbot -d site2.local
```

Это создаст сертификаты, которые будут храниться в папке ./certbot/conf.

📌 4. Автоматическое обновление сертификатов (cron)
Добавим задачу, которая будет обновлять сертификаты каждые 12 часов:  ``` docker-compose run --rm certbot renew ```

Чтобы автоматизировать процесс, можно добавить команду в планировщик задач cron. Например:
``` 
0 */12 * * * docker-compose run --rm certbot renew && docker-compose exec nginx nginx -s reload
```
📌 5. Обновление hosts файла (для локального теста)
В файле /etc/hosts (Linux/Mac) или C:\Windows\System32\drivers\etc\hosts (Windows):
127.0.0.1 site1.local
127.0.0.1 site2.local

📌 6. Перезапуск NGINX с новыми сертификатами:
```
docker-compose down
docker-compose up -d
```
📌 7. Проверка SSL-сертификатов:
Попробуй открыть:

https://site1.local
https://site2.local


# Хочешь, чтобы я добавил еще больше сайтов и показал, как управлять конфигами NGINX динамически без перезапуска контейнера? 😊




