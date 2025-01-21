'use server';
import {prisma} from '@/prisma/prisma-client';
import {getUserSession} from '@/components/lib/get-user-session';
import {PlayerChoice, Prisma} from '@prisma/client';
import {hashSync} from 'bcrypt';
import {revalidatePath} from 'next/cache'
import * as z from 'zod'

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
    const pointsBet = pointsBetResult._sum.totalBetAmount || 0;

    // 3. Количество зарегистрированных пользователей
    const users = await prisma.user.count();

    // 4. Начальные очки (количество пользователей * 1000)
    const pointsStart = users * 1000;

    // 5. Сумма всех очков пользователей
    const pointsAllUsersResult = await prisma.user.aggregate({
      _sum: {
        points: true,
      },
    });
    const pointsAllUsers = pointsAllUsersResult._sum.points || 0;

    // Обновляем или создаем запись в GlobalData
    await prisma.globalData.upsert({
      where: { id: 1 },
      update: {
        usersPlay,
        pointsBet,
        users,
        pointsStart,
        pointsAllUsers,
      },
      create: {
        id: 1,
        usersPlay,
        pointsBet,
        users,
        pointsStart,
        pointsAllUsers,
      },
    });

    console.log('GlobalData updated successfully');
  } catch (error) {
    console.error('Error updating GlobalData:', error);
    throw new Error('Failed to update GlobalData');
  }
}

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
    //console.log('Error [UPDATE_USER]', err);
    throw err;
  }
}

export async function registerUser(body: Prisma.UserCreateInput) {
  try {
    const user = await prisma.user.findFirst({
      where: {
        email: body.email,
      },
    });

    if (user) {
      throw new Error('Пользователь уже существует');
    }

    await prisma.user.create({
      data: {
        fullName: body.fullName,
        email: body.email,
        password: hashSync(body.password, 10),
      },
    });

    await updateGlobalData();

  } catch (err) {
    console.log('Error [CREATE_USER]', err);
    throw err;
  }
}

function calculateMaxBets(initBetPlayer1: number, initBetPlayer2: number): { maxBetPlayer1: number, maxBetPlayer2: number } {
  const maxBetPlayer1 = parseFloat((initBetPlayer2 * 1.00).toFixed(2)); // 100% от суммы ставок на Player2
  const maxBetPlayer2 = parseFloat((initBetPlayer1 * 1.00).toFixed(2)); // 100% от суммы ставок на Player1
  return { maxBetPlayer1, maxBetPlayer2 };
}

export async function clientCreateBet(formData: any) {
  const session = await getUserSession();
  if (!session) {
    throw new Error("User session is not available.");
  }

  console.log("formData:", formData); // Логируем входящие данные
  console.log("session:", session); // Логируем сессию

  try {
    console.log("creatorId:", Number(session?.id)); // Логируем creatorId перед вызовом Prisma

    // Получаем текущего пользователя
    const user = await prisma.user.findUnique({
      where: { id: Number(session.id) },
    });

    if (!user) {
      throw new Error("Пользователь не найден");
    }

    // Проверяем, что сумма начальных ставок не превышает 100 баллов
    const totalBetAmount = formData.initBetPlayer1 + formData.initBetPlayer2;
    if (totalBetAmount > 100) {
      throw new Error("Сумма начальных ставок не должна превышать 100 баллов");
    }

    // Рассчитываем максимальные ставки на основе начальных значений
    const { maxBetPlayer1, maxBetPlayer2 } = calculateMaxBets(formData.initBetPlayer1, formData.initBetPlayer2);

    // Создаем ставку в базе данных
    const newBet = await prisma.bet.create({
      data: {
        status: 'OPEN', // Устанавливаем статус ставки как "открытая"
        totalBetAmount: totalBetAmount, // Общая сумма начальных ставок
        maxBetPlayer1: maxBetPlayer1, // Максимальная сумма ставок на игрока 1
        maxBetPlayer2: maxBetPlayer2, // Максимальная сумма ставок на игрока 2
        currentOdds1: 1, // Инициализируем текущие коэффициенты (по умолчанию 1)
        currentOdds2: 1, // Инициализируем текущие коэффициенты (по умолчанию 1)
        player1Id: formData.player1Id,
        player2Id: formData.player2Id,
        initBetPlayer1: formData.initBetPlayer1,
        initBetPlayer2: formData.initBetPlayer2,
        categoryId: formData.categoryId,
        productId: formData.productId,
        productItemId: formData.productItemId,
        creatorId: formData.creatorId,
        totalBetPlayer1: formData.initBetPlayer1, // Инициализируем сумму ставок на игрока 1
        totalBetPlayer2: formData.initBetPlayer2, // Инициализируем сумму ставок на игрока 2
      },
    });

    console.log("New bet created:", newBet); // Логируем созданную ставку

    console.log("User points remain unchanged:", user.points); // Логируем неизмененный баланс
    await updateGlobalData();
    // Ревалидируем путь (если используем Next.js)
    revalidatePath('/');

    return newBet; // Возвращаем созданную ставку
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.stack);
    }
    throw new Error('Failed to create bet. Please try again.');
  }
}

export async function placeBet(formData: { betId: number; userId: number; amount: number; player: PlayerChoice }) {
  try {
    const { betId, userId, amount, player } = formData;

    // Проверяем, что ставка существует и доступна
    const bet = await prisma.bet.findUnique({
      where: { id: betId },
      include: { participants: true },
    });

    if (!bet || bet.status !== 'OPEN') {
      throw new Error('Ставка недоступна для участия');
    }

    // Проверяем баланс пользователя
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.points < amount) {
      throw new Error('Недостаточно баллов для совершения ставки');
    }

    // Рассчитываем текущие суммы ставок на каждого игрока
    const totalPlayer1 = bet.participants
        .filter(p => p.player === PlayerChoice.PLAYER1)
        .reduce((sum, p) => sum + p.amount, bet.initBetPlayer1 || 0);

    const totalPlayer2 = bet.participants
        .filter(p => p.player === PlayerChoice.PLAYER2)
        .reduce((sum, p) => sum + p.amount, bet.initBetPlayer2 || 0);

    const total = totalPlayer1 + totalPlayer2;

    // Расчет текущих коэффициентов
    const oddsPlayer1 = totalPlayer1 === 0 ? 1 : total / totalPlayer1;
    const oddsPlayer2 = totalPlayer2 === 0 ? 1 : total / totalPlayer2;

    // Рассчитываем потенциальную прибыль
    const potentialProfit = amount * (player === PlayerChoice.PLAYER1 ? oddsPlayer1 : oddsPlayer2);

    // Максимальная ставка, которую может сделать пользователь
    const userMaxBet = user.points;

    // Рассчитываем максимальные ставки на основе суммы ставок на другого игрока
    const { maxBetPlayer1, maxBetPlayer2 } = calculateMaxBets(totalPlayer1, totalPlayer2);

    // Возвращаем минимальное значение из всех ограничений для каждого игрока
    const maxAllowedBet = {
      [PlayerChoice.PLAYER1]: Math.min(maxBetPlayer1, userMaxBet),
      [PlayerChoice.PLAYER2]: Math.min(maxBetPlayer2, userMaxBet),
    };

    // Проверка, что ставка не превышает максимально допустимую
    if (amount > maxAllowedBet[player]) {
      throw new Error(`Максимально допустимая ставка: ${maxAllowedBet[player].toFixed(2)}`);
    }

    // Обновляем суммы ставок и коэффициенты с учетом новой ставки
    const updatedTotalPlayer = {
      [PlayerChoice.PLAYER1]: player === PlayerChoice.PLAYER1 ? totalPlayer1 + amount : totalPlayer1,
      [PlayerChoice.PLAYER2]: player === PlayerChoice.PLAYER2 ? totalPlayer2 + amount : totalPlayer2,
    };

    const updatedTotal = updatedTotalPlayer[PlayerChoice.PLAYER1] + updatedTotalPlayer[PlayerChoice.PLAYER2];

    const updatedOdds = {
      [PlayerChoice.PLAYER1]: updatedTotalPlayer[PlayerChoice.PLAYER1] === 0 ? 1 : updatedTotal / updatedTotalPlayer[PlayerChoice.PLAYER1],
      [PlayerChoice.PLAYER2]: updatedTotalPlayer[PlayerChoice.PLAYER2] === 0 ? 1 : updatedTotal / updatedTotalPlayer[PlayerChoice.PLAYER2],
    };

    // Пересчитываем максимальные ставки на основе обновленных сумм
    const { maxBetPlayer1: updatedMaxBetPlayer1, maxBetPlayer2: updatedMaxBetPlayer2 } = calculateMaxBets(updatedTotalPlayer[PlayerChoice.PLAYER1], updatedTotalPlayer[PlayerChoice.PLAYER2]);

    const updatedMaxAllowedBet = {
      [PlayerChoice.PLAYER1]: Math.min(updatedMaxBetPlayer1, userMaxBet),
      [PlayerChoice.PLAYER2]: Math.min(updatedMaxBetPlayer2, userMaxBet),
    };

    // Используем транзакцию для атомарности
    await prisma.$transaction([
      prisma.betParticipant.create({
        data: {
          betId,
          userId,
          amount,
          player,
          odds: updatedOdds[player],
          profit: potentialProfit,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          points: user.points - amount,
        },
      }),
      prisma.bet.update({
        where: { id: betId },
        data: {
          currentOdds1: updatedOdds[PlayerChoice.PLAYER1],
          currentOdds2: updatedOdds[PlayerChoice.PLAYER2],
          totalBetPlayer1: updatedTotalPlayer[PlayerChoice.PLAYER1],
          totalBetPlayer2: updatedTotalPlayer[PlayerChoice.PLAYER2],
          totalBetAmount: updatedTotal,
          maxBetPlayer1: updatedMaxAllowedBet[PlayerChoice.PLAYER1],
          maxBetPlayer2: updatedMaxAllowedBet[PlayerChoice.PLAYER2],
        },
      }),
    ]);

    revalidatePath('/'); // Ревалидируем путь (если используете Next.js)
    console.log(`Пользователь ${userId} сделал ставку ${amount} на игрока ${player}`);
    await updateGlobalData();
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error in placeBet:', {
        message: error.message,
        stack: error.stack,
        betId: formData.betId,
        userId: formData.userId,
        amount: formData.amount,
        player: formData.player,
      });
    }
    throw new Error('Failed to create bet. Please try again.');
  }
}


export async function closeBet(betId: number, winnerId: number) {
  'use server';

  try {
    // Проверяем, что winnerId не равен null
    if (winnerId === null || winnerId === undefined) {
      throw new Error("Не выбран победитель.");
    }

    // Находим ставку и обновляем её статус и победителя
    const bet = await prisma.bet.update({
      where: { id: betId },
      data: {
        status: 'CLOSED',
        winnerId: winnerId, // Устанавливаем победителя (ID игрока)
      },
      include: {
        participants: true, // Включаем участников ставки
        player1: true, // Включаем данные о player1
        player2: true, // Включаем данные о player2
      },
    });

    if (!bet) {
      throw new Error("Ставка не найдена");
    }

    // Определяем, кто выиграл: player1 или player2
    const winningPlayer = bet.winnerId === bet.player1Id ? PlayerChoice.PLAYER1 : PlayerChoice.PLAYER2;

    // Устанавливаем isWinner = false для всех участников
    await prisma.betParticipant.updateMany({
      where: { betId: betId },
      data: {
        isWinner: false,
      },
    });

    // Устанавливаем isWinner = true для участников, которые поставили на победителя
    await prisma.betParticipant.updateMany({
      where: {
        betId: betId,
        player: winningPlayer, // Участники, которые поставили на победителя
      },
      data: {
        isWinner: true,
      },
    });

    // Обновляем балансы участников
    for (const participant of bet.participants) {
      if (participant.player === winningPlayer) {
        // Начисляем выигрыш на основе поля profit
        await prisma.user.update({
          where: { id: participant.userId },
          data: {
            points: {
              increment: participant.profit, // Используем profit для начисления
            },
          },
        });
      }
    }

    await updateGlobalData();

    // Ревалидируем путь (если используем Next.js)
    revalidatePath('/');

  } catch (error) {
    console.error("Ошибка при закрытии ставки:", error);

    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error("Не удалось закрыть ставку.");
    }
  }
}













