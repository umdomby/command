"use client"
import React, { useState } from 'react';
import { GameUserBet, User, Category, Product, ProductItem, $Enums } from '@prisma/client';
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Link from "next/link";
import { gameUserBetRegistrations } from "@/app/actions";
import GameUserBetStatus = $Enums.GameUserBetStatus;

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
    const [betInput, setBetInput] = useState<number>(0);
    const [descriptionInput, setDescriptionInput] = useState<string>("");

    const handleAddBet = async (gameUserBetId: number, betUser1: number) => {
        if (betInput > user.points) {
            alert("У вас недостаточно Points");
            return;
        }
        if (betInput < betUser1) {
            alert("Ставка должна быть не меньше, чем у User1");
            return;
        }
        if (descriptionInput.length > 150) {
            alert("Описание не должно превышать 150 символов");
            return;
        }

        try {
            await gameUserBetRegistrations({
                userId: user.id,
                betUser2: betInput,
                gameUserBetDetails: descriptionInput,
                gameUserBetId: gameUserBetId
            });
            alert("Вы успешно добавлены в игру");
        } catch (error) {
            console.error("Ошибка при добавлении в игру:", error);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center">
                <div>Points: {user?.points}</div>
                <Link className="text-blue-500" href="/user-game-create-2">Create game</Link>
            </div>
            <Table>
                <TableBody>
                    <TableRow>
                        <TableHead className="text-center  overflow-hidden whitespace-nowrap w-[10%]">Name</TableHead>
                        <TableHead className="text-center  overflow-hidden whitespace-nowrap w-[10%]">Bet</TableHead>
                        <TableHead className="text-center  overflow-hidden whitespace-nowrap w-[10%]">Map</TableHead>
                        <TableHead className="text-center  overflow-hidden whitespace-nowrap w-[10%]">Size</TableHead>
                        <TableHead className="text-center  overflow-hidden whitespace-nowrap w-[10%]">Timer</TableHead>
                        <TableHead className="text-center  overflow-hidden whitespace-nowrap w-[10%]">State</TableHead>
                        <TableHead className="text-center  overflow-hidden whitespace-nowrap w-[10%]">Telegram</TableHead>
                    </TableRow>
                </TableBody>
            </Table>
            {gameUserBets.map((bet) => (
                <div key={bet.id} className="border border-gray-700 mt-1">
                    <Accordion type="single" collapsible>
                        <AccordionItem value={`item-${bet.id}`}>
                            <AccordionTrigger>
                                <Table>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell className="text-center  overflow-hidden whitespace-nowrap w-[10%]">{bet.gameUser1Bet.fullName}</TableCell>
                                            <TableCell className="text-center  overflow-hidden whitespace-nowrap w-[10%]">{bet.betUser1}</TableCell>
                                            <TableCell className="text-center  overflow-hidden whitespace-nowrap w-[10%]">{bet.category.name}</TableCell>
                                            <TableCell className="text-center  overflow-hidden whitespace-nowrap w-[10%]">{bet.product.name}</TableCell>
                                            <TableCell className="text-center  overflow-hidden whitespace-nowrap w-[10%]">{bet.productItem.name}</TableCell>
                                            <TableCell className="text-center  overflow-hidden whitespace-nowrap w-[10%]">{bet.statusUserBet}</TableCell>
                                            <TableCell className="text-center  overflow-hidden whitespace-nowrap w-[10%]">
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
                                    </TableBody>
                                </Table>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="p-4">
                                    <div className="mb-2">Description: {bet.gameUserBetDetails}</div>
                                    <div className="mb-2">Open Bet: {bet.gameUserBetOpen ? "Open" : "Closed"}</div>
                                    <div className="flex flex-col">
                                        <input
                                            type="number"
                                            value={betInput}
                                            onChange={(e) => setBetInput(Number(e.target.value))}
                                            placeholder="Your Bet"
                                            className="mb-2 p-2 border"
                                        />
                                        <input
                                            type="text"
                                            value={descriptionInput}
                                            onChange={(e) => setDescriptionInput(e.target.value)}
                                            placeholder="Description (max 150 chars)"
                                            className="mb-2 p-2 border"
                                        />
                                        <button
                                            onClick={() => handleAddBet(bet.id, bet.betUser1)}
                                            className="p-2 bg-blue-500 text-white"
                                        >
                                            Add to Game
                                        </button>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            ))}
        </div>
    );
};
