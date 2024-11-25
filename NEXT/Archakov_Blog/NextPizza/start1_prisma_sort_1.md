```jsx
 const userCart = await prisma.cart.findFirst({
    where: {
        OR: [
            {
                token,
            },
        ],
    },
    include: {
        items: {
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                productItem: {
                    include: {
                        product: true,
                    },
                },
                ingredients: true,
            },
        },
    },
});
```