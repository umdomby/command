# LIB find cart and create cart
# \\wsl$\Ubuntu\home\pi\Projects\next-pizza\shared\lib\find-or-create-cart.ts

```jsx
export const findOrCreateCart = async (token: string) => {
    let userCart = await prisma.cart.findFirst({
        where: {
            token,
        },
    });

    if (!userCart) {
        userCart = await prisma.cart.create({
            data: {
                token,
            },
        });
    }

    return userCart;
};
```