```tsx
export async function updateCategoryAdd(data) {
    try {

        const findCategory = await prisma.category.findFirst({
            where: {
                id: Number(data.id),
            },
        });

        if (!findCategory) {
            throw new Error('Пользователь не найден');
        }

        await prisma.category.update({
            where: {
                id: Number(data.id),
            },
            data: {
                name: data.name,
            },
        });
    } catch (err) {
        console.log('Error [UPDATE_CATEGORY]', err);
        throw err;
    }
}
```