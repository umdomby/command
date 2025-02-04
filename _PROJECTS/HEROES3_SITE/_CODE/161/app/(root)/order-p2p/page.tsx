"use server";
import { Container } from '@/components/container';
import { prisma } from '@/prisma/prisma-client';
import { redirect } from 'next/navigation';
import React, { Suspense } from "react";
import Loading from "@/app/(root)/loading";
import { getUserSession } from "@/components/lib/get-user-session";
import {OrderP2P} from "@/components/OrderP2P";

export default async function BuyPayPointsPage() {
    const session = await getUserSession();

    if (!session) {
        return redirect('/not-auth');
    }

    const user = await prisma.user.findFirst({ where: { id: Number(session?.id) } });

    if (!user) {
        return redirect('/not-auth');
    }

    return (
        <Container className="w-[100%]">
            <Suspense fallback={<Loading />}>
                <OrderP2P user={user} />
            </Suspense>
        </Container>
    );
}
