[wsl2]
networkingMode=bridged
localhostForwarding=true

[network]
generateResolvConf = false




1. Быстрое исправление (перезапуск сети)
   bash

sudo dhclient -r  # Освобождаем текущий IP
sudo dhclient     # Запрашиваем новый IP
sudo systemctl restart systemd-networkd  # Перезапускаем сеть (если systemd есть)

2. Проверка базовых настроек
   bash

ip a  # Проверьте есть ли IP у интерфейса (обычно eth0)
route -n  # Проверьте маршрутизацию
cat /etc/resolv.conf  # Должен быть nameserver (например 172.x.x.1 или 8.8.8.8)

3. Если нет IP-адреса (ручная настройка)
   bash

sudo ip addr add 172.27.16.2/20 dev eth0  # Временный IP
sudo ip route add default via 172.27.16.1
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf

4. Постоянное исправление через wsl.conf
   bash

sudo nano /etc/wsl.conf

Добавьте:
ini

[network]
generateResolvConf = false
hostname = mywsl

Затем:
powershell

wsl --shutdown  # В Windows PowerShell