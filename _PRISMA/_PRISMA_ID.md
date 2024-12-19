# https://www.prisma.io/docs/orm/reference/prisma-schema-reference#id

# autoincrement()
```prisma
model User {
  id   Int    @id @default(autoincrement())
  name String
}
```

# cuid()
```prisma
model User {
  id   String @id @default(cuid())
  name String
}
```

# uuid()
```prisma
model User {
  id   String @id @default(uuid())
  name String
}
```