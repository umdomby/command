// import { NextResponse } from 'next/server';
// import { prisma } from '@/prisma/prisma-client';
// import * as z from 'zod';
// import { getUserSession } from '@/components/lib/get-user-session';
//
// const createBetSchema = z.object({
//     oddsPlayer1: z.number().gt(1, { message: 'Коэффициент должен быть больше 1' }),
//     oddsPlayer2: z.number().gt(1, { message: 'Коэффициент должен быть больше 1' }),
//     categoryId: z.number().int(),
//     productId: z.number().int(),
//     productItemId: z.number().int(),
// });
//
// export async function POST(request: Request) {
//     try {
//         const session = await getUserSession();
//
//         // Проверяем, авторизован ли пользователь
//         if (!session) {
//             return new NextResponse('Пользователь не авторизован', { status: 401 });
//         }
//
//         // Находим пользователя в базе данных
//         const user = await prisma.user.findFirst({ where: { id: Number(session.id) } });
//
//         // Если пользователь не найден, возвращаем ошибку
//         if (!user) {
//             return new NextResponse('Пользователь не найден', { status: 404 });
//         }
//
//         // Парсим и валидируем данные из запроса
//         const data = await request.json();
//         const validatedData = createBetSchema.parse(data);
//
//         // Создаем ставку
//         const createdBet = await prisma.bet.create({
//             data: {
//                 initialOdds1: validatedData.oddsPlayer1,
//                 initialOdds2: validatedData.oddsPlayer2,
//                 currentOdds1: validatedData.oddsPlayer1,
//                 currentOdds2: validatedData.oddsPlayer2,
//                 category: { connect: { id: validatedData.categoryId } },
//                 product: { connect: { id: validatedData.productId } },
//                 productItem: { connect: { id: validatedData.productItemId } },
//                 creatorId: user.id, // ID пользователя из сессии
//             },
//         });
//
//         // Возвращаем успешный ответ
//         return NextResponse.json({ message: 'Ставка успешно создана', bet: createdBet });
//
//     } catch (error) {
//         if (error instanceof z.ZodError) {
//             return new NextResponse(JSON.stringify(error.issues), { status: 400 });
//         }
//         console.error('Ошибка при создании ставки:', error);
//         return new NextResponse('Ошибка сервера', { status: 500 });
//     }
// }