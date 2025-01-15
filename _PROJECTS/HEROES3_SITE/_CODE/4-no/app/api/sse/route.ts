import { NextResponse } from 'next/server';
import { prisma } from '@/prisma/prisma-client';

export async function GET(request: Request) {
    try {
        const headers = new Headers({
            'Content-Type': 'text/event-stream',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
            'Transfer-Encoding': 'chunked',
        });

        const stream = new ReadableStream({
            async start(controller) {
                // Интервал для отправки keep-alive сообщений
                const intervalId = setInterval(() => {
                    try {
                        const data = `data: ${JSON.stringify({ type: 'keep-alive' })}\n\n`;
                        controller.enqueue(new TextEncoder().encode(data));
                    } catch (error) {
                        console.error('Ошибка при записи данных:', error);
                        clearInterval(intervalId);
                        controller.close();
                    }
                }, 15000); // Отправляем keep-alive каждые 15 секунд

                // Переменные для хранения последнего времени обновления
                let lastBetUpdatedAt = new Date();
                let lastParticipantUpdatedAt = new Date();

                // Интервал для проверки изменений в таблицах Bet и BetParticipant
                const checkIntervalId = setInterval(async () => {
                    try {
                        // Ищем изменения в таблице Bet
                        const betChanges = await prisma.bet.findMany({
                            where: {
                                updatedAt: {
                                    gt: lastBetUpdatedAt,
                                },
                            },
                        });

                        // Ищем изменения в таблице BetParticipant
                        const participantChanges = await prisma.betParticipant.findMany({
                            where: {
                                updatedAt: {
                                    gt: lastParticipantUpdatedAt,
                                },
                            },
                        });

                        // Если есть изменения в Bet, отправляем их клиенту
                        if (betChanges.length > 0) {
                            betChanges.forEach(change => {
                                const data = `data: ${JSON.stringify({ type: 'update', data: change })}\n\n`;
                                controller.enqueue(new TextEncoder().encode(data));
                            });

                            // Обновляем время последнего изменения для Bet
                            lastBetUpdatedAt = new Date();
                        }

                        // Если есть изменения в BetParticipant, отправляем их клиенту
                        if (participantChanges.length > 0) {
                            participantChanges.forEach(change => {
                                const data = `data: ${JSON.stringify({ type: 'update-participant', data: change })}\n\n`;
                                controller.enqueue(new TextEncoder().encode(data));
                            });

                            // Обновляем время последнего изменения для BetParticipant
                            lastParticipantUpdatedAt = new Date();
                        }
                    } catch (error) {
                        console.error('Ошибка при проверке изменений:', error);
                        clearInterval(checkIntervalId);
                        controller.close();
                    }
                }, 1000); // Проверяем изменения каждые 5 секунд

                // Обработка закрытия соединения
                request.signal.onabort = () => {
                    clearInterval(intervalId);
                    clearInterval(checkIntervalId);
                    controller.close();
                };
            },
        });

        return new NextResponse(stream, { headers });
    } catch (error) {
        console.error('Ошибка при получении данных:', error);
        return new NextResponse('Ошибка сервера', { status: 500 });
    }
}
