let productItem;
let productItemNameFind;
let userFindGameCreateTime;
const currentTimeMinusOneHour = new Date();
currentTimeMinusOneHour.setHours(currentTimeMinusOneHour.getHours() - 1);
let gameTime;
try {

    productItemNameFind = await prisma.productItem.findFirst({
        where: {
            name: data.name,
            productId: Number(data.productId),
        }
    })
    if (productItemNameFind) {
        throw new Error('Данный продукт уже существует');
    }
    console.log("111111111")
    userFindGameCreateTime = await prisma.gameCreateTime.findFirst({
        where: {
            userId: data.userId,
        }
    })

    if(!userFindGameCreateTime){
        gameTime = await prisma.gameCreateTime.create({
            data: {
                userId: Number(data.userId),
                category: currentTimeMinusOneHour,
                product: currentTimeMinusOneHour,
                productItem: currentTimeMinusOneHour,
            }
        })

        if (!gameTime) {
            throw new Error('gameTime Error');
        }
    }

    console.log("222222222")
    const currentTime = new Date();
    const lastproductItemTime = await prisma.gameCreateTime.findFirst({
        where: { userId: data.userId}, // предполагаем, что у вас есть текущий пользователь
        select: { productItem: true }
    });
    console.log("lastProductItemTime")
    console.log(lastProductItemTime)

    console.log("3333333333")
    // Проверяем, прошло ли больше 1 минуты
    if (lastProductItemTime && lastProductItemTime.productItem) {
        const timeDiff = currentTime.getTime() - new Date(lastProductItemTime.productItem).getTime();
        if (timeDiff < 60000 * 60) { // 60000 мс = 1 минута
            throw new Error('Вы можете добавлять категории только раз в час');
        }
    }
    console.log("444444444444")
    productItem = await prisma.productItem.create({
        data: {
            name: data.name,
            productId: Number(data.productId),
        }
    })

    if (!productItem) {
        throw new Error('Category Error');
    }

    console.log("555555555555")
    console.log(data.userId)

    const existingRecord = await prisma.gameCreateTime.findFirst({
        where: { userId: data.userId },
    });
    console.log("666666666666")
    if (!existingRecord) {
        throw new Error(`Запись с userId ${data.userId} не найдена`);
    }
    console.log("77777777")
    await prisma.gameCreateTime.update({
        where: { id: existingRecord.id }, // Используем уникальный id
        data: { productItem: currentTime }, // Данные для обновления
    });

    console.log("8888888")
    revalidatePath('/admin/game')

} catch (error) {
    if (error instanceof Error) {
        console.log(error.stack);
    }
    throw new Error('Failed to game your interaction. Please try again.');
}