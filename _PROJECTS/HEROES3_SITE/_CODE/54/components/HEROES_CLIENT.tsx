'use client';
import React, {useEffect, useState} from 'react';
import {Bet as PrismaBet, Player, PlayerChoice, User, BetParticipant} from '@prisma/client';
import useSWR from 'swr';
import {Button} from '@/components/ui/button';
import {useSession} from 'next-auth/react';
import {redirect} from 'next/navigation';
import {placeBet, closeBet} from '@/app/actions';
import {unstable_batchedUpdates} from 'react-dom';
import {useUser} from '@/hooks/useUser';

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const fetcher = (url: string, options?: RequestInit) => fetch(url, options).then(res => res.json());

// Константа для минимального допустимого коэффициента
const MIN_ODDS = 1.01;

interface Bet extends PrismaBet {
    player1: Player;
    player2: Player;
    participants: BetParticipant[];
    maxBetPlayer1: number; // Максимальная сумма ставок на игрока 1
    maxBetPlayer2: number; // Максимальная сумма ставок на игрока 2
    currentOdds1: number; // Текущий коэффициент для игрока 1
    currentOdds2: number; // Текущий коэффициент для игрока 2
}

interface Props {
    user: User | null;
    className?: string;
}

// Цвета для игроков
const playerColors = {
    [PlayerChoice.PLAYER1]: 'text-blue-400', // Синий для Player1
    [PlayerChoice.PLAYER2]: 'text-red-400',  // Красный для Player2
};
export const HEROES_CLIENT: React.FC<Props> = ({className, user}) => {
    const {data: session} = useSession();
    const {data: bets, error, isLoading, mutate} = useSWR<Bet[]>('/api/get-bets', fetcher);
    const {
        user: userUp,
        isLoading: isLoadingUser,
        isError: isErrorUser,
        mutate: mutateUser
    } = useUser(user ? user.id : null);

    const [closeBetError, setCloseBetError] = useState<string | null>(null);
    const [selectedWinner, setSelectedWinner] = useState<number | null>(null);
    const [isBetDisabled, setIsBetDisabled] = useState<{ [key: number]: boolean }>({});
    const [placeBetErrors, setPlaceBetErrors] = useState<{ [key: number]: string | null }>({});
    const [oddsErrors, setOddsErrors] = useState<{ [key: number]: string | null }>({});

    useEffect(() => {
        let source = new EventSource('/api/sse');

        source.onmessage = (event) => {
            const data = JSON.parse(event.data);

            unstable_batchedUpdates(() => {
                if (data.type === 'create' || data.type === 'update' || data.type === 'delete') {
                    mutate(); // Обновляем данные ставок
                    mutateUser(); // Обновляем данные пользователя
                }
            });
        };

        source.onerror = (err) => {
            console.error('SSE Error:', err);
            source.close();
            setTimeout(() => {
                source = new EventSource('/api/sse');
            }, 5000);
        };

        return () => {
            source.close();
        };
    }, [mutate, mutateUser]);

    // Условные операторы перенесены после всех хуков
    if (isLoadingUser) return <div>Загрузка данных пользователя...</div>;
    if (isErrorUser) return <div>Ошибка при загрузке данных пользователя</div>;

    const handleValidation = (bet: Bet, amount: number, player: PlayerChoice) => {
        const totalBets = bet.totalBetPlayer1 + bet.totalBetPlayer2;
        const totalBetOnPlayer = player === PlayerChoice.PLAYER1 ? bet.totalBetPlayer1 : bet.totalBetPlayer2;

        // Рассчитываем новый коэффициент после добавления ставки
        const newOdds = totalBets / totalBetOnPlayer;

        // Проверка на максимальную допустимую ставку
        const maxAllowedBet = player === PlayerChoice.PLAYER1 ? bet.maxBetPlayer1 : bet.maxBetPlayer2;

        if (amount > maxAllowedBet) {
            setPlaceBetErrors((prev) => ({
                ...prev,
                [bet.id]: `Максимально допустимая ставка: ${maxAllowedBet.toFixed(2)}`,
            }));
            setIsBetDisabled((prev) => ({
                ...prev,
                [bet.id]: true,
            }));
            return;
        }

        // Проверка, как изменится коэффициент после ставки
        if (newOdds < MIN_ODDS) {
            setOddsErrors((prev) => ({
                ...prev,
                [bet.id]: `Ставка приведет к снижению коэффициента ниже минимального допустимого значения (${MIN_ODDS})`,
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
        const value = parseInt(e.target.value, 10);
        const selectedPlayer = (e.target.form?.elements.namedItem('player') as RadioNodeList)?.value as PlayerChoice;

        if (!isNaN(value) && value > 0 && selectedPlayer) {
            handleValidation(bet, value, selectedPlayer);
        }
    };

    const handlePlayerChange = (e: React.ChangeEvent<HTMLInputElement>, bet: Bet) => {
        const amountInput = e.target.form?.elements.namedItem('amount') as HTMLInputElement;
        const amount = parseInt(amountInput.value, 10);
        const selectedPlayer = e.target.value as PlayerChoice;

        if (!isNaN(amount) && amount > 0) {
            handleValidation(bet, amount, selectedPlayer);
        }
    };

    const handlePlaceBet = async (bet: Bet, amount: number, player: PlayerChoice) => {
        try {
            if (!user) {
                throw new Error("Пользователь не найден");
            }

            await placeBet({
                betId: bet.id,
                userId: user.id,
                amount,
                player,
            });

            // Обновляем данные ставок
            mutate();

            // После успешной ставки блокируем кнопку
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
                    [bet.id]: 'Неизвестная ошибка', // Устанавливаем общую ошибку
                }));
            }
            console.error('Error placing bet:', err);
        }
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>, bet: Bet) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const amount = parseInt(formData.get('amount') as string, 10);
        const player = formData.get('player') as PlayerChoice;

        if (isNaN(amount) || amount <= 0) {
            setPlaceBetErrors((prev) => ({
                ...prev,
                [bet.id]: 'Сумма должна быть положительным целым числом',
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
                [bet.id]: 'Недостаточно баллов для совершения ставки',
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
        if (!selectedWinner) {
            setCloseBetError('Выберите победителя!');
            return;
        }

        try {
            if (selectedWinner === null || selectedWinner === undefined) {
                throw new Error("Не выбран победитель.");
            }

            await closeBet(betId, selectedWinner);
            mutate();
            mutateUser(); // Обновляем данные пользователя
            setSelectedWinner(null);
            setCloseBetError(null);
        } catch (error) {
            if (error instanceof Error) {
                setCloseBetError(error.message);
            } else {
                setCloseBetError('Не удалось закрыть ставку.');
            }
            console.error('Error closing bet:', error);
        }
    };

    if (!session) {
        return redirect('/not-auth');
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
        <div >
            <p>Ваши баллы: {userUp?.points}</p>

            {/* Общий TableHeader для всех ставок */}
            {/*<Table className="table-fixed">*/}
            {/*    /!*<TableCaption>Детали ставки</TableCaption>*!/*/}
            {/*    <TableHeader>*/}
            {/*        <TableRow>*/}
            {/*            <TableHead className="w-[20%] overflow-hidden text-ellipsis whitespace-nowrap" >Игрок 1</TableHead>*/}
            {/*            <TableHead className="w-[20%] overflow-hidden text-ellipsis whitespace-nowrap">Игрок 2</TableHead>*/}
            {/*            <TableHead className="w-[2%] overflow-hidden text-ellipsis whitespace-nowrap">К</TableHead>*/}
            {/*            <TableHead className="w-[2%] overflow-hidden text-ellipsis whitespace-nowrap">К</TableHead>*/}
            {/*            <TableHead className="w-[20%] text-right overflow-hidden text-ellipsis whitespace-nowrap">Прибыль/убыток</TableHead>*/}
            {/*        </TableRow>*/}
            {/*    </TableHeader>*/}
            {/*</Table>*/}

            {/* Отображение всех ставок */}
            {bets.map((bet: Bet) => {
                const userBets = bet.participants.filter((p) => p.userId === user?.id);

                // Рассчитываем прибыль и убытки для каждого исхода
                const totalBetOnPlayer1 = userBets
                    .filter((p) => p.player === PlayerChoice.PLAYER1)
                    .reduce((sum, p) => sum + p.amount, 0);

                const totalBetOnPlayer2 = userBets
                    .filter((p) => p.player === PlayerChoice.PLAYER2)
                    .reduce((sum, p) => sum + p.amount, 0);

                const profitIfPlayer1Wins = userBets
                    .filter((p) => p.player === PlayerChoice.PLAYER1)
                    .reduce((sum, p) => sum + p.profit, 0) - totalBetOnPlayer2;

                const profitIfPlayer2Wins = userBets
                    .filter((p) => p.player === PlayerChoice.PLAYER2)
                    .reduce((sum, p) => sum + p.profit, 0) - totalBetOnPlayer1;

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
                                                    className={`${playerColors[PlayerChoice.PLAYER1]} text-ellipsis overflow-hidden whitespace-nowrap w-[25%]`}>
                                                    <div>
                                                        {bet.player1.name}
                                                    </div>
                                                    <div>
                                                        {bet.totalBetPlayer1}
                                                    </div>
                                                </TableCell>

                                                {/* Игрок 2 */}
                                                <TableCell
                                                    className={`${playerColors[PlayerChoice.PLAYER2]} text-ellipsis overflow-hidden whitespace-nowrap w-[25%]`}>
                                                    <div>
                                                        {bet.player2.name}
                                                    </div>
                                                    <div>
                                                        {bet.totalBetPlayer2}
                                                    </div>
                                                </TableCell>

                                                {/* Коэффициент для игрока 1 и 2*/}
                                                <TableCell className="w-[15%]">
                                                    <div className={`${playerColors[PlayerChoice.PLAYER1]} text-ellipsis overflow-hidden whitespace-nowrap`}>
                                                        {bet.currentOdds1.toFixed(2)}
                                                    </div>
                                                    <div className={`${playerColors[PlayerChoice.PLAYER2]} text-ellipsis overflow-hidden whitespace-nowrap`}>
                                                        {bet.currentOdds2.toFixed(2)}
                                                    </div>
                                                </TableCell>


                                                {/* Прибыль/убыток */}
                                                <TableCell className="text-ellipsis text-ellipsis overflow-hidden whitespace-nowrap w-[40%]">
                                                    <div>
                                                        <span
                                                            className={playerColors[PlayerChoice.PLAYER1]}>{bet.player1.name}</span> :{' '}
                                                        <span
                                                            className={profitIfPlayer1Wins >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                    {profitIfPlayer1Wins >= 0 ? `+${profitIfPlayer1Wins.toFixed(2)}` : profitIfPlayer1Wins.toFixed(2)}
                                                    </span>
                                                    </div>

                                                    <div>
                                                <span
                                                    className={playerColors[PlayerChoice.PLAYER2]}>{bet.player2.name}</span> :{' '}
                                                        <span
                                                            className={profitIfPlayer2Wins >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                    {profitIfPlayer2Wins >= 0 ? `+${profitIfPlayer2Wins.toFixed(2)}` : profitIfPlayer2Wins.toFixed(2)}
                                                    </span>
                                                    </div>

                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </AccordionTrigger>
                                <AccordionContent>
                                    {/* Остальной код остается без изменений */}
                                    {bet.status === 'OPEN' && (
                                        <div className="mt-4">
                                            <p>
                                            Общая сумма ставок на это событие:<span className="text-green-400"> {bet.totalBetAmount}</span>
                                            </p>
                                            <p>
                                                Максимальная ставка на <span
                                                className={playerColors[PlayerChoice.PLAYER1]}>{bet.player1.name}</span>:{' '}
                                                <span
                                                    className={playerColors[PlayerChoice.PLAYER1]}>{bet.maxBetPlayer1.toFixed(2)}</span>
                                            </p>
                                            <p>
                                                Максимальная ставка на <span
                                                className={playerColors[PlayerChoice.PLAYER2]}>{bet.player2.name}</span>:{' '}
                                                <span
                                                    className={playerColors[PlayerChoice.PLAYER2]}>{bet.maxBetPlayer2.toFixed(2)}</span>
                                            </p>
                                        </div>
                                    )}

                                    {userBets.length > 0 && (
                                        <div className="mt-4 p-4 rounded-lg">
                                            <h4 className="text-md font-semibold mb-2">Ваши ставки на этот матч:</h4>
                                            {userBets.map((participant) => (
                                                <div key={participant.id}
                                                     className="border border-gray-200 p-1 mb-1 rounded-md">
                                                    <p>
                                                        Ставка: <strong
                                                        className={playerColors[participant.player]}>{participant.amount}</strong> на{' '}
                                                        <strong className={playerColors[participant.player]}>
                                                            {participant.player === PlayerChoice.PLAYER1 ? bet.player1.name : bet.player2.name}
                                                        </strong>{','}
                                                        {' '}Коэффициент: <span
                                                        className={playerColors[participant.player]}>{participant.odds.toFixed(2)}</span>{','}
                                                        {' '}Прибыль: <span
                                                        className={playerColors[participant.player]}>{participant.profit.toFixed(2)}</span>{','}
                                                        {' '}{new Date(participant.createdAt).toLocaleString()}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {bet.status === 'OPEN' && (
                                        <div>
                                            <form onSubmit={(event) => handleSubmit(event, bet)}>

                                                <div className="flex gap-2 m-2">
                                                    <input className="border p-2 rounded w-[20%]"
                                                        type="number"
                                                        name="amount"
                                                        placeholder="BET"
                                                        min="1"
                                                        step="1"
                                                        required

                                                        onChange={(e) => handleAmountChange(e, bet)}
                                                    />
                                                    <label className="border p-2 rounded w-[30%] text-center">
                                                        <input className="mt-1"
                                                            type="radio"
                                                            name="player"
                                                            value={PlayerChoice.PLAYER1}
                                                            required
                                                            onChange={(e) => handlePlayerChange(e, bet)}
                                                        />
                                                        <span
                                                            className={playerColors[PlayerChoice.PLAYER1]}>{bet.player1.name}</span>
                                                    </label>
                                                    <label className="border p-2 rounded w-[30%] text-center">
                                                        <input className="mt-1"
                                                            type="radio"
                                                            name="player"
                                                            value={PlayerChoice.PLAYER2}
                                                            required
                                                            onChange={(e) => handlePlayerChange(e, bet)}
                                                        />
                                                        <span
                                                            className={playerColors[PlayerChoice.PLAYER2]}>{bet.player2.name}</span>
                                                    </label>

                                                    <Button className={`mt-2 w-[20%] ${isBetDisabled[bet.id] ? 'bg-gray-400 cursor-not-allowed' : ''}`}
                                                        type="submit"
                                                        disabled={isBetDisabled[bet.id] || !user}
                                                    >
                                                        BET
                                                    </Button>
                                                </div>
                                                {oddsErrors[bet.id] &&
                                                    <p className="text-red-500">{oddsErrors[bet.id]}</p>}
                                                {placeBetErrors[bet.id] &&
                                                    <p className="text-red-500">{placeBetErrors[bet.id]}</p>}
                                            </form>
                                        </div>
                                    )}

                                    {bet.status === 'OPEN' && bet.creatorId === user?.id && (
                                        <div className="mt-4">
                                            <h4 className="text-lg font-semibold">Закрыть ставку</h4>
                                            <div className="flex gap-2 mt-2">
                                                <label>
                                                    <input
                                                        type="radio"
                                                        name="winner"
                                                        value={bet.player1Id}
                                                        onChange={() => setSelectedWinner(bet.player1Id)}
                                                    />
                                                    <span
                                                        className={playerColors[PlayerChoice.PLAYER1]}>{bet.player1.name}</span> выиграл
                                                </label>
                                                <label>
                                                    <input
                                                        type="radio"
                                                        name="winner"
                                                        value={bet.player2Id}
                                                        onChange={() => setSelectedWinner(bet.player2Id)}
                                                    />
                                                    <span
                                                        className={playerColors[PlayerChoice.PLAYER2]}>{bet.player2.name}</span> выиграл
                                                </label>
                                            </div>
                                            <Button
                                                type="button"
                                                onClick={() => handleCloseBet(bet.id)}
                                                className="mt-2 w-full"
                                            >
                                                Закрыть ставку
                                            </Button>
                                            {closeBetError && <p className="text-red-500">{closeBetError}</p>}
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
