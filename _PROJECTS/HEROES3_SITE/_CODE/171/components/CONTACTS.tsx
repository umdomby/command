"use client";
import {
    Table,
    TableBody,
    TableCell,
    TableRow,
} from "@/components/ui/table";
import Link from "next/link";

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
                            <Link href="https://t.me/heroes3_site/1" target="_blank" className="text-blue-500 text-xl">
                                    https://t.me/heroes3_site
                            </Link>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="text-center overflow-hidden whitespace-nowrap w-[25%]">
                            <div className="text-green-500 text-xl">Telegram Username</div>
                        </TableCell>
                        <TableCell className="text-center overflow-hidden whitespace-nowrap w-[25%]">
                            <div className="text-blue-500 text-xl">@navatar85</div>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    );
};
