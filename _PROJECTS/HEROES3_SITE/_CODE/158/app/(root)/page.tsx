"use server";
import {Container} from '@/components/container';
import {prisma} from '@/prisma/prisma-client';
import {redirect} from 'next/navigation';
import React, {Suspense} from "react";
import Loading from "@/app/(root)/loading";
import {HEROES_CLIENT} from "@/components/HEROES_CLIENT";
import {getUserSession} from "@/components/lib/get-user-session";
import {GlobalData} from "@/components/globalData";
import {HEROES_CLIENT_NO_REG} from "@/components/HEROES_CLIENT_NO_REG";


export default async function Home() {

    const session = await getUserSession();
    let user = null

    if (session) {
        user = await prisma.user.findFirst({where: {id: Number(session?.id)}});
    }

    if (user) {
        return (
            <Container className="w-[100%]">
                <Suspense fallback={<Loading/>}>
                    <GlobalData />
                    <HEROES_CLIENT user={user}/>
                </Suspense>
            </Container>
        );
    } else {
        return (
            <Container className="w-[100%]">
                <Suspense fallback={<Loading/>}>
                    <GlobalData />
                    <HEROES_CLIENT_NO_REG />
                </Suspense>
            </Container>
        )
    }
}