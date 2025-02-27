"use server";
import {prisma} from '@/prisma/prisma-client';
import {Container} from "@/components/container";
import {TURNIR} from "@/components/TURNIR";
import {getUserSession} from "@/components/lib/get-user-session";
import {redirect} from "next/navigation";

export default async function TurnirPage() {

    const session = await getUserSession();

    if (!session) {
        return redirect('/');
    }

    const user = await prisma.user.findFirst({ where: { id: Number(session?.id) } });

    if (!user) {
        return redirect('/');
    }

    return (
        <Container className="flex flex-col my-10">
            <TURNIR user={user}/>
        </Container>
    )
}