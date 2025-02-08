'use server';
import {prisma} from '@/prisma/prisma-client';
import {getUserSession} from '@/components/lib/get-user-session';
import {Bet, BetParticipant, IsCovered, OrderP2P, PlayerChoice, Prisma} from '@prisma/client';
import {hashSync} from 'bcrypt';
import {revalidatePath, revalidateTag} from 'next/cache';
import axios from "axios";
import {JsonArray} from 'type-fest';

const MARGIN = parseFloat(process.env.MARGIN || '0.05');

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

        // Обновляем или создаем запись в GlobalData
        await prisma.globalData.upsert({
            where: { id: 1 },
            update: {
                usersPlay,
                pointsBet,
                users,
                pointsStart,
                pointsAllUsers,
                margin, // Обновляем общую маржу
            },
            create: {
                id: 1,
                usersPlay,
                pointsBet,
                users,
                pointsStart,
                pointsAllUsers,
                margin, // Создаем запись с общей маржой
            },
        });

        console.log('GlobalData updated successfully');
    } catch (error) {
        console.error('Error updating GlobalData:', error);
        throw new Error('Failed to update GlobalData');
    }
} // Функция для обновления глобальных данных
export async function updateUserInfo(body: Prisma.UserUpdateInput) {
    try {
        const currentUser = await getUserSession();

        if (!currentUser) {
            throw new Error('Пользователь не найден');
        }

        const findUser = await prisma.user.findFirst({
            where: {
                id: Number(currentUser.id),
            },
        });

        if (!findUser) {
            throw new Error('Пользователь не найден в базе данных');
        }

        await prisma.user.update({
            where: {
                id: Number(currentUser.id),
            },
            data: {
                fullName: body.fullName,
                password: body.password ? hashSync(body.password as string, 10) : findUser.password,
            },
        });
    } catch (err) {
        throw err;
    }
} // Функция для обновления информации о пользователе
export async function clientCreateBet(formData: any) {
    const session = await getUserSession();
    if (!session || session.role !== 'ADMIN') {throw new Error('У вас нет прав для выполнения этой операции');}

    try {
        const user = await prisma.user.findUnique({
            where: { id: Number(session.id) },
        });

        if (!user) {
            throw new Error("Пользователь не найден");
        }

        // Округляем до двух знаков после запятой
        const totalBetAmount = Math.floor((formData.initBetPlayer1 + formData.initBetPlayer2) * 100) / 100;
        if (totalBetAmount > 100) {
            throw new Error("Сумма начальных ставок не должна превышать 100 баллов");
        }

        const { maxBetPlayer1, maxBetPlayer2 } = calculateMaxBets(formData.initBetPlayer1, formData.initBetPlayer2);

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
        await updateGlobalData();
        revalidatePath('/');

        return newBet; // Возвращаем созданную ставку
    } catch (error) {
        if (error instanceof Error) {
            console.log(error.stack);
        }
        throw new Error('Failed to create bet. Please try again.');
    }
}
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
    return { maxBetPlayer1, maxBetPlayer2 };
} // Функция для расчета максимальных ставок
function areNumbersEqual(num1: number, num2: number): boolean {
    return Math.abs(num1 - num2) < Number.EPSILON;
}
export async function placeBet(formData: { betId: number; userId: number; amount: number; player: PlayerChoice }) {
    try {
        console.log('Запуск функции placeBet с formData:', formData);

        if (!formData || typeof formData !== 'object') {
            throw new Error('Неверные данные формы');
        }

        const { betId, userId, amount, player } = formData;

        if (!betId || !userId || !amount || !player) {
            throw new Error('Отсутствуют обязательные поля в данных формы');
        }

        const bet = await prisma.bet.findUnique({
            where: { id: betId },
            include: { participants: true },
        });

        if (!bet || bet.status !== 'OPEN') {
            throw new Error('Ставка недоступна для участия');
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || user.points < amount) {
            throw new Error('Недостаточно баллов для совершения ставки');
        }

        const totalPlayer1 = bet.participants
            .filter(p => p.player === PlayerChoice.PLAYER1)
            .reduce((sum, p) => sum + p.profit, 0);

        const totalPlayer2 = bet.participants
            .filter(p => p.player === PlayerChoice.PLAYER2)
            .reduce((sum, p) => sum + p.profit, 0);

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
            where: { id: userId },
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
            oddsBetPlayer1: Math.floor((oddsPlayer1 * (parseFloat(process.env.CORRECT_ODDS || '0.85')) * 100)) / 100,
            oddsBetPlayer2: Math.floor((oddsPlayer2 * (parseFloat(process.env.CORRECT_ODDS || '0.85')) * 100)) / 100,
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
            where: { id: betId },
            data: updatedBetData,
        }).then(async () => {
            await balanceOverlaps(betId);
        }).then(async () => {
            // Обновление статуса isCovered
            const participants = await prisma.betParticipant.findMany({
                where: { betId },
                orderBy: { createdAt: 'asc' },
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
                        where: { id: participant.id },
                        data: { isCovered: newIsCoveredStatus },
                    });
                }
            }
        }).then(async () => {
            await updateGlobalData();
        });

        revalidatePath('/');

        return { success: true };
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
}
async function balanceOverlaps(betId: number) {
    console.log(`Начало balanceOverlaps для betId: ${betId}`);

    // Получаем всех участников с данным betId, отсортированных по дате создания
    const participants = await prisma.betParticipant.findMany({
        where: { betId },
        orderBy: { createdAt: 'asc' },
    });

    // Получаем текущие значения overlap для ставки
    let bet = await prisma.bet.findUnique({
        where: { id: betId },
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
                            where: { id: target.id },
                            data: {
                                overlap: newOverlap,
                            },
                        });

                        // Обновляем значение overlap в ставке
                        await prisma.bet.update({
                            where: { id: betId },
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
    if (!session || session.role !== 'ADMIN') {throw new Error('У вас нет прав для выполнения этой операции');}

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
                    margin: bet.margin,
                    createdAt: bet.createdAt,
                    updatedAt: bet.updatedAt,
                    oddsBetPlayer1: bet.oddsBetPlayer1,
                    oddsBetPlayer2: bet.oddsBetPlayer2,
                    overlapPlayer1: bet.overlapPlayer1,
                    overlapPlayer2: bet.overlapPlayer2,
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

            for (const participant of allParticipants) {
                let pointsToReturn = 0;
                let margin = 0;

                if (participant.isWinner) {
                    if (participant.isCovered === "CLOSED" && participant.profit === participant.overlap) {
                        margin = participant.overlap * MARGIN;
                        pointsToReturn = participant.overlap + participant.amount - margin;
                    } else if (participant.isCovered === "OPEN" && participant.overlap === 0) {
                        pointsToReturn = participant.amount;
                    } else if (participant.isCovered === "PENDING" && participant.profit > participant.overlap) {
                        margin = participant.overlap * MARGIN;
                        pointsToReturn = participant.overlap + participant.amount - margin;
                    }
                    totalMargin += margin;
                } else {
                    if (participant.isCovered === "CLOSED" && participant.profit === participant.overlap) {
                        pointsToReturn = 0;
                    } else if (participant.isCovered === "OPEN" && participant.overlap === 0) {
                        pointsToReturn = participant.amount;
                    } else if (participant.isCovered === "PENDING" && participant.profit > participant.overlap) {
                        pointsToReturn = (participant.amount - (participant.overlap / participant.odds)) / (parseFloat(process.env.LOSE_PENDING_BET || '2'));
                    }
                }

                // Обновляем баллы пользователя
                if (pointsToReturn > 0) {
                    await prisma.user.update({
                        where: { id: participant.userId },
                        data: {
                            // Округляем до двух знаков после запятой
                            points: {
                                increment: Math.floor(pointsToReturn * 100) / 100,
                            },
                        },
                    });
                }

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
                        margin: margin,
                        createdAt: participant.createdAt,
                        isCovered: participant.isCovered,
                        overlap: participant.overlap,
                        // Округляем до двух знаков после запятой
                        return: Math.floor(pointsToReturn * 100) / 100,
                    },
                });
            }

            // Обновляем поле margin в BetCLOSED
            await prisma.betCLOSED.update({
                where: { id: betClosed.id },
                data: {
                    // Округляем до двух знаков после запятой
                    margin: Math.floor(totalMargin * 100) / 100,
                },
            });

            // Удаляем участников и ставку
            await prisma.betParticipant.deleteMany({
                where: { betId: betId },
            });

            await prisma.bet.delete({
                where: { id: betId },
            });

            // Обновляем глобальные данные
            await prisma.globalData.update({
                where: { id: 1 },
                data: {
                    // Округляем до двух знаков после запятой
                    margin: {
                        increment: Math.floor((bet.margin ?? 0) * 100) / 100,
                    },
                },
            });
        });

        // Ревалидация данных
        await updateGlobalData();
        revalidatePath('/');
        revalidateTag('bets');
        revalidateTag('user');

        return { success: true, message: 'Ставка успешно закрыта' };
    } catch (error) {
        console.error("Ошибка при закрытии ставки:", error);

        if (error instanceof Error) {
            throw new Error(error.message);
        } else {
            throw new Error("Не удалось закрыть ставку.");
        }
    }
} // Функция для закрытия ставки
export async function addEditPlayer(playerId: number | null, playerName: string) {
    const session = await getUserSession();
    if (!session || session.role !== 'ADMIN') {throw new Error('У вас нет прав для выполнения этой операции');}
    if (!playerName) {throw new Error('Имя игрока обязательно');}

    try {
        const existingPlayer = await prisma.player.findUnique({
            where: { name: playerName },
        });

        if (existingPlayer) {
            return { success: false, message: 'Игрок с таким именем уже существует' };
        }

        if (playerId) {
            await prisma.player.update({
                where: { id: playerId },
                data: { name: playerName },
            });
        } else {
            await prisma.player.create({
                data: { name: playerName },
            });
        }
        revalidatePath('/add-player');
        return { success: true, message: 'Игрок успешно сохранен' };
    } catch (error) {
        console.error('Ошибка:', error);
        throw new Error('Не удалось обновить игрока');
    }
} // Функция для добавления и редактирование имен игроков, админом
export async function deletePlayer(playerId: number) {
    const session = await getUserSession();
    if (!session || session.role !== 'ADMIN') {throw new Error('У вас нет прав для выполнения этой операции');}

    try {
        await prisma.player.delete({
            where: { id: playerId },
        });
        revalidatePath('/add-player');
        return { success: true, message: 'Игрок успешно удален' };
    } catch (error) {
        console.error('Ошибка при удалении игрока:', error);
        throw new Error('Не удалось удалить игрока');
    }
}
export async function getIpAddress() {
    let ip = 'unknown';
    try {
        const response = await axios.get('https://api.ipify.org?format=json');
        ip = response.data.ip;
        console.log('IP-адрес:', ip);
    } catch (error) {
        console.error('Ошибка при получении IP-адреса:', error);
        ip = 'unknown';
    }
    return ip;
} // Функция для получения IP-адреса из заголовков запроса
export async function referralUserIpAddress(userId: number, ipAddress: string) {
    try {
        // Проверяем, существует ли уже запись с таким IP-адресом для данного пользователя
        const existingEntry = await prisma.referralUserIpAddress.findFirst({
            where: {
                referralUserId: userId,
                referralIpAddress: ipAddress,
            },
        });

        if (existingEntry) {
            console.log('Запись с таким IP-адресом уже существует для данного пользователя');
            return;
        }

        // Создаем новую запись в таблице ReferralUserIpAddress
        await prisma.referralUserIpAddress.create({
            data: {
                referralUserId: userId,
                referralIpAddress: ipAddress,
            },
        });

        console.log('IP адрес успешно сохранен для пользователя:', userId);

        // Обновляем кэш
        // revalidatePath('/');
    } catch (error) {
        console.error('Ошибка при сохранении IP адреса:', error);
        throw new Error('Не удалось сохранить IP адрес');
    }
} // Функция для сохранения IP-адреса пользователя
export async function referralGet() {
    try {
        const currentUser = await getUserSession();
        if (!currentUser) {
            throw new Error('Пользователь не найден');
        }

        // Find the user based on the current session
        const findUser = await prisma.user.findFirst({
            where: {
                id: Number(currentUser.id),
            },
        });

        // Check if the user was found
        if (!findUser) {
            throw new Error('Пользователь не найден в базе данных');
        }

        // Fetch referral IP addresses associated with the user
        const referrals = await prisma.referralUserIpAddress.findMany({
            where: {
                referralUserId: findUser.id, // Corrected to use referralUserId
            },
        });

        return referrals; // Return the list of referral IP addresses
    } catch (error) {
        console.error('Ошибка при получении IP адресов:', error);
        throw new Error('Не удалось получить IP адреса');
    }
}
export async function getEmailByCardId(cardId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { cardId },
        });

        if (user) {
            return { email: user.email };
        } else {
            return { error: 'Пользователь не найден' };
        }
    } catch (error) {
        console.error('Ошибка при получении email:', error);
        return { error: 'Ошибка сервера' };
    }
} // Функция для получения email по cardId
export async function transferPoints(cardId: string, points: number) {
    try {
        const currentUser = await getUserSession();
        if (!currentUser) {
            throw new Error('Пользователь не найден');
        }

        const recipient = await prisma.user.findUnique({
            where: { cardId },
        });

        if (!recipient) {
            throw new Error('Получатель не найден');
        }

        // Округляем points до двух знаков после запятой
        const roundedPoints = Math.floor(points * 100) / 100;

        // Обновление баллов у обоих пользователей
        await prisma.user.update({
            where: { cardId },
            data: { points: { increment: roundedPoints } },
        });

        await prisma.user.update({
            where: { id: Number(currentUser.id) }, // Преобразование id в число
            data: { points: { decrement: roundedPoints } },
        });

        // Логирование перевода
        await prisma.transfer.create({
            data: {
                transferUser1Id: Number(currentUser.id), // Преобразование id в число
                transferUser2Id: recipient.id,
                transferPoints: roundedPoints, // Используем округленные баллы
                transferStatus: true,
            },
        });

        revalidatePath('/transfer-points');
        return true;
    } catch (error) {
        console.error('Ошибка при передаче баллов:', error instanceof Error ? error.message : error);
        return false;
    }
} // Функция для передачи баллов
export async function addBankDetails(newDetail: { name: string; details: string; description: string }) {
    try {
        const currentUser = await getUserSession();
        if (!currentUser) {
            throw new Error('Пользователь не найден');
        }

        const user = await prisma.user.findUnique({
            where: { id: Number(currentUser.id) },
        });

        if (!user) {
            throw new Error('Пользователь не найден в базе данных');
        }

        // Преобразуем bankDetails в массив, если это необходимо
        const bankDetails = Array.isArray(user.bankDetails) ? user.bankDetails : [];

        const updatedBankDetails = [...bankDetails, newDetail];

        await prisma.user.update({
            where: { id: Number(currentUser.id) },
            data: {
                bankDetails: updatedBankDetails as JsonArray, // Указываем тип JsonArray
            },
        });

        return updatedBankDetails;
    } catch (error) {
        console.error('Ошибка при добавлении банковского реквизита:', error);
        throw new Error('Не удалось добавить банковский реквизит');
    }
}
export async function deleteBankDetail(index: number) {
    try {
        const currentUser = await getUserSession();
        if (!currentUser) {
            throw new Error('Пользователь не найден');
        }

        const user = await prisma.user.findUnique({
            where: { id: Number(currentUser.id) },
        });

        if (!user) {
            throw new Error('Пользователь не найден в базе данных');
        }

        // Преобразуем bankDetails в массив, если это необходимо
        const bankDetails = Array.isArray(user.bankDetails) ? user.bankDetails : [];

        const updatedBankDetails = bankDetails.filter((_, i) => i !== index);

        await prisma.user.update({
            where: { id: Number(currentUser.id) },
            data: {
                bankDetails: updatedBankDetails as JsonArray, // Указываем тип JsonArray
            },
        });

        return updatedBankDetails;
    } catch (error) {
        console.error('Ошибка при удалении банковского реквизита:', error);
        throw new Error('Не удалось удалить банковский реквизит');
    }
}
export async function updateBankDetails(updatedDetails: { name: string; details: string; description: string }[]) {
    try {
        const currentUser = await getUserSession();
        if (!currentUser) {
            throw new Error('Пользователь не найден');
        }

        await prisma.user.update({
            where: { id: Number(currentUser.id) },
            data: {
                bankDetails: updatedDetails,
            },
        });

        return updatedDetails;
    } catch (error) {
        console.error('Ошибка при обновлении банковских реквизитов:', error);
        throw new Error('Не удалось обновить банковские реквизиты');
    }
}
export async function createBuyOrder(points: number, bankDetails: any[], allowPartial: boolean) {
    try {
        const currentUser = await getUserSession();
        if (!currentUser) {
            throw new Error('Пользователь не найден');
        }

        if (points < 30 || points > 100000) {
            throw new Error('Количество points должно быть от 30 до 100000');
        }

        const newOrder = await prisma.orderP2P.create({
            data: {
                orderP2PUser1Id: Number(currentUser.id),
                orderP2PBuySell: 'BUY',
                orderP2PPoints: points,
                orderP2PPart: allowPartial,
                orderBankDetails: bankDetails,
                orderP2PStatus: 'OPEN',
            },
        });

        revalidatePath('/order-p2p');
        return newOrder;
    } catch (error) {
        console.error('Ошибка при создании заявки на покупку:', error);
        throw new Error('Не удалось создать заявку на покупку');
    }
} // Функция для создания заявки на покупку points
export async function createSellOrder(points: number, bankDetails: any[],  allowPartial: boolean) {
    try {
        const currentUser = await getUserSession();
        if (!currentUser) {
            throw new Error('Пользователь не найден');
        }

        if (points < 30 || points > 100000) {
            throw new Error('Количество points должно быть от 30 до 100000');
        }

        const user = await prisma.user.findUnique({
            where: { id: Number(currentUser.id) },
        });

        if (!user || user.points < points) {
            throw new Error('Недостаточно points для продажи');
        }

        const newOrder = await prisma.orderP2P.create({
            data: {
                orderP2PUser1Id: Number(currentUser.id),
                orderP2PBuySell: 'SELL',
                orderP2PPoints: points,
                orderP2PPart: allowPartial,
                orderBankDetails: bankDetails,
                orderP2PStatus: 'OPEN',
            },
        });

        await prisma.user.update({
            where: { id: Number(currentUser.id)},
            data: {
                points: {
                    decrement: points,
                },
            },
        });

        revalidatePath('/order-p2p');
        return newOrder;
    } catch (error) {
        console.error('Ошибка при создании заявки на продажу:', error);
        throw new Error('Не удалось создать заявку на продажу');
    }
} // Функция для создания заявки на продажу points
export async function closeBuyOrderOpen(orderId: number) {
    try {
        const currentUser = await getUserSession();
        if (!currentUser) {
            throw new Error('Пользователь не найден');
        }

        // Обновление статуса сделки на RETURN
        await prisma.orderP2P.update({
            where: { id: orderId },
            data: { orderP2PStatus: 'RETURN' },
        });

        // Здесь можно добавить дополнительную логику, если необходимо
        revalidatePath('/order-p2p');
        return true;
    } catch (error) {
        console.error('Ошибка при закрытии сделки покупки:', error instanceof Error ? error.message : error);
        return false;
    }
} // Функция закрытия открытой сделки покупки
export async function closeSellOrderOpen(orderId: number) {
    try {
        const currentUser = await getUserSession();
        if (!currentUser) {
            throw new Error('Пользователь не найден');
        }

        // Получение сделки для возврата points
        const order = await prisma.orderP2P.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            throw new Error('Сделка не найдена');
        }

        // Возврат points пользователю
        await prisma.user.update({
            where: { id: Number(currentUser.id)},
            data: { points: { increment: order.orderP2PPoints || 0 } },
        });

        // Обновление статуса сделки на RETURN
        await prisma.orderP2P.update({
            where: { id: orderId },
            data: { orderP2PStatus: 'RETURN' },
        });
        revalidatePath('/order-p2p');
        return true;
    } catch (error) {
        console.error('Ошибка при закрытии сделки продажи:', error instanceof Error ? error.message : error);
        return false;
    }
} // Функция закрытия открытой сделки продажи
export async function getOpenOrders(): Promise<OrderP2P[]> {
    try {
        return await prisma.orderP2P.findMany({
            where: {orderP2PStatus: 'OPEN'},
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                orderP2PUser1: {
                    select: {
                        id: true,
                        cardId: true,
                        // Добавьте другие необходимые поля
                    }
                },
                orderP2PUser2: {
                    select: {
                        id: true,
                        cardId: true,
                        // Добавьте другие необходимые поля
                    }
                }
            }
        });
    } catch (error) {
        console.error('Ошибка при получении открытых заказов:', error);
        throw new Error('Не удалось получить открытые заказы'); // Выбрасывание ошибки для лучшей обработки
    }
} // 5 секунд обновление открытых сделок для OrderP2PComponent

// ################################################

// подтверждение оплаты для продажи
export async function confirmSellOrderUser2(orderId: number) {
    try {
        const currentUser = await getUserSession();
        if (!currentUser) {
            throw new Error('Пользователь не найден');
        }

        // Обновляем статус сделки и подтверждение пользователя 2
        await prisma.orderP2P.update({
            where: { id: orderId },
            data: {
                orderP2PCheckUser2: true,
            },
        });

        revalidatePath('/order-p2p');
        return true;
    } catch (error) {
        console.error('Ошибка при подтверждении оплаты для продажи:', error instanceof Error ? error.message : error);
        return false;
    }
}

// завершение сделки-продажи, подтверждением создателем
export async function confirmSellOrderCreator(orderId: number) {
    try {
        const currentUser = await getUserSession();
        if (!currentUser) {
            throw new Error('Пользователь не найден');
        }

        // Получаем сделку
        const order = await prisma.orderP2P.findUnique({ where: { id: orderId } });

        if (order?.orderP2PCheckUser2) {
            // Обновляем статус сделки и подтверждение пользователя 1
            await prisma.orderP2P.update({
                where: { id: orderId },
                data: {
                    orderP2PCheckUser1: true,
                    orderP2PStatus: 'CLOSED',
                },
            });

            // Обновляем баланс пользователя
            await prisma.user.update({
                where: { id: order.orderP2PUser2Id },
                data: {
                    points: { increment: order.orderP2PPoints || 0 },
                },
            });
        }

        revalidatePath('/order-p2p-pending');
        return true;
    } catch (error) {
        console.error('Ошибка при завершении сделки-продажи:', error instanceof Error ? error.message : error);
        return false;
    }
}

// подтверждение оплаты для покупки
export async function confirmBuyOrderUser2(orderId: number) {
    try {
        const currentUser = await getUserSession();
        if (!currentUser) {
            throw new Error('Пользователь не найден');
        }

        // Получаем сделку
        const order = await prisma.orderP2P.findUnique({ where: { id: orderId } });

        if (order?.orderP2PCheckUser1) {

            await prisma.$transaction(async (prisma) => {
                const order = await prisma.orderP2P.findUnique({
                    where: { id: orderId },
                });

                if (!order) {
                    throw new Error('Сделка не найдена');
                }

                await prisma.user.update({
                    where: { id: order.orderP2PUser1Id },
                    data: {
                        points: { increment: order.orderP2PPoints },
                    },
                });

                await prisma.orderP2P.update({
                    where: { id: orderId },
                    data: {
                        orderP2PCheckUser2: true,
                        orderP2PStatus: 'CLOSED',
                    },
                });
            });
        }

        revalidatePath('/order-p2p-pending');
        return true;
    } catch (error) {
        console.error('Ошибка при подтверждении оплаты для покупки:', error instanceof Error ? error.message : error);
        return false;
    }
}

// завершение сделки-покупки, подтверждением создателем оплаты price
export async function confirmBuyOrderCreator(orderId: number) {
    try {
        const currentUser = await getUserSession();
        if (!currentUser) {
            throw new Error('Пользователь не найден');
        }
        console.log("111111111 "  + orderId)
        await prisma.orderP2P.update({
            where: { id: Number(orderId)},
            data: {
                orderP2PCheckUser1: true,
            },
        });


        revalidatePath('/order-p2p-pending');
        return true;
    } catch (error) {
        console.error('Ошибка при завершении сделки-покупки:', error instanceof Error ? error.message : error);
        return false;
    }
}

// Функция для открытия сделки покупки
export async function openBuyOrder(orderId: number, userId: number, bankDetails: any, price: number, points: number) {
    try {
        const currentUser = await getUserSession();
        if (!currentUser) {
            throw new Error('Пользователь не найден');
        }

        // Обновляем сделку
        await prisma.orderP2P.update({
            where: { id: orderId },
            data: {
                orderP2PUser2Id: userId,
                orderBankPay: bankDetails,
                orderP2PPrice: price,
                orderP2PStatus: 'PENDING',
            },
        });

        // Списываем Points у пользователя, который заключает сделку
        await prisma.user.update({
            where: { id: userId },
            data: {
                points: { decrement: points },
            },
        });

        revalidatePath('/order-p2p');
        return true;
    } catch (error) {
        console.error('Ошибка при открытии сделки покупки:', error instanceof Error ? error.message : error);
        return false;
    }
}

// Функция для открытия сделки продажи
export async function openSellOrder(orderId: number, userId: number, bankDetails: any, price: number) {
    try {
        const currentUser = await getUserSession();
        if (!currentUser) {
            throw new Error('Пользователь не найден');
        }

        // Обновляем сделку
        await prisma.orderP2P.update({
            where: { id: orderId },
            data: {
                orderP2PUser2Id: userId,
                orderBankPay: bankDetails,
                orderP2PPrice: price,
                orderP2PStatus: 'PENDING',
            },
        });

        revalidatePath('/order-p2p');
        return true;
    } catch (error) {
        console.error('Ошибка при открытии сделки продажи:', error instanceof Error ? error.message : error);
        return false;
    }
}


