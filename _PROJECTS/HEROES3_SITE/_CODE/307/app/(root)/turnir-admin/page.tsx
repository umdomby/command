"use server";
import {prisma} from '@/prisma/prisma-client';
import {Container} from "@/components/container";
import {TURNIR_ADMIN} from "@/components/TURNIR_ADMIN";

export default async function TurAdmin() {

    const users = await prisma.user.findMany({
        orderBy: {
            points: 'desc', // Sort by points in descending order
        },
    });

    return (
        <Container className="flex flex-col my-10">
            <TURNIR_ADMIN users={users}/>
        </Container>
    )
}