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
            orderBy: {
                createdAt: 'desc', // Sort by createdAt in descending order
            },
        });

        // Custom sorting logic for statusUserBet
        const statusOrder = { OPEN: 1, START: 2, CLOSED: 3 };
        const sortedGameUserBets = gameUserBets.sort((a, b) => {
            if (statusOrder[a.statusUserBet] !== statusOrder[b.statusUserBet]) {
                return statusOrder[a.statusUserBet] - statusOrder[b.statusUserBet];
            }
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        return NextResponse.json(sortedGameUserBets);
    } catch (error) {
        console.error('Failed to fetch data:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}