https://blog.programs74.ru/how-to-install-nginx-on-ubuntu-2204/
tp-link 1.3.3 build 20230808 Archer c6 v2.0
213.184.249.66
openwrt-23.05.3-ath79-generic-tplink_archer-c6-v2
ipconfig (Windows) / ip a (Linux) / curl ifconfig.me (Linux)

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
sudo ufw disable

# PowerShell
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False
-проверить
Get-NetFirewallProfile | Select-Object Name, Enabled
- включить обратно
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True
- правило WSL2
New-NetFirewallRule -DisplayName "Allow WSL2" -Direction Inbound -InterfaceAlias "vEthernet (WSL (Hyper-V firewall))" -Action Allow
- найти сеть 
Get-NetAdapter | Format-Table Name, InterfaceDescription -AutoSize
-Вариант 1: Разрешить все для WSL2 по его подсети Узнаем IP-адрес WSL2:
wsl hostname -I
- Допустим, WSL2 имеет IP 172.28.123.45. Тогда разрешаем всю подсеть:
New-NetFirewallRule -DisplayName "Allow WSL2 Subnet" -Direction Inbound -RemoteAddress 172.30.0.0/16 -Action Allow


sudo apt install ufw
sudo ufw status verbose
#off
Status: inactive
sudo ufw disable
sudo ufw enable
sudo ufw status
sudo ufw reload
sudo ufw allow 50000:51000/udp
sudo ufw allow 5173/tcp
sudo ufw allow 9092/tcp
sudo ufw allow 3004/tcp
sudo ufw allow 5432/tcp
sudo ufw app list
sudo ufw allow 1444/tcp
sudo ufw allow 5000/tcp
sudo ufw allow 8080/tcp
sudo ufw allow 8081/tcp
sudo ufw allow 8085/tcp
sudo ufw allow 2181/tcp
sudo ufw allow 5006/tcp
sudo ufw allow 80/tcp
sudo ufw allow 444/tcp
sudo ufw allow 445/tcp
sudo ufw allow 1234/tcp
sudo ufw allow 3001/tcp

sudo ufw allow 3478/udp  
sudo ufw allow 5349/udp  
sudo ufw allow 443/tcp  
sudo ufw allow 80/tcp  
sudo ufw allow 49152:65535/udp
# или, если используете меньший диапазон:
sudo ufw allow 10000:20000/udp

sudo ufw allow from 111.111.111.111
sudo ufw allow from 111.111.111.111 to any port 22
sudo ufw delete allow 443
sudo ufw delete allow 5000
sudo ufw allow 8080/tcp

sudo nano /var/log/nginx/error.log