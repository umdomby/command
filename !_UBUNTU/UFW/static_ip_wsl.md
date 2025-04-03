В WSL2 создайте файл /etc/wsl.conf:

[network]
generateResolvConf = false



Затем пропишите статический IP в /etc/netplan/01-netcfg.yaml:

network:
version: 2
ethernets:
eth0:
dhcp4: no
addresses: [172.30.46.88/24]
gateway4: 172.30.46.1
nameservers:
addresses: [8.8.8.8]


# Разрешите трафик в брандмауэре
New-NetFirewallRule -DisplayName "TURN-UDP-3478" -Direction Inbound -Protocol UDP -LocalPort 3478 -Action Allow