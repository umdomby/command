"use server";

import { prisma } from '@/prisma/prisma-client';
import React from "react";
import { getUserSession } from "@/components/lib/get-user-session";
import { Container } from '@/components/container';
import { redirect } from "next/navigation";
import Link from "next/link";
import {UserGame2Closed} from "@/components/user-game-2-closed";

export default async function UserGameClosed2Page() {
    const session = await getUserSession();

    if (!session) {
        redirect('/not-auth');
    }

    const user = await prisma.user.findFirst({ where: { id: Number(session?.id) } });

    if (!user) {
        return redirect('/not-auth');
    }
    const player = await prisma.player.findFirst({ where: { userId: Number(session?.id) } });

    // Проверяем, существует ли объект player
    if (!player) {
        return (
            <div className="text-center">
                <p className="text-green-500">Вы не зарегистрированы как игрок</p>
                <p>
                    1. Заполните: Настройки Telegram
                </p>
                <p>
                    2. Зарегистрируйтесь как игрок
                </p>
                <p>
                    <Link href="/profile" className="text-blue-500">Profile</Link>
                </p>
            </div>
        );
    }


    const gameUserBetsData = await prisma.gameUserBet.findMany({
        where: {
            statusUserBet: {
                in: ['CLOSED'], // Фильтрация по статусу
            },
        },
        include: {
            gameUser1Bet: true,
            gameUser2Bet: true,
            category: true,
            product: true,
            productItem: true,
        },
        orderBy: {
            createdAt: 'desc', // Sort by createdAt in descending order
        },
    });

    return (
        <Container className="flex flex-col my-10 w-[96%]">
            <UserGame2Closed
                gameUserBetsData = {gameUserBetsData}
                user={user}
            />
        </Container>
    );
}
