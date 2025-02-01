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

interface BetParticipantCLOSED {
    id: number;
    betCLOSEDId: number;
    userId: number;
    amount: number;
    odds: number;
    profit: number;
    player: string; // Assuming PlayerChoice is a string enum
    isWinner: boolean;
    createdAt: Date;
    margin: number;
    isCovered: string;
    overlap: number;
    return: number; // Add the return field
}

interface BetCLOSED {
    id: number;
    participantsCLOSED: BetParticipantCLOSED[];
    player1: { name: string };
    player2: { name: string };
    totalBetPlayer1: number;
    totalBetPlayer2: number;
    oddsBetPlayer1: number; // Текущий коэффициент для игрока 1
    oddsBetPlayer2: number; // Текущий коэффициент для игрока 2
    createdAt: Date;
    margin: number | null; // Разрешаем margin быть null
    winnerId: number | null; // ID победителя
}

interface Props {
    user: any;
    closedBets: BetCLOSED[];
}

export const TRANSFER_POINTS: React.FC<Props> = ({ user, closedBets }) => {
    return (
        <div>
            <div className="flex justify-between items-center">
                <div>
                    <p>Ваши баллы: {Math.floor(user.points * 100) / 100}</p>
                </div>
            </div>

            {closedBets.map((bet) => {
                // Фильтруем ставки, в которых участвовал текущий пользователь
                const userBets = bet.participantsCLOSED.filter((p: BetParticipantCLOSED) => p.userId === user.id);

                // Если пользователь не участвовал в этой ставке, пропускаем её
                if (userBets.length === 0) return null;

                // const winnerName = bet.winnerId === bet.player1.name ? bet.player1.name : bet.player2.name;

                return (
                    <div key={bet.id} className="border border-gray-700 mt-1">
                        <Accordion type="single" collapsible>
                            <AccordionItem value={`item-${bet.id}`}>
                                <AccordionTrigger>
                                    <Table>
                                        <TableBody>
                                            <TableRow>
                                                {/* Игрок 1 */}
                                                <TableCell
                                                    className="text-ellipsis overflow-hidden whitespace-nowrap w-[25%]">
                                                    <div>{bet.player1.name}</div>
                                                    <div>{Math.floor(bet.totalBetPlayer1 * 100) / 100}</div>
                                                </TableCell>

                                                {/* Игрок 2 */}
                                                <TableCell
                                                    className="text-ellipsis overflow-hidden whitespace-nowrap w-[25%]">
                                                    <div>{bet.player2.name}</div>
                                                    <div>{Math.floor(bet.totalBetPlayer2 * 100) / 100}</div>
                                                </TableCell>

                                                {/* Коэффициент для игрока 1 и 2 */}
                                                <TableCell className="w-[15%]">
                                                    <div>{Math.floor(bet.oddsBetPlayer1 * 100) / 100}</div>
                                                    <div>{Math.floor(bet.oddsBetPlayer2 * 100) / 100}</div>
                                                </TableCell>

                                                {/* Прибыль/убыток */}
                                                <TableCell className="text-ellipsis overflow-hidden whitespace-nowrap w-[40%]">
                                                    <div>
                                                        <span>{bet.player1.name}</span> :{' '}
                                                        <span
                                                            className={
                                                                userBets
                                                                    .filter((p) => p.player === 'PLAYER1')
                                                                    .reduce((sum, p) => sum + (p.isWinner ? p.profit : -p.amount), 0) >= 0
                                                                    ? 'text-green-500'
                                                                    : 'text-red-500'
                                                            }
                                                        >
            {Math.floor(userBets
                .filter((p) => p.player === 'PLAYER1')
                .reduce((sum, p) => sum + (p.isWinner ? p.profit : -p.amount), 0) * 100) / 100}
        </span>
                                                    </div>
                                                    <div>
                                                        <span>{bet.player2.name}</span> :{' '}
                                                        <span
                                                            className={
                                                                userBets
                                                                    .filter((p) => p.player === 'PLAYER2')
                                                                    .reduce((sum, p) => sum + (p.isWinner ? p.profit : -p.amount), 0) >= 0
                                                                    ? 'text-green-500'
                                                                    : 'text-red-500'
                                                            }
                                                        >
            {Math.floor(userBets
                .filter((p) => p.player === 'PLAYER2')
                .reduce((sum, p) => sum + (p.isWinner ? p.profit : -p.amount), 0) * 100) / 100}
        </span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="m-1 p-4 rounded-lg">
                                        <h4 className="text-md font-semibold mb-2">Итоги матча:</h4>
                                        <p>
                                            {/*Победитель: <strong>{winnerName}</strong>*/}
                                        </p>
                                    </div>

                                    {userBets.length > 0 && (
                                        <div className="m-1 p-4 rounded-lg">
                                            <h4 className="text-md font-semibold mb-2">Ваши ставки на этот матч:</h4>
                                            {userBets.map((participant) => {
                                                // Calculate the overlap percentage
                                                const profitToCover =
                                                    participant.amount * (participant.odds - 1);
                                                const overlapPercentage =
                                                    participant.overlap > 0
                                                        ? Math.floor((participant.overlap / profitToCover) * 10000) / 100
                                                        : 0;

                                                return (
                                                    <div key={participant.id} className="border border-gray-200 p-1 mb-1 rounded-md">
                                                        <p>
                                                            Ставка: <strong>{participant.amount}</strong> на{' '}
                                                            <strong>
                                                                {participant.player === 'PLAYER1' ? bet.player1.name : bet.player2.name}
                                                            </strong>
                                                            {','} Коэффициент: <span>{Math.floor(participant.odds * 100) / 100}</span>
                                                            {','} Чистая прибыль: <span>{Math.floor(participant.profit * 100) / 100}</span>
                                                            {','} Маржа: <span>{participant.margin !== null ? Math.floor(participant.margin * 100) / 100 : '0.00'}</span>
                                                            {','} {new Date(participant.createdAt).toLocaleString()}
                                                        </p>
                                                        <p>
                                                            {participant.isWinner ? (
                                                                <span className="text-green-500">Ставка выиграла</span>
                                                            ) : (
                                                                <span className="text-red-500">Ставка проиграла</span>
                                                            )}
                                                        </p>
                                                        {participant.isCovered ? (
                                                            <p>
    <span
        className={
            overlapPercentage === 0
                ? 'text-purple-500'
                : overlapPercentage === 100
                    ? 'text-green-500'
                    : 'text-yellow-500'
        }
    >
        Ваша ставка была перекрыта на {Math.floor(participant.overlap * 100) / 100} Points (
        {overlapPercentage}%)
    </span>
                                                                <br/>
                                                                {participant.isWinner ? (
                                                                    <span className="text-green-500">
            Прибыль: {Math.floor(participant.return * 100) / 100} Points
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
                                                        ) : (
                                                            <p>
                    <span className="text-yellow-500">
                        Ваша ставка не была перекрыта (0 Points, 0%)
                    </span>
                                                                <br/>
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                );
            })}
        </div>
    );
};
