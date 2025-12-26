wsl --shutdown 
wsl -d Ubuntu-24.04
wsl --install -d Ubuntu-24.04
# запуск
wsl -d Ubuntu-24.04
# Обновите пакеты:
sudo apt update && sudo apt upgrade -y
# Ярлык
wsl.exe ~
wsl.exe -d Ubuntu-24.04 --cd ~/projects bash -i -l
! wsl.exe ~ -d Ubuntu-24.04 -e bash --rcfile <(echo "cd ~/projects; exec bash -i")

# WebStorm terminal WSL2
File → Settings → Languages & Frameworks → Node.js + v
File → Settings → Terminal найдите настройку терминала.  wsl.exe -d Ubuntu-24.04

# импорт
wsl --import Ubuntu-24.04 C:\WSL\Ubuntu-24.04 "C:\wsl-ubuntu-24-04-backup.tar"
wsl --import Ubuntu-24.04 C:\WSL\Ubuntu-24.04-Old "C:\wsl-ubuntu-24.04-backup.tar"

# экспорт
wsl --export Ubuntu-24.04 C:\wsl-ubuntu-new-backup.tar


https://blog.programs74.ru/how-to-install-nginx-on-ubuntu-2204/
tp-link 1.3.3 build 20230808 Archer c6 v2.0
213.184.249.66
openwrt-23.05.3-ath79-generic-tplink_archer-c6-v2
ipconfig (Windows) / ip a (Linux) / curl ifconfig.me (Linux)

wsl --shutdown
wsl -l -v
wsl hostname -I


# Убедиться, что WSL работает powershell
wsl -d Ubuntu-24.04 -e ping 8.8.8.8


# Убедитесь, что сервер слушает 0.0.0.0 в WSL
netstat -tuln | grep 3001

# Проверьте подключение из Windows powershell
Test-NetConnection -ComputerName 192.168.1.151 -Port 3001

# Проверить брандмауэр Windows
# Разрешите входящие подключения на порт 3001: powershell
New-NetFirewallRule -DisplayName "Next.js Dev" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=9001 connectaddress=172.27.25.230 connectport=9001
netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=9000 connectaddress=172.27.25.230 connectport=9000
netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=5432 connectaddress=172.27.25.230 connectport=5432
netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=3022 connectaddress=172.27.25.230 connectport=3022
netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=80 connectaddress=172.27.25.230 connectport=80
netsh interface portproxy delete v4tov4 listenport=3022 listenaddress=0.0.0.0
netsh interface portproxy delete v4tov4 listenport=80 listenaddress=0.0.0.0