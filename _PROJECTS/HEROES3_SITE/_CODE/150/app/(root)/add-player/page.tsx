import { redirect } from 'next/navigation';
import { getSession } from 'next-auth/react';
import AddEditPlayer from "@/components/addEditPlayer";
import {getUserSession} from "@/components/lib/get-user-session";
import {prisma} from "@/prisma/prisma-client";


export default async function AddPlayerPage() {
    const session = await getUserSession();

    if (!session) {
        return redirect('/not-auth');
    }

    const user = await prisma.user.findFirst({ where: { id: Number(session?.id) } });

    if (user?.role !== 'ADMIN') {
        return redirect('/');
    }

    return <AddEditPlayer />;
}