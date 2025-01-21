"use server"

import {Container} from '@/components/container';
import {prisma} from '@/prisma/prisma-client';
import {redirect} from 'next/navigation';
import React, {Suspense} from "react";
import Loading from "@/app/(root)/loading";
import {HEROES_CLIENT} from "@/components/HEROES_CLIENT";
import {getUserSession} from "@/components/lib/get-user-session";
import {GlobalData} from "@/components/globalData";



export default async function Home() {

    const session = await getUserSession();

    if (!session) {
        return redirect('/not-auth');
    }


    const user = await prisma.user.findFirst({where: {id: Number(session?.id)}});

    if (user) {
        return (
            <Container className="flex flex-col my-10">
                <Suspense fallback={<Loading/>}>
                    <GlobalData />
                    <HEROES_CLIENT user={user}/>
                </Suspense>
            </Container>
        );
    } else {
        return (
            <div>
                123
            </div>
        )
    }
}