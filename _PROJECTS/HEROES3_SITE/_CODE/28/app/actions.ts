'use server';
import {prisma} from '@/prisma/prisma-client';
import {getUserSession} from '@/components/lib/get-user-session';
import {PlayerChoice, Prisma} from '@prisma/client';
import {hashSync} from 'bcrypt';
import {revalidatePath} from 'next/cache'
import * as z from 'zod'

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

  } catch (err) {
    console.log('Error [CREATE_USER]', err);
    throw err;
  }
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

    // Проверяем, что у пользователя достаточно баллов
    const totalBetAmount = formData.initBetPlayer1 + formData.initBetPlayer2;

    const maxBetPlayer1 = formData.initBetPlayer1/3;
    const maxBetPlayer2 = formData.initBetPlayer2/3;
    if (user.points < totalBetAmount) {
      throw new Error("Недостаточно баллов для создания ставки");
    }

    // Создаем ставку в базе данных
    const newBet = await prisma.bet.create({
      data: {
        status: 'OPEN', // Устанавливаем статус ставки как "открытая"
        totalBetAmount: totalBetAmount, // Общая сумма ставок
        maxBetPlayer1: maxBetPlayer1, // Максимальная сумма ставок на игрока 1
        maxBetPlayer2: maxBetPlayer2, // Максимальная сумма ставок на игрока 2
        currentOdds1: formData.currentOdds1, // Инициализируем текущие коэффициенты
        currentOdds2: formData.currentOdds2, // Инициализируем текущие коэффициенты
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

    // Списание баллов у пользователя
    await prisma.user.update({
      where: { id: Number(session.id) },
      data: {
        points: {
          decrement: totalBetAmount,
        },
      },
    });

    console.log("User points updated:", user.points - totalBetAmount); // Логируем обновленный баланс

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
        .reduce((sum, p) => sum + p.amount, bet.initBetPlayer1);

    const totalPlayer2 = bet.participants
        .filter(p => p.player === PlayerChoice.PLAYER2)
        .reduce((sum, p) => sum + p.amount, bet.initBetPlayer2);

    const total = totalPlayer1 + totalPlayer2;

    // Расчет текущих коэффициентов
    const oddsPlayer1 = totalPlayer1 === 0 ? 1 : total / totalPlayer1;
    const oddsPlayer2 = totalPlayer2 === 0 ? 1 : total / totalPlayer2;

    // Рассчитываем потенциальную прибыль
    const potentialProfit = amount * (player === PlayerChoice.PLAYER1 ? oddsPlayer1 : oddsPlayer2);

    // Убираем проверку на 30% от суммы ставок на другого игрока

    // Рассчитываем максимальную ставку с учетом ограничения на прибыль
    const maxBetForProfitPlayer1 = (totalPlayer2 * 0.3) / (oddsPlayer1 - 1);
    const maxBetForProfitPlayer2 = (totalPlayer1 * 0.3) / (oddsPlayer2 - 1);

    // Максимальная ставка, которую может сделать пользователь
    const userMaxBet = user.points;

    // Возвращаем минимальное значение из всех ограничений для каждого игрока
    const maxAllowedBetPlayer1 = Math.round(Math.min(maxBetForProfitPlayer1, userMaxBet));
    const maxAllowedBetPlayer2 = Math.round(Math.min(maxBetForProfitPlayer2, userMaxBet));

    // Проверка, что ставка не превышает максимально допустимую
    if ((player === PlayerChoice.PLAYER1 && amount > maxAllowedBetPlayer1) ||
        (player === PlayerChoice.PLAYER2 && amount > maxAllowedBetPlayer2)) {
      throw new Error(`Максимально допустимая ставка: ${player === PlayerChoice.PLAYER1 ? maxAllowedBetPlayer1.toFixed(2) : maxAllowedBetPlayer2.toFixed(2)}`);
    }

    // Обновляем суммы ставок и коэффициенты с учетом новой ставки
    const updatedTotalPlayer1 = player === PlayerChoice.PLAYER1 ? totalPlayer1 + amount : totalPlayer1;
    const updatedTotalPlayer2 = player === PlayerChoice.PLAYER2 ? totalPlayer2 + amount : totalPlayer2;
    const updatedTotal = updatedTotalPlayer1 + updatedTotalPlayer2;

    const updatedOddsPlayer1 = updatedTotalPlayer1 === 0 ? 1 : updatedTotal / updatedTotalPlayer1;
    const updatedOddsPlayer2 = updatedTotalPlayer2 === 0 ? 1 : updatedTotal / updatedTotalPlayer2;

    // Используем транзакцию для атомарности
    await prisma.$transaction([
      prisma.betParticipant.create({
        data: {
          betId,
          userId,
          amount,
          player,
          odds: player === PlayerChoice.PLAYER1 ? updatedOddsPlayer1 : updatedOddsPlayer2,
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
          currentOdds1: updatedOddsPlayer1,
          currentOdds2: updatedOddsPlayer2,
          totalBetPlayer1: updatedTotalPlayer1,
          totalBetPlayer2: updatedTotalPlayer2,
          totalBetAmount: updatedTotal,
          maxBetPlayer1: maxAllowedBetPlayer1, // Обновляем максимальную ставку для Player1
          maxBetPlayer2: maxAllowedBetPlayer2, // Обновляем максимальную ставку для Player2
        },
      }),
    ]);

    revalidatePath('/'); // Ревалидируем путь (если используете Next.js)
    console.log(`Пользователь ${userId} сделал ставку ${amount} на игрока ${player}`);
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
        // Начисляем выигрыш
        const winAmount = participant.amount * participant.odds;
        await prisma.user.update({
          where: { id: participant.userId },
          data: {
            points: {
              increment: winAmount,
            },
          },
        });
      }
    }

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






