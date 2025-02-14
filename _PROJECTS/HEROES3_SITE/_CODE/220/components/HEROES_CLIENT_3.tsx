"use client";
import React, { useEffect, useState } from "react";
import {
    Bet3 as PrismaBet3,
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
import { placeBet3, closeBet3, closeBetDraw3 } from "@/app/actions";
import { unstable_batchedUpdates } from "react-dom";
import { useUser } from "@/hooks/useUser";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

const fetcher = (url: string, options?: RequestInit) =>
    fetch(url, options).then((res) => res.json());

// Константа для минимального допустимого коэффициента
const MIN_ODDS = 1.02;

interface Bet extends PrismaBet3 {
    player1: Player;
    player2: Player;
    player3: Player;
    participants: BetParticipant[];
    maxBetPlayer1: number;
    maxBetPlayer2: number;
    maxBetPlayer3: number;
    oddsBetPlayer1: number;
    oddsBetPlayer2: number;
    oddsBetPlayer3: number;
    margin: number;
    overlapPlayer1: number;
    overlapPlayer2: number;
    overlapPlayer3: number;
    totalBetPlayer1: number;
    totalBetPlayer2: number;
    totalBetPlayer3: number;
    totalBetAmount: number;
}

interface Props {
    user: User | null;
    className?: string;
}

// Цвета для игроков
const playerColors = {
    [PlayerChoice.PLAYER1]: "text-blue-400", // Color for Player 1
    [PlayerChoice.PLAYER2]: "text-red-400",  // Color for Player 2
    [PlayerChoice.PLAYER3]: "text-green-400", // Color for Player 3
    [PlayerChoice.PLAYER4]: "text-yellow-400", // Color for Player 4
};

export const HEROES_CLIENT_3: React.FC<Props> = ({ className, user }) => {
    const { data: session } = useSession();
    const {
        data: bets,
        error,
        isLoading,
        mutate,
    } = useSWR<Bet[]>("/api/get-bets3", fetcher, {
        refreshInterval: 10000, // Опционально: периодическое обновление
        revalidateOnFocus: true, // Обновление при фокусе на вкладке
    });
    const {
        user: userUp,
        isLoading: isLoadingUser,
        isError: isErrorUser,
        mutate: mutateUser,
    } = useUser(user ? user.id : null);

    const [closeBetError, setCloseBetError] = useState<string | null>(null);
    const [selectedWinner, setSelectedWinner] = useState<number | "draw" | null>(null);
    const [isBetDisabled, setIsBetDisabled] = useState<{ [key: number]: boolean }>(
        {}
    );
    const [placeBetErrors, setPlaceBetErrors] = useState<{
        [key: number]: string | null;
    }>({});
    const [oddsErrors, setOddsErrors] = useState<{ [key: number]: string | null }>(
        {}
    );
    const [potentialProfit, setPotentialProfit] = useState<{
        [key: number]: { player1: number; player2: number; player3: number };
    }>({});

    useEffect(() => {
        let source = new EventSource("/api/sse3");

        source.onmessage = (event) => {
            const data = JSON.parse(event.data);

            unstable_batchedUpdates(() => {
                if (
                    data.type === "create" ||
                    data.type === "update" ||
                    data.type === "delete"
                ) {
                    mutate(); // Обновляем данные ставок
                    mutateUser(); // Обновляем данные пользователя
                }
            });
        };

        source.onerror = (err) => {
            console.error("SSE Error:", err);
            source.close();
            setTimeout(() => {
                source = new EventSource("/api/sse3");
            }, 5000);
        };

        return () => {
            source.close();
        };
    }, [mutate, mutateUser]);

    // Условные операторы перенесены после всех хуков
    if (isLoadingUser) return <div>Загрузка данных пользователя...</div>;
    if (isErrorUser) return <div>Ошибка при загрузке данных пользователя</div>;

    // Фильтрация ставок по статусу OPEN
    const filteredBets =
        bets?.filter((bet) => bet.status === BetStatus.OPEN) || [];

    const handleValidation = (bet: Bet, amount: number, player: PlayerChoice) => {
        const totalBets = bet.totalBetPlayer1 + bet.totalBetPlayer2 + bet.totalBetPlayer3;
        const totalBetOnPlayer =
            player === PlayerChoice.PLAYER1 ? bet.totalBetPlayer1 :
                player === PlayerChoice.PLAYER2 ? bet.totalBetPlayer2 : bet.totalBetPlayer3;

        // Рассчитываем новый коэффициент после добавления ставки
        const newOdds = totalBets / totalBetOnPlayer;

        // Проверка на минимальный допустимый коэффициент
        const currentOdds = player === PlayerChoice.PLAYER1 ? bet.oddsBetPlayer1 :
            player === PlayerChoice.PLAYER2 ? bet.oddsBetPlayer2 : bet.oddsBetPlayer3;
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

        // Проверка на максимальную допустимую ставку
        const maxAllowedBet =
            player === PlayerChoice.PLAYER1 ? bet.maxBetPlayer1 :
                player === PlayerChoice.PLAYER2 ? bet.maxBetPlayer2 : bet.maxBetPlayer3;

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

        // Если проверка пройдена, очищаем ошибки и разблокируем кнопку
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
        const value = parseFloat(e.target.value);
        const selectedPlayer = (e.target.form?.elements.namedItem("player") as RadioNodeList)
            ?.value as PlayerChoice;

        if (!isNaN(value) && value > 0 && selectedPlayer) {
            handleValidation(bet, value, selectedPlayer);

            // Рассчитываем потенциальную прибыль для каждого игрока
            const potentialProfitPlayer1 = Math.floor((value * bet.oddsBetPlayer1) * 100) / 100;
            const potentialProfitPlayer2 = Math.floor((value * bet.oddsBetPlayer2) * 100) / 100;
            const potentialProfitPlayer3 = Math.floor((value * bet.oddsBetPlayer3) * 100) / 100;

            setPotentialProfit((prev) => ({
                ...prev,
                [bet.id]: {
                    player1: potentialProfitPlayer1,
                    player2: potentialProfitPlayer2,
                    player3: potentialProfitPlayer3,
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

            // Рассчитываем потенциальную прибыль для каждого игрока
            const potentialProfitPlayer1 = Math.floor((amount * bet.oddsBetPlayer1) * 100) / 100;
            const potentialProfitPlayer2 = Math.floor((amount * bet.oddsBetPlayer2) * 100) / 100;
            const potentialProfitPlayer3 = Math.floor((amount * bet.oddsBetPlayer3) * 100) / 100;

            setPotentialProfit((prev) => ({
                ...prev,
                [bet.id]: {
                    player1: potentialProfitPlayer1,
                    player2: potentialProfitPlayer2,
                    player3: potentialProfitPlayer3,
                },
            }));
        }
    };

    const handlePlaceBet = async (bet: Bet, amount: number, player: PlayerChoice) => {
        try {
            if (!user) {
                throw new Error("Пользователь не найден");
            }

            const response = await placeBet3({
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
            setIsBetDisabled((prev) => ( {
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

    const handleCloseBet = async (betId: number) => {
        if (selectedWinner === null) {
            setCloseBetError("Выберите победителя!");
            return;
        }

        try {
            if (selectedWinner === "draw") {
                await closeBetDraw3(betId);
            } else {
                await closeBet3(betId, selectedWinner);
            }

            mutate();
            mutateUser();
            setSelectedWinner(null);
            setCloseBetError(null);
        } catch (error) {
            if (error instanceof Error) {
                setCloseBetError(error.message);
            } else {
                setCloseBetError("Не удалось закрыть ставку.");
            }
            console.error("Error closing bet:", error);
        }
    };

    if (!session) {
        return redirect("/not-auth");
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
            {/* Отображение отфильтрованных ставок */}
            {filteredBets.map((bet: Bet) => {
                const userBets = bet.participants.filter((p) => p.userId === user?.id);

                // Рассчитываем прибыль и убытки для каждого исхода
                const totalBetOnPlayer1 = userBets
                    .filter((p) => p.player === PlayerChoice.PLAYER1)
                    .reduce((sum, p) => sum + p.amount, 0);

                const totalBetOnPlayer2 = userBets
                    .filter((p) => p.player === PlayerChoice.PLAYER2)
                    .reduce((sum, p) => sum + p.amount, 0);

                const totalBetOnPlayer3 = userBets
                    .filter((p) => p.player === PlayerChoice.PLAYER3)
                    .reduce((sum, p) => sum + p.amount, 0);

                const profitIfPlayer1Wins =
                    userBets
                        .filter((p) => p.player === PlayerChoice.PLAYER1)
                        .reduce((sum, p) => sum + p.profit, 0) - (totalBetOnPlayer2 + totalBetOnPlayer3);

                const profitIfPlayer2Wins =
                    userBets
                        .filter((p) => p.player === PlayerChoice.PLAYER2)
                        .reduce((sum, p) => sum + p.profit, 0) - (totalBetOnPlayer1 + totalBetOnPlayer3);

                const profitIfPlayer3Wins =
                    userBets
                        .filter((p) => p.player === PlayerChoice.PLAYER3)
                        .reduce((sum, p) => sum + p.profit, 0) - (totalBetOnPlayer1 + totalBetOnPlayer2);

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
                                                    className={`${playerColors[PlayerChoice.PLAYER1]} text-ellipsis overflow-hidden whitespace-nowrap w-[20%]`}
                                                >
                                                    <div>{bet.player1.name}</div>
                                                    <div>{Math.floor(bet.totalBetPlayer1 * 100) / 100}</div>
                                                </TableCell>

                                                {/* Игрок 2 */}
                                                <TableCell
                                                    className={`${playerColors[PlayerChoice.PLAYER2]} text-ellipsis overflow-hidden whitespace-nowrap w-[20%]`}
                                                >
                                                    <div>{bet.player2.name}</div>
                                                    <div>{Math.floor(bet.totalBetPlayer2 * 100) / 100}</div>
                                                </TableCell>

                                                {/* Игрок 3 */}
                                                <TableCell
                                                    className={`${playerColors[PlayerChoice.PLAYER3]} text-ellipsis overflow-hidden whitespace-nowrap w-[20%]`}
                                                >
                                                    <div>{bet.player3.name}</div>
                                                    <div>{Math.floor(bet.totalBetPlayer3 * 100) / 100}</div>
                                                </TableCell>

                                                {/* Коэффициент для игроков */}
                                                <TableCell className="w-[15%]">
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
                                                </TableCell>

                                                {/* Прибыль/убыток */}
                                                <TableCell className="text-ellipsis text-ellipsis overflow-hidden whitespace-nowrap w-[25%]">
                                                    <div>
                            <span className={playerColors[PlayerChoice.PLAYER1]}>
                              Победа {bet.player1.name}
                            </span>{" "}
                                                        :{" "}
                                                        <span
                                                            className={
                                                                profitIfPlayer1Wins >= 0
                                                                    ? "text-green-600"
                                                                    : "text-red-600"
                                                            }
                                                        >
                              {profitIfPlayer1Wins >= 0
                                  ? `+${Math.floor(profitIfPlayer1Wins * 100) / 100}`
                                  : Math.floor(profitIfPlayer1Wins * 100) / 100}
                            </span>
                                                    </div>

                                                    <div>
                            <span className={playerColors[PlayerChoice.PLAYER2]}>
                              Победа {bet.player2.name}
                            </span>{" "}
                                                        :{" "}
                                                        <span
                                                            className={
                                                                profitIfPlayer2Wins >= 0
                                                                    ? "text-green-600"
                                                                    : "text-red-600"
                                                            }
                                                        >
                              {profitIfPlayer2Wins >= 0
                                  ? `+${Math.floor(profitIfPlayer2Wins * 100) / 100}`
                                  : Math.floor(profitIfPlayer2Wins * 100) / 100}
                            </span>
                                                    </div>

                                                    <div>
                            <span className={playerColors[PlayerChoice.PLAYER3]}>
                              Победа {bet.player3.name}
                            </span>{" "}
                                                        :{" "}
                                                        <span
                                                            className={
                                                                profitIfPlayer3Wins >= 0
                                                                    ? "text-green-600"
                                                                    : "text-red-600"
                                                            }
                                                        >
                              {profitIfPlayer3Wins >= 0
                                  ? `+${Math.floor(profitIfPlayer3Wins * 100) / 100}`
                                  : Math.floor(profitIfPlayer3Wins * 100) / 100}
                            </span>
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
                                                <span className="text-green-400"> {Math.floor(bet.totalBetAmount * 100) / 100}</span>
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
                                            </p>
                                            {/* Calculate and display the difference in coverage bets as points */}
                                            <p>
                                                Разница ставок перекрытия для{" "}
                                                <span className={playerColors[PlayerChoice.PLAYER1]}>
                {bet.player1.name}
            </span>
                                                :{" "}
                                                <span className={playerColors[PlayerChoice.PLAYER1]}>
                {Math.floor(bet.overlapPlayer1 * 100) / 100} Points
            </span>
                                            </p>
                                            <p>
                                                Разница ставок перекрытия для{" "}
                                                <span className={playerColors[PlayerChoice.PLAYER2]}>
                {bet.player2.name}
            </span>
                                                :{" "}
                                                <span className={playerColors[PlayerChoice.PLAYER2]}>
                 {Math.floor(bet.overlapPlayer2 * 100) / 100} Points
            </span>
                                            </p>
                                            <p>
                                                Разница ставок перекрытия для{" "}
                                                <span className={playerColors[PlayerChoice.PLAYER3]}>
                {bet.player3.name}
            </span>
                                                :{" "}
                                                <span className={playerColors[PlayerChoice.PLAYER3]}>
                 {Math.floor(bet.overlapPlayer3 * 100) / 100} Points
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
                                                // Рассчитываем процент перекрытия на основе прибыли
                                                const profitToCover = participant.amount * (participant.odds - 1);
                                                const overlapPercentage =
                                                    participant.overlap > 0
                                                        ? Math.floor((participant.overlap / profitToCover) * 10000) / 100
                                                        : 0;

                                                // Определяем статус перекрытия
                                                let overlapStatus = "";
                                                switch (participant.isCovered) {
                                                    case "OPEN":
                                                        overlapStatus =
                                                            "Ваша ставка не перекрыта (0 Points, 0%)";
                                                        break;
                                                    case "CLOSED":
                                                        overlapStatus = `Ваша ставка полностью перекрыта на ${Math.floor(participant.overlap * 100) / 100} Points (${overlapPercentage}%)`;
                                                        break;
                                                    case "PENDING":
                                                        overlapStatus = `Ваша ставка частично перекрыта на ${Math.floor(participant.overlap * 100) / 100} Points (${overlapPercentage}%)`;
                                                        break;
                                                    default:
                                                        overlapStatus = "Неизвестный статус перекрытия.";
                                                }

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
                                                                        : bet.player3.name}
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
                                                        {/* Отображаем информацию о перекрытии */}
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
                            {overlapStatus}
                        </span>
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {bet.status === "OPEN" && (
                                        <div>
                                            <form onSubmit={(event) => handleSubmit(event, bet)}>
                                                <div className="flex gap-2 m-2">
                                                    <input
                                                        className="border p-2 rounded w-[20%]"
                                                        type="number"
                                                        name="amount"
                                                        placeholder="BET"
                                                        min="1"
                                                        step="1"
                                                        required
                                                        onChange={(e) => handleAmountChange(e, bet)}
                                                    />
                                                    <label className="border p-2 rounded w-[20%] text-center">
                                                        <div
                                                            className={`${playerColors[PlayerChoice.PLAYER1]} text-ellipsis overflow-hidden whitespace-nowrap`}
                                                        >
                                                            {"("}
                                                            {Math.floor(bet.oddsBetPlayer1 * 100) / 100}
                                                            {") "}
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

                                                    <label className="border p-2 rounded w-[20%] text-center">
                                                        <div
                                                            className={`${playerColors[PlayerChoice.PLAYER2]} text-ellipsis overflow-hidden whitespace-nowrap`}
                                                        >
                                                            {"("}
                                                            {Math.floor(bet.oddsBetPlayer2 * 100) / 100}
                                                            {") "}
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

                                                    <label className="border p-2 rounded w-[20%] text-center">
                                                        <div
                                                            className={`${playerColors[PlayerChoice.PLAYER3]} text-ellipsis overflow-hidden whitespace-nowrap`}
                                                        >
                                                            {"("}
                                                            {Math.floor(bet.oddsBetPlayer3 * 100) / 100}
                                                            {") "}
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
                                                    <Button
                                                        className={`mt-2 w-[20%] ${
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
                                                        name="winner"
                                                        value={bet.player1Id}
                                                        onChange={() => setSelectedWinner(bet.player1Id)}
                                                    />
                                                    <span className={playerColors[PlayerChoice.PLAYER1]}>
                       {bet.player1.name}
                   </span>{" "}
                                                </label>
                                                <label>
                                                    <input
                                                        type="radio"
                                                        name="winner"
                                                        value={bet.player2Id}
                                                        onChange={() => setSelectedWinner(bet.player2Id)}
                                                    />
                                                    <span className={playerColors[PlayerChoice.PLAYER2]}>
                       {bet.player2.name}
                   </span>{" "}
                                                </label>
                                                <label>
                                                    <input
                                                        type="radio"
                                                        name="winner"
                                                        value={bet.player3Id} // Убедитесь, что player3Id существует в интерфейсе Bet
                                                        onChange={() => setSelectedWinner(bet.player3Id)}
                                                    />
                                                    <span className={playerColors[PlayerChoice.PLAYER3]}>
        {bet.player3.name}
    </span>{" "}
                                                </label>
                                                <label>
                                                    <input
                                                        type="radio"
                                                        name="winner"
                                                        value="draw"
                                                        onChange={() => setSelectedWinner("draw")}
                                                    />
                                                    <span>Ничья</span>
                                                </label>
                                            </div>
                                            <Button
                                                type="button"
                                                onClick={() => handleCloseBet(bet.id)}
                                                className="mt-2 w-full"
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
        </div>
    );
};
