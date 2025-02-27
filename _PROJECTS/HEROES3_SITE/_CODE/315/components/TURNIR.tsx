"use client"; // Указываем, что компонент клиентский
import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableRow,
    TableHeader,
    TableHead,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface User {

    fullName: string;
    points: number;
    cardId: string;
    email: string;
    telegram: string | null; // Allow telegram to be null
    telegramView: boolean;
    createdAt: Date;
}

interface Props {
    className?: string;
    user: User;


}

export const TURNIR: React.FC<Props> = ({ className, user }) => {
    return (
        <div>
            123
        </div>
    )
};
