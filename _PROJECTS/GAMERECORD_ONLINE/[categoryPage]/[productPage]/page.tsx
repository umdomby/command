import {Container} from '@/components/container';
import {prisma} from '@/prisma/prisma-client';

import React, {Suspense} from "react";
import Loading from "@/app/(root)/loading";
import {GameRecord_MEDAL} from "@/components/gameRecords_MEDAL";

export const dynamic = 'force-dynamic'


export default async function ProductPage({
                                              params,
                                          }: {
    params: Promise<{ categoryPage: string,  productPage : string}>;
}) {
    const { categoryPage, productPage } = await params;

    const category = await prisma.category.findFirst({
        where: {
            name: categoryPage.replaceAll("-"," "),
        },
        select: {
            id: true,
        },
    });

    const product = await prisma.product.findFirst({
        where: {
            name: productPage.replaceAll("-"," "),
        },
        select: {
            id: true,
        },
    });

    async function getMedals() {
        const medals = await prisma.gameRecords.findMany({
            where: {
                productId: product?.id,
                categoryId: category?.id,
            },
            orderBy: {
                timestate: 'asc',
            },
            select: {
                timestate: true,
                productItem: {
                    select: {
                        name: true,
                        img: true, // Убедитесь, что это поле включено
                    },
                },
                user: {
                    select: {
                        fullName: true,
                    },
                },
                video: true,
                img: true,
                carModel: true,
            },
        });
        // console.log(category);
        // console.log(product);
        // console.log(medals);
        // Группируем медали по productItem.name
        const groupedMedals: Record<string, any[]> = {};
        for (const medal of medals) {
            const productName = medal.productItem.name;
            if (!groupedMedals[productName]) {
                groupedMedals[productName] = [];
            }
            groupedMedals[productName].push(medal);
        }

        // Присваиваем медали для каждого продукта
        const result = Object.entries(groupedMedals).map(([productName, medals]) => {
            // Сортируем медали по timestate
            const sortedMedals = medals.sort((a, b) => a.timestate.localeCompare(b.timestate));

            // Присваиваем золото, серебро и бронзу
            const gold = sortedMedals[0];
            const silver = sortedMedals[1];
            const bronze = sortedMedals[2];

            // Проверяем, есть ли платина (один пользователь получил все три медали)
            const platinum =
                gold?.user.fullName === silver?.user.fullName &&
                silver?.user.fullName === bronze?.user.fullName
                    ? {
                        userName: gold.user.fullName,
                        timestate: '00:00:00.000',
                        video: '',
                        img: '',
                        carModel: null,
                    }
                    : null;

            return {
                productName,
                productImg: medals[0].productItem.img, // Добавляем поле img из productItem
                gold: gold ? { ...gold, userName: gold.user.fullName } : null,
                silver: silver ? { ...silver, userName: silver.user.fullName } : null,
                bronze: bronze ? { ...bronze, userName: bronze.user.fullName } : null,
                platinum,
            };
        });

        // console.log(result)
        return result;
    }

    async function countMedals() {
        const medals = await getMedals();

        const medalCounts = medals.reduce<Record<string, {
            gold: number,
            silver: number,
            bronze: number,
            platinum: number
        }>>((acc, medal) => {
            const goldUser = medal.gold?.userName;
            const silverUser = medal.silver?.userName;
            const bronzeUser = medal.bronze?.userName;
            const platinumUser = medal.platinum?.userName;

            if (goldUser) {
                if (!acc[goldUser]) acc[goldUser] = { gold: 0, silver: 0, bronze: 0, platinum: 0 };
                acc[goldUser].gold += 1;
            }
            if (silverUser) {
                if (!acc[silverUser]) acc[silverUser] = { gold: 0, silver: 0, bronze: 0, platinum: 0 };
                acc[silverUser].silver += 1;
            }
            if (bronzeUser) {
                if (!acc[bronzeUser]) acc[bronzeUser] = { gold: 0, silver: 0, bronze: 0, platinum: 0 };
                acc[bronzeUser].bronze += 1;
            }
            if (platinumUser) {
                if (!acc[platinumUser]) acc[platinumUser] = { gold: 0, silver: 0, bronze: 0, platinum: 0 };
                acc[platinumUser].platinum += 1;
            }

            return acc;
        }, {});

        return Object.entries(medalCounts)
            .map(([userName, counts]) => ({
                userName,
                ...counts,
            }))
            .sort((a, b) => b.gold - a.gold);
    }

    return (
        <Container className="flex flex-col my-10">
            <Suspense fallback={<Loading/>}>
                <GameRecord_MEDAL medals={await getMedals()} countMedals={await countMedals()} categoryPage={categoryPage} productPage={productPage}/>
            </Suspense>
        </Container>
    );
}