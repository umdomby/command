WINDOWS+R
mstsc

sudo ufw allow 3389
apt -y update && apt -y upgrade
apt install tasksel
adduser user1
(add sudo)
usermod -aG sudo user1

sudo apt install ubuntu-desktop  or  sudo apt install tasksel ubuntu-desktop

sudo tasksel
ADD GNOME
service gdm restart


XRDP — это приложение клиент-серверной архитектуры, которое использует протокол удаленного рабочего стола (RDP) в 
качестве транспортного протокола. Сервер представляет собой демон Linux, работающий поверх устройства DisplayLink 
и обеспечивающий безопасное соединение между сервером и клиентом с помощью TLS.
```
sudo apt update && sudo apt upgrade
apt install xrdp -y
systemctl enable xrdp
systemctl start xrdp
systemctl status xrdp
sudo systemctl restart xrdp
```
sudo nano /etc/xrdp/startwm.sh

добавить пару строк перед test:

unset DBUS_SESSION_BUS_ADDRESS
unset XDG_RUNTIME_DIR


Далее сохраняем, нажав ctrl+O и нажимаем ENTER
sudo systemctl restart xrdp

usermod -a -G ssl-cert xrdp
systemctl restart xrdp
ufw allow from 192.168.1.0/24 to any port 3389

