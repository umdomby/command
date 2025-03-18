docker network create sharednetwork

# Убедитесь, что имя контейнера (container_name) уникально, если вы используете его в docker-compose.yml. 
# Если вы не указываете container_name, Docker автоматически генерирует уникальное имя.

     ports:
       - "5433:5432"

     volumes:
       - pg_data_new_project:/var/lib/postgresql/data


# Убедитесь, что переменные окружения, такие как POSTGRES_DB, POSTGRES_USER, и POSTGRES_PASSWORD, соответствуют новому проекту.
# Пример docker-compose.yml для нового проекта:

    services:
        postgres_new_project:
        image: postgres:latest
        container_name: postgres_new_project
        restart: always
        environment:
        POSTGRES_USER: new_user
        POSTGRES_PASSWORD: new_password
        POSTGRES_DB: new_project_db
        volumes:
        - pg_data_new_project:/var/lib/postgresql/data
          - ./new_dump.sql:/docker-entrypoint-initdb.d/new_dump.sql
          ports:
          - "5433:5432"
        
        volumes:
        pg_data_new_project:

1️⃣ Создай файл init-multiple-dbs.sh в корне проекта:
```
    #!/bin/bash
    set -e
    
    # Разделяем список БД по запятой
    IFS=',' read -r -a DBS <<< "$POSTGRES_MULTIPLE_DATABASES"
    
    for db in "${DBS[@]}"; do
    echo "Creating database: $db"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --command "CREATE DATABASE $db;"
    done
```
chmod +x 00-init-multiple-dbs.sh

docker-compose down -v


docker exec -it e0ba3fca84c669e5359add7b605e0170fb1761705d9d038dddd679ff336ea817 psql -U postgres -l

docker logs e0ba3fca84c669e5359add7b605e0170fb1761705d9d038dddd679ff336ea817