# Ярлык
wsl.exe ~

https://blog.programs74.ru/how-to-install-nginx-on-ubuntu-2204/
tp-link 1.3.3 build 20230808 Archer c6 v2.0
213.184.249.66
openwrt-23.05.3-ath79-generic-tplink_archer-c6-v2
ipconfig (Windows) / ip a (Linux) / curl ifconfig.me (Linux)


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