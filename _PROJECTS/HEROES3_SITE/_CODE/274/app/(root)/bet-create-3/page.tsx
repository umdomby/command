"use server";
import {prisma} from '@/prisma/prisma-client';
import {getUserSession} from '@/components/lib/get-user-session';
import {redirect} from 'next/navigation';
import {Suspense} from 'react';
import Loading from "@/app/(root)/loading";
import {clientCreateBet3} from "@/app/actions";
import {Container} from '@/components/container';
import {CreateBetForm3} from "@/components/create-bet-form-3";

async function fetchData() {
    const session = await getUserSession();

    if (!session) {
        redirect('/not-auth');
    }

    try {
        const [user, categories, products, productItems, players] = await prisma.$transaction([
            prisma.user.findUnique({where: {id: parseInt(session.id)}}),
            prisma.category.findMany(),
            prisma.product.findMany(),
            prisma.productItem.findMany(),
            prisma.player.findMany({where: {userId: parseInt(session.id)}}),

        ]);
        return {user, categories, products, productItems, players};
    } catch (error) {
        console.error("Error fetching data:", error);
        return {user: null, categories: [], products: [], productItems: [], players: []};
    }
}


export default async function CreateBetPage() {
    const {user, categories, products, productItems, players} = await fetchData();

    if (!user || user.role !== 'ADMIN') {
        redirect('/not-auth');
    }


    return (
        <Container className="flex flex-col my-10 w-[96%]">
            <Suspense fallback={<Loading/>}>
                <CreateBetForm3
                    user={user}
                    categories={categories}
                    products={products}
                    productItems={productItems}
                    players={players}
                    createBet3={clientCreateBet3}
                />
            </Suspense>
        </Container>
    );
}