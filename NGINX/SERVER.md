

sudo nano /etc/nginx/sites-available/server.gamerecords.site

```
server {
    
    server_name gamerecords.site;
    
    location / {
        proxy_pass http://localhost:5005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    listen [::]:443 ssl; # managed by Certbot
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

sudo ln -s /etc/nginx/sites-available/server.gamerecords.site /etc/nginx/sites-enabled/

