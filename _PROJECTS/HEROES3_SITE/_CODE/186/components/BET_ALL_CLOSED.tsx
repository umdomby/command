import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableRow,
} from "@/components/ui/table";

interface BetCLOSED {
    id: number;
    player1: { id: number; name: string };
    player2: { id: number; name: string };
    totalBetPlayer1: number;
    totalBetPlayer2: number;
    oddsBetPlayer1: number;
    oddsBetPlayer2: number;
    createdAt: Date;
    margin: number | null;
    winnerId: number | null;
}

interface Props {
    closedBets: BetCLOSED[];
}

export const BET_ALL_CLOSED: React.FC<Props> = ({ closedBets }) => {
    return (
        <div>

            {closedBets.map((bet) => {
                const formattedDate = new Date(bet.createdAt).toLocaleDateString();
                const isPlayer1Winner = bet.winnerId === bet.player1.id;
                const player1Class = isPlayer1Winner ? 'text-green-500' : 'text-red-500';
                const player2Class = isPlayer1Winner ? 'text-red-500' : 'text-green-500';

                return (
                    <div key={bet.id} className="border border-gray-700 mt-1">
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell className={`text-right overflow-hidden whitespace-nowrap w-[25%] ${player1Class}`}>
                                        <div>{bet.player1.name}</div>
                                    </TableCell>
                                    <TableCell className={`text-left overflow-hidden whitespace-nowrap w-[25%] ${player2Class}`}>
                                        <div>{bet.player2.name}</div>
                                    </TableCell>
                                    <TableCell className={`text-right overflow-hidden whitespace-nowrap w-[15%] ${player1Class}`}>
                                        <div>{Math.floor(bet.totalBetPlayer1 * 100) / 100}</div>
                                    </TableCell>
                                    <TableCell className={`text-left overflow-hidden whitespace-nowrap w-[15%] ${player2Class}`}>
                                        <div>{Math.floor(bet.totalBetPlayer2 * 100) / 100}</div>
                                    </TableCell>
                                    <TableCell className="text-ellipsis overflow-hidden whitespace-nowrap w-[15%]">
                                        <div> {formattedDate}</div>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                );
            })}
        </div>
    );
};
