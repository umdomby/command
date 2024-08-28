https://youtu.be/2z2IznbVj9M
https://t.me/atom_baytovich/17

sudo rm /etc/nginx/sites-available/serbot.online.conf
sudo rm /etc/nginx/sites-enabled/serbot.online.conf
sudo nano /etc/nginx/sites-available/serbot.online.conf
sudo ln -s /etc/nginx/sites-available/serbot.online.conf /etc/nginx/sites-enabled/serbot.online.conf


### xn--l1abdi.com на свой домен
### конфигурация с редиректом на https и с www
### TG канал: @atom_baytovich
```
server {
listen                  443 ssl http2;
listen                  [::]:443 ssl http2;
server_name             serbot.online;
# SSL
ssl_certificate /etc/letsencrypt/live/serbot.online-0002/fullchain.pem; # managed by Certbot
ssl_certificate_key /etc/letsencrypt/live/serbot.online-0002/privkey.pem; # managed by Certbot
ssl_trusted_certificate /etc/letsencrypt/live/serbot.online-0002/chain.pem;
include /etc/letsencrypt/options-ssl-nginx.conf;
ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # reverse proxy
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

}

# subdomains redirect
server {
listen                  443 ssl http2;
listen                  [::]:443 ssl http2;
server_name             *.serbot.online;
# SSL
ssl_certificate /etc/letsencrypt/live/serbot.online-0002/fullchain.pem; # managed by Certbot
ssl_certificate_key /etc/letsencrypt/live/serbot.online-0002/privkey.pem; # managed by Certbot
ssl_trusted_certificate /etc/letsencrypt/live/serbot.online-0002/chain.pem;
return                  301 https://serbot.online$request_uri;
}

# HTTP redirect
server {
listen      80;
listen      [::]:80;
server_name .serbot.online;

    location / {
        return 301 https://serbot.online$request_uri;
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
