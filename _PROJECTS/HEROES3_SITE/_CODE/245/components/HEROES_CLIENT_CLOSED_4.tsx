"use client";
import React from 'react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Table,
    TableBody,
    TableCell,
    TableRow,
} from "@/components/ui/table";

interface BetParticipantCLOSED4 {
    id: number;
    betCLOSED4Id: number;
    userId: number;
    amount: number;
    odds: number;
    profit: number;
    player: string;
    isWinner: boolean;
    createdAt: Date;
    margin: number;
    isCovered: string;
    overlap: number;
    return: number;
}

interface BetCLOSED4 {
    id: number;
    participantsCLOSED4: BetParticipantCLOSED4[];
    player1: { id: number; name: string };
    player2: { id: number; name: string };
    player3: { id: number; name: string };
    player4: { id: number; name: string };
    totalBetPlayer1: number;
    totalBetPlayer2: number;
    totalBetPlayer3: number;
    totalBetPlayer4: number;
    oddsBetPlayer1: number;
    oddsBetPlayer2: number;
    oddsBetPlayer3: number;
    oddsBetPlayer4: number;
    createdAt: Date;
    margin: number | null;
    winnerId: number | null;
    updatedAt: Date;
}

interface Props {
    user: any;
    closedBets: BetCLOSED4[];
}

export const HEROES_CLIENT_CLOSED_4: React.FC<Props> = ({ user, closedBets }) => {
    const totalProfitLoss = closedBets.reduce((total, bet) => {
        const userBets = bet.participantsCLOSED4.filter((p) => p.userId === user.id);
        return total + userBets.reduce((sum, p) => sum + (p.isWinner ? p.profit : (p.return - p.amount)), 0);
    }, 0);

    return (
        <div>
            <div className="flex justify-between items-center">
                <div>
                    <p className={totalProfitLoss >= 0 ? 'text-green-500' : 'text-red-500'}>
                        Общая прибыль/потеря: {Math.floor(totalProfitLoss * 100) / 100}
                    </p>
                </div>
            </div>

            {closedBets.map((bet) => {
                const userBets = bet.participantsCLOSED4.filter((p: BetParticipantCLOSED4) => p.userId === user.id);

                if (userBets.length === 0) return null;

                return (
                    <div key={bet.id} className="border border-gray-700 mt-1">
                        <Accordion type="single" collapsible>
                            <AccordionItem value={`item-${bet.id}`}>
                                <AccordionTrigger>
                                    <Table>
                                        <TableBody>
                                            <TableRow>
                                                {[bet.player1, bet.player2, bet.player3, bet.player4].map((player, index) => {
                                                    const playerKey = `PLAYER${index + 1}`;
                                                    const totalBet = bet[`totalBetPlayer${index + 1}`];
                                                    const oddsBet = bet[`oddsBetPlayer${index + 1}`];
                                                    const isWinner = bet.winnerId === player.id;
                                                    const isDraw = bet.winnerId === null;

                                                    return (
                                                        <TableCell key={player.id} className="text-ellipsis overflow-hidden whitespace-nowrap w-[20%]">
                                                            <div className={isDraw ? 'text-white' : isWinner ? 'text-green-500' : 'text-red-500'}>
                                                                {player.name}
                                                            </div>
                                                            <div>
                                                                <span
                                                                    className={
                                                                        userBets
                                                                            .filter((p) => p.player === playerKey)
                                                                            .reduce((sum, p) => sum + (p.isWinner ? p.profit : (p.return - p.amount)), 0) >= 0
                                                                            ? 'text-green-500'
                                                                            : 'text-red-500'
                                                                    }
                                                                >
                                                                    {Math.floor(userBets
                                                                        .filter((p) => p.player === playerKey)
                                                                        .reduce((sum, p) => sum + (p.isWinner ? p.profit : (p.return - p.amount)), 0) * 100) / 100}
                                                                </span>
                                                            </div>
                                                            <div>{Math.floor(totalBet * 100) / 100}</div>
                                                        </TableCell>
                                                    );
                                                })}
                                                <TableCell className="w-[15%]">
                                                    {[bet.oddsBetPlayer1, bet.oddsBetPlayer2, bet.oddsBetPlayer3, bet.oddsBetPlayer4].map((odds, index) => (
                                                        <div key={index}>{Math.floor(odds * 100) / 100}</div>
                                                    ))}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="m-1 p-4 rounded-lg">
                                        <h4 className="text-md font-semibold mb-2">Дата и время закрытия ставок: {new Date(bet.updatedAt).toLocaleString()}</h4>
                                        {bet.winnerId === null && <p className="text-blue-500">Ничья</p>}
                                    </div>

                                    {userBets.map((participant) => (
                                        <div key={participant.id} className="border border-gray-200 p-1 mb-1 rounded-md">
                                            <p>
                                                Ставка: <strong>{participant.amount}</strong> на{' '}
                                                <strong>
                                                    {participant.player === 'PLAYER1' ? bet.player1.name :
                                                        participant.player === 'PLAYER2' ? bet.player2.name :
                                                            participant.player === 'PLAYER3' ? bet.player3.name : bet.player4.name}
                                                </strong>
                                                {','} Коэффициент: <span>{Math.floor(participant.odds * 100) / 100}</span>
                                                {','} Прибыль: <span>{Math.floor(participant.profit * 100) / 100}</span>
                                                {','} Маржа: <span>{participant.margin !== null ? Math.floor(participant.margin * 100) / 100 : '0.00'}</span>
                                                {','} {new Date(participant.createdAt).toLocaleString()}
                                            </p>
                                            <p>
                                                {bet.winnerId === null ? (
                                                    <span className="text-blue-500">Ничья</span>
                                                ) : participant.isWinner ? (
                                                    <span className="text-green-500">Ставка выиграла</span>
                                                ) : (
                                                    <span className="text-red-500">Ставка проиграла</span>
                                                )}
                                            </p>
                                            <p>
                                                {participant.isWinner ? (
                                                    <span className="text-green-500">
                                                        Возврат: {Math.floor(participant.return * 100) / 100} Points
                                                    </span>
                                                ) : (
                                                    <span
                                                        className={
                                                            Math.floor((participant.return - participant.amount) * 100) / 100 === 0
                                                                ? 'text-purple-500'
                                                                : 'text-red-500'
                                                        }
                                                    >
                                                        Потеря: {Math.floor((participant.return - participant.amount) * 100) / 100} Points
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    ))}
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                );
            })}
        </div>
    );
};
