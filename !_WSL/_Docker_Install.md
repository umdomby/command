1. Удаление старой версии Docker
   Перед установкой новой версии нужно полностью удалить старую.

В Ubuntu (WSL2):
sudo apt-get remove docker docker-engine docker.io containerd runc
sudo apt-get purge docker-ce docker-ce-cli containerd.io
sudo rm -rf /var/lib/docker
sudo rm -rf /var/lib/containerd


В Windows:
Откройте Панель управления → Программы и компоненты.

Удалите:

Docker Desktop

Все связанные компоненты (Docker Engine, CLI)