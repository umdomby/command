wsl -l -v
wsl hostname -I

```
wsl --install
wsl -l -v
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux 
wsl --set-version Ubuntu-20.04 2
```
\\wsl$\Ubuntu\home\pi\projects\one
Откройте настройки проекта: File → Settings → Tools → Terminal

ps -fp 4096
sudo kill -9 4096



ifconfig

wsl --shutdown
wsl --update

ip a
hostname -I

# узнать прт wsl
ip addr show eth0
ip -4 addr show eth0 | grep "inet"

172.30.46.88/20 brd 172.30.47.255 scope global eth0

PowerShell
New-NetFirewallRule -DisplayName "WSL Access" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
New-NetFirewallRule -DisplayName "WSL Access" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow

netsh interface portproxy add v4tov4 listenaddress=192.168.0.151 listenport=8080 connectaddress=172.30.46.88 connectport=8080
netsh interface portproxy add v4tov4 listenaddress=192.168.0.151 listenport=443 connectaddress=172.30.46.88 connectport=443

netsh interface portproxy add v4tov4 listenaddress=192.168.0.151 listenport=5432 connectaddress=172.30.46.88 connectport=5432
netsh interface portproxy add v4tov4 listenaddress=192.168.0.151 listenport=443 connectaddress=172.30.46.88 connectport=443

netsh interface portproxy add v4tov4 listenaddress=192.168.1.151 listenport=443 connectaddress=172.30.46.88 connectport=443
netsh interface portproxy add v4tov4 listenaddress=192.168.1.151 listenport=1444 connectaddress=172.30.46.88 connectport=1444
netsh interface portproxy add v4tov4 listenaddress=192.168.1.151 listenport=80 connectaddress=172.30.46.88 connectport=80
netsh interface portproxy add v4tov4 listenaddress=192.168.1.151 listenport=3001 connectaddress=172.30.46.88 connectport=3001
netsh interface portproxy add v4tov4 listenaddress=192.168.1.151 listenport=444 connectaddress=172.30.46.88 connectport=444
netsh interface portproxy add v4tov4 listenaddress=192.168.1.151 listenport=9093 connectaddress=172.30.46.88 connectport=9093
netsh interface portproxy add v4tov4 listenaddress=192.168.1.151 listenport=6379 connectaddress=172.30.46.88 connectport=6379
New-NetFirewallRule -DisplayName "Allow Port 5432" -Direction Inbound -Protocol TCP -LocalPort 5432 -Action Allow


New-NetFirewallRule -DisplayName "Allow Port 3001" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow
New-NetFirewallRule -DisplayName "Allow Port 6379" -Direction Inbound -Protocol TCP -LocalPort 6379 -Action Allow
New-NetFirewallRule -DisplayName "Allow Port 9093" -Direction Inbound -Protocol TCP -LocalPort 9093 -Action Allow
New-NetFirewallRule -DisplayName "Allow Port 1444" -Direction Inbound -Protocol TCP -LocalPort 1444 -Action Allow
New-NetFirewallRule -DisplayName "Allow Port 19002" -Direction Inbound -Protocol TCP -LocalPort 19002 -Action Allow

New-NetFirewallRule -DisplayName "Allow Port 5349" -Direction Inbound -Protocol TCP -LocalPort 5349 -Action Allow


#Powershell
ipconfig /all
netstat -ano | findstr :80
Get-Process -Id 5784, 27188, 24812
taskkill /PID 8008 /F
taskkill /PID 54396 /F
taskkill /PID 54411 /F
taskkill /PID 54458 /F

sudo chmod -R 755 ./html


docker-compose stop nginx
docker-compose exec certbot certbot certonly --standalone -d it-startup.site --http-01-port=8080
docker-compose exec certbot certbot certonly --standalone --preferred-challenges http -d anycoin.site --http-01-port=8080

docker-compose start nginx
docker-compose restart nginx
docker-compose exec nginx bash
apt update && apt install -y nano
nano /var/log/letsencrypt/letsencrypt
dig it-startup.site

172.30.46.88
https://www.yougetsignal.com/tools/open-ports/


# правило фаервола
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "Allow Port*"} | Format-Table -AutoSize
# удалить
Remove-NetFirewallRule -Confirm:$false

# Для просмотра существующих правил введите:
netsh interface portproxy show all

# Для сброса всех существующих правил используйте:
netsh interface portproxy reset

netsh interface portproxy delete v4tov4 listenport=444 listenaddress=192.168.0.151


