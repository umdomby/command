// /app/(root)/order-p2p/page.tsx

import { Container } from '@/components/container';
import { prisma } from '@/prisma/prisma-client';
import { redirect } from 'next/navigation';
import React, { Suspense } from "react";
import Loading from "@/app/(root)/loading";
import { getUserSession } from "@/components/lib/get-user-session";
import { OrderP2PComponent } from "@/components/OrderP2PComponent";

export default async function OrderP2PPage() {
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
    if (user.role === 'BANED') {
        return redirect('/');
    }

    // Fetch open orders
    const openOrders = await prisma.orderP2P.findMany({
        where: {orderP2PStatus: 'OPEN'},
        orderBy: {
            createdAt: 'desc',
        },
        include: {
            orderP2PUser1: {
                select: {
                    id: true,
                    cardId: true,
                }
            },
            orderP2PUser2: {
                select: {
                    id: true,
                    cardId: true,
                }
            }
        }
    });

    // Count pending orders
    const pendingOrdersCount = await prisma.orderP2P.count({
        where: {
            orderP2PStatus: 'PENDING',
            OR: [
                { orderP2PUser1Id: user.id, },
                { orderP2PUser2Id: user.id, }
            ]
        }
    });

    return (
        <Container className="w-[100%]">
            <Suspense fallback={<Loading />}>
                <OrderP2PComponent user={user} openOrders={openOrders} pendingOrdersCount={pendingOrdersCount} />
            </Suspense>
        </Container>
    );
}
