```
Отлично! Давай разберем, как настроить NGINX в Docker так, 
чтобы он мог обрабатывать несколько сайтов и проксировать запросы на разные контейнеры. 
Это супер удобно для разработки микросервисов или хостинга нескольких проектов.
```
🌐 NGINX с несколькими сайтами и проксированием (docker-compose)

my-multi-site-nginx/
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
    # Первое приложение (сайт)
    server {
        listen 80;
        server_name site1.local;

        location / {
            root /usr/share/nginx/html/site1;
            index index.html;
        }
    }

    # Второе приложение (сайт)
    server {
        listen 80;
        server_name site2.local;

        location / {
            root /usr/share/nginx/html/site2;
            index index.html;
        }
    }

    # Проксирование запросов к backend-сервису
    server {
        listen 80;
        server_name api.local;

        location / {
            proxy_pass http://backend:5000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
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
    container_name: my-multi-site-nginx
    ports:
      - "8080:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf  # Проброс конфига
      - ./site1:/usr/share/nginx/html/site1       # Проброс папки с HTML для site1
      - ./site2:/usr/share/nginx/html/site2       # Проброс папки с HTML для site2
    networks:
      - my_network

  backend:
    image: python:3.11
    container_name: backend
    command: python3 -m http.server 5000
    networks:
      - my_network

networks:
  my_network:
```

📌 3. Создание простых страниц для сайтов
📁 site1/index.html

```
<!DOCTYPE html>
<html>
<head>
    <title>Site 1</title>
</head>
<body>
    <h1>Добро пожаловать на Site 1!</h1>
</body>
</html>
```
```
<!DOCTYPE html>
<html>
<head>
    <title>Site 2</title>
</head>
<body>
    <h1>Добро пожаловать на Site 2!</h1>
</body>
</html>
```
📌 4. Запуск контейнеров через docker-compose ``` docker-compose up -d ```
📌 5. Проверка работы (Редактируем hosts файл)
Чтобы браузер понимал site1.local, site2.local и api.local, добавь их в файл hosts.
📁 Linux / Mac: /etc/hosts
📁 Windows: C:\Windows\System32\drivers\etc\hosts
```
127.0.0.1 site1.local
127.0.0.1 site2.local
127.0.0.1 api.local
```

📌 6. Проверка в браузере:
http://site1.local:8080 — должен показать Добро пожаловать на Site 1!
http://site2.local:8080 — должен показать Добро пожаловать на Site 2!
http://api.local:8080 — должен вернуть страницу от Python сервера.

📌 7. Остановка и удаление контейнеров: ``` docker-compose down ```




