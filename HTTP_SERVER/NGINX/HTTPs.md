https://medium.com/@derrickmehaffy/using-strapi-in-production-with-https-717af82d1445

# Lets create that file here: /etc/nginx/conf.d/upstream.conf :
```
# Strapi upstream server
upstream strapi {
server localhost:1337;
}
```

sudo service nginx stop
sudo rm /etc/nginx/sites-available/serbot.online.conf
sudo rm /etc/nginx/sites-enabled/serbot.online.conf
sudo rm /etc/nginx/sites-available/serbot.online.save
sudo rm /etc/nginx/sites-available/strapi.conf
sudo nano /etc/nginx/sites-available/serbot.online.conf
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
systemctl status nginx
sudo service nginx stop
sudo service nginx start
sudo service nginx restart
sudo systemctl reload nginx
sudo nginx -t
service nginx configtest

# Delete the current symlink config
sudo rm /etc/nginx/sites-enabled/default
sudo rm /etc/nginx/sites-available/serbot.online
sudo nano /etc/nginx/sites-available/serbot.online
# Create a symlink for your new config
ln -s /etc/nginx/sites-available/serbot.online /etc/nginx/sites-enabled/serbot.online
# Check to make sure there are no errors in the Nginx Config
service nginx configtest
# If it passes with [OK] restart Nginx
service nginx restart

sudo rm /etc/nginx/sites-enabled/default
sudo rm /etc/nginx/sites-available/default


sudo snap install core; sudo snap refresh core
sudo apt remove certbot
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
sudo certbot --nginx -d serbot.online -d serbot.online

# Проверка автоматического продления Certbot
sudo systemctl status snap.certbot.renew.service

# Чтобы протестировать процесс обновления, 
# вы можете выполнить пробный прогон с помощью certbot:
sudo certbot renew --dry-run