"use server";
import {prisma} from '@/prisma/prisma-client';
import {Container} from "@/components/container";
import {TURNIR} from "@/components/TURNIR";

export default async function Turnir() {

    const users = await prisma.user.findMany({
        orderBy: {
            points: 'desc', // Sort by points in descending order
        },
    });

    return (
        <Container className="flex flex-col my-10">
            <TURNIR users={users}/>
        </Container>
    )
}