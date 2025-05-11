1. Создание виртуального коммутатора в Hyper-V
   Откройте Диспетчер Hyper-V (через поиск Windows).

appwiz.cpl
# Просмотрите доступные сетевые адаптеры: powershell
Get-NetAdapter

# Создайте внешний виртуальный коммутатор: powershell
New-VMSwitch -Name "WSL-Bridge" -NetAdapterName "Ethernet" -AllowManagementOS $true


# После перезапуска WSL проверьте сетевые настройки: powershell
wsl -d Ubuntu-22.04 -- ifconfig

# Если нужно удалить коммутатор: powershell
Remove-VMSwitch -Name "WSL-Bridge"

sudo ip addr flush eth0  # Очищаем текущий IP
sudo ip addr add 192.168.1.121/24 dev eth0  # Назначаем новый статический IP
sudo ip route add default via 192.168.1.1  # Указываем шлюз (замените на ваш)


Способ 2: Постоянное решение через конфигурацию WSL
Создайте/отредактируйте файл /etc/wsl.conf:

bash
sudo nano /etc/wsl.conf
Добавьте конфигурацию сети:

ini
[network]
generateResolvConf = false  # Отключаем автоматическую генерацию DNS
Создайте скрипт для настройки сети (/etc/network.sh):

bash
#!/bin/bash

# Очистка текущих настроек
ip addr flush eth0

# Назначение статического IP
ip addr add 192.168.1.200/24 dev eth0

# Настройка шлюза
ip route add default via 192.168.1.1

# DNS-серверы
echo "nameserver 8.8.8.8" > /etc/resolv.conf
echo "nameserver 1.1.1.1" >> /etc/resolv.conf

# Разрешаем доступ к SSH (если нужно)
ufw allow 22/tcp
Сделайте скрипт исполняемым:

bash
sudo chmod +x /etc/network.sh
Добавьте в автозагрузку (в файл ~/.bashrc):

bash
echo "/etc/network.sh" >> ~/.bashrc
Способ 3: Через Hyper-V (рекомендуется)
В Диспетчере Hyper-V создайте новый виртуальный коммутатор:

Тип: "Внешний"

Укажите физический адаптер

Назовите "WSL-Static"

В файле C:\Users\<ваш_пользователь>\.wslconfig укажите:

ini
[wsl2]
networkingMode=bridged
vmSwitch=WSL-Static
ipv6=false
В настройках DHCP вашего роутера зарезервируйте IP для MAC-адреса WSL2 (можно узнать через ip a в WSL - строка link/ether).

Проверка работы
После настройки:

bash
ip a show eth0  # Должен показывать ваш статический IP
ping google.com  # Проверка интернет-соединения
Важные замечания:
Убедитесь, что выбранный IP не конфликтует с другими устройствами

Для серверных приложений лучше использовать резервацию IP на роутере

В bridged-режиме WSL2 ведет себя как отдельное устройство в сети

Если вам нужно полностью изолированное окружение, рассмотрите вариант с NAT-режимом и пробросом портов.


В правой панели выберите "Диспетчер виртуальных коммутаторов".

Создайте новый коммутатор:

Тип: Внешняя сеть (External)

Укажите физический сетевой адаптер (например, Wi-Fi или Ethernet)

Назовите его, например, "WSL-Bridge".

Нажмите ОК → согласитесь на сброс сети.

2. Настройка .wslconfig
   Добавьте в файл .wslconfig (расположен в C:\Users\<Ваш_пользователь>):

ini
[wsl2]
networkingMode=bridged
vmSwitch=WSL-Bridge  # Имя созданного коммутатора
ipv6=true  # или false, если не нужен
Сохраните файл и закройте.

3. Перезапуск WSL
   В PowerShell (от администратора):

powershell
wsl --shutdown
wsl -l -v  # Проверьте, что WSL остановлен
wsl  # Запустите снова
4. Проверка сети в WSL
   В терминале WSL выполните:

bash
ip a
Вы должны увидеть:

IP из вашей локальной сети (например, 192.168.1.x), а не внутренний адрес WSL2 (172.x.x.x).