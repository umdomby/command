New-NetFirewallRule `
    -DisplayName "MSIV QR Server - Port 5000" `
-Direction Inbound `
    -Protocol TCP `
-LocalPort 5000 `
    -Action Allow `
-Profile Any `
-Description "Разрешает доступ к MSIV QR Server на порту 5000"