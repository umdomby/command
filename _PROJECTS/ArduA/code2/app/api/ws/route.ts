import { NextResponse } from 'next/server';
import { wsServer } from '@/components/lib/websocket';

export const dynamic = 'force-dynamic'; // Важно для API Routes

export async function GET() {
    return NextResponse.json({
        status: 'active',
        connections: wsServer.getClientCount(),
        timestamp: new Date().toISOString()
    });
}

export async function POST(request: Request) {
    try {
        const { deviceId, message } = await request.json();

        if (!deviceId || !message) {
            return NextResponse.json(
                { error: 'Missing deviceId or message' },
                { status: 400 }
            );
        }

        wsServer.broadcastToDevice(deviceId, message);

        return NextResponse.json({
            status: 'message_sent',
            deviceId,
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        return NextResponse.json(
            { error: 'Invalid request format' },
            { status: 400 }
        );
    }
}