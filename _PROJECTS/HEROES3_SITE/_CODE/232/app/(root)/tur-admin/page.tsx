"use server";
import {prisma} from '@/prisma/prisma-client';
import {Container} from "@/components/container";
import {TUR_ADMIN} from "@/components/TUR_ADMIN";

export default async function TurAdmin() {

    const users = await prisma.user.findMany({
        orderBy: {
            points: 'desc', // Sort by points in descending order
        },
    });

    return (
        <Container className="flex flex-col my-10">
            <TUR_ADMIN users={users}/>
        </Container>
    )
}