
model Bet {
id              Int              @id @default(autoincrement())
player1         Player           @relation(name: "Player1Bets", fields: [player1Id], references: [id]) // ставки на игрока 1
player1Id       Int
player2         Player           @relation(name: "Player2Bets", fields: [player2Id], references: [id]) // ставки на игрока 2
player2Id       Int
initBetPlayer1  Float // инициализация ставок на игрока 1
initBetPlayer2  Float // инициализация ставок на игрока 2
totalBetPlayer1 Float // Сумма ставок на игрока 1
totalBetPlayer2 Float // Сумма ставок на игрока 2
oddsBetPlayer1  Float // Текущий коэффициент для игрока 1
oddsBetPlayer2  Float // Текущий коэффициент для игрока 2
maxBetPlayer1   Float // Максимальная сумма ставок на игрока 1
maxBetPlayer2   Float // Максимальная сумма ставок на игрока 2
overlapPlayer1  Float // не используем
overlapPlayer2  Float // не используем
margin          Float? // в placeBet = 0
totalBetAmount  Float            @default(0) // сумма всех ставок.
creator         User             @relation("BetsCreated", fields: [creatorId], references: [id]) // создатель события
creatorId       Int
status          BetStatus        @default(OPEN) // если статус = CLOSED то ставка закрыта, и перемещается в model BetCLOSED
participants    BetParticipant[]
turnirBetId     Int?
turnirBet       TurnirBet?       @relation(fields: [turnirBetId], references: [id])
categoryId      Int?
category        Category?        @relation(fields: [categoryId], references: [id])
productId       Int?
product         Product?         @relation(fields: [productId], references: [id])
productItemId   Int?
productItem     ProductItem?     @relation(fields: [productItemId], references: [id])
winnerId        Int? // кто победил PLAYER1 или PLAYER2
suspendedBet    Boolean          @default(false)
description     String?
isProcessing    Boolean          @default(false)
createdAt       DateTime         @default(now())
updatedAt       DateTime         @updatedAt
}


'use client';


import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
Form,
FormControl,
FormField,
FormItem,
FormLabel,
FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import React, { useState } from 'react';
import {Category, Product, ProductItem, User, Player, TurnirBet, Bet} from '@prisma/client';
import {clientCreateBet, editBet} from "@/app/actions";


const createBetSchema = z.object({
player1Id: z.coerce.number().int(),
player2Id: z.coerce.number().int(),
initBetPlayer1: z.number().int().min(10, { message: 'Минимальная ставка на игрока 1: 10 баллов' }),
initBetPlayer2: z.number().int().min(10, { message: 'Минимальная ставка на игрока 2: 10 баллов' }),
categoryId: z.coerce.number().int().nullable().optional(),
productId: z.coerce.number().int().nullable().optional(),
productItemId: z.coerce.number().int().nullable().optional(),
turnirBetId: z.coerce.number().int().nullable().optional(),
description: z.string().optional(),
});


interface Props {
user: User;
categories: Category[];
products: Product[];
productItems: ProductItem[];
players: Player[];
turnirBet: TurnirBet[]; // Добавлено свойство для TurnirBet
createBet: typeof clientCreateBet;
openBets: Bet[]; // Добавлено свойство для открытых ставок
}


export const CreateBetForm2: React.FC<Props> = ({ user, categories, products, productItems, players, turnirBet, createBet, openBets }) => {
const form = useForm<z.infer<typeof createBetSchema>>({
resolver: zodResolver(createBetSchema),
defaultValues: {
player1Id: players[0]?.id,
player2Id: players[1]?.id,
initBetPlayer1: 500,
initBetPlayer2: 500,
categoryId: undefined, // Установлено значение по умолчанию на undefined
productId: undefined,  // Установлено значение по умолчанию на undefined
productItemId: undefined, // Установлено значение по умолчанию на undefined
turnirBetId: undefined, // Установлено значение по умолчанию на undefined
description: 'online',
},
});


const [createBetError, setCreateBetError] = useState<string | null>(null);
const [showSuccessDialog, setShowSuccessDialog] = useState<boolean>(false);


const [openBetsState, setOpenBets] = useState<Bet[]>(openBets); // Состояние для открытых ставок


const handleEditBet = async (betId: number, field: string, value: any) => {
try {
await editBet(betId, { [field]: value });
// Обновить список ставок после редактирования
setOpenBets((prevBets) => prevBets.map(bet => bet.id === betId ? { ...bet, [field]: value } : bet));
} catch (error) {
console.error("Error editing bet:", error);
}
};


const onSubmit = async (values: z.infer<typeof createBetSchema>) => {
const { initBetPlayer1, initBetPlayer2 } = values;


       if (initBetPlayer1 < 100 || initBetPlayer2 < 100) {
           setCreateBetError('Минимальная ставка на каждого игрока: 100 баллов');
           return;
       }


       const totalBetAmount = initBetPlayer1 + initBetPlayer2;
       if (totalBetAmount > 1000) {
           setCreateBetError('Максимальная сумма ставок на обоих игроков: 1000 баллов');
           return;
       }


       const totalBets = initBetPlayer1 + initBetPlayer2;
       const oddsBetPlayer1 = totalBets / initBetPlayer1;
       const oddsBetPlayer2 = totalBets / initBetPlayer2;


       const betData = {
           ...values,
           status: 'OPEN',
           oddsBetPlayer1,
           oddsBetPlayer2,
           creatorId: user.id,
           totalBetPlayer1: initBetPlayer1,
           totalBetPlayer2: initBetPlayer2,
       };


       try {
           await createBet(betData);
           form.reset();
           setCreateBetError(null);
           setShowSuccessDialog(true);
           setTimeout(() => setShowSuccessDialog(false), 3000);
       } catch (error) {
           if (error instanceof Error) {
               setCreateBetError(error.message);
           } else {
               setCreateBetError("Произошла неизвестная ошибка");
           }
       }
};


return (
<div>
<div>Ваши баллы: {user?.points}</div>
<div style={{color: 'blue', marginBottom: '10px'}}>
Вы можете распределить только 1000 баллов между двумя игроками. Баллы не списываются с вашего баланса.
</div>
<Form {...form}>
<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
{/* Поле выбора Player 1 */}
<FormField
control={form.control}
name="player1Id"
render={({field}) => (
<FormItem>
<FormLabel>Player 1</FormLabel>
<FormControl>
<select {...field} value={field.value ?? ""}>
{players.map((player) => (
<option key={player.id} value={player.id}>{player.name}</option>
))}
</select>
</FormControl>
<FormMessage/>
</FormItem>
)}
/>


                   {/* Поле выбора Player 2 */}
                   <FormField
                       control={form.control}
                       name="player2Id"
                       render={({field}) => (
                           <FormItem>
                               <FormLabel>Player 2</FormLabel>
                               <FormControl>
                                   <select {...field} value={field.value ?? ""}>
                                       {players.map((player) => (
                                           <option key={player.id} value={player.id}>{player.name}</option>
                                       ))}
                                   </select>
                               </FormControl>
                               <FormMessage/>
                           </FormItem>
                       )}
                   />


                   {/* Поле для ставки на Player 1 */}
                   <FormField
                       control={form.control}
                       name="initBetPlayer1"
                       render={({field}) => (
                           <FormItem>
                               <FormLabel>Ставка на Player 1</FormLabel>
                               <FormControl>
                                   <Input
                                       placeholder="Сумма ставки"
                                       type="number"
                                       {...field}
                                       value={field.value === undefined ? '' : field.value}
                                       onChange={(e) => {
                                           const value = e.target.valueAsNumber;
                                           if (Number.isInteger(value)) {
                                               field.onChange(value);
                                           }
                                       }}
                                   />
                               </FormControl>
                               <FormMessage/>
                           </FormItem>
                       )}
                   />


                   {/* Поле для ставки на Player 2 */}
                   <FormField
                       control={form.control}
                       name="initBetPlayer2"
                       render={({field}) => (
                           <FormItem>
                               <FormLabel>Ставка на Player 2</FormLabel>
                               <FormControl>
                                   <Input
                                       placeholder="Сумма ставки"
                                       type="number"
                                       {...field}
                                       value={field.value === undefined ? '' : field.value}
                                       onChange={(e) => {
                                           const value = e.target.valueAsNumber;
                                           if (Number.isInteger(value)) {
                                               field.onChange(value);
                                           }
                                       }}
                                   />
                               </FormControl>
                               <FormMessage/>
                           </FormItem>
                       )}
                   />


                   {/* Поле выбора категории */}
                   <FormField
                       control={form.control}
                       name="categoryId"
                       render={({field}) => (
                           <FormItem>
                               <FormLabel>Map</FormLabel>
                               <FormControl>
                                   <select {...field} value={field.value ?? ""}>
                                       <option value="">None</option>
                                       {/* Опция для выбора null */}
                                       {categories.map((category) => (
                                           <option key={category.id} value={category.id}>{category.name}</option>
                                       ))}
                                   </select>
                               </FormControl>
                               <FormMessage/>
                           </FormItem>
                       )}
                   />


                   {/* Поле выбора продукта */}
                   <FormField
                       control={form.control}
                       name="productId"
                       render={({field}) => (
                           <FormItem>
                               <FormLabel>Size</FormLabel>
                               <FormControl>
                                   <select {...field} value={field.value ?? ""}>
                                       <option value="">None</option>
                                       {/* Опция для выбора null */}
                                       {products.map((product) => (
                                           <option key={product.id} value={product.id}>{product.name}</option>
                                       ))}
                                   </select>
                               </FormControl>
                               <FormMessage/>
                           </FormItem>
                       )}
                   />


                   {/* Поле выбора элемента продукта */}
                   <FormField
                       control={form.control}
                       name="productItemId"
                       render={({field}) => (
                           <FormItem>
                               <FormLabel>Product Item</FormLabel>
                               <FormControl>
                                   <select {...field} value={field.value ?? ""}>
                                       <option value="">None</option>
                                       {/* Опция для выбора null */}
                                       {productItems.map((productItem) => (
                                           <option key={productItem.id}
                                                   value={productItem.id}>{productItem.name}</option>
                                       ))}
                                   </select>
                               </FormControl>
                               <FormMessage/>
                           </FormItem>
                       )}
                   />


                   {/* Поле выбора TurnirBet */}


                   <FormField
                       control={form.control}
                       name="turnirBetId"
                       render={({field}) => (
                           <FormItem>
                               <FormLabel>Turnir Bet</FormLabel>
                               <FormControl>
                                   <select {...field} value={field.value ?? ""}>
                                       <option value="">None</option>
                                       {/* Опция для выбора null */}
                                       {turnirBet.map((turnirBet) => (
                                           <option key={turnirBet.id} value={turnirBet.id}>{turnirBet.name}</option>
                                       ))}
                                   </select>
                               </FormControl>
                               <FormMessage/>
                           </FormItem>
                       )}
                   />




                   {/* Поле для описания */}
                   <FormField
                       control={form.control}
                       name="description"
                       render={({field}) => (
                           <FormItem>
                               <FormLabel>Description</FormLabel>
                               <FormControl>
                                   <Input
                                       placeholder="Описание"
                                       type="text"
                                       {...field}
                                   />
                               </FormControl>
                               <FormMessage/>
                           </FormItem>
                       )}
                   />


                   {/* Кнопка отправки формы */}
                   <Button type="submit">Create Bet</Button>


                   {/* Отображение ошибки */}
                   {createBetError && <p style={{color: 'red'}}>{createBetError}</p>}
               </form>
           </Form>


           {/* Диалоговое окно успешного создания ставки */}
           {showSuccessDialog && (
               <div className="fixed inset-0 flex items-center justify-center bg-opacity-50">
                   <div className="p-4 rounded shadow-lg">
                       <p>Ставка успешно создана!</p>
                   </div>
               </div>
           )}




           <div>
               <h2>Открытые ставки</h2>
               {openBetsState.map(bet => (
                   <div key={bet.id} className="bet-item">
                       <div>
                           <span>Ставка ID: {bet.id}</span>
                           <select
                               value={bet.turnirBetId ?? ""}
                               onChange={(e) => handleEditBet(bet.id, 'turnirBetId', e.target.value)}
                           >
                               <option value="">None</option>
                               {turnirBet.map(tb => (
                                   <option key={tb.id} value={tb.id}>{tb.name}</option>
                               ))}
                           </select>
                           <select
                               value={bet.categoryId ?? ""}
                               onChange={(e) => handleEditBet(bet.id, 'categoryId', e.target.value)}
                           >
                               <option value="">None</option>
                               {categories.map(cat => (
                                   <option key={cat.id} value={cat.id}>{cat.name}</option>
                               ))}
                           </select>
                           <select
                               value={bet.productId ?? ""}
                               onChange={(e) => handleEditBet(bet.id, 'productId', e.target.value)}
                           >
                               <option value="">None</option>
                               {products.map(prod => (
                                   <option key={prod.id} value={prod.id}>{prod.name}</option>
                               ))}
                           </select>
                           <select
                               value={bet.productItemId ?? ""}
                               onChange={(e) => handleEditBet(bet.id, 'productItemId', e.target.value)}
                           >
                               <option value="">None</option>
                               {productItems.map(pi => (
                                   <option key={pi.id} value={pi.id}>{pi.name}</option>
                               ))}
                           </select>
                       </div>
                   </div>
               ))}
           </div>
       </div>
);
};


export async function editBet(betId: number, data: Partial<Bet>) {
const session = await getUserSession();
if (!session || session.role !== 'ADMIN') {
throw new Error('У вас нет прав для выполнения этой операции');
}
try {
await prisma.bet.update({
where: { id: Number(betId) },
data,
});
} catch (error) {
console.error("Error updating bet:", error);
throw new Error('Не удалось обновить ставку');
}
revalidatePath('/bet-create-2')
}


e used to find the original code. Cause: TypeError [ERR_INVALID_ARG_TYPE]: The "payload" argument must be of type object. Received null
Error updating bet: Error [PrismaClientValidationError]:
Invalid `prisma.bet.update()` invocation:


{
where: {
id: 26
},
data: {
turnirBetId: "17"
~~~~
}
}


Argument `turnirBetId`: Invalid value provided. Expected Int, NullableIntFieldUpdateOperationsInput or Null, provided String.        
at async editBet (app/actions.ts:2304:8)
2302 |     }
2303 |     try {
> 2304 |         await prisma.bet.update({
|        ^
2305 |             where: { id: Number(betId) },
2306 |             data,
2307 |         }); {
clientVersion: '6.4.1'
}
⨯ Error: Не удалось обновить ставку
at editBet (app/actions.ts:2310:14)
2308 |     } catch (error) {
2309 |         console.error("Error updating bet:", error);
> 2310 |         throw new Error('Не удалось обновить ставку');
|              ^
2311 |     }
2312 |     revalidatePath('/bet-create-2')
2313 | } {
digest: '2233472916'






отвечай на русском
model Bet {
 id              Int              @id @default(autoincrement())
 player1         Player           @relation(name: "Player1Bets", fields: [player1Id], references: [id]) // ставки на игрока 1
 player1Id       Int
 player2         Player           @relation(name: "Player2Bets", fields: [player2Id], references: [id]) // ставки на игрока 2
 player2Id       Int
 initBetPlayer1  Float // инициализация ставок на игрока 1
 initBetPlayer2  Float // инициализация ставок на игрока 2
 totalBetPlayer1 Float // Сумма ставок на игрока 1
 totalBetPlayer2 Float // Сумма ставок на игрока 2
 oddsBetPlayer1  Float // Текущий коэффициент для игрока 1
 oddsBetPlayer2  Float // Текущий коэффициент для игрока 2
 maxBetPlayer1   Float // Максимальная сумма ставок на игрока 1
 maxBetPlayer2   Float // Максимальная сумма ставок на игрока 2
 overlapPlayer1  Float // не используем
 overlapPlayer2  Float // не используем
 margin          Float? // в placeBet = 0
 totalBetAmount  Float            @default(0) // сумма всех ставок.
 creator         User             @relation("BetsCreated", fields: [creatorId], references: [id]) // создатель события
 creatorId       Int
 status          BetStatus        @default(OPEN) // если статус = CLOSED то ставка закрыта, и перемещается в model BetCLOSED
 participants    BetParticipant[]
 turnirBetId     Int?
 turnirBet       TurnirBet?       @relation(fields: [turnirBetId], references: [id])
 categoryId      Int?
 category        Category?        @relation(fields: [categoryId], references: [id])
 productId       Int?
 product         Product?         @relation(fields: [productId], references: [id])
 productItemId   Int?
 productItem     ProductItem?     @relation(fields: [productItemId], references: [id])
 winnerId        Int? // кто победил PLAYER1 или PLAYER2
 suspendedBet    Boolean          @default(false)
 description     String?
 isProcessing    Boolean          @default(false)
 createdAt       DateTime         @default(now())
 updatedAt       DateTime         @updatedAt
}


'use client';


import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
   Form,
   FormControl,
   FormField,
   FormItem,
   FormLabel,
   FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import React, { useState } from 'react';
import {Category, Product, ProductItem, User, Player, TurnirBet, Bet} from '@prisma/client';
import {clientCreateBet, editBet} from "@/app/actions";


const createBetSchema = z.object({
   player1Id: z.coerce.number().int(),
   player2Id: z.coerce.number().int(),
   initBetPlayer1: z.number().int().min(10, { message: 'Минимальная ставка на игрока 1: 10 баллов' }),
   initBetPlayer2: z.number().int().min(10, { message: 'Минимальная ставка на игрока 2: 10 баллов' }),
   categoryId: z.coerce.number().int().nullable().optional(),
   productId: z.coerce.number().int().nullable().optional(),
   productItemId: z.coerce.number().int().nullable().optional(),
   turnirBetId: z.coerce.number().int().nullable().optional(),
   description: z.string().optional(),
});


interface Props {
   user: User;
   categories: Category[];
   products: Product[];
   productItems: ProductItem[];
   players: Player[];
   turnirBet: TurnirBet[]; // Добавлено свойство для TurnirBet
   createBet: typeof clientCreateBet;
   openBets: Bet[]; // Добавлено свойство для открытых ставок
}


export const CreateBetForm2: React.FC<Props> = ({ user, categories, products, productItems, players, turnirBet, createBet, openBets }) => {
   const form = useForm<z.infer<typeof createBetSchema>>({
       resolver: zodResolver(createBetSchema),
       defaultValues: {
           player1Id: players[0]?.id,
           player2Id: players[1]?.id,
           initBetPlayer1: 500,
           initBetPlayer2: 500,
           categoryId: undefined, // Установлено значение по умолчанию на undefined
           productId: undefined,  // Установлено значение по умолчанию на undefined
           productItemId: undefined, // Установлено значение по умолчанию на undefined
           turnirBetId: undefined, // Установлено значение по умолчанию на undefined
           description: 'online',
       },
   });


   const [createBetError, setCreateBetError] = useState<string | null>(null);
   const [showSuccessDialog, setShowSuccessDialog] = useState<boolean>(false);


   const [openBetsState, setOpenBets] = useState<Bet[]>(openBets); // Состояние для открытых ставок


   const handleEditBet = async (betId: number, field: string, value: any) => {
       try {
           await editBet(betId, { [field]: value });
           // Обновить список ставок после редактирования
           setOpenBets((prevBets) => prevBets.map(bet => bet.id === betId ? { ...bet, [field]: value } : bet));
       } catch (error) {
           console.error("Error editing bet:", error);
       }
   };


   const onSubmit = async (values: z.infer<typeof createBetSchema>) => {
       const { initBetPlayer1, initBetPlayer2 } = values;


       if (initBetPlayer1 < 100 || initBetPlayer2 < 100) {
           setCreateBetError('Минимальная ставка на каждого игрока: 100 баллов');
           return;
       }


       const totalBetAmount = initBetPlayer1 + initBetPlayer2;
       if (totalBetAmount > 1000) {
           setCreateBetError('Максимальная сумма ставок на обоих игроков: 1000 баллов');
           return;
       }


       const totalBets = initBetPlayer1 + initBetPlayer2;
       const oddsBetPlayer1 = totalBets / initBetPlayer1;
       const oddsBetPlayer2 = totalBets / initBetPlayer2;


       const betData = {
           ...values,
           status: 'OPEN',
           oddsBetPlayer1,
           oddsBetPlayer2,
           creatorId: user.id,
           totalBetPlayer1: initBetPlayer1,
           totalBetPlayer2: initBetPlayer2,
       };


       try {
           await createBet(betData);
           form.reset();
           setCreateBetError(null);
           setShowSuccessDialog(true);
           setTimeout(() => setShowSuccessDialog(false), 3000);
       } catch (error) {
           if (error instanceof Error) {
               setCreateBetError(error.message);
           } else {
               setCreateBetError("Произошла неизвестная ошибка");
           }
       }
   };


   return (
       <div>
           <div>Ваши баллы: {user?.points}</div>
           <div style={{color: 'blue', marginBottom: '10px'}}>
               Вы можете распределить только 1000 баллов между двумя игроками. Баллы не списываются с вашего баланса.
           </div>
           <Form {...form}>
               <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                   {/* Поле выбора Player 1 */}
                   <FormField
                       control={form.control}
                       name="player1Id"
                       render={({field}) => (
                           <FormItem>
                               <FormLabel>Player 1</FormLabel>
                               <FormControl>
                                   <select {...field} value={field.value ?? ""}>
                                       {players.map((player) => (
                                           <option key={player.id} value={player.id}>{player.name}</option>
                                       ))}
                                   </select>
                               </FormControl>
                               <FormMessage/>
                           </FormItem>
                       )}
                   />


                   {/* Поле выбора Player 2 */}
                   <FormField
                       control={form.control}
                       name="player2Id"
                       render={({field}) => (
                           <FormItem>
                               <FormLabel>Player 2</FormLabel>
                               <FormControl>
                                   <select {...field} value={field.value ?? ""}>
                                       {players.map((player) => (
                                           <option key={player.id} value={player.id}>{player.name}</option>
                                       ))}
                                   </select>
                               </FormControl>
                               <FormMessage/>
                           </FormItem>
                       )}
                   />


                   {/* Поле для ставки на Player 1 */}
                   <FormField
                       control={form.control}
                       name="initBetPlayer1"
                       render={({field}) => (
                           <FormItem>
                               <FormLabel>Ставка на Player 1</FormLabel>
                               <FormControl>
                                   <Input
                                       placeholder="Сумма ставки"
                                       type="number"
                                       {...field}
                                       value={field.value === undefined ? '' : field.value}
                                       onChange={(e) => {
                                           const value = e.target.valueAsNumber;
                                           if (Number.isInteger(value)) {
                                               field.onChange(value);
                                           }
                                       }}
                                   />
                               </FormControl>
                               <FormMessage/>
                           </FormItem>
                       )}
                   />


                   {/* Поле для ставки на Player 2 */}
                   <FormField
                       control={form.control}
                       name="initBetPlayer2"
                       render={({field}) => (
                           <FormItem>
                               <FormLabel>Ставка на Player 2</FormLabel>
                               <FormControl>
                                   <Input
                                       placeholder="Сумма ставки"
                                       type="number"
                                       {...field}
                                       value={field.value === undefined ? '' : field.value}
                                       onChange={(e) => {
                                           const value = e.target.valueAsNumber;
                                           if (Number.isInteger(value)) {
                                               field.onChange(value);
                                           }
                                       }}
                                   />
                               </FormControl>
                               <FormMessage/>
                           </FormItem>
                       )}
                   />


                   {/* Поле выбора категории */}
                   <FormField
                       control={form.control}
                       name="categoryId"
                       render={({field}) => (
                           <FormItem>
                               <FormLabel>Map</FormLabel>
                               <FormControl>
                                   <select {...field} value={field.value ?? ""}>
                                       <option value="">None</option>
                                       {/* Опция для выбора null */}
                                       {categories.map((category) => (
                                           <option key={category.id} value={category.id}>{category.name}</option>
                                       ))}
                                   </select>
                               </FormControl>
                               <FormMessage/>
                           </FormItem>
                       )}
                   />


                   {/* Поле выбора продукта */}
                   <FormField
                       control={form.control}
                       name="productId"
                       render={({field}) => (
                           <FormItem>
                               <FormLabel>Size</FormLabel>
                               <FormControl>
                                   <select {...field} value={field.value ?? ""}>
                                       <option value="">None</option>
                                       {/* Опция для выбора null */}
                                       {products.map((product) => (
                                           <option key={product.id} value={product.id}>{product.name}</option>
                                       ))}
                                   </select>
                               </FormControl>
                               <FormMessage/>
                           </FormItem>
                       )}
                   />


                   {/* Поле выбора элемента продукта */}
                   <FormField
                       control={form.control}
                       name="productItemId"
                       render={({field}) => (
                           <FormItem>
                               <FormLabel>Product Item</FormLabel>
                               <FormControl>
                                   <select {...field} value={field.value ?? ""}>
                                       <option value="">None</option>
                                       {/* Опция для выбора null */}
                                       {productItems.map((productItem) => (
                                           <option key={productItem.id}
                                                   value={productItem.id}>{productItem.name}</option>
                                       ))}
                                   </select>
                               </FormControl>
                               <FormMessage/>
                           </FormItem>
                       )}
                   />


                   {/* Поле выбора TurnirBet */}


                   <FormField
                       control={form.control}
                       name="turnirBetId"
                       render={({field}) => (
                           <FormItem>
                               <FormLabel>Turnir Bet</FormLabel>
                               <FormControl>
                                   <select {...field} value={field.value ?? ""}>
                                       <option value="">None</option>
                                       {/* Опция для выбора null */}
                                       {turnirBet.map((turnirBet) => (
                                           <option key={turnirBet.id} value={turnirBet.id}>{turnirBet.name}</option>
                                       ))}
                                   </select>
                               </FormControl>
                               <FormMessage/>
                           </FormItem>
                       )}
                   />




                   {/* Поле для описания */}
                   <FormField
                       control={form.control}
                       name="description"
                       render={({field}) => (
                           <FormItem>
                               <FormLabel>Description</FormLabel>
                               <FormControl>
                                   <Input
                                       placeholder="Описание"
                                       type="text"
                                       {...field}
                                   />
                               </FormControl>
                               <FormMessage/>
                           </FormItem>
                       )}
                   />


                   {/* Кнопка отправки формы */}
                   <Button type="submit">Create Bet</Button>


                   {/* Отображение ошибки */}
                   {createBetError && <p style={{color: 'red'}}>{createBetError}</p>}
               </form>
           </Form>


           {/* Диалоговое окно успешного создания ставки */}
           {showSuccessDialog && (
               <div className="fixed inset-0 flex items-center justify-center bg-opacity-50">
                   <div className="p-4 rounded shadow-lg">
                       <p>Ставка успешно создана!</p>
                   </div>
               </div>
           )}




           <div>
               <h2>Открытые ставки</h2>
               {openBetsState.map(bet => (
                   <div key={bet.id} className="bet-item">
                       <div>
                           <span>Ставка ID: {bet.id}</span>
                           <select
                               value={bet.turnirBetId ?? ""}
                               onChange={(e) => handleEditBet(bet.id, 'turnirBetId', e.target.value)}
                           >
                               <option value="">None</option>
                               {turnirBet.map(tb => (
                                   <option key={tb.id} value={tb.id}>{tb.name}</option>
                               ))}
                           </select>
                           <select
                               value={bet.categoryId ?? ""}
                               onChange={(e) => handleEditBet(bet.id, 'categoryId', e.target.value)}
                           >
                               <option value="">None</option>
                               {categories.map(cat => (
                                   <option key={cat.id} value={cat.id}>{cat.name}</option>
                               ))}
                           </select>
                           <select
                               value={bet.productId ?? ""}
                               onChange={(e) => handleEditBet(bet.id, 'productId', e.target.value)}
                           >
                               <option value="">None</option>
                               {products.map(prod => (
                                   <option key={prod.id} value={prod.id}>{prod.name}</option>
                               ))}
                           </select>
                           <select
                               value={bet.productItemId ?? ""}
                               onChange={(e) => handleEditBet(bet.id, 'productItemId', e.target.value)}
                           >
                               <option value="">None</option>
                               {productItems.map(pi => (
                                   <option key={pi.id} value={pi.id}>{pi.name}</option>
                               ))}
                           </select>
                       </div>
                   </div>
               ))}
           </div>
       </div>
   );
};


export async function editBet(betId: number, data: Partial<Bet>) {
   const session = await getUserSession();
   if (!session || session.role !== 'ADMIN') {
       throw new Error('У вас нет прав для выполнения этой операции');
   }
   try {
       await prisma.bet.update({
           where: { id: Number(betId) },
           data,
       });
   } catch (error) {
       console.error("Error updating bet:", error);
       throw new Error('Не удалось обновить ставку');
   }
   revalidatePath('/bet-create-2')
}


e used to find the original code. Cause: TypeError [ERR_INVALID_ARG_TYPE]: The "payload" argument must be of type object. Received null
Error updating bet: Error [PrismaClientValidationError]: 
Invalid `prisma.bet.update()` invocation:


{
  where: {
    id: 26
  },
  data: {
    turnirBetId: "17"
                 ~~~~
  }
}


Argument `turnirBetId`: Invalid value provided. Expected Int, NullableIntFieldUpdateOperationsInput or Null, provided String.        
    at async editBet (app/actions.ts:2304:8)
  2302 |     }
  2303 |     try {
> 2304 |         await prisma.bet.update({
       |        ^
  2305 |             where: { id: Number(betId) },
  2306 |             data,
  2307 |         }); {
  clientVersion: '6.4.1'
}
 ⨯ Error: Не удалось обновить ставку
    at editBet (app/actions.ts:2310:14)
  2308 |     } catch (error) {
  2309 |         console.error("Error updating bet:", error);
> 2310 |         throw new Error('Не удалось обновить ставку');
       |              ^
  2311 |     }
  2312 |     revalidatePath('/bet-create-2')
  2313 | } {
  digest: '2233472916'






отвечай на русском
model Bet {
 id              Int              @id @default(autoincrement())
 player1         Player           @relation(name: "Player1Bets", fields: [player1Id], references: [id]) // ставки на игрока 1
 player1Id       Int
 player2         Player           @relation(name: "Player2Bets", fields: [player2Id], references: [id]) // ставки на игрока 2
 player2Id       Int
 initBetPlayer1  Float // инициализация ставок на игрока 1
 initBetPlayer2  Float // инициализация ставок на игрока 2
 totalBetPlayer1 Float // Сумма ставок на игрока 1
 totalBetPlayer2 Float // Сумма ставок на игрока 2
 oddsBetPlayer1  Float // Текущий коэффициент для игрока 1
 oddsBetPlayer2  Float // Текущий коэффициент для игрока 2
 maxBetPlayer1   Float // Максимальная сумма ставок на игрока 1
 maxBetPlayer2   Float // Максимальная сумма ставок на игрока 2
 overlapPlayer1  Float // не используем
 overlapPlayer2  Float // не используем
 margin          Float? // в placeBet = 0
 totalBetAmount  Float            @default(0) // сумма всех ставок.
 creator         User             @relation("BetsCreated", fields: [creatorId], references: [id]) // создатель события
 creatorId       Int
 status          BetStatus        @default(OPEN) // если статус = CLOSED то ставка закрыта, и перемещается в model BetCLOSED
 participants    BetParticipant[]
 turnirBetId     Int?
 turnirBet       TurnirBet?       @relation(fields: [turnirBetId], references: [id])
 categoryId      Int?
 category        Category?        @relation(fields: [categoryId], references: [id])
 productId       Int?
 product         Product?         @relation(fields: [productId], references: [id])
 productItemId   Int?
 productItem     ProductItem?     @relation(fields: [productItemId], references: [id])
 winnerId        Int? // кто победил PLAYER1 или PLAYER2
 suspendedBet    Boolean          @default(false)
 description     String?
 isProcessing    Boolean          @default(false)
 createdAt       DateTime         @default(now())
 updatedAt       DateTime         @updatedAt
}


'use client';


import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
   Form,
   FormControl,
   FormField,
   FormItem,
   FormLabel,
   FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import React, { useState } from 'react';
import {Category, Product, ProductItem, User, Player, TurnirBet, Bet} from '@prisma/client';
import {clientCreateBet, editBet} from "@/app/actions";


const createBetSchema = z.object({
   player1Id: z.coerce.number().int(),
   player2Id: z.coerce.number().int(),
   initBetPlayer1: z.number().int().min(10, { message: 'Минимальная ставка на игрока 1: 10 баллов' }),
   initBetPlayer2: z.number().int().min(10, { message: 'Минимальная ставка на игрока 2: 10 баллов' }),
   categoryId: z.coerce.number().int().nullable().optional(),
   productId: z.coerce.number().int().nullable().optional(),
   productItemId: z.coerce.number().int().nullable().optional(),
   turnirBetId: z.coerce.number().int().nullable().optional(),
   description: z.string().optional(),
});


interface Props {
   user: User;
   categories: Category[];
   products: Product[];
   productItems: ProductItem[];
   players: Player[];
   turnirBet: TurnirBet[]; // Добавлено свойство для TurnirBet
   createBet: typeof clientCreateBet;
   openBets: Bet[]; // Добавлено свойство для открытых ставок
}


export const CreateBetForm2: React.FC<Props> = ({ user, categories, products, productItems, players, turnirBet, createBet, openBets }) => {
   const form = useForm<z.infer<typeof createBetSchema>>({
       resolver: zodResolver(createBetSchema),
       defaultValues: {
           player1Id: players[0]?.id,
           player2Id: players[1]?.id,
           initBetPlayer1: 500,
           initBetPlayer2: 500,
           categoryId: undefined, // Установлено значение по умолчанию на undefined
           productId: undefined,  // Установлено значение по умолчанию на undefined
           productItemId: undefined, // Установлено значение по умолчанию на undefined
           turnirBetId: undefined, // Установлено значение по умолчанию на undefined
           description: 'online',
       },
   });


   const [createBetError, setCreateBetError] = useState<string | null>(null);
   const [showSuccessDialog, setShowSuccessDialog] = useState<boolean>(false);


   const [openBetsState, setOpenBets] = useState<Bet[]>(openBets); // Состояние для открытых ставок


   const handleEditBet = async (betId: number, field: string, value: any) => {
       try {
           await editBet(betId, { [field]: value });
           // Обновить список ставок после редактирования
           setOpenBets((prevBets) => prevBets.map(bet => bet.id === betId ? { ...bet, [field]: value } : bet));
       } catch (error) {
           console.error("Error editing bet:", error);
       }
   };


   const onSubmit = async (values: z.infer<typeof createBetSchema>) => {
       const { initBetPlayer1, initBetPlayer2 } = values;


       if (initBetPlayer1 < 100 || initBetPlayer2 < 100) {
           setCreateBetError('Минимальная ставка на каждого игрока: 100 баллов');
           return;
       }


       const totalBetAmount = initBetPlayer1 + initBetPlayer2;
       if (totalBetAmount > 1000) {
           setCreateBetError('Максимальная сумма ставок на обоих игроков: 1000 баллов');
           return;
       }


       const totalBets = initBetPlayer1 + initBetPlayer2;
       const oddsBetPlayer1 = totalBets / initBetPlayer1;
       const oddsBetPlayer2 = totalBets / initBetPlayer2;


       const betData = {
           ...values,
           status: 'OPEN',
           oddsBetPlayer1,
           oddsBetPlayer2,
           creatorId: user.id,
           totalBetPlayer1: initBetPlayer1,
           totalBetPlayer2: initBetPlayer2,
       };


       try {
           await createBet(betData);
           form.reset();
           setCreateBetError(null);
           setShowSuccessDialog(true);
           setTimeout(() => setShowSuccessDialog(false), 3000);
       } catch (error) {
           if (error instanceof Error) {
               setCreateBetError(error.message);
           } else {
               setCreateBetError("Произошла неизвестная ошибка");
           }
       }
   };


   return (
       <div>
           <div>Ваши баллы: {user?.points}</div>
           <div style={{color: 'blue', marginBottom: '10px'}}>
               Вы можете распределить только 1000 баллов между двумя игроками. Баллы не списываются с вашего баланса.
           </div>
           <Form {...form}>
               <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                   {/* Поле выбора Player 1 */}
                   <FormField
                       control={form.control}
                       name="player1Id"
                       render={({field}) => (
                           <FormItem>
                               <FormLabel>Player 1</FormLabel>
                               <FormControl>
                                   <select {...field} value={field.value ?? ""}>
                                       {players.map((player) => (
                                           <option key={player.id} value={player.id}>{player.name}</option>
                                       ))}
                                   </select>
                               </FormControl>
                               <FormMessage/>
                           </FormItem>
                       )}
                   />


                   {/* Поле выбора Player 2 */}
                   <FormField
                       control={form.control}
                       name="player2Id"
                       render={({field}) => (
                           <FormItem>
                               <FormLabel>Player 2</FormLabel>
                               <FormControl>
                                   <select {...field} value={field.value ?? ""}>
                                       {players.map((player) => (
                                           <option key={player.id} value={player.id}>{player.name}</option>
                                       ))}
                                   </select>
                               </FormControl>
                               <FormMessage/>
                           </FormItem>
                       )}
                   />


                   {/* Поле для ставки на Player 1 */}
                   <FormField
                       control={form.control}
                       name="initBetPlayer1"
                       render={({field}) => (
                           <FormItem>
                               <FormLabel>Ставка на Player 1</FormLabel>
                               <FormControl>
                                   <Input
                                       placeholder="Сумма ставки"
                                       type="number"
                                       {...field}
                                       value={field.value === undefined ? '' : field.value}
                                       onChange={(e) => {
                                           const value = e.target.valueAsNumber;
                                           if (Number.isInteger(value)) {
                                               field.onChange(value);
                                           }
                                       }}
                                   />
                               </FormControl>
                               <FormMessage/>
                           </FormItem>
                       )}
                   />


                   {/* Поле для ставки на Player 2 */}
                   <FormField
                       control={form.control}
                       name="initBetPlayer2"
                       render={({field}) => (
                           <FormItem>
                               <FormLabel>Ставка на Player 2</FormLabel>
                               <FormControl>
                                   <Input
                                       placeholder="Сумма ставки"
                                       type="number"
                                       {...field}
                                       value={field.value === undefined ? '' : field.value}
                                       onChange={(e) => {
                                           const value = e.target.valueAsNumber;
                                           if (Number.isInteger(value)) {
                                               field.onChange(value);
                                           }
                                       }}
                                   />
                               </FormControl>
                               <FormMessage/>
                           </FormItem>
                       )}
                   />


                   {/* Поле выбора категории */}
                   <FormField
                       control={form.control}
                       name="categoryId"
                       render={({field}) => (
                           <FormItem>
                               <FormLabel>Map</FormLabel>
                               <FormControl>
                                   <select {...field} value={field.value ?? ""}>
                                       <option value="">None</option>
                                       {/* Опция для выбора null */}
                                       {categories.map((category) => (
                                           <option key={category.id} value={category.id}>{category.name}</option>
                                       ))}
                                   </select>
                               </FormControl>
                               <FormMessage/>
                           </FormItem>
                       )}
                   />


                   {/* Поле выбора продукта */}
                   <FormField
                       control={form.control}
                       name="productId"
                       render={({field}) => (
                           <FormItem>
                               <FormLabel>Size</FormLabel>
                               <FormControl>
                                   <select {...field} value={field.value ?? ""}>
                                       <option value="">None</option>
                                       {/* Опция для выбора null */}
                                       {products.map((product) => (
                                           <option key={product.id} value={product.id}>{product.name}</option>
                                       ))}
                                   </select>
                               </FormControl>
                               <FormMessage/>
                           </FormItem>
                       )}
                   />


                   {/* Поле выбора элемента продукта */}
                   <FormField
                       control={form.control}
                       name="productItemId"
                       render={({field}) => (
                           <FormItem>
                               <FormLabel>Product Item</FormLabel>
                               <FormControl>
                                   <select {...field} value={field.value ?? ""}>
                                       <option value="">None</option>
                                       {/* Опция для выбора null */}
                                       {productItems.map((productItem) => (
                                           <option key={productItem.id}
                                                   value={productItem.id}>{productItem.name}</option>
                                       ))}
                                   </select>
                               </FormControl>
                               <FormMessage/>
                           </FormItem>
                       )}
                   />


                   {/* Поле выбора TurnirBet */}


                   <FormField
                       control={form.control}
                       name="turnirBetId"
                       render={({field}) => (
                           <FormItem>
                               <FormLabel>Turnir Bet</FormLabel>
                               <FormControl>
                                   <select {...field} value={field.value ?? ""}>
                                       <option value="">None</option>
                                       {/* Опция для выбора null */}
                                       {turnirBet.map((turnirBet) => (
                                           <option key={turnirBet.id} value={turnirBet.id}>{turnirBet.name}</option>
                                       ))}
                                   </select>
                               </FormControl>
                               <FormMessage/>
                           </FormItem>
                       )}
                   />




                   {/* Поле для описания */}
                   <FormField
                       control={form.control}
                       name="description"
                       render={({field}) => (
                           <FormItem>
                               <FormLabel>Description</FormLabel>
                               <FormControl>
                                   <Input
                                       placeholder="Описание"
                                       type="text"
                                       {...field}
                                   />
                               </FormControl>
                               <FormMessage/>
                           </FormItem>
                       )}
                   />


                   {/* Кнопка отправки формы */}
                   <Button type="submit">Create Bet</Button>


                   {/* Отображение ошибки */}
                   {createBetError && <p style={{color: 'red'}}>{createBetError}</p>}
               </form>
           </Form>


           {/* Диалоговое окно успешного создания ставки */}
           {showSuccessDialog && (
               <div className="fixed inset-0 flex items-center justify-center bg-opacity-50">
                   <div className="p-4 rounded shadow-lg">
                       <p>Ставка успешно создана!</p>
                   </div>
               </div>
           )}




           <div>
               <h2>Открытые ставки</h2>
               {openBetsState.map(bet => (
                   <div key={bet.id} className="bet-item">
                       <div>
                           <span>Ставка ID: {bet.id}</span>
                           <select
                               value={bet.turnirBetId ?? ""}
                               onChange={(e) => handleEditBet(bet.id, 'turnirBetId', e.target.value)}
                           >
                               <option value="">None</option>
                               {turnirBet.map(tb => (
                                   <option key={tb.id} value={tb.id}>{tb.name}</option>
                               ))}
                           </select>
                           <select
                               value={bet.categoryId ?? ""}
                               onChange={(e) => handleEditBet(bet.id, 'categoryId', e.target.value)}
                           >
                               <option value="">None</option>
                               {categories.map(cat => (
                                   <option key={cat.id} value={cat.id}>{cat.name}</option>
                               ))}
                           </select>
                           <select
                               value={bet.productId ?? ""}
                               onChange={(e) => handleEditBet(bet.id, 'productId', e.target.value)}
                           >
                               <option value="">None</option>
                               {products.map(prod => (
                                   <option key={prod.id} value={prod.id}>{prod.name}</option>
                               ))}
                           </select>
                           <select
                               value={bet.productItemId ?? ""}
                               onChange={(e) => handleEditBet(bet.id, 'productItemId', e.target.value)}
                           >
                               <option value="">None</option>
                               {productItems.map(pi => (
                                   <option key={pi.id} value={pi.id}>{pi.name}</option>
                               ))}
                           </select>
                       </div>
                   </div>
               ))}
           </div>
       </div>
   );
};


export async function editBet(betId: number, data: Partial<Bet>) {
   const session = await getUserSession();
   if (!session || session.role !== 'ADMIN') {
       throw new Error('У вас нет прав для выполнения этой операции');
   }
   try {
       await prisma.bet.update({
           where: { id: Number(betId) },
           data,
       });
   } catch (error) {
       console.error("Error updating bet:", error);
       throw new Error('Не удалось обновить ставку');
   }
   revalidatePath('/bet-create-2')
}


e used to find the original code. Cause: TypeError [ERR_INVALID_ARG_TYPE]: The "payload" argument must be of type object. Received null
Error updating bet: Error [PrismaClientValidationError]: 
Invalid `prisma.bet.update()` invocation:


{
  where: {
    id: 26
  },
  data: {
    turnirBetId: "17"
                 ~~~~
  }
}


Argument `turnirBetId`: Invalid value provided. Expected Int, NullableIntFieldUpdateOperationsInput or Null, provided String.        
    at async editBet (app/actions.ts:2304:8)
  2302 |     }
  2303 |     try {
> 2304 |         await prisma.bet.update({
       |        ^
  2305 |             where: { id: Number(betId) },
  2306 |             data,
  2307 |         }); {
  clientVersion: '6.4.1'
}
 ⨯ Error: Не удалось обновить ставку
    at editBet (app/actions.ts:2310:14)
  2308 |     } catch (error) {
  2309 |         console.error("Error updating bet:", error);
> 2310 |         throw new Error('Не удалось обновить ставку');
       |              ^
  2311 |     }
  2312 |     revalidatePath('/bet-create-2')
  2313 | } {
  digest: '2233472916'






отвечай на русском
,  shadcn , zod
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

npx prisma migrate dev --name add_is_processing_field
{new Date(exchangeRates.updatedAt).toLocaleString()}

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



