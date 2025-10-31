# justify-items-center - center horizontal блоки друг за другом вертикально
# flex justify-center - блоки друг за другом горизонтально
# content-center - center vertical
# h-[100%] - ширина
# w-[90%] - вертикаль
# font-bold - front bold

# flex
```css
.flex {     display: flex; }
```
# flex-col
```css
.flex-col {     flex-direction: column; }
```
# gap-16 gap-[80px]
```css
.gap-16 {     gap: 4rem/* 64px */; }
```
# flex-1
```css
.flex-1 {     flex: 1 1 0%; }
```
# flex
```css
.flex {     display: flex; }
```
# gap-[80px]
```css
.gap-\[80px\] {     gap: 80px; }
```

# grid
```tsx
<div className={cn('grid grid-cols-4-All gap-[5px]', listClassName)}>
    {items.map((product, i) => (
        <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            imageUrl={product.imageUrl}
            price={product.items[0].price}
            ingredients={product.ingredients}
        />
    ))}
</div>

<div className="justify-items-center content-center p-1 bg-secondary rounded-lg h-[100%]">
    <Title text={name} size="xs" className="font-bold line-clamp-1 ml-1"/>
    <img className="w-[90%] h-[88%]" src={imageUrl} alt={name}/>
</div>
```
