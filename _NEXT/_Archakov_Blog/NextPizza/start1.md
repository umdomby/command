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
# 10:11 comment Doc VSCode /**
# sudo npm install -g jsdoc
# shadcn Sheet --> right panel

```jsx React.FC<React.PropsWithChildren>  ?
export const CartDrawer: React.FC<React.PropsWithChildren> = ({ children }) => {}
```
# figma --> maquette projects

# cart get-cart-item0details.ts 10:47
```jsx
  if (ingredients) {
    details.push(...ingredients.map((ingredient) => ingredient.name));
  }
```
# count-button.tsx  two button and value center  and count-icon-button.tsx -->    + and -
```jsx
interface Props extends CartItemProps {
    
}
```
# localhost:3003/api/cart
# 11:24 store/cart.ts  export type name={};   export interface name={};
# cart to client
..\lib\get-cart-details.ts

# 13:15 react-hot-toast
# 13:30 loading
# 13:53 <Suspense/> use render client
# 14:00 sort pizza \\wsl$\Ubuntu\home\pi\Projects\mynext\lib\find-pizzas.ts
```
export interface GetSearchParams {
  query?: string;
  sortBy?: string;
  sizes?: string;
  pizzaTypes?: string;
  ingredients?: string;
  priceFrom?: string;
  priceTo?: string;
}
```
# 15:40 CheckoutPage
# 16:08:40 block className
# Store Checkout Cart 16:15
# View Products Checkout 16:23:51
# React Form Input 16:37:20 \\wsl$\Ubuntu\home\pi\Projects\next-pizza\shared\components\shared\form
# Zod 16:54:13 firstName: z.string().min(2, { message: 'Имя должно содержать не менее 2-х символов' }),
# DaData 22:56:30 Search address 
# AddressInput 17:20:59
# <Controller render={()=><AddressInput/>}/>
# Server Actions and Mutations NEXT
# 18:15:47  RESEND Send email order resend.com 
# YOOKASSA 18:40:31
# PAY YOOKASSA 18:56:20 actions.ts
# confirm PAY \\wsl$\Ubuntu\home\pi\Projects\next-pizza\app\api\checkout\callback\route.ts
# confirm PAY \\wsl$\Ubuntu\home\pi\Projects\mynext\@types\yookassa.ts
# Tunnel 19:25:00  localtunnel
# console.log(await prisma.product.findFirst(where:{id:9,},),);
# if (searchParams.has('paid')) { 19:44:00  \\wsl$\Ubuntu\home\pi\Projects\next-pizza\shared\components\shared\header.tsx
# NextAuth 19:45:20
# providers.tsx \\wsl$\Ubuntu\home\pi\Projects\next-pizza\shared\components\shared\providers.tsx 19:57:40
# progressbar Next Js TopLoader
# authNext header sessions 20:05:30
# JWTToken 20:16:10 
# auth-modal \\wsl$\Ubuntu\home\pi\Projects\next-pizza\shared\components\shared\modals\auth-modal\forms\register-form.tsx
onClose?: VoidFunction; --> close modal window (Dialog)
# auth login password 20:24:40
# profile 21:12:00
# \\wsl$\Ubuntu\home\pi\Projects\next-pizza\shared\lib\get-user-session.ts 21:16:00
# \\wsl$\Ubuntu\home\pi\Projects\next-pizza\shared\components\shared\profile-form.tsx 21:28:40
# update user \\wsl$\Ubuntu\home\pi\Projects\next-pizza\app\actions.ts 21:36:10