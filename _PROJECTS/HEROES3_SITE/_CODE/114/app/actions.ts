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
  const maxBetPlayer1 = parseFloat((initBetPlayer2 * 2.00).toFixed(2)); // 100% от суммы ставок на Player2
  const maxBetPlayer2 = parseFloat((initBetPlayer1 * 2.00).toFixed(2)); // 100% от суммы ставок на Player1
  return { maxBetPlayer1, maxBetPlayer2 };
}

export async function placeBet(formData: { betId: number; userId: number; amount: number; player: PlayerChoice }) {
  try {
    console.log('Запуск функции placeBet с formData:', formData);

    // Проверка валидности данных формы
    if (!formData || typeof formData !== 'object') {
      throw new Error('Неверные данные формы');
    }

    const { betId, userId, amount, player } = formData;

    // Проверка наличия всех обязательных полей
    if (!betId || !userId || !amount || !player) {
      throw new Error('Отсутствуют обязательные поля в данных формы');
    }

    // Получаем информацию о ставке
    const bet = await prisma.bet.findUnique({
      where: { id: betId },
      include: { participants: true },
    });

    // Проверка доступности ставки
    if (!bet || bet.status !== 'OPEN') {
      throw new Error('Ставка недоступна для участия');
    }

    // Получаем информацию о пользователе
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    // Проверка наличия достаточного количества баллов у пользователя
    if (!user || user.points < amount) {
      throw new Error('Недостаточно баллов для совершения ставки');
    }

    // Подсчет общей суммы ставок на игрока 1
    const totalPlayer1 = bet.participants
        .filter(p => p.player === PlayerChoice.PLAYER1)
        .reduce((sum, p) => sum + p.amount, 0);

    // Подсчет общей суммы ставок на игрока 2
    const totalPlayer2 = bet.participants
        .filter(p => p.player === PlayerChoice.PLAYER2)
        .reduce((sum, p) => sum + p.amount, 0);

    // Учитываем начальные ставки
    const totalWithInitPlayer1 = totalPlayer1 + (bet.initBetPlayer1 || 0);
    const totalWithInitPlayer2 = totalPlayer2 + (bet.initBetPlayer2 || 0);

    // Получаем текущие коэффициенты
    const currentOdds = player === PlayerChoice.PLAYER1 ? bet.oddsBetPlayer1 : bet.oddsBetPlayer2;

    // Расчет потенциальной прибыли
    const potentialProfit = parseFloat((amount * (currentOdds - 1)).toFixed(2));

    // Расчет максимальных ставок
    const { maxBetPlayer1, maxBetPlayer2 } = calculateMaxBets(totalWithInitPlayer1, totalWithInitPlayer2);
    const maxAllowedBet = player === PlayerChoice.PLAYER1 ? maxBetPlayer1 : maxBetPlayer2;

    // Проверка превышения максимальной допустимой ставки
    if (amount > maxAllowedBet) {
      throw new Error(`Максимально допустимая ставка: ${maxAllowedBet.toFixed(2)}`);
    }

    let remainingAmount = amount;
    let overlapAmount = 0;

    // Использование overlapRemain у противоположных участников
    overlapAmount = await useOverlapRemain(bet, player, potentialProfit, currentOdds, remainingAmount, userId);
    overlapAmount = Math.min(overlapAmount, potentialProfit); // Убедитесь, что overlap не превышает потенциальную прибыль

    // Обработка перекрестных ставок
    remainingAmount = await processCrossBets(bet, player, currentOdds, remainingAmount, overlapAmount, userId);

    // Расчет маржи для участника на основе фактического overlap
    const participantMargin = parseFloat((overlapAmount * MARGIN).toFixed(2));

    // Создание нового участника
    const newParticipant = await prisma.betParticipant.create({
      data: {
        betId,
        userId,
        amount,
        player,
        odds: currentOdds,
        profit: potentialProfit,
        margin: participantMargin, // Используем актуальную маржу
        isCovered: overlapAmount >= potentialProfit ? "CLOSED" : (overlapAmount > 0 ? "PENDING" : "OPEN"),
        overlap: overlapAmount,
      },
    });

    // Если осталась непокрытая сумма, обновляем overlapRemain
    if (remainingAmount > 0) {
      console.log("Оставшееся значение после обработки всех участников:", remainingAmount);
      await prisma.betParticipant.update({
        where: { id: newParticipant.id },
        data: {
          overlapRemain: parseFloat(remainingAmount.toFixed(2)),
        },
      });
    }

    // Обновление баллов пользователя
    await prisma.user.update({
      where: { id: userId },
      data: {
        points: parseFloat((user.points - amount).toFixed(2)),
      },
    });

    // Пересчет коэффициентов после добавления новой ставки
    const { oddsPlayer1, oddsPlayer2 } = calculateOdds(totalWithInitPlayer1 + (player === PlayerChoice.PLAYER1 ? amount : 0), totalWithInitPlayer2 + (player === PlayerChoice.PLAYER2 ? amount : 0));

    // Обновление данных ставки
    await prisma.bet.update({
      where: { id: betId },
      data: {
        oddsBetPlayer1: oddsPlayer1,
        oddsBetPlayer2: oddsPlayer2,
        totalBetPlayer1: player === PlayerChoice.PLAYER1 ? parseFloat((totalPlayer1 + amount).toFixed(2)) : parseFloat(totalPlayer1.toFixed(2)),
        totalBetPlayer2: player === PlayerChoice.PLAYER2 ? parseFloat((totalPlayer2 + amount).toFixed(2)) : parseFloat(totalPlayer2.toFixed(2)),
        totalBetAmount: parseFloat((totalPlayer1 + totalPlayer2 + amount).toFixed(2)),
        margin: parseFloat(((bet.margin ?? 0) + participantMargin).toFixed(2)),
        maxBetPlayer1: player === PlayerChoice.PLAYER1 ? parseFloat(bet.maxBetPlayer1.toFixed(2)) : parseFloat((bet.maxBetPlayer1 + amount).toFixed(2)),
        maxBetPlayer2: player === PlayerChoice.PLAYER2 ? parseFloat(bet.maxBetPlayer2.toFixed(2)) : parseFloat((bet.maxBetPlayer2 + amount).toFixed(2)),
      },
    });

    // Проверка всех записей на isCovered
    const participants = await prisma.betParticipant.findMany({
      where: { betId },
      orderBy: { createdAt: 'asc' }, // Сортировка по дате создания
    });

    for (const participant of participants) {
      let newIsCoveredStatus = "OPEN";
      const roundedOverlap = parseFloat(participant.overlap.toFixed(2));
      const roundedProfit = parseFloat(participant.profit.toFixed(2));

      if (roundedOverlap === 0) {
        newIsCoveredStatus = "OPEN";
      } else if (roundedOverlap >= roundedProfit) {
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

    // Ревалидация данных
    revalidatePath('/');
    await updateGlobalData();

    return { success: true, isCovered: overlapAmount > 0 ? "PENDING" : "OPEN" };
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


// Функция для использования overlapRemain у противоположных участников
async function useOverlapRemain(bet, player, potentialProfit, currentOdds, remainingAmount, userId) {
  let overlapAmount = 0;
  const participantsWithRemain = bet.participants
      .filter(p => (p.overlapRemain ?? 0) > 0 && p.player !== player && p.userId !== userId) // Исключаем участников с тем же userId
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); // Сортировка по дате создания

  // Сначала обрабатываем участников с isCovered = PENDING
  for (const participant of participantsWithRemain.filter(p => p.isCovered === "PENDING")) {
    if (remainingAmount <= 0) break;

    // Определяем прибыль, которую нужно покрыть
    const profitToCover = participant.amount * (participant.odds - 1) - participant.overlap;
    const coverableAmount = Math.min(participant.overlapRemain ?? 0, profitToCover);

    overlapAmount += coverableAmount;
    remainingAmount -= coverableAmount / (currentOdds - 1);

    // Убедитесь, что overlap не превышает прибыль
    const newOverlap = Math.min(participant.overlap + coverableAmount, participant.amount * (participant.odds - 1));

    // Округляем до двух знаков после запятой
    const overlapRemainRounded = parseFloat(((participant.overlapRemain ?? 0) - coverableAmount).toFixed(2));
    const profitToCoverRounded = parseFloat(profitToCover.toFixed(2));

    // Определяем новое значение isCovered
    let isCoveredStatus = "OPEN";
    if (newOverlap >= profitToCoverRounded) {
      isCoveredStatus = "CLOSED";
    } else if (newOverlap > 0) {
      isCoveredStatus = "PENDING";
    }

    const newMargin = parseFloat((newOverlap * MARGIN).toFixed(2));

    await prisma.betParticipant.update({
      where: { id: participant.id },
      data: {
        overlapRemain: overlapRemainRounded,
        overlap: newOverlap,
        isCovered: isCoveredStatus,
        margin: newMargin,
      },
    });

    if (overlapAmount >= potentialProfit) {
      break;
    }
  }

  // Затем обрабатываем остальных участников
  for (const participant of participantsWithRemain.filter(p => p.isCovered !== "PENDING")) {
    if (remainingAmount <= 0) break;

    const profitToCover = potentialProfit - overlapAmount;
    const coverableAmount = Math.min(participant.overlapRemain ?? 0, profitToCover);

    overlapAmount += coverableAmount;
    remainingAmount -= coverableAmount / (currentOdds - 1);

    const newOverlap = Math.min(participant.overlap + coverableAmount, participant.amount * (participant.odds - 1));
    const overlapRemainRounded = parseFloat(((participant.overlapRemain ?? 0) - coverableAmount).toFixed(2));
    const profitToCoverRounded = parseFloat(profitToCover.toFixed(2));

    let isCoveredStatus = "OPEN";
    if (newOverlap >= profitToCoverRounded) {
      isCoveredStatus = "CLOSED";
    } else if (newOverlap > 0) {
      isCoveredStatus = "PENDING";
    }

    const newMargin = parseFloat((newOverlap * MARGIN).toFixed(2));

    await prisma.betParticipant.update({
      where: { id: participant.id },
      data: {
        overlapRemain: overlapRemainRounded,
        overlap: newOverlap,
        isCovered: isCoveredStatus,
        margin: newMargin,
      },
    });

    if (overlapAmount >= potentialProfit) {
      break;
    }
  }

  return overlapAmount;
}

async function processCrossBets(bet, player, currentOdds, remainingAmount, overlapAmount, userId) {
  const oppositeParticipants = bet.participants
      .filter(p => p.player !== player && p.userId !== userId && (p.isCovered === "OPEN" || p.isCovered === "PENDING") && p.overlap < p.amount * (p.odds - 1))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Process participants with isCovered = PENDING first
  for (const participant of oppositeParticipants.filter(p => p.isCovered === "PENDING")) {
    if (remainingAmount <= 0) break;

    const profitToCover = participant.amount * (participant.odds - 1) - participant.overlap;
    const overlap = Math.min(profitToCover, remainingAmount);

    const newOverlap = Math.min(participant.overlap + overlap, participant.amount * (participant.odds - 1));
    const profitToCoverRounded = parseFloat(profitToCover.toFixed(2));

    let isCoveredStatus = "OPEN";
    if (newOverlap >= profitToCoverRounded) {
      isCoveredStatus = "CLOSED";
    } else if (newOverlap > 0) {
      isCoveredStatus = "PENDING";
    }

    const newMargin = parseFloat((newOverlap * MARGIN).toFixed(2));

    await prisma.betParticipant.update({
      where: { id: participant.id },
      data: {
        isCovered: isCoveredStatus,
        overlap: newOverlap,
        margin: newMargin,
      },
    });

    remainingAmount -= overlap;

    if (overlap > 0 && overlap < profitToCover) {
      break;
    }
  }

  // Process remaining participants
  for (const participant of oppositeParticipants.filter(p => p.isCovered !== "PENDING")) {
    if (remainingAmount <= 0) break;

    const profitToCover = participant.amount * (participant.odds - 1) - participant.overlap;
    const overlap = Math.min(profitToCover, remainingAmount);

    console.log(`Обработка участника ${participant.id}:`);
    console.log("Прибыль для покрытия:", profitToCover);
    console.log("Рассчитанный overlap:", overlap);

    const newOverlap = Math.min(participant.overlap + overlap, participant.amount * (participant.odds - 1));
    const profitToCoverRounded = parseFloat(profitToCover.toFixed(2));

    let isCoveredStatus = "OPEN";
    if (newOverlap >= profitToCoverRounded) {
      isCoveredStatus = "CLOSED";
    } else if (newOverlap > 0) {
      isCoveredStatus = "PENDING";
    }

    const newMargin = parseFloat((newOverlap * MARGIN).toFixed(2));

    await prisma.betParticipant.update({
      where: { id: participant.id },
      data: {
        isCovered: isCoveredStatus,
        overlap: newOverlap,
        margin: newMargin,
      },
    });

    remainingAmount -= overlap;
    console.log("Обновлённое значение remainingAmount:", remainingAmount);

    if (overlap > 0 && overlap < profitToCover) {
      console.log("Прерывание цикла, так как overlap меньше, чем profitToCover");
      break;
    }
  }

  return remainingAmount;
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

      for (const participant of allParticipants) {
        // Прибыль от перекрытой части
        const profitFromOverlap = parseFloat((participant.overlap * participant.odds).toFixed(2));

        // Возврат неперекрытой части с учетом маржи (0.05%)
        const returnedAmount = parseFloat(((participant.amount - participant.overlap) * (1 - MARGIN)).toFixed(2));

        // Возврат маржи (0.05%) от неперекрытой части
        const returnedMargin = parseFloat(((participant.amount - participant.overlap) * MARGIN * 0.5).toFixed(2));

        // Создаем запись в BetParticipantCLOSED
        await prisma.betParticipantCLOSED.create({
          data: {
            betCLOSEDId: betClosed.id,
            userId: participant.userId,
            amount: participant.amount,
            odds: participant.odds,
            profit: profitFromOverlap,
            player: participant.player,
            isWinner: participant.player === winningPlayer,
            margin: participant.margin,
            createdAt: participant.createdAt,
            isCovered: participant.isCovered,
            overlap: participant.overlap,
            overlapRemain: participant.overlapRemain ?? 0, // Provide a default value of 0 if null
          },
        });

        // Обновляем баллы пользователя
        if (participant.player === winningPlayer) {
          // Для выигравших участников:
          // 1. Прибыль от перекрытой части
          // 2. Возврат неперекрытой части с учетом маржи
          // 3. Возврат маржи от неперекрытой части
          await prisma.user.update({
            where: { id: participant.userId },
            data: {
              points: {
                increment: parseFloat((profitFromOverlap + returnedAmount + returnedMargin).toFixed(2)),
              },
            },
          });
        } else {
          // Для проигравших участников:
          // 1. Возврат неперекрытой части с учетом маржи
          // 2. Возврат маржи от неперекрытой части
          await prisma.user.update({
            where: { id: participant.userId },
            data: {
              points: {
                increment: parseFloat((returnedAmount + returnedMargin).toFixed(2)),
              },
            },
          });
        }
      }

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
            increment: parseFloat((bet.margin || 0).toFixed(2)),
          },
        },
      });
    });

    // Ревалидируем данные
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
