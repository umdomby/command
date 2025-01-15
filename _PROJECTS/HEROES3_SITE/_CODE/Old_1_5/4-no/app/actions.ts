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
  player1Id: z.number().int(), // Correct field names and types
  player2Id: z.number().int(),
  initialOdds1: z.number().positive(),
  initialOdds2: z.number().positive(),
  categoryId: z.number(),
  productId: z.number(),
  productItemId: z.number(),
});

export async function createBet(formData: any) {
  const session = await getUserSession();
  console.log("formData:", formData); // Логируем входящие данные
  console.log("session:", session); // Логируем сессию

  try {
    console.log("creatorId:", Number(session?.id)); // Логируем creatorId перед вызовом Prisma

    // Создаем ставку в базе данных
    const newBet = await prisma.bet.create({
      data: {
        ...formData, // Используем данные напрямую из formData
        creatorId: Number(session?.id), // Убедимся, что creatorId — число
        status: 'OPEN', // Устанавливаем статус ставки как "открытая"
        totalBetAmount: 0, // Инициализируем общую сумму ставок
        currentOdds1: formData.initialOdds1, // Инициализируем текущие коэффициенты
        currentOdds2: formData.initialOdds2, // Инициализируем текущие коэффициенты
      },
    });

    console.log("New bet created:", newBet); // Логируем созданную ставку

    // Ревалидируем путь (если используем Next.js)
    revalidatePath('/');

    return newBet; // Возвращаем созданную ставку
  } catch (error) {
    console.error("Error creating bet:", error); // Логируем ошибку

    if (error instanceof Error) {
      throw new Error(error.message); // Обрабатываем ошибки
    } else {
      throw new Error("Failed to create bet."); // Общая ошибка
    }
  }
}

export async function clientCreateBet(formData: any) { // This is the new wrapper
  'use server'; // Mark the wrapper as a server action
  console.log("99999999999999")
  try {
    await createBet(formData); // Call the ORIGINAL createBet function
    revalidatePath('/');
  } catch (error) {
    console.error("Ошибка при создании ставки:", error);
    throw error; // Re-throw to be caught by the client
  }
}

export async function placeBet(formData: { betId: number; userId: number; amount: number; player: PlayerChoice }) {
  try {
    const { betId, userId, amount, player } = formData;

    // Создаем участника ставки
    await prisma.betParticipant.create({
      data: {
        betId,
        userId,
        amount,
        player,
        odds: 1.0,
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

    revalidatePath('/');
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
