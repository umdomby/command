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

interface orderBankDetail {
    name: string;
    price: string; // или string, в зависимости от вашего использования
    details: string;
    description: string;
}


interface Props {
    user: User;
    openOrders: OrderP2P[]; // Ensure this is an array
    className?: string;
}

export const OrderP2PPending: React.FC<Props> = ({user, openOrders, className}) => {
    const [orders, setOpenOrders] = useState<OrderP2PWithUser[]>(openOrders as OrderP2PWithUser[]);

    return (
        <div className={className}>

        </div>
    );
};
