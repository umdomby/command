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
    player1Id: z.coerce.number().int(), // Только целые числа
    player2Id: z.coerce.number().int(), // Только целые числа
    initBetPlayer1: z.number().int().min(10, { message: 'Минимальная ставка на игрока 1: 10 баллов' }), // Только целые числа
    initBetPlayer2: z.number().int().min(10, { message: 'Минимальная ставка на игрока 2: 10 баллов' }), // Только целые числа
    categoryId: z.coerce.number().int(), // Только целые числа
    productId: z.coerce.number().int(), // Только целые числа
    productItemId: z.coerce.number().int(), // Только целые числа
});

interface Props {
    user: User;
    categories: Category[];
    products: Product[];
    productItems: ProductItem[];
    players: Player[];
    createBet: typeof clientCreateBet;
}

export const CreateBetForm3: React.FC<Props> = ({ user, categories, products, productItems, players, createBet }) => {
    const form = useForm<z.infer<typeof createBetSchema>>({
        resolver: zodResolver(createBetSchema),
        defaultValues: {
            player1Id: players[0]?.id,
            player2Id: players[1]?.id,
            initBetPlayer1: 50,
            initBetPlayer2: 50,
            categoryId: categories[0]?.id,
            productId: products[0]?.id,
            productItemId: productItems[0]?.id,
        },
    });

    const [createBetError, setCreateBetError] = useState<string | null>(null);

    const onSubmit = async (values: z.infer<typeof createBetSchema>) => {
        const { initBetPlayer1, initBetPlayer2 } = values;

        // Проверка на минимальную сумму ставки
        if (initBetPlayer1 < 10 || initBetPlayer2 < 10) {
            setCreateBetError('Минимальная ставка на каждого игрока: 10 баллов');
            return;
        }

        // Проверка на максимальную сумму ставки (100 баллов)
        const totalBetAmount = initBetPlayer1 + initBetPlayer2;
        if (totalBetAmount > 100) {
            setCreateBetError('Максимальная сумма ставок на обоих игроков: 100 баллов');
            return;
        }

        // Рассчитываем коэффициенты
        const totalBets = initBetPlayer1 + initBetPlayer2;
        const oddsBetPlayer1 = totalBets / initBetPlayer1;
        const oddsBetPlayer2 = totalBets / initBetPlayer2;

        const betData = {
            ...values,
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
            <div style={{ color: 'blue', marginBottom: '10px' }}>
                Вы можете распределить только 100 баллов между двумя игроками. Баллы не списываются с вашего баланса.
            </div>
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
                                        onChange={(e) => {
                                            const value = e.target.valueAsNumber;
                                            if (Number.isInteger(value)) { // Проверка на целое число
                                                field.onChange(value);
                                            }
                                        }}
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
                                        onChange={(e) => {
                                            const value = e.target.valueAsNumber;
                                            if (Number.isInteger(value)) { // Проверка на целое число
                                                field.onChange(value);
                                            }
                                        }}
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
                                <FormLabel>Map</FormLabel>
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
                                <FormLabel>Size</FormLabel>
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
                    {/*<FormField*/}
                    {/*    control={form.control}*/}
                    {/*    name="productItemId"*/}
                    {/*    render={({ field }) => (*/}
                    {/*        <FormItem>*/}
                    {/*            <FormLabel>Product Item</FormLabel>*/}
                    {/*            <FormControl>*/}
                    {/*                <select {...field}>*/}
                    {/*                    {productItems.map((productItem) => (*/}
                    {/*                        <option key={productItem.id} value={productItem.id}>{productItem.name}</option>*/}
                    {/*                    ))}*/}
                    {/*                </select>*/}
                    {/*            </FormControl>*/}
                    {/*            <FormMessage />*/}
                    {/*        </FormItem>*/}
                    {/*    )}*/}
                    {/*/>*/}

                    {/* Кнопка отправки формы */}
                    <Button type="submit">Create Bet</Button>

                    {/* Отображение ошибки */}
                    {createBetError && <p style={{ color: 'red' }}>{createBetError}</p>}
                </form>
            </Form>
        </div>
    );
};
