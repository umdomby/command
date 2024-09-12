sudo mkdir -p /var/www/gamerecords.site/html
sudo chown -R $USER:$USER /var/www/gamerecords.site/html
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
sudo nano /etc/nginx/sites-available/gamerecords.site
```
server {

        root /var/www/gamerecords.site/html/GAME/GAME-FRONTEND/build;
        index index.html index.htm index.nginx-debian.html;
        server_name gamerecords.site;

        location / {
            proxy_pass http://localhost:8080;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
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
sudo ln -s /etc/nginx/sites-available/gamerecords.site /etc/nginx/sites-enabled/
# sudo apt update
# sudo apt install snapd
# sudo snap install --classic certbot
# sudo ln -s /snap/bin/certbot /usr/bin/certbot
sudo certbot --nginx
sudo systemctl restart nginx

netsh interface portproxy delete v4tov4 listenport=443 listenaddress=192.168.0.151
netsh interface portproxy delete v4tov4 listenport=5000 listenaddress=192.168.0.151
netsh interface portproxy add v4tov4 listenport=443 listenaddress=192.168.0.151 connectport=443 connectaddress=172.24.152.235
netsh interface portproxy add v4tov4 listenport=5000 listenaddress=192.168.0.151 connectport=5000 connectaddress=172.24.152.235
netsh interface portproxy add v4tov4 listenport=8080 listenaddress=192.168.0.151 connectport=8080 connectaddress=172.24.152.235


```
server {

        root /var/www/gamerecords.site/html/GAME/GAME-FRONTEND/build;
        index index.html index.htm index.nginx-debian.html;
        server_name gamerecords.site;

        location / {
            proxy_pass http://localhost:8080;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }


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

################################### SERVER ##################################

sudo mkdir -p /var/www/gamerecords.site.server/html
sudo chown -R $USER:$USER /var/www/gamerecords.site.server/html
nano /var/www/gamerecords.site.server/html/index.html
```
<html>
    <head>
        <title>gamerecords.site.server</title>
    </head>
    <body>
        <h1>gamerecords.site.server</h1>
    </body>
</html>
```
sudo nano /etc/nginx/sites-available/gamerecords.site.server
```
server {
        root /var/www/gamerecords.site/html/GAME/GAME-BACKEND;
        index index.html index.htm index.nginx-debian.html;
        server_name gamerecords.site;
        
        location / {
            proxy_pass http://localhost:5001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

    listen 5000 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/gamerecords.site/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/gamerecords.site/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}
```
sudo ln -s /etc/nginx/sites-available/gamerecords.site.server /etc/nginx/sites-enabled/
# sudo apt update
# sudo apt install snapd
# sudo snap install --classic certbot
# sudo ln -s /snap/bin/certbot /usr/bin/certbot
sudo certbot --nginx
sudo systemctl restart nginx

netsh interface portproxy delete v4tov4 listenport=443 listenaddress=192.168.0.151
netsh interface portproxy delete v4tov4 listenport=5000 listenaddress=192.168.0.151
netsh interface portproxy add v4tov4 listenport=443 listenaddress=192.168.0.151 connectport=443 connectaddress=172.24.152.235
netsh interface portproxy add v4tov4 listenport=5000 listenaddress=192.168.0.151 connectport=5000 connectaddress=172.24.152.235
netsh interface portproxy add v4tov4 listenport=8080 listenaddress=192.168.0.151 connectport=8080 connectaddress=172.24.152.235
