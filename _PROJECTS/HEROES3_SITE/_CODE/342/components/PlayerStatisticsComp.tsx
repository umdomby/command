'use client';
import React from "react";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { PlayerStatistic } from "@prisma/client";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import {Button} from "@/components/ui";

const cityTranslations = {
    CASTLE: "ЗАМОК",
    RAMPART: "ОПЛОТ",
    TOWER: "БАШНЯ",
    INFERNO: "ИНФЕРНО",
    NECROPOLIS: "НЕКРОПОЛИС",
    DUNGEON: "ТЕМНИЦА",
    STRONGHOLD: "ЦИТАДЕЛЬ",
    FORTRESS: "КРЕПОСТЬ",
    CONFLUX: "СОПРЯЖЕНИЕ",
    COVE: "ПРИЧАЛ",
    FACTORY: "ФАБРИКА"
};

interface PlayerStatisticWithRelations extends PlayerStatistic {
    turnirBet?: { name: string };
    category?: { name: string };
    player?: { name: string };
}

interface PlayerStatisticsProps {
    playerStatistics: PlayerStatisticWithRelations[];
    currentPage: number;
    totalPages: number;
}

export function PlayerStatisticsComp({ playerStatistics, currentPage, totalPages }: PlayerStatisticsProps) {
    const router = useRouter();

    const handlePageChange = (newPage: number) => {
        router.push(`?page=${newPage}`);
    };

    return (
        <div>
            <div className="pagination-buttons flex justify-center m-6">
                <Button className="h-7 mx-2"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                >
                    Предыдущая
                </Button>
                <span>Страница {currentPage} из {totalPages}</span>
                <Button className="h-7 mx-2"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                >
                    Следующая
                </Button>
            </div>

            <Table>
                <TableBody>
                        <TableRow >
                            <TableCell>id</TableCell>
                            <TableCell>turnir</TableCell>
                            <TableCell>map</TableCell>
                            <TableCell>city</TableCell>
                            <TableCell>win</TableCell>
                            <TableCell>player</TableCell>
                            <TableCell>gold</TableCell>
                            <TableCell className="text-center">security</TableCell>
                            <TableCell>link</TableCell>
                        </TableRow>
                </TableBody>
            </Table>
            <Table>
                <TableBody>
                    {playerStatistics.map((stat) => (
                        <TableRow key={stat.id}>
                            <TableCell className="text-orange-500">{stat.id || 'N/A'}</TableCell>
                            <TableCell className="text-green-500">{stat.turnirBet?.name || 'N/A'}</TableCell>
                            <TableCell className="text-blue-500">{stat.category?.name || 'N/A'}</TableCell>
                            <TableCell className="text-amber-500">
                                {stat.city ? cityTranslations[stat.city] || 'N/A' : 'N/A'}
                            </TableCell>
                            <TableCell>
                                {stat.win && <span className="yellow-circle"></span>}
                            </TableCell>
                            <TableCell className={`text-${stat.color?.toLowerCase() || 'gray'}-500`}>
                                <span className="text-center">{stat.player?.name || 'N/A'}</span>
                            </TableCell>
                            <TableCell className="text-yellow-500 text-right">{stat.gold}</TableCell>
                            <TableCell className="text-red-500 text-center">{stat.security || 'N/A'}</TableCell>
                            <TableCell className="text-gray-500">
                                {stat.link ? (
                                    <Link href={stat.link} target="_blank" rel="noopener noreferrer">
                                        Link
                                    </Link>
                                ) : 'N/A'}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <div className="pagination-buttons flex justify-center m-6">
                <Button className="h-7 mx-2"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                >
                    Предыдущая
                </Button>
                <span>Страница {currentPage} из {totalPages}</span>
                <Button className="h-7 mx-2"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                >
                    Следующая
                </Button>
            </div>
        </div>
    );
}