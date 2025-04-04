# ..\next-pizza\shared\lib\calc-total-pizza-price.ts
# ..\next-pizza\shared\lib\calc-cart-item-total-price.ts

```jsx
  const onClickCountButton = (id: number, quantity: number, type: 'plus' | 'minus') => {
    const newQuantity = type === 'plus' ? quantity + 1 : quantity - 1;
    updateItemQuantity(id, newQuantity);
  };
```