sudo mkdir -p /var/www/cryptoid.store/html
sudo chown -R $USER:$USER /var/www/cryptoid.store/html
sudo nano /etc/nginx/sites-available/cryptoid.store
```
server {
    index index.html index.htm index.nginx-debian.html;
    server_name cryptoid.store;
    location / {
        proxy_pass http://localhost:8082;
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


################################### SERVER ##################################

sudo mkdir -p /var/www/cryptoid.store.server/html
sudo chown -R $USER:$USER /var/www/cryptoid.store.server/html
sudo nano /etc/nginx/sites-available/cryptoid.store.server
```
server {
    server_name cryptoid.store;
}
```
sudo systemctl restart nginx
