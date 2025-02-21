const [isDialogOpen, setIsDialogOpen] = useState(false);
const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
const [errorMessage, setErrorMessage] = useState<string | null>(null);

const onSubmit = async (values: z.infer<typeof createBetSchema>) => {
    try {
        await gameUserBetCreate({
            ...values,
            userId: user.id,
        });
        form.reset();
        setIsDialogOpen(true);
    } catch (error) {
        if (error instanceof Error) {
            setErrorMessage(error.message);
            setIsErrorDialogOpen(true);
        } else {
            setErrorMessage("Произошла неизвестная ошибка");
            setIsErrorDialogOpen(true);
        }
    }
};

<Dialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
    <DialogContent>
        <DialogHeader>
            <DialogTitle>Ошибка</DialogTitle>
            <DialogDescription>
                {errorMessage}
            </DialogDescription>
        </DialogHeader>
        <Button onClick={() => setIsErrorDialogOpen(false)}>Закрыть</Button>
    </DialogContent>
</Dialog>

// try {
//     const currentUser = await getUserSession();
//
//     if (!currentUser) {
//         throw new Error('Пользователь не найден');
//     }
//
//     const existingGame = await prisma.gameUserBet.findFirst({
//         where: {
//             gameUserBet1Id: Number(currentUser.id),
//             statusUserBet: {
//                 in: ['OPEN', 'START']
//             }
//         }
//     });
//
//     if (existingGame) {
//         throw new Error('Открытое событие можно создать только один раз');
//     }
//
//     const newBet = await prisma.gameUserBet.create({
//         data: {
//             gameUserBet1Id: gameData.userId,
//             betUser1: gameData.initBetPlayer1,
//             gameUserBetDetails: gameData.gameUserBetDetails,
//             categoryId: gameData.categoryId,
//             productId: gameData.productId,
//             productItemId: gameData.productItemId,
//             gameUserBetOpen: gameData.gameUserBetOpen,
//             statusUserBet: 'OPEN',
//         },
//     });
//     return newBet;
// } catch (error) {
//     if (error instanceof Error) {
//         console.error("Открытое событие уже создано:", error.message);
//         throw error; // Повторно выбрасываем ту же ошибку
//     } else {
//         console.error("Неизвестная ошибка при создании ставки:", error);
//         throw new Error("Произошла неизвестная ошибка");
//     }
// }