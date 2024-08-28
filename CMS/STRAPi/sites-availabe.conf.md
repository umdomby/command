sudo rm /etc/nginx/sites-available/serbot.online.conf
sudo rm /etc/nginx/sites-enabled/serbot.online.conf
sudo nano /etc/nginx/sites-available/serbot.online.conf
sudo ln -s /etc/nginx/sites-available/serbot.online.conf /etc/nginx/sites-enabled/serbot.online.conf

```
server {
    # Listen HTTP
    listen 80;
    server_name serbot.online;

    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}
server {
    # Listen HTTPS
    listen 443 ssl;
    server_name serbot.online;
    
    # Static Root
    location / {
        root /var/www/serbot.online/html;
    }
    
    # SSL Config
    ssl_certificate /etc/letsencrypt/live/serbot.online-0002/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/serbot.online-0002/privkey.pem; # managed by Certbot

    # Strapi API and Admin
    location /test/ {
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
        
        proxy_buffers 8 16k;
        proxy_buffer_size 32k;
    }
}
```

systemctl status nginx
sudo service nginx stop
sudo service nginx start
sudo service nginx restart
sudo systemctl reload nginx
sudo nginx -t
service nginx configtest