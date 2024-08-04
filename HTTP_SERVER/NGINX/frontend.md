pm2 index.js
```
    const httpsServer = https.createServer(credentials, app);
    httpServer.listen(8080, () => {
    console.log('HTTP Server running on port 8080');
    });
```

nginx /etc/nginx/sites-available/serbot.online
```
        location / {
                try_files $uri $uri/ =404;
        }
        
        
        or


        location / {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        }
```

sudo systemctl restart nginx


server {
listen 433;
server_name www.gamerecords.site;
return 301 $scheme://gamerecords.site$request_uri;
}