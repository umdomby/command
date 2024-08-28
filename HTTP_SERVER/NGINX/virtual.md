https://jino.ru/spravka/articles/nginx_server_blocks.html#установка-и-первичная-настройка-nginx

sudo mkdir -p /var/www/serbot.online/html
sudo mkdir -p /var/www/gamerecords.site/html

sudo chown -R $USER:$USER /var/www/serbot.online/html
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
```
server {
listen 80;
listen [::]:80;

        root /var/www/serbot.online/html;
        index index.html index.htm index.nginx-debian.html;

        server_name serbot.online www.serbot.online;

        location / {
                try_files $uri $uri/ /index.html;
        }
}
```

```
server {
listen 80;
listen [::]:80;

        root /var/www/gamerecords.site/html;
        index index.html index.htm index.nginx-debian.html;

        server_name gamerecords.site www.gamerecords.site;

        location / {
                try_files $uri $uri/ /index.html;
        }
}
```

sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/gamerecords.site
sudo nano /etc/nginx/sites-available/gamerecords.site

#index index.html index.htm index.nginx-debian.html;
```
server {
listen 80;
listen [::]:80;

        root /var/www/gamerecords.site/html;
        index index.html index.htm index.nginx-debian.html;

        server_name gamerecords.site www.gamerecords.site;

        location / {
                try_files $uri $uri/ =404;
        }
        
        or
        
        location / {
            proxy_pass http://localhost:8081;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

}
```

sudo ln -s /etc/nginx/sites-available/serbot.online /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/gamerecords.site /etc/nginx/sites-enabled/

sudo systemctl restart nginx
journalctl -xeu nginx.service

sudo nano /etc/nginx/nginx.conf
```
         gzip_vary on;
         gzip_proxied any;
         gzip_comp_level 6;
         gzip_buffers 16 8k;
         gzip_http_version 1.1;
         gzip_types text/plain text/css application/json application/javascript
```

server {
server_name www.gamerecords.site
return 301 $scheme://gamerecords.site$request_uri
}

server {
server_name  www.gamerecords.site;
rewrite ^(.*) https://gamerecords.site$1 permanent;
}

