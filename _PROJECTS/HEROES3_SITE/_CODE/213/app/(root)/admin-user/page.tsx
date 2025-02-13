"use server";
import {prisma} from '@/prisma/prisma-client';
import {Container} from "@/components/container";
import {ADMIN_USER} from "@/components/ADMIN_USER";

export default async function AdminUser() {

    const users = await prisma.user.findMany({
        orderBy: {
            points: 'desc', // Sort by points in descending order
        },
    });

    return (
        <Container className="flex flex-col my-10">
            <ADMIN_USER users={users}/>
        </Container>
    )
}