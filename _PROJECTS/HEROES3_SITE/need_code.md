
особенности проекта: Next "next": "^15.1.4",  "prisma": "^6.4.0",  shadcn , zod
import { prisma } from '@/prisma/prisma-client';

"next-auth": "^4.24.11",  "zod": "^3.24.1", ui.shadcn.com 'next/form'
примени стили interface Props { className?: string; }   = ({className}) используй таблицы кнопки inputs shadcn чтобы все выглядело очень круто и культурно

{Math.floor(user.points * 100) / 100}
npx prisma migrate dev --name add_bank_details
.replace(',', '.')
мне нужно вводить положительное число с плавющей точкой или запятой, разреши мне вводить одну точку или одну запятую
числа должны быть положительными, целыми, нельзя вводить первый ноль, первый ноль должен удаляться
<Input
type="text"
value={detail.price.toString().replace('.', ',')}
onInput={(e) => {
let value = e.currentTarget.value;
if (isValidNumberInput(value) || value === '') {
handlePriceChangeForBuy(index, value);
} else {
e.currentTarget.value = detail.price.toString().replace('.', ',');
}
}}
placeholder="Цена"
className="ml-2"
/>

1e-7 так не отображать, отображать как есть. Можно вводить значения такого плана 0,000000012 , при вводе точки - точка заменялась на запятую
не могу вводить запятую не могу вводить точку, сделай так чтобы я мог вводить запятую, а точка вводилась как запятая
сделай так чтобы я могу удалять все и даже нулевой символов в Input сделай это преоритетом

можно вместо Select использовать выпадающий лист, чтобы с егоданных заносить значения в
const [selectedBankDetailsForBuy, setSelectedBankDetailsForBuy] = useState<any[]>([]); // Выбранные банковские реквизиты для покупки
const [selectedBankDetailsForSell, setSelectedBankDetailsForSell] = useState<any[]>([]); // Выбранные банковские реквизиты для продажи

так же в selects нужно добавить кнопки, добавить все удалить все

<AccordionTrigger disabled={order.orderP2PUser1Id === user.id}>

disabled={order.orderP2PUser1Id === user.id}>
{order.orderP2PBuySell === 'SELL' && order.orderP2PUser1Id === user.id && (

                            {order.orderP2PBuySell === 'SELL' &&  order.orderP2PUser1Id !== user.id && (
                                <Button className="ml-3 h-6" onClick={() => handleConcludeDealBuy(order)}
                                        disabled={order.orderP2PUser1Id === user.id}>
                                    Заключить сделку покупки
                                </Button>
                            )}

    // Проверка, можно ли создать заявку
    const isCreateOrderDisabled = (points: number, selectedDetails: any[]) => {
        return points < 30 || selectedDetails.length === 0 || selectedDetails.some(detail => detail.price <= 0);
    };
                    {/*<label className="flex items-center mb-2">*/}
                    {/*    <input*/}
                    {/*        type="checkbox"*/}
                    {/*        checked={allowPartialBuy}*/}
                    {/*        onChange={() => setAllowPartialBuy(!allowPartialBuy)}*/}
                    {/*        className="mr-2"*/}
                    {/*    />*/}
                    {/*    Покупать частями*/}
                    {/*</label>*/}
                    {/*<label className="flex items-center mb-2">*/}
                    {/*    <input*/}
                    {/*        type="checkbox"*/}
                    {/*        checked={allowPartialSell}*/}
                    {/*        onChange={() => setAllowPartialSell(!allowPartialSell)}*/}
                    {/*        className="mr-2"*/}
                    {/*    />*/}
                    {/*    Продавать частями*/}
                    {/*</label>*/}


// в заявке ограничение максимальных поинтов, и в редактировании цены в профиле за одну

className={order.orderP2PUser1Id === user.id ? 'bg-gray-600' : 'bg-gray-500'}

revalidatePath('/order-p2p-pending');

не удаляй и не изменяй комментарии , а также их не добавляй где это не требуется


SELECT setval(pg_get_serial_sequence('"Bet3"', 'id'), coalesce(max(id)+1, 1), false) FROM "Bet3";
SELECT setval(pg_get_serial_sequence('"BetParticipant3"', 'id'), coalesce(max(id)+1, 1), false) FROM "BetParticipant3";
SELECT setval(pg_get_serial_sequence('"Player"', 'id'), coalesce(max(id)+1, 1), false) FROM "Player";

SELECT setval(pg_get_serial_sequence('"User"', 'id'), coalesce(max(id)+1, 1), false) FROM "User";

npx prisma generate
npx prisma migrate dev --name init
npx prisma migrate dev
npx prisma migrate reset

{Math.floor(variable * 100) / 100}

function areNumbersEqual(num1: number, num2: number): boolean {
return Math.abs(num1 - num2) < Number.EPSILON;
} //точное сравнение чисел
переделай ставки на 3 игрока по аналогии как сделано на 2 игрока
// Функция для закрытия ставки на 3 игрока исправь код на три игрока, по аналогичной функции которую ты сделал для двухи игроков с справедливым распределением

```
catch (error) {
        if (error === null || error === undefined) {
            console.error('Ошибка при регистрации игрока: Неизвестная ошибка (error is null или undefined)');
        } else if (error instanceof Error) {
            console.error('Ошибка при регистрации игрока:', error.message);
            console.error('Стек ошибки:', error.stack);
        } else {
            console.error('Ошибка при регистрации игрока:', error);
        }

        throw new Error('Не удалось зарегистрироваться как игрок');
    }
```

