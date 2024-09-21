https://youtu.be/vrjPzp-bZJo?t=2296

![img.png](img.png)

npx nest g mo auth
npx nest g co auth
npx nest g s auth --no-spec

npx nest g mo users
npx nest g s users --no-spec

cd src/auth/
npx nest g s users --no-spec
npx nest g s password --no-spec --flat
npx nest g s cookie --no-spec --flat
npx nest g gu auth --no-spec --flat

# prisma
```
  id    Int    @id @default(autoincrement())
  email String @unique
  hash  String
  salt  String

  account   Account?
  blockList BlockList?
```
npx prisma db push
npx prisma generate

npm i class-validator class-transformer


