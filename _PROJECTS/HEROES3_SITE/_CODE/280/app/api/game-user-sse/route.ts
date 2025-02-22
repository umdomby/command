import { NextResponse } from 'next/server';
import { prisma } from '@/prisma/prisma-client';

export async function GET(request: Request) {
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    const sendUpdate = async () => {
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

            const statusOrder = { OPEN: 1, START: 2, CLOSED: 3 };
            const sortedGameUserBets = gameUserBets.sort((a, b) => {
                if (statusOrder[a.statusUserBet] !== statusOrder[b.statusUserBet]) {
                    return statusOrder[a.statusUserBet] - statusOrder[b.statusUserBet];
                }
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });

            writer.write(encoder.encode(`data: ${JSON.stringify(sortedGameUserBets)}\n\n`));
        } catch (error) {
            console.error('Failed to fetch data:', error);
            writer.write(encoder.encode('data: {"error": "Failed to fetch data"}\n\n'));
        }
    };

    const interval = setInterval(sendUpdate, 5000);

    request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        writer.close();
    });

    return new NextResponse(readable, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
