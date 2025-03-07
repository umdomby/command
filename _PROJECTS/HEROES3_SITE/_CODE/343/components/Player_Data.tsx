'use client';

import React from 'react';
import {Suspense} from 'react';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {Container} from "@/components/container";
import {Player} from "@prisma/client";
import Link from "next/link";
import {Button} from "@/components/ui";


interface Props {
    playerData: Player
    className?: string;
}

export const Player_Data: React.FC<Props> = ({playerData}) => {

    return (

        <div>
            <Link href="/player">
                <Button className="mx-5 h-5">ИГРОКИ</Button>
            </Link>
            <Link href="/tournament">
                <Button className="mx-5 h-5">ТУРНИРЫ HEROES HUB</Button>
            </Link>
            <div>
                {playerData.name}
            </div>
        </div>

    );
};

