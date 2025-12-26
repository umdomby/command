yarn add next@latest react@latest react-dom@latest

npx create-next-app@latest
Есть новые готовые решения Next для новостных лент, с админкой и регистрацией пользователей, 
распределение ролей. Next Postgres Prisma - у меня есть свое решение, как лучше сделать свое или найти готовое?


https://nextjs.org/blog/next-15
https://nextjs.org/docs
https://nextjs.org/docs/app/getting-started

# Use the new automated upgrade CLI
npx @next/codemod@canary upgrade latest

# ...or upgrade manually
npm install next@latest react@rc react-dom@rc


### npx create-next-app@latest
# prisma https://www.prisma.io/docs/getting-started
https://www.prisma.io/docs/getting-started/setup-prisma/start-from-scratch/relational-databases-typescript-postgresql
cd prisma

https://www.prisma.io/docs/getting-started/setup-prisma/start-from-scratch/relational-databases/connect-your-database-typescript-postgresql
https://www.prisma.io/docs/getting-started/setup-prisma/start-from-scratch/relational-databases/connect-your-database-typescript-postgresql

### npm install prisma typescript tsx @types/node --save-dev
### cd prisma $npx prisma
```prisma prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```
$yarn add @prisma/client
bcrypt
