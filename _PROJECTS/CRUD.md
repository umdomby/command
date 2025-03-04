framework: Next "next": "^15.1.4",  "prisma": "^6.4.0",


model
model TurnirBet {
id           Int        @id @default(autoincrement())
bet          Bet        @relation(fields: [betId], references: [id])
betId        Int
bet3         Bet3       @relation(fields: [bet3Id], references: [id])
bet3Id       Int
bet4         Bet4       @relation(fields: [bet4Id], references: [id])
bet4Id       Int
betCLOSED    BetCLOSED  @relation(fields: [betCLOSEDId], references: [id])
betCLOSEDId  Int
betCLOSED3   BetCLOSED3 @relation(fields: [betCLOSED3Id], references: [id])
betCLOSED3Id Int
betCLOSED4   BetCLOSED4 @relation(fields: [betCLOSED4Id], references: [id])
betCLOSED4Id Int
turnirName   String
createdAt    DateTime   @default(now())
updatedAt    DateTime   @updatedAt
}


server page
"use server";
import { redirect } from 'next/navigation';
import {getUserSession} from "@/components/lib/get-user-session";
import {prisma} from "@/prisma/prisma-client";
import Loading from "@/app/(root)/loading";
import React, {Suspense} from "react";
import {Container} from "@/components/container";
export default async function AddPlayerPage() {
const session = await getUserSession();
if (!session) {
return redirect('/');
}
const user = await prisma.user.findFirst({ where: { id: Number(session?.id) } });
if (user?.role !== 'ADMIN') {
return redirect('/');
}
const turnirBet = await prisma.turnirBet.findMany();
return (
<Container className="w-[96%]">
<Suspense fallback={<Loading />}>
</Suspense>
</Container>
);
}


next 15 actions

export async function adminTrurnirBetPage(){
const currentUser = await getUserSession();


if (!currentUser) {
throw new Error('Пользователь не найден');
}


// Проверяем, что пользователь является администратором
if (currentUser.role !== 'ADMIN') {
throw new Error('У вас нет прав для выполнения этой операции');
}

//создать
//удалить
//обновить
//prisma

}


создай в серверной странице	- список turnirName в Input, напротив каждого Input кнопку сохранить (для редактирования)
Input и кнопку создания turnirName
создай все в одной функции добавления удаления и редактирования adminTrurnirBetPage . чтобы был ответ от сервера о успешных выполненных операций
отвечай на русском, комментарии пиши на русском


