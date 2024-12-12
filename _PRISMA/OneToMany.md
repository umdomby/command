# one-to-many --> 'model Category' to 'model Product'
```prisma
model Category {
    products Product[]
}
model Product {
    category   Category @relation(fields: [categoryId], references: [id])
    categoryId Int
}
```



https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/one-to-many-relations

# Отношения «один ко многим»
Эта страница знакомит с отношениями «один ко многим» и объясняет, как их использовать в схеме Prisma.
Отношения «один ко многим» (1-n) относятся к отношениям, в которых одна запись на одной стороне отношения может быть связана с нулем 
или более записей на другой стороне. В следующем примере существует одно отношение «один ко многим» между моделями User и Post:

```prisma
model User {
  id    Int    @id @default(autoincrement())
  posts Post[]
}

model Post {
  id       Int  @id @default(autoincrement())
  author   User @relation(fields: [authorId], references: [id])
  authorId Int
}
// Примечание Поле posts не «проявляется» в базовой схеме базы данных. С другой стороны отношения аннотированное поле отношения author
// и его скаляр отношения authorId представляют сторону отношения, которая хранит внешний ключ в базовой базе данных.
```


# Это отношение «один ко многим» выражает следующее:
«пользователь может иметь ноль или более сообщений»
«у сообщения всегда должен быть автор»
В предыдущем примере поле отношения автора модели Post ссылается на поле id модели User. Вы также можете ссылаться на другое поле. 
В этом случае вам необходимо пометить поле атрибутом @unique, чтобы гарантировать, что с каждым сообщением связан только один пользователь. 
В следующем примере поле автора ссылается на поле электронной почты в модели User, которое помечено атрибутом @unique:

```Prisma
model User {
  id    Int    @id @default(autoincrement())
  email String @unique // <-- add unique attribute
  posts Post[]
}

model Post {
  id          Int    @id @default(autoincrement())
  authorEmail String
  author      User   @relation(fields: [authorEmail], references: [email])
}
```


