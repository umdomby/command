1. Копирование файла в WSL (Ubuntu)
   Откройте PowerShell или CMD и выполните:

powershell
# Копируем архив Go из Windows в WSL (Ubuntu)
cp C:\Users\PC1\Downloads\go1.24.1.linux-amd64.tar.gz \\wsl.localhost\Ubuntu-24.04\home\pi\projects

sudo tar -C /usr/local -xzf go1.24.1.linux-amd64.tar.gz