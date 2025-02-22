import { NextResponse } from 'next/server';
import { prisma } from '@/prisma/prisma-client'; // Ensure the path to prisma-client is correct

export async function GET() {
    try {
        const gameUserBets = await prisma.gameUserBet.findMany({
            include: {
                gameUser1Bet: true,
                gameUser2Bet: true,
                category: true,
                product: true,
                productItem: true,
            },
        });
        return NextResponse.json(gameUserBets);
    } catch (error) {
        console.error('Failed to fetch data:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}