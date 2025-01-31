import { NextResponse } from 'next/server';
import { prisma } from '@/prisma/prisma-client';
import * as z from 'zod';
import {PlayerChoice} from "@prisma/client";

const closeBetSchema = z.object({
    betId: z.number().int(),
    winnerId: z.number().int(),
});

export async function POST(request: Request) {
    try {
        const { betId, winnerId } = closeBetSchema.parse(await request.json());

        // Находим ставку и проверяем её статус
        const bet = await prisma.bet.findUniqueOrThrow({
            where: { id: betId },
            include: { creator: true, participants: true }, // Включаем участников
        });

        if (bet.status === 'CLOSED') {
            return new NextResponse('Ставка уже закрыта', { status: 400 });
        }

        // Проверяем, что winnerId соответствует player1Id или player2Id
        if (winnerId !== bet.player1Id && winnerId !== bet.player2Id) {
            return new NextResponse("Неверный ID победителя", { status: 400 });
        }

        // Обновляем статус ставки и устанавливаем победителя
        const updatedBet = await prisma.bet.update({
            where: { id: betId },
            data: { winnerId, status: 'CLOSED' },
            include: {
                creator: true,
                participants: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        // Начисляем выигрыши участникам
        for (const participant of bet.participants) {
            if (participant.player === (winnerId === bet.player1Id ? PlayerChoice.PLAYER1 : PlayerChoice.PLAYER2)) {
                const winAmount = participant.amount * participant.odds;

                // Начисляем выигрыш победителю
                await prisma.user.update({
                    where: { id: participant.userId },
                    data: { points: { increment: winAmount } },
                });

                // Помечаем участника как победителя
                await prisma.betParticipant.update({
                    where: { id: participant.id },
                    data: {
                        isWinner: true,
                    },
                });
            }
        }

        return NextResponse.json({ message: 'Ставка закрыта', bet: updatedBet });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify(error.issues), { status: 400 });
        }
        console.error('Ошибка при закрытии ставки:', error);
        return new NextResponse('Ошибка сервера', { status: 500 });
    }
}