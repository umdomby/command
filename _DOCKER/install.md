https://docs.docker.com/engine/install/ubuntu/
# Выполните следующую команду, чтобы удалить все конфликтующие пакеты:
for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do sudo apt-get remove $pkg; done

# Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
"deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
$(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | \
sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update

sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo docker run hello-world

# Install the Docker Compose plugin
sudo apt-get update
sudo apt-get install docker-compose-plugin

docker compose version

# Update Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin


# settings
groups
# Если docker отсутствует в списке, добавьте пользователя в группу:
sudo usermod -aG docker pi
newgrp docker
export DOCKER_HOST=unix:///var/run/docker.sock

# Проверьте права доступа к сокету:
ls -l /var/run/docker.sock
```Ожидаемый вывод:
srw-rw---- 1 root docker 0 Jul 16 11:33 /var/run/docker.sock
```

groups
sudo usermod -aG docker pi
newgrp docker
