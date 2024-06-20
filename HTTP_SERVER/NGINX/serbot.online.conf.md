sudo nano /etc/nginx/sites-available/serbot.online
# Create a symlink for your new config

sudo rm /etc/nginx/sites-enabled/serbot.online.conf
sudo nano /etc/nginx/sites-enabled/serbot.online.conf
sudo ln -s /etc/nginx/sites-available/serbot.online.conf /etc/nginx/sites-enabled/serbot.online.conf
```
server {
# Listen HTTP
    listen 80;
    server_name serbot.online;
# Define Root Location
    root /var/www/serbot.online/html;
    index index.php index.html;
}
server {
# Listen HTTPS
    listen 443 ssl;
    server_name serbot.online;
# Root Location
    root /var/www/serbot.online/html;
    index index.php index.html;
# SSL Config
 ssl_certificate /etc/letsencrypt/live/serbot.online-0002/fullchain.pem; # managed by Certbot
 ssl_certificate_key /etc/letsencrypt/live/serbot.online-0002/privkey.pem; # managed by Certbot
}

 ```

sudo systemctl restart nginx
sudo systemctl reload nginx
sudo systemctl status nginx