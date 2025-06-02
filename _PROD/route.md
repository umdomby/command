ssh-keygen -f ~/.ssh/known_hosts -R '192.168.1.1'   # Удалить старый ключ, или
# ssh -o StrictHostKeyChecking=no root@192.168.1.1    # Временно отключить проверку (небезопасно, только для доверенных сетей)
ssh root@192.168.1.1                                        # 192.168.1.1
opkg update                                                 # Обновите список пакетов
opkg install nano                                           # Установите nano
nano /etc/config/firewall                                   # Теперь можно редактировать файл

uci show firewall | grep redirect                           # Проверьте текущие правила перенаправления портов

uci show firewall | grep redirect | cut -d'=' -f1 | while read rule; do uci delete $rule; done
uci delete firewall.@redirect[0]
uci delete firewall.@redirect[1]
uci delete firewall.@redirect[2]
uci delete firewall.@redirect[3]
uci delete firewall.@redirect[4]
uci commit firewall
/etc/init.d/firewall restart

```default
config rule
        option name 'Allow-IGMP'
        option src 'wan'
        option proto 'igmp'
        option family 'ipv4'
        option target 'ACCEPT'
config defaults
        option syn_flood '1'
        option input 'REJECT'
        option output 'ACCEPT'
        option forward 'REJECT'

config zone
        option name 'lan'
        list network 'lan'
        option input 'ACCEPT'
        option output 'ACCEPT'
        option forward 'ACCEPT'

config zone
        option name 'wan'
        list network 'wan'
        list network 'wan6'
        option input 'REJECT'
        option output 'ACCEPT'
        option forward 'REJECT'
        option masq '1'
        option mtu_fix '1'

config forwarding
        option src 'lan'
        option dest 'wan'

config rule
        option name 'Allow-DHCP-Renew'
        option src 'wan'
        option proto 'udp'
        option dest_port '68'
        option target 'ACCEPT'
        option family 'ipv4'

config rule
        option name 'Allow-Ping'
        option src 'wan'
        option proto 'icmp'
        option icmp_type 'echo-request'
        option family 'ipv4'
        option target 'ACCEPT'
config rule
        option name 'Allow-DHCPv6'
        option src 'wan'
        option proto 'udp'
        option dest_port '546'
        option family 'ipv6'
        option target 'ACCEPT'

config rule
        option name 'Allow-MLD'
        option src 'wan'
        option proto 'icmp'
        option src_ip 'fe80::/10'
        list icmp_type '130/0'
        list icmp_type '131/0'
        list icmp_type '132/0'
        list icmp_type '143/0'
        option family 'ipv6'
        option target 'ACCEPT'

config rule
        option name 'Allow-ICMPv6-Input'
        option src 'wan'
        option proto 'icmp'
        list icmp_type 'echo-request'
        list icmp_type 'echo-reply'
        list icmp_type 'destination-unreachable'
        list icmp_type 'packet-too-big'
        list icmp_type 'time-exceeded'
        list icmp_type 'bad-header'
        list icmp_type 'unknown-header-type'
        list icmp_type 'router-solicitation'
        list icmp_type 'neighbour-solicitation'
        list icmp_type 'router-advertisement'
        list icmp_type 'neighbour-advertisement'
        option limit '1000/sec'
        option family 'ipv6'
        option target 'ACCEPT'
config rule
        option name 'Allow-ICMPv6-Forward'
        option src 'wan'
        option dest '*'
        option proto 'icmp'
        list icmp_type 'echo-request'
        list icmp_type 'echo-reply'
        list icmp_type 'destination-unreachable'
        list icmp_type 'packet-too-big'
        list icmp_type 'time-exceeded'
        list icmp_type 'bad-header'
        list icmp_type 'unknown-header-type'
        option limit '1000/sec'
        option family 'ipv6'
        option target 'ACCEPT'

config rule
        option name 'Allow-IPSec-ESP'
        option src 'wan'
        option dest 'lan'
        option proto 'esp'
        option target 'ACCEPT'

config rule
        option name 'Allow-ISAKMP'
        option src 'wan'
        option dest 'lan'
        option dest_port '500'
        option proto 'udp'
        option target 'ACCEPT'
```

```
config redirect
        option name 'Port_80_TCP'
        option src 'wan'
        option proto 'tcp'
        option src_dport '80'
        option dest 'lan'
        option dest_ip '192.168.1.121'
        option dest_port '80'
        option enabled '1'

config redirect
        option name 'Port_443_TCP'
        option src 'wan'
        option proto 'tcp'
        option src_dport '443'
        option dest 'lan'
        option dest_ip '192.168.1.121'
        option dest_port '443'
        option enabled '1'

config redirect
        option name 'Port_3478_TCP'
        option src 'wan'
        option proto 'tcp'
        option src_dport '3478'
        option dest 'lan'
        option dest_ip '192.168.1.121'
        option dest_port '3478'
        option enabled '1'

config redirect
        option name 'Port_5349_TCP'
        option src 'wan'
        option proto 'tcp'
        option src_dport '5349'
        option dest 'lan'
        option dest_ip '192.168.1.121'
        option dest_port '5349'
        option enabled '1'

config redirect
        option name 'Port_3001_TCP'
        option src 'wan'
        option proto 'tcp'
        option src_dport '3001'
        option dest 'lan'
        option dest_ip '192.168.1.121'
        option dest_port '3001'
        option enabled '1'

config redirect
        option name 'Ports_8080-8099_TCP'
        option src 'wan'
        option proto 'tcp'
        option src_dport '8080-8099'
        option dest 'lan'
        option dest_ip '192.168.1.121'
        option dest_port '8080-8099'
        option enabled '1'

config redirect
        option name 'UDP_High_Ports'
        option src 'wan'
        option proto 'udp'
        option src_dport '49152-49800'
        option dest 'lan'
        option dest_ip '192.168.1.121'
        option dest_port '49152-49800'
        option enabled '1'
```

# Перезагрузите фаервол:
/etc/init.d/firewall reload

# Пояснение полей
src_dport       — внешние порты (через пробел, не запятую!).
dest_ip         — ваш внутренний IP (192.168.1.121).
dest_port       — внутренние порты (должны совпадать с внешними, если не нужен маппинг).