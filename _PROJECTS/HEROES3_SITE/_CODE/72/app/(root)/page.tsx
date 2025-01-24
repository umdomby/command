"use server";
import {Container} from '@/components/container';
import {prisma} from '@/prisma/prisma-client';
import {notFound, redirect} from 'next/navigation';

import React, {Suspense} from "react";
import Loading from "@/app/(root)/loading";
import {InferGetServerSidePropsType} from 'next';
import {HEROES_CLIENT} from "@/components/HEROES_CLIENT";
import Link from "next/link";
import {Button} from "@/components/ui";
import Image from "next/image";
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
            <Container className="w-[100%]">
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