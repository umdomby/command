"use server";
import { Container } from '@/components/container';
import { prisma } from '@/prisma/prisma-client';
import { redirect } from 'next/navigation';
import React, { Suspense } from "react";
import Loading from "@/app/(root)/loading";
import { getUserSession } from "@/components/lib/get-user-session";
import { TRANSFER_POINTS } from "@/components/TRANSFER_POINTS";

export default async function TransferPointsPage() {
    const session = await getUserSession();

    if (!session) {
        return redirect('/not-auth');
    }

    const user = await prisma.user.findFirst({ where: { id: Number(session?.id) } });

    if (!user) {
        return redirect('/not-auth');
    }
    if (user.role === 'BANED') {
        return redirect('/');
    }

    // Получение истории переводов с cardId для обоих пользователей
    const transferHistory = await prisma.transfer.findMany({
        where: {
            OR: [
                { transferUser1Id: user.id },
                { transferUser2Id: user.id }
            ],
            transferUser2Id: { not: null } // Exclude transfers with null transferUser2Id
        },
        include: {
            transferUser1: { select: { cardId: true } },
            transferUser2: { select: { cardId: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <Container className="w-[100%]">
            <Suspense fallback={<Loading />}>
                <TRANSFER_POINTS user={user} transferHistory={transferHistory} />
            </Suspense>
        </Container>
    );
}
