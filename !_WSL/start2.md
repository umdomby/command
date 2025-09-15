NAT.md -->

ip addr show
Get-VMSwitch | Format-Table Name, SwitchType, NetAdapterInterfaceDescription -AutoSize

# Проверьте состояние службы Hyper-V
Get-Service vmms
# Проверьте все существующие коммутаторы (повторно):
Get-VMSwitch | Format-Table Name, SwitchType, NetAdapterInterfaceDescription -AutoSize

# Hyper-V перезапуск
Stop-Service vmms -Force
Start-Service vmms
Get-Service vmms
Restart-Service vmms -Force
Get-VMSwitch | Format-Table Name, SwitchType, NetAdapterInterfaceDescription -AutoSize

C:\Users\umdom\.wslconfig

[wsl2]
networkingMode=bridged
vmSwitch=WSLBridge
ipv6=false
# or
[wsl2]
networkingMode=bridged
vmSwitch=WSLBridge
ipv6=false
localhostForwarding=true
kernelCommandLine=ipv6.disable=1  # Жёсткое отключение IPv6 в ядре WSL
# or
[wsl2]
networkingMode=mirrored
localhostForwarding=true
dnsTunneling=true  # Для DNS в WSL
networkingMode=nat
firewall=false  # Отключить WSL-firewall для теста
# or mirrored
[wsl2]
networkingMode=mirrored
ipv6=false
localhostForwarding=true
kernelCommandLine=ipv6.disable=1


sudo nano /etc/netplan/01-netcfg.yaml
```
network:
  version: 2
  renderer: networkd
  ethernets:
    eth0:  # Замените на ваше имя интерфейса
      dhcp4: no
      addresses: [192.168.1.121/24]
      routes:
        - to: default
          via: 192.168.1.1
      nameservers:
        addresses: [8.8.8.8, 8.8.4.4]
```
# or
```
network:
  version: 2
  renderer: networkd
  ethernets:
    eth0:
      dhcp4: yes  # Или задайте 172.27.96.x, если нужно статический
      # addresses: [172.27.96.2/16]  # Опционально, если статический
      routes:
        - to: default
          via: 192.168.1.1
      nameservers:
        addresses: [8.8.8.8, 8.8.4.4]
```
# Примените
sudo netplan apply
# Новый IP (напр. 172.27.96.2) обновите в portproxy
netsh interface portproxy delete v4tov4 listenport=3033 listenaddress=0.0.0.0
netsh interface portproxy delete v4tov4 listenport=3034 listenaddress=0.0.0.0
netsh interface portproxy add v4tov4 listenport=3033 listenaddress=0.0.0.0 connectport=3033 connectaddress=172.27.96.2

sudo nano /etc/systemd/network/20-wired.network
```
[Match]
Name=eth0

[Network]
Address=192.168.1.121/24  # Сделайте таким же, как в netplan
Gateway=192.168.1.1
DHCP=no
```


netsh interface portproxy add v4tov4 listenport=3033 listenaddress=0.0.0.0 connectport=3033 connectaddress=192.168.1.121
netsh interface portproxy add v4tov4 listenport=3034 listenaddress=0.0.0.0 connectport=3034 connectaddress=192.168.1.121

sudo systemctl restart systemd-networkd
wsl --shutdown

Remove-VMSwitch -Name "WSLBridge" -Force -ErrorAction SilentlyContinue


New-VMSwitch -Name "WSLBridge" -NetAdapterName "Ethernet" -AllowManagementOS $true
# or
Чтобы настроить сетевой мост для WSL2 и задать статический IP-адрес 192.168.1.121 для экземпляра WSL2 в Windows, следуйте этим шагам. Ваша конфигурация в .wslconfig указывает на использование режима bridged networking с виртуальным коммутатором WSL-Bridge. Ниже приведено пошаговое руководство.

Шаг 1. Создание виртуального коммутатора в Hyper-V
Откройте Hyper-V Manager:
Нажмите Win + S, введите Hyper-V Manager и запустите приложение.
Убедитесь, что Hyper-V включен в Windows (можно проверить в «Включение или отключение компонентов Windows»).
Создайте внешний виртуальный коммутатор:
В Hyper-V Manager выберите свой компьютер в левой панели.
Перейдите в меню Действия → Диспетчер виртуальных коммутаторов.
Выберите Внешний тип коммутатора и нажмите Создать виртуальный коммутатор.
Дайте коммутатору имя, например, WSLBridge.
Выберите физический сетевой адаптер (например, Ethernet или Wi-Fi), который будет использоваться для моста.
Убедитесь, что опция «Разрешить управляющей операционной системе предоставлять общий доступ к этому сетевому адаптеру включена.
Нажмите ОК для сохранения.
Шаг 2. Настройка файла .wslconfig
Ваш файл .wslconfig уже содержит правильные параметры для bridged networking. Убедитесь, что он выглядит так:




# правило фаервола
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "Allow Port*"} | Format-Table -AutoSize
# удалить
Remove-NetFirewallRule -Confirm:$false

# Для просмотра существующих правил введите:
netsh interface portproxy show all

# Для сброса всех существующих правил используйте:
netsh interface portproxy reset

netsh interface portproxy delete v4tov4 listenport=444 listenaddress=192.168.0.121

netsh interface portproxy delete v4tov4 listenport=3033 listenaddress=0.0.0.0
netsh interface portproxy add v4tov4 listenport=3033 listenaddress=0.0.0.0 connectport=3033 connectaddress=192.168.1.121
netsh interface portproxy show all

# слушает ли сервер порт
sudo netstat -tulpn | grep :3033

# Проверьте все правила
Get-NetFirewallRule | Format-Table Name, DisplayName, Enabled, Action -AutoSize
# Проверьте все правила 2
New-NetFirewallRule -DisplayName "Allow WSL Port 3033" -Direction Inbound -Protocol TCP -LocalPort 3033 -Action Allow -Profile Any -Program "C:\Windows\System32\wsl.exe"
Enable-NetFirewallRule -DisplayName "WSL Access"
Get-NetFirewallRule -DisplayName "WSL Access"

# Создайте или исправьте firewall-правило
New-NetFirewallRule -DisplayName "Allow WSL Port 3033" -Direction Inbound -Protocol TCP -LocalPort 3033 -Action Allow -Profile Any
New-NetFirewallRule -DisplayName "Allow WSL Port 3034" -Direction Inbound -Protocol TCP -LocalPort 3034 -Action Allow -Profile Any
# or
New-NetFirewallRule -DisplayName "Allow WSL Port 3033" -Direction Inbound -Protocol TCP -LocalPort 3033 -Action Allow -Profile Any -Program "C:\Windows\System32\wsl.exe"

Get-NetFirewallRule -DisplayName "Allow WSL Port 3033"

# добавьте маршрут (редко нужно)
route add 192.168.1.121 mask 255.255.255.255 192.168.1.1

# Из WSL: curl http://localhost:3033
# Из Windows (PowerShell): curl -v http://localhost:3033


ip addr show eth0
# Если 192.168.1.121 — mirrored работает с LAN. Если 172.x — это NAT, и 192.168.1.121 — хост.
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP group default qlen 1000
link/ether e8:9c:25:de:cd:80 brd ff:ff:ff:ff:ff:ff
inet 192.168.1.121/24 brd 192.168.1.255 scope global noprefixroute eth0
valid_lft forever preferred_lft forever

hostname -I

# PowerShell
netstat -an | findstr :3033
# Найдите PID
netstat -aon | findstr :3033

# Определите процесс по PID
Get-Process -Id 5752

# Убейте процесс
taskkill /PID 5752 /F

netstat -aon | findstr :3033

# перезапустите сетевой стек Windows
netsh winsock reset
netsh int ip reset

# проверьте маршруты
route print
===========================================================================
Список интерфейсов
30...e8 9c 25 de cd 80 ......Hyper-V Virtual Ethernet Adapter #2
7...00 1a 7d da 71 13 ......Bluetooth Device (Personal Area Network)
1...........................Software Loopback Interface 1
10...00 15 5d 6e c7 07 ......Hyper-V Virtual Ethernet Adapter
===========================================================================

IPv4 таблица маршрута
===========================================================================
Активные маршруты:
Сетевой адрес           Маска сети      Адрес шлюза       Интерфейс  Метрика
0.0.0.0          0.0.0.0      192.168.1.1    192.168.1.121    281
127.0.0.0        255.0.0.0         On-link         127.0.0.1    331
127.0.0.1  255.255.255.255         On-link         127.0.0.1    331
127.255.255.255  255.255.255.255         On-link         127.0.0.1    331
172.27.96.0    255.255.240.0         On-link       172.27.96.1   5256
172.27.96.1  255.255.255.255         On-link       172.27.96.1   5256
172.27.111.255  255.255.255.255         On-link       172.27.96.1   5256
192.168.1.0    255.255.255.0         On-link     192.168.1.121    281
192.168.1.121  255.255.255.255         On-link     192.168.1.121    281
192.168.1.121  255.255.255.255      192.168.1.1    192.168.1.121     26
192.168.1.255  255.255.255.255         On-link     192.168.1.121    281
224.0.0.0        240.0.0.0         On-link         127.0.0.1    331
224.0.0.0        240.0.0.0         On-link       172.27.96.1   5256
224.0.0.0        240.0.0.0         On-link     192.168.1.121    281
255.255.255.255  255.255.255.255         On-link         127.0.0.1    331
255.255.255.255  255.255.255.255         On-link       172.27.96.1   5256
255.255.255.255  255.255.255.255         On-link     192.168.1.121    281
===========================================================================
Постоянные маршруты:
Сетевой адрес            Маска    Адрес шлюза      Метрика
0.0.0.0          0.0.0.0      192.168.1.1  По умолчанию
0.0.0.0          0.0.0.0      192.168.1.1     256
===========================================================================


Get-NetFirewallRule -DisplayName "Allow WSL Port 3033" | Format-Table Name, Enabled, Direction, Action

Name                                   Enabled Direction Action
----                                   ------- --------- ------
{7d765c22-6f34-4ddd-9647-7de938515489}    True   Inbound  Allow
{659d9ea8-5c10-4aa9-b22a-692f0e138a5c}    True   Inbound  Allow
{d063944b-0ae0-4fd7-a127-a8201c3e0ab3}    True   Inbound  Allow


# wsl 
ip addr show eth0

# отключите брандмауэр Windows: powershell
netsh advfirewall set allprofiles state off
or
netsh advfirewall set allprofiles state on

wsl --shutdown

NAT.md -->