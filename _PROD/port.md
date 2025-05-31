#firewall
sudo ufw enable
sudo ufw disable
sudo ufw app list
sudo ufw status

# Разрешение портов по одному
sudo ufw allow 3478
sudo ufw allow 3478/udp
sudo ufw allow 5349
sudo ufw allow 49152:49800/udp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8085/tcp
sudo ufw allow 8086/tcp

# Или одной командой для всех TCP портов
sudo ufw allow 3478,5349,80,443,8085,8086/tcp

# И отдельно для UDP
sudo ufw allow 3478,49152:49800/udp


sudo ufw status numbered


sudo ufw allow 'Nginx Full'

# Если вам нужно разрешить доступ только с определенных IP, используйте:
sudo ufw allow from 192.168.1.100 to any port 8085