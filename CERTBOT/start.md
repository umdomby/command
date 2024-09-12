sudo apt remove certbot
sudo apt update
sudo apt install snapd
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
sudo certbot --nginx
sudo systemctl restart nginx

    ssl_certificate /etc/letsencrypt/live/serbot.online/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/serbot.online/privkey.pem; # managed by Certbot

    '/var/www/serbot.online/html/GAME/GAME-BACKEND/cert/privkey.pem'


# Create group with root and nodeuser as members
$ sudo addgroup nodecert
$ sudo adduser nodeuser nodecert
$ sudo adduser root nodecert
# Make the relevant letsencrypt folders owned by said group.
$ sudo chgrp -R nodecert /etc/letsencrypt/live
$ sudo chgrp -R nodecert /etc/letsencrypt/archive
# Allow group to open relevant folders
$ sudo chmod -R 750 /etc/letsencrypt/live
$ sudo chmod -R 750 /etc/letsencrypt/archive


# Delete Group
$ sudo groupdel nodecert
# Reset Permission
$ sudo chown -R :root /etc/letsencrypt/live
$ sudo chown -R :root /etc/letsencrypt/archive
# Check Permissions
$ sudo ll /etc/letsencrypt/



sudo rm /usr/bin/certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot

sudo certbot certonly --standalone
sudo certbot certonly --webroot
sudo certbot renew --dry-run

# UPDATE SSL
# Чтобы протестировать процесс обновления, можно сделать запуск «вхолостую» с помощью
sudo certbot renew --dry-run

sudo certbot renew
sudo certbot renew --force-renewal
sudo certbot renew --force-renewal --post-hook "systemctl reload nginx"





