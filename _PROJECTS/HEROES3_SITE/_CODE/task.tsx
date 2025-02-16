model Bet {
    id              Int              @id @default(autoincrement())
    player1         Player           @relation(name: "Player1Bets", fields: [player1Id], references: [id]) // ставки на игрока 1
    player1Id       Int
    player2         Player           @relation(name: "Player2Bets", fields: [player2Id], references: [id]) // ставки на игрока 2
    player2Id       Int
    initBetPlayer1  Float // инициализация ставок на игрока 1
    initBetPlayer2  Float // инициализация ставок на игрока 2
    totalBetPlayer1 Float // Сумма ставок на игрока 1
    totalBetPlayer2 Float // Сумма ставок на игрока 2
    oddsBetPlayer1  Float // Текущий коэффициент для игрока 1
    oddsBetPlayer2  Float // Текущий коэффициент для игрока 2
    maxBetPlayer1   Float // Максимальная сумма ставок на игрока 1
    maxBetPlayer2   Float // Максимальная сумма ставок на игрока 2
    overlapPlayer1  Float // Перекрытие на игрока 1
    overlapPlayer2  Float // Перекрытие на игрока 2
    totalBetAmount  Float            @default(0) // сумма всех ставок.
    creator         User             @relation("BetsCreated", fields: [creatorId], references: [id]) // создатель события
    creatorId       Int
    status          BetStatus        @default(OPEN) // если статус = CLOSED то ставка закрыта, и перемещается в model BetCLOSED
    participants    BetParticipant[]
    categoryId      Int?
        category        Category?        @relation(fields: [categoryId], references: [id])
    productId       Int?
        product         Product?         @relation(fields: [productId], references: [id])
    productItemId   Int?
        productItem     ProductItem?     @relation(fields: [productItemId], references: [id])
    winnerId        Int? // кто победил PLAYER1 или PLAYER2
        margin          Float? // в placeBet = 0
            createdAt       DateTime         @default(now())
    updatedAt       DateTime         @updatedAt
}
// export async function placeBet actions.ts
model BetParticipant {
    id        Int          @id @default(autoincrement())
    betId     Int
    bet       Bet          @relation(fields: [betId], references: [id])
    userId    Int // пользователь который ставит ставку
    user      User         @relation(fields: [userId], references: [id])
    player    PlayerChoice // выбранный игрок в событии
    amount    Float // ставка пользователя
    odds      Float // Коэффициент ставки
    profit    Float // Показывает пользователю потенциальную выигрышную сумму. Сюда не входит маржа. Сюда не входит ставка пользователя, тут чистый потенциальный выигрыш.
    overlap   Float // на какую сумму перекрыто, именно с этого поля ничисляются выигранные суммы.
    margin    Float // в placeBet = 0
    isCovered IsCovered //   OPEN: не перекрыта совсем "0", CLOSED: полностью перекрыта "overlap = profit", PENDING: частично перекрыта "overlap < profit"
    isWinner  Boolean      @default(false) // Победила ли ставка
    createdAt DateTime     @default(now())
}
model BetCLOSED {
    id                 Int                    @id @default(autoincrement())
    participantsCLOSED BetParticipantCLOSED[] @relation("BetCLOSEDParticipants") // Обратная связь
    player1            Player                 @relation(name: "Player1BetsCLOSED", fields: [player1Id], references: [id])
    player1Id          Int
    player2            Player                 @relation(name: "Player2BetsCLOSED", fields: [player2Id], references: [id])
    player2Id          Int
    initBetPlayer1     Float // Инициализация ставок на игрока 1
    initBetPlayer2     Float // Инициализация ставок на игрока 2
    totalBetPlayer1    Float // Сумма ставок на игрока 1
    totalBetPlayer2    Float // Сумма ставок на игрока 2
    oddsBetPlayer1     Float // разница ставок перекрытия на игрока 1
    oddsBetPlayer2     Float // разница ставок перекрытия на игрока 2
    maxBetPlayer1      Float // Максимальная сумма ставок на игрока 1
    maxBetPlayer2      Float // Максимальная сумма ставок на игрока 2
    overlapPlayer1     Float // Перекрытие на игрока 1
    overlapPlayer2     Float // Перекрытие на игрока 2
    totalBetAmount     Float                  @default(0) // Общая сумма ставок
    returnBetAmount    Float                  @default(0)
    creator            User                   @relation("BetsCLOSEDCreated", fields: [creatorId], references: [id])
    creatorId          Int
    status             BetStatus              @default(CLOSED) // Статус ставки
    categoryId         Int?
        category           Category?              @relation(fields: [categoryId], references: [id])
    productId          Int?
        product            Product?               @relation(fields: [productId], references: [id])
    productItemId      Int?
        productItem        ProductItem?           @relation(fields: [productItemId], references: [id])
    winnerId           Int? // ID победителя (без связи)
        margin             Float? // вся маржа события
            createdAt          DateTime               @default(now()) // Дата создания
    updatedAt          DateTime               @updatedAt // Дата обновления
}
// закрыте ставки, после закрытия ставки model BetParticipant переносится в model BetParticipantCLOSED
model BetParticipantCLOSED {
    id          Int          @id @default(autoincrement())
    betCLOSEDId Int
    betCLOSED   BetCLOSED    @relation("BetCLOSEDParticipants", fields: [betCLOSEDId], references: [id]) // Обратная связь
    userId      Int // пользователь который ставит ставку
    user        User         @relation(fields: [userId], references: [id])
    player      PlayerChoice // выбранный игрок в событии
    amount      Float // ставка пользователя
    odds        Float // Коэффициент ставки
    profit      Float // Показывает пользователю потенциальную выигрышную сумму. Сюда не входит маржа. Сюда не входит ставка пользователя, тут чистый потенциальный выигрыш.
    overlap     Float // на какую сумму перекрыто, именно с этого поля ничисляются выигранные суммы.
    margin      Float // маржа пользователя, снимается после закрытия ставки, и только с выигарнной суммой, из поля overlap
    isCovered   IsCovered //   OPEN: не перекрыта совсем "0", CLOSED: полностью перекрыта "overlap = profit", PENDING: частично перекрыта "overlap < profit"
    return      Float // возвращаемая сумма пользователю после победы
    isWinner    Boolean      @default(false) // Победила ли ставка
    createdAt   DateTime     @default(now())
}
// returnBetAmount сумма ставок которая справедливо возвращается победителям:
// 1.Полностью неперебитая ставка возвращается полностью.
// 2.Частично перебита.
// 3.Полностью перебита.
// totalBetAmount должен быть равен returnBetAmount, и после справедливого подсчета, производятся выплаты пользователям.


function calculateOdds(totalWithInitPlayer1: number, totalWithInitPlayer2: number) {
    const totalWithInit = totalWithInitPlayer1 + totalWithInitPlayer2;

    // Calculate odds without margin
    const oddsPlayer1 = totalWithInitPlayer1 === 0 ? 1 : totalWithInit / totalWithInitPlayer1;
    const oddsPlayer2 = totalWithInitPlayer2 === 0 ? 1 : totalWithInit / totalWithInitPlayer2;

    return {
        // Округляем до двух знаков после запятой
        oddsPlayer1: Math.floor((oddsPlayer1 * 100)) / 100,
        oddsPlayer2: Math.floor((oddsPlayer2 * 100)) / 100,
    };
} // Функция для расчета коэффициентов
function calculateMaxBets(initBetPlayer1: number, initBetPlayer2: number): {
    maxBetPlayer1: number,
    maxBetPlayer2: number
} {
    // Округляем до двух знаков после запятой
    const maxBetPlayer1 = Math.floor((initBetPlayer2 * 1.00) * 100) / 100; // 100% от суммы ставок на Player2
    const maxBetPlayer2 = Math.floor((initBetPlayer1 * 1.00) * 100) / 100; // 100% от суммы ставок на Player1
    return {maxBetPlayer1, maxBetPlayer2};
} // Функция для расчета максимальных ставок
export async function clientCreateBet(formData: any) {
    const session = await getUserSession();
    if (!session || session.role !== 'ADMIN') {
        throw new Error('У вас нет прав для выполнения этой операции');
    }

    try {
        const user = await prisma.user.findUnique({
            where: {id: Number(session.id)},
        });

        if (!user) {
            throw new Error("Пользователь не найден");
        }

        // Округляем до двух знаков после запятой
        const totalBetAmount = Math.floor((formData.initBetPlayer1 + formData.initBetPlayer2) * 100) / 100;
        if (totalBetAmount > 100) {
            throw new Error("Сумма начальных ставок не должна превышать 100 баллов");
        }

        const {maxBetPlayer1, maxBetPlayer2} = calculateMaxBets(formData.initBetPlayer1, formData.initBetPlayer2);

        const newBet = await prisma.bet.create({
            data: {
                status: 'OPEN', // Устанавливаем статус ставки как "открытая"
                totalBetAmount: 0, // Общая сумма начальных ставок
                maxBetPlayer1: maxBetPlayer1, // Максимальная сумма ставок на игрока 1
                maxBetPlayer2: maxBetPlayer2, // Максимальная сумма ставок на игрока 2
                // Округляем до двух знаков после запятой
                oddsBetPlayer1: Math.floor((parseFloat(formData.oddsBetPlayer1) * 100)) / 100, // Инициализируем текущие коэффициенты
                oddsBetPlayer2: Math.floor((parseFloat(formData.oddsBetPlayer2) * 100)) / 100, // Инициализируем текущие коэффициенты
                player1Id: formData.player1Id,
                player2Id: formData.player2Id,
                // Округляем до двух знаков после запятой
                initBetPlayer1: Math.floor((parseFloat(formData.initBetPlayer1) * 100)) / 100,
                initBetPlayer2: Math.floor((parseFloat(formData.initBetPlayer2) * 100)) / 100,
                overlapPlayer1: 0, // Перекрытие на игрока 1
                overlapPlayer2: 0, // Перекрытие на игрока 2
                categoryId: formData.categoryId,
                productId: formData.productId,
                productItemId: formData.productItemId,
                creatorId: formData.creatorId,
                totalBetPlayer1: 0, // Инициализируем сумму ставок на игрока 1
                totalBetPlayer2: 0, // Инициализируем сумму ставок на игрока 2
                margin: 0, // Инициализируем общую маржу
            },
        });

        console.log("New bet created:", newBet); // Логируем созданную ставку

        console.log("User points remain unchanged:", user.points); // Логируем неизмененный баланс

        revalidatePath('/');

        return newBet; // Возвращаем созданную ставку
    } catch (error) {
        if (error instanceof Error) {
            console.log(error.stack);
        }
        throw new Error('Failed to create bet. Please try again.');
    }
} // создание ставок
export async function placeBet(formData: { betId: number; userId: number; amount: number; player: PlayerChoice }) {
    try {
        console.log('Запуск функции placeBet с formData:', formData);

        if (!formData || typeof formData !== 'object') {
            throw new Error('Неверные данные формы');
        }

        const {betId, userId, amount, player} = formData;

        if (!betId || !userId || !amount || !player) {
            throw new Error('Отсутствуют обязательные поля в данных формы');
        }

        const bet = await prisma.bet.findUnique({
            where: {id: betId},
            include: {participants: true},
        });

        if (!bet || bet.status !== 'OPEN') {
            throw new Error('Ставка недоступна для участия');
        }

        const user = await prisma.user.findUnique({
            where: {id: userId},
        });

        if (!user || user.points < amount) {
            throw new Error('Недостаточно баллов для совершения ставки');
        }

        const totalPlayer1 = bet.participants
            .filter(p => p.player === PlayerChoice.PLAYER1)
            .reduce((sum, p) => sum + p.amount, 0);

        const totalPlayer2 = bet.participants
            .filter(p => p.player === PlayerChoice.PLAYER2)
            .reduce((sum, p) => sum + p.amount, 0);

        const totalWithInitPlayer1 = totalPlayer1 + (bet.initBetPlayer1 || 0);
        const totalWithInitPlayer2 = totalPlayer2 + (bet.initBetPlayer2 || 0);

        const currentOdds = player === PlayerChoice.PLAYER1 ? bet.oddsBetPlayer1 : bet.oddsBetPlayer2;
        // Check if the odds are too low
        if (currentOdds <= 1.01) {
            throw new Error('Коэффициент ставки слишком низкий. Минимально допустимый коэффициент: 1.02');
        }

        const potentialProfit = Math.floor((amount * (currentOdds - 1)) * 100) / 100;

        const maxAllowedBet = player === PlayerChoice.PLAYER1 ? bet.maxBetPlayer1 : bet.maxBetPlayer2;
        if (amount > maxAllowedBet) {
            throw new Error(`Максимально допустимая ставка: ${maxAllowedBet}`);
        }

        await prisma.betParticipant.create({
            data: {
                betId,
                userId,
                amount,
                player,
                odds: currentOdds,
                profit: potentialProfit,
                margin: 0,
                isCovered: "OPEN",
                overlap: 0,
            },
        });

        await prisma.user.update({
            where: {id: userId},
            data: {
                points: user.points - amount,
            },
        });

        const {
            oddsPlayer1,
            oddsPlayer2
        } = calculateOdds(totalWithInitPlayer1 + (player === PlayerChoice.PLAYER1 ? amount : 0), totalWithInitPlayer2 + (player === PlayerChoice.PLAYER2 ? amount : 0));
        const totalMargin = await prisma.betParticipant.aggregate({
            _sum: {
                margin: true,
            },
            where: {
                betId: betId,
            },
        });

        const updatedBetData = {
            // Округляем до двух знаков после запятой
            oddsBetPlayer1: Math.floor((oddsPlayer1 * 100)) / 100,
            oddsBetPlayer2: Math.floor((oddsPlayer2 * 100)) / 100,
            totalBetPlayer1: player === PlayerChoice.PLAYER1 ? totalPlayer1 + amount : totalPlayer1,
            totalBetPlayer2: player === PlayerChoice.PLAYER2 ? totalPlayer2 + amount : totalPlayer2,
            totalBetAmount: totalPlayer1 + totalPlayer2 + amount,
            margin: totalMargin._sum.margin || 0,
            maxBetPlayer1: player === PlayerChoice.PLAYER1 ? bet.maxBetPlayer1 : bet.maxBetPlayer1 + amount,
            maxBetPlayer2: player === PlayerChoice.PLAYER2 ? bet.maxBetPlayer2 : bet.maxBetPlayer2 + amount,
            overlapPlayer1: player === PlayerChoice.PLAYER1 ? bet.overlapPlayer1 + amount : bet.overlapPlayer1,
            overlapPlayer2: player === PlayerChoice.PLAYER2 ? bet.overlapPlayer2 + amount : bet.overlapPlayer2,
        };

        await prisma.bet.update({
            where: {id: betId},
            data: updatedBetData,
        }).then(async () => {
            await balanceOverlaps(betId);
        }).then(async () => {
            // Обновление статуса isCovered
            const participants = await prisma.betParticipant.findMany({
                where: {betId},
                orderBy: {createdAt: 'asc'},
            });
            for (const participant of participants) {
                let newIsCoveredStatus: IsCovered;

                if (areNumbersEqual(participant.overlap, 0)) {
                    newIsCoveredStatus = IsCovered.OPEN;
                } else if (participant.overlap >= participant.profit) {
                    newIsCoveredStatus = IsCovered.CLOSED;
                } else {
                    newIsCoveredStatus = IsCovered.PENDING;
                }

                if (participant.isCovered !== newIsCoveredStatus) {
                    await prisma.betParticipant.update({
                        where: {id: participant.id},
                        data: {isCovered: newIsCoveredStatus},
                    });
                }
            }
        }).then(async () => {

        });

        revalidatePath('/');

        return {success: true};
    } catch (error) {
        if (error === null || error === undefined) {
            console.error('Ошибка в placeBet: Неизвестная ошибка (error is null или undefined)');
        } else if (error instanceof Error) {
            console.error('Ошибка в placeBet:', error.message);
            console.error('Стек ошибки:', error.stack);
        } else {
            console.error('Ошибка в placeBet:', error);
        }

        throw new Error('Не удалось разместить ставку. Пожалуйста, попробуйте еще раз.');
    }
}// ставки
async function balanceOverlaps(betId: number) {
    console.log(`Начало balanceOverlaps для betId: ${betId}`);

    // Получаем всех участников с данным betId, отсортированных по дате создания
    const participants = await prisma.betParticipant.findMany({
        where: {betId},
        orderBy: {createdAt: 'asc'},
    });

    // Получаем текущие значения overlap для ставки
    let bet = await prisma.bet.findUnique({
        where: {id: betId},
    });

    // Проверяем, что ставка существует
    if (!bet) {
        throw new Error('Ставка не найдена');
    }

    // Вложенная функция для переноса перекрытий между участниками
    async function transferOverlap(
        targetParticipants: BetParticipant[],
        overlapField: 'overlapPlayer1' | 'overlapPlayer2',
        bet: Bet
    ) {
        let processedParticipants = 0; // Счетчик обработанных участников
        const totalParticipants = targetParticipants.length; // Общее количество участников

        // Цикл продолжается, пока не будет достигнуто равенство profit и overlap для всех участников
        // или пока не исчерпаны ресурсы для перекрытия
        while (bet[overlapField] > 0) {
            let allProfitEqualOverlap = true; // Предполагаем, что все равны, пока не найдём исключение

            // Проходим по всем участникам-целям
            for (let i = 0; i < targetParticipants.length; i++) {
                const target = targetParticipants[i];

                // Проверяем, что profit не равен overlap
                if (Math.floor(target.profit * 100) / 100 !== Math.floor(target.overlap * 100) / 100) {
                    allProfitEqualOverlap = false; // Если найдена запись, где profit не равен overlap, продолжаем цикл

                    // Вычисляем, сколько нужно добавить в overlap, чтобы достичь равенства с profit
                    const neededOverlap = Math.floor((target.profit - target.overlap) * 100) / 100;
                    // Определяем, сколько можно добавить в overlap, учитывая доступные ресурсы
                    const overlapToAdd = Math.min(neededOverlap, bet[overlapField]);

                    // Если есть возможность добавить overlap
                    if (overlapToAdd > 0) {
                        // Вычисляем новое значение overlap
                        const newOverlap = Math.floor((target.overlap + overlapToAdd) * 100) / 100;
                        // Проверяем, что новое значение overlap не превышает profit
                        if (newOverlap > target.profit) {
                            throw new Error('Ошибка: overlap не может быть больше profit');
                        }

                        // Обновляем overlap у участника-цели
                        await prisma.betParticipant.update({
                            where: {id: target.id},
                            data: {
                                overlap: newOverlap,
                            },
                        });

                        // Обновляем значение overlap в ставке
                        await prisma.bet.update({
                            where: {id: betId},
                            data: {
                                [overlapField]: Math.floor((bet[overlapField] - overlapToAdd) * 100) / 100,
                            },
                        });

                        // Обновляем объект bet в памяти
                        bet[overlapField] = Math.floor((bet[overlapField] - overlapToAdd) * 100) / 100;

                        // Обновляем локальные данные участника
                        targetParticipants[i].overlap = newOverlap;

                        // Если у источника больше нет доступной суммы, выходим из внутреннего цикла
                        if (bet[overlapField] <= 0) break;
                    }
                }

                processedParticipants++; // Увеличиваем счетчик обработанных участников

                // Выходим из цикла, если все участники обработаны
                if (processedParticipants >= totalParticipants) break;
            }

            // Если все profit равны overlap или все участники обработаны, выходим из внешнего цикла
            if (allProfitEqualOverlap || processedParticipants >= totalParticipants) break;
        }
    }

    // Разделяем участников на две группы: те, кто ставил на PLAYER1, и те, кто ставил на PLAYER2
    const participantsPlayer1 = participants.filter(p => p.player === PlayerChoice.PLAYER1);
    const participantsPlayer2 = participants.filter(p => p.player === PlayerChoice.PLAYER2);

    console.log('Переносим перекрытия от участников PLAYER1');
    await transferOverlap(participantsPlayer1, 'overlapPlayer2', bet);

    console.log('Переносим перекрытия от участников PLAYER2');
    await transferOverlap(participantsPlayer2, 'overlapPlayer1', bet);

    console.log(`Завершение balanceOverlaps для betId: ${betId}`);
} // Функция для балансировки перекрытий
export async function closeBet(betId: number, winnerId: number) {
    const session = await getUserSession();
    if (!session || session.role !== 'ADMIN') {
        throw new Error('У вас нет прав для выполнения этой операции');
    }

    try {
        if (winnerId === null || winnerId === undefined) {
            throw new Error("Не выбран победитель.");
        }

        await prisma.$transaction(async (prisma) => {
            // Обновляем статус ставки и получаем данные
            const bet = await prisma.bet.update({
                where: { id: betId },
                data: {
                    status: 'CLOSED',
                    winnerId: winnerId,
                },
                include: {
                    participants: true,
                    player1: true,
                    player2: true,
                },
            });

            if (!bet) {
                throw new Error("Ставка не найдена");
            }

            // Создаем запись в BetCLOSED
            const betClosed = await prisma.betCLOSED.create({
                data: {
                    player1Id: bet.player1Id,
                    player2Id: bet.player2Id,
                    initBetPlayer1: bet.initBetPlayer1,
                    initBetPlayer2: bet.initBetPlayer2,
                    totalBetPlayer1: bet.totalBetPlayer1,
                    totalBetPlayer2: bet.totalBetPlayer2,
                    maxBetPlayer1: bet.maxBetPlayer1,
                    maxBetPlayer2: bet.maxBetPlayer2,
                    totalBetAmount: bet.totalBetAmount,
                    creatorId: bet.creatorId,
                    status: 'CLOSED',
                    categoryId: bet.categoryId,
                    productId: bet.productId,
                    productItemId: bet.productItemId,
                    winnerId: bet.winnerId,
                    margin: 0, // Инициализируем маржу
                    createdAt: bet.createdAt,
                    updatedAt: bet.updatedAt,
                    oddsBetPlayer1: bet.oddsBetPlayer1,
                    oddsBetPlayer2: bet.oddsBetPlayer2,
                    overlapPlayer1: bet.overlapPlayer1,
                    overlapPlayer2: bet.overlapPlayer2,
                    returnBetAmount: 0, // Инициализируем returnBetAmount
                },
            });

            // Определяем победителя
            const winningPlayer = bet.winnerId === bet.player1Id ? PlayerChoice.PLAYER1 : PlayerChoice.PLAYER2;

            // Обновляем статус участников
            await prisma.betParticipant.updateMany({
                where: { betId: betId },
                data: {
                    isWinner: false,
                },
            });

            await prisma.betParticipant.updateMany({
                where: {
                    betId: betId,
                    player: winningPlayer,
                },
                data: {
                    isWinner: true,
                },
            });

            // Перераспределяем баллы
            const allParticipants = await prisma.betParticipant.findMany({
                where: { betId: betId },
            });

            let totalMargin = 0;
            let totalPointsToReturn = 0; // Сумма всех возвращаемых баллов

            for (const participant of allParticipants) {
                let pointsToReturn = 0;
                let margin = 0;

                if (participant.isWinner) {
                    if (participant.isCovered === "CLOSED") {
                        // Полностью перекрытые ставки
                        margin = participant.profit * MARGIN;
                        pointsToReturn = participant.profit + participant.amount - margin;
                    } else if (participant.isCovered === "PENDING") {
                        // Частично перекрытые ставки
                        const coveredProfit = participant.overlap;
                        margin = coveredProfit * MARGIN;
                        pointsToReturn = coveredProfit + participant.amount - margin;
                    } else if (participant.isCovered === "OPEN") {
                        // Не перекрытые ставки
                        pointsToReturn = participant.amount;
                    }
                    totalMargin += margin;
                }

                console.log(`Participant ID: ${participant.id}, Points to Return: ${pointsToReturn}`);

                // Обновляем баллы пользователя
                if (pointsToReturn > 0) {
                    await prisma.user.update({
                        where: { id: participant.userId },
                        data: {
                            points: {
                                increment: Math.floor(pointsToReturn * 100) / 100,
                            },
                        },
                    });
                }

                // Добавляем к общей сумме возвращаемых баллов
                totalPointsToReturn += pointsToReturn;

                // Создаем запись в BetParticipantCLOSED
                await prisma.betParticipantCLOSED.create({
                    data: {
                        betCLOSEDId: betClosed.id,
                        userId: participant.userId,
                        amount: participant.amount,
                        odds: participant.odds,
                        profit: participant.profit,
                        player: participant.player,
                        isWinner: participant.isWinner,
                        margin: Math.floor(margin * 100) / 100,
                        createdAt: participant.createdAt,
                        isCovered: participant.isCovered,
                        overlap: participant.overlap,
                        return: Math.floor(pointsToReturn * 100) / 100,
                    },
                });
            }

            console.log('Total Points to Return:', totalPointsToReturn);
            console.log('Total Margin:', totalMargin);

            // Проверяем, что сумма всех возвращаемых баллов плюс маржа равна общей сумме ставок
            const discrepancy = totalPointsToReturn + totalMargin - bet.totalBetAmount;
            const totalPointsToReturnTotalMargin = totalPointsToReturn + totalMargin;
            if (Math.abs(discrepancy) > 0.5) {
                console.log("totalPointsToReturn + totalMargin " + totalPointsToReturnTotalMargin)
                console.log("111111111 discrepancy " + discrepancy)
                console.log("222222222 totalPointsToReturn " + totalPointsToReturn)
                console.log("333333333 totalMargin " + totalMargin)
                throw new Error('Ошибка распределения: сумма возвращаемых баллов и маржи не равна общей сумме ставок.');
            } else {
                console.log("111111111 discrepancy " + discrepancy)
                console.log("222222222 totalPointsToReturn " + totalPointsToReturn)
                console.log("333333333 totalMargin " + totalMargin)
                totalMargin -= discrepancy; // Корректируем маржу
            }

            // Обновляем поле returnBetAmount в BetCLOSED
            await prisma.betCLOSED.update({
                where: { id: betClosed.id },
                data: {
                    margin: Math.floor(totalMargin * 100) / 100,
                    returnBetAmount: Math.floor(totalPointsToReturn * 100) / 100, // Записываем сумму возвращенных баллов
                },
            });

            // Удаляем участников и ставку
            // await prisma.betParticipant.deleteMany({
            //     where: { betId: betId },
            // });
            //
            // await prisma.bet.delete({
            //     where: { id: betId },
            // });

        });

        // Ревалидация данных
        revalidatePath('/');
        revalidateTag('bets');
        revalidateTag('user');

        return { success: true, message: 'Ставка успешно закрыта' };
    } catch (error) {
        if (error === null || error === undefined) {
            console.error('Ошибка при закрытии ставки: Неизвестная ошибка (error is null или undefined)');
        } else if (error instanceof Error) {
            console.error('Ошибка при закрытии ставки:', error.message);
            console.error('Стек ошибки:', error.stack);
        } else {
            console.error('Ошибка при закрытии ставки:', error);
        }

        throw new Error('Не удалось закрыть ставку.');
    }
}

Организуй логику равномерного справедливого распределения очков среди победителей у которых ставки полностью и частично перекрыты, у кого вообще не перекрыты тем нужно полностью ставку возвращать.
условия:
1.сумма очков поставленных из системы должна быть равна сумме очков обратно вернувшиеся в систему.
Нужна логика-фориула распределения которая будет из поставленных данных точно распределять суммы, чтобы после распределения totalBetAmount был равен returnBetAmount (returnBetAmount - это все возвращенные победителям ставки + маржа)
возможно нужен цикл (не вечный, чтобы небыло зацикливаний) с формулой, если не получается без погрешности, то можн оустановить погрешность до 0.5 балла (разницу между totalBetAmount returnBetAmount) и эту разницу отнять от маржи. Чтобы в точности
работало условие -  1.сумма очков поставленных из системы должна быть равна сумме очков обратно вернувшиеся в систему.
    используй {Math.floor(variable * 100) / 100}

все справедливо распределенные выплаты должны быть записаны в BetParticipantCLOSED return
const MARGIN = parseFloat('0.05');


Входные данные:
    Участник 1:
betId: 2
userId: 2
player: PLAYER1
amount: 22.0
odds: 2.0
profit: 22.0
overlap: 22.0
isCovered: CLOSED
Участник 2:
betId: 2
userId: 3
player: PLAYER2
amount: 33.0
odds: 2.44
profit: 47.52
overlap: 47.52
isCovered: CLOSED
Участник 3:
betId: 2
userId: 1
player: PLAYER1
amount: 44.0
odds: 2.15
profit: 50.59
overlap: 50.59
isCovered: CLOSED
Участник 4:
betId: 2
userId: 2
player: PLAYER2
amount: 55.0
odds: 2.39
profit: 76.45
overlap: 18.48
isCovered: PENDING
Задание, сделай справидливое распределения выиграшей , чтобы сумма очков поставленных из системы должна быть равна сумме очков обратно вернувшиеся в систему.
    и не возвращай код пока сам не убедишься что он работает. Верни мне код который работает с данным условием! это должно быть реализовано в function closeBet
оставляй все логи и все комментарии

const totalWithInitPlayer1 = totalPlayer1Odds + (bet.initBetPlayer1 || 0); если totalPlayer1Odds больше 50 то это (bet.initBetPlayer1 || 0) = 0

нужно раставить приоритеты для победителей
У кого isCovered=OPEN нужно возвращать в return всю ставку amount.
У кого isCovered=CLOSED  возвращать в return весь amount+overlap.
Тут ВАЖННО! У кого isCovered=PENDING возвращать им всем в return всю ставку amount.
потом посчитать сколько осталось поинтов (сумму их overlap минус сумму их вернувшимся amount) и распределить их между isCovered=PENDING равномерно по соотношению overlap к их amount
- соблюдая условие - сумма очков поставленных из системы должна быть равна сумме очков обратно вернувшиеся в систему


дорогой, здесь все работает, здесь работает самое главное условие - сумма очков поставленных из системы должна быть равна сумме очков обратно вернувшиеся в систему


распредели приорететы: сначала возвращаем points - isCovered=OPEN нужно возвращать в return всю ставку amount, потом isCovered=CLOSED  возвращать в return весь amount+overlap. а потом уже isCovered=PENDING

можно сюда дабавить - чтобы знать кому больше кому меньше нужно смотреть у кого overlap больше заполнен к profit - тому оставшиеся point отдавать больше. смотри соотношение overlap к profit в ставках

маржа должна так добавляться у тех у кого ставка выиграла и isCovered не равн OPEN
/ Вычитаем маржу у победителей

isCovered не равен OPEN
if (pointsToReturn > participant.amount) {
    margin = (pointsToReturn - participant.amount) * MARGIN;
}


так же totalPointsToReturn:
totalPointsToReturn += totalMargin
// Обновляем поле returnBetAmount в BetCLOSED
await prisma.betCLOSED.update({
    where: { id: betClosed.id },
    data: {
        margin: Math.floor(totalMargin * 100) / 100,
        returnBetAmount: Math.floor(totalPointsToReturn * 100) / 100, // Записываем сумму возвращенных баллов
    },
});



добавь расчет маржи у победителей
isCovered не равен OPEN
if (pointsToReturn > participant.amount) {
    margin = (pointsToReturn - participant.amount) * MARGIN;
}
маржа должна отниматься у return и пользователям возвращаться уже с вычтеной маржой



логику оставь, запросов лишних не делай, должно сотаться -
сумма очков поставленных из системы должна быть равна сумме очков обратно вернувшиеся в систему.
    сначала нужно одать очки isCovered=OPEN amount to user.point, потом isCovered=CLOSED amount + overlap - маржа от overlap to user.point,
    а потом равномерно распределить оставшиеся очки isCovered=PENDING to user.point.


