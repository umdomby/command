"use client";
import {
    Table,
    TableBody,
    TableCell,
    TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import React from "react";

export const CONTACTS = () => {
    return (
        <div>
            <Table className="mt-10">
                <TableBody>
                    <TableRow>
                        <TableCell className="text-center overflow-hidden whitespace-nowrap w-[25%]">
                           <div className="text-green-500 text-xl">Telegram Group</div>
                        </TableCell>
                        <TableCell className="text-center overflow-hidden whitespace-nowrap w-[25%]">
                            <Link href="https://t.me/heroes3_site/1" target="_blank" className="text-blue-500 hover:text-green-300 font-bold text-xl">
                                    https://t.me/heroes3_site
                            </Link>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="text-center overflow-hidden whitespace-nowrap w-[25%]">
                            <div className="text-green-500 text-xl">Telegram Username</div>
                        </TableCell>
                        <TableCell className="text-center overflow-hidden whitespace-nowrap w-[25%]">
                            <Link className="text-blue-500 hover:text-green-300 font-bold text-xl" href={'https://t.me/navatar85'} target="_blank">@navatar85</Link>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    );
};
