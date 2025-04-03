мне нужно удалить TURN и установить его заново в WSL2 - какие порты пробросить
внешний ip - 213.184.249.66
сайт anybet.site


sudo netstat -tulnp | grep -E '3478|5349'
sudo systemctl status coturn


Проверка:
# В WSL2:
sudo tcpdump -i eth0 udp port 3478
Для тестирования UDP-трафика из Windows можно использовать:
Test-NetConnection -ComputerName 192.168.1.151 -Port 3000 -Udp

sudo apt remove coturn
sudo apt autoremove

sudo apt update
sudo apt install coturn


sudo nano /etc/turnserver.conf

# Основные настройки
listening-port=3478
tls-listening-port=5349
listening-ip=0.0.0.0
external-ip=213.184.249.66
realm=anybet.site

# Аутентификация (выберите ОДИН вариант!)
# Вариант 1: Пароль напрямую (небезопасно, но для тестов)
user=username1:password1
lt-cred-mech

# Вариант 2: Через общий секрет (безопаснее)
# use-auth-secret
# static-auth-secret=ВАШ_СЕКРЕТНЫЙ_КЛЮЧ
# Для этого варианта нужно генерировать временные credentials

# Политики портов
min-port=50000
max-port=60000  # Уменьшил диапазон для WSL2

# TLS (обязательно для WebRTC!)
cert=/etc/ssl/certs/anybet.site.crt
pkey=/etc/ssl/private/anybet.site.key

# Логи и безопасность
fingerprint
no-stdout-log  # Отключает вывод в консоль (для systemd)
# verbose       # Раскомментируйте для дебага



powershell
# Проброс UDP 3478 и 5349

# Разрешить в брандмауэре

netsh interface portproxy add v4tov4 listenaddress=192.168.1.151 listenport=3478 connectaddress=172.30.46.88 connectport=3478
netsh interface portproxy add v4tov4 listenaddress=192.168.1.151 listenport=5349 connectaddress=172.30.46.88 connectport=5349
New-NetFirewallRule -DisplayName "TURN-UDP-3478" -Direction Inbound -Protocol UDP -LocalPort 3478 -Action Allow
New-NetFirewallRule -DisplayName "TURN-TCP-5349" -Direction Inbound -Protocol TCP -LocalPort 5349 -Action Allow