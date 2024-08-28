https://www.digitalocean.com/community/tutorials/how-to-set-up-nginx-server-blocks-virtual-hosts-on-ubuntu-16-04

# powershell
ubuntu config --default-user root

sudo chown -R $USER:$USER /var/www/gamerecords.site/html
sudo chmod -R 755 /var/www

sudo nano /etc/nginx/nginx.conf

```
http {
    . . .

    server_names_hash_bucket_size 64;

    . . .
}
```

https://www.8host.com/blog/ustanovka-i-nastojka-nginx-na-virtualnyj-server/

sudo ufw allow 'Nginx HTTP'
sudo ufw status
or
sudo ufw enable
```
Status: active

To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW       Anywhere                 
Nginx HTTP                 ALLOW       Anywhere                 
OpenSSH (v6)               ALLOW       Anywhere (v6)            
Nginx HTTP (v6)            ALLOW       Anywhere (v6)
```

# ip-address
ip addr show eth0 | grep inet | awk '{ print $2; }' | sed 's/\/.*$//'
sudo ip addr add 192.168.0.191/24 dev eth0


По умолчанию Nginx автоматически запускается во время загрузки сервера. 
Это поведение можно выключить:

sudo systemctl disable nginx

Чтобы возобновить автозапуск сервиса, введите:

sudo systemctl enable nginx

sudo mkdir -p /var/www/gamerecords.site/html
sudo chown -R $USER:$USER /var/www/gamerecords.site/html
sudo chmod -R 755 /var/www/gamerecords.site

nano /var/www/gamerecords.site/html/index.html
```
<html>
    <head>
        <title>gamerecords.site</title>
    </head>
    <body>
        <h1>gamerecords.site!</h1>
    </body>
</html>
```

sudo nano /etc/nginx/sites-available/gamerecords.site
```
server {
        listen 80;
        listen [::]:80;

        root /var/www/gamerecords.site/html;
        index index.html index.htm index.nginx-debian.html;

        server_name gamerecords.site www.gamerecords.site;

        location / {
                try_files $uri $uri/ =404;
        }
}
```

sudo ln -s /etc/nginx/sites-available/gamerecords.site /etc/nginx/sites-enabled/

sudo nano /etc/nginx/sites-enabled/gamerecords.site

# LOGS
nano /var/log/nginx/access.log
nano /var/log/nginx/error.log

nano /etc/nginx/sites-enabled/gamerecords.site

sudo rm /etc/nginx/sites-enabled/gamerecords.site

# PowerShell
netsh interface portproxy add v4tov4 listenport=80 listenaddress=192.168.0.151 connectport=80 connectaddress=172.24.152.235
netsh interface portproxy add v4tov4 listenport=443 listenaddress=192.168.0.151 connectport=443 connectaddress=172.24.152.235
netsh interface portproxy add v4tov4 listenport=5432 listenaddress=192.168.0.151 connectport=5432 connectaddress=172.24.152.235
netsh interface portproxy add v4tov4 listenport=5432 listenaddress=192.168.0.151 connectport=5432 connectaddress=172.24.152.235

213.184.249.66




