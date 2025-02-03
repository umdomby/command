"use server";
import { redirect } from 'next/navigation';
import {getUserSession} from "@/components/lib/get-user-session";
import {prisma} from "@/prisma/prisma-client";



export default async function AddPlayerPage() {
    const session = await getUserSession();

    if (session) {
        return redirect('/');
    }


    return redirect('/');
}