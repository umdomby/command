https://www.digitalocean.com/community/tutorials/how-to-install-nginx-on-ubuntu-22-04#step-5-%E2%80%93-setting-up-server-blocks-(recommended)


sudo apt update
sudo apt install nginx

sudo ufw app list
```
Output
Available applications:
  Nginx Full
  Nginx HTTP
  Nginx HTTPS
  OpenSSH
```

sudo ufw allow 'Nginx HTTP'
sudo ufw status
```
Output
Status: active

To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW       Anywhere                  
Nginx HTTP                 ALLOW       Anywhere                  
OpenSSH (v6)               ALLOW       Anywhere (v6)             
Nginx HTTP (v6)            ALLOW       Anywhere (v6)
```

sudo systemctl status nginx

    sudo mkdir -p /var/www/serbot.online/html
    sudo chown -R $USER:$USER /var/www/serbot.online/html
    sudo chmod -R 755 /var/www/serbot.online
    nano /var/www/serbot.online/html/index.html

```
<html>
    <head>
        <title>Welcome to your_domain!</title>
    </head>
    <body>
        <h1>Success!  The your_domain server block is working!</h1>
    </body>
</html>
```

sudo nano /etc/nginx/sites-available/serbot.online
```
server {
        listen 80;
        listen [::]:80;

        root /var/www/serbot.online/html;
        index index.html index.htm index.nginx-debian.html;

        server_name serbot.online www.serbot.online;

        location / {
                try_files $uri $uri/ =404;
        }
}
```
sudo ln -s /etc/nginx/sites-available/serbot.online /etc/nginx/sites-enabled/


# Чтобы избежать возможной проблемы с памятью хеш-корзины, которая может возникнуть из-за 
# добавления дополнительных имен серверов, необходимо изменить одно значение в файле 
# /etc/nginx/nginx.conf. Откройте файл:
sudo nano /etc/nginx/nginx.conf
```
http {
...
server_names_hash_bucket_size 64;
...
}
```

sudo rm /etc/nginx/sites-enabled/default
sudo rm /etc/nginx/sites-available/default

sudo nginx -t
sudo systemctl restart nginx
sudo systemctl reload nginx


```
Содержание
/var/www/html: реальный веб-контент, который по умолчанию состоит только из страницы Nginx 
по умолчанию, которую вы видели ранее, обслуживается из каталога /var/www/html. 
Это можно изменить, изменив файлы конфигурации Nginx.
Конфигурация сервера
/etc/nginx: каталог конфигурации Nginx. Здесь находятся все файлы конфигурации Nginx.
/etc/nginx/nginx.conf: основной файл конфигурации Nginx. Это можно изменить, чтобы внести 
изменения в глобальную конфигурацию Nginx.
/etc/nginx/sites-available/: каталог, в котором могут храниться блоки сервера для каждого сайта. 
Nginx не будет использовать файлы конфигурации, находящиеся в этом каталоге, если они не связаны 
с этим sites-enabledкаталогом. Обычно вся конфигурация блоков сервера выполняется в этом каталоге, а затем включается путем ссылки на другой каталог.
/etc/nginx/sites-enabled/: каталог, в котором хранятся включенные блоки сервера для каждого сайта. Обычно они создаются путем ссылки на файлы конфигурации, находящиеся в sites-availableкаталоге.
/etc/nginx/snippets: этот каталог содержит фрагменты конфигурации, которые можно включить в 
другое место конфигурации Nginx. Потенциально повторяемые сегменты конфигурации являются 
хорошими кандидатами на рефакторинг во фрагменты.
Журналы сервера
/var/log/nginx/access.log: каждый запрос к вашему веб-серверу записывается в этот файл журнала,
 если Nginx не настроен на иное действие.
/var/log/nginx/error.log: любые ошибки Nginx будут записываться в этот журнал.
```