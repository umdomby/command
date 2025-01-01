```
напиши функцию, которая возвращала из prisma model "gameRecords" получала медали (золото, серебро, бронзу) и "userId"  
для каждого "productItemId", где по полю "timestate" по убыванию времени. самое минимально - это золото, второе 
минимальное серебро, третье минимальное бронза для каждого "productItemId", где productid = 1 categoryId = 1 

код работает его не изменяй, допиши код, где в консоли будет выводится для каждого userId количество золотых серебрянных и бронзовых медалей
```
```tsx
import { Container } from '@/components/container';
import { prisma } from '@/prisma/prisma-client';
import { notFound } from 'next/navigation';

import React, {Suspense} from "react";
import Loading from "@/app/(root)/loading";
import { InferGetServerSidePropsType } from 'next';
import {GameRecord_MEDAL} from "@/components/gameRecords_MEDAL";
import Link from "next/link";
import {Button} from "@/components/ui";
export const dynamic = 'force-dynamic'

export default async function Medal(){

    async function getMedals() {
        const medals = await prisma.gameRecords.findMany({
            where: {
                categoryId: 1,
                productId: 1,
            },
            orderBy: {
                timestate: 'asc',
            },
            select: {
                timestate: true,
                userId: true,
                productItemId: true,
            },
        });

        const result: any = [];

        for (const medal of medals) {
            if (!result[medal.productItemId]) {
                result[medal.productItemId] = {
                    gold: null,
                    silver: null,
                    bronze: null,
                };
            }

            if (!result[medal.productItemId].gold) {
                result[medal.productItemId].gold = medal;
            } else if (!result[medal.productItemId].silver || (result[medal.productItemId].silver.timestate < medal.timestate)) {
                result[medal.productItemId].bronze = result[medal.productItemId].silver;
                result[medal.productItemId].silver = medal;
            } else if (!result[medal.productItemId].bronze || (result[medal.productItemId].bronze.timestate < medal.timestate)) {
                result[medal.productItemId].bronze = medal;
            }
        }

        return result;
    }

    async function countMedals() {
        const medals = await getMedals();

        const result: any = {};

        for (const id in medals) {
            const medal = medals[id];

            if (medal.gold) {
                if (!result[medal.gold.userId]) {
                    result[medal.gold.userId] = {
                        gold: 0,
                        silver: 0,
                        bronze: 0,
                    };
                }
                result[medal.gold.userId].gold += 1;
            }

            if (medal.silver) {
                if (!result[medal.silver.userId]) {
                    result[medal.silver.userId] = {
                        gold: 0,
                        silver: 0,
                        bronze: 0,
                    };
                }
                result[medal.silver.userId].silver += 1;
            }

            if (medal.bronze) {
                if (!result[medal.bronze.userId]) {
                    result[medal.bronze.userId] = {
                        gold: 0,
                        silver: 0,
                        bronze: 0,
                    };
                }
                result[medal.bronze.userId].bronze += 1;
            }
        }

        const countMedalsArray =[];

        for (const userId in result) {
            //console.log(`User ${userId}: ${result[userId].gold} gold, ${result[userId].silver} silver, ${result[userId].bronze} bronze`);
            countMedalsArray.push(`User ${userId}: ${result[userId].gold} gold, ${result[userId].silver} silver, ${result[userId].bronze} bronze`);
        }
        return countMedalsArray;
    }
    // getMedals().then(console.log);
    // countMedals().then(console.log);


    return (
        <Container className="flex flex-col my-10">
            <Suspense fallback={<Loading />}>
                <GameRecord_MEDAL medals={await getMedals()} countMedals={await countMedals()} />
            </Suspense>
        </Container>
    );
}
```
