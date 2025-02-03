import { categories, products, productsItem, players } from './constants';
import { prisma } from './prisma-client';
import { hashSync } from 'bcrypt';

function generateCardId() {
  const length = 16; // Длина идентификатора, например, 16 цифр
  let result = '';
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10); // Добавляем случайную цифру
  }
  return result;
}

async function up() {
  await prisma.user.createMany({

    data: [
      {
        fullName: 'Pi2',
        email: 'umdom2@gmail.com',
        password: hashSync('123123', 10),
        role: 'ADMIN',
        points: 1000,
        cardId: generateCardId(),
      },
      {
        fullName: 'Pi33',
        email: 'umdom33@gmail.com',
        password: hashSync('123123', 10),
        role: 'USER',
        points: 1000,
        cardId: generateCardId(),
      },
      {
        fullName: 'Pi555',
        email: 'umdom555@gmail.com',
        password: hashSync('123123', 10),
        role: 'USER',
        points: 1000,
        cardId: generateCardId(),
      },
      {
        fullName: 'Yatsyk',
        email: 'yatsyk@gmail.com',
        password: hashSync('123123', 10),
        role: 'USER',
        points: 1000,
        cardId: generateCardId(),
      },
      {
        fullName: '123',
        email: '123@123.com',
        password: hashSync('123123', 10),
        role: 'USER',
        points: 1000,
        cardId: generateCardId(),
      },
    ],
  });
  await prisma.category.createMany({
    data: categories,
  });

  await prisma.product.createMany({
    data: products,
  });

  await prisma.productItem.createMany({
    data: productsItem,
  });

  await prisma.player.createMany({
    data: players,
  });
}


async function down() {
  await prisma.$executeRaw`TRUNCATE TABLE "User" RESTART IDENTITY CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Category" RESTART IDENTITY CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Product" RESTART IDENTITY CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "ProductItem" RESTART IDENTITY CASCADE`;
}


async function main() {
  try {
    await down();
    await up();
  } catch (e) {
    console.error(e);
  }
}

main()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
