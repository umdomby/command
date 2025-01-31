// /app/api/get-global-data/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/prisma/prisma-client';

export async function GET() {
    console.log('GET /api/get-global-data called'); // Debugging
    try {
        const globalData = await prisma.globalData.findFirst({
            orderBy: {
                updatedAt: 'desc',
            },
        });

        return NextResponse.json(globalData);
    } catch (error) {
        console.error('Error fetching global data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch global data' },
            { status: 500 }
        );
    }
}