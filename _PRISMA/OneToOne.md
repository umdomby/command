# ONE ONE MANY MANY
# one-to-one --> model User to model Cart
```prisma
model User {
  cart             Cart?
}
model Cart {
  id Int @id @default(autoincrement())

  user   User? @relation(fields: [userId], references: [id])
  userId Int?  @unique
}

```