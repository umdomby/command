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
      throw new Error('Недостаточно баллов для ставки');
    }

    // Рассчитываем коэффициенты перед созданием участника
    const totalPlayer1 = bet.participants
        .filter(p => p.player === PlayerChoice.PLAYER1)
        .reduce((sum, p) => sum + p.amount, bet.initBetPlayer1);

    const totalPlayer2 = bet.participants
        .filter(p => p.player === PlayerChoice.PLAYER2)
        .reduce((sum, p) => sum + p.amount, bet.initBetPlayer2);

    const total = totalPlayer1 + totalPlayer2;

    const oddsPlayer1 = total / totalPlayer1;
    const oddsPlayer2 = total / totalPlayer2;

    // Рассчитываем потенциальную прибыль
    const odds = player === PlayerChoice.PLAYER1 ? oddsPlayer1 : oddsPlayer2;
    const profit = amount * odds;

    // Создаем участника ставки
    await prisma.betParticipant.create({
      data: {
        betId,
        userId,
        amount,
        player,
        odds,
        profit,
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
        currentOdds1: oddsPlayer1,
        currentOdds2: oddsPlayer2,
        totalBetPlayer1: totalPlayer1,
        totalBetPlayer2: totalPlayer2,
      },
    });

    revalidatePath('/'); // Ревалидируем путь (если используете Next.js)
    console.log(`Пользователь ${userId} сделал ставку ${amount} на игрока ${player}`);
  } catch (error) {
    console.error('Error placing bet:', error);
    throw new Error('Failed to place bet.');
  }
}

export async function closeBet(betId: number, winnerId: number) {
  'use server';

  try {
    // Находим ставку и обновляем её статус и победителя
    const bet = await prisma.bet.update({
      where: { id: betId },
      data: {
        status: 'CLOSED',
        winnerId: winnerId,
      },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
        player1: true,
        player2: true,
      },
    });

    if (!bet) {
      throw new Error("Ставка не найдена");
    }

    // Определяем, кто выиграл: player1 или player2
    const winningPlayer = bet.winnerId === bet.player1Id ? PlayerChoice.PLAYER1 : PlayerChoice.PLAYER2;

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

    // Ревалидируем путь (если используете Next.js)
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


