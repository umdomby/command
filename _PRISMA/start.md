npm install prisma @prisma/client
npx prisma init


datasource db {
provider = "postgresql"
url      = env("DATABASE_URL")
}

generator client {
provider = "prisma-client-js"
}

// Пример модели  prisma/schema.prisma
model User {
id    Int     @id @default(autoincrement())
name  String
email String  @unique
}

npx prisma migrate dev --name init
npx prisma generate
npx prisma generate --no-engine

###
rm -rf node_modules/.prisma   # удали старый сгенерированный клиент (если есть)
rm -rf node_modules/@prisma   # иногда помогает
yarn install                  # или npm install, если перешёл
npx prisma generate


rm -rf node_modules
rm -rf yarn.lock   # если используешь yarn, удали lockfile, чтобы заново разрешить зависимости
yarn cache clean   # очисти кэш yarn
yarn install


rm -rf node_modules yarn.lock
npm install

npm install @prisma/adapter-pg pg

### очистка кэша
rm -rf node_modules
rm -rf .next
rm -rf .prisma     # если есть
find . -name ".prisma" -type d -exec rm -rf {} +
# если используешь pnpm — ещё:
rm -rf .turbo      # если есть turborepo