"use server";
import {prisma} from '@/prisma/prisma-client';
import {Container} from "@/components/container";
import {STATISTICS} from "@/components/STATISTICS";

export default async function Statistics() {

    const users = await prisma.user.findMany({
        orderBy: {
            points: 'desc', // Sort by points in descending order
        },
    });

    return (
        <Container className="flex flex-col my-10">
            <STATISTICS users={users}/>
        </Container>
    )
}