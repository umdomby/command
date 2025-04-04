
# ACTIONS
# \\wsl$\Ubuntu\home\pi\Projects\next-pizza\app\actions.ts 21:36:40

```jsx
export async function updateUserInfo(body: Prisma.UserUpdateInput) {
    try {
        const currentUser = await getUserSession();

        if (!currentUser) {
            throw new Error('Пользователь не найден');
        }

        const findUser = await prisma.user.findFirst({
            where: {
                id: Number(currentUser.id),
            },
        });

        await prisma.user.update({
            where: {
                id: Number(currentUser.id),
            },
            data: {
                fullName: body.fullName,
                email: body.email,
                password: body.password ? hashSync(body.password as string, 10) : findUser?.password,
    },
    });
    } catch (err) {
        console.log('Error [UPDATE_USER]', err);
        throw err;
    }
}
```