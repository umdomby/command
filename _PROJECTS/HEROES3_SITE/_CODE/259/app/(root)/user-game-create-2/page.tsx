"use server";
import { prisma } from '@/prisma/prisma-client';
import { getUserSession } from '@/components/lib/get-user-session';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import Loading from "@/app/(root)/loading";
import { clientCreateBet } from "@/app/actions";
import { Container } from '@/components/container';
import { UserGame2Comp } from "@/components/user-game-2-comp";
import { Player } from '@prisma/client'; // Ensure this import is correct

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

        // Find the player associated with the user
        const player = players.find((p: Player) => p.userId === user?.id);
        console.log("111111111111111 ");
        console.log(player);
        return { user, categories, products, productItems, player };

    } catch (error) {
        console.error("Error fetching data:", error);
        return { user: null, categories: [], products: [], productItems: [], player: null };
    }
}

export default async function UserGamePage() {
    const { user, categories, products, productItems, player } = await fetchData();

    if (!user) {
        redirect('/not-auth');
    }

    if (!player) {
        return <div className="text-center">Вы не зарегистрированы как игрок.</div>;
    }

    return (
        <Container className="flex flex-col my-10 w-[96%]">
            <Suspense fallback={<Loading />}>
                <UserGame2Comp
                    user={user}
                    categories={categories}
                    products={products}
                    productItems={productItems}
                    player={player} // Pass the single player
                    createBet={clientCreateBet}
                />
            </Suspense>
        </Container>
    );
}
