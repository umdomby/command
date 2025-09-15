# logs Windows11
C:\Users\umdom\AppData\Local\Docker\log
Win+R → appwiz.cpl

# Удалите остаточные файлы:

C:\Users\umdom\AppData\Local\Docker
C:\Users\umdom\AppData\Roaming\Docker
C:\Program Files\Docker


wsl --unregister docker-desktop
wsl --unregister docker-desktop

# update windows
dism /online /cleanup-image /restorehealth