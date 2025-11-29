
# 1. Обнови пакеты
sudo apt update

# 2. Установи ADB (и fastboot заодно)
sudo apt install android-tools-adb android-tools-fastboot -y
sudo apt update && sudo apt install android-tools-adb android-tools-fastboot -y

# PowerShell
winget install usbipd
usbipd list

# PowerShell
usbipd list

# найди свой Huawei (обычно BUSID 1-2 или 1-3)

usbipd bind --busid 1-2
usbipd attach --busid 1-2 --wsl

usbipd list
``` 5-12   12d1:107e  p8, Запоминающее устройство для USB, ADB Interface            Not shared
# PowerShell
usbipd bind --busid 5-12
usbipd attach --busid 5-12 --wsl


PowerShell
usbipd detach --all
usbipd list

5-12   12d1:107e  p8, Запоминающее устройство для USB, ADB Interface            """Shared (forced)"""