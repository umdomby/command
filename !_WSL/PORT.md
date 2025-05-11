# проверка устройства в сети
ping 192.168.1.151

# ! PING 192.168.1.151 (192.168.1.151) 56(84) bytes of data.
# ! 64 bytes from 192.168.1.151: icmp_seq=1 ttl=64 time=0.033 ms

# powershell
Test-NetConnection 192.168.1.151 -Port 3001
Get-NetFirewallRule -DisplayName "Allow Port 3001" | Select-Object Enabled, Direction, Action
# False?
Enable-NetFirewallRule -DisplayName "Allow Port 3001"

# WSL выполните:
curl -v http://localhost:3001  # Должен работать
curl -v http://192.168.1.151:3001  # Проверка внешнего доступа


# Проверьте, слушает ли сервер порт 3001: В WSL:
ss -tulnp | grep 3001

# WSL не пробрасывает порты
# В WSL 2 порты по умолчанию не пробрасываются на хост.
# Решение: powershell
netsh interface portproxy add v4tov4 listenport=3001 listenaddress=0.0.0.0 connectport=3001 connectaddress=$(wsl hostname -I).Trim()




# Отключите брандмауэр Windows полностью: powershell
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False
Test-NetConnection

# Запустите сервер с подробным логом:
next dev -H 0.0.0.0 -p 3001 2>&1 | tee server.log



# Узнаем IP WSL
$wsl_ip = (wsl hostname -I).Trim()