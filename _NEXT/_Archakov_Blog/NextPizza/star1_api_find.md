# app find
# \\wsl$\Ubuntu\home\pi\Projects\next-pizza\app\api\cart\route.ts
```jsx
    const findCartItem = await prisma.cartItem.findFirst({
    where: {
        cartId: userCart.id,
        productItemId: data.productItemId,
        ingredients: {
            every: {
                id: { in: data.ingredients },
            },
        },
    },
});
```