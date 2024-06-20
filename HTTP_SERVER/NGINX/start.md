https://blog.programs74.ru/how-to-install-nginx-on-ubuntu-2204/


sudo apt update
sudo apt install nginx

sudo ufw app list
sudo ufw status
sudo ufw allow 'Nginx Full'

systemctl status nginx

sudo service nginx stop
sudo service nginx start
sudo service nginx restart
sudo systemctl reload nginx
nginx -t
service nginx configtest

curl -4 www.serbot.online


apt install -y certbot python-certbot-nginx