# STUN/TURN (UDP + TCP)
sudo ufw allow 3478/udp
sudo ufw allow 3478/tcp

# TURN-over-TLS/DTLS
sudo ufw allow 5349/tcp
sudo ufw allow 5349/udp

# Диапазон для ретрансляции
sudo ufw allow 49152:65535/udp


New-NetFirewallRule -DisplayName "Allow TURN UDP" -Direction Inbound -Protocol UDP -LocalPort 3478,60000-65000 -Action Allow
New-NetFirewallRule -DisplayName "TURN-UDP" -Direction Inbound -Protocol UDP -LocalPort 3478,30000-40000 -Action Allow


Get-NetNat | Where-Object Name -Like "*WSL*" | Remove-NetNat  # Удалите старый NAT (осторожно!)
Add-NetNat -Name "WSLNAT" -InternalIPInterfaceAddressPrefix "172.22.0.0/22"

# Показать все UDP-порты
Get-NetUDPEndpoint | Sort-Object LocalPort | Format-Table

50000..50100 | ForEach-Object {
netsh interface portproxy add v4tov4 listenaddress=192.168.1.151 listenport=$_ connectaddress=172.30.46.88 connectport=$_
Write-Host "Перенаправлен порт $_"
}
netsh interface portproxy show all

netsh interface portproxy add v4tov4 listenaddress=192.168.1.151 listenport=3478 connectaddress=172.30.46.88 connectport=3478
netsh interface portproxy add v4tov4 listenaddress=192.168.1.151 listenport=5349 connectaddress=172.30.46.88 connectport=5349

New-NetFirewallRule -DisplayName "TURN-UDP-3478" -Direction Inbound -Protocol UDP -LocalPort 3478 -Action Allow
New-NetFirewallRule -DisplayName "TURN-UDP-5349" -Direction Inbound -Protocol UDP -LocalPort 5349 -Action Allow