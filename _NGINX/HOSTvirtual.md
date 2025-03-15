```
Настройка виртуальных хостов
На сервере может быть расположено множество сайтов. Все запросы приходят на его IP-адрес, 
а после веб-сервер определяет, какой дать ответ, в зависимости от домена. 
Виртуальные хосты предназначены для того, чтобы сервер понимал, что и к какому домену относится. 
В качестве примера создадим сайт testsite.dev.
```

# Создадим папку для сайта:
sudo mkdir -p /var/www/serbot.online/html

# После добавим индексный файл:
sudo nano /var/www/serbot.online/html/index.html

```
<!DOCTYPE html>
<html lang="ru">
<head>
    <title>testsite.dev</title>
    <meta charset="utf-8">
</head>
<body>
    <h1>Hello, user</h1>
</body>
</html>
```

# После создадим конфигурационный файл сайта в папке sites-available:
sudo nano /etc/nginx/sites-available/serbot.online.conf

# Заполним его простейшей конфигурацией:
```
server {
    listen 80;
    listen [::]:80;

    server_name serbot.online www.serbot.online;
    root /var/www/serbot.online/html;
    index index.html index.xml;
}
```

# Последнее, что осталось сделать, — это создать ссылку в директории sites-enabled на 
# конфигурацию сайта testsite.dev, чтобы добавить его из доступных во включенные:
sudo ln -s /etc/nginx/sites-available/serbot.online.conf /etc/nginx/sites-enabled/

# После создания виртуального хоста проведем тестирование конфигурации:
sudo nginx -t

# Отключим сайт по умолчанию, удалив запись о дефолтном виртуальном хосте:
sudo rm /etc/nginx/sites-enabled/default

```
Стоит уточнить, что после того, как мы отключим сайт по умолчанию, Nginx будет использовать 
первый встреченный серверный блок в качестве резервного сайта (то есть по IP-адресу сервера 
будет открываться самый первый сайт из конфигурации Nginx).
```

# Перезагружаем веб-сервер:
sudo systemctl restart nginx

add to http://serbot.online