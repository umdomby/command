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



interface BankDetail {
    name: string;
    details: string;
    description: string;
}

// Интерфейс для свойств компонента
interface Props {
    user: User;
    openOrders: OrderP2PType[];
    className?: string;
}

// Компонент для работы с P2P заказами
export const OrderP2P: React.FC<Props> = ({ user, openOrders, className }) => {
    const [buyPoints, setBuyPoints] = useState<number>(0); // Количество очков для покупки
    const [sellPoints, setSellPoints] = useState<number>(0); // Количество очков для продажи
    const [selectedBankDetailsForBuy, setSelectedBankDetailsForBuy] = useState<any[]>([]); // Выбранные банковские реквизиты для покупки
    const [selectedBankDetailsForSell, setSelectedBankDetailsForSell] = useState<any[]>([]); // Выбранные банковские реквизиты для продажи
    const [allowPartialBuy, setAllowPartialBuy] = useState<boolean>(false); // Разрешить частичную покупку
    const [allowPartialSell, setAllowPartialSell] = useState<boolean>(false); // Разрешить частичную продажу
    const [selectedBankDetailsForInteraction, setSelectedBankDetailsForInteraction] = useState<any[]>([]); // Выбранные банковские реквизиты для взаимодействия
    const [selectedBuyOption, setSelectedBuyOption] = useState<string>(''); // Текущее выбранное значение для покупки
    const [selectedSellOption, setSelectedSellOption] = useState<string>(''); // Текущее выбранное значение для продажи

    // Обработчик выбора банковских реквизитов для покупки
    const handleSelectBankDetailForBuy = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = event.target.value;
        setSelectedBuyOption(selectedValue); // Устанавливаем выбранное значение

        if (Array.isArray(user.bankDetails)) {
            const detail = user.bankDetails.find((d: any) => d.name === selectedValue);
            if (detail && typeof detail === 'object') { // Проверяем, что detail является объектом
                setSelectedBankDetailsForBuy((prevDetails) => {
                    if (prevDetails.includes(detail)) {
                        return prevDetails.filter((d) => d !== detail);
                    } else {
                        return [...prevDetails, { ...detail, price: 0 }];
                    }
                });
            }
        }

        setSelectedBuyOption(''); // Сбрасываем выбор
    };

    // Обработчик выбора банковских реквизитов для продажи
// Обработчик выбора банковских реквизитов для продажи
    const handleSelectBankDetailForSell = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = event.target.value;
        setSelectedSellOption(selectedValue); // Устанавливаем выбранное значение

        // Проверяем, что bankDetails не null и является массивом
        if (Array.isArray(user.bankDetails)) {
            const detail = user.bankDetails.find((d: any) => d.name === selectedValue);
            if (detail && typeof detail === 'object') { // Проверяем, что detail является объектом
                setSelectedBankDetailsForSell((prevDetails) => {
                    if (prevDetails.includes(detail)) {
                        return prevDetails.filter((d) => d !== detail);
                    } else {
                        return [...prevDetails, { ...detail, price: 0 }];
                    }
                });
            }
        }

        setSelectedSellOption(''); // Сбрасываем выбор
    };

    // Обработчик изменения цены для покупки
    const handlePriceChangeForBuy = (index: number, value: string) => {
        setSelectedBankDetailsForBuy((prevDetails) => {
            const newDetails = [...prevDetails];

            // Если значение пустое, сбрасываем цену
            if (value === '') {
                newDetails[index].price = '';
                return newDetails;
            }

            // Если первый символ запятая или точка, добавляем '0,' в начало
            if (value.startsWith(',') || value.startsWith('.')) {
                value = '0,' + value.slice(1);
            }

            // Если ввод начинается с 0 и вводится следующая цифра, добавляем запятую
            if (value.startsWith('0') && value.length > 1 && value[1] !== ',') {
                value = '0,' + value.slice(1);
            }

            // Разделяем на целую и дробную части
            const parts = value.split(',');
            // Ограничиваем целую часть до 100000
            if (parts[0].length > 6 || parseInt(parts[0]) > 100000) {
                parts[0] = parts[0].slice(0, 6);
                if (parseInt(parts[0]) > 100000) {
                    parts[0] = '100000';
                }
            }
            // Ограничиваем количество знаков после запятой до десяти
            if (parts[1] && parts[1].length > 10) {
                parts[1] = parts[1].slice(0, 10);
            }
            value = parts.join(',');

            // Проверяем, можно ли преобразовать в Float
            const floatValue = parseFloat(value.replace(',', '.'));
            if (!isNaN(floatValue)) {
                newDetails[index].price = value;
            }
            return newDetails;
        });
    };

    // Обработчик изменения цены для продажи
    const handlePriceChangeForSell = (index: number, value: string) => {
        setSelectedBankDetailsForSell((prevDetails) => {
            const newDetails = [...prevDetails];

            // Если значение пустое, сбрасываем цену
            if (value === '') {
                newDetails[index].price = '';
                return newDetails;
            }

            // Если первый символ запятая или точка, добавляем '0,' в начало
            if (value.startsWith(',') || value.startsWith('.')) {
                value = '0,' + value.slice(1);
            }

            // Если ввод начинается с 0 и вводится следующая цифра, добавляем запятую
            if (value.startsWith('0') && value.length > 1 && value[1] !== ',') {
                value = '0,' + value.slice(1);
            }

            // Разделяем на целую и дробную части
            const parts = value.split(',');
            // Ограничиваем целую часть до 100000
            if (parts[0].length > 6 || parseInt(parts[0]) > 100000) {
                parts[0] = parts[0].slice(0, 6);
                if (parseInt(parts[0]) > 100000) {
                    parts[0] = '100000';
                }
            }
            // Ограничиваем количество знаков после запятой до десяти
            if (parts[1] && parts[1].length > 10) {
                parts[1] = parts[1].slice(0, 10);
            }
            value = parts.join(',');

            // Проверяем, можно ли преобразовать в Float
            const floatValue = parseFloat(value.replace(',', '.'));
            if (!isNaN(floatValue)) {
                newDetails[index].price = value;
            }
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
        // Удаляем все символы, кроме цифр
        const sanitizedValue = value.replace(/[^0-9]/g, '');
        const points = sanitizedValue ? Number(sanitizedValue) : 0;
        // Ограничиваем покупку до 100,000 points
        if (points <= 100000) {
            setBuyPoints(points);
        } else {
            setBuyPoints(100000); // Устанавливаем максимум, если превышает
        }
    };

    // Обработчик изменения значения для продажи
    const handleSellPointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Удаляем все символы, кроме цифр
        const sanitizedValue = value.replace(/[^0-9]/g, '');
        const points = sanitizedValue ? Number(sanitizedValue) : 0;
        // Ограничиваем продажу до количества points у пользователя
        if (points <= user.points) {
            setSellPoints(points);
        } else {
            setSellPoints(user.points); // Устанавливаем максимум, если превышает
        }
    };

    // Удаление банковских реквизитов из списка для покупки
    const handleRemoveBankDetailForBuy = (index: number) => {
        setSelectedBankDetailsForBuy((prevDetails) => {
            const newDetails = [...prevDetails];
            newDetails.splice(index, 1);
            return newDetails;
        });
    };

    // Удаление банковских реквизитов из списка для продажи
    const handleRemoveBankDetailForSell = (index: number) => {
        setSelectedBankDetailsForSell((prevDetails) => {
            const newDetails = [...prevDetails];
            newDetails.splice(index, 1);
            return newDetails;
        });
    };

    // Добавление всех банковских реквизитов для покупки
    const handleAddAllBankDetailsForBuy = () => {
        const allDetails = user.bankDetails.map((detail: any) => ({ ...detail, price: 0 }));
        setSelectedBankDetailsForBuy(allDetails);
    };

    // Удаление всех банковских реквизитов для покупки
    const handleRemoveAllBankDetailsForBuy = () => {
        setSelectedBankDetailsForBuy([]);
    };

    // Добавление всех банковских реквизитов для продажи
    const handleAddAllBankDetailsForSell = () => {
        const allDetails = user.bankDetails.map((detail: any) => ({ ...detail, price: 0 }));
        setSelectedBankDetailsForSell(allDetails);
    };

    // Удаление всех банковских реквизитов для продажи
    const handleRemoveAllBankDetailsForSell = () => {
        setSelectedBankDetailsForSell([]);
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
                        type="text"
                        value={buyPoints}
                        onChange={handleBuyPointsChange}
                        placeholder="Сколько хотите купить"
                        className="mb-2"
                    />
                    <div className="flex items-center space-x-2 mb-2">
                        <select
                            value={selectedBuyOption}
                            onChange={handleSelectBankDetailForBuy}
                            className="flex-grow w-[50%] p-2 border rounded"
                        >
                            <option value="">Выберите реквизиты банка</option>
                            {user.bankDetails && user.bankDetails.map((detail, index) => (
                                <option key={index} value={detail.name}>
                                    {detail.name} - {detail.details}
                                </option>
                            ))}
                        </select>
                        <Button onClick={handleAddAllBankDetailsForBuy} className="whitespace-nowrap">
                            Добавить все
                        </Button>
                        <Button onClick={handleRemoveAllBankDetailsForBuy} className="whitespace-nowrap">
                            Удалить все
                        </Button>
                    </div>
                    {/*Создание реквизитов банка с price для покупки*/}
                    {selectedBankDetailsForBuy.map((detail, index) => (
                        <div key={index} className="mt-1 border border-gray-300 rounded p-2">
                            <div className="flex items-center mt-1 w-full">
                                <span className="flex-shrink-0">1 Point =</span>
                                <Input
                                    type="text"
                                    value={detail.price.toString().replace('.', ',')}
                                    onChange={(e) => {
                                        let value = e.target.value;
                                        value = value.replace('.', ',');
                                        const regex = /^\d*[,]?\d*$/;
                                        if (regex.test(value)) {
                                            handlePriceChangeForBuy(index, value);
                                        }
                                    }}
                                    className="h-7 ml-2"
                                />
                                <Button
                                    onClick={() => handleRemoveBankDetailForBuy(index)}
                                    className="ml-2"
                                >
                                    Удалить
                                </Button>
                            </div>
                            <div className="flex items-center w-full">
                                <span className="flex-grow mt-1">{detail.name} - {detail.details}</span>
                            </div>
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
                    <Button onClick={handleCreateBuyOrder} className="w-full"
                            disabled={isCreateOrderDisabled(buyPoints, selectedBankDetailsForBuy)}>Создать
                        заявку</Button>
                </div>
                <div className="w-1/2">
                    <h2 className="text-xl font-bold mb-2">Продать Points</h2>
                    <Input
                        type="text"
                        value={sellPoints}
                        onChange={handleSellPointsChange}
                        placeholder="Сколько хотите продать"
                        className="mb-2"
                    />
                    <div className="flex items-center space-x-2 mb-2">
                        <select
                            value={selectedSellOption}
                            onChange={handleSelectBankDetailForSell}
                            className="flex-grow w-[50%] p-2 border rounded"
                        >
                            <option value="">Выберите реквизиты банка</option>
                            {user.bankDetails && user.bankDetails.map((detail, index) => (
                                <option key={index} value={detail.name}>
                                    {detail.name} - {detail.details}
                                </option>
                            ))}
                        </select>
                        <Button onClick={handleAddAllBankDetailsForSell} className="whitespace-nowrap">
                            Добавить все
                        </Button>
                        <Button onClick={handleRemoveAllBankDetailsForSell} className="whitespace-nowrap">
                            Удалить все
                        </Button>
                    </div>
                    {/*Создание реквизитов банка с price для продажи*/}
                    {selectedBankDetailsForSell.map((detail, index) => (
                        <div key={index} className="mt-1 border border-gray-300 rounded p-2">
                            <div className="flex items-center mt-1 w-full">
                                <span className="flex-shrink-0">1 Point =</span>
                                <Input
                                    type="text"
                                    value={detail.price.toString().replace('.', ',')}
                                    onChange={(e) => {
                                        let value = e.target.value;
                                        value = value.replace('.', ',');
                                        const regex = /^\d*[,]?\d*$/;
                                        if (regex.test(value)) {
                                            handlePriceChangeForSell(index, value);
                                        }
                                    }}
                                    className="h-7 ml-2"
                                />
                                <Button
                                    onClick={() => handleRemoveBankDetailForSell(index)}
                                    className="ml-2"
                                >
                                    Удалить
                                </Button>
                            </div>
                            <div className="flex items-center w-full">
                                <span className="flex-grow mt-1">{detail.name} - {detail.details}</span>
                            </div>
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
                    <Button onClick={handleCreateSellOrder} className="w-full"
                            disabled={isCreateOrderDisabled(sellPoints, selectedBankDetailsForSell)}>Создать
                        заявку</Button>
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
                            <select onChange={(e) => handleSelectBankDetailForInteraction(e.target.value)} className="mb-2">
                                <option value="">Выберите реквизиты банка для сделки</option>
                                {order.orderBankDetails && order.orderBankDetails.map((detail, index) => (
                                    <option key={index} value={detail.name}>
                                        {detail.name} - {detail.details}
                                    </option>
                                ))}
                            </select>
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
