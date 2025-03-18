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