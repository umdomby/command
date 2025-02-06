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
        fullName: 'Pi',
        email: 'umdom2@gmail.com',
        password: hashSync('123123', 10),
        role: 'ADMIN',
        points: 1000,
        cardId: generateCardId(),
        bankDetails: [
            {"name": "USTD - BSC (BEP20)", "details": "0x51470b98c8737f14958231cb27491b28c5702c13", "description": "BSC (BEP20)"},
            {"name": "BTC", "details": "19hCv645WrUthCNUWb4ncBdHVu6iLhZVow", "description": "Биткойн"},
            {"name": "Технобанк VISA", "details": "4704693052762369 10/27", "description": "IBAN BY95TECN3014000000GRN0029573"},
            {"name": "Технобанк ЕРИП", "details": "(№ Договора - GRN29573)", "description": "Платежи - Банковские, финансовые услуги - Банки, НКФО – Технобанк – Пополнение карты - (№ Договора - GRN29573)"},
            {"name": "Альфа-Банк MasterCard", "details": "5208130010810772 02/29", "description": "IBAN BY17ALFA3014309V9P0050270000"},
            {"name": "Альфа-Банк VISA", "details": "4585 2200 1910 9759 07/29", "description": "IBAN BY77ALFA3014309V9P0010270000"},
            {"name": "Альфа-Банк ЕРИП", "details": "(№ Телефона - 375333814578)", "description": "Платежи - Банковские, финансовые услуги - Банки, НКФО – Альфа-Банк – Пополнение счета - № Телефона - 375333814578"},
            {"name": "MTB MasterCard", "details": "MasterCard: 5351041664841598 04/27", "description": "IBAN BY13MTBK30140008999901709902"},
            {"name": "MTB ЕРИП", "details": "(№ Договора - 33623213)", "description": "Платежи - Банковские, финансовые услуги - Банки, НКФО – MTБанк – Пополнение дебетовой карты - № Договора - 33623213"},
            {"name": "Беларусбанк MIR", "details": "9112380168621532  02/29", "description": "IBAN BY77ALFA3014309V9P0010270000"},
            {"name": "Банк Дабрабыт БЕЛКАРТ", "details": "9112397016744373 02/29", "description": "IBAN BY29MMBN30140116007150001246"},
            {"name": "Банк Дабрабыт EРИП", "details": "IBAN - BY29MMBN30140116007150001246", "description": "Платежи - Банковские, финансовые услуги - Банки, НКФО – MTБанк – Пополнение дебетовой карты - № IBAN - BY29MMBN30140116007150001246"},
        ],

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
