export async function updateGlobalData() {
    try {
// 1. Количество пользователей, участвующих в открытых ставках
        const usersPlay = await prisma.betParticipant.count({
            where: {
                bet: {
                    status: 'OPEN', // Предполагаем, что статус открытой ставки — 'OPEN'
                },
            },
        });

        // 2. Общая сумма ставок в открытых ставках
        const pointsBetResult = await prisma.bet.aggregate({
            _sum: {
                totalBetAmount: true,
            },
            where: {
                status: 'OPEN', // Только открытые ставки
            },
        });
        // Округляем до двух знаков после запятой
        const pointsBet = Math.floor((pointsBetResult._sum.totalBetAmount || 0) * 100) / 100;

        // 3. Количество зарегистрированных пользователей
        const users = await prisma.user.count();

        // 4. Начальные очки (количество пользователей * 1000)
        const pointsStart = Math.floor(users * 1000 * 100) / 100;

        // 5. Сумма всех очков пользователей
        const pointsAllUsersResult = await prisma.user.aggregate({
            _sum: {
                points: true,
            },
        });
        // Округляем до двух знаков после запятой
        const pointsAllUsers = Math.floor((pointsAllUsersResult._sum.points || 0) * 100) / 100;

        // 6. Общая маржа из всех закрытых ставок
        const marginResult = await prisma.betCLOSED.aggregate({
            _sum: {
                margin: true,
            },
        });
        // Округляем до двух знаков после запятой
        const margin = Math.floor((marginResult._sum.margin || 0) * 100) / 100;

        // Additional calculations for Bet3, Bet4, betParticipant3, betParticipant4
        const bet3Result = await prisma.bet3.aggregate({
            _sum: {
                totalBetAmount: true,
            },
            where: {
                status: 'OPEN',
            },
        });
        const bet3 = Math.floor((bet3Result._sum.totalBetAmount || 0) * 100) / 100;

        const bet4Result = await prisma.bet4.aggregate({
            _sum: {
                totalBetAmount: true,
            },
            where: {
                status: 'OPEN',
            },
        });
        const bet4 = Math.floor((bet4Result._sum.totalBetAmount || 0) * 100) / 100;

        const betParticipant3 = await prisma.betParticipant3.count({
            where: {
                bet: {
                    status: 'OPEN',
                },
            },
        });

        const betParticipant4 = await prisma.betParticipant4.count({
            where: {
                bet: {
                    status: 'OPEN',
                },
            },
        });

        // Обновляем или создаем запись в GlobalData
        await prisma.globalData.upsert({
            where: {id: 1},
            update: {
                usersPlay,
                pointsBet,
                users,
                pointsStart,
                pointsAllUsers,
                margin,
                bet3,
                bet4,
                betParticipant3,
                betParticipant4,
            },
            create: {
                id: 1,
                usersPlay,
                pointsBet,
                users,
                pointsStart,
                pointsAllUsers,
                margin,
                bet3,
                bet4,
                betParticipant3,
                betParticipant4,
            },
        });

        revalidatePath("/");
        console.log('GlobalData updated successfully');
    } catch (error) {
        console.error('Error updating GlobalData:', error);
        throw new Error('Failed to update GlobalData');
    }
}