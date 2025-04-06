HTTPS_REACT://github.com/ant-media/Ant-Media-Server/wiki/Turn-Server-Installation
apt-get update && apt-get install coturn

Установить TURN-сервер  
apt-get update && apt-get install coturn  

Включить TURN-сервер  
Отредактируйте следующий файл.
vim /etc/default/coturn  

добавить строку ниже  
TURNSERVER_ENABLED=1  

Настроить сервер TURN  
Отредактируйте следующий файл.
vim /etc/turnserver.conf  

просто добавьте его в 2 строки ниже.
user=username:password  
realm=your_public_ip_address  
и перезапустите сервер TURN  

systemctl restart coturn  

