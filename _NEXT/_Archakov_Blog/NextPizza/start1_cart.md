# 12:05 update cart sum
# \\wsl$\Ubuntu\home\pi\Projects\next-pizza\shared\lib\update-cart-total-amount.ts
```jsx
import { prisma } from '@/prisma/prisma-client';
import { calcCartItemTotalPrice } from './calc-cart-item-total-price';

export const updateCartTotalAmount = async (token: string) => {
  const userCart = await prisma.cart.findFirst({
    where: {
      token,
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

  if (!userCart) {
    return;
  }

  const totalAmount = userCart.items.reduce((acc, item) => {
    return acc + calcCartItemTotalPrice(item);
  }, 0);

  return await prisma.cart.update({
    where: {
      id: userCart.id,
    },
    data: {
      totalAmount,
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
};

```
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