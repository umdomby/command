Нажми ADD NEW RECORD
Type: A Record
Host: @
Value: 157.230.26.61
TTL: 5 min (или 15 min)

Добавь ещё одну запись для www:
Type: A Record
Host: www
Value: 157.230.26.61
TTL: 5 min

sudo ls /etc/nginx/sites-available/
sudo ls /etc/nginx/sites-enabled/


# Создай новый файл конфигурации:
sudo nano /etc/nginx/sites-available/engineer.space


# Активируй конфиг
sudo ln -s /etc/nginx/sites-available/engineer.space /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default   # если хочешь отключить дефолтный

# Проверь и перезапусти Nginx
sudo nginx -t                  # проверка конфигурации
sudo systemctl restart nginx



#####
####
###
# ПЕРВОЕ НАПОЛНЕНИЕ

# Создаём папку для сайта
sudo mkdir -p /var/www/engineer.space/html
sudo chown -R www-data:www-data /var/www/engineer.space

# Создаём красивую главную страницу
sudo nano /var/www/engineer.space/html/index.html
```
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>engineer.space</title>
    <style>
        body {
            margin: 0;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #1e3a8a, #3b82f6);
            font-family: Arial, sans-serif;
            color: white;
        }
        .content {
            text-align: center;
        }
        h1 {
            font-size: 4.5rem;
            margin: 0;
            font-weight: bold;
        }
        p {
            font-size: 1.4rem;
            opacity: 0.9;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="content">
        <h1>engineer.space</h1>
        <p>Добро пожаловать</p>
    </div>
</body>
</html>
```

# Настраиваем Nginx
sudo nano /etc/nginx/sites-available/engineer.space

# Вставь это:
```
server {
listen 80;
server_name engineer.space www.engineer.space;

    root /var/www/engineer.space/html;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

# Активируем конфиг и перезапускаем
sudo ln -s /etc/nginx/sites-available/engineer.space /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default   
sudo nginx -t
sudo systemctl restart nginx


##### 2 site
####
###
##
#
# Создаём папку для нового сайта
sudo mkdir -p /var/www/enginer.online/html
sudo chown -R www-data:www-data /var/www/enginer.online

# Создаём главную страницу
sudo nano /var/www/enginer.online/html/index.html

```
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>enginer.online</title>
    <style>
        body {
            margin: 0;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #1e40af, #60a5fa);
            font-family: Arial, sans-serif;
            color: white;
        }
        .content {
            text-align: center;
        }
        h1 {
            font-size: 4.8rem;
            margin: 0;
            font-weight: bold;
            text-shadow: 0 4px 15px rgba(0,0,0,0.3);
        }
        p {
            font-size: 1.5rem;
            opacity: 0.95;
            margin-top: 15px;
        }
    </style>
</head>
<body>
    <div class="content">
        <h1>enginer.online</h1>
        <p>Добро пожаловать</p>
    </div>
</body>
</html>
```

# Настраиваем Nginx для нового домена
sudo nano /etc/nginx/sites-available/enginer.online

```
server {
    listen 80;
    server_name enginer.online www.enginer.online;

    root /var/www/enginer.online/html;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

# Активируем и перезапускаем Nginx
sudo ln -s /etc/nginx/sites-available/enginer.online /etc/nginx/sites-enabled/
sudo nginx -t                    # проверка конфигурации
sudo systemctl restart nginx

