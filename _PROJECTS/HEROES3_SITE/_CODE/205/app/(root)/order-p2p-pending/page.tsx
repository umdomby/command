import { Container } from '@/components/container';
import { prisma } from '@/prisma/prisma-client';
import { redirect } from 'next/navigation';
import React, { Suspense } from "react";
import Loading from "@/app/(root)/loading";
import { getUserSession } from "@/components/lib/get-user-session";
import { OrderP2PPending } from "@/components/OrderP2PPending";
import { checkAndCloseExpiredDeals } from '@/app/actions'; // Импортируем функцию

export default async function OrderP2PPendingPage() {
    // Закрываем просроченные сделки перед рендерингом страницы
    await checkAndCloseExpiredDeals();

    const session = await getUserSession();

    if (!session) {
        return redirect('/not-auth');
    }

    const user = await prisma.user.findFirst({
        where: { id: Number(session?.id) },
    });

    if (!user) {
        return redirect('/not-auth');
    }

    // Запрос к базе данных
    const openOrders = await prisma.orderP2P.findMany({
        where: {
            OR: [
                {
                    orderP2PUser1: { id: user.id },
                    orderP2PStatus: { in: ['PENDING', 'CLOSED', 'RETURN'] }
                },
                {
                    orderP2PUser2: { id: user.id },
                    orderP2PStatus: { in: ['PENDING', 'CLOSED', 'RETURN'] }
                }
            ]
        },
        orderBy: {
            createdAt: 'desc',
        },
        include: {
            orderP2PUser1: {
                select: {
                    id: true,
                    cardId: true,
                    fullName: true,
                    // Добавьте другие необходимые поля
                }
            },
            orderP2PUser2: {
                select: {
                    id: true,
                    cardId: true,
                    fullName: true,
                    // Добавьте другие необходимые поля
                }
            }
        }
    });


    return (
        <Container className="w-[100%]">
            <Suspense fallback={<Loading />}>
                <OrderP2PPending user={user} openOrders={openOrders} />
            </Suspense>
        </Container>
    );
}
