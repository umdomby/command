# Кастомный конфиг для NGINX с docker-compose

📂 Структура проекта:

my-nginx-app/
├── docker-compose.yml
├── nginx/
│   └── nginx.conf
├── html/
│   └── index.html

📌 1. Создание кастомного конфига NGINX (nginx/nginx.conf)
Этот конфиг:

Настраивает сервер для обработки HTTP-запросов.
Пробрасывает запросы к /api/ на бэкэнд-сервер с именем backend (можно убрать, если не нужно).
```
events {}

http {
    server {
        listen 80;

        server_name localhost;

        location / {
            root /usr/share/nginx/html;
            index index.html;
        }

        # Пример проброса API-запросов на другой сервер (например, backend)
        location /api/ {
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
    container_name: my-nginx
    ports:
      - "8080:80"
    volumes:
      - ./html:/usr/share/nginx/html   # Проброс папки с HTML файлами
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf  # Проброс кастомного конфига
    networks:
      - my_network

  # Пример backend сервера (если используешь Flask, Node, etc.)
  backend:
    image: python:3.11
    container_name: backend
    command: python3 -m http.server 5000  # Простенький Python сервер
    networks:
      - my_network

networks:
  my_network:

```

📌 3. Создание простого index.html (html/index.html)
```
<!DOCTYPE html>
<html>
<head>
    <title>NGINX в Docker с docker-compose</title>
</head>
<body>
    <h1>NGINX работает через Docker Compose!</h1>
    <p>Сервер работает отлично!</p>
</body>
</html>
```

📌 4. Запуск через docker-compose
В корневой папке my-nginx-app выполни команду: ``` docker-compose up -d ``` -d — Запуск в фоновом режиме.

📌 5. Проверка работы: 
Перейди в браузере по адресу: ``` http://localhost:8080 ``` Ты должен увидеть сообщение из index.html.
Проверка проксирования запросов на backend: ``` http://localhost:8080/api/ ``` Должно вернуть стандартную страницу от Python HTTP сервера.

📌 6. Остановить и удалить контейнеры: ``` docker-compose down ```