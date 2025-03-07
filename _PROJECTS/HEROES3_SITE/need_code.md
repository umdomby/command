"next": "^15.2.0",   "prisma": "^6.4.1",  postgres , shadcn
```js
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {Table, TableBody, TableCell, TableRow} from "@/components/ui/table";
import Link from "next/link";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog"; // Импортируем компоненты диалогового окна
import {placeBet} from "@/app/actions";
```


отвечай на русском, не удаляй и не изменяй комментарии,
SELECT setval(pg_get_serial_sequence('"User"', 'id'), coalesce(max(id)+1, 1), false) FROM "User";
SELECT setval(pg_get_serial_sequence('"ProductItem"', 'id'), coalesce(max(id)+1, 1), false) FROM "ProductItem";
SELECT setval(pg_get_serial_sequence('"Player"', 'id'), coalesce(max(id)+1, 1), false) FROM "Player";



SELECT setval(pg_get_serial_sequence('"Bet3"', 'id'), coalesce(max(id)+1, 1), false) FROM "Bet3";
SELECT setval(pg_get_serial_sequence('"BetParticipant3"', 'id'), coalesce(max(id)+1, 1), false) FROM "BetParticipant3";


npx prisma generate
npx prisma migrate dev --name init
npx prisma migrate dev
npx prisma migrate reset

npx prisma migrate dev --name add_is_processing_field

{new Date(exchangeRates.updatedAt).toLocaleString()}

{Math.floor(variable * 100) / 100}


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


```js
import { createClient } from 'redis';
import { NextResponse } from 'next/server';

const redis = await createClient().connect();

export const POST = async () => {
// Fetch data from Redis
const result = await redis.get("item");

// Return the result in the response
return new NextResponse(JSON.stringify({ result }), { status: 200 });
};
```