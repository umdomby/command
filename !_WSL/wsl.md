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
netsh interface portproxy add v4tov4 listenaddress=192.168.1.151 listenport=8082 connectaddress=172.30.46.88 connectport=8082
netsh interface portproxy add v4tov4 listenaddress=192.168.1.151 listenport=3001 connectaddress=172.30.46.88 connectport=3001
netsh interface portproxy add v4tov4 listenaddress=192.168.1.151 listenport=444 connectaddress=172.30.46.88 connectport=444
netsh interface portproxy add v4tov4 listenaddress=192.168.1.151 listenport=9093 connectaddress=172.30.46.88 connectport=9093
netsh interface portproxy add v4tov4 listenaddress=192.168.1.151 listenport=6379 connectaddress=172.30.46.88 connectport=6379
netsh interface portproxy add v4tov4 listenaddress=192.168.1.151 listenport=52342 connectaddress=172.30.46.88 connectport=52342


netsh interface portproxy add v4tov4 listenport=52342 listenaddress=0.0.0.0 connectport=52342 connectaddress=(wsl hostname -I)
В WSL2 выполните hostname -I
В Windows выполните ipconfig
netsh interface portproxy add v4tov4 listenaddress=192.168.1.151 listenport=52342 connectaddress=172.30.46.88 connectport=52342

New-NetFirewallRule -DisplayName "Allow Port 5432" -Direction Inbound -Protocol TCP -LocalPort 5432 -Action Allow
New-NetFirewallRule -DisplayName "Allow Port 5349" -Direction Inbound -Protocol TCP -LocalPort 5349 -Action Allow
New-NetFirewallRule -DisplayName "Allow Port 6379" -Direction Inbound -Protocol TCP -LocalPort 6379 -Action Allow
New-NetFirewallRule -DisplayName "Allow Port 9093" -Direction Inbound -Protocol TCP -LocalPort 9093 -Action Allow
New-NetFirewallRule -DisplayName "Allow Port 1444" -Direction Inbound -Protocol TCP -LocalPort 1444 -Action Allow
New-NetFirewallRule -DisplayName "Allow Port 19002" -Direction Inbound -Protocol TCP -LocalPort 19002 -Action Allow
New-NetFirewallRule -DisplayName "Allow Port 8082" -Direction Inbound -Protocol TCP -LocalPort 8082 -Action Allow
New-NetFirewallRule -DisplayName "Allow Port 52342" -Direction Inbound -Protocol TCP -LocalPort 52342 -Action Allow
New-NetFirewallRule -DisplayName "Allow Port 5349" -Direction Inbound -Protocol TCP -LocalPort 5349 -Action Allow

Restart-Service iphlpsvc -Force

# Убедитесь, что брандмауэр разрешает входящие подключения на порт 52342:
New-NetFirewallRule -DisplayName "Flipper Port 52342" -Direction Inbound -LocalPort 52342 -Protocol TCP -Action Allow

ipconfig | findstr "IPv4"
IPv4-?????. . . . . . . . . . . . : 192.168.1.151
IPv4-?????. . . . . . . . . . . . : 172.31.0.1
IPv4-?????. . . . . . . . . . . . : 172.30.32.1

# Проверьте, доступен ли порт из Windows
Test-NetConnection -ComputerName 192.168.1.151 -Port 52342

# Если ничего не помогает
wsl --shutdown

# Альтернативный способ: Проброс портов через socat
sudo apt install socat
socat TCP-LISTEN:52342,fork,reuseaddr TCP:127.0.0.1:52342


Если WSL2 не хочет пробрасывать порты, можно сделать туннель через SSH:
powershell

# В PowerShell:
ssh -L 52342:localhost:52342 user@localhost -N

# C:\Users\PC1\.wslconfig
[wsl2]
networkingMode=bridged  # Проброс портов через мостовой интерфейс
localhostForwarding=true

# Если WSL2 не хочет пробрасывать порты, можно сделать туннель через SSH: В PowerShell:
ssh -L 52342:localhost:52342 pi@localhost -N

# Проверим доступность DNS # Проверим маршрутизацию # Проверим сетевые интерфейсы
nslookup google.com
ip route show
ip addr show

# Вариант A: Сброс сети WSL
sudo dhclient -r
sudo dhclient
sudo systemctl restart systemd-resolved

# Вариант C: Обновление WSL
wsl --update
wsl --shutdown


###
netsh winsock reset
netsh int ip reset all
Restart-Service LxssManager

# Внутри WSL попробуйте вручную активировать сеть
sudo dhclient eth0 -v
sudo ip link set eth0 up

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


