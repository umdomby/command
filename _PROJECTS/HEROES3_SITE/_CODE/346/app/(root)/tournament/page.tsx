// server page
"use server";
import { redirect } from 'next/navigation';
import { getUserSession } from "@/components/lib/get-user-session";
import { prisma } from "@/prisma/prisma-client";
import React from "react";
import { Container } from "@/components/container";
import { TOURNAMENT } from "@/components/TOURNAMENT";

export default async function PlayerStatisticsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    const session = await getUserSession();
    const user = session ? await prisma.user.findFirst({ where: { id: Number(session.id) } }) : null;
    const resolvedSearchParams = await searchParams;
    const page = parseInt(resolvedSearchParams.page || '1', 10);
    const pageSize = 50;
    const skip = (page - 1) * pageSize;

    const totalRecords = await prisma.playerStatistic.count();
    const playerStatistics = await prisma.playerStatistic.findMany({
        skip,
        take: pageSize,
        orderBy: {
            id: 'desc', // Sort by the 'id' field in descending order
        },
        include: {
            turnirBet: true,
            category: true,
            player: true,
        },
    });

    const turnirs = await prisma.turnirBet.findMany();
    const categories = await prisma.category.findMany();
    const players = await prisma.player.findMany();

    return (
        <Container className="w-[96%]">
            <TOURNAMENT
                user={user} // This can be null if the user is not logged in
                playerStatistics={playerStatistics}
                currentPage={page}
                totalPages={Math.ceil(totalRecords / pageSize)}
                turnirs={turnirs}
                categories={categories}
                players={players}
            />
        </Container>
    );
}