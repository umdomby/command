Проверка работоспособности:
# В WSL2:
sudo netstat -tulnp | grep -E '3478|5349'

# С другого ПК (если открыт брандмауэр):
telnet 192.168.1.151 5349  # TCP
nmap -sU -p 3478 192.168.1.151  # UDP

#### #####################
# Установите socat в WSL2:
sudo apt update && sudo apt install -y socat

# Пробросить UDP 3478:
sudo socat UDP4-RECVFROM:3478,fork UDP4-SENDTO:172.30.46.88:3478 &
sudo socat UDP4-RECVFROM:5432,fork UDP4-SENDTO:172.30.46.88:5432 &



# Пробросить диапазон ретрансляции (50000-60000):
for port in {50000..50100}; do
sudo socat UDP4-RECVFROM:$port,fork UDP4-SENDTO:172.30.46.88:$port &
done
### ################################################

Если нужно автозапускать socat, добавь команды в ~/.bashrc или создай службу в WSL2:
sudo nano /etc/systemd/system/socat-turn.service

# Найти все процессы socat
ps aux | grep socat

# Завершить процесс (если найдётся)
sudo kill -9 <PID>  # Подставьте ID процесса из вывода выше


# powershell
wsl hostname -I  # Например, 172.30.46.88

wsl -u root socat UDP4-RECVFROM:3478,fork UDP4-SENDTO:172.30.46.88:3478 &

# Проверьте, что socat работает
В WSL2:
sudo netstat -tulnp | grep 3478



[Service]
ExecStart=/usr/bin/socat UDP4-RECVFROM:3478,fork UDP4-SENDTO:172.30.46.88:3478
Restart=always

[Install]
WantedBy=multi-user.target
Затем:

bash
Copy
sudo systemctl enable --now socat-turn.service




# В WSL2:
sudo netstat -tulnp | grep -E '3478|5349'

# С другого ПК (если открыт брандмауэр):
telnet 192.168.1.151 5349  # TCP
nmap -sU -p 3478 192.168.1.151  # UDP