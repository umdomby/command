# \\wsl$\Ubuntu\home\pi\Projects\next-pizza\app\api\cart\route.ts

```jsx
 // Если товар был найден, делаем +1
if (findCartItem) {
    await prisma.cartItem.update({
        where: {
            id: findCartItem.id,
        },
        data: {
            quantity: findCartItem.quantity + 1,
        },
    });
} else {
    await prisma.cartItem.create({
        data: {
            cartId: userCart.id,
            productItemId: data.productItemId,
            quantity: 1,
            ingredients: { connect: data.ingredients?.map((id) => ({ id })) },
        },
    });
}
```
# return NextResponse.json(updatedUserCart);


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