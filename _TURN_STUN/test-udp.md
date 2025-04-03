Для тестирования UDP-трафика из Windows можно использовать:
Test-NetConnection -ComputerName 192.168.1.151 -Port 3478 -Udp


Проверка:
# В WSL2:
sudo tcpdump -i eth0 udp port 3478



# В WSL2:
sudo netstat -tulnp | grep -E '3478|5349'

# С другого ПК (если открыт брандмауэр):
telnet 192.168.1.151 5349  # TCP
nmap -sU -p 3478 192.168.1.151  # UDP