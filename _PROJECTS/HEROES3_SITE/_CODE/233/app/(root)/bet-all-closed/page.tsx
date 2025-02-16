"use server";
import { Container } from '@/components/container';
import { prisma } from '@/prisma/prisma-client';
import React, { Suspense } from "react";
import Loading from "@/app/(root)/loading";
import { BET_ALL_CLOSED_2 } from "@/components/BET_ALL_CLOSED_2";
import {BET_ALL_CLOSED_3} from "@/components/BET_ALL_CLOSED_3";
import {BET_ALL_CLOSED_4} from "@/components/BET_ALL_CLOSED_4";

export default async function BetAllClosedPage() {
    // Получаем все закрытые ставки, в которых участвовал пользователь
    const closedBets2 = await prisma.betCLOSED.findMany({
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
            createdAt: 'asc'
        }
    });

    const closedBets3 = await prisma.betCLOSED3.findMany({
        include: {
            participantsCLOSED3: true,
            player1: true,
            player2: true,
            player3: true,
            creator: true,
            category: true,
            product: true,
            productItem: true
        },
        orderBy: {
            createdAt: 'asc'
        }
    });

    const closedBets4 = await prisma.betCLOSED4.findMany({
        include: {
            participantsCLOSED4: true,
            player1: true,
            player2: true,
            player3: true,
            player4: true,
            creator: true,
            category: true,
            product: true,
            productItem: true
        },
        orderBy: {
            createdAt: 'asc'
        }
    });

    return (
        <Container className="w-[100%]">
            <Suspense fallback={<Loading />}>
                <BET_ALL_CLOSED_2 closedBets={closedBets2} />
                <BET_ALL_CLOSED_3 closedBets={closedBets3} />
                <BET_ALL_CLOSED_4 closedBets={closedBets4} />
            </Suspense>
        </Container>
    );
}
