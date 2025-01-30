'use server';
import { prisma } from '@/prisma/prisma-client';
import { getUserSession } from '@/components/lib/get-user-session';
import { PlayerChoice, Prisma, IsCovered } from '@prisma/client';
import { hashSync } from 'bcrypt';
import { revalidatePath, revalidateTag } from 'next/cache';
import requestIp from 'request-ip';
import axios from 'axios';

const MARGIN = 0.05; // Маржа 5%

// Функция для обновления глобальных данных
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
    const pointsBet = parseFloat((pointsBetResult._sum.totalBetAmount || 0).toFixed(2));

    // 3. Количество зарегистрированных пользователей
    const users = await prisma.user.count();

    // 4. Начальные очки (количество пользователей * 1000)
    const pointsStart = parseFloat((users * 1000).toFixed(2));

    // 5. Сумма всех очков пользователей
    const pointsAllUsersResult = await prisma.user.aggregate({
      _sum: {
        points: true,
      },
    });
    const pointsAllUsers = parseFloat((pointsAllUsersResult._sum.points || 0).toFixed(2));

    // 6. Общая маржа из всех закрытых ставок
    const marginResult = await prisma.betCLOSED.aggregate({
      _sum: {
        margin: true,
      },
    });
    const margin = parseFloat((marginResult._sum.margin || 0).toFixed(2));

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
}

// Функция для обновления информации о пользователе
export async function updateUserInfo(body: Prisma.UserUpdateInput) {
  try {
    const currentUser = await getUserSession();

    if (!currentUser) {
      throw new Error('Пользователь не найден');
    }

    const findUser = await prisma.user.findFirst({
      where: {
        id: Number(currentUser.id),
      },
    });

    await prisma.user.update({
      where: {
        id: Number(currentUser.id),
      },
      data: {
        fullName: body.fullName,
        email: body.email,
        password: body.password ? hashSync(body.password as string, 10) : findUser?.password,
      },
    });
  } catch (err) {
    throw err;
  }
}

export async function clientCreateBet(formData: any) {
  const session = await getUserSession();
  if (!session) {
    throw new Error("User session is not available.");
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(session.id) },
    });

    if (!user) {
      throw new Error("Пользователь не найден");
    }

    const totalBetAmount = parseFloat((formData.initBetPlayer1 + formData.initBetPlayer2).toFixed(2));
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
        oddsBetPlayer1: parseFloat(formData.oddsBetPlayer1.toFixed(2)), // Инициализируем текущие коэффициенты
        oddsBetPlayer2: parseFloat(formData.oddsBetPlayer2.toFixed(2)), // Инициализируем текущие коэффициенты
        player1Id: formData.player1Id,
        player2Id: formData.player2Id,
        initBetPlayer1: parseFloat(formData.initBetPlayer1.toFixed(2)),
        initBetPlayer2: parseFloat(formData.initBetPlayer2.toFixed(2)),
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

// Функция для расчета коэффициентов
function calculateOdds(totalWithInitPlayer1: number, totalWithInitPlayer2: number) {
  const totalWithInit = totalWithInitPlayer1 + totalWithInitPlayer2;
  const payout = totalWithInit * (1 - MARGIN); // Общая сумма выплат с учетом маржи

  const oddsPlayer1 = totalWithInitPlayer1 === 0 ? 1 : payout / totalWithInitPlayer1;
  const oddsPlayer2 = totalWithInitPlayer2 === 0 ? 1 : payout / totalWithInitPlayer2;

  return {
    oddsPlayer1: parseFloat(oddsPlayer1.toFixed(2)),
    oddsPlayer2: parseFloat(oddsPlayer2.toFixed(2)),
  };
}

// Функция для расчета максимальных ставок
function calculateMaxBets(initBetPlayer1: number, initBetPlayer2: number): { maxBetPlayer1: number, maxBetPlayer2: number } {
  const maxBetPlayer1 = parseFloat((initBetPlayer2 * 1.00).toFixed(2)); // 100% от суммы ставок на Player2
  const maxBetPlayer2 = parseFloat((initBetPlayer1 * 1.00).toFixed(2)); // 100% от суммы ставок на Player1
  return { maxBetPlayer1, maxBetPlayer2 };
}

function roundDownToTwoDecimals(value: number): number {
  return Math.floor(value * 100) / 100;
}

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
        .reduce((sum, p) => sum + p.amount, 0);

    const totalPlayer2 = bet.participants
        .filter(p => p.player === PlayerChoice.PLAYER2)
        .reduce((sum, p) => sum + p.amount, 0);

    const totalWithInitPlayer1 = totalPlayer1 + (bet.initBetPlayer1 || 0);
    const totalWithInitPlayer2 = totalPlayer2 + (bet.initBetPlayer2 || 0);

    const currentOdds = player === PlayerChoice.PLAYER1 ? bet.oddsBetPlayer1 : bet.oddsBetPlayer2;
    const potentialProfit = amount * (currentOdds - 1);

    const { maxBetPlayer1, maxBetPlayer2 } = calculateMaxBets(totalWithInitPlayer1, totalWithInitPlayer2);
    const maxAllowedBet = player === PlayerChoice.PLAYER1 ? maxBetPlayer1 : maxBetPlayer2;

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
        overlapRemain: amount,
      },
    });


// Функция для балансировки overlap между участниками
    async function balanceOverlaps(betId: number) {
      // Получаем всех участников с данным betId
      const participants = await prisma.betParticipant.findMany({
        where: { betId },
        orderBy: { createdAt: 'asc' },
      });

      // Функция для переноса overlapRemain в overlap
      async function transferOverlap(sourceParticipants, targetParticipants) {
        for (const source of sourceParticipants) {
          if (source.overlapRemain <= 0) continue;

          for (const target of targetParticipants) {
            if (areNumbersEqual(target.profit, target.overlap)) continue;

            const neededOverlap = target.profit - target.overlap;
            const overlapToAdd = Math.min(source.overlapRemain, neededOverlap);

            if (overlapToAdd > 0) {
              const newOverlap = target.overlap + overlapToAdd;
              if (newOverlap > target.profit) {
                throw new Error('Ошибка: overlap не может быть больше profit');
              }

              // Обновляем overlap у целевого участника
              await prisma.betParticipant.update({
                where: { id: target.id },
                data: {
                  overlap: newOverlap,
                },
              });

              // Отнимаем overlapToAdd из overlapRemain у исходного участника
              source.overlapRemain -= overlapToAdd;

              // Обновляем overlapRemain у исходного участника
              await prisma.betParticipant.update({
                where: { id: source.id },
                data: {
                  overlapRemain: source.overlapRemain,
                },
              });

              if (source.overlapRemain <= 0) break;
            }
          }
        }
      }

      // Переносим overlapRemain от PLAYER1 к PLAYER2
      const participantsPlayer1 = participants.filter(p => p.player === PlayerChoice.PLAYER1);
      const participantsPlayer2 = participants.filter(p => p.player === PlayerChoice.PLAYER2);
      await transferOverlap(participantsPlayer1, participantsPlayer2);

      // Переносим overlapRemain от PLAYER2 к PLAYER1
      await transferOverlap(participantsPlayer2, participantsPlayer1);
    }
    // Вызов функции для балансировки overlap
    await balanceOverlaps(betId);




    await prisma.user.update({
      where: { id: userId },
      data: {
        points: user.points - amount,
      },
    });

    const { oddsPlayer1, oddsPlayer2 } = calculateOdds(totalWithInitPlayer1 + (player === PlayerChoice.PLAYER1 ? amount : 0), totalWithInitPlayer2 + (player === PlayerChoice.PLAYER2 ? amount : 0));

    const totalMargin = await prisma.betParticipant.aggregate({
      _sum: {
        margin: true,
      },
      where: {
        betId: betId,
      },
    });

    await prisma.bet.update({
      where: { id: betId },
      data: {
        oddsBetPlayer1: oddsPlayer1,
        oddsBetPlayer2: oddsPlayer2,
        totalBetPlayer1: player === PlayerChoice.PLAYER1 ? totalPlayer1 + amount : totalPlayer1,
        totalBetPlayer2: player === PlayerChoice.PLAYER2 ? totalPlayer2 + amount : totalPlayer2,
        totalBetAmount: totalPlayer1 + totalPlayer2 + amount,
        margin: totalMargin._sum.margin || 0,
        maxBetPlayer1: player === PlayerChoice.PLAYER1 ? bet.maxBetPlayer1 : bet.maxBetPlayer1 + amount,
        maxBetPlayer2: player === PlayerChoice.PLAYER2 ? bet.maxBetPlayer2 : bet.maxBetPlayer2 + amount,
      },
    });

    const participants = await prisma.betParticipant.findMany({
      where: { betId },
      orderBy: { createdAt: 'asc' },
    });

    for (const participant of participants) {
      let newIsCoveredStatus = "OPEN";

      if (areNumbersEqual(participant.overlap, 0)) {
        newIsCoveredStatus = "OPEN";
      } else if (participant.overlap >= participant.profit) {
        newIsCoveredStatus = "CLOSED";
      } else {
        newIsCoveredStatus = "PENDING";
      }

      if (participant.isCovered !== newIsCoveredStatus) {
        await prisma.betParticipant.update({
          where: { id: participant.id },
          data: { isCovered: newIsCoveredStatus },
        });
      }
    }

    revalidatePath('/');
    await updateGlobalData();

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










// Функция для закрытия ставки
export async function closeBet(betId: number, winnerId: number) {
  'use server';

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

        const roundedProfit = roundDownToTwoDecimals(participant.profit);
        const roundedOverlap = roundDownToTwoDecimals(participant.overlap);

        if (participant.isWinner) {
          if (participant.isCovered === "CLOSED" && roundedProfit === roundedOverlap) {
            margin = roundDownToTwoDecimals(roundedOverlap * MARGIN);
            pointsToReturn = roundDownToTwoDecimals(roundedOverlap + participant.amount - margin);
          } else if (participant.isCovered === "OPEN" && roundedOverlap === 0) {
            pointsToReturn = roundDownToTwoDecimals(participant.amount);
          } else if (participant.isCovered === "PENDING" && roundedProfit > roundedOverlap) {
            margin = roundDownToTwoDecimals(roundedOverlap * MARGIN);
            pointsToReturn = roundDownToTwoDecimals(roundedOverlap + participant.amount - margin);
          }
          totalMargin += margin;
        } else {
          if (participant.isCovered === "CLOSED" && roundedProfit === roundedOverlap) {
            pointsToReturn = 0;
          } else if (participant.isCovered === "OPEN" && roundedOverlap === 0) {
            pointsToReturn = roundDownToTwoDecimals(participant.amount);
          } else if (participant.isCovered === "PENDING" && roundedProfit > roundedOverlap) {
            pointsToReturn = roundDownToTwoDecimals(participant.amount - roundedOverlap);
          }
        }

        // Обновляем баллы пользователя
        if (pointsToReturn > 0) {
          await prisma.user.update({
            where: { id: participant.userId },
            data: {
              points: {
                increment: roundDownToTwoDecimals(pointsToReturn),
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
            overlapRemain: participant.overlapRemain ?? 0,
            return: roundDownToTwoDecimals(pointsToReturn),
          },
        });
      }

      // Обновляем поле margin в BetCLOSED
      await prisma.betCLOSED.update({
        where: { id: betClosed.id },
        data: {
          margin: totalMargin,
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
          margin: {
            increment: roundDownToTwoDecimals(bet.margin || 0),
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
}



