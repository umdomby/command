sudo snap disable docker                                                # отключить автозапуск
sudo snap enable docker                                                 # включить обратно
sudo systemctl disable docker docker.socket containerd                  # Отключить автозагрузку
sudo systemctl enable docker docker.socket containerd                   # Включить обратно
systemctl list-unit-files | grep docker                                 # Проверить статус

sudo ps aux | grep -i docker | awk '{print $2}' | sudo xargs kill -9    # Найти и убить все Docker-процессы (включая контейнеры)
sudo pkill -9 -f "docker"                                               # Убить все процессы Docker и Containerd
sudo systemctl stop docker docker.socket containerd
sudo pkill -9 -f "dockerd\|containerd"
ps aux | grep -i docker                                                 # Проверить результат

                                                                        # Остановить все контейнеры и убить их (если Docker ещё работает)
sudo docker kill $(sudo docker ps -q) 2>/dev/null ; sudo docker rm -f $(sudo docker ps -aq) 2>/dev/null
                                                                        # Ядерный вариант (если Docker не отвечает)
sudo systemctl stop docker ; sudo rm -rf /var/lib/docker/containers/* ; sudo systemctl start docker

sudo docker ps -a                                                       # Должно быть пусто
sudo ps aux | grep -i docker                                            # Не должно быть зависших процессов

sudo systemctl stop docker                                              # Остановить Docker  
sudo rm -rf /var/lib/docker/containers/*                                # Удалить ВСЕ контейнеры  
sudo systemctl start docker                                             # Запустить Docker заново
sudo docker kill $(sudo docker ps -q) 2>/dev/null || true               # Остановить все контейнеры
sudo docker rm -f $(sudo docker ps -a -q) 2>/dev/null || true           # Удалить все контейнеры
sudo docker rmi -f $(sudo docker images -q) 2>/dev/null || true         # Удалить все образы
sudo docker system prune -a -f --volumes                                # Очистить неиспользуемые данные, включая тома

# Удалить Docker
sudo apt-get remove --purge docker.io docker-compose
sudo rm -rf /var/lib/docker

# Найти процессы контейнеров
sudo ps aux | grep docker

# Завершить процессы (замените PID на реальные)
sudo kill -9 <PID1> <PID2> <PID3>

# Повторить удаление контейнеров
sudo docker rm -f coturn docker-ardua-ardua-1 docker-nginx-certbot-1

# Отключить AppArmor (если активен)
sudo systemctl stop apparmor
sudo systemctl disable apparmor

sudo docker ps -a
sudo docker images

# Логи Docker: Если проблема сохраняется, проверьте логи Docker для диагностики:
sudo journalctl -u docker

#### 
# Проверьте, какие процессы блокируют контейнеры
sudo ls -l /var/lib/docker/containers/

# Найдите PID контейнеров:
sudo docker inspect -f '{{.State.Pid}}' f14365546c64 2332754cc489 0c029191afde
ps aux | grep docker
sudo kill -9 12345
sudo systemctl start docker
sudo systemctl stop docker
sudo systemctl restart docker
sudo docker stop f14365546c64 2332754cc489 0c029191afde
sudo docker rm -f f14365546c64 2332754cc489 0c029191afde
sudo rm -rf /var/lib/docker/containers/f14365546c64*
sudo rm -rf /var/lib/docker/containers/2332754cc489*
sudo rm -rf /var/lib/docker/containers/0c029191afde*
sudo systemctl start docker
sudo docker ps -a
# Теперь удалите образы
sudo docker rmi -f fd74b9468054 40464b56e4a7 52c3ecf84541
# Попробуйте очистить всё разом:
sudo docker system prune -a --volumes --force
