sudo nano /etc/nginx/sites-available/serbot.online
# Create a symlink for your new config

sudo rm /etc/nginx/sites-enabled/serbot.online.conf
sudo nano /etc/nginx/sites-enabled/serbot.online.conf
sudo ln -s /etc/nginx/sites-available/serbot.online.conf /etc/nginx/sites-enabled/serbot.online.conf
```
server {

        root /var/www/serbot.online/html/GAME/GAME-FRONTEND/build;
        index index.html index.htm index.nginx-debian.html;

        server_name serbot.online www.serbot.online;

        location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        }

    listen [::]:443 ssl ipv6only=on; # managed by Certbot
    listen 443 ssl; # managed by Certbot
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

sudo systemctl restart nginx
sudo systemctl reload nginx
sudo systemctl status nginx