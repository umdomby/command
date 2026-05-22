https://chatgpt.com/c/67d5fdb6-bce8-800b-af99-a1893ecd9b46

# Если сертификат истёк, обновляем вручную:
docker-compose run --rm certbot certonly --webroot --webroot-path=/var/www/certbot -d anybet.site
docker-compose restart nginx

# Чтобы установить NGINX в Docker, нужно создать Docker контейнер с NGINX либо использовать уже готовый образ. Вот два способа:

##  Способ 1: Использование готового образа (рекомендуется)
Docker Hub предоставляет официальный образ NGINX.
Скачайте и запустите контейнер с NGINX:
```
docker run --name my-nginx -d -p 8080:80 nginx
```
--name my-nginx — Название контейнера.
-d — Запуск в фоновом режиме.
-p 8080:80 — Проброс порта 80 контейнера на порт 8080 хоста.
nginx — Имя образа, который будет загружен из Docker Hub.

Проверьте, что контейнер работает:
```
docker ps
```
Откройте в браузере: http://localhost:8080

## ✅ Способ 2: Создание своего Dockerfile (настройка под себя)
1. Создайте папку с именем вашего проекта, например my-nginx-app и перейдите в неё:
```
mkdir my-nginx-app && cd my-nginx-app
```

2. Создайте файл Dockerfile:
```
# Используем официальный образ NGINX
FROM nginx:latest

# Копируем конфиги или HTML файлы в контейнер
COPY ./html /usr/share/nginx/html

# Копируем свой конфиг (если нужно изменить стандартный)
# COPY ./nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

3. Создайте папку html и добавьте туда файл index.html (пример):
```
<!DOCTYPE html>
<html>
<head>
    <title>NGINX в Docker</title>
</head>
<body>
    <h1>NGINX работает через Docker!</h1>
</body>
</html>
```

4. Соберите образ:
```
docker build -t my-nginx-image .
```

5. Запустите контейнер:
```
docker run --name my-nginx-container -d -p 8080:80 my-nginx-image
```

📌 Полезные команды:
Остановить контейнер: ``` docker stop my-nginx ```
Запустить контейнер заново: ``` docker start my-nginx ```
Удалить контейнер: ``` docker rm my-nginx ```
Удалить образ: ``` docker rmi my-nginx-image ```
