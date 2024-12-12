# Отношения | Relations
# https://www.prisma.io/docs/orm/prisma-schema/data-model/relations#relations-in-prisma-client

```prisma
model User {
  id    String @id @default(auto()) @map("_id") @db.ObjectId
  posts Post[]
}

model Post {
  id       String @id @default(auto()) @map("_id") @db.ObjectId
  author   User   @relation(fields: [authorId], references: [id])
  authorId String @db.ObjectId // relation scalar field  (used in the `@relation` attribute above)
}
```

# Создать запись и вложенные
# Следующий запрос создает Userзапись и две связанные Postзаписи:
```tsx
const userAndPosts = await prisma.user.create({
  data: {
    posts: {
      create: [
        { title: 'Prisma Day 2020' }, // Populates authorId with user's id
        { title: 'How to write a Prisma schema' }, // Populates authorId with user's id
      ],
    },
  },
})
```

# Извлечь запись и включить связанные
# Следующий запрос извлекает a Userи idвключает все связанные Postзаписи:
```tsx
const getAuthor = await prisma.user.findUnique({
  where: {
    id: "20",
  },
  include: {
    posts: true, // All posts where authorId == 20
  },
});
```

# Свяжите существующую запись с другой существующей
# Следующий запрос связывает существующую Postзапись с существующей Userзаписью:
```tsx
const updateAuthor = await prisma.user.update({
  where: {
    id: 20,
  },
  data: {
    posts: {
      connect: {
        id: 4,
      },
    },
  },
})
```


