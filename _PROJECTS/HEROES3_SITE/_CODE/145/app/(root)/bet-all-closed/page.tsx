"use server";
import { Container } from '@/components/container';
import { prisma } from '@/prisma/prisma-client';
import React, { Suspense } from "react";
import Loading from "@/app/(root)/loading";
import { BET_ALL_CLOSED } from "@/components/BET_ALL_CLOSED";

export default async function Home() {

    // Получаем все закрытые ставки, в которых участвовал пользователь
    const closedBets = await prisma.betCLOSED.findMany({
        include: {
            participantsCLOSED: true,
            player1: true,
            player2: true,
            creator: true,
            category: true,
            product: true,
            productItem: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return (
        <Container className="w-[100%]">
            <Suspense fallback={<Loading />}>
                <BET_ALL_CLOSED closedBets={closedBets} />
            </Suspense>
        </Container>
    );
}
