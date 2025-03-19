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