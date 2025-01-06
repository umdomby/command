import { Container } from '@/components/container';
import { prisma } from '@/prisma/prisma-client';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import Loading from '@/app/(root)/loading';
import { GameRecord_MEDAL } from '@/components/gameRecords_MEDAL';
import { Category, CarModel, GameRecords, Product, ProductItem, User } from '@prisma/client';

interface Medal {
    productName: string;
    productImg: string | null;
    gold: (GameRecords & { userName: string | null }) | null;
    silver: (GameRecords & { userName: string | null }) | null;
    bronze: (GameRecords & { userName: string | null }) | null;
    platinum: (GameRecords & { userName: string | null }) | null;
}

interface MedalCount {
    userName: string;
    gold: number;
    silver: number;
    bronze: number;
    platinum: number;
}

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: Promise<{ categoryPage: string; productPage: string }> }) {
    const { categoryPage, productPage } = await params;

    const category = await prisma.category.findFirst({
        where: { name: categoryPage.replace(/-/g, ' ') },
        select: { id: true },
    });

    const product = await prisma.product.findFirst({
        where: { name: productPage.replace(/-/g, ' ') },
        select: { id: true },
    });

    if (!category || !product) {
        return notFound();
    }

    const medals: (GameRecords & {
        productItem: Pick<ProductItem, 'name' | 'img'>;
        user: Pick<User, 'fullName'>;
        carModel: CarModel | null;
    })[] = await prisma.gameRecords.findMany({
        where: { productId: product.id, categoryId: category.id },
        orderBy: { timestate: 'asc' },
        include: {
            productItem: { select: { name: true, img: true } },
            user: { select: { fullName: true } },
            carModel: true,
        },
    });

    const groupedMedals: Record<string, (GameRecords & {
        productItem: Pick<ProductItem, 'name' | 'img'>
        user: Pick<User, 'fullName'>
        carModel: CarModel | null

    })[]> = medals.reduce((acc, medal) => {
        const productName = medal.productItem.name;
        acc[productName] = (acc[productName] || []).concat(medal);
        return acc;
    }, {});


    const result: Medal[] = Object.entries(groupedMedals).map(([productName, productMedals]) => {
        const sortedMedals = productMedals.sort((a, b) => a.timestate.localeCompare(b.timestate));

        const [gold, silver, bronze] = sortedMedals;

        const platinum = gold?.user.fullName === silver?.user.fullName && silver?.user.fullName === bronze?.user.fullName
            ? { ...gold, userName: gold.user.fullName }
            : null;

        return {
            productName,
            productImg: sortedMedals[0].productItem.img,
            gold: gold ? { ...gold, userName: gold.user.fullName } : null,
            silver: silver ? { ...silver, userName: silver.user.fullName } : null,
            bronze: bronze ? { ...bronze, userName: bronze.user.fullName } : null,
            platinum,
        };
    });


    const medalCounts: Record<string, MedalCount> = result.reduce((acc, medal) => {

        const incrementCount = (user: { userName: string | null } | null, medalType: keyof MedalCount) => {
            if (user?.userName) {
                acc[user.userName] = acc[user.userName] || { gold: 0, silver: 0, bronze: 0, platinum: 0 };
                acc[user.userName][medalType]++;
            }
        };

        incrementCount(medal.gold, 'gold');
        incrementCount(medal.silver, 'silver');
        incrementCount(medal.bronze, 'bronze');
        incrementCount(medal.platinum, 'platinum');

        return acc;
    }, {});

    const sortedMedalCounts: MedalCount[] = Object.entries(medalCounts)
        .map(([userName, counts]) => ({ userName, ...counts }))
        .sort((a, b) => b.gold - a.gold);


    return (
        <Container className="flex flex-col my-10">
            <Suspense fallback={<Loading />}>
                <GameRecord_MEDAL
                    medals={result}
                    countMedals={sortedMedalCounts}
                    categoryPage={categoryPage}
                    productPage={productPage}
                />
            </Suspense>
        </Container>
    );
}