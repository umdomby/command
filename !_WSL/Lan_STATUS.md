ping 192.168.1.151
PING 192.168.1.151 (192.168.1.151) 56(84) bytes of data.
64 bytes from 192.168.1.151: icmp_seq=1 ttl=64 time=0.033 ms

Test-NetConnection 192.168.1.151 -Port 3001                                                            ПРЕДУПРЕЖДЕНИЕ: TCP connect to (192.168.1.151 : 3001) failed                                                                                                                                                                                    
ComputerName           : 192.168.1.151
RemoteAddress          : 192.168.1.151
RemotePort             : 3001
InterfaceAlias         : Ethernet
SourceAddress          : 192.168.1.151
PingSucceeded          : True
PingReplyDetails (RTT) : 0 ms
TcpTestSucceeded       : False

фаерволы отключены

.wslconfig
[wsl2]
networkingMode=mirrored
ipv6=false
firewall=false  # Временно отключает встроенный брандмауэр WSL


    "dev1": "next dev -H 0.0.0.0 -p 3001",   Next15

почему виндовс не разрешает порт, брандмауэр и фаерволы отключены


#  WSL2:
curl http://localhost:3001  # Проверьте, отвечает ли сервер локально
curl http://192.168.1.151:3001  # Проверьте доступ по IP

netstat -tulnp | grep 3001

# powershell
Test-NetConnection -ComputerName 127.0.0.1 -Port 3001


Проблема:
WSL2 в режиме mirrored не пробрасывает порты автоматически, несмотря на то, что сервер слушает 0.0.0.0.
Windows видит WSL2 как отдельный хост (192.168.1.151), но трафик на этот IP не проходит.


# Проверьте привязку к IP в WSL Иногда приложения в WSL2 могут некорректно привязываться к IP. Попробуйте явно указать IP:
next dev -H 192.168.1.151 -p 3001

# Даже если брандмауэр отключён, проверьте: powershell
Get-NetFirewallRule | Where-Object { $_.Enabled -eq 'True' }

# Если есть активные правила, удалите их или отключите полностью: powershell
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False

# WSL2 использует NAT, и порты по умолчанию не пробрасываются. Для проброса выполните в PowerShell (от админа): powershell
netsh interface portproxy add v4tov4 listenport=3001 listenaddress=0.0.0.0 connectport=3001 connectaddress=192.168.1.151

# Проверка маршрутизации
route print

# Если после всех шагов проблема сохраняется, попробуйте запустить простой HTTP-сервер (например,
python -m http.server 3001

Trying 192.168.1.151...
Connected to 192.168.1.151.
Escape character is '^]'.


Next 15
"dev": "next dev -p 3001",


# Для доступа из локальной сети настройте проброс портов в WSL:
netsh interface portproxy add v4tov4 listenport=3001 listenaddress=0.0.0.0 connectport=3001 connectaddress=192.168.1.151


Анализ вывода ip a в WSL
1. Основные интерфейсы:

   lo (loopback) – локальный интерфейс (127.0.0.1).

   eth0 – основной сетевой интерфейс с IPv4 (192.168.1.151) и IPv6-адресами.

2. Ключевые моменты:

   WSL получил тот же IPv4-адрес (192.168.1.151), что и Windows → это Mirrored Networking (WSL использует сеть хоста напрямую).

   IPv6 также работает (но это не всегда нужно).

Нужен ли WSL Bridge в вашем случае?

❌ Нет!
Поскольку у вас Mirrored Networking, WSL использует сетевой адаптер Windows, и виртуальный мост (vEthernet (WSL)) не нужен.
Как удалить/отключить WSL Bridge (если он есть)?
1. Проверить наличие виртуального адаптера

Откройте Диспетчер устройств (devmgmt.msc) → Сетевые адаптеры и ищите:

    vEthernet (WSL)

    или Hyper-V Virtual Ethernet Adapter.

Если такого нет — мост уже отключён.
2. Отключить вручную (если адаптер есть)
   powershell

Disable-NetAdapter -Name "vEthernet (WSL)" -Confirm:$false

Или через Диспетчер устройств → Отключить устройство.
3. Убедиться, что WSL работает

После отключения проверьте:
powershell

wsl -d Ubuntu-24.04 -e ping 8.8.8.8

Если пинг есть — сеть работает без моста.
Дополнительные настройки (если нужно)
1. Полное отключение Hyper-V (если WSL не нужен)
   powershell

Disable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V-All

(Но это затронет Docker и другие виртуальные машины!)
2. Отключение IPv6 в WSL (если не используется)

Добавьте в %USERPROFILE%\.wslconfig:
ini

[wsl2]
networkingMode=mirrored
ipv6=false

Перезапустите WSL:
powershell

wsl --shutdown