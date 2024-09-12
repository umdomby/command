https://jino.ru/spravka/articles/nginx_server_blocks.html#установка-и-первичная-настройка-nginx

sudo mkdir -p /var/www/serbot.online/html
sudo mkdir -p /var/www/cryptoid.store/html
sudo mkdir -p /var/www/gamerecords.site/html

sudo chown -R $USER:$USER /var/www/serbot.online/html
sudo chown -R $USER:$USER /var/www/cryptoid.store/html
sudo chown -R $USER:$USER /var/www/gamerecords.site/html

nano /var/www/serbot.online/html/index.html
```
<html>
    <head>
        <title>serbot.online</title>
    </head>
    <body>
        <h1>serbot.online!</h1>
    </body>
</html>
```
cd /var/www/serbot.online/html


nano /var/www/gamerecords.site/html/index.html
```
<html>
    <head>
        <title>gamerecords.site</title>
    </head>
    <body>
        <h1>gamerecords.site!</h1>
    </body>
</html>
```


sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/serbot.online
sudo nano /etc/nginx/sites-available/serbot.online
# sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/cryptoid.store
# sudo nano /etc/nginx/sites-available/cryptoid.store
```
server {

        root /var/www/serbot.online/html;
        index index.html index.htm index.nginx-debian.html;

        server_name serbot.online www.serbot.online;

        location / {
            proxy_pass http://localhost:8081;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

    listen [::]:444 ssl ipv6only=on; # managed by Certbot
    listen 444 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/serbot.online/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/serbot.online/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot

}
server {
    if ($host = serbot.online) {
        return 301 https://$host$request_uri;
    } # managed by Certbot


listen 80;
listen [::]:80;

        server_name serbot.online www.serbot.online;
    return 404; # managed by Certbot


}
```
        location / {
                try_files $uri $uri/ /index.html;
        }
```
server {
listen 80;
listen [::]:80;

        root /var/www/cryptoid.store/html;
        index index.html index.htm index.nginx-debian.html;

        server_name cryptoid.store www.cryptoid.store;

        location / {
            proxy_pass http://localhost:8082;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    listen [::]:444 ssl ipv6only=on; # managed by Certbot
    listen 444 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/cryptoid.store/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/cryptoid.store/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}
server {
    if ($host = cryptoid.store) {
        return 301 https://$host$request_uri;
    } # managed by Certbot


listen 80;
listen [::]:80;

    server_name cryptoid.store www.cryptoid.store;
    return 404; # managed by Certbot
    
}

```

# https cerbot
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/gamerecords.site
sudo nano /etc/nginx/sites-available/gamerecords.site
```
server {

        root /var/www/gamerecords.site/html/GAME/GAME-FRONTEND/build;
        index index.html index.htm index.nginx-debian.html;
        server_name gamerecords.site;

        location / {
            proxy_pass http://localhost:8081;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        listen [::]:443 ssl; # managed by Certbot
        listen 443 ssl; # managed by Certbot
        ssl_certificate /etc/letsencrypt/live/gamerecords.site/fullchain.pem; # managed by Certbot
        ssl_certificate_key /etc/letsencrypt/live/gamerecords.site/privkey.pem; # managed by Certbot
        include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
        ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot

}
server {
    if ($host = gamerecords.site) {
        return 301 https://$host$request_uri;
    } # managed by Certbot


listen 80;
listen [::]:80;

    server_name gamerecords.site www.gamerecords.site;
    return 404; # managed by Certbot
    
}
```

sudo ln -s /etc/nginx/sites-available/serbot.online /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/cryptoid.store /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/gamerecords.site /etc/nginx/sites-enabled/

sudo systemctl restart nginx
sudo service nginx stop
journalctl -xeu nginx.service
nginx -t

sudo nano /etc/nginx/nginx.conf
```
         gzip_vary on;
         gzip_proxied any;
         gzip_comp_level 6;
         gzip_buffers 16 8k;
         gzip_http_version 1.1;
         gzip_types text/plain text/css application/json application/javascript
```
netsh interface portproxy add v4tov4 listenport=80 listenaddress=192.168.0.151 connectport=80 connectaddress=172.24.152.235
netsh interface portproxy add v4tov4 listenport=8080 listenaddress=192.168.0.151 connectport=8080 connectaddress=172.24.152.235
netsh interface portproxy add v4tov4 listenport=5000 listenaddress=192.168.0.151 connectport=5000 connectaddress=172.24.152.235
netsh interface portproxy add v4tov4 listenport=5001 listenaddress=192.168.0.151 connectport=5001 connectaddress=172.24.152.235
netsh interface portproxy add v4tov4 listenport=5002 listenaddress=192.168.0.151 connectport=5002 connectaddress=172.24.152.235

sudo apt remove certbot
sudo apt update
sudo apt install snapd
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
sudo certbot --nginx
sudo systemctl restart nginx

