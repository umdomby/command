"use client"
import React, { useEffect, useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { OrderP2P, User, BuySell, OrderP2PStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
    confirmBuyOrderUser2,
    confirmBuyOrderCreator,
    confirmSellOrderUser2,
    confirmSellOrderCreator,
    closeDealTime
} from '@/app/actions';
import { DateTime } from "next-auth/providers/kakao";

interface OrderP2PWithUser extends OrderP2P {
    orderP2PUser1: {
        id: number;
        cardId: string;
        fullName: string;
    };
    orderP2PUser2?: {
        id: number;
        cardId: string;
        fullName: string;
    };
    id: number;
    orderP2PPrice: number;
    orderP2PPoints: number;
    orderP2PCheckUser1: boolean;
    orderP2PCheckUser2: boolean;
    orderP2PBuySell: BuySell;
    orderP2PUser1Id: number;
    orderP2PUser2Id: number;
    createdAt: DateTime;
    updatedAt: DateTime;
    orderP2PStatus: OrderP2PStatus;
    orderBankDetails: JSON;
}

interface Props {
    openOrders: OrderP2P[];
    className?: string;
    user: User;
}

export const OrderP2PPending: React.FC<Props> = ({ user, openOrders, className }) => {
    const [orders, setOpenOrders] = useState<OrderP2PWithUser[]>(openOrders as OrderP2PWithUser[]);
    const [countdowns, setCountdowns] = useState<{ [key: number]: number }>({});

    useEffect(() => {
        setOpenOrders(openOrders as OrderP2PWithUser[]);
    }, [openOrders]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCountdowns(prevCountdowns => {
                const newCountdowns = { ...prevCountdowns };
                orders.forEach(order => {
                    if (order.orderP2PStatus === "PENDING") {
                        const updatedAt = new Date(order.updatedAt);
                        const now = new Date();
                        const timeDiff = now.getTime() - updatedAt.getTime();
                        const timeLeft = 3600000 - timeDiff; // 60 minutes in milliseconds 3600000
                        newCountdowns[order.id] = Math.max(0, timeLeft);
                    }
                });
                return newCountdowns;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [orders]);

    useEffect(() => {
        Object.entries(countdowns).forEach(([orderId, timeLeft]) => {
            if (timeLeft <= 0) {
                const order = orders.find(o => o.id === parseInt(orderId));
                if (order) {
                    timeCloseDeal(order);
                }
            }
        });
    }, [countdowns, orders]);

    const handleConfirm = async (order: OrderP2PWithUser, isCreator: boolean) => {
        if (order.orderP2PBuySell === 'BUY') {
            if (isCreator) {
                await confirmBuyOrderCreator(order.id);
            } else {
                await confirmBuyOrderUser2(order.id);
            }
        } else {
            if (isCreator) {
                await confirmSellOrderCreator(order.id);
            } else {
                await confirmSellOrderUser2(order.id);
            }
        }
    };

    const timeCloseDeal = async (order: OrderP2PWithUser) => {
        await closeDealTime(order.id);
    };

    const formatTime = (milliseconds: number) => {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    return (
        <div className={className}>
            Points: {user.points}
            <Accordion className="border border-gray-300 mt-4" type="multiple">
                {orders.map((order) => (
                    <AccordionItem key={order.id} value={order.id.toString()}>
                        <AccordionTrigger className={order.orderP2PStatus === "PENDING" && 'bg-gray-400'}>
                            <Table>
                                <TableBody>
                                    <TableRow className="no-hover-bg">
                                        <TableCell className="w-1/4">
                                            <p>
                                                {order.orderP2PUser1.cardId}
                                            </p>
                                        </TableCell>
                                        <TableCell className="w-1/4">{order.orderP2PBuySell === 'BUY' ? 'Покупает' : 'Продаёт'} {order.orderP2PPoints} Points</TableCell>
                                        <TableCell className="w-1/4">
                                            {order.orderP2PStatus === "PENDING" && (
                                                <>
                                                    <p>Сделка ждет завершения: </p>
                                                    <p>
                                                        Закроется через: {formatTime(countdowns[order.id] || 0)}
                                                    </p>
                                                </>
                                            )}
                                            {order.orderP2PStatus === "CLOSED" && <p>Сделка завершена</p>}
                                            {order.orderP2PStatus === "RETURN" && <p>Сделка не состоялась</p>}
                                        </TableCell>
                                        <TableCell className="w-1/4">
                                            <p>
                                                {new Date(order.createdAt).toLocaleString()}
                                            </p>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </AccordionTrigger>
                        <AccordionContent className="border-b border-gray-200 mt-3">
                            <div className="overflow-x-auto">
                                <div className="flex justify-center space-x-4 min-w-[800px]">
                                    <div className="flex flex-col items-center border p-4" style={{ flex: '0 0 23%' }}>
                                        <p>User 1: {order.orderP2PUser1.fullName}</p>
                                        <p>Card ID: {order.orderP2PUser1.cardId}</p>
                                        <p>Price: {order.orderP2PPoints}</p>
                                        <p>Price: {order.orderP2PPrice}</p>
                                        {order.orderP2PBuySell === 'SELL' &&
                                            <Button
                                                onClick={() => handleConfirm(order, true)}
                                                disabled={order.orderP2PUser1Id !== user.id || order.orderP2PCheckUser1 || !order.orderP2PCheckUser2}
                                            >
                                                Перевести Points
                                            </Button>
                                        }

                                        {order.orderP2PBuySell === 'BUY' &&
                                            <Button
                                                onClick={() => handleConfirm(order, true)}
                                                disabled={order.orderP2PUser1Id !== user.id || order.orderP2PCheckUser1 || order.orderP2PCheckUser2}
                                            >
                                                Подтвердить оплату
                                            </Button>
                                        }
                                    </div>

                                    <div className="flex flex-col items-center border p-4" style={{ flex: '0 0 45%' }}>
                                        {order.orderBankDetails.map((detail, index) => (
                                            <div key={index} className="mb-2">
                                                <h3 className="font-bold">{order.orderP2PPrice} {detail.name}</h3>
                                                <p>Price one Point = {detail.price}</p>
                                                <p>Details: {detail.details}</p>
                                                <p>Description: {detail.description}</p>
                                            </div>
                                        ))}
                                        <p>User1: {order.orderP2PUser1.fullName} - {order.orderP2PCheckUser1 ? "Да" : "Нет"}</p>
                                        <p>User2: {order.orderP2PUser2.fullName} - {order.orderP2PCheckUser2 ? "Да" : "Нет"}</p>
                                    </div>

                                    <div className="flex flex-col items-center border p-4" style={{ flex: '0 0 23%' }}>
                                        <p>User 2: {order.orderP2PUser2?.fullName}</p>
                                        <p>Card ID: {order.orderP2PUser2?.cardId || 'Ожидание'}</p>
                                        <p>Price: {order.orderP2PPoints}</p>
                                        <p>Price: {order.orderP2PPrice}</p>

                                        {order.orderP2PBuySell === 'SELL' &&
                                            <Button
                                                onClick={() => handleConfirm(order, false)}
                                                disabled={order.orderP2PUser2Id !== user.id || order.orderP2PCheckUser1 || order.orderP2PCheckUser2}
                                            >
                                                Подтвердить оплату
                                            </Button>
                                        }

                                        {order.orderP2PBuySell === 'BUY' &&
                                            <Button
                                                onClick={() => handleConfirm(order, false)}
                                                disabled={order.orderP2PUser2Id !== user.id || !order.orderP2PCheckUser1 || order.orderP2PCheckUser2}
                                            >
                                                Перевести Points
                                            </Button>
                                        }
                                    </div>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
};
