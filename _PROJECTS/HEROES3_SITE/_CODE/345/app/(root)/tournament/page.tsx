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

    const user = await prisma.user.findFirst({ where: { id: Number(session?.id) } });
    const resolvedSearchParams = await searchParams;
    const page = parseInt(resolvedSearchParams.page || '1', 10);
    const pageSize = 50;
    const skip = (page - 1) * pageSize;

    const totalRecords = await prisma.playerStatistic.count();
    const playerStatistics = await prisma.playerStatistic.findMany({
        skip,
        take: pageSize,
        include: {
            turnirBet: true,
            category: true,
            player: true,
        },
    });

    return (
        <Container className="w-[96%]">
            <TOURNAMENT
                user={user}
                playerStatistics={playerStatistics}
                currentPage={page}
                totalPages={Math.ceil(totalRecords / pageSize)}
            />
        </Container>
    );
}