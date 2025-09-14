ip addr show
Get-VMSwitch
Format-Table Name, SwitchType, NetAdapterInterfaceDescription -AutoSize

# Проверьте состояние службы Hyper-V
Get-Service vmms
# Проверьте все существующие коммутаторы (повторно):
Get-VMSwitch | Format-Table Name, SwitchType, NetAdapterInterfaceDescription -AutoSize

# Hyper-V перезапуск
Stop-Service vmms -Force
Start-Service vmms
Get-Service vmms
Restart-Service vmms -Force
Get-VMSwitch | Format-Table Name, SwitchType, NetAdapterInterfaceDescription -AutoSize

C:\Users\umdom\.wslconfig

[wsl2]
networkingMode=bridged
vmSwitch=WSLBridge
ipv6=false


sudo nano /etc/netplan/01-netcfg.yaml
```
network:
  version: 2
  renderer: networkd
  ethernets:
    eth0:  # Замените на ваше имя интерфейса
      dhcp4: no
      addresses: [192.168.1.121/24]
      routes:
        - to: default
          via: 192.168.1.1
      nameservers:
        addresses: [8.8.8.8, 8.8.4.4]
```

sudo nano /etc/systemd/network/20-wired.network
```
[Match]
Name=eth0

[Network]
Address=192.168.1.122/24  # Свободный IP из LAN
Gateway=192.168.1.1  # Ваш роутер
DHCP=no
```


netsh interface portproxy add v4tov4 listenport=3033 listenaddress=0.0.0.0 connectport=3033 connectaddress=192.168.1.122

sudo systemctl restart systemd-networkd
wsl --shutdown

Remove-VMSwitch -Name "WSLBridge" -Force -ErrorAction SilentlyContinue


New-VMSwitch -Name "WSLBridge" -NetAdapterName "Ethernet" -AllowManagementOS $true
# or
Чтобы настроить сетевой мост для WSL2 и задать статический IP-адрес 192.168.1.121 для экземпляра WSL2 в Windows, следуйте этим шагам. Ваша конфигурация в .wslconfig указывает на использование режима bridged networking с виртуальным коммутатором WSL-Bridge. Ниже приведено пошаговое руководство.

Шаг 1. Создание виртуального коммутатора в Hyper-V
Откройте Hyper-V Manager:
Нажмите Win + S, введите Hyper-V Manager и запустите приложение.
Убедитесь, что Hyper-V включен в Windows (можно проверить в «Включение или отключение компонентов Windows»).
Создайте внешний виртуальный коммутатор:
В Hyper-V Manager выберите свой компьютер в левой панели.
Перейдите в меню Действия → Диспетчер виртуальных коммутаторов.
Выберите Внешний тип коммутатора и нажмите Создать виртуальный коммутатор.
Дайте коммутатору имя, например, WSLBridge.
Выберите физический сетевой адаптер (например, Ethernet или Wi-Fi), который будет использоваться для моста.
Убедитесь, что опция «Разрешить управляющей операционной системе предоставлять общий доступ к этому сетевому адаптеру включена.
Нажмите ОК для сохранения.
Шаг 2. Настройка файла .wslconfig
Ваш файл .wslconfig уже содержит правильные параметры для bridged networking. Убедитесь, что он выглядит так: