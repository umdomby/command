"use server";
import { prisma } from '@/prisma/prisma-client';
import { getUserSession } from '@/components/lib/get-user-session';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import Loading from "@/app/(root)/loading";
import { clientCreateBet } from "@/app/actions";
import { Container } from '@/components/container';
import { UserGame2 } from "@/components/user-game-2";

async function fetchData() {
    const session = await getUserSession();

    if (!session) {
        redirect('/not-auth');
    }

    try {
        const [user, categories, products, productItems, players] = await prisma.$transaction([
            prisma.user.findUnique({ where: { id: parseInt(session.id) } }),
            prisma.category.findMany(),
            prisma.product.findMany(),
            prisma.productItem.findMany(),
            prisma.player.findMany(),
        ]);

        // Check if the user is a player
        const player = players.find(p => p.id === user?.id);

        return { user, categories, products, productItems, players, player };
    } catch (error) {
        console.error("Error fetching data:", error);
        return { user: null, categories: [], products: [], productItems: [], players: [], player: null };
    }
}

export default async function UserGamePage() {
    const { user, categories, products, productItems, players, player } = await fetchData();

    if (!user) {
        redirect('/not-auth');
    }

    if (!player) {
        return <div>Вы не зарегистрированы как игрок.</div>;
    }

    if (!user) {
        redirect('/not-auth');
    }

    return (
        <Container className="flex flex-col my-10 w-[96%]">
            <Suspense fallback={<Loading />}>
                <UserGame2
                    user={user}
                    categories={categories}
                    products={products}
                    productItems={productItems}
                    players={players}
                    createBet={clientCreateBet}
                />
            </Suspense>
        </Container>
    );
}
