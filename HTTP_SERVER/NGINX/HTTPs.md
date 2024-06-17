https://medium.com/@derrickmehaffy/using-strapi-in-production-with-https-717af82d1445



# Lets create that file here: /etc/nginx/conf.d/upstream.conf :
```
# Strapi upstream server
upstream strapi {
server localhost:1337;
}
```


```
map $http_x_forwarded_host $custom_forwarded_host {
  default "$server_name";
  strapi "strapi";
}
server {
# Listen HTTP
    listen 80;
    server_name api.domain.com;
# Define Root Location
    root        /var/www/html;
# Define LE Location
    location ~ ^/.well-known/acme-challenge/ {
      default_type "text/plain";
      root         /var/www/html;
    }
# Else Redirect to HTTPS // API
    location / {
      return 301 https://$host$request_uri;
    }
}
server {
# Listen HTTPS
    listen 443 ssl;
    server_name api.domain.com;
# Root Location
    root /var/www/html;
# SSL Config
    ssl_certificate /etc/letsencrypt/live/api.canonn.fyi/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/api.canonn.fyi/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
# Proxy Config
    location / {
        proxy_pass http://strapi;
        proxy_http_version 1.1;
        proxy_set_header X-Forwarded-Host $custom_forwarded_host;
        proxy_set_header X-Forwarded-Server $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $http_host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
}
```

service nginx configtest
service nginx restart

# Delete the current symlink config
rm /etc/nginx/sites-enabled/default
# Create a symlink for your new config
ln -s /etc/nginx/sites-available/api.domain.com.conf /etc/nginx/sites-enabled/api.domain.com.conf
# Check to make sure there are no errors in the Nginx Config
service nginx configtest
# If it passes with [OK] restart Nginx
service nginx restart