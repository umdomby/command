
HTTPS --> NGINX
https://medium.com/@derrickmehaffy/using-strapi-in-production-with-https-717af82d1445

pm2 start strapi --no-pmx --name="strapi" -- start

https://docs.strapi.io/dev-docs/deployment/nginx-proxy

sudo nano /etc/nginx/conf.d/upstream.conf
```
# path: /etc/nginx/conf.d/upstream.conf

# Strapi server
upstream strapi {
    server 127.0.0.1:1337;
}
```
sudo rm /var/www/html/index.nginx-debian.html

sudo service nginx stop
sudo rm /etc/nginx/sites-available/serbot.online.conf
sudo rm /etc/nginx/sites-enabled/serbot.online.conf
sudo rm /etc/nginx/sites-available/serbot.online.save
sudo rm /etc/nginx/sites-available/strapi.conf
sudo nano /etc/nginx/sites-available/serbot.online.conf
sudo ln -s /etc/nginx/sites-available/serbot.online.conf /etc/nginx/sites-enabled/serbot.online.conf
```
# path: /etc/nginx/sites-available/serbot.online.conf

server {
    # Listen HTTP
    listen 80;
    server_name serbot.online;
    root /var/www/serbot.online/html;
    index index.html index.xml;
    
    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    # Listen HTTPS
    listen 443 ssl;
    server_name serbot.online;
    root /var/www/serbot.online/html;
    index index.html index.xml;

    # SSL config
    ssl_certificate /etc/letsencrypt/live/serbot.online-0002/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/serbot.online-0002/privkey.pem; # managed by Certbot

    # Proxy Config
    location / {
        rewrite ^/test/?(.*)$ /$1 break;
        proxy_pass http://127.0.0.1;
        proxy_http_version 1.1;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Server $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $http_host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_pass_request_headers on;
    }
}
```
http://127.0.0.1:1337
sudo service nginx start
systemctl status nginx
sudo service nginx restart
systemctl reload nginx

