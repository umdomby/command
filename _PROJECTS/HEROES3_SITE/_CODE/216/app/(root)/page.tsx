"use server";
import { Container } from '@/components/container';
import { prisma } from '@/prisma/prisma-client';
import React, { Suspense } from "react";
import Loading from "@/app/(root)/loading";
import { HEROES_CLIENT } from "@/components/HEROES_CLIENT";
import { getUserSession } from "@/components/lib/get-user-session";
import { GlobalData } from "@/components/globalData";
import TelegramNotification from '@/components/TelegramNotification';
import { HEROES_CLIENT_NO_REG } from "@/components/HEROES_CLIENT_NO_REG";
import BanedNotification from "@/components/BanedNotification";
import Link from "next/link";

const FixedLink = () => (
    <div className="fixed bottom-4 right-4 p-4 shadow-lg rounded-lg z-50">
        <p className="text-md text-blue-500 font-bold">
            <Link className="text-blue-500 hover:text-green-300 font-bold text-xl" href={'https://t.me/navatar85'} target="_blank">@navatar85</Link>
        </p>
    </div>
);

export default async function Home() {
    const session = await getUserSession();
    let user = null;

    if (session) {
        user = await prisma.user.findFirst({ where: { id: Number(session?.id) } });
    }

    const isTelegramEmpty = user && (!user.telegram || user.telegram.trim() === '');

    return (
        <Container className="w-[100%]">
            {user && user.role !== 'BANED' && (
                <>
                    {isTelegramEmpty && (
                        <TelegramNotification initialTelegram={user.telegram || ''} />
                    )}
                    <FixedLink />
                    <Suspense fallback={<Loading />}>
                        <GlobalData />
                        <HEROES_CLIENT user={user} />
                    </Suspense>
                </>
            )}
            {user && user.role === 'BANED' && (
                <Suspense fallback={<Loading />}>
                    <BanedNotification />
                    <GlobalData />
                    <HEROES_CLIENT_NO_REG />
                </Suspense>
            )}
            {!user && (
                <Suspense fallback={<Loading />}>
                    <FixedLink />
                    <GlobalData />
                    <HEROES_CLIENT_NO_REG />
                </Suspense>
            )}
        </Container>
    );
}
