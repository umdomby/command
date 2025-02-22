"use server";

import { Container } from '@/components/container';
import { prisma } from '@/prisma/prisma-client';
import React, { Suspense } from "react";
import Loading from "@/app/(root)/loading";
import { USERS_ALL_CLOSED_3 } from "@/components/USERS_ALL_CLOSED_3";

export default async function Bet3ClosedPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    const resolvedSearchParams = await searchParams; // Await the searchParams if it's a Promise

    const page = parseInt(resolvedSearchParams.page ?? '1', 10);
    const betsPerPage = 100;
    const skip = (page - 1) * betsPerPage;

    // Fetch closed bets with pagination for 3 players
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
        },
        skip: skip,
        take: betsPerPage,
    });

    const totalBets3 = await prisma.betCLOSED3.count();
    const totalPages3 = Math.ceil(totalBets3 / betsPerPage);

    return (
        <Container className="w-[100%]">
            <Suspense fallback={<Loading />}>
                <USERS_ALL_CLOSED_3 closedBets={closedBets3} currentPage={page} totalPages={totalPages3} />
            </Suspense>
        </Container>
    );
}