"use server";

import { Container } from '@/components/container';
import { prisma } from '@/prisma/prisma-client';
import React, { Suspense } from "react";
import Loading from "@/app/(root)/loading";
import { USERS_ALL_CLOSED_2 } from "@/components/USERS_ALL_CLOSED_2";
import {getUserSession} from "@/components/lib/get-user-session";
import {redirect} from "next/navigation";

export default async function Bet2ClosedPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {

    const session = await getUserSession();

    if (!session) {
        return redirect('/');
    }

    const user = await prisma.user.findFirst({
        where: { id: Number(session?.id) },
    });

    if (!user || user.role === 'BANED') {
        return redirect('/');
    }


    const resolvedSearchParams = await searchParams; // Await the searchParams if it's a Promise

    const page = parseInt(resolvedSearchParams.page ?? '1', 10);
    const betsPerPage = 100;
    const skip = (page - 1) * betsPerPage;

    // Fetch closed bets with pagination for 2 players
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
        },
        skip: skip,
        take: betsPerPage,
    });

    const totalBets2 = await prisma.betCLOSED.count();
    const totalPages2 = Math.ceil(totalBets2 / betsPerPage);

    return (
        <Container className="w-[100%]">
            <Suspense fallback={<Loading />}>
                <USERS_ALL_CLOSED_2 user={user} closedBets={closedBets2} currentPage={page} totalPages={totalPages2} />
            </Suspense>
        </Container>
    );
}
