https://blog.programs74.ru/how-to-install-nginx-on-ubuntu-2204/


sudo apt update
sudo apt install nginx

sudo ufw app list
sudo ufw status
sudo ufw allow 'Nginx Full'

# systemctl status nginx
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
sudo ufw restart
sudo ufw allow 3000/tcp
sudo ufw allow 5432/tcp
sudo ufw app list
sudo ufw allow 82/tcp
sudo ufw allow 5000/tcp
sudo ufw allow 8080/tcp
sudo ufw allow 8081/tcp
sudo ufw allow 8082/tcp
sudo ufw allow 5005/tcp
sudo ufw allow 5006/tcp
sudo ufw allow 80/tcp
sudo ufw allow 444/tcp
sudo ufw allow 445/tcp
sudo ufw allow 1234/tcp
sudo ufw allow from 111.111.111.111
sudo ufw allow from 111.111.111.111 to any port 22
sudo ufw delete allow 443
sudo ufw delete allow 5000
sudo ufw allow 8080/tcp

sudo nano /var/log/nginx/error.log