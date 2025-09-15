C:\Users\umdom\  .wslconfig
[wsl2]
networkingMode=nat
localhostForwarding=true
dnsTunneling=true
firewall=false

sudo nano /etc/netplan/01-netcfg.yaml
```
network:
  version: 2
  renderer: networkd
  ethernets:
    eth0:
      dhcp4: no
      addresses:
        - 172.27.25.230/20
      routes:
        - to: default
          via: 172.27.16.1  # Шлюз для подсети 172.27.16.0/20
      nameservers:
        addresses:
          - 8.8.8.8
          - 8.8.4.4
```

sudo nano /etc/systemd/network/20-wired.network
```
[Match]
Name=eth0

[Network]
DHCP=no
Address=172.27.25.230/20
Gateway=172.27.16.1
DNS=8.8.8.8
DNS=8.8.4.4
```

ip addr show eth0
ip route show

sudo netplan apply
sudo systemctl restart systemd-networkd

netsh interface portproxy delete v4tov4 listenport=3033 listenaddress=0.0.0.0
netsh interface portproxy add v4tov4 listenport=3033 listenaddress=0.0.0.0 connectport=3033 connectaddress=172.27.25.230

# Проверка перенаправления
netsh interface portproxy show v4tov4


# Настройка брандмауэра: Убедитесь, что порт 3033 открыт на хосте:
Get-NetFirewallRule -DisplayName "Allow TCP 3033" | Remove-NetFirewallRule
New-NetFirewallRule -DisplayName "Allow TCP 3033" -Direction Inbound -Protocol TCP -LocalPort 3033 -Action Allow -Profile Any

# Проверка порта на хост
netstat -an | findstr 3033

curl http://192.168.1.121:3033



Проверим NAT-проброс в WSL:

bash

sudo iptables -t nat -L -n -v | grep 3001

Если вывод пустой, добавим правило:
bash

sudo iptables -t nat -A PREROUTING -p tcp --dport 3001 -j DNAT --to-destination 127.0.0.1:3001



    Проверим привязку сервера в WSL:

bash

netstat -tulnp | grep 3001


Если False, выполните:
powershell

Restart-NetAdapter -Name "vEthernet (WSL)"



    Временное решение:

bash

sudo python3 -m http.server 3001 --bind 0.0.0.0