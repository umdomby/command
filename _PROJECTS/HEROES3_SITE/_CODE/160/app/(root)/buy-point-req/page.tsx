"use server";
import { Container } from '@/components/container';
import { prisma } from '@/prisma/prisma-client';
import { redirect } from 'next/navigation';
import React, { Suspense } from "react";
import Loading from "@/app/(root)/loading";
import { getUserSession } from "@/components/lib/get-user-session";
import {BUY_POINT_REQ} from "@/components/BUY_POINT_REQ";

export default async function BuyPointReqPage() {
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
                <BUY_POINT_REQ user={user}  />
            </Suspense>
        </Container>
    );
}
