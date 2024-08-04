https://youtu.be/qPvPvc7aFZg?t=1790



https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-20-04-ru

location / {
    proxy_pass http://localhost:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}

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
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        }
```