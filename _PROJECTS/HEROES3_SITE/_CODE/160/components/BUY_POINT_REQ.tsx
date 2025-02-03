"use client";
import React, {useEffect, useState} from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableRow,
    TableHeader,
    TableHead,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User } from "@prisma/client";
import { getEmailByCardId, transferPoints } from "@/app/actions";


interface Props {
    user: User;
    className?: string;
}

export const BUY_POINT_REQ: React.FC<Props> = ({ user, className }) => {


    return (
        <div className={`p-4 ${className}`}>


            <Table className="mt-6">
                <TableHeader>
                    <TableRow>

                    </TableRow>
                </TableHeader>
                <TableBody>

                </TableBody>
            </Table>
        </div>
    );
};
