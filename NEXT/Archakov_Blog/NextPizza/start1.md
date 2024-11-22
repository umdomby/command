'use client';

npx create-next-app@latest

# npx install component
ui.shadcn.com

npx shadcn@latest init

npm install -g npm@10.9.0

npx shadcn@latest add button

https://ui.shadcn.com/themes

# icon
Lucide.dev (React)

# shared/components/shared  *переиспользует*  shared/components/ui

# icon
$ yarn add lucide-react  

# react-use
state -->
https://streamich.github.io/react-use/?path=/story/sensors-useintersection--demo

# zustand

# 2:26:30 backend
# vercel_prisma_next
https://prisma.io  @prisma/client  2:47:10
$ prisma db push
$ prisma db seed

# create API
# NEXT https://nextjs.org/docs/app/building-your-application/routing/route-handlers
Extended NextRequest and NextResponse APIs

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
# many-to-many --> 'model Ingredient' to 'model Product'
```prisma
model Ingredient {
  products  Product[]
}
model Product {
  ingredients Ingredient[]
}
```
#   ? Вариация
size      Int?
pizzaType Int?

# seed 4:25:00
# seed generated product 4:44:00
# contains: query, --> поиск по буквам, а не по строгому значению
# GET {{host}}/api/products/search?query=сыр

# useClickAway --> былли клие воиспроизведен вне этого блока <div>
# поиск 5:32:00
# .env NEXT_PUBLIC_...


npx shadcn@latest add table

# SORT!!! ingredients SORT GAME
6:38:15 отображение продуктов filters
qs href
use-filters hooks
7:24:25 конец фильтрации

# 7:25:40 View Products
# 7:36:30 page product/[id]/page.tsx
# decodeURI(name) pizza/[name]/page.txt
# 7:52:00 product group-variants.tsx
# NEXT Route Groups 7:58 App-->page root and Dashboard-->Modal window,  main layout.tsx-->Metadata no
# 8:15 NEXT Parallel Routes Modal
# 8:40 modals chose-pizza-form.tsx  (modals/choose-product-modal.tsx)
# @types prisma.ts 
    ```
    import { Ingredient, Product, ProductItem } from '@prisma/client';
    export type ProductWithRelations = Product & { items: ProductItem[]; ingredients: Ingredient[] };
    ```
# 9:05 constant/pizza.ts

```to array key-value
    export const pizzaSizes = Object.entries(mapPizzaSize).map(([value, name]) => ({
        name,
        value,
    }));
```
# 9:40 choose-pizza-form.tsx--> hooks-->use-pizza=options.tsx 
```
const currentItemId = items.find((item) => item.pizzaType === type && item.size === size)?.id;
```
# href
```
str.replace(/ /g, "/")
str.replaceAll(" ", "/")
```








