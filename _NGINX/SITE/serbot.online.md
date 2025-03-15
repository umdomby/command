sudo mkdir -p /var/www/serbot.online/html
sudo chown -R $USER:$USER /var/www/serbot.online/html
sudo nano /etc/nginx/sites-available/serbot.online
```
server {
    server_name serbot.online;
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
sudo ln -s /etc/nginx/sites-available/cryptoid.store /etc/nginx/sites-enabled/
sudo systemctl restart nginx
sudo certbot --nginx
