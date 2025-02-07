"use client";
import React, { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { OrderP2P, User } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { confirmBuyOrderUser2, confirmBuyOrderCreator, confirmSellOrderUser2, confirmSellOrderCreator } from '@/app/actions';

interface OrderP2PWithUser extends OrderP2P {
    orderP2PUser1: {
        id: number;
        cardId: string;
    };
    orderP2PUser2?: {
        id: number;
        cardId: string;
    };
}

interface Props {
    user: User;
    openOrders: OrderP2P[];
    className?: string;
}

export const OrderP2PPending: React.FC<Props> = ({ user, openOrders, className }) => {
    const [orders, setOpenOrders] = useState<OrderP2PWithUser[]>(openOrders as OrderP2PWithUser[]);

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

    return (
        <div className={className}>
            <Accordion className="border border-gray-300 mt-4" type="multiple">
                {orders.map((order) => (
                    <AccordionItem key={order.id} value={order.id.toString()}>
                        <AccordionTrigger>
                            <Table>
                                <TableBody>
                                    <TableRow className="no-hover-bg">
                                        <TableCell className="w-1/4">{order.orderP2PUser1.cardId}</TableCell>
                                        <TableCell className="w-1/4">
                                            хочет {order.orderP2PBuySell === 'BUY' ? 'купить' : 'продать'}
                                        </TableCell>
                                        <TableCell className="w-1/4">Points: {order.orderP2PPoints}</TableCell>
                                        <TableCell className="w-1/4">{new Date(order.createdAt).toLocaleString()}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </AccordionTrigger>
                        <AccordionContent className="border-b border-gray-200">
                            <div className="flex justify-between">
                                <div>
                                    <p>User1: {order.orderP2PUser1.cardId}</p>
                                    <p>Points: {order.orderP2PPoints}</p>
                                    <Button
                                        onClick={() => handleConfirm(order, true)}
                                        disabled={order.orderP2PCheckUser1 || (order.orderP2PBuySell === 'BUY' && !order.orderP2PCheckUser2)}
                                    >
                                        Подтвердить
                                    </Button>
                                </div>
                                <div>
                                    <p>User2: {order.orderP2PUser2?.cardId || 'Ожидание'}</p>
                                    <p>Points: {order.orderP2PPointsUser2}</p>
                                    <Button
                                        onClick={() => handleConfirm(order, false)}
                                        disabled={order.orderP2PCheckUser2 || (order.orderP2PBuySell === 'SELL' && !order.orderP2PCheckUser1)}
                                    >
                                        Подтвердить
                                    </Button>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
};
