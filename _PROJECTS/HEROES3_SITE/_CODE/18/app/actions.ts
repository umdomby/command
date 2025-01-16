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
    const totalBetAmount = formData.totalBetPlayer1 + formData.totalBetPlayer2;
    if (user.points < totalBetAmount) {
      throw new Error("Недостаточно баллов для создания ставки");
    }

    // Создаем ставку в базе данных
    const newBet = await prisma.bet.create({
      data: {
        status: 'OPEN', // Устанавливаем статус ставки как "открытая"
        totalBetAmount: totalBetAmount, // Общая сумма ставок
        maxBetAmount: totalBetAmount, // Максимальная сумма ставок
        currentOdds1: formData.currentOdds1, // Инициализируем текущие коэффициенты
        currentOdds2: formData.currentOdds2, // Инициализируем текущие коэффициенты
        player1Id: formData.player1Id,
        player2Id: formData.player2Id,
        totalBetPlayer1: formData.totalBetPlayer1,
        totalBetPlayer2: formData.totalBetPlayer2,
        categoryId: formData.categoryId,
        productId: formData.productId,
        productItemId: formData.productItemId,
        creatorId: formData.creatorId,
        totalBetPlayer1: formData.totalBetPlayer1, // Инициализируем сумму ставок на игрока 1
        totalBetPlayer2: formData.totalBetPlayer2, // Инициализируем сумму ставок на игрока 2
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
      include: { participants: true }, // Включаем участников для расчета коэффициентов
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
        .reduce((sum, p) => sum + p.amount, bet.totalBetPlayer1);

    const totalPlayer2 = bet.participants
        .filter(p => p.player === PlayerChoice.PLAYER2)
        .reduce((sum, p) => sum + p.amount, bet.totalBetPlayer2);

    const total = totalPlayer1 + totalPlayer2;

    // Расчет текущих коэффициентов
    const oddsPlayer1 = totalPlayer1 === 0 ? 1 : total / totalPlayer1;
    const oddsPlayer2 = totalPlayer2 === 0 ? 1 : total / totalPlayer2;

    // Проверка коэффициента перед ставкой
    if ((player === PlayerChoice.PLAYER1 && oddsPlayer1 <= 1.05) ||
        (player === PlayerChoice.PLAYER2 && oddsPlayer2 <= 1.05)) {
      throw new Error('Коэффициент слишком низкий для ставки');
    }

    // Проверка, не приведет ли ставка к снижению коэффициента до 1.05 или ниже
    const updatedTotalPlayer1 = player === PlayerChoice.PLAYER1 ? totalPlayer1 + amount : totalPlayer1;
    const updatedTotalPlayer2 = player === PlayerChoice.PLAYER2 ? totalPlayer2 + amount : totalPlayer2;
    const updatedTotal = updatedTotalPlayer1 + updatedTotalPlayer2;

    const updatedOddsPlayer1 = updatedTotalPlayer1 === 0 ? 1 : updatedTotal / updatedTotalPlayer1;
    const updatedOddsPlayer2 = updatedTotalPlayer2 === 0 ? 1 : updatedTotal / updatedTotalPlayer2;

    if ((player === PlayerChoice.PLAYER1 && updatedOddsPlayer1 <= 1.05) ||
        (player === PlayerChoice.PLAYER2 && updatedOddsPlayer2 <= 1.05)) {
      throw new Error('Ставка приведет к снижению коэффициента до 1.05 или ниже');
    }

    // Рассчитываем потенциальную прибыль
    const potentialProfit = amount * (player === PlayerChoice.PLAYER1 ? oddsPlayer1 : oddsPlayer2);

    // Проверка, чтобы прибыль не превышала 30% от суммы ставок на другого игрока
    if (player === PlayerChoice.PLAYER1 && potentialProfit > totalPlayer2 * 0.3) {
      throw new Error('Прибыль от ставки превышает 30% от суммы ставок на другого игрока');
    }

    if (player === PlayerChoice.PLAYER2 && potentialProfit > totalPlayer1 * 0.3) {
      throw new Error('Прибыль от ставки превышает 30% от суммы ставок на другого игрока');
    }

    // Рассчитываем максимальную ставку с учетом ограничения на прибыль
    const maxBetForProfit = player === PlayerChoice.PLAYER1
        ? (totalPlayer2 * 0.3) / oddsPlayer1 // Максимум 30% от суммы ставок на Player 2, деленные на коэффициент
        : (totalPlayer1 * 0.3) / oddsPlayer2; // Максимум 30% от суммы ставок на Player 1, деленные на коэффициент

    // Максимальная ставка, чтобы коэффициент не опустился ниже 1.05
    const maxBetForOdds = player === PlayerChoice.PLAYER1
        ? (total / 1.05) - totalPlayer1
        : (total / 1.05) - totalPlayer2;

    // Максимальная ставка, чтобы не превысить сумму другого игрока на 30%
    const maxBetForBalance = player === PlayerChoice.PLAYER1
        ? totalPlayer2 * 1.3
        : totalPlayer1 * 1.3;

    // Максимальная ставка, которую может сделать пользователь
    const userMaxBet = user.points;

    // Возвращаем минимальное значение из всех ограничений
    const maxAllowedBet = Math.min(maxBetForOdds, maxBetForBalance, maxBetForProfit, userMaxBet);

    // Проверка, что ставка не превышает максимально допустимую
    if (amount > maxAllowedBet) {
      throw new Error(`Максимально допустимая ставка: ${maxAllowedBet.toFixed(2)}`);
    }

    // Создаем участника ставки
    await prisma.betParticipant.create({
      data: {
        betId,
        userId,
        amount,
        player,
        odds: player === PlayerChoice.PLAYER1 ? oddsPlayer1 : oddsPlayer2,
        profit: potentialProfit,
      },
    });

    // Обновляем баланс пользователя
    await prisma.user.update({
      where: { id: userId },
      data: {
        points: user.points - amount,
      },
    });

    // Обновляем коэффициенты и общую сумму ставок
    await prisma.bet.update({
      where: { id: betId },
      data: {
        currentOdds1: updatedOddsPlayer1,
        currentOdds2: updatedOddsPlayer2,
        totalBetPlayer1: updatedTotalPlayer1,
        totalBetPlayer2: updatedTotalPlayer2,
      },
    });

    revalidatePath('/'); // Ревалидируем путь (если используете Next.js)
    console.log(`Пользователь ${userId} сделал ставку ${amount} на игрока ${player}`);
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.stack);
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






