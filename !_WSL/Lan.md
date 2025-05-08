powershell

# Перезапустить WSL
wsl --shutdown

# Запустите команду:
wsl --list --verbose

# Вывод будет примерно таким:
# NAME            STATE           VERSION
* Ubuntu-24.04    Running         2


# Проверить сетевые интерфейсы внутри WSL
wsl -d Ubuntu-24.04 -e ip a  

wsl --shutdown
# Откройте файл конфигурации WSL
notepad "$env:USERPROFILE\.wslconfig"

Добавьте или измените:
ini

[wsl2]
networkingMode=nat


wsl --shutdown
netsh winsock reset
netsh int ip reset
ipconfig /flushdns
Restart-Service -Name "WinNat" -Force

