export async function gameUserBetDelete(gameUserBetId: number) {
    try {
        const currentUser = await getUserSession();

        if (!currentUser) {
            console.error('Пользователь не найден');
            throw new Error('Пользователь не найден');
        }

        // Найдите ставку в базе данных
        const gameUserBet = await prisma.gameUserBet.findUnique({
            where: { id: Number(gameUserBetId) },
        });

        if (!gameUserBet) {
            console.error('Ставка не найдена');
            throw new Error('Ставка не найдена');
        }

        // Проверьте, является ли текущий пользователь создателем ставки
        if (gameUserBet.gameUserBet1Id !== Number(currentUser.id)) {
            console.error('У вас нет прав для удаления этой ставки');
            throw new Error('У вас нет прав для удаления этой ставки');
        }

        // Проверьте, что статус ставки - OPEN
        if (gameUserBet.statusUserBet !== GameUserBetStatus.OPEN) {
            console.error('Ставку можно удалить только в статусе OPEN');
            throw new Error('Ставку можно удалить только в статусе OPEN');
        }

        // Удалите ставку
        await prisma.gameUserBet.delete({
            where: { id: Number(gameUserBetId) },
        });

        console.log('Ставка успешно удалена');
    } catch (error) {
        console.error('Ошибка при удалении ставки:', error);
        throw new Error('Не удалось удалить ставку');
    }
}


const user = await prisma.user.findUnique({
    where: {id: userId},
});