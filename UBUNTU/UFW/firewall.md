###
# правило фаервола
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "Allow Port*"} | Format-Table -AutoSize
# Удалить все старые правила
Remove-NetFirewallRule -DisplayName "Allow Port 3000" -ErrorAction SilentlyContinue
Remove-NetFirewallRule -DisplayName "Allow Port 3005" -ErrorAction SilentlyContinue
# Создать новые 1
New-NetFirewallRule -DisplayName "Allow Port 3000-3005" -Direction Inbound -Protocol TCP -LocalPort 3000-3005 -Action Allow
# Для каждого порта в диапазоне 3000-3005 2
3000..3005 | ForEach-Object {
netsh interface portproxy add v4tov4 listenaddress=192.168.1.151 listenport=$_ connectaddress=172.30.46.88 connectport=$_
Write-Host "Перенаправлен порт $_"
}
###



# Для WSL2 (более безопасный вариант)
New-NetFirewallRule -DisplayName "WSL2 Inbound" -Direction Inbound -InterfaceAlias "vEthernet (WSL)" -Action Allow
New-NetFirewallRule -DisplayName "WSL2 Outbound" -Direction Outbound -InterfaceAlias "vEthernet (WSL)" -Action Allow

# Или если нужно разрешить все подключения к определенному IP
New-NetFirewallRule -DisplayName "Allow All to 192.168.1.151" -Direction Inbound -RemoteAddress 192.168.1.151 -Action Allow

Test-NetConnection -ComputerName 192.168.1.151 -Port 3000
Test-NetConnection -ComputerName 192.168.1.151 -Port 3005



# Для просмотра существующих правил введите:
netsh interface portproxy show all

# Для сброса всех существующих правил используйте:
netsh interface portproxy reset


netsh interface portproxy add v4tov4 listenaddress=localhost listenport=3000-3005 connectaddress=172.30.46.88 connectport=3000-3005


# Разрешить весь трафик для интерфейса WSL
New-NetFirewallRule -DisplayName "Allow WSL2" -Direction Inbound -InterfaceAlias "vEthernet (WSL (Hyper-V firewall))" -Action Allow
