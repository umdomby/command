# many-to-many --> 'model Ingredient' to 'model Product'
```prisma
model Ingredient {
  products  Product[]
}
model Product {
  ingredients Ingredient[]
}
```