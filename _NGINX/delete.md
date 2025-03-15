sudo systemctl status nginx

sudo service nginx stop
sudo netstat -ntlp | grep 80

sudo apt-get remove nginx
sudo apt-get purge nginx

sudo apt-get remove nginx*
sudo apt-get purge nginx*

sudo apt-get autoremove

sudo systemctl disable nginx

sudo rm -rf /etc/nginx /var/log/nginx
sudo systemctl status nginx

sudo apt-get update
