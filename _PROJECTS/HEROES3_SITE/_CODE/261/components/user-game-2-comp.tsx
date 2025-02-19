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
import {clientCreateBet, gameUserBetCreate} from "@/app/actions";


const createBetSchema = z.object({

});

interface Props {
    user: User;
    categories: Category[];
    products: Product[];
    productItems: ProductItem[];
    player: Player;
    createBet: typeof clientCreateBet;
}

export const UserGame2Comp: React.FC<Props> = ({ user, categories, products, productItems, player, createBet }) => {
    // const form = useForm<z.infer<typeof createBetSchema>>({
    //     resolver: zodResolver(createBetSchema),
    //     defaultValues: {
    //
    //     },
    // });

    // const [createBetError, setCreateBetError] = useState<string | null>(null);
    //
    // const onSubmit = async (values: z.infer<typeof createBetSchema>) => {
    //
    //     try {
    //         // await gameUserBetCreate(gameData);
    //         form.reset();
    //
    //     } catch (error) {
    //         if (error instanceof Error) {
    //             setCreateBetError(error.message);
    //         } else {
    //             setCreateBetError("Произошла неизвестная ошибка");
    //         }
    //     }
    // };

    return (
        <div>
            <div>Ваши баллы: {user?.points}</div>
            {/*<Form {...form}>*/}
            {/*    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">*/}

            {/*        /!*ставку который устанавливает создатель User1*!/*/}
            {/*        <FormField*/}
            {/*            control={form.control}*/}
            {/*            name="initBetPlayer1"*/}
            {/*            render={({ field }) => (*/}
            {/*                <FormItem>*/}
            {/*                    <FormLabel>Ставка:</FormLabel>*/}
            {/*                    <FormControl>*/}
            {/*                        <Input*/}
            {/*                            placeholder="0"*/}
            {/*                            type="number"*/}
            {/*                            {...field}*/}
            {/*                            value={field.value === undefined ? '' : field.value}*/}
            {/*                            onChange={(e) => {*/}
            {/*                                const value = e.target.valueAsNumber;*/}
            {/*                                if (Number.isInteger(value)) { // Проверка на целое число*/}
            {/*                                    field.onChange(value);*/}
            {/*                                }*/}
            {/*                            }}*/}
            {/*                        />*/}
            {/*                    </FormControl>*/}
            {/*                    <FormMessage />*/}
            {/*                </FormItem>*/}
            {/*            )}*/}
            {/*        />*/}

            {/*        /!* Поле выбора категории *!/*/}
            {/*        <FormField*/}
            {/*            control={form.control}*/}
            {/*            name="categoryId"*/}
            {/*            render={({ field }) => (*/}
            {/*                <FormItem>*/}
            {/*                    <FormLabel>Map</FormLabel>*/}
            {/*                    <FormControl>*/}
            {/*                        <select {...field}>*/}
            {/*                            {categories.map((category) => (*/}
            {/*                                <option key={category.id} value={category.id}>{category.name}</option>*/}
            {/*                            ))}*/}
            {/*                        </select>*/}
            {/*                    </FormControl>*/}
            {/*                    <FormMessage />*/}
            {/*                </FormItem>*/}
            {/*            )}*/}
            {/*        />*/}

            {/*        /!* Поле выбора продукта *!/*/}
            {/*        <FormField*/}
            {/*            control={form.control}*/}
            {/*            name="productId"*/}
            {/*            render={({ field }) => (*/}
            {/*                <FormItem>*/}
            {/*                    <FormLabel>Size</FormLabel>*/}
            {/*                    <FormControl>*/}
            {/*                        <select {...field}>*/}
            {/*                            {products.map((product) => (*/}
            {/*                                <option key={product.id} value={product.id}>{product.name}</option>*/}
            {/*                            ))}*/}
            {/*                        </select>*/}
            {/*                    </FormControl>*/}
            {/*                    <FormMessage />*/}
            {/*                </FormItem>*/}
            {/*            )}*/}
            {/*        />*/}

            {/*        <FormField*/}
            {/*            control={form.control}*/}
            {/*            name="productItemId"*/}
            {/*            render={({ field }) => (*/}
            {/*                <FormItem>*/}
            {/*                    <FormLabel>Product Item</FormLabel>*/}
            {/*                    <FormControl>*/}
            {/*                        <select {...field}>*/}
            {/*                            {productItems.map((productItem) => (*/}
            {/*                                <option key={productItem.id} value={productItem.id}>{productItem.name}</option>*/}
            {/*                            ))}*/}
            {/*                        </select>*/}
            {/*                    </FormControl>*/}
            {/*                    <FormMessage />*/}
            {/*                </FormItem>*/}
            {/*            )}*/}
            {/*        />*/}
            {/*        /!* Кнопка отправки формы *!/*/}
            {/*        <Button type="submit">Create Bet</Button>*/}

            {/*        /!* Отображение ошибки *!/*/}
            {/*        {createBetError && <p style={{ color: 'red' }}>{createBetError}</p>}*/}
            {/*    </form>*/}
            {/*</Form>*/}
        </div>
    );
};
