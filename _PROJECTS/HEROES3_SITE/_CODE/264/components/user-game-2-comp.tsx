import React from 'react';
import { GameUserBet, User, Category, Product, ProductItem, $Enums } from '@prisma/client';
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from "@/components/ui/table";
import GameUserBetStatus = $Enums.GameUserBetStatus;
import Link from "next/link";

interface Props {
    user: User;
    gameUserBets: (GameUserBet & {
        gameUser1Bet: User;
        gameUser2Bet: User | null;
        category: Category;
        product: Product;
        productItem: ProductItem;
        gameUserBetDetails: string;
        betUser1: number;
        gameUserBetOpen: boolean;
        statusUserBet: GameUserBetStatus;
    })[];
}

export const UserGame2Comp: React.FC<Props> = ({ user, gameUserBets }) => {
    return (
        <div>
            <div>Points: {user.points}</div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-center">Name</TableHead>
                        <TableHead className="text-center">Bet</TableHead>
                        <TableHead className="text-center">Map</TableHead>
                        <TableHead className="text-center">Size</TableHead>
                        <TableHead className="text-center">Timer</TableHead>
                        <TableHead className="text-center">Description</TableHead>
                        <TableHead className="text-center">Open Bet</TableHead>
                        <TableHead className="text-center">State</TableHead>
                        <TableHead className="text-center">Telegram</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {gameUserBets.map((bet) => (
                        <TableRow key={bet.id}>
                            <TableCell className="text-center">{bet.gameUser1Bet.fullName}</TableCell>
                            <TableCell className="text-center">{bet.betUser1}</TableCell>
                            <TableCell className="text-center">{bet.category.name}</TableCell>
                            <TableCell className="text-center">{bet.product.name}</TableCell>
                            <TableCell className="text-center">{bet.productItem.name}</TableCell>
                            <TableCell className="text-center">{bet.gameUserBetDetails}</TableCell>
                            <TableCell className="text-center">{bet.gameUserBetOpen ? "Open" : "Closed"}</TableCell>
                            <TableCell className="text-center">{bet.statusUserBet}</TableCell>
                            <TableCell className="text-center">
                                {bet.gameUser1Bet.telegram ? (
                                    <Link
                                        className="text-center text-blue-500 hover:text-green-300 font-bold"
                                        href={bet.gameUser1Bet.telegram.replace(/^@/, 'https://t.me/')}
                                        target="_blank"
                                    >
                                        {bet.gameUser1Bet.telegram}
                                    </Link>
                                ) : (
                                    "No Telegram"
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};
