# OneToOne
```Prisma
model User {
id        Int        @id @default(autoincrement())
email     String     @unique
hash      String
salt      String
  
blockList BlockList?
}

model BlockList {
id      Int         @id @default(autoincrement())
  
ownerId Int         @unique
owner   User        @relation(fields: [ownerId], references: [id])
  
items   BlockItem[]
}
```

# OneToMany

# ManyToMany
