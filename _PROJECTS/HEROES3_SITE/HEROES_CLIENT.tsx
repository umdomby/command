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
import Link from "next/link";

interface Props {
    gameRecords: any[];
    className?: string;
}

export const GameRecord_CLIENT: React.FC<Props> = ({gameRecords}) => {

    return (

            <Container className="w-[100%]">
                <Table className="table-fixed">
                    <TableCaption>Gamerecord.online</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[30%] text-left overflow-hidden text-ellipsis whitespace-nowrap">
                                <div>Player</div>
                                <div>Category</div>
                            </TableHead>
                            <TableHead className="w-[30%] overflow-hidden text-ellipsis whitespace-nowrap">
                                <div>Game</div>
                                <div>Road</div>
                            </TableHead>
                            <TableHead className="w-[20%] overflow-hidden text-ellipsis whitespace-nowrap">
                                <div>Time</div>
                                <div>Image, Link</div>
                            </TableHead>
                            <TableHead className="w-[20%] text-right overflow-hidden text-ellipsis whitespace-nowrap">Date</TableHead>
                        </TableRow>
                    </TableHeader>


                    <Suspense>
                        {
                            gameRecords.map((records, index) => (
                                <TableBody key={index} className="border-b border-b-gray-800">
                                    <TableRow>
                                        <TableCell>
                                            <div

                                                className="text-ellipsis overflow-hidden whitespace-nowrap">{records.user.fullName}</div>
                                            <div className="text-ellipsis overflow-hidden whitespace-nowrap">
                                                <Link
                                                    href={`/game/${records.category.name.replaceAll(" ", "-")}`}>{records.category.name}</Link>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-ellipsis overflow-hidden whitespace-nowrap">{records.product.name}</div>
                                            <div className="text-ellipsis overflow-hidden whitespace-nowrap">{records.productItem.name}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-ellipsis overflow-hidden whitespace-nowrap">
                                                {records.timestate.substring(3)}
                                            </div>
                                            <div className="text-ellipsis overflow-hidden whitespace-nowrap">
                                                {records.carModel !== null && records.carModel?.name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                        <div>{new Date(records.updatedAt).toLocaleDateString('ru-RU')}</div>
                                            <div
                                                className="mr-2">{new Date(records.updatedAt).toLocaleTimeString('ru-RU')}</div>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            ))}
                    </Suspense>
                </Table>
            </Container>

    );
};

