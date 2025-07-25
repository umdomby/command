import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    await prisma.product.createMany({
        data: [
            {
                name: 'Футболка',
                description: 'Хлопковая футболка',
                price: 19.99,
                stock: 100,
                image: '/images/tshirt.jpg',
            },
            {
                name: 'Джинсы',
                description: 'Классические джинсы',
                price: 49.99,
                stock: 50,
                image: '/images/jeans.jpg',
            },
        ],
    });
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());