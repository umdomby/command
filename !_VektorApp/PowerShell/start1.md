New-NetFirewallRule -DisplayName "Разрешить входящие подключения на порт 5025" -Direction Inbound -Protocol TCP -LocalPort 5025 -Action Allow


netsh advfirewall firewall add rule name="TCP 5025 All" dir=in action=allow protocol=TCP localport=5025


