Remove-Item -Path "C:\nginx" -Recurse -Force


taskkill /IM nginx.exe /F

net stop nginx

nssm remove nginx confirm

winget uninstall nginx

choco uninstall nginx


netstat -ano | findstr :80


Чтобы узнать, какой процесс его использует:
Get-Process -Id 17632

Если процесс мешает, завершите его:
taskkill /PID 17632 /F