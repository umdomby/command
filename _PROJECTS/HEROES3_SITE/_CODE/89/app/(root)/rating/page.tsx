"use server";
import {prisma} from '@/prisma/prisma-client';
import {Rating} from '@/components/rating';
import {getUserSession} from '@/components/lib/get-user-session';
import {redirect} from 'next/navigation';
import {Container} from "@/components/container";

export default async function ProfilePage() {
    const session = await getUserSession();

    if (!session) {
        return redirect('/not-auth');
    }

    const users = await prisma.user.findMany({
        orderBy: {
            points: 'desc', // Sort by points in descending order
        },
    });

    if (!users) {
        return redirect('/not-auth');
    }

    return (
        <Container className="flex flex-col my-10">
            <Rating users={users}/>
        </Container>
    )
}