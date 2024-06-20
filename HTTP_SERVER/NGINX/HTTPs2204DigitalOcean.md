https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-22-04

sudo snap install core; sudo snap refresh core

sudo apt remove certbot
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot

sudo nano /etc/nginx/sites-available/serbot.online
```
server_name example.com www.example.com;
```

sudo nginx -t

sudo systemctl reload nginx

sudo ufw status
```
Output
Status: active
To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW       Anywhere                  
Nginx HTTP                 ALLOW       Anywhere                  
OpenSSH (v6)               ALLOW       Anywhere (v6)             
Nginx HTTP (v6)            ALLOW       Anywhere (v6)
```

sudo ufw allow 'Nginx Full'
sudo ufw delete allow 'Nginx HTTP'
```
Output
Status: active

To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW       Anywhere
Nginx Full                 ALLOW       Anywhere
OpenSSH (v6)               ALLOW       Anywhere (v6)
Nginx Full (v6)            ALLOW       Anywhere (v6)
```
sudo certbot --nginx -d serbot.online -d www.serbot.online
sudo systemctl status snap.certbot.renew.service
```
Output
○ snap.certbot.renew.service - Service for snap application certbot.renew
     Loaded: loaded (/etc/systemd/system/snap.certbot.renew.service; static)
     Active: inactive (dead)
TriggeredBy: ● snap.certbot.renew.timer
```
sudo certbot renew --dry-run

sudo rm /etc/nginx/sites-enabled/default
sudo rm /etc/nginx/sites-available/default


