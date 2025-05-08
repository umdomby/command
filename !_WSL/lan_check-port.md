Пошаговое решение:

# Проверка связи между Windows и WSL powershell
Test-NetConnection -ComputerName 192.168.1.151 -Port 3001 -InformationLevel Detailed

Если TcpTestSucceeded: False, значит, есть блокировка на уровне:

    WSL (iptables)

    Hyper-V виртуального коммутатора

    Антивируса (даже при отключённом брандмауэре)



# В WSL выполните:
sudo iptables -L -n -v | grep 3001
# Если есть DROP-правила, разрешите порт:
sudo iptables -A INPUT -p tcp --dport 3001 -j ACCEPT


# Проверка доступа изнутри WSL
curl http://localhost:3001

Если работает - Next.js запущен корректно.

# Проверка доступа из Windows (не через браузер) powershell
Test-NetConnection -ComputerName 192.168.1.151 -Port 3001 -InformationLevel Detailed
Должен показать TcpTestSucceeded: True

# Проверка брандмауэра ещё раз powershell
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*3001*"} | Format-Table DisplayName,Enabled,Action

# Проверка маршрутизации в WSL
ip route show

Убедитесь, что нет странных правил.

Временное отключение брандмауэра для теста
powershell

Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False

После теста не забудьте включить обратно!

Проверка через другой браузер/устройство
Попробуйте открыть 192.168.1.151:3001 с телефона или другого компьютера в той же сети.

Дополнительные параметры Next.js
Попробуйте явно указать хост:
json

"dev": "next dev -H 0.0.0.0 -p 3001 --hostname 0.0.0.0"

# Проверка версии WSL powershell
wsl --version

Если версия старая, обновите через:
powershell

wsl --update

# Альтернативный способ доступа Попробуйте использовать специальный адрес WSL: powershell
(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "vEthernet (WSL)").IPAddress

И попробуйте открыть этот IP с портом 3001


# Проверка брандмауэра Windows (дополнительно) powershell
netsh advfirewall firewall show rule name="Allow Port 3001"

# Если правило есть, но не работает, удалите и создайте заново: powershell
Remove-NetFirewallRule -DisplayName "Allow Port 3001"
New-NetFirewallRule -DisplayName "NextJS Dev" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow -Enabled True

# Проверка маршрутизации в WSL
sudo iptables -L -n -v | grep 3001


# Проверка через raw TCP-соединение powershell
$socket = New-Object System.Net.Sockets.TcpClient
$socket.Connect("192.168.1.151", 3001)
$socket.Connected  # Должно быть True
$socket.Close()


# Последний вариант - смена порта
"dev": "next dev -H 0.0.0.0 -p 3002"