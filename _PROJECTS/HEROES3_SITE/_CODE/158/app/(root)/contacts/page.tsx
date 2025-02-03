"use server";
import { Container } from '@/components/container';
import { prisma } from '@/prisma/prisma-client';
import { redirect } from 'next/navigation';
import React, { Suspense } from "react";
import Loading from "@/app/(root)/loading";
import { getUserSession } from "@/components/lib/get-user-session";
import { BUY_PAY_POINTS } from "@/components/BUY_PAY_POINTS";
import {CONTACTS} from "@/components/CONTACTS";

export default async function ContactsPage() {


    return (
        <Container className="w-[100%]">
            <Suspense fallback={<Loading />}>
                <CONTACTS/>
            </Suspense>
        </Container>
    );
}
