import { NextResponse } from 'next/server';
import { prisma } from '@/prisma/prisma-client';

export async function GET(request: Request) {  // Explicitly define the GET method
    try {
        const bets = await prisma.bet.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                player1: true, // Include player1 relation
                player2: true, // Include player2 relation
                creator: true,
                participants: {
                    include: { user: true },
                },
                category: true,
                product: true,
                productItem: true,
            },
        });
        return NextResponse.json(bets);
    } catch (error) {
        console.error('Ошибка при получении ставок:', error);
        return new NextResponse('Ошибка сервера', { status: 500 });
    }
}