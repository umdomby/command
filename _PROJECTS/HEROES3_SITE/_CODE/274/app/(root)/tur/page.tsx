"use server";
import {prisma} from '@/prisma/prisma-client';
import {Container} from "@/components/container";
import {TUR} from "@/components/TUR";

export default async function Tur() {

    const users = await prisma.user.findMany({
        orderBy: {
            points: 'desc', // Sort by points in descending order
        },
    });

    return (
        <Container className="flex flex-col my-10">
            <TUR users={users}/>
        </Container>
    )
}