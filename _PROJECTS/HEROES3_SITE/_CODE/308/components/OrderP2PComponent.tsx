"use client";
import React, {useEffect, useState} from 'react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {Table, TableBody, TableCell, TableHead, TableRow} from "@/components/ui/table";
import {OrderP2P, User} from "@prisma/client";
import {
    closeBuyOrderOpen,
    closeSellOrderOpen,
    createBuyOrder,
    createSellOrder,
    openBuyOrder,
    openSellOrder,
    getOpenOrders,
} from '@/app/actions';
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import Link from "next/link";

interface OrderP2PWithUser extends OrderP2P {
    orderP2PUser1: {
        id: number;
        cardId: string;
        telegram: string;
    };
    orderP2PUser2?: {
        id: number;
        cardId: string;
        telegram: string;
    };
}

interface BankDetail {
    name: string;
    price: string;
    details: string;
    description: string;
}

interface orderBankDetail {
    name: string;
    price: string; // или string, в зависимости от вашего использования
    details: string;
    description: string;
}

interface CourseValuta {
    USD: number;
    EUR: number;
    BEL: number;
    RUS: number;
    BTC: number;
    USTD: number;
}

// Интерфейс для свойств компонента
interface Props {
    user: User;
    openOrders: OrderP2P[];
    pendingOrdersCount: number;
    className?: string;
    exchangeRates: CourseValuta | null; // Add this line
}

// Компонент для работы с P2P заказами
export const OrderP2PComponent: React.FC<Props> = ({user, openOrders, pendingOrdersCount, className, exchangeRates}) => {
    const [orders, setOpenOrders] = useState<OrderP2PWithUser[]>(openOrders as OrderP2PWithUser[]);
    const [buyOrderSuccess, setBuyOrderSuccess] = useState<boolean>(false); // уведомление о создании заявки
    const [sellOrderSuccess, setSellOrderSuccess] = useState<boolean>(false); // уведомление о создании заявки
    const [errorMessage, setErrorMessage] = useState<string | null>(null);// о уже созданном Buy
    const [buyPoints, setBuyPoints] = useState<number>(0); // Количество очков для покупки
    const [sellPoints, setSellPoints] = useState<number>(0); // Количество очков для продажи
    const [buyPointsError, setBuyPointsError] = useState<string | null>(null);
    const [sellPointsError, setSellPointsError] = useState<string | null>(null);
    const [selectedBankDetailsForBuy, setSelectedBankDetailsForBuy] = useState<any[]>([]); // Выбранные банковские реквизиты для покупки
    const [selectedBankDetailsForSell, setSelectedBankDetailsForSell] = useState<any[]>([]); // Выбранные банковские реквизиты для продажи
    const [allowPartialBuy, setAllowPartialBuy] = useState<boolean>(false); // Разрешить частичную покупку
    const [allowPartialSell, setAllowPartialSell] = useState<boolean>(false); // Разрешить частичную продажу
    const [selectedBankDetailsForInteraction, setSelectedBankDetailsForInteraction] = useState<any[]>([]); // Выбранные банковские реквизиты для взаимодействия
    const [selectedBuyOption, setSelectedBuyOption] = useState<string>(''); // Текущее выбранное значение для покупки
    const [selectedSellOption, setSelectedSellOption] = useState<string>(''); // Текущее выбранное значение для продажи
    const [successMessage, setSuccessMessage] = useState<string | null>(null); // Состояние для управления сообщением об успешном закрытии сделки
    const [calculatedValues, setCalculatedValues] = useState<{ [key: number]: number | null }>({}); // Состояние для хранения результата умножения
    const [selectedBankDetails, setSelectedBankDetails] = useState<{ [key: number]: string }>({});
    const [currentPendingCount, setCurrentPendingCount] = useState<number>(pendingOrdersCount);
    const [dealSuccessMessage, setDealSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        setOpenOrders(openOrders as OrderP2PWithUser[]);
    }, [openOrders]);

    useEffect(() => {
        const eventSource = new EventSource(`/api/order-p2p?userId=${user.id}`);

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setOpenOrders(data.openOrders as OrderP2PWithUser[]);
                setCurrentPendingCount(data.pendingOrdersCount); // Обновляем значение из SSE
            } catch (error) {
                console.error('Error parsing SSE data:', error);
            }
        };

        eventSource.onerror = (error) => {
            console.error('SSE error:', error);
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, [user.id]);

    // Обработчик выбора банковских реквизитов для покупки
    const handleSelectBankDetailForBuy = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = event.target.value;
        setSelectedBuyOption(selectedValue);

        if (Array.isArray(user.bankDetails)) {
            const detail = user.bankDetails.find((d: any) => d.name === selectedValue);
            if (isBankDetail(detail)) { // Use the type guard here
                const orderDetail: orderBankDetail = {
                    name: detail.name,
                    price: detail.price, // Устанавливаем начальную цену из BankDetail
                    details: detail.details,
                    description: detail.description,
                };
                setSelectedBankDetailsForBuy((prevDetails) => {
                    if (prevDetails.some((d) => d.name === orderDetail.name)) {
                        return prevDetails.filter((d) => d.name !== orderDetail.name);
                    } else {
                        return [...prevDetails, orderDetail];
                    }
                });
            }
        }
        setSelectedBuyOption('');
    };

    // Обработчик выбора банковских реквизитов для продажи
    const handleSelectBankDetailForSell = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = event.target.value;
        setSelectedSellOption(selectedValue);

        if (Array.isArray(user.bankDetails)) {
            const detail = user.bankDetails.find((d: any) => d.name === selectedValue);
            if (isBankDetail(detail)) { // Use the type guard here
                const orderDetail: orderBankDetail = {
                    name: detail.name,
                    price: detail.price, // Устанавливаем начальную цену из BankDetail
                    details: detail.details,
                    description: detail.description,
                };
                setSelectedBankDetailsForSell((prevDetails) => {
                    if (prevDetails.some((d) => d.name === orderDetail.name)) {
                        return prevDetails.filter((d) => d.name !== orderDetail.name);
                    } else {
                        return [...prevDetails, orderDetail];
                    }
                });
            }
        }
        setSelectedSellOption('');
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
            const result = await createBuyOrder(buyPoints, selectedBankDetailsForBuy, allowPartialBuy);
            if (result.success) {
                setBuyOrderSuccess(true);
                setSelectedBankDetailsForBuy([]); // Очищаем выбранные банковские реквизиты
                setTimeout(() => setBuyOrderSuccess(false), 3000); // Скрыть сообщение через 3 секунды
            } else {
                if (result.message) {
                    setErrorMessage(result.message); // Устанавливаем сообщение об ошибке
                } else {
                    setErrorMessage('Неизвестная ошибка'); // Устанавливаем сообщение по умолчанию
                }
                setTimeout(() => setErrorMessage(null), 3000); // Скрыть сообщение через 3 секунды
            }
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
            setSellOrderSuccess(true);
            setSelectedBankDetailsForSell([]); // Очищаем выбранные банковские реквизиты
            setTimeout(() => setSellOrderSuccess(false), 3000); // Скрыть сообщение через 3 секунды
        } catch (error) {
            console.error('Ошибка при создании заявки на продажу:', error);
            alert('Не удалось создать заявку на продажу');
        }
    };

    // Обработчик заключения сделки покупки
    const handleConcludeDealBuy = async (order: OrderP2P) => {
        if (order.orderP2PUser1Id === user.id) {
            alert('Вы не можете заключать сделку с самим собой');
            return;
        }
        try {
            const bankDetails = selectedBankDetails[order.id];
            const price = calculatedValues[order.id];
            const points = order.orderP2PPoints;

            // Проверяем, что price не равен null или undefined
            if (price !== undefined && price !== null) {
                await openBuyOrder(order.id, user.id, bankDetails, price, points);
                setDealSuccessMessage('Сделка успешно заключена, перейдите в раздел: P2P PENDING');
                setTimeout(() => setDealSuccessMessage(null), 3000); // Hide the message after 3 seconds
            } else {
                alert('Пожалуйста, выберите действительные банковские реквизиты и цену');
            }
        } catch (error) {
            console.error('Ошибка при заключении сделки:', error);
            alert('Не удалось заключить сделку');
        }
    };

    // Обработчик заключения сделки продажи
    const handleConcludeDealSell = async (order: OrderP2P) => {
        if (order.orderP2PUser1Id === user.id) {
            alert('Вы не можете заключать сделку с самим собой');
            return;
        }
        try {
            const bankDetails = selectedBankDetails[order.id];
            const price = calculatedValues[order.id];

            // Проверяем, что price не равен null или undefined
            if (price !== undefined && price !== null) {
                await openSellOrder(order.id, user.id, bankDetails, price);
                setDealSuccessMessage('Сделка успешно заключена, перейдите в раздел: P2P PENDING');
                setTimeout(() => setDealSuccessMessage(null), 3000); // Hide the message after 3 seconds
            } else {
                alert('Пожалуйста, выберите действительные банковские реквизиты и цену');
            }
        } catch (error) {
            console.error('Ошибка при заключении сделки:', error);
            alert('Не удалось заключить сделку');
        }
    };

    // Проверка, можно ли создать заявку
    const isCreateOrderDisabled = (points: number) => {
        return points < 30;
    };

    // Обработчик изменения значения для покупки
    const handleBuyPointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const sanitizedValue = value.replace(/[^0-9]/g, '');

        // Если поле пустое, устанавливаем 0
        if (sanitizedValue === '') {
            setBuyPoints(0);
            setBuyPointsError('Минимальное количество для покупки - 30');
            return;
        }

        const points = Number(sanitizedValue);
        setBuyPoints(points);

        if (points < 30) {
            setBuyPointsError('Минимальное количество для покупки - 30');
        } else if (points > 100000) {
            setBuyPointsError('Максимальное количество для покупки - 100,000');
            setBuyPoints(100000);
        } else {
            setBuyPointsError(null);
        }
    };

    // Обработчик изменения значения для продажи
    const handleSellPointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const sanitizedValue = value.replace(/[^0-9]/g, '');

        // Если поле пустое, устанавливаем 0
        if (sanitizedValue === '') {
            setSellPoints(0);
            setSellPointsError('Минимальное количество для продажи - 30');
            return;
        }

        const points = Number(sanitizedValue);

        if (points > user.points) {
            setSellPoints(user.points);
            setSellPointsError('Вы не можете продать больше, чем у вас есть points');
        } else if (points < 30) {
            setSellPoints(points);
            setSellPointsError('Минимальное количество для продажи - 30');
        } else {
            setSellPoints(points);
            setSellPointsError(null);
        }
    };

    // Обработчик потери фокуса для покупки
    const handleBuyPointsBlur = () => {
        if (buyPoints < 30) {
            setBuyPointsError('Минимальное количество для покупки - 30');
        } else {
            setBuyPointsError(null);
        }
    };

    // Обработчик потери фокуса для продажи
    const handleSellPointsBlur = () => {
        if (sellPoints > user.points) {
            setSellPoints(user.points); // Устанавливаем значение в максимальное количество Points
            setSellPointsError('Вы не можете продать больше, чем у вас есть points');
        } else if (sellPoints < 30) {
            setSellPointsError('Минимальное количество для продажи - 30');
        } else {
            setSellPointsError(null);
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
        if (Array.isArray(user.bankDetails)) {
            const allDetails = user.bankDetails.map((detail: any) => ({
                name: detail.name,
                price: detail.price, // Устанавливаем начальную цену из BankDetail
                details: detail.details,
                description: detail.description,
            }));
            setSelectedBankDetailsForBuy(allDetails);
        } else {
            alert('Нет доступных банковских реквизитов для добавления.');
        }
    };

    // Удаление всех банковских реквизитов для покупки
    const handleRemoveAllBankDetailsForBuy = () => {
        setSelectedBankDetailsForBuy([]);
    };

    // Добавление всех банковских реквизитов для продажи
    const handleAddAllBankDetailsForSell = () => {
        if (Array.isArray(user.bankDetails)) {
            const allDetails = user.bankDetails.map((detail: any) => ({
                name: detail.name,
                price: detail.price, // Устанавливаем начальную цену из BankDetail
                details: detail.details,
                description: detail.description,
            }));
            setSelectedBankDetailsForSell(allDetails);
        } else {
            alert('Нет доступных банковских реквизитов для добавления.');
        }
    };

    // Удаление всех банковских реквизитов для продажи
    const handleRemoveAllBankDetailsForSell = () => {
        setSelectedBankDetailsForSell([]);
    };

    // Защита типов для проверки, является ли объект BankDetail
    const isBankDetail = (detail: any): detail is BankDetail => {
        return detail && typeof detail.name === 'string' && typeof detail.details === 'string';
    };

    const handleCloseBuyOrder = async (order: OrderP2P) => {
        if (order.orderP2PUser1Id !== user.id) {
            alert('Вы не можете закрыть чужую сделку');
            return;
        }

        // Show confirmation dialog
        const confirmClose = window.confirm('Вы уверены, что хотите закрыть свою сделку покупки?');
        if (!confirmClose) {
            return; // Exit if the user cancels
        }

        try {
            const success = await closeBuyOrderOpen(order.id);
            if (success) {
                setSuccessMessage('Сделка покупки успешно закрыта');
                setTimeout(() => setSuccessMessage(null), 2000); // Скрыть сообщение через 2 секунды
            }
        } catch (error) {
            console.error('Ошибка при закрытии сделки покупки:', error);
        }
    };

    const handleCloseSellOrder = async (order: OrderP2P) => {
        if (order.orderP2PUser1Id !== user.id) {
            alert('Вы не можете закрыть чужую сделку');
            return;
        }

        // Show confirmation dialog
        const confirmClose = window.confirm('Вы уверены, что хотите закрыть свою сделку продажи?');
        if (!confirmClose) {
            return; // Exit if the user cancels
        }

        try {
            const success = await closeSellOrderOpen(order.id);
            if (success) {
                setSuccessMessage('Сделка продажи успешно закрыта');
                setTimeout(() => setSuccessMessage(null), 2000); // Скрыть сообщение через 2 секунды
            }
        } catch (error) {
            console.error('Ошибка при закрытии сделки продажи:', error);
        }
    };

    // Обработчик выбора банковских реквизитов для взаимодействия
    const handleSelectBankDetailForInteraction = (selectedValue: string, order: OrderP2P) => {
        setSelectedBankDetails((prev) => ({...prev, [order.id]: selectedValue})); // Сохраняем выбранное значение
        if (!selectedValue) {
            setCalculatedValues((prev) => ({...prev, [order.id]: null}));
            return;
        }
        const detail = JSON.parse(selectedValue);
        if (detail && typeof detail.price === 'string') {
            const price = parseFloat(detail.price.replace(',', '.'));
            if (!isNaN(price) && order.orderP2PPoints !== null && order.orderP2PPoints !== undefined) {
                setCalculatedValues((prev) => ({...prev, [order.id]: order.orderP2PPoints! * price}));
            } else {
                setCalculatedValues((prev) => ({...prev, [order.id]: null}));
            }
        } else {
            setCalculatedValues((prev) => ({...prev, [order.id]: null}));
        }
    };

    // Функция для вычисления времени авто-закрытия
    const getAutoCloseTime = (updatedAt: Date) => {
        const autoCloseDate = new Date(updatedAt);
        autoCloseDate.setHours(autoCloseDate.getHours() + 1);
        //autoCloseDate.setMinutes(autoCloseDate.getMinutes() + 1); // Add 5 minutes (300 seconds)
        return autoCloseDate.toLocaleString();
    };


    return (
        <div className={className}>
            <div>Points: {Math.floor(user.points * 100) / 100}</div>
            <div className="text-center"> {exchangeRates && (
                <div className="marquee">
                        <span className="text-green-500">USD: {exchangeRates.USD} </span>
                        <span className="text-fuchsia-500">EUR: {exchangeRates.EUR} </span>
                        <span className="text-amber-500">BEL: {exchangeRates.BEL} </span>
                        <span className="text-yellow-500">RUS: {exchangeRates.RUS} </span>
                        <span className="text-emerald-500">BTC: {exchangeRates.BTC} </span>
                        <span className="text-blue-500">USTD: {exchangeRates.USTD} </span>
                </div>
            )}</div>

            <div className="flex justify-between items-center m-7">
                <h1>P2P</h1>
                <div>
                    <Link href="/order-p2p-pending">
                        <span className="text-blue-500 hover:underline">
                            P2P PENDING : {currentPendingCount}
                        </span>
                    </Link>
                </div>
                <div>
                    <Link href="/order-p2p-closed">
                        <span className="text-blue-500 hover:underline">
                            P2P Closed
                        </span>
                    </Link>
                </div>
            </div>

            <div className={`flex-container ${className}`}>
                <div className="buy-section mr-1 ml-1">
                    <h2 className="text-xl font-bold mb-2 text-amber-500">Купить Points (min 30)</h2>
                    <Input
                        type="text"
                        value={buyPoints}
                        onChange={handleBuyPointsChange}
                        onBlur={handleBuyPointsBlur}
                        placeholder="Сколько хотите купить"
                        className="mb-2"
                    />
                    {buyPointsError && <p className="text-red-500">{buyPointsError}</p>}
                    <div className="flex items-center space-x-2 mb-2">
                        <select
                            value={selectedBuyOption}
                            onChange={handleSelectBankDetailForBuy}
                            className="flex-grow w-[50%] p-2 border rounded"
                        >
                            <option value="">Выберите реквизиты банка</option>
                            {Array.isArray(user.bankDetails) && user.bankDetails.map((detail, index) => {
                                if (isBankDetail(detail)) {
                                    return (
                                        <option key={index} value={detail.name}>
                                            {detail.name} - {detail.details} - {detail.price}
                                        </option>
                                    );
                                }
                                return null;
                            })}
                        </select>
                        <Button onClick={handleAddAllBankDetailsForBuy} className="whitespace-nowrap">
                            Добавить все
                        </Button>
                        <Button onClick={handleRemoveAllBankDetailsForBuy} className="whitespace-nowrap">
                            Удалить все
                        </Button>
                    </div>
                    {selectedBankDetailsForBuy.map((detail, index) => (
                        <div key={index} className="mt-1 border border-gray-300 rounded p-2">
                            <div className="flex items-center mt-1 w-full">
                                <span className="flex-shrink-0">1 Point =</span>
                                <Input
                                    type="text"
                                    value={detail.price.toString().replace('.', ',') || detail.price}
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
                <span
                    className="flex-grow mt-1">{detail.name} - {detail.details}, Цена за 1 Point: {detail.price}</span>
                            </div>
                        </div>
                    ))}
                    <Button
                        onClick={handleCreateBuyOrder}
                        className={`w-full ${buyOrderSuccess ? 'button-success' : ''}`}
                        disabled={selectedBankDetailsForBuy.length === 0 || isCreateOrderDisabled(buyPoints)}
                    >
                        {buyOrderSuccess ? 'Заявка создана!' : 'Создать заявку'}
                    </Button>
                </div>
                <div className="sell-section mr-1 ml-1">
                    <h2 className="text-xl font-bold mb-2 text-amber-500">Продать Points (min 30)</h2>
                    <Input
                        type="text"
                        value={sellPoints}
                        onChange={handleSellPointsChange}
                        onBlur={handleSellPointsBlur}
                        placeholder="Сколько хотите продать"
                        className="mb-2"
                    />
                    {sellPointsError && <p className="text-red-500">{sellPointsError}</p>}
                    <div className="flex items-center space-x-2 mb-2">
                        <select
                            value={selectedSellOption}
                            onChange={handleSelectBankDetailForSell}
                            className="flex-grow w-[50%] p-2 border rounded"
                        >
                            <option value="">Выберите реквизиты банка</option>
                            {Array.isArray(user.bankDetails) && user.bankDetails.map((detail, index) => {
                                if (isBankDetail(detail)) {
                                    return (
                                        <option key={index} value={detail.name}>
                                            {detail.name} - {detail.details} - {detail.price}
                                        </option>
                                    );
                                }
                                return null;
                            })}
                        </select>
                        <Button onClick={handleAddAllBankDetailsForSell} className="whitespace-nowrap">
                            Добавить все
                        </Button>
                        <Button onClick={handleRemoveAllBankDetailsForSell} className="whitespace-nowrap">
                            Удалить все
                        </Button>
                    </div>
                    {selectedBankDetailsForSell.map((detail, index) => (
                        <div key={index} className="mt-1 border border-gray-300 rounded p-2">
                            <div className="flex items-center mt-1 w-full">
                                <span className="flex-shrink-0">1 Point =</span>
                                <Input
                                    type="text"
                                    value={detail.price.toString().replace('.', ',') || detail.price}
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
                <span
                    className="flex-grow mt-1">{detail.name} - {detail.details}, Цена за 1 Point: {detail.price}</span>
                            </div>
                        </div>
                    ))}
                    <Button
                        onClick={handleCreateSellOrder}
                        className={`w-full ${sellOrderSuccess ? 'button-success' : ''}`}
                        disabled={selectedBankDetailsForSell.length === 0 || isCreateOrderDisabled(sellPoints)}
                    >
                        {sellOrderSuccess ? 'Заявка создана!' : 'Создать заявку'}
                    </Button>
                </div>
            </div>
            <Table className="mt-5">
                <TableBody>
                    <TableRow>
                        <TableCell className="w-[20%] text-center">Telegram</TableCell>
                        <TableCell className="w-[15%] text-center">BUY/SELL</TableCell>
                        <TableCell className="w-[10%] text-center">Points</TableCell>
                        <TableCell className="w-[15%] text-center">State</TableCell>
                        <TableCell className="w-[15%] text-center">Date</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
            <Accordion className="border border-gray-300 mt-1" type="multiple">
                {orders.map((order) => (
                    <AccordionItem
                        key={order.id}
                        value={order.id.toString()}
                        className="text-green-500"
                    >
                        <AccordionTrigger className={user.id === order.orderP2PUser1.id ? 'text-amber-500' : ''}>
                            <Table>
                                <TableBody>
                                    <TableRow className="no-hover-bg">
                                        <TableCell
                                            className="w-[20%] text-center "><Link
                                            className="ml-3 text-blue-500 hover:text-green-300 font-bold"
                                            href={order.orderP2PUser1.telegram.replace(/^@/, 'https://t.me/')}
                                            target="_blank">{order.orderP2PUser1.telegram}</Link></TableCell>

                                        <TableCell
                                            className="w-[15%] text-center">{order.orderP2PBuySell === 'BUY' ? 'Покупает' : 'Продаёт'} </TableCell>
                                        <TableCell className="w-[10%] text-center">{order.orderP2PPoints} </TableCell>
                                        <TableCell className="w-[15%] text-center">
                                            <p>
                                                {order.orderP2PStatus}
                                            </p>
                                        </TableCell>
                                        <TableCell className="w-[15%] text-center">
                                            <p>
                                                {new Date(order.createdAt).toLocaleString()}
                                            </p>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </AccordionTrigger>
                        <AccordionContent className="border-b border-gray-200">
                            <div className="font-bold ml-1"> Points: {order.orderP2PPoints} </div>
                            <div className="font-bold ml-1"> CardID {order.orderP2PUser1.cardId}</div>
                            <Table>
                                <TableBody>
                                    <TableRow className="no-hover-bg">
                                        <TableCell>
                                            {Array.isArray(order.orderBankDetails) && order.orderBankDetails.length > 0 ? (
                                                order.orderBankDetails.map((detail, index) => {
                                                    if (detail && typeof detail === 'object' && 'name' in detail && 'price' in detail && 'details' in detail && 'description' in detail) {
                                                        const bankDetail: orderBankDetail = {
                                                            name: typeof detail.name === 'string' ? detail.name : '',
                                                            price: typeof detail.price === 'string' ? detail.price : '',
                                                            details: typeof detail.details === 'string' ? detail.details : '',
                                                            description: typeof detail.description === 'string' ? detail.description : '',
                                                        };
                                                        return (
                                                            <div key={index} className="flex py-2">
                                                                <div style={{width: '35%'}}>
                                                                    <div>
                                                                        <strong>{bankDetail.price}</strong> за one Point
                                                                    </div>
                                                                    <div>
                                                                        <strong>{bankDetail.name}</strong>
                                                                    </div>
                                                                </div>
                                                                <div style={{width: '65%'}}>
                                                                    <div>
                                                                        {bankDetail.details}
                                                                    </div>
                                                                    <div>
                                                                        {bankDetail.description}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })
                                            ) : (
                                                <div>Нет доступных банковских реквизитов</div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                            <select
                                value={selectedBankDetails[order.id] || ''} // Устанавливаем значение из состояния
                                onChange={(e) => handleSelectBankDetailForInteraction(e.target.value, order)}
                                className="mb-2"
                            >
                                <option value="">Выберите реквизиты банка для сделки</option>
                                {Array.isArray(order.orderBankDetails) && order.orderBankDetails.length > 0 ? (
                                    order.orderBankDetails.map((detail, index) => {
                                        if (detail && typeof detail === 'object' && 'price' in detail && 'name' in detail && 'details' in detail) {
                                            const price = typeof detail.price === 'string' ? detail.price : '';
                                            const name = typeof detail.name === 'string' ? detail.name : '';
                                            // const details = typeof detail.details === 'string' ? detail.details : '';

                                            return (
                                                <option key={index} value={JSON.stringify(detail)}>
                                                    one Point: {price} - {name}
                                                    {/*- {details}*/}
                                                </option>
                                            );
                                        }
                                        return null;
                                    })
                                ) : (
                                    <option disabled>Нет доступных банковских реквизитов</option>
                                )}
                            </select>
                            {calculatedValues[order.id] !== undefined && calculatedValues[order.id] !== null && (
                                <span className="ml-3 h-6 text-lg font-semibold">
                  Итоговая сумма: {calculatedValues[order.id]}
                </span>
                            )}
                            <div className="text-center">
                                {order.orderP2PBuySell === 'BUY' && order.orderP2PUser1Id === user.id && (
                                    <Button className="ml-3 h-6" onClick={() => handleCloseBuyOrder(order)}>
                                        Закрыть сделку покупки
                                    </Button>
                                )}
                                {order.orderP2PBuySell === 'SELL' && order.orderP2PUser1Id === user.id && (
                                    <Button className="ml-3 h-6" onClick={() => handleCloseSellOrder(order)}>
                                        Закрыть сделку продажи
                                    </Button>
                                )}
                                {order.orderP2PBuySell === 'BUY' && order.orderP2PUser1Id !== user.id && (
                                    <Button
                                        className="ml-3 h-6"
                                        onClick={() => handleConcludeDealBuy(order)}
                                        disabled={calculatedValues[order.id] === undefined || calculatedValues[order.id] === null}
                                    >
                                        Заключить сделку -{order.orderP2PPoints} Points
                                    </Button>
                                )}
                                {order.orderP2PBuySell === 'SELL' && order.orderP2PUser1Id !== user.id && (
                                    <Button className="ml-3 h-6"
                                            onClick={() => handleConcludeDealSell(order)}
                                            disabled={calculatedValues[order.id] === undefined || calculatedValues[order.id] === null}
                                    >
                                        Заключить сделку
                                    </Button>
                                )}
                                <div className="text-center">
                                    Автозакрытие сделки начнется: {getAutoCloseTime(order.updatedAt)}, (обновить) +1 час
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>

            {successMessage && (
                <div className="relative">
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 p-2 mb-4 rounded mt-4">
                        {successMessage}
                    </div>
                </div>
            )}

            {dealSuccessMessage && (
                <div className="relative">
                    <div
                        className="absolute top-0 left-1/2 transform -translate-x-1/2 p-2 mb-4 rounded mt-4 bg-green-500 text-white">
                        {dealSuccessMessage}
                    </div>
                </div>
            )}

            {errorMessage && (
                <div className="relative">
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 p-2 mb-4 rounded mt-4 bg-red-500 text-white">
                        {errorMessage}
                    </div>
                </div>
            )}
        </div>
    );
};
