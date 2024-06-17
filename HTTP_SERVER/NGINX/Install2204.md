sudo apt update
sudo apt install nginx
sudo systemctl enable nginx
sudo service nginx status


sudo apt install ufw

# После успешной установки добавим веб-сервер в список доступных приложений брандмауэра:
sudo nano /etc/ufw/applications.d/nginx.ini

# Заполним файл следующим образом:
```
[Nginx HTTP]
title=Web Server
description=Enable NGINX HTTP traffic
ports=80/tcp

[Nginx HTTPS] \
title=Web Server (HTTPS) \
description=Enable NGINX HTTPS traffic
ports=443/tcp

[Nginx Full]
title=Web Server (HTTP,HTTPS)
description=Enable NGINX HTTP and HTTPS traffic
ports=80,443/tcp
```

# Проверим список доступных приложений:
sudo ufw app list

# Если среди них есть веб-сервер, значит всё сделано верно. Теперь нужно запустить брандмауэр 
# и разрешить передачу трафика по вышеуказанным портам:
sudo ufw enable
sudo ufw allow 'Nginx Full'
sudo ufw allow 'OpenSSH'


# Чтобы проверить изменения, вводим команду:
sudo ufw status



service nginx configtest

# Теперь проверим его наличие в автозагрузке:
sudo systemctl is-enabled nginx

sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl reload nginx
sudo systemctl status nginx
sudo nginx -t