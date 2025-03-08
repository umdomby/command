'use client';
import React, {useTransition} from "react";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import {PlayerStatistic, User} from "@prisma/client";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import {Button} from "@/components/ui";
import {tournamentSumPlayers} from "@/app/actions";

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
    player?: { id: number; name: string }; // Добавьте id здесь
}

interface PlayerStatisticsProps {
    playerStatistics: PlayerStatisticWithRelations[];
    currentPage: number;
    totalPages: number;
    user: User;
}

export function TOURNAMENT({ user, playerStatistics, currentPage, totalPages }: PlayerStatisticsProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handlePageChange = (newPage: number) => {
        router.push(`?page=${newPage}`);
    };

    const handleCalculateStatistics = () => {
        startTransition(async () => {
            try {
                await tournamentSumPlayers();
                alert('Статистика обновлена успешно!');
            } catch (error) {
                console.error('Ошибка при обновлении статистики:', error);
                alert('Ошибка при обновлении статистики.');
            }
        });
    };

    return (
        <div>
            <div className="pagination-buttons flex justify-center items-center m-6">
                <div className="flex justify-start w-full mx-5">
                    <Link href="/player">
                        <Button className="h-7 mr-2">ИГРОКИ</Button>
                    </Link>
                    <Button className="h-7" onClick={handleCalculateStatistics} disabled={isPending}>
                        {isPending ? 'Обновление...' : 'Обновить статистику'}
                    </Button>
                </div>
                <div className="flex justify-center w-full">
                    <Button
                        className="h-7 mx-2"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                    >
                        Предыдущая
                    </Button>
                    <span>Страница {currentPage} из {totalPages}</span>
                    <Button
                        className="h-7 mx-2"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                    >
                        Следующая
                    </Button>
                </div>
            </div>

            <Table>
                <TableBody>
                    <TableRow>
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
                                {stat.player ? (
                                    <Link
                                        className="text-blue-500 cursor-pointer hover:text-green-500"
                                        href={`/player/${stat.player.id}`}
                                    >
                                        {stat.player.name || 'N/A'}
                                    </Link>
                                ) : (
                                    'N/A'
                                )}
                            </TableCell>
                            <TableCell
                                className={`text-${stat.color?.toLowerCase() || 'gray'}-500`}>{stat.gold}</TableCell>
                            <TableCell className="text-amber-500 text-center">{stat.security || '-'}</TableCell>
                            <TableCell className="text-gray-500">
                                {stat.link ? (
                                    <Link href={stat.link} target="_blank" rel="noopener noreferrer"
                                          className="text-blue-500">
                                        Link
                                    </Link>
                                ) : ''}
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