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
import { createBuyOrder, createSellOrder, buyPayPointsOpen } from '@/app/actions';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";

// Интерфейс для свойств компонента
interface Props {
    user: User;
    openOrders: OrderP2PType[];
    className?: string;
}

// Компонент для работы с P2P заказами
export const OrderP2P: React.FC<Props> = ({ user, openOrders, className }) => {
    // Состояния для управления данными
    const [buyPoints, setBuyPoints] = useState<number>(0);
    const [sellPoints, setSellPoints] = useState<number>(0);
    const [selectedBankDetailsForBuy, setSelectedBankDetailsForBuy] = useState<any[]>([]);
    const [selectedBankDetailsForSell, setSelectedBankDetailsForSell] = useState<any[]>([]);
    const [selectedBankDetailsForInteraction, setSelectedBankDetailsForInteraction] = useState<any[]>([]);
    const [allowPartialBuy, setAllowPartialBuy] = useState<boolean>(false);
    const [allowPartialSell, setAllowPartialSell] = useState<boolean>(false);
    const [isBuySelectOpen, setIsBuySelectOpen] = useState<boolean>(false);
    const [isSellSelectOpen, setIsSellSelectOpen] = useState<boolean>(false);

    // Обработчик выбора банковских реквизитов для покупки
    const handleSelectBankDetailForBuy = (detail: any) => {
        setSelectedBankDetailsForBuy((prevDetails) => {
            if (prevDetails.includes(detail)) {
                return prevDetails.filter((d) => d !== detail);
            } else {
                return [...prevDetails, { ...detail, price: 0 }];
            }
        });
    };

    // Обработчик выбора банковских реквизитов для продажи
    const handleSelectBankDetailForSell = (detail: any) => {
        setSelectedBankDetailsForSell((prevDetails) => {
            if (prevDetails.includes(detail)) {
                return prevDetails.filter((d) => d !== detail);
            } else {
                return [...prevDetails, { ...detail, price: 0 }];
            }
        });
    };

    // Обработчик выбора всех банковских реквизитов для покупки
    const handleSelectAllBankDetailsForBuy = () => {
        setSelectedBankDetailsForBuy(user.bankDetails.map((detail: any) => ({ ...detail, price: 0 })));
        setIsBuySelectOpen(false); // Закрыть Select
    };

    // Обработчик выбора всех банковских реквизитов для продажи
    const handleSelectAllBankDetailsForSell = () => {
        setSelectedBankDetailsForSell(user.bankDetails.map((detail: any) => ({ ...detail, price: 0 })));
        setIsSellSelectOpen(false); // Закрыть Select
    };

    // Обработчик очистки выбранных банковских реквизитов для покупки
    const handleClearBankDetailsForBuy = () => {
        setSelectedBankDetailsForBuy([]);
        setIsBuySelectOpen(false); // Закрыть Select
    };

    // Обработчик очистки выбранных банковских реквизитов для продажи
    const handleClearBankDetailsForSell = () => {
        setSelectedBankDetailsForSell([]);
        setIsSellSelectOpen(false); // Закрыть Select
    };

    // Обработчик изменения цены для покупки
    const handlePriceChangeForBuy = (index: number, value: string) => {
        const price = parseFloat(value);
        setSelectedBankDetailsForBuy((prevDetails) => {
            const newDetails = [...prevDetails];
            newDetails[index].price = isNaN(price) ? 0 : price;
            return newDetails;
        });
    };

    // Обработчик изменения цены для продажи
    const handlePriceChangeForSell = (index: number, value: string) => {
        const price = parseFloat(value);
        setSelectedBankDetailsForSell((prevDetails) => {
            const newDetails = [...prevDetails];
            newDetails[index].price = isNaN(price) ? 0 : price;
            return newDetails;
        });
    };

// Обработчик создания заявки на покупку
    const handleCreateBuyOrder = async () => {
        if (buyPoints > 100000) {
            alert('Вы не можете купить более 100,000 points');
            return;
        }
        try {
            await createBuyOrder(buyPoints, selectedBankDetailsForBuy, allowPartialBuy);
            alert('Заявка на покупку успешно создана');
        } catch (error) {
            console.error('Ошибка при создании заявки на покупку:', error);
            alert('Не удалось создать заявку на покупку');
        }
    };

// Обработчик создания заявки на продажу
    const handleCreateSellOrder = async () => {
        if (sellPoints > user.points) {
            alert('Вы не можете продать больше, чем у вас есть points');
            return;
        }
        try {
            await createSellOrder(sellPoints, selectedBankDetailsForSell, allowPartialSell);
            alert('Заявка на продажу успешно создана');
        } catch (error) {
            console.error('Ошибка при создании заявки на продажу:', error);
            alert('Не удалось создать заявку на продажу');
        }
    };

    // Обработчик выбора банковских реквизитов для взаимодействия
    const handleSelectBankDetailForInteraction = (detail: any) => {
        setSelectedBankDetailsForInteraction([detail]);
    };

    // Обработчик заключения сделки
    const handleConcludeDeal = async (order: OrderP2PType) => {
        if (order.orderP2PUser1Id === user.id) {
            alert('Вы не можете заключать сделку с самим собой');
            return;
        }

        try {
            await buyPayPointsOpen();
            alert('Сделка успешно заключена');
        } catch (error) {
            console.error('Ошибка при заключении сделки:', error);
            alert('Не удалось заключить сделку');
        }
    };

    // Проверка, можно ли создать заявку
    const isCreateOrderDisabled = (points: number, selectedDetails: any[]) => {
        return points <= 0 || selectedDetails.length === 0 || selectedDetails.some(detail => detail.price <= 0);
    };

    // Обработчик изменения значения для покупки
    const handleBuyPointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Удаляем ведущие нули и оставляем только положительные целые числа
        const sanitizedValue = value.replace(/^0+/, '').replace(/[^0-9]/g, '');
        const points = sanitizedValue ? Number(sanitizedValue) : 0;
        // Ограничиваем покупку до 100,000 points
        if (points <= 100000) {
            setBuyPoints(points);
        }
    };

    // Обработчик изменения значения для продажи
    const handleSellPointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Удаляем ведущие нули и оставляем только положительные целые числа
        const sanitizedValue = value.replace(/^0+/, '').replace(/[^0-9]/g, '');
        const points = sanitizedValue ? Number(sanitizedValue) : 0;
        // Ограничиваем продажу до количества points у пользователя
        if (points <= user.points) {
            setSellPoints(points);
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
                        type="text" // Изменено на "text" для более гибкой обработки ввода
                        value={buyPoints}
                        onChange={handleBuyPointsChange}
                        placeholder="Сколько хотите купить"
                        className="mb-2"
                    />
                    <Select
                        open={isBuySelectOpen}
                        onOpenChange={setIsBuySelectOpen}
                        onValueChange={handleSelectBankDetailForBuy}
                        placeholder="Выберите реквизиты банка"
                        className="mb-2"
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Выберите реквизиты банка" />
                        </SelectTrigger>
                        <SelectContent>
                            <Button onClick={handleSelectAllBankDetailsForBuy} className="mb-2">Выбрать все</Button>
                            <Button onClick={handleClearBankDetailsForBuy} className="mb-2">Закрыть все</Button>
                            {user.bankDetails && user.bankDetails.map((detail, index) => (
                                <SelectItem key={index} value={detail}>
                                    {detail.name} - {detail.details}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {selectedBankDetailsForBuy.map((detail, index) => (
                        <div key={index} className="flex items-center mb-2">
                            <span>{detail.name} - {detail.details}</span>
                            <Input
                                type="number"
                                step="0.1"
                                value={detail.price.toString()}
                                onChange={(e) => handlePriceChangeForBuy(index, e.target.value)}
                                placeholder="Цена"
                                className="ml-2"
                            />
                        </div>
                    ))}
                    <label className="flex items-center mb-2">
                        <input
                            type="checkbox"
                            checked={allowPartialBuy}
                            onChange={() => setAllowPartialBuy(!allowPartialBuy)}
                            className="mr-2"
                        />
                        Покупать частями
                    </label>
                    <Button onClick={handleCreateBuyOrder} className="w-full" disabled={isCreateOrderDisabled(buyPoints, selectedBankDetailsForBuy)}>Создать заявку</Button>
                </div>
                <div className="w-1/2">
                    <h2 className="text-xl font-bold mb-2">Продать Points</h2>
                    <Input
                        type="text" // Изменено на "text" для более гибкой обработки ввода
                        value={sellPoints}
                        onChange={handleSellPointsChange}
                        placeholder="Сколько хотите продать"
                        className="mb-2"
                    />
                    <Select
                        open={isSellSelectOpen}
                        onOpenChange={setIsSellSelectOpen}
                        onValueChange={handleSelectBankDetailForSell}
                        placeholder="Выберите реквизиты банка"
                        className="mb-2"
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Выберите реквизиты банка" />
                        </SelectTrigger>
                        <SelectContent>
                            <Button onClick={handleSelectAllBankDetailsForSell} className="mb-2">Выбрать все</Button>
                            <Button onClick={handleClearBankDetailsForSell} className="mb-2">Закрыть все</Button>
                            {user.bankDetails && user.bankDetails.map((detail, index) => (
                                <SelectItem key={index} value={detail}>
                                    {detail.name} - {detail.details}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {selectedBankDetailsForSell.map((detail, index) => (
                        <div key={index} className="flex items-center mb-2">
                            <span>{detail.name} - {detail.details}</span>
                            <Input
                                type="number"
                                step="0.1"
                                value={detail.price.toString()}
                                onChange={(e) => handlePriceChangeForSell(index, e.target.value)}
                                placeholder="Цена"
                                className="ml-2"
                            />
                        </div>
                    ))}
                    <label className="flex items-center mb-2">
                        <input
                            type="checkbox"
                            checked={allowPartialSell}
                            onChange={() => setAllowPartialSell(!allowPartialSell)}
                            className="mr-2"
                        />
                        Продавать частями
                    </label>
                    <Button onClick={handleCreateSellOrder} className="w-full" disabled={isCreateOrderDisabled(sellPoints, selectedBankDetailsForSell)}>Создать заявку</Button>
                </div>
            </div>
            <Accordion className="mt-4">
                {openOrders.map((order) => (
                    <AccordionItem key={order.id} className={order.orderP2PUser1Id === user.id ? 'bg-gray-200' : ''}>
                        <AccordionTrigger disabled={order.orderP2PUser1Id === user.id}>
                            {order.orderP2PUser1.cardId} хочет {order.orderP2PBuySell === 'BUY' ? 'купить' : 'продать'} {order.orderP2PPoints} points
                        </AccordionTrigger>
                        <AccordionContent>
                            <Table>
                                <TableBody>
                                    <TableRow>
                                        <TableCell>{order.orderP2PPoints}</TableCell>
                                        <TableCell>{JSON.stringify(order.orderBankDetails)}</TableCell>
                                        <TableCell>{order.orderP2PPart ? 'Частями' : 'Целиком'}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                            <Select
                                onValueChange={handleSelectBankDetailForInteraction}
                                placeholder="Выберите реквизиты банка для сделки"
                                className="mb-2"
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Выберите реквизиты банка" />
                                </SelectTrigger>
                                <SelectContent>
                                    {order.orderBankDetails && order.orderBankDetails.map((detail, index) => (
                                        <SelectItem key={index} value={detail}>
                                            {detail.name} - {detail.details}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button onClick={() => handleConcludeDeal(order)} disabled={order.orderP2PUser1Id === user.id}>
                                Заключить сделку
                            </Button>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
};
