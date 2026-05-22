с постоянным хранилищем (рекомендую)
PowerShell# Создаём volume один раз

```
docker volume create postgres-data
```

```
docker run --name postgres \
-e POSTGRES_PASSWORD=admin \
-e POSTGRES_USER=123123 \
-p 5432:5432 \
-v postgres-data:/var/lib/postgresql/data \
-d \
--restart unless-stopped \
postgres:16
```

or disk windows

# 1. Создай папку на Windows (один раз)
```
mkdir C:\docker\postgres-data
```

# 2. Запусти контейнер с привязкой к этой папке
```
docker run --name postgres `
  -e POSTGRES_PASSWORD=123123 `
-e POSTGRES_USER=admin `
  -p 5432:5432 `
-v "C:\docker\postgres-data:/var/lib/postgresql/data" `
  -d `
--restart unless-stopped `
postgres:16
```

docker stop postgres 2>$null; docker rm postgres 2>$null; Remove-Item -Recurse -Force C:\docker\postgres-data -ErrorAction SilentlyContinue; mkdir C:\docker\postgres-data

docker run --name postgres -e POSTGRES_PASSWORD=123123 -p 5432:5432 -v "C:\docker\postgres-data:/var/lib/postgresql/data" -d --restart unless-stopped postgres:16
or
docker run --name postgres -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=123123 -e POSTGRES_HOST_AUTH_METHOD=trust -p 5432:5432 -v "C:\docker\postgres-data:/var/lib/postgresql/data" -d --restart unless-stopped postgres:16

# слушает ли порт на Windows
netstat -ano | findstr :5432

# посмотреть пользователей
docker exec -it postgres psql -U admin -c "\du"

# Если не пустит (скажет пароль) — попробуй так:  (введи пароль 123123 когда попросит)
docker exec -it postgres psql -U admin --password

ALTER USER admin WITH PASSWORD '123123';
\q
docker restart postgres

# 1. Посмотри список всех баз
docker exec -it postgres psql -U admin -c "\l"

# 2. Попробуй подключиться к базе postgres
docker exec -it postgres psql -U admin -d postgres

# 1. Включи "trust" для внешних подключений временно
docker exec -it postgres psql -U admin -c "ALTER SYSTEM SET password_encryption = 'scram-sha-256';"

# Перезаписываем pg_hba.conf на trust
docker exec -it postgres bash -c '
cat > /var/lib/postgresql/data/pg_hba.conf << EOF
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             all                                     trust
host    all             all             0.0.0.0/0               trust
host    all             all             ::/0                    trust
EOF
'
# pg_hba.conf
docker exec -it postgres cat /var/lib/postgresql/data/pg_hba.conf

# pg_hba.conf выглядит правильно — в конце есть строка:
confhost all all all trust

# клиент postgres (WSL)
sudo apt update && sudo apt install -y postgresql-client

#
psql -h localhost -p 5432 -U admin -d postgres

# Попробуй в pgAdmin вместо localhost написать:
host.docker.internal
```
docker exec -it postgres bash -c '
cat > /var/lib/postgresql/data/pg_hba.conf << EOF
# TYPE  DATABASE  USER  ADDRESS  METHOD
local   all       all            trust

# IPv4
host    all       all   127.0.0.1/32      trust
host    all       all   ::1/128           trust
host    all       all   0.0.0.0/0         trust

# IPv6
host    all       all   ::/0              trust
EOF
'
```

# Принудительно очищаем кэш неиспользуемых данных Docker
docker restart postgres
docker volume prune -f

# 5433
docker run --name postgres -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=123123 -p 5433:5432 -v pgdata:/var/lib/postgresql/data -d --restart unless-stopped postgres:16

