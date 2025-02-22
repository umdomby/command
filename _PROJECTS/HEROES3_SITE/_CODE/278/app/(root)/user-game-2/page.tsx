"use server";

import { prisma } from '@/prisma/prisma-client';
import React from "react";
import { getUserSession } from "@/components/lib/get-user-session";
import { UserGame2Comp } from "@/components/user-game-2-comp";
import {Container} from '@/components/container';
import {redirect} from "next/navigation";
import {Category, GameUserBet, Product, ProductItem, User} from "@prisma/client";

export default async function UserGame2Page() {
    const session = await getUserSession();

    if (!session) {
        redirect('/not-auth');
    }

    const user = await prisma.user.findFirst({ where: { id: Number(session?.id) } });

    if (!user) {
        return redirect('/not-auth');
    }


    return (
        <Container className="flex flex-col my-10 w-[96%]">
            <UserGame2Comp
                user={user}
            />
        </Container>
    );
}