Откройте файл конфигурации резолвера DNS: В WSL2 конфигурация DNS хранится в файле /etc/resolv.conf. 
Откройте его для редактирования:
# sudo nano /etc/resolv.conf

Измените или добавьте настройки для использования DNS Windows: Убедитесь, 
что в этом файле используется правильный DNS-сервер, например, Google DNS или Cloudflare DNS:
# sudo nano /etc/resolv.conf
Замените строки вида nameserver на:
nameserver 8.8.8.8  # Google DNS
или
nameserver 1.1.1.1  # Cloudflare DNS


Отключение автоматической генерации /etc/resolv.conf: 
Если вы хотите, чтобы изменения в resolv.conf сохранялись, добавьте в файл wsl.conf следующую строку:
# sudo nano /etc/wsl.conf
Вставьте следующие строки:
[network]
generateResolvConf = false

wsl --shutdown


🔧 Метод 2: Использование DNS-сервера Windows в WSL2
PowerShel
# ipconfig /all
Найдите строку "DNS Servers" в выводе, это будут адреса DNS вашей сети.

Измените /etc/resolv.conf в WSL2: 
В WSL2 откройте файл /etc/resolv.conf и замените nameserver на IP-адрес DNS-сервера вашей Windows-системы. Например:
# sudo nano /etc/resolv.conf
Измените строку:
nameserver 213.184.249.66


Запрещаем автоматическую генерацию: Как и в методе 1, 
добавьте в /etc/wsl.conf строку для отключения автоматической генерации resolv.conf:
# sudo nano /etc/wsl.conf
[network]
generateResolvConf = false

Перезапустите WSL2:

bash
# wsl --shutdown