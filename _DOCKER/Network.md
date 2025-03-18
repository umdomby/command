docker network create sharednetwork

docker exec -it docker-next-nextjs-1 curl http://localhost:3000

    services:
    newapp:
    build: .
    working_dir: /app
    ports:
    - "4000:4000"  # Пример порта для нового приложения
    volumes:
      - .:/app
      command: ["yarn", "start"]
      env_file:
      - .env
      networks:
      - sharednetwork
    
    networks:
    sharednetwork:
    external: true

# в файле .env
# DATABASE_URL=postgresql://postgres:<password>@postgres:5432/heroes3
