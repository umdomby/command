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
import { Category, Product, ProductItem, User, Player } from '@prisma/client';
import { clientCreateBet } from "@/app/actions";

const createBetSchema = z.object({
    player1Id: z.coerce.number(),
    player2Id: z.coerce.number(),
    initBetPlayer1: z.number().positive({ message: 'Введите положительное число очков' }),
    initBetPlayer2: z.number().positive({ message: 'Введите положительное число очков' }),
    categoryId: z.coerce.number(),
    productId: z.coerce.number(),
    productItemId: z.coerce.number(),
});

interface Props {
    user: User;
    categories: Category[];
    products: Product[];
    productItems: ProductItem[];
    players: Player[];
    createBet: typeof clientCreateBet;
}

export const CreateBetForm: React.FC<Props> = ({ user, categories, products, productItems, players, createBet }) => {
    const form = useForm<z.infer<typeof createBetSchema>>({
        resolver: zodResolver(createBetSchema),
        defaultValues: {
            player1Id: players[0]?.id,
            player2Id: players[1]?.id,
            initBetPlayer1: 50, // Дефолтное значение 50
            initBetPlayer2: 50, // Дефолтное значение 50
            categoryId: categories[0]?.id,
            productId: products[0]?.id,
            productItemId: productItems[0]?.id,
        },
    });

    const [createBetError, setCreateBetError] = useState<string | null>(null);

    const onSubmit = async (values: any) => {
        const { initBetPlayer1, initBetPlayer2 } = values;

        // Логируем значения для отладки
        console.log("initBetPlayer1:", initBetPlayer1);
        console.log("initBetPlayer2:", initBetPlayer2);

        // Рассчитываем коэффициенты
        const totalBets = initBetPlayer1 + initBetPlayer2;
        const currentOdds1 = totalBets / initBetPlayer1; // Коэффициент для игрока 1
        const currentOdds2 = totalBets / initBetPlayer2; // Коэффициент для игрока 2

        const betData = {
            ...values,
            currentOdds1, // Добавляем currentOdds1
            currentOdds2, // Добавляем currentOdds2
            creatorId: user.id, // Добавляем creatorId из данных текущего пользователя
            initBetPlayer1: values.initBetPlayer1, // Убедитесь, что это поле передается
            initBetPlayer2: values.initBetPlayer2, // Убедитесь, что это поле передается
            totalBetPlayer1: initBetPlayer1, // Добавляем totalBetPlayer1
            totalBetPlayer2: initBetPlayer2, // Добавляем totalBetPlayer2
        };

        // Передаем данные в clientCreateBet
        try {
            console.log("Data being sent to clientCreateBet");
            console.log(betData); // Логируем данные перед отправкой
            await clientCreateBet(betData); // Передаем данные в clientCreateBet
            form.reset();
            setCreateBetError(null);
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
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    {/* Поле выбора Player 1 */}
                    <FormField
                        control={form.control}
                        name="player1Id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Player 1</FormLabel>
                                <FormControl>
                                    <select {...field}>
                                        {players.map((player) => (
                                            <option key={player.id} value={player.id}>{player.name}</option>
                                        ))}
                                    </select>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Поле выбора Player 2 */}
                    <FormField
                        control={form.control}
                        name="player2Id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Player 2</FormLabel>
                                <FormControl>
                                    <select {...field}>
                                        {players.map((player) => (
                                            <option key={player.id} value={player.id}>{player.name}</option>
                                        ))}
                                    </select>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Поле для ставки на Player 1 */}
                    <FormField
                        control={form.control}
                        name="initBetPlayer1"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Ставка на Player 1</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Сумма ставки"
                                        type="number"
                                        {...field}
                                        value={field.value === undefined ? '' : field.value}
                                        onChange={(e) => field.onChange(Number(e.target.valueAsNumber || 0))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Поле для ставки на Player 2 */}
                    <FormField
                        control={form.control}
                        name="initBetPlayer2"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Ставка на Player 2</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Сумма ставки"
                                        type="number"
                                        {...field}
                                        value={field.value === undefined ? '' : field.value}
                                        onChange={(e) => field.onChange(Number(e.target.valueAsNumber || 0))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Поле выбора категории */}
                    <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Category</FormLabel>
                                <FormControl>
                                    <select {...field}>
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>{category.name}</option>
                                        ))}
                                    </select>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Поле выбора продукта */}
                    <FormField
                        control={form.control}
                        name="productId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Product</FormLabel>
                                <FormControl>
                                    <select {...field}>
                                        {products.map((product) => (
                                            <option key={product.id} value={product.id}>{product.name}</option>
                                        ))}
                                    </select>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Поле выбора элемента продукта */}
                    <FormField
                        control={form.control}
                        name="productItemId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Product Item</FormLabel>
                                <FormControl>
                                    <select {...field}>
                                        {productItems.map((productItem) => (
                                            <option key={productItem.id} value={productItem.id}>{productItem.name}</option>
                                        ))}
                                    </select>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Кнопка отправки формы */}
                    <Button type="submit">Create Bet</Button>

                    {/* Отображение ошибки */}
                    {createBetError && <p style={{ color: 'red' }}>{createBetError}</p>}
                </form>
            </Form>
        </div>
    );
};
