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
import { clientCreateBet3 } from "@/app/actions"; // Assuming you have a separate action for 3 players

const createBetSchema3 = z.object({
    player1Id: z.coerce.number().int(),
    player2Id: z.coerce.number().int(),
    player3Id: z.coerce.number().int(),
    initBetPlayer1: z.number().int().min(10, { message: 'Минимальная ставка на игрока 1: 10 баллов' }),
    initBetPlayer2: z.number().int().min(10, { message: 'Минимальная ставка на игрока 2: 10 баллов' }),
    initBetPlayer3: z.number().int().min(10, { message: 'Минимальная ставка на игрока 3: 10 баллов' }),
    categoryId: z.coerce.number().int(),
    productId: z.coerce.number().int(),
    productItemId: z.coerce.number().int(),
});

interface Props {
    user: User;
    categories: Category[];
    products: Product[];
    productItems: ProductItem[];
    players: Player[];
    createBet3: typeof clientCreateBet3;
}

export const CreateBetForm3: React.FC<Props> = ({ user, categories, products, productItems, players, createBet3 }) => {
    const form = useForm<z.infer<typeof createBetSchema3>>({
        resolver: zodResolver(createBetSchema3),
        defaultValues: {
            player1Id: players[0]?.id,
            player2Id: players[1]?.id,
            player3Id: players[2]?.id,
            initBetPlayer1: 333,
            initBetPlayer2: 333,
            initBetPlayer3: 333,
            categoryId: categories[0]?.id,
            productId: products[0]?.id,
            productItemId: productItems[0]?.id,
        },
    });

    const [createBetError, setCreateBetError] = useState<string | null>(null);

    const onSubmit = async (values: z.infer<typeof createBetSchema3>) => {
        const { initBetPlayer1, initBetPlayer2, initBetPlayer3 } = values;

        // Check minimum bet amount
        if (initBetPlayer1 < 100 || initBetPlayer2 < 100 || initBetPlayer3 < 100) {
            setCreateBetError('Минимальная ставка на каждого игрока: 100 баллов');
            return;
        }

        // Check maximum total bet amount (1000 points)
        const totalBetAmount = initBetPlayer1 + initBetPlayer2 + initBetPlayer3;
        if (totalBetAmount > 1000) {
            setCreateBetError('Максимальная сумма ставок на всех игроков: 1000 баллов');
            return;
        }

        // Calculate odds
        const totalBets = initBetPlayer1 + initBetPlayer2 + initBetPlayer3;
        const oddsBetPlayer1 = totalBets / initBetPlayer1;
        const oddsBetPlayer2 = totalBets / initBetPlayer2;
        const oddsBetPlayer3 = totalBets / initBetPlayer3;

        const betData = {
            ...values,
            oddsBetPlayer1,
            oddsBetPlayer2,
            oddsBetPlayer3,
            creatorId: user.id,
            totalBetPlayer1: initBetPlayer1,
            totalBetPlayer2: initBetPlayer2,
            totalBetPlayer3: initBetPlayer3,
        };

        try {
            await createBet3(betData);
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
                Вы можете распределить только 100 баллов между тремя игроками. Баллы не списываются с вашего баланса.
            </div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    {/* Player 1 Selection */}
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

                    {/* Player 2 Selection */}
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

                    {/* Player 3 Selection */}
                    <FormField
                        control={form.control}
                        name="player3Id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Player 3</FormLabel>
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

                    {/* Bet on Player 1 */}
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
                                            if (Number.isInteger(value)) {
                                                field.onChange(value);
                                            }
                                        }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Bet on Player 2 */}
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
                                            if (Number.isInteger(value)) {
                                                field.onChange(value);
                                            }
                                        }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Bet on Player 3 */}
                    <FormField
                        control={form.control}
                        name="initBetPlayer3"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Ставка на Player 3</FormLabel>
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
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Category Selection */}
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

                    {/* Product Selection */}
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

                    {/* Product Item Selection */}
                    {/* Uncomment if needed */}
                    {/* <FormField
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
                    /> */}

                    {/* Submit Button */}
                    <Button type="submit">Create Bet</Button>

                    {/* Error Message */}
                    {createBetError && <p style={{ color: 'red' }}>{createBetError}</p>}
                </form>
            </Form>
        </div>
    );
};
