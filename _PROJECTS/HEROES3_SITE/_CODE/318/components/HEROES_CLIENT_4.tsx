"use client";
import React, { useEffect, useState } from "react";
import {
    Bet4 as PrismaBet4,
    Player,
    PlayerChoice,
    User,
    BetParticipant,
    BetStatus,
} from "@prisma/client";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import {placeBet4, closeBet4, closeBetDraw4, suspendedBetCheck4} from "@/app/actions";
import { unstable_batchedUpdates } from "react-dom";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import Link from "next/link";

const fetcher = (url: string, options?: RequestInit) =>
    fetch(url, options).then((res) => res.json());

const MIN_ODDS = 1.05;

interface Bet extends PrismaBet4 {
    player1: Player;
    player2: Player;
    player3: Player;
    player4: Player;
    participants: BetParticipant[];
    maxBetPlayer1: number;
    maxBetPlayer2: number;
    maxBetPlayer3: number;
    maxBetPlayer4: number;
    oddsBetPlayer1: number;
    oddsBetPlayer2: number;
    oddsBetPlayer3: number;
    oddsBetPlayer4: number;
    margin: number;
    overlapPlayer1: number;
    overlapPlayer2: number;
    overlapPlayer3: number;
    overlapPlayer4: number;
    totalBetPlayer1: number;
    totalBetPlayer2: number;
    totalBetPlayer3: number;
    totalBetPlayer4: number;
    totalBetAmount: number;
    creatorId : number;
    suspendedBet : boolean;
    status: BetStatus;
    description: string | null; // Change this line
}

interface Props {
    user: User | null;
    className?: string;
}

const playerColors = {
    [PlayerChoice.PLAYER1]: "text-blue-400",
    [PlayerChoice.PLAYER2]: "text-red-400",
    [PlayerChoice.PLAYER3]: "text-green-400",
    [PlayerChoice.PLAYER4]: "text-yellow-400",
};

export const HEROES_CLIENT_4: React.FC<Props> = ({ className, user }) => {
    const { data: session } = useSession();
    const {
        data: bets,
        error,
        isLoading,
        mutate,
    } = useSWR<Bet[]>("/api/get-bets4", fetcher, {
        refreshInterval: 10000,
        revalidateOnFocus: true,
    });


    const [closeBetError, setCloseBetError] = useState<string | null>(null);
    const [selectedWinners, setSelectedWinners] = useState<{ [key: number]: number | "draw" | null }>({});
    const [isBetDisabled, setIsBetDisabled] = useState<{ [key: number]: boolean }>({});
    const [placeBetErrors, setPlaceBetErrors] = useState<{ [key: number]: string | null }>({});
    const [oddsErrors, setOddsErrors] = useState<{ [key: number]: string | null }>({});
    const [potentialProfit, setPotentialProfit] = useState<{ [key: number]: { player1: number; player2: number; player3: number; player4: number } }>({});
    const [betAmounts, setBetAmounts] = useState<{ [key: number]: string }>({});

    // Состояние для управления модальным окном и ввода подтверждения
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [confirmationInput, setConfirmationInput] = useState("");
    const [currentBet, setCurrentBet] = useState<Bet | null>(null);

    useEffect(() => {
        let source = new EventSource("/api/sse4");

        source.onmessage = (event) => {
            const data = JSON.parse(event.data);

            unstable_batchedUpdates(() => {
                if (
                    data.type === "create" ||
                    data.type === "update" ||
                    data.type === "delete"
                ) {
                    mutate();

                }
            });
        };

        source.onerror = (err) => {
            console.error("SSE Error:", err);
            source.close();
            setTimeout(() => {
                source = new EventSource("/api/sse4");
            }, 5000);
        };

        return () => {
            source.close();
        };
    }, [mutate]);

    const filteredBets =
        bets?.filter((bet) => bet.status === BetStatus.OPEN) || [];

    const handleValidation = (bet: Bet, amount: number, player: PlayerChoice) => {
        const totalBets = bet.totalBetPlayer1 + bet.totalBetPlayer2 + bet.totalBetPlayer3 + bet.totalBetPlayer4;
        const totalBetOnPlayer =
            player === PlayerChoice.PLAYER1 ? bet.totalBetPlayer1 :
                player === PlayerChoice.PLAYER2 ? bet.totalBetPlayer2 :
                    player === PlayerChoice.PLAYER3 ? bet.totalBetPlayer3 : bet.totalBetPlayer4;

        const newOdds = totalBets / totalBetOnPlayer;

        const currentOdds = player === PlayerChoice.PLAYER1 ? bet.oddsBetPlayer1 :
            player === PlayerChoice.PLAYER2 ? bet.oddsBetPlayer2 :
                player === PlayerChoice.PLAYER3 ? bet.oddsBetPlayer3 : bet.oddsBetPlayer4;
        if (currentOdds < MIN_ODDS) {
            setOddsErrors((prev) => ({
                ...prev,
                [bet.id]: `Коэффициент слишком низкий. Минимально допустимый коэффициент: ${MIN_ODDS}`,
            }));
            setIsBetDisabled((prev) => ({
                ...prev,
                [bet.id]: true,
            }));
            return;
        }

        const maxAllowedBet =
            player === PlayerChoice.PLAYER1 ? bet.maxBetPlayer1 :
                player === PlayerChoice.PLAYER2 ? bet.maxBetPlayer2 :
                    player === PlayerChoice.PLAYER3 ? bet.maxBetPlayer3 : bet.maxBetPlayer4;

        if (amount > maxAllowedBet) {
            setPlaceBetErrors((prev) => ({
                ...prev,
                [bet.id]: `Максимально допустимая ставка: ${Math.floor(maxAllowedBet * 100) / 100}`,
            }));
            setIsBetDisabled((prev) => ({
                ...prev,
                [bet.id]: true,
            }));
            return;
        }

        setOddsErrors((prev) => ({
            ...prev,
            [bet.id]: null,
        }));
        setPlaceBetErrors((prev) => ({
            ...prev,
            [bet.id]: null,
        }));
        setIsBetDisabled((prev) => ({
            ...prev,
            [bet.id]: false,
        }));
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>, bet: Bet) => {
        const value = e.target.value;
        setBetAmounts((prev) => ({
            ...prev,
            [bet.id]: value,
        }));

        const numericValue = parseFloat(value);
        const selectedPlayer = (e.target.form?.elements.namedItem("player") as RadioNodeList)?.value as PlayerChoice;

        if (!isNaN(numericValue) && numericValue > 0 && selectedPlayer) {
            handleValidation(bet, numericValue, selectedPlayer);

            // Рассчитываем потенциальную прибыль для каждого игрока
            const potentialProfitPlayer1 = Math.floor((numericValue * bet.oddsBetPlayer1) * 100) / 100;
            const potentialProfitPlayer2 = Math.floor((numericValue * bet.oddsBetPlayer2) * 100) / 100;
            const potentialProfitPlayer3 = Math.floor((numericValue * bet.oddsBetPlayer3) * 100) / 100;
            const potentialProfitPlayer4 = Math.floor((numericValue * bet.oddsBetPlayer4) * 100) / 100;

            setPotentialProfit((prev) => ({
                ...prev,
                [bet.id]: {
                    player1: potentialProfitPlayer1,
                    player2: potentialProfitPlayer2,
                    player3: potentialProfitPlayer3,
                    player4: potentialProfitPlayer4,
                },
            }));
        }
    };

    const handlePlayerChange = (e: React.ChangeEvent<HTMLInputElement>, bet: Bet) => {
        const amountInput = e.target.form?.elements.namedItem("amount") as HTMLInputElement;
        const amount = parseFloat(amountInput.value);
        const selectedPlayer = e.target.value as PlayerChoice;

        if (!isNaN(amount) && amount > 0) {
            handleValidation(bet, amount, selectedPlayer);

            const potentialProfitPlayer1 = Math.floor((amount * bet.oddsBetPlayer1) * 100) / 100;
            const potentialProfitPlayer2 = Math.floor((amount * bet.oddsBetPlayer2) * 100) / 100;
            const potentialProfitPlayer3 = Math.floor((amount * bet.oddsBetPlayer3) * 100) / 100;
            const potentialProfitPlayer4 = Math.floor((amount * bet.oddsBetPlayer4) * 100) / 100;

            setPotentialProfit((prev) => ({
                ...prev,
                [bet.id]: {
                    player1: potentialProfitPlayer1,
                    player2: potentialProfitPlayer2,
                    player3: potentialProfitPlayer3,
                    player4: potentialProfitPlayer4,
                },
            }));
        }
    };

    const handlePlaceBet = async (bet: Bet, amount: number, player: PlayerChoice) => {
        try {
            if (!user) {
                throw new Error("Пользователь не найден");
            }

            const response = await placeBet4({
                betId: bet.id,
                userId: user.id,
                amount,
                player,
            });

            mutate();
            setIsBetDisabled((prev) => ({
                ...prev,
                [bet.id]: true,
            }));
            setPlaceBetErrors((prev) => ({
                ...prev,
                [bet.id]: null, // Очищаем ошибку при успешной ставке
            }));

            // Очистка поля ввода после успешной ставки
            setBetAmounts((prev) => ({
                ...prev,
                [bet.id]: "",
            }));
        } catch (err) {
            if (err instanceof Error) {
                setPlaceBetErrors((prev) => ({
                    ...prev,
                    [bet.id]: err.message, // Устанавливаем ошибку для конкретной ставки
                }));
            } else {
                setPlaceBetErrors((prev) => ({
                    ...prev,
                    [bet.id]: "Неизвестная ошибка", // Устанавливаем общую ошибку
                }));
            }
            console.error("Error placing bet:", err);
        }
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>, bet: Bet) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const amount = parseFloat(formData.get("amount") as string);
        const player = formData.get("player") as PlayerChoice;

        if (isNaN(amount) || amount <= 0) {
            setPlaceBetErrors((prev) => ({
                ...prev,
                [bet.id]: "Сумма должна быть положительным числом",
            }));
            setIsBetDisabled((prev) => ({
                ...prev,
                [bet.id]: true,
            }));
            return;
        }

        if (!user || user.points < amount) {
            setPlaceBetErrors((prev) => ({
                ...prev,
                [bet.id]: "Недостаточно баллов для совершения ставки",
            }));
            setIsBetDisabled((prev) => ({
                ...prev,
                [bet.id]: true,
            }));
            return;
        }

        setIsBetDisabled((prev) => ({
            ...prev,
            [bet.id]: false,
        }));
        handlePlaceBet(bet, amount, player);
    };

    const closeConfirmationDialog = () => {
        setIsModalOpen(false); // Закрываем диалоговое окно
        setConfirmationInput(""); // Очищаем поле ввода подтверждения
        setCurrentBet(null); // Сбрасываем текущую ставку
        setCloseBetError(null); // Очищаем сообщение об ошибке, если оно было
    };

    const openConfirmationDialog = (bet: Bet) => {
        const winner = selectedWinners[bet.id];
        if (winner === null || winner === undefined) {
            setCloseBetError("Пожалуйста, выберите победителя перед закрытием ставки.");
            return;
        }

        setCurrentBet(bet);
        setIsModalOpen(true);
    };

    // Функция для закрытия модального окна
    const closeConfirmationModal = () => {
        setIsModalOpen(false);
        setConfirmationInput("");
        setCurrentBet(null);
    };

    // Функция для обработки подтверждения
    const handleConfirmation = async () => {
        if (!currentBet || selectedWinners[currentBet.id] === null || selectedWinners[currentBet.id] === undefined) {
            setCloseBetError("Выберите победителя!");
            return;
        }

        const winner = selectedWinners[currentBet.id];
        const expectedInput = winner === "draw" ? "ничья" :
            winner === currentBet.player1Id ? currentBet.player1.name :
                winner === currentBet.player2Id ? currentBet.player2.name :
                    winner === currentBet.player3Id ? currentBet.player3.name :
                        currentBet.player4.name;

        if (confirmationInput.toLowerCase() !== expectedInput.toLowerCase()) {
            setCloseBetError(`Введите правильное подтверждение: ${expectedInput}`);
            return;
        }

        try {
            if (winner === "draw") {
                await closeBetDraw4(currentBet.id);
            } else if (typeof winner === "number") { // Ensure winner is a number
                await closeBet4(currentBet.id, winner);
            }

            mutate();

            setSelectedWinners((prev) => ({ ...prev, [currentBet.id]: null }));
            setCloseBetError(null);
            closeConfirmationDialog();
        } catch (error) {
            if (error instanceof Error) {
                setCloseBetError(error.message);
            } else {
                setCloseBetError("Не удалось закрыть ставку.");
            }
            console.error("Error closing bet:", error);
        }
    };

    const handleSuspendedBetChange = async (betId: number, newValue: boolean) => {
        try {
            await suspendedBetCheck4(betId, newValue);
            mutate(); // Обновляем данные ставок
        } catch (error) {
            console.error("Ошибка при обновлении флага suspendedBet:", error);
        }
    };

    if (!session) {
        return redirect("/");
    }

    if (isLoading) {
        return <div>Загрузка данных...</div>;
    }

    if (error) {
        return <div>Ошибка при загрузке данных: {error.message}</div>;
    }

    if (!bets) {
        return <div>Нет данных</div>;
    }

    return (
        <div>

            {filteredBets.map((bet: Bet) => {
                const userBets = bet.participants.filter((p) => p.userId === user?.id);

                const totalBetOnPlayer1 = userBets
                    .filter((p) => p.player === PlayerChoice.PLAYER1)
                    .reduce((sum, p) => sum + p.amount, 0);

                const totalBetOnPlayer2 = userBets
                    .filter((p) => p.player === PlayerChoice.PLAYER2)
                    .reduce((sum, p) => sum + p.amount, 0);

                const totalBetOnPlayer3 = userBets
                    .filter((p) => p.player === PlayerChoice.PLAYER3)
                    .reduce((sum, p) => sum + p.amount, 0);

                const totalBetOnPlayer4 = userBets
                    .filter((p) => p.player === PlayerChoice.PLAYER4)
                    .reduce((sum, p) => sum + p.amount, 0);

                const profitIfPlayer1Wins =
                    userBets
                        .filter((p) => p.player === PlayerChoice.PLAYER1)
                        .reduce((sum, p) => sum + p.profit, 0) - (totalBetOnPlayer2 + totalBetOnPlayer3 + totalBetOnPlayer4);

                const profitIfPlayer2Wins =
                    userBets
                        .filter((p) => p.player === PlayerChoice.PLAYER2)
                        .reduce((sum, p) => sum + p.profit, 0) - (totalBetOnPlayer1 + totalBetOnPlayer3 + totalBetOnPlayer4);

                const profitIfPlayer3Wins =
                    userBets
                        .filter((p) => p.player === PlayerChoice.PLAYER3)
                        .reduce((sum, p) => sum + p.profit, 0) - (totalBetOnPlayer1 + totalBetOnPlayer2 + totalBetOnPlayer4);

                const profitIfPlayer4Wins =
                    userBets
                        .filter((p) => p.player === PlayerChoice.PLAYER4)
                        .reduce((sum, p) => sum + p.profit, 0) - (totalBetOnPlayer1 + totalBetOnPlayer2 + totalBetOnPlayer3);

                return (
                    <div key={bet.id} className="border border-gray-700 mt-1">
                        <Accordion type="single" collapsible>
                            <AccordionItem value={`item-${bet.id}`}>
                                <AccordionTrigger className="relative">
                                    <span
                                        className={`absolute top-0 left-1 transform -translate-x-1 -translate-y-1 text-sm p-1 rounded shadow ${
                                            bet?.description === 'online' ? 'text-green-500' : 'text-red-500'
                                        }`}
                                    >
                                    № 4-{bet.id} {bet?.description}
                                    </span>
                                    <Table>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell
                                                    className={`${playerColors[PlayerChoice.PLAYER1]} text-ellipsis  overflow-hidden whitespace-nowrap w-[22%]`}
                                                >
                                                    <div>
                                                        {bet.player1.name}

                                                    </div>
                                                    <div> <span
                                                        className={
                                                            profitIfPlayer1Wins >= 0
                                                                ? "text-green-600"
                                                                : "text-red-600"
                                                        }
                                                    >
            {profitIfPlayer1Wins >= 0
                ? `+${Math.floor(profitIfPlayer1Wins * 100) / 100}`
                : Math.floor(profitIfPlayer1Wins * 100) / 100}
        </span></div>
                                                    <div>{Math.floor(bet.totalBetPlayer1 * 100) / 100}</div>
                                                </TableCell>

                                                <TableCell
                                                    className={`${playerColors[PlayerChoice.PLAYER2]} text-ellipsis  overflow-hidden whitespace-nowrap w-[22%]`}
                                                >
                                                    <div>
                                                        {bet.player2.name}

                                                    </div>
                                                    <div>     <span
                                                        className={
                                                            profitIfPlayer2Wins >= 0
                                                                ? "text-green-600"
                                                                : "text-red-600"
                                                        }
                                                    >
            {profitIfPlayer2Wins >= 0
                ? `+${Math.floor(profitIfPlayer2Wins * 100) / 100}`
                : Math.floor(profitIfPlayer2Wins * 100) / 100}
        </span></div>
                                                    <div>{Math.floor(bet.totalBetPlayer2 * 100) / 100}</div>
                                                </TableCell>

                                                <TableCell
                                                    className={`${playerColors[PlayerChoice.PLAYER3]} text-ellipsis  overflow-hidden whitespace-nowrap w-[22%]`}
                                                >
                                                    <div>
                                                        {bet.player3.name}

                                                    </div>
                                                    <div> <span
                                                        className={
                                                            profitIfPlayer3Wins >= 0
                                                                ? "text-green-600"
                                                                : "text-red-600"
                                                        }
                                                    >
            {profitIfPlayer3Wins >= 0
                ? `+${Math.floor(profitIfPlayer3Wins * 100) / 100}`
                : Math.floor(profitIfPlayer3Wins * 100) / 100}
        </span></div>
                                                    <div>{Math.floor(bet.totalBetPlayer3 * 100) / 100}</div>
                                                </TableCell>

                                                <TableCell
                                                    className={`${playerColors[PlayerChoice.PLAYER4]} text-ellipsis  overflow-hidden whitespace-nowrap w-[22%]`}
                                                >
                                                    <div>
                                                        {bet.player4.name}

                                                    </div>
                                                    <div>  <span
                                                        className={
                                                            profitIfPlayer4Wins >= 0
                                                                ? "text-green-600"
                                                                : "text-red-600"
                                                        }
                                                    >
            {profitIfPlayer4Wins >= 0
                ? `+${Math.floor(profitIfPlayer4Wins * 100) / 100}`
                : Math.floor(profitIfPlayer4Wins * 100) / 100}
        </span></div>
                                                    <div>{Math.floor(bet.totalBetPlayer4 * 100) / 100}</div>
                                                </TableCell>
                                                <TableCell className="w-10">
                                                    <div
                                                        className={`${playerColors[PlayerChoice.PLAYER1]} text-ellipsis overflow-hidden whitespace-nowrap`}
                                                    >
                                                        {Math.floor(bet.oddsBetPlayer1 * 100) / 100}
                                                    </div>
                                                    <div
                                                        className={`${playerColors[PlayerChoice.PLAYER2]} text-ellipsis overflow-hidden whitespace-nowrap`}
                                                    >
                                                        {Math.floor(bet.oddsBetPlayer2 * 100) / 100}
                                                    </div>
                                                    <div
                                                        className={`${playerColors[PlayerChoice.PLAYER3]} text-ellipsis overflow-hidden whitespace-nowrap`}
                                                    >
                                                        {Math.floor(bet.oddsBetPlayer3 * 100) / 100}
                                                    </div>
                                                    <div
                                                        className={`${playerColors[PlayerChoice.PLAYER4]} text-ellipsis overflow-hidden whitespace-nowrap`}
                                                    >
                                                        {Math.floor(bet.oddsBetPlayer4 * 100) / 100}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </AccordionTrigger>
                                <AccordionContent>

                                    {bet.status === "OPEN" && (
                                        <div className="m-4">
                                            <p>
                                                Общая сумма ставок на это событие:
                                                <span
                                                    className="text-green-400"> {Math.floor(bet.totalBetAmount * 100) / 100}</span>
                                            </p>
                                            <p>
                                                Максимальная ставка на{" "}
                                                <span className={playerColors[PlayerChoice.PLAYER1]}>
                {bet.player1.name}
            </span>
                                                :{" "}
                                                <span className={playerColors[PlayerChoice.PLAYER1]}>
                {Math.floor(bet.maxBetPlayer1 * 100) / 100}
            </span>
                                                {" "}
                                                {bet.player1.twitch !== "" && bet.player1.twitch !== null && bet.player1.twitch !== undefined &&
                                                    <Link
                                                        className={`${playerColors[PlayerChoice.PLAYER1]} hover:underline`}
                                                        href={bet.player1.twitch}
                                                        target="_blank"
                                                    >
                                                        Twitch
                                                    </Link>
                                                }
                                            </p>
                                            <p>
                                                Максимальная ставка на{" "}
                                                <span className={playerColors[PlayerChoice.PLAYER2]}>
                {bet.player2.name}
            </span>
                                                :{" "}
                                                <span className={playerColors[PlayerChoice.PLAYER2]}>
                {Math.floor(bet.maxBetPlayer2 * 100) / 100}
            </span>
                                                {" "}
                                                {bet.player2.twitch !== "" && bet.player2.twitch !== null && bet.player2.twitch !== undefined &&
                                                    <Link
                                                        className={`${playerColors[PlayerChoice.PLAYER2]} hover:underline`}
                                                        href={bet.player2.twitch}
                                                        target="_blank"
                                                    >
                                                        Twitch
                                                    </Link>
                                                }
                                            </p>
                                            <p>
                                                Максимальная ставка на{" "}
                                                <span className={playerColors[PlayerChoice.PLAYER3]}>
                {bet.player3.name}
            </span>
                                                :{" "}
                                                <span className={playerColors[PlayerChoice.PLAYER3]}>
                {Math.floor(bet.maxBetPlayer3 * 100) / 100}
            </span>
                                                {" "}
                                                {bet.player3.twitch !== "" && bet.player3.twitch !== null && bet.player3.twitch !== undefined &&
                                                    <Link
                                                        className={`${playerColors[PlayerChoice.PLAYER3]} hover:underline`}
                                                        href={bet.player3.twitch}
                                                        target="_blank"
                                                    >
                                                        Twitch
                                                    </Link>
                                                }
                                            </p>
                                            <p>
                                                Максимальная ставка на{" "}
                                                <span className={playerColors[PlayerChoice.PLAYER4]}>
                {bet.player4.name}
            </span>
                                                :{" "}
                                                <span className={playerColors[PlayerChoice.PLAYER4]}>
                {Math.floor(bet.maxBetPlayer4 * 100) / 100}
            </span>
                                                {" "}
                                                {bet.player4.twitch !== "" && bet.player4.twitch !== null && bet.player4.twitch !== undefined &&
                                                    <Link
                                                        className={`${playerColors[PlayerChoice.PLAYER4]} hover:underline`}
                                                        href={bet.player4.twitch}
                                                        target="_blank"
                                                    >
                                                        Twitch
                                                    </Link>
                                                }
                                            </p>
                                            <p>
                                                Поставлено:{" "}
                                                <span className={playerColors[PlayerChoice.PLAYER1]}>
                {bet.player1.name}
            </span>
                                                :{" "}
                                                <span className={playerColors[PlayerChoice.PLAYER1]}>
                {Math.floor(bet.overlapPlayer1 * 100) / 100} Points
            </span>
                                            </p>
                                            <p>
                                                Поставлено:{" "}
                                                <span className={playerColors[PlayerChoice.PLAYER2]}>
                {bet.player2.name}
            </span>
                                                :{" "}
                                                <span className={playerColors[PlayerChoice.PLAYER2]}>
                 {Math.floor(bet.overlapPlayer2 * 100) / 100} Points
            </span>
                                            </p>
                                            <p>
                                                Поставлено:{" "}
                                                <span className={playerColors[PlayerChoice.PLAYER3]}>
                {bet.player3.name}
            </span>
                                                :{" "}
                                                <span className={playerColors[PlayerChoice.PLAYER3]}>
                 {Math.floor(bet.overlapPlayer3 * 100) / 100} Points
            </span>
                                            </p>
                                            <p>
                                                Поставлено:{" "}
                                                <span className={playerColors[PlayerChoice.PLAYER4]}>
                {bet.player4.name}
            </span>
                                                :{" "}
                                                <span className={playerColors[PlayerChoice.PLAYER4]}>
                 {Math.floor(bet.overlapPlayer4 * 100) / 100} Points
            </span>
                                            </p>
                                        </div>
                                    )}

                                    {userBets.length > 0 && (
                                        <div className="m-1 p-4 rounded-lg">
                                            <h4 className="text-md font-semibold mb-2">
                                                Ваши ставки на этот матч:
                                            </h4>
                                            {userBets.map((participant) => {
                                                const profitToCover = participant.amount * (participant.odds - 1);
                                                const overlapPercentage =
                                                    participant.overlap > 0
                                                        ? Math.floor((participant.overlap / profitToCover) * 10000) / 100
                                                        : 0;

                                                return (
                                                    <div
                                                        key={participant.id}
                                                        className="border border-gray-200 p-1 mb-1 rounded-md"
                                                    >
                                                        <p>
                                                            Ставка:{" "}
                                                            <strong className={playerColors[participant.player]}>
                                                                {participant.amount}
                                                            </strong>{" "}
                                                            на{" "}
                                                            <strong className={playerColors[participant.player]}>
                                                                {participant.player === PlayerChoice.PLAYER1
                                                                    ? bet.player1.name
                                                                    : participant.player === PlayerChoice.PLAYER2
                                                                        ? bet.player2.name
                                                                        : participant.player === PlayerChoice.PLAYER3
                                                                            ? bet.player3.name
                                                                            : bet.player4.name}
                                                            </strong>
                                                            {", "} Коэффициент:{" "}
                                                            <span className={playerColors[participant.player]}>
                            {Math.floor(participant.odds * 100) / 100}
                        </span>
                                                            {", "} Прибыль:{" "}
                                                            <span className={playerColors[participant.player]}>
                            {Math.floor(participant.profit * 100) / 100}
                        </span>
                                                            {", "} {new Date(participant.createdAt).toLocaleString()}
                                                        </p>
                                                        <p>
                        <span
                            className={
                                participant.isCovered === "OPEN"
                                    ? "text-yellow-500"
                                    : participant.isCovered === "CLOSED"
                                        ? "text-green-500"
                                        : "text-blue-500"
                            }
                        >
                            {/*{overlapStatus}*/}
                        </span>
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {bet.status === "OPEN" && !bet.suspendedBet &&(
                                        <div>
                                            <form onSubmit={(event) => handleSubmit(event, bet)}>
                                                <div className="flex gap-2 m-2">
                                                    <label className="border p-2 rounded w-[50%] text-center">
                                                        <div
                                                            className={`${playerColors[PlayerChoice.PLAYER1]} text-ellipsis overflow-hidden whitespace-nowrap`}
                                                        >
                                                            {"("}
                                                            {Math.floor(bet.oddsBetPlayer1 * 100) / 100}
                                                            {") "}

                                                        </div>
                                                        <div>
                                                            {potentialProfit[bet.id]?.player1
                                                                ? `+${Math.floor(potentialProfit[bet.id].player1 * 100) / 100}`
                                                                : ""}
                                                        </div>
                                                        <input
                                                            className="mt-1"
                                                            type="radio"
                                                            name="player"
                                                            value={PlayerChoice.PLAYER1}
                                                            required
                                                            onChange={(e) => handlePlayerChange(e, bet)}
                                                        />
                                                        <span className={playerColors[PlayerChoice.PLAYER1]}>
                {bet.player1.name}
            </span>
                                                    </label>

                                                    <label className="border p-2 rounded w-[50%] text-center">
                                                        <div
                                                            className={`${playerColors[PlayerChoice.PLAYER2]} text-ellipsis overflow-hidden whitespace-nowrap`}
                                                        >
                                                            {"("}
                                                            {Math.floor(bet.oddsBetPlayer2 * 100) / 100}
                                                            {") "}

                                                        </div>
                                                        <div>
                                                            {potentialProfit[bet.id]?.player2
                                                                ? `+${Math.floor(potentialProfit[bet.id].player2 * 100) / 100}`
                                                                : ""}
                                                        </div>
                                                        <input
                                                            className="mt-1"
                                                            type="radio"
                                                            name="player"
                                                            value={PlayerChoice.PLAYER2}
                                                            required
                                                            onChange={(e) => handlePlayerChange(e, bet)}
                                                        />
                                                        <span className={playerColors[PlayerChoice.PLAYER2]}>
                {bet.player2.name}
            </span>
                                                    </label>
                                                </div>
                                                    <div className="flex gap-2 m-2">
                                                    <label className="border p-2 rounded w-[50%] text-center">
                                                        <div
                                                            className={`${playerColors[PlayerChoice.PLAYER3]} text-ellipsis overflow-hidden whitespace-nowrap`}
                                                        >
                                                            {"("}
                                                            {Math.floor(bet.oddsBetPlayer3 * 100) / 100}
                                                            {") "}

                                                        </div>
                                                        <div>
                                                            {potentialProfit[bet.id]?.player3
                                                                ? `+${Math.floor(potentialProfit[bet.id].player3 * 100) / 100}`
                                                                : ""}
                                                        </div>
                                                        <input
                                                            className="mt-1"
                                                            type="radio"
                                                            name="player"
                                                            value={PlayerChoice.PLAYER3}
                                                            required
                                                            onChange={(e) => handlePlayerChange(e, bet)}
                                                        />
                                                        <span className={playerColors[PlayerChoice.PLAYER3]}>
                {bet.player3.name}
            </span>
                                                    </label>

                                                    <label className="border p-2 rounded w-[50%] text-center">
                                                        <div
                                                            className={`${playerColors[PlayerChoice.PLAYER4]} text-ellipsis overflow-hidden whitespace-nowrap`}
                                                        >
                                                            {"("}
                                                            {Math.floor(bet.oddsBetPlayer4 * 100) / 100}
                                                            {") "}

                                                        </div>
                                                        <div>
                                                            {potentialProfit[bet.id]?.player4
                                                                ? `+${Math.floor(potentialProfit[bet.id].player4 * 100) / 100}`
                                                                : ""}
                                                        </div>
                                                        <input
                                                            className="mt-1"
                                                            type="radio"
                                                            name="player"
                                                            value={PlayerChoice.PLAYER4}
                                                            required
                                                            onChange={(e) => handlePlayerChange(e, bet)}
                                                        />
                                                        <span className={playerColors[PlayerChoice.PLAYER4]}>
                {bet.player4.name}
            </span>
                                                    </label>

                                                </div>
                                                <div className="flex gap-2 m-2">
                                                    <input
                                                        className="border p-2 rounded w-[50%]"
                                                        type="number"
                                                        name="amount"
                                                        placeholder="BET"
                                                        min="1"
                                                        step="1"
                                                        required
                                                        value={betAmounts[bet.id] || ""}
                                                        onChange={(e) => handleAmountChange(e, bet)}
                                                    />
                                                    <Button
                                                        className={`mt-2 w-[50%] ${
                                                            isBetDisabled[bet.id] ? "bg-gray-400 cursor-not-allowed" : ""
                                                        }`}
                                                        type="submit"
                                                        disabled={isBetDisabled[bet.id] || !user}
                                                    >
                                                        BET
                                                    </Button>
                                                </div>
                                                {oddsErrors[bet.id] && (
                                                    <p className="text-red-500">{oddsErrors[bet.id]}</p>
                                                )}
                                                {placeBetErrors[bet.id] && (
                                                    <p className="text-red-500">{placeBetErrors[bet.id]}</p>
                                                )}
                                            </form>

                                        </div>
                                    )}

                                    {bet.status === "OPEN" && bet.creatorId === user?.id && (
                                        <div className="m-2">
                                            <h4 className="text-lg font-semibold">Закрыть ставку</h4>
                                            <div className="flex gap-2 mt-2">
                                                <label>
                                                    <input
                                                        type="radio"
                                                        name={`winner-${bet.id}-4`}
                                                        value={bet.player1Id}
                                                        onChange={() => setSelectedWinners((prev) => ({
                                                            ...prev,
                                                            [bet.id]: bet.player1Id
                                                        }))}
                                                    />
                                                    <span className={playerColors[PlayerChoice.PLAYER1]}>
        {bet.player1.name}
    </span>{" "}
                                                </label>
                                                <label>
                                                    <input
                                                        type="radio"
                                                        name={`winner-${bet.id}-4`}
                                                        value={bet.player2Id}
                                                        onChange={() => setSelectedWinners((prev) => ({
                                                            ...prev,
                                                            [bet.id]: bet.player2Id
                                                        }))}
                                                    />
                                                    <span className={playerColors[PlayerChoice.PLAYER2]}>
        {bet.player2.name}
    </span>{" "}
                                                </label>
                                                <label>
                                                    <input
                                                        type="radio"
                                                        name={`winner-${bet.id}-4`}
                                                        value={bet.player3Id}
                                                        onChange={() => setSelectedWinners((prev) => ({
                                                            ...prev,
                                                            [bet.id]: bet.player3Id
                                                        }))}
                                                    />
                                                    <span className={playerColors[PlayerChoice.PLAYER3]}>
        {bet.player3.name}
    </span>{" "}
                                                </label>
                                                <label>
                                                    <input
                                                        type="radio"
                                                        name={`winner-${bet.id}-4`}
                                                        value={bet.player4Id}
                                                        onChange={() => setSelectedWinners((prev) => ({
                                                            ...prev,
                                                            [bet.id]: bet.player4Id
                                                        }))}
                                                    />
                                                    <span className={playerColors[PlayerChoice.PLAYER4]}>
        {bet.player4.name}
    </span>{" "}
                                                </label>
                                                <label>
                                                    <input
                                                        type="radio"
                                                        name={`winner-${bet.id}-4`}
                                                        value="draw"
                                                        onChange={() => setSelectedWinners((prev) => ({
                                                            ...prev,
                                                            [bet.id]: "draw"
                                                        }))}
                                                    />
                                                    <span>Ничья</span>
                                                </label>
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        checked={bet.suspendedBet}
                                                        onChange={() => handleSuspendedBetChange(bet.id, !bet.suspendedBet)}
                                                    />
                                                    <span>Остановить</span>
                                                </label>
                                            </div>
                                            <Button
                                                type="button"
                                                onClick={() => openConfirmationDialog(bet)}
                                                className="mt-2 w-full"
                                                disabled={selectedWinners[bet.id] === null || selectedWinners[bet.id] === undefined} // Кнопка неактивна, если победитель не выбран
                                            >
                                                Закрыть ставку
                                            </Button>
                                            {closeBetError && (
                                                <p className="text-red-500">{closeBetError}</p>
                                            )}
                                        </div>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                );
            })}

            {/* Модальное окно для подтверждения закрытия ставки */}
            {isModalOpen && currentBet && (
                <Dialog open={isModalOpen} onOpenChange={closeConfirmationDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Подтверждение закрытия ставки</DialogTitle>
                        </DialogHeader>
                        <p>Введите {selectedWinners[currentBet.id] === "draw" ? "ничья" : selectedWinners[currentBet.id] === currentBet.player1Id ? currentBet.player1.name : selectedWinners[currentBet.id] === currentBet.player2Id ? currentBet.player2.name : selectedWinners[currentBet.id] === currentBet.player3Id ? currentBet.player3.name : currentBet.player4.name} для подтверждения:</p>
                        <input
                            type="text"
                            value={confirmationInput}
                            onChange={(e) => setConfirmationInput(e.target.value)}
                            className="border p-2 rounded w-full"
                        />
                        <DialogFooter>
                            <Button onClick={closeConfirmationDialog} className="mr-2">Отмена</Button>
                            <Button onClick={handleConfirmation}>Подтвердить</Button>
                        </DialogFooter>
                        {closeBetError && <p className="text-red-500">{closeBetError}</p>}
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};
