wsl: Параметр wsl2.localhostForwarding не действует при использовании зеркального сетевого режима
umdom@PC1:~$

umdom@PC1:~$ hostname -I
192.168.1.121 fd91:f22c:3c61:0:138d:bf7:187a:4b19 fd91:f22c:3c61:0:bc70:bba1:af6a:a8f6 fd91:f22c:3c61::6f1

GNU nano 7.2                                   /etc/netplan/01-netcfg.yaml                                            network:
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


GNU nano 7.2                              /etc/systemd/network/20-wired.network                                       [Match]
Name=eth0

[Network]
Address=192.168.1.121/24  # Сделайте таким же, как в netplan
Gateway=192.168.1.1
DHCP=no


New-NetFirewallRule -DisplayName "Allow WSL Port 3033" -Direction Inbound -Protocol TCP -LocalPort 3033 -Action Allow -Profile Any -Program "C:\Windows\System32\wsl.exe"


umdom@PC1:~/projects/prod/it-startup-site-444$ yarn start
yarn run v1.22.22
warning ../../../package.json: No license field
$ next start -p 3033
▲ Next.js 15.4.4
- Local:        http://localhost:3033
- Network:      http://10.255.255.254:3033

✓ Starting...
⚠ Warning: Found multiple lockfiles. Selecting /home/umdom/package-lock.json.
Consider removing the lockfiles at:
* /home/umdom/projects/prod/package-lock.json

⚠ "next start" does not work with "output: standalone" configuration. Use "node .next/standalone/server.js" instead.
✓ Ready in 370ms



umdom@PC1:~$ ip addr show
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
inet 127.0.0.1/8 scope host lo
valid_lft forever preferred_lft forever
inet 10.255.255.254/32 brd 10.255.255.254 scope global lo
valid_lft forever preferred_lft forever
inet6 ::1/128 scope host
valid_lft forever preferred_lft forever
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP group default qlen 1000
link/ether e8:9c:25:de:cd:80 brd ff:ff:ff:ff:ff:ff
inet 192.168.1.121/24 brd 192.168.1.255 scope global noprefixroute eth0
valid_lft forever preferred_lft forever
inet6 fd91:f22c:3c61:0:138d:bf7:187a:4b19/64 scope global nodad deprecated noprefixroute
valid_lft forever preferred_lft 0sec
inet6 fd91:f22c:3c61:0:bc70:bba1:af6a:a8f6/128 scope global nodad noprefixroute
valid_lft forever preferred_lft forever
inet6 fd91:f22c:3c61::6f1/128 scope global nodad noprefixroute
valid_lft forever preferred_lft forever
inet6 fe80::ea9c:25ff:fede:cd80/64 scope link
valid_lft forever preferred_lft forever
inet6 fe80::c001:130b:3f11:f89d/64 scope link nodad noprefixroute
valid_lft forever preferred_lft forever
3: loopback0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP group default qlen 1000
link/ether 00:15:5d:77:47:60 brd ff:ff:ff:ff:ff:ff

PS C:\WINDOWS\system32> Get-VMSwitch | Format-Table Name, SwitchType, NetAdapterInterfaceDescription -AutoSize

Name           SwitchType NetAdapterInterfaceDescription
----           ---------- ------------------------------
WSLBridge        External Realtek Gaming 2.5GbE Family Controller
Default Switch   Internal
FSE Switch       Internal


http://localhost:3033/ - открывает
http://192.168.1.121:3033/ - не открывает

Get-NetFirewallRule -DisplayName "Allow WSL Port 3033" | Format-Table Name, Enabled, Direction, Action

Name                                   Enabled Direction Action
----                                   ------- --------- ------
{7d765c22-6f34-4ddd-9647-7de938515489}    True   Inbound  Allow
{659d9ea8-5c10-4aa9-b22a-692f0e138a5c}    True   Inbound  Allow
{d063944b-0ae0-4fd7-a127-a8201c3e0ab3}    True   Inbound  Allow