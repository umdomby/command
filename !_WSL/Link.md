# Создаем внешний виртуальный коммутатор
New-VMSwitch -Name "WSLBridge" -NetAdapterName "Ethernet" -AllowManagementOS $true  

Realtek Gaming 2.5GbE Family Controller

# Устанавливаем созданный коммутатор для WSL
Set-VM -Name "WSL" -VirtualSwitchName "WSLBridge"



###
[wsl2]
networkingMode=bridged  # Проброс портов через мостовой интерфейс
localhostForwarding=true

[wsl2]
networkingMode=nat


    nat (по умолчанию)

        Конфигурация: networkingMode=nat

        Описание:

            Использует NAT (трансляцию сетевых адресов)

            WSL2 получает IP из диапазона 172.x.x.x

            Позволяет выходить в интернет

            Виден только с хоста (Windows)

            Самый стабильный и простой вариант

    bridged (мостовой режим)

        Конфигурация: networkingMode=bridged

        Описание:

            Подключает WSL напрямую к физической сети

            Получает IP из той же подсети, что и хост

            Виден в локальной сети как отдельное устройство

            Требует настройки виртуального коммутатора в Hyper-V

            Может вызывать проблемы с DHCP

    mirrored (зеркальный режим)

        Конфигурация: networkingMode=mirrored

        Описание:

            Полностью зеркалирует сетевой стек хоста

            WSL получает те же IP и сетевые параметры, что и Windows

            Позволяет использовать VPN и сложные сетевые конфигурации

            Требует Windows 11 22H2 или новее

    none (без сети)

        Конфигурация: networkingMode=none

        Описание:

            Полностью отключает сеть в WSL

            Полезно для изолированных сред

            Нет доступа к интернету и локальной сети

    private (частная сеть)

        Конфигурация: networkingMode=private

        Описание:

            Создает изолированную частную сеть

            Доступ только между WSL-инстансами

            Нет выхода в интернет или локальную сеть

Как настроить:

Добавьте в файл %USERPROFILE%\.wslconfig:
ini

[wsl2]
networkingMode=bridged  # или другой нужный режим