ssh root@192.168.1.1

uci show firewall | grep -E "redirect.*(80|443|3478|5349|8085-8086|8095-8096|49152-49800)" | cut -d'=' -f1 | while read rule; do uci delete $rule; done
uci show firewall | grep redirect | cut -d'=' -f1 | while read rule; do uci delete $rule; done
uci delete firewall.@redirect[0]
uci delete firewall.@redirect[1]
uci delete firewall.@redirect[2]
uci delete firewall.@redirect[3]
uci delete firewall.@redirect[4]
uci commit firewall
/etc/init.d/firewall restart


### ### ### ###
uci add firewall redirect
uci set firewall.@redirect[-1].name='Port_80_TCP'
uci set firewall.@redirect[-1].src='wan'
uci set firewall.@redirect[-1].proto='tcp'
uci set firewall.@redirect[-1].src_dport='80'
uci set firewall.@redirect[-1].dest='lan'
uci set firewall.@redirect[-1].dest_ip='192.168.1.141'
uci set firewall.@redirect[-1].dest_port='80'
uci set firewall.@redirect[-1].enabled='1'
uci add firewall redirect
uci set firewall.@redirect[-1].name='Port_443_TCP'
uci set firewall.@redirect[-1].src='wan'
uci set firewall.@redirect[-1].proto='tcp'
uci set firewall.@redirect[-1].src_dport='443'
uci set firewall.@redirect[-1].dest='lan'
uci set firewall.@redirect[-1].dest_ip='192.168.1.141'
uci set firewall.@redirect[-1].dest_port='443'
uci set firewall.@redirect[-1].enabled='1'
uci add firewall redirect
uci set firewall.@redirect[-1].name='Port_444_TCP'
uci set firewall.@redirect[-1].src='wan'
uci set firewall.@redirect[-1].proto='tcp'
uci set firewall.@redirect[-1].src_dport='444'
uci set firewall.@redirect[-1].dest='lan'
uci set firewall.@redirect[-1].dest_ip='192.168.1.121'
uci set firewall.@redirect[-1].dest_port='444'
uci set firewall.@redirect[-1].enabled='1'
uci add firewall redirect
uci set firewall.@redirect[-1].name='Port_3478_TCP'
uci set firewall.@redirect[-1].src='wan'
uci set firewall.@redirect[-1].proto='tcp'
uci set firewall.@redirect[-1].src_dport='3478'
uci set firewall.@redirect[-1].dest='lan'
uci set firewall.@redirect[-1].dest_ip='192.168.1.141'
uci set firewall.@redirect[-1].dest_port='3478'
uci set firewall.@redirect[-1].enabled='1'
uci add firewall redirect
uci set firewall.@redirect[-1].name='Port_5349_TCP'
uci set firewall.@redirect[-1].src='wan'
uci set firewall.@redirect[-1].proto='tcp'
uci set firewall.@redirect[-1].src_dport='5349'
uci set firewall.@redirect[-1].dest='lan'
uci set firewall.@redirect[-1].dest_ip='192.168.1.141'
uci set firewall.@redirect[-1].dest_port='5349'
uci set firewall.@redirect[-1].enabled='1'
uci add firewall redirect
uci set firewall.@redirect[-1].name='Port_3001_TCP'
uci set firewall.@redirect[-1].src='wan'
uci set firewall.@redirect[-1].proto='tcp'
uci set firewall.@redirect[-1].src_dport='3001'
uci set firewall.@redirect[-1].dest='lan'
uci set firewall.@redirect[-1].dest_ip='192.168.1.141'
uci set firewall.@redirect[-1].dest_port='3001'
uci set firewall.@redirect[-1].enabled='1'
uci add firewall redirect
uci set firewall.@redirect[-1].name='Port_3021_TCP'
uci set firewall.@redirect[-1].src='wan'
uci set firewall.@redirect[-1].proto='tcp'
uci set firewall.@redirect[-1].src_dport='3021'
uci set firewall.@redirect[-1].dest='lan'
uci set firewall.@redirect[-1].dest_ip='192.168.1.121'
uci set firewall.@redirect[-1].dest_port='3021'
uci set firewall.@redirect[-1].enabled='1'
uci add firewall redirect
uci set firewall.@redirect[-1].name='Ports_8085-8086_TCP'
uci set firewall.@redirect[-1].src='wan'
uci set firewall.@redirect[-1].proto='tcp'
uci set firewall.@redirect[-1].src_dport='8085-8086'
uci set firewall.@redirect[-1].dest='lan'
uci set firewall.@redirect[-1].dest_ip='192.168.1.141'
uci set firewall.@redirect[-1].dest_port='8085-8086'
uci set firewall.@redirect[-1].enabled='1'
uci add firewall redirect
uci set firewall.@redirect[-1].name='Ports_8085-8086_UDP'
uci set firewall.@redirect[-1].src='wan'
uci set firewall.@redirect[-1].proto='udp'
uci set firewall.@redirect[-1].src_dport='8085-8086'
uci set firewall.@redirect[-1].dest='lan'
uci set firewall.@redirect[-1].dest_ip='192.168.1.141'
uci set firewall.@redirect[-1].dest_port='8085-8086'
uci set firewall.@redirect[-1].enabled='1'
uci add firewall redirect
uci set firewall.@redirect[-1].name='Ports_8095-8096_TCP'
uci set firewall.@redirect[-1].src='wan'
uci set firewall.@redirect[-1].proto='tcp'
uci set firewall.@redirect[-1].src_dport='8095-8096'
uci set firewall.@redirect[-1].dest='lan'
uci set firewall.@redirect[-1].dest_ip='192.168.1.121'
uci set firewall.@redirect[-1].dest_port='8095-8096'
uci set firewall.@redirect[-1].enabled='1'
uci add firewall redirect
uci set firewall.@redirect[-1].name='Ports_8095-8096_UDP'
uci set firewall.@redirect[-1].src='wan'
uci set firewall.@redirect[-1].proto='udp'
uci set firewall.@redirect[-1].src_dport='8095-8096'
uci set firewall.@redirect[-1].dest='lan'
uci set firewall.@redirect[-1].dest_ip='192.168.1.121'
uci set firewall.@redirect[-1].dest_port='8095-8096'
uci set firewall.@redirect[-1].enabled='1'
uci add firewall redirect
uci set firewall.@redirect[-1].name='UDP_High_Ports'
uci set firewall.@redirect[-1].src='wan'
uci set firewall.@redirect[-1].proto='udp'
uci set firewall.@redirect[-1].src_dport='49152-49800'
uci set firewall.@redirect[-1].dest='lan'
uci set firewall.@redirect[-1].dest_ip='192.168.1.141'
uci set firewall.@redirect[-1].dest_port='49152-49800'
uci set firewall.@redirect[-1].enabled='1'
uci commit firewall
/etc/init.d/firewall restart
### ### ### ###

/etc/init.d/firewall reload


# Удаление правил по именам
uci delete firewall.@redirect[Port_80_TCP]
uci delete firewall.@redirect[Port_443_TCP]
uci delete firewall.@redirect[Port_444_TCP]
uci delete firewall.@redirect[Port_3478_TCP]
uci delete firewall.@redirect[Port_5349_TCP]
uci delete firewall.@redirect[Port_3001_TCP]
uci delete firewall.@redirect[Port_3021_TCP]
uci delete firewall.@redirect[Ports_8085-8086_TCP]
uci delete firewall.@redirect[Ports_8085-8086_UDP]
uci delete firewall.@redirect[Ports_8095-8096_TCP]
uci delete firewall.@redirect[Ports_8095-8096_UDP]
uci delete firewall.@redirect[UDP_High_Ports]
uci delete firewall.@redirect[0]
uci delete firewall.@redirect[1]
uci delete firewall.@redirect[2]
uci delete firewall.@redirect[3]
uci delete firewall.@redirect[4]
uci delete firewall.@redirect[5]
uci delete firewall.@redirect[6]
uci delete firewall.@redirect[7]
uci delete firewall.@redirect[8]
uci delete firewall.@redirect[9]
uci commit firewall
/etc/init.d/firewall restart