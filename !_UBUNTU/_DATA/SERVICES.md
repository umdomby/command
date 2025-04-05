# Для того чтобы в Linux, например в дистрибутиве Ubuntu 18.04, узнать какие сервисы включены 
# в автозагрузку при запуске системы, можно выполнить в терминале команду:
systemctl list-unit-files --type=service --state=enabled

# Также бывает полезно увидеть не весь список, а узнать автозагружается ли конкретный сервис. 
# Например для сервиса mysql команда будет выглядеть так:
systemctl is-enabled mysql.service
systemctl is-enabled nginx.service

# Для примера, нам требуется отключить сервисы mysql.service и nginx.service. 
# Для этого в терминале используем команду с правами супер-пользователя sudo:
sudo systemctl disable mysql.service
sudo systemctl disable nginx.service

# автоматически запускался сервис
sudo systemctl enable mysql.service