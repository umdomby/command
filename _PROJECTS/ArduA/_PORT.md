# docker network create sharednetwork
# docker network ls
# docker-compose down -v
# docker-compose up --build

# nginx
      - "3478:3478/udp"
      - "3478:3478/tcp"
      - "5349:5349/tcp"
      - "49152-49800:49152-49800/udp"
      - "80:80"
      - "443:443"

# 443 ardua 

# 8085 socket-go

# 8086 socket-ar 

# На хост-машине (Windows или WSL) проверьте, используется ли порт 58008 или другие порты из диапазона 49152-65535.
netstat -a -n -o | findstr :58008
# Если порт занят, найдите процесс по PID и завершите его (если это безопасно):
netsh int ipv4 show excludedportrange udp


# Сетевые настройки WSL2: Убедитесь, что порты 3478 (UDP/TCP) и 5349 (TCP) открыты:
netsh interface portproxy add v4tov4 listenport=3478 listenaddress=0.0.0.0 connectport=3478 connectaddress=127.0.0.1
netsh interface portproxy add v4tov4 listenport=5349 listenaddress=0.0.0.0 connectport=5349 connectaddress=127.0.0.1
netsh advfirewall firewall add rule name="TURN UDP" dir=in action=allow protocol=UDP localport=3478
netsh advfirewall firewall add rule name="TURN TCP" dir=in action=allow protocol=TCP localport=3478,5349
netsh advfirewall firewall add rule name="TURN Media" dir=in action=allow protocol=UDP localport=49152-51000