# Базовый образ для установки общих зависимостей
FROM node:22 AS base

# Установите рабочую директорию
WORKDIR /app

# Скопируйте package.json и yarn.lock из одного из проектов, если они идентичны
COPY package.json yarn.lock ./

# Установите зависимости
RUN yarn install --frozen-lockfile

docker build -t my-base-image .




# ---------------- Пример Dockerfile для проекта
# Используйте базовый образ
FROM my-base-image AS builder

# Скопируйте остальной код вашего приложения
COPY . .

# Выполните сборку приложения
RUN yarn build

# Используйте меньший базовый образ для финального контейнера
FROM node:22-slim

# Установите рабочую директорию
WORKDIR /app

# Скопируйте только необходимые файлы из этапа сборки
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Установите переменные окружения, если необходимо
ENV NODE_ENV=production

# Запустите приложение
CMD ["yarn", "start"]