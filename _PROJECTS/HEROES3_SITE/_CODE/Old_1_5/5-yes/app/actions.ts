'use server';
import {prisma} from '@/prisma/prisma-client';
import {getUserSession} from '@/components/lib/get-user-session';
import {PlayerChoice, Prisma} from '@prisma/client';
import {hashSync} from 'bcrypt';
import {revalidatePath} from 'next/cache'
import * as z from 'zod'

const placeBetSchema = z.object({
  betId: z.number().int(),
  userId: z.number().int(),
  amount: z.number().positive({ message: 'Сумма должна быть положительным числом' }),
  player: z.nativeEnum(PlayerChoice),
});
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

const createBetSchema = z.object({
  player1Id: z.number().int(),
  player2Id: z.number().int(),
  initBetPlayer1: z.number().positive(),
  initBetPlayer2: z.number().positive(),
  currentOdds1: z.number().positive(),
  currentOdds2: z.number().positive(),
  creatorId: z.number().int(),
  categoryId: z.number().int().optional(),
  productId: z.number().int().optional(),
  productItemId: z.number().int().optional(),
  maxBetAmount: z.number().positive().default(1), // Значение по умолчанию
  totalBetAmount: z.number().positive().default(1), // Значение по умолчанию
});

export async function clientCreateBet(formData: any) {
  const session = await getUserSession();
  if (!session) {
    throw new Error("User session is not available.");
  }

  if (!formData.player1Id || !formData.player2Id || !formData.creatorId || !formData.initBetPlayer1 || !formData.initBetPlayer2 || !formData.currentOdds1 || !formData.currentOdds2) {
    throw new Error("Missing required fields in formData.");
  }
  console.log("formData:", formData); // Логируем входящие данные
  console.log("session:", session); // Логируем сессию

  try {
    console.log("creatorId:", Number(session?.id)); // Логируем creatorId перед вызовом Prisma

    // Создаем ставку в базе данных
    const newBet = await prisma.bet.create({
      data: {
        // ...formData, // Используем данные напрямую из formData
        status: 'OPEN', // Устанавливаем статус ставки как "открытая"
        totalBetAmount: 50, // Инициализируем общую сумму ставок
        maxBetAmount: 50,
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
      },
    });

    console.log("New bet created: newBet"); // Логируем созданную ставку
    console.log(newBet); // Логируем созданную ставку

    // Ревалидируем путь (если используем Next.js)
    revalidatePath('/');

    return newBet; // Возвращаем созданную ставку
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.stack);
    }
    throw new Error('Failed to game your interaction. Please try again.');
  }
}

export async function placeBet(formData: { betId: number; userId: number; amount: number; player: PlayerChoice }) {
  try {
    const { betId, userId, amount, player } = formData;

    // Проверяем, что ставка существует и доступна
    const bet = await prisma.bet.findUnique({
      where: { id: betId },
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

    // Получаем текущие коэффициенты
    const odds = player === 'PLAYER1' ? bet.currentOdds1 : bet.currentOdds2;

    // Рассчитываем потенциальную прибыль
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

    // Обновляем общую сумму ставок
    const totalBetAmount = await prisma.betParticipant.aggregate({
      where: { betId },
      _sum: { amount: true },
    });

    // Обновляем коэффициенты
    const odds1 = await calculateOdds(totalBetAmount._sum.amount || 0, betId, 'PLAYER1');
    const odds2 = await calculateOdds(totalBetAmount._sum.amount || 0, betId, 'PLAYER2');

    await prisma.bet.update({
      where: { id: betId },
      data: {
        totalBetAmount: totalBetAmount._sum.amount || 0,
        currentOdds1: odds1,
        currentOdds2: odds2,
      },
    });

    revalidatePath('/'); // Ревалидируем путь (если используете Next.js)
    console.log(`Пользователь ${userId} сделал ставку ${amount} на игрока ${player}`);
  } catch (error) {
    console.error('Error placing bet:', error);
    throw new Error('Failed to place bet.');
  }
}


async function calculateOdds(totalBetAmount: number, betId: number, player: PlayerChoice) {
  const participants = await prisma.betParticipant.findMany({
    where: { betId, player },
  });
  const totalBetsOnPlayer = participants.reduce((sum, p) => sum + p.amount, 0);

  if (totalBetsOnPlayer === 0) {
    return 0;
  }

  const oppositePlayer = player === 'PLAYER1' ? 'PLAYER2' : 'PLAYER1';
  const betsOnOppositePlayer = await prisma.betParticipant.findMany({
    where: { betId, player: oppositePlayer },
  });
  const totalBetsOnOppositePlayer = betsOnOppositePlayer.reduce((acc, cur) => acc + cur.amount, 0);

  const odds = totalBetsOnOppositePlayer / totalBetsOnPlayer;
  return isNaN(odds) ? 0 : odds;
}

export async function closeBet(betId: number, winnerId: number) {
  'use server';

  try {
    // Находим ставку и обновляем её статус и победителя
    const bet = await prisma.bet.update({
      where: { id: betId },
      data: {
        status: 'CLOSED',
        winnerId: winnerId, // Устанавливаем победителя (ID игрока)
      },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
        player1: true, // Включаем данные о player1
        player2: true, // Включаем данные о player2
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
        if (participant.odds === null) {
          console.error('Odds is null for participant:', participant);
          continue; // Пропустить этого участника
        }
        const winAmount = participant.amount * participant.odds;
        // Продолжаем логику...
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
