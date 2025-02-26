```
catch (error) {
        if (error === null || error === undefined) {
            console.error('error === null || error === undefined');
        } else if (error instanceof Error) {
            console.error('Ошибка :', error.message);
            console.error('Стек ошибки:', error.stack);
        } else {
            console.error('Ошибка else:', error);
        }
        throw new Error('throw new Error');
    }
```



# ====================
```js server
export async function createBuyOrder(points: number, bankDetails: any[], allowPartial: boolean) {
    try {
        const currentUser = await getUserSession();
        if (!currentUser) {
            throw new Error('Пользователь не найден');
        }

        const existingOpenOrder = await prisma.orderP2P.findFirst({
            where: {
                orderP2PUser1Id: Number(currentUser.id),
                orderP2PStatus: 'OPEN',
                orderP2PBuySell: 'BUY',
            },
        });

        if (existingOpenOrder) {
            throw new Error('Заявку на покупку можно создать только один раз');
        }

        if (points < 30 || points > 100000) {
            throw new Error('Количество points должно быть от 30 до 100000');
        }

        const newOrder = await prisma.orderP2P.create({
            data: {
                orderP2PUser1Id: Number(currentUser.id),
                orderP2PBuySell: 'BUY',
                orderP2PPoints: points,
                orderP2PPart: allowPartial,
                orderBankDetails: bankDetails,
                orderP2PStatus: 'OPEN',
            },
        });

        revalidatePath('/order-p2p');
        return newOrder;
    } catch (error) {
        console.error('Ошибка при создании заявки на покупку:', error);
        // Передаем оригинальное сообщение об ошибке
        throw error;
    }
}


```

```js server
    const [errorMessage, setErrorMessage] = useState<string | null>(null);// о уже созданном Buy
{errorMessage && (
    <div className="relative">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 p-2 mb-4 rounded mt-4 bg-red-500 text-white">
            {errorMessage}
        </div>
    </div>
)}
const handleCreateBuyOrder = async () => {
    if (buyPoints > 100000) {
        alert('Вы не можете купить более 100,000 points');
        return;
    }
    try {
        const result = await createBuyOrder(buyPoints, selectedBankDetailsForBuy, allowPartialBuy);
        if (result.success) {
            setBuyOrderSuccess(true);
            setSelectedBankDetailsForBuy([]); // Очищаем выбранные банковские реквизиты
            setTimeout(() => setBuyOrderSuccess(false), 3000); // Скрыть сообщение через 3 секунды
        } else {
            if (result.message) {
                setErrorMessage(result.message); // Устанавливаем сообщение об ошибке
            } else {
                setErrorMessage('Неизвестная ошибка'); // Устанавливаем сообщение по умолчанию
            }
            setTimeout(() => setErrorMessage(null), 3000); // Скрыть сообщение через 3 секунды
        }
    } catch (error) {
        console.error('Ошибка при создании заявки на покупку:', error);
        alert('Не удалось создать заявку на покупку');
    }
};

```