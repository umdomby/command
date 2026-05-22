sudo apt update && sudo apt upgrade -y
sudo apt install curl -y

# Устанавливаем Docker (официальный способ)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Проверяем, что Docker работает
docker version

# Создаём PostgreSQL
mkdir -p ~/postgres-data

# Теперь запускаем PostgreSQL:
docker run -d \
--name postgres \
-e POSTGRES_USER=postgres \
-e POSTGRES_PASSWORD=We..3\
-e POSTGRES_DB=main \
-p 5432:5432 \
-v ~/postgres-data:/var/lib/postgresql/data \
--restart unless-stopped \
postgres:16-alpine


docker ps

# Проверим логи:
docker logs postgres

# Зайти в PostgreSQL
docker exec -it postgres psql -U postgres

# Перезапустить контейнер
docker restart postgres

# Остановить
docker stop postgres
docker rm postgres

# Проверь подключение изнутри Droplet
docker exec -it postgres psql -U postgres -d main

# Droplet должен быть открыт порт 5432:
sudo ufw allow 5432/tcp
sudo ufw reload