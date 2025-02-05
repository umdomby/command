"use client";
import React, { useState } from 'react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { User, OrderP2P as OrderP2PType } from "@prisma/client";
import { createBuyOrder, createSellOrder } from '@/app/actions.ts';
import { Button } from "@/components/ui/button"; // Импортируем кнопку из Shadcn
import { Input } from "@/components/ui/input"; // Импортируем инпут из Shadcn

interface Props {
    user: User;
    openOrders: OrderP2PType[];
    className?: string; // Добавляем класс для стилизации
}

export const OrderP2P: React.FC<Props> = ({ user, openOrders, className }) => {
    const [buyPoints, setBuyPoints] = useState<number>(0);
    const [sellPoints, setSellPoints] = useState<number>(0);
    const [selectedBankDetails, setSelectedBankDetails] = useState<any[]>([]); // Для хранения выбранных реквизитов банка
    const [price, setPrice] = useState<number>(0); // Для хранения цены
    const [allowPartial, setAllowPartial] = useState<boolean>(false); // Для хранения состояния чекбокса

    const handleCreateBuyOrder = async () => {
        try {
            await createBuyOrder(buyPoints, selectedBankDetails, price, allowPartial);
            alert('Заявка на покупку успешно создана');
        } catch (error) {
            console.error('Ошибка при создании заявки на покупку:', error);
            alert('Не удалось создать заявку на покупку');
        }
    };

    const handleCreateSellOrder = async () => {
        try {
            await createSellOrder(sellPoints, selectedBankDetails, price, allowPartial);
            alert('Заявка на продажу успешно создана');
        } catch (error) {
            console.error('Ошибка при создании заявки на продажу:', error);
            alert('Не удалось создать заявку на продажу');
        }
    };

    return (
        <div className={className}>
            <div className="flex justify-between items-center mb-4">
                <div>
                    <p className="text-lg font-semibold">Points: {Math.floor(user.points * 100) / 100}</p>
                </div>
            </div>
            <div className="flex space-x-4">
                <div className="w-1/2">
                    <h2 className="text-xl font-bold mb-2">Купить Points</h2>
                    <Input
                        type="number"
                        value={buyPoints}
                        onChange={(e) => setBuyPoints(Number(e.target.value))}
                        placeholder="Сколько хотите купить"
                        className="mb-2"
                    />
                    {/* Выбор реквизитов банка и цены */}
                    <Input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        placeholder="Цена за 1 point"
                        className="mb-2"
                    />
                    <label className="flex items-center mb-2">
                        <input
                            type="checkbox"
                            checked={allowPartial}
                            onChange={() => setAllowPartial(!allowPartial)}
                            className="mr-2"
                        />
                        Продавать частями
                    </label>
                    <Button onClick={handleCreateBuyOrder} className="w-full">Создать заявку</Button>
                </div>
                <div className="w-1/2">
                    <h2 className="text-xl font-bold mb-2">Продать Points</h2>
                    <Input
                        type="number"
                        value={sellPoints}
                        onChange={(e) => setSellPoints(Number(e.target.value))}
                        placeholder="Сколько хотите продать"
                        className="mb-2"
                    />
                    {/* Выбор реквизитов банка и цены */}
                    <Input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        placeholder="Цена за 1 point"
                        className="mb-2"
                    />
                    <label className="flex items-center mb-2">
                        <input
                            type="checkbox"
                            checked={allowPartial}
                            onChange={() => setAllowPartial(!allowPartial)}
                            className="mr-2"
                        />
                        Продавать частями
                    </label>
                    <Button onClick={handleCreateSellOrder} className="w-full">Создать заявку</Button>
                </div>
            </div>
            <Accordion className="mt-4">
                {openOrders.map((order) => (
                    <AccordionItem key={order.id}>
                        <AccordionTrigger>
                            {order.orderP2PUser1.cardId} хочет {order.orderP2PBuySell === 'BUY' ? 'купить' : 'продать'} {order.orderP2PPoints} points
                        </AccordionTrigger>
                        <AccordionContent>
                            <Table>
                                <TableBody>
                                    <TableRow>
                                        <TableCell>{order.orderP2PPoints}</TableCell>
                                        <TableCell>{order.orderBankDetails}</TableCell>
                                        <TableCell>{order.orderP2PPrice}</TableCell>
                                        <TableCell>{order.orderP2PPart ? 'Частями' : 'Целиком'}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                            {/* Логика для заключения сделки */}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
};
