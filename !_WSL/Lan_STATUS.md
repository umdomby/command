PS C:\Users\PC1> wsl -d Ubuntu-24.04 -e ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
inet 127.0.0.1/8 scope host lo
valid_lft forever preferred_lft forever
inet 10.255.255.254/32 brd 10.255.255.254 scope global lo
valid_lft forever preferred_lft forever
inet6 ::1/128 scope host
valid_lft forever preferred_lft forever
2: loopback0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP group default qlen 1000
link/ether 00:15:5d:ff:2b:21 brd ff:ff:ff:ff:ff:ff
3: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP group default qlen 1000
link/ether e8:9c:25:de:cd:80 brd ff:ff:ff:ff:ff:ff
inet 192.168.1.151/24 brd 192.168.1.255 scope global noprefixroute eth0
valid_lft forever preferred_lft forever
inet6 2a00:1760:8115:28:4c86:f934:cde6:2840/64 scope global nodad deprecated noprefixroute
valid_lft forever preferred_lft 0sec
inet6 2a00:1760:8115:28::50b/128 scope global nodad noprefixroute
valid_lft forever preferred_lft forever
inet6 2a00:1760:8115:28:c5d4:e110:9bd8:bb7/128 scope global nodad noprefixroute
valid_lft forever preferred_lft forever
inet6 fd63:116b:ae5f::50b/128 scope global nodad noprefixroute
valid_lft forever preferred_lft forever
inet6 fd63:116b:ae5f:0:ebdc:aa74:d86e:79bf/64 scope global nodad deprecated noprefixroute
valid_lft forever preferred_lft 0sec
inet6 fd63:116b:ae5f:0:c5d4:e110:9bd8:bb7/128 scope global nodad noprefixroute
valid_lft forever preferred_lft forever
inet6 fe80::5034:7309:de27:ac61/64 scope link nodad noprefixroute
valid_lft forever preferred_lft forever



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