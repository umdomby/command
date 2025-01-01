```tsx
export async function getMedals() {
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

    const result: any = {};

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
getMedals().then(console.log);


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

    for (const userId in result) {
        console.log(`User ${userId}: ${result[userId].gold} gold, ${result[userId].silver} silver, ${result[userId].bronze} bronze`);
    }
}

countMedals();
```