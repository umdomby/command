```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Post {
  id        String   @id @default(cuid())
  title     String
  slug      String   @unique
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```