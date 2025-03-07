// server page
"use server";
import { redirect } from 'next/navigation';
import { getUserSession } from "@/components/lib/get-user-session";
import { prisma } from "@/prisma/prisma-client";
import React from "react";
import { Container } from "@/components/container";
import { PlayerStatisticsComp } from "@/components/PlayerStatisticsComp";

export default async function PlayerStatisticsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    const session = await getUserSession();

    if (!session) {
        return redirect('/');
    }

    const user = await prisma.user.findFirst({ where: { id: Number(session?.id) } });

    if (user?.role !== 'ADMIN') {
        return redirect('/');
    }

    const resolvedSearchParams = await searchParams;
    const page = parseInt(resolvedSearchParams.page || '1', 10);
    const pageSize = 100;
    const skip = (page - 1) * pageSize;

    const playerStatistics = await prisma.playerStatistic.findMany({
        skip,
        take: pageSize,
        include: {
            turnirBet: true,
            category: true,
            player: true,
        },
    });

    // Debugging: Log the data to ensure it's an array
    console.log("Loaded playerStatistics:", playerStatistics);

    if (!Array.isArray(playerStatistics)) {
        console.error("playerStatistics is not an array:", playerStatistics);
        return null; // или обработайте ошибку соответствующим образом
    }

    return (
        <Container className="w-[96%]">
            <PlayerStatisticsComp playerStatistics={playerStatistics} />
        </Container>
    );
}
'use client';
import React from "react";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { PlayerStatistic } from "@prisma/client";
import { Crown } from 'lucide-preact';

interface PlayerStatisticsProps {
    playerStatistics: PlayerStatistic[];
}

export function PlayerStatisticsComp({ playerStatistics }: PlayerStatisticsProps) {
    const getColor = (color: string) => {
        switch (color) {
            case 'RED': return 'text-red-500';
            case 'BLUE': return 'text-blue-500';
            case 'GREEN': return 'text-green-500';
            case 'YELLOW': return 'text-yellow-500';
            case 'PURPLE': return 'text-purple-500';
            case 'ORANGE': return 'text-orange-500';
            case 'TEAL': return 'text-teal-500';
            case 'PINK': return 'text-pink-500';
            default: return '';
        }
    };

    const getCityName = (city: string) => {
        switch (city) {
            case 'CASTLE': return 'ЗАМОК';
            case 'RAMPART': return 'ОПЛОТ';
            case 'TOWER': return 'БАШНЯ';
            case 'INFERNO': return 'ИНФЕРНО';
            case 'NECROPOLIS': return 'НЕКРОПОЛИС';
            case 'DUNGEON': return 'ТЕМНИЦА';
            case 'STRONGHOLD': return 'ЦИТАДЕЛЬ';
            case 'FORTRESS': return 'КРЕПОСТЬ';
            case 'CONFLUX': return 'СОПРЯЖЕНИЕ';
            case 'COVE': return 'ПРИЧАЛ';
            case 'FACTORY': return 'ФАБРИКА';
            default: return '';
        }
    };

    return (
        <Table>
            <TableBody>
                {playerStatistics.map((stat) => (
                    <TableRow key={stat.id}>
                        <TableCell>{stat.turnirBet?.name || 'N/A'}</TableCell>
                        <TableCell>{stat.category?.name || 'N/A'}</TableCell>
                        <TableCell className={getColor(stat.color)}>
                            {stat.player?.name || 'N/A'} {stat.win && <Crown />}
                        </TableCell>
                        <TableCell>{getCityName(stat.city)}</TableCell>
                        <TableCell>{stat.gold}</TableCell>
                        <TableCell>{stat.security}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
получаем данные
Loaded playerStatistics: [

    {
        id: 9,
        turnirId: 2,
        categoryId: 17,
        playerId: 36,
        color: 'BLUE',
        city: 'TOWER',
        gold: -1100,
        security: 'Костяной Дракон',
        win: true,
        link: 'https://www.youtube.com/watch?v=cNq6bKSqxLw&list=PLGvjKRILtSt_pvwRLx3iA8ec_lv6KF7YO&index=4&pp=iAQB',
        turnirBet: { id: 2, name: 'Heroes Cup' },
        category: { id: 17, name: 'JC Amazonki' },
        player: {
            id: 36,
            name: 'HellLighT111',
            twitch: 'https://www.twitch.tv/HellLighT111',
            userId: 1
        }
    },
    {
        id: 10,
        turnirId: 2,
        categoryId: 17,
        playerId: 59,
        color: 'RED',
        city: 'RAMPART',
        gold: 1100,
        security: 'Морской Змей',
        win: false,
        link: 'https://www.youtube.com/watch?v=cNq6bKSqxLw&list=PLGvjKRILtSt_pvwRLx3iA8ec_lv6KF7YO&index=4&pp=iAQB',
        turnirBet: { id: 2, name: 'Heroes Cup' },
        category: { id: 17, name: 'JC Amazonki' },
        player: {
            id: 59,
            name: 'Skuns1978',
            twitch: 'https://www.twitch.tv/heroes3_site',
            userId: 1
        }
    },
    {
        id: 11,
        turnirId: 2,
        categoryId: 19,
        playerId: 36,
        color: 'RED',
        city: 'CONFLUX',
        gold: 5800,
        security: 'Древнее Чудище',
        win: true,
        link: '',
        turnirBet: { id: 2, name: 'Heroes Cup' },
        category: { id: 19, name: 'JC Native' },
        player: {
            id: 36,
            name: 'HellLighT111',
            twitch: 'https://www.twitch.tv/HellLighT111',
            userId: 1
        }
    },
    {
        id: 12,
        turnirId: 2,
        categoryId: 19,
        playerId: 59,
        color: 'BLUE',
        city: 'CASTLE',
        gold: -5800,
        security: '-',
        win: false,
        link: '',
        turnirBet: { id: 2, name: 'Heroes Cup' },
        category: { id: 19, name: 'JC Native' },
        player: {
            id: 59,
            name: 'Skuns1978',
            twitch: 'https://www.twitch.tv/heroes3_site',
            userId: 1
        }
    },]

ошибка
Unhandled Runtime Error


Error: Objects are not valid as a React child (found: object with keys {type, props, key, ref, __k, __, __b, __e, __c, constructor, __v, __i, __u}). If you meant to render a collection of children, use an array instead.

    app/(root)/player-statistic/page.tsx (48:13) @ PlayerStatisticsPage


46 |     return (
    47 |         <Container className="w-[96%]">
        > 48 |             <PlayerStatisticsComp playerStatistics={playerStatistics} />
        |             ^
        49 |         </Container>
50 |     );
51 | }
