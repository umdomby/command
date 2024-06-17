https://blog.programs74.ru/how-to-install-nginx-on-ubuntu-2204/


sudo apt update
sudo apt install nginx

sudo ufw app list
sudo ufw status

systemctl status nginx

sudo service nginx stop
sudo service nginx start
service nginx restart


```
nginx -t 
service nginx configtest
```

apt install -y certbot python-certbot-nginx