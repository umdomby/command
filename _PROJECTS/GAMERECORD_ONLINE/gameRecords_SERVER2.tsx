import { Container } from '@/components/container';
import { prisma } from '@/prisma/prisma-client';
import { notFound } from 'next/navigation';
import {GameRecord_CLIENT} from "@/components/gameRecords_CLIENT";
import React, {Suspense} from "react";
import Loading from "@/app/(root)/loading";

export default async function GameRecords_SERVER() {

    const gameRecords = await prisma.gameRecords.findMany({
        include: {
            user: true,
            product: true,
            productItem: true,
            category: true,
        },
    });

    if (!gameRecords) {
        return notFound();
    }

    return (
        <Container className="flex flex-col my-10">
            <Suspense fallback={<Loading />}>
                <GameRecord_CLIENT gameRecords={gameRecords} />
            </Suspense>
        </Container>
    );
}
