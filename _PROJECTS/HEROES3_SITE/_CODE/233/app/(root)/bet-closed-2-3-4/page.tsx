"use server";
import { Container } from '@/components/container';
import { prisma } from '@/prisma/prisma-client';
import React, { Suspense } from "react";
import Loading from "@/app/(root)/loading";
import { getUserSession } from "@/components/lib/get-user-session";
import TelegramNotification from '@/components/TelegramNotification';
import Link from "next/link";
import { User } from "@prisma/client";
import GlobalDataComponent from "@/components/globalData";
import {HEROES_CLIENT_CLOSED_2} from "@/components/HEROES_CLIENT_CLOSED_2";
import {HEROES_CLIENT_CLOSED_3} from "@/components/HEROES_CLIENT_CLOSED_3";
import {HEROES_CLIENT_CLOSED_4} from "@/components/HEROES_CLIENT_CLOSED_4";
import {redirect} from "next/navigation";

const FixedLink = () => (
    <div className="fixed bottom-4 right-4 p-4 shadow-lg rounded-lg z-50">
        <p className="text-md text-blue-500 font-bold">
            <Link className="text-blue-500 hover:text-green-300 font-bold text-xl" href={'https://t.me/navatar85'}
                  target="_blank">@navatar85</Link>
        </p>
    </div>
);

interface PointsUserProps {
    user: User;
}

const PointsUser: React.FC<PointsUserProps> = ({ user }) => (
    <div className="absolute top-0 left-0 right-0 flex justify-center items-center py-2 z-50 transform -translate-y-9">
        <p className="text-sm font-bold">
            Points: <span className="text-red-500">{Math.floor((user.points ?? 0) * 100) / 100}</span>
        </p>
    </div>
);

export default async function Home() {

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

    const isTelegramEmpty = user && (!user.telegram || user.telegram.trim() === '');

    // Получаем все закрытые ставки, в которых участвовал пользователь
    const closedBets = await prisma.betCLOSED.findMany({
        where: {
            participantsCLOSED: {
                some: {
                    userId: user.id
                }
            }
        },
        include: {
            participantsCLOSED: true, // Получаем всех участников, чтобы отобразить выигранные и проигранные ставки
            player1: true,
            player2: true,
            creator: true,
            category: true,
            product: true,
            productItem: true,
        },
        orderBy: {
            updatedAt: 'desc' // Сортировка по дате создания в порядке убывания
        }
    });

    // Получаем все закрытые ставки на трех игроков, в которых участвовал пользователь
    const closedBets3 = await prisma.betCLOSED3.findMany({
        where: {
            participantsCLOSED3: {
                some: {
                    userId: user.id
                }
            }
        },
        include: {
            participantsCLOSED3: true,
            player1: true,
            player2: true,
            player3: true,
        },
        orderBy: {
            updatedAt: 'desc'
        }
    });

    const closedBets4 = await prisma.betCLOSED4.findMany({
        include: {
            participantsCLOSED4: {
                include: {
                    user: true,
                },
            },
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
        <Container className="w-[100%] relative">
            {user && (
                <PointsUser user={user} />
            )}
            {user && (
                <>
                    {isTelegramEmpty && (
                        <TelegramNotification initialTelegram={user.telegram || ''} />
                    )}
                    <FixedLink />
                    <Suspense fallback={<Loading/>}>
                        <GlobalDataComponent/>
                        <br/>
                        2 players
                        <HEROES_CLIENT_CLOSED_2 user={user} closedBets={closedBets}/>
                        <br/>
                        3 players
                        <HEROES_CLIENT_CLOSED_3 user={user} closedBets={closedBets3}/>
                        <br/>
                        4 players
                        <HEROES_CLIENT_CLOSED_4 user={user} closedBets={closedBets4}/>
                    </Suspense>
                </>
            )}
        </Container>
    );
}
