import {NextResponse} from 'next/server';
import {prisma} from '@/prisma/prisma-client';

export async function GET(request: Request) {
    try {
        const headers = new Headers({
            'Content-Type': 'text/event-stream',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
            'Transfer-Encoding': 'chunked',
        });

        const stream = new ReadableStream({
            start(controller) {
                // Интервал для отправки keep-alive сообщений
                const intervalId = setInterval(() => {
                    try {
                        const data = `data: ${JSON.stringify({type: 'keep-alive'})}\n\n`;
                        controller.enqueue(new TextEncoder().encode(data));
                    } catch (error) {
                        console.error('Ошибка при записи данных:', error);
                        clearInterval(intervalId);
                        controller.close();
                    }
                }, 15000);

                // Подписка на события Prisma
                let subscription: (() =>
                void
            ) |
                null = null;

                try {
                    subscription = prisma.$on('bet', (e) =>
                    {
                        try {
                            if (e.action === 'create' || e.action === 'update' || e.action === 'delete') {
                                const data = `data: ${JSON.stringify({type: e.action, data: e})}\n\n`;
                                controller.enqueue(new TextEncoder().encode(data));
                            }
                        } catch (error) {
                            console.error('Ошибка при записи данных:', error);
                            clearInterval(intervalId);
                            controller.close();
                        }
                    }
                )
                    ;

                    console.log('Подписка на события Prisma создана');
                } catch (error) {
                    console.error('Ошибка при создании подписки на события Prisma:', error);
                }

                // Обработка закрытия соединения
                request.signal.onabort = () =>
                {
                    clearInterval(intervalId);

                    if (subscription) {
                        console.log('Отмена подписки на события Prisma');
                        subscription();
                    }

                    if (prisma.$connected) {
                        console.log('Отключение Prisma');
                        prisma.$disconnect();
                    }

                    controller.close();
                }
                ;
            },
        });

        return new NextResponse(stream, {headers});
    } catch (error) {
        console.error('Ошибка при получении ставок:', error);
        return new NextResponse('Ошибка сервера', {status: 500});
    }
}