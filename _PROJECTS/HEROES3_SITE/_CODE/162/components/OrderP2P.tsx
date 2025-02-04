"use client";
import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableRow,
} from "@/components/ui/table";
import {User} from "@prisma/client";


interface Props {
    user: User;
}

export const OrderP2P: React.FC<Props> = ({ user }) => {
    return (
        <div>
            <div className="flex justify-between items-center">
                <div>
                    <p>Points: {Math.floor(user.points * 100) / 100}</p>
                </div>
            </div>
            <Table>
                <TableBody>
                    <TableRow>

                        <TableCell
                            className="text-ellipsis overflow-hidden whitespace-nowrap w-[25%]">
                        </TableCell>

                        <TableCell
                            className="text-ellipsis overflow-hidden whitespace-nowrap w-[25%]">
                        </TableCell>

                        <TableCell className="w-[15%]">

                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    );
};
