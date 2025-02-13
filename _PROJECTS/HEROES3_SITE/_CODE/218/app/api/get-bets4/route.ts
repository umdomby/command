import { NextResponse } from 'next/server';
import { prisma } from '@/prisma/prisma-client';

export async function GET() {
    try {
        // Получаем все открытые ставки на трех игроков
        const bets = await prisma.bet4.findMany({
            where: { status: 'OPEN' },
            include: {
                player1: true,
                player2: true,
                player3: true,
                player4: true,
                participants: true,
            },
        });

        return NextResponse.json(bets);
    } catch (error) {
        console.error('Ошибка при получении ставок на трех игроков:', error);
        return new NextResponse('Ошибка сервера', { status: 500 });
    }
}
