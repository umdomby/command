"use server";
import {prisma} from '@/prisma/prisma-client';
import {Rating} from '@/components/rating';
import {Container} from "@/components/container";

export default async function ProfilePage() {

    const users = await prisma.user.findMany({
        orderBy: {
            points: 'desc', // Sort by points in descending order
        },
    });

    return (
        <Container className="flex flex-col my-10">
            <Rating users={users}/>
        </Container>
    )
}