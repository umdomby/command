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

    const gameUserBets: (GameUserBet & {
        gameUser1Bet: User;
        gameUser2Bet: User | null;
        category: Category;
        product: Product;
        productItem: ProductItem;
    })[] = await prisma.gameUserBet.findMany({
        include: {
            gameUser1Bet: true, // Include the related User for gameUser1Bet
            gameUser2Bet: true, // Include the related User for gameUser2Bet
            category: true,
            product: true,
            productItem: true,
        },
    });


    return (
        <Container className="flex flex-col my-10 w-[96%]">
            <UserGame2Comp
                user={user}
                gameUserBets={gameUserBets}
            />
        </Container>
    );
}