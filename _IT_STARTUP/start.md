

npx create-next-app@latest .
pnpm install prisma @prisma/client

npx prisma init
\\wsl.localhost\Ubuntu-24.04\home\pi\command\_IT_STARTUP\schema.prisma

.env
POSTGRES_PRISMA_URL=postgresql://postgres:
POSTGRES_URL_NON_POOLING=postgresql://postgres:

npx prisma migrate dev --name init
npx prisma generate

npx prisma db seed