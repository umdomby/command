Метод 3: Использование docker с настройками DNS

Если вы используете Docker в WSL2, можно принудительно указать DNS-серверы для контейнеров.

В Docker конфигурации укажите правильные DNS-серверы для контейнеров: Откройте или создайте файл /etc/docker/daemon.json:
# sudo nano /etc/docker/daemon.json

# sudo mkdir -p /etc/docker
# sudo nano /etc/docker/daemon.json

Добавьте следующий код для использования Google DNS или другого:

{
"dns": ["213.184.249.66"]
}

# sudo service docker restart
# wsl --shutdown
# nslookup gamerecords.site


cat /etc/resolv.conf
# sudo nano /etc/resolv.conf
nameserver 213.184.249.66

# sudo nano /etc/wsl.conf
[network]
generateResolvConf = false
# sudo rm /etc/resolv.conf

# docker restart docker-start-nginx-1

docker run -d --name docker-start-nginx-1 -p 80:80 -p 443:443 nginx

docker run -d --name docker-start -p 8080:80 -p 443:443 docker-start-nginx

docker run -d -p 80:80 -p 443:443 --name docker-start docker-start-nginx

sudo ufw allow 80,443/tcp
sudo ufw reload

# sudo systemctl stop nginx
# sudo systemctl stop apache2

# sudo certbot certonly --standalone -d gamerecords.site
# docker stop docker-start-nginx-1
# docker start docker-start-nginx-1
# docker restart docker-start-nginx-1

# ipconfig /all     -PowerShell 

# sudo ufw allow 80/tcp
# sudo netstat -tuln | grep :80
# sudo ufw allow 443/tcp
# sudo netstat -tuln

netsh interface portproxy add v4tov4 listenport=3000 listenaddress=192.168.0.151 connectport=3000 connectaddress=172.30.32.1
netsh interface portproxy add v4tov4 listenport=80 listenaddress=192.168.0.151 connectport=80 connectaddress=172.30.32.1
netsh interface portproxy add v4tov4 listenport=443 listenaddress=192.168.0.151 connectport=80 connectaddress=172.30.32.1


netsh interface portproxy add v4tov4 listenport=80 listenaddress=172.30.32.1 connectport=80 connectaddress=192.168.0.151
netsh interface portproxy add v4tov4 listenport=80 listenaddress=172.25.144.1 connectport=80 connectaddress=192.168.0.151


netsh interface portproxy add v4tov4 listenport=80 listenaddress=0.0.0.0 connectport=80 connectaddress=127.0.0.1
netsh interface portproxy add v4tov4 listenport=443 listenaddress=0.0.0.0 connectport=443 connectaddress=127.0.0.1


docker run -d --name my-nginx -p 80:80 -p 443:443 nginx

# Для просмотра существующих правил введите:
netsh interface portproxy show all

# Для сброса всех существующих правил используйте:
netsh interface portproxy reset


sudo netstat -tuln | grep ':80'
sudo lsof -i :80
sudo ss -tuln | grep ':80'
sudo kill 2024
sudo kill 20138



