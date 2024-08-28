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

#firewall
sudo apt install ufw
sudo ufw status verbose
#off
Status: inactive
sudo ufw enable
sudo ufw status

sudo ufw app list

sudo ufw allow 1234/tcp
sudo ufw allow from 111.111.111.111
sudo ufw allow from 111.111.111.111 to any port 22
sudo ufw delete allow 443