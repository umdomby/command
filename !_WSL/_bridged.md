Создайте виртуальный коммутатор в Hyper-V:
Откройте PowerShell от имени администратора и выполните:
powershell

wsl --status

# Удалить старый коммутатор (если есть)
Remove-VMSwitch -Name "WSLBridge" -Force -ErrorAction SilentlyContinue

# Создать новый (замените "Ethernet" на ваш адаптер из `Get-NetAdapter`)
New-VMSwitch -Name "WSLBridge" -NetAdapterName "Ethernet" -AllowManagementOS $true

2. Назначьте коммутатор WSL2
   powershell

Get-VMNetworkAdapter -VMName "WSL" | Connect-VMNetworkAdapter -SwitchName "WSLBridge"

3. Проверьте настройки WSL

Убедитесь, что в %USERPROFILE%\.wslconfig есть:
ini

[wsl2]
networkingMode=bridged

4. Перезапустите WSL
   powershell

wsl --shutdown




2️⃣ Попробуйте создать внутренний коммутатор (если внешний не работает):
powershell

New-VMSwitch -Name "WSLBridge" -SwitchType Internal

Затем вручную настройте NAT или мост через Hyper-V Manager.
3️⃣ Если адаптер занят (например, VPN или другим ПО):
powershell

Disable-NetAdapter -Name "Ethernet" -Confirm:$false
Enable-NetAdapter -Name "Ethernet" -Confirm:$false