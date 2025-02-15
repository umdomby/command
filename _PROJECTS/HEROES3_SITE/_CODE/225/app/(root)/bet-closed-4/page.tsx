"use server";
import { Container } from '@/components/container';
import { prisma } from '@/prisma/prisma-client';
import { redirect } from 'next/navigation';
import React, { Suspense } from "react";
import Loading from "@/app/(root)/loading";
import { getUserSession } from "@/components/lib/get-user-session";
import { HEROES_CLIENT_CLOSED_4 } from "@/components/HEROES_CLIENT_CLOSED_4";

export default async function BetClosedPage() {
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

    // Fetch all closed bets involving four players that the user participated in
    const closedBets = await prisma.betCLOSED4.findMany({
        where: {
            participantsCLOSED4: {
                some: {
                    userId: user.id
                }
            }
        },
        include: {
            participantsCLOSED4: true,
            player1: true,
            player2: true,
            player3: true,
            player4: true,
        },
        orderBy: {
            updatedAt: 'desc'
        }
    });

    return (
        <Container className="w-[100%]">
            <Suspense fallback={<Loading />}>
                <HEROES_CLIENT_CLOSED_4 user={user} closedBets={closedBets} />
            </Suspense>
        </Container>
    );
}
