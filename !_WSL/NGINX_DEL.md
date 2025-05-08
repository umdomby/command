sudo systemctl stop nginx 2>/dev/null || sudo service nginx stop 2>/dev/null || sudo killall -9 nginx
sudo pkill -9 nginx
sudo netstat -tulnp | grep :80
sudo kill -9 <PID>


sudo apt remove --purge nginx nginx-full nginx-common -y
sudo apt autoremove -y
sudo apt autoclean
sudo rm -rf /etc/nginx /var/log/nginx /var/lib/nginx
nginx -v

Проверить, что порт 80 свободен
sudo netstat -tulnp | grep :80

Если потребуется переустановить, используйте:
sudo apt update && sudo apt install nginx -y