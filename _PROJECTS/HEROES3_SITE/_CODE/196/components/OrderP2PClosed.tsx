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

export const OrderP2PClosed: React.FC<Props> = ({ user, openOrders, className }) => {
    const [orders, setOpenOrders] = useState<OrderP2PWithUser[]>(openOrders as OrderP2PWithUser[]);

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
                                        ЗАКРЫТА
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
};
