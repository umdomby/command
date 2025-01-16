'use client';
import React, { useEffect, useState } from 'react';
import { Bet as PrismaBet, Player, PlayerChoice, User, BetParticipant } from '@prisma/client';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { placeBet, closeBet } from '@/app/actions';
import { unstable_batchedUpdates } from 'react-dom';

const fetcher = (url: string, options?: RequestInit) => fetch(url, options).then(res => res.json());

interface Bet extends PrismaBet {
    player1: Player;
    player2: Player;
    participants: BetParticipant[];
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

export const HEROES_CLIENT: React.FC<Props> = ({ className, user }) => {
    const { data: session } = useSession();
    const { data: bets, error, isLoading, mutate } = useSWR<Bet[]>('/api/get-bets', fetcher);
    const [placeBetError, setPlaceBetError] = useState<string | null>(null);
    const [closeBetError, setCloseBetError] = useState<string | null>(null);
    const [selectedWinner, setSelectedWinner] = useState<number | null>(null);
    const [potentialProfit, setPotentialProfit] = useState<number | null>(null);
    const [maxBets, setMaxBets] = useState<{ [key: number]: { player1: number; player2: number } }>({});
    const [isBetDisabled, setIsBetDisabled] = useState<boolean>(false); // Состояние для отключения кнопки

    useEffect(() => {
        let source = new EventSource('/api/sse');

        source.onmessage = (event) => {
            const data = JSON.parse(event.data);

            unstable_batchedUpdates(() => {
                if (data.type === 'create' || data.type === 'update' || data.type === 'delete') {
                    mutate();
                }
                if (data.type === 'maxBetUpdate') {
                    setMaxBets((prev) => ({
                        ...prev,
                        [data.betId]: {
                            player1: data.maxBetPlayer1,
                            player2: data.maxBetPlayer2,
                        },
                    }));
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
    }, [mutate]);

    const calculateMaxBet = (bet: Bet, player: PlayerChoice) => {
        const totalPlayer1 = bet.participants
            .filter(p => p.player === PlayerChoice.PLAYER1)
            .reduce((sum, p) => sum + p.amount, bet.initBetPlayer1);

        const totalPlayer2 = bet.participants
            .filter(p => p.player === PlayerChoice.PLAYER2)
            .reduce((sum, p) => sum + p.amount, bet.initBetPlayer2);

        const total = totalPlayer1 + totalPlayer2;

        // Максимальная ставка, чтобы коэффициент не опустился ниже 1.05
        const maxBetForOdds = player === PlayerChoice.PLAYER1
            ? (total / 1.05) - totalPlayer1
            : (total / 1.05) - totalPlayer2;

        // Максимальная ставка, чтобы не превысить сумму другого игрока на 30%
        const maxBetForBalance = player === PlayerChoice.PLAYER1
            ? totalPlayer2 * 1.3
            : totalPlayer1 * 1.3;

        // Максимальная ставка, которую может сделать пользователь
        const userMaxBet = user ? user.points : 0;

        // Возвращаем минимальное значение из всех ограничений
        return Math.min(maxBetForOdds, maxBetForBalance, userMaxBet);
    };

    const handlePlaceBet = async (bet: Bet, amount: number, player: PlayerChoice) => {
        try {
            if (!user) {
                throw new Error("Пользователь не найден");
            }

            // Рассчитываем текущие суммы ставок на каждого игрока
            const totalPlayer1 = bet.participants
                .filter(p => p.player === PlayerChoice.PLAYER1)
                .reduce((sum, p) => sum + p.amount, bet.initBetPlayer1);

            const totalPlayer2 = bet.participants
                .filter(p => p.player === PlayerChoice.PLAYER2)
                .reduce((sum, p) => sum + p.amount, bet.initBetPlayer2);

            const total = totalPlayer1 + totalPlayer2;

            // Расчет текущих коэффициентов
            const oddsPlayer1 = totalPlayer1 === 0 ? 1 : total / totalPlayer1;
            const oddsPlayer2 = totalPlayer2 === 0 ? 1 : total / totalPlayer2;

            // Рассчитываем потенциальную прибыль
            const potentialProfit = amount * (player === PlayerChoice.PLAYER1 ? oddsPlayer1 : oddsPlayer2);

            // Проверка, чтобы прибыль не превышала 30% от суммы ставок на другого игрока
            if (player === PlayerChoice.PLAYER1 && potentialProfit > totalPlayer2 * 0.3) {
                throw new Error('Прибыль от ставки превышает 30% от суммы ставок на другого игрока');
            }

            if (player === PlayerChoice.PLAYER2 && potentialProfit > totalPlayer1 * 0.3) {
                throw new Error('Прибыль от ставки превышает 30% от суммы ставок на другого игрока');
            }

            // Рассчитываем максимальную ставку с учетом ограничения на прибыль
            const maxBetForProfit = player === PlayerChoice.PLAYER1
                ? (totalPlayer2 * 0.3) / oddsPlayer1 // Максимум 30% от суммы ставок на Player 2, деленные на коэффициент
                : (totalPlayer1 * 0.3) / oddsPlayer2; // Максимум 30% от суммы ставок на Player 1, деленные на коэффициент

            // Максимальная ставка, чтобы коэффициент не опустился ниже 1.05
            const maxBetForOdds = player === PlayerChoice.PLAYER1
                ? (total / 1.05) - totalPlayer1
                : (total / 1.05) - totalPlayer2;

            // Максимальная ставка, чтобы не превысить сумму другого игрока на 30%
            const maxBetForBalance = player === PlayerChoice.PLAYER1
                ? totalPlayer2 * 1.3
                : totalPlayer1 * 1.3;

            // Максимальная ставка, которую может сделать пользователь
            const userMaxBet = user.points;

            // Возвращаем минимальное значение из всех ограничений
            const maxAllowedBet = Math.min(maxBetForOdds, maxBetForBalance, maxBetForProfit, userMaxBet);

            // Проверка, что ставка не превышает максимально допустимую
            if (amount > maxAllowedBet) {
                throw new Error(`Максимально допустимая ставка: ${maxAllowedBet.toFixed(2)}`);
            }

            await placeBet({
                betId: bet.id,
                userId: user.id,
                amount,
                player,
            });

            mutate();
            setPlaceBetError(null);
        } catch (err) {
            if (err instanceof Error) {
                setPlaceBetError(err.message);
            } else {
                setPlaceBetError('Неизвестная ошибка');
            }
            console.error('Error placing bet:', err);
        }
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>, bet: Bet) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const amount = parseInt(formData.get('amount') as string, 10);

        if (isNaN(amount) || amount <= 0) {
            setPlaceBetError('Сумма должна быть положительным целым числом');
            setIsBetDisabled(true); // Отключаем кнопку
            return;
        }

        if (!user || user.points < amount) {
            setPlaceBetError('Недостаточно баллов для совершения ставки');
            setIsBetDisabled(true); // Отключаем кнопку
            return;
        }

        const player = formData.get('player') as PlayerChoice;

        // Рассчитываем максимально допустимую ставку
        const maxAllowedBet = calculateMaxBet(bet, player);

        if (amount > maxAllowedBet) {
            setPlaceBetError(`Максимально допустимая ставка: ${maxAllowedBet.toFixed(2)}`);
            setIsBetDisabled(true); // Отключаем кнопку
            return;
        }

        // Проверка, не приведет ли ставка к снижению коэффициента до 1.05 или ниже
        const totalPlayer1 = bet.participants
            .filter(p => p.player === PlayerChoice.PLAYER1)
            .reduce((sum, p) => sum + p.amount, bet.initBetPlayer1);

        const totalPlayer2 = bet.participants
            .filter(p => p.player === PlayerChoice.PLAYER2)
            .reduce((sum, p) => sum + p.amount, bet.initBetPlayer2);

        const total = totalPlayer1 + totalPlayer2;

        const updatedTotalPlayer1 = player === PlayerChoice.PLAYER1 ? totalPlayer1 + amount : totalPlayer1;
        const updatedTotalPlayer2 = player === PlayerChoice.PLAYER2 ? totalPlayer2 + amount : totalPlayer2;
        const updatedTotal = updatedTotalPlayer1 + updatedTotalPlayer2;

        const updatedOddsPlayer1 = updatedTotalPlayer1 === 0 ? 1 : updatedTotal / updatedTotalPlayer1;
        const updatedOddsPlayer2 = updatedTotalPlayer2 === 0 ? 1 : updatedTotal / updatedTotalPlayer2;

        if ((player === PlayerChoice.PLAYER1 && updatedOddsPlayer1 <= 1.05) ||
            (player === PlayerChoice.PLAYER2 && updatedOddsPlayer2 <= 1.05)) {
            setPlaceBetError('Ставка приведет к снижению коэффициента до 1.05 или ниже');
            setIsBetDisabled(true); // Отключаем кнопку
            return;
        }

        setIsBetDisabled(false); // Включаем кнопку
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
        <div>
            <p>Ваши баллы: {user?.points}</p>

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
                    <div key={bet.id} className="border border-gray-300 p-4 mt-4 rounded-lg shadow-sm">
                        {(() => {
                            const totalBetPlayer1 = bet.participants
                                .filter((p) => p.player === PlayerChoice.PLAYER1)
                                .reduce((sum, p) => sum + p.amount, bet.initBetPlayer1);

                            const totalBetPlayer2 = bet.participants
                                .filter((p) => p.player === PlayerChoice.PLAYER2)
                                .reduce((sum, p) => sum + p.amount, bet.initBetPlayer2);

                            const totalBets = totalBetPlayer1 + totalBetPlayer2;

                            const currentOdds1 = totalBets / totalBetPlayer1;
                            const currentOdds2 = totalBets / totalBetPlayer2;

                            return (
                                <h3 className="text-lg font-semibold">
                                    <span className={playerColors[PlayerChoice.PLAYER1]}>{bet.player1.name}</span> vs{' '}
                                    <span className={playerColors[PlayerChoice.PLAYER2]}>{bet.player2.name}</span> |{' '}
                                    Коэффициенты:{' '}
                                    <span className={playerColors[PlayerChoice.PLAYER1]}>{currentOdds1.toFixed(2)}</span> -{' '}
                                    <span className={playerColors[PlayerChoice.PLAYER2]}>{currentOdds2.toFixed(2)}</span> |{' '}
                                    Ставки на <span className={playerColors[PlayerChoice.PLAYER1]}>{bet.player1.name}</span>:{' '}
                                    <span className={playerColors[PlayerChoice.PLAYER1]}>{totalBetPlayer1}</span> |{' '}
                                    Ставки на <span className={playerColors[PlayerChoice.PLAYER2]}>{bet.player2.name}</span>:{' '}
                                    <span className={playerColors[PlayerChoice.PLAYER2]}>{totalBetPlayer2}</span>
                                </h3>
                            );
                        })()}

                        {/* Отображение максимально возможной ставки */}
                        {bet.status === 'OPEN' && (
                            <div className="mt-4">
                                <p>
                                    Максимальная ставка на <span className={playerColors[PlayerChoice.PLAYER1]}>{bet.player1.name}</span>:{' '}
                                    <span className={playerColors[PlayerChoice.PLAYER1]}>
                {calculateMaxBet(bet, PlayerChoice.PLAYER1).toFixed(2)}
            </span>
                                </p>
                                <p>
                                    Максимальная ставка на <span className={playerColors[PlayerChoice.PLAYER2]}>{bet.player2.name}</span>:{' '}
                                    <span className={playerColors[PlayerChoice.PLAYER2]}>
                {calculateMaxBet(bet, PlayerChoice.PLAYER2).toFixed(2)}
            </span>
                                </p>
                            </div>
                        )}

                        {/* Отображение ставок пользователя для текущей ставки (bet) */}
                        {userBets.length > 0 && (
                            <div className="mt-4 p-4 rounded-lg">
                                <h4 className="text-md font-semibold mb-2">Ваши ставки на этот матч:</h4>
                                {userBets.map((participant) => (
                                    <div key={participant.id} className="border border-gray-200 p-3 mb-3 rounded-md">
                                        <p>
                                            Ставка: <strong className={playerColors[participant.player]}>{participant.amount}</strong> на{' '}
                                            <strong className={playerColors[participant.player]}>
                                                {participant.player === PlayerChoice.PLAYER1 ? bet.player1.name : bet.player2.name}
                                            </strong>{','}
                                            {' '}Коэффициент: <span className={playerColors[participant.player]}>{participant.odds.toFixed(2)}</span>{','}
                                            {' '}Прибыль: <span className={playerColors[participant.player]}>{participant.profit.toFixed(2)}</span>{','}
                                            {' '}{new Date(participant.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                ))}

                                {/* Потенциальная прибыль (или убыток) для каждого исхода */}
                                <div className="mt-4">
                                    <p>
                                        Если выиграет <span className={playerColors[PlayerChoice.PLAYER1]}>{bet.player1.name}</span>, ваш результат:{' '}
                                        <span className={profitIfPlayer1Wins >= 0 ? 'text-green-600' : 'text-red-600'}>
                                            {profitIfPlayer1Wins.toFixed(2)} баллов
                                        </span>.
                                    </p>
                                    <p>
                                        Если выиграет <span className={playerColors[PlayerChoice.PLAYER2]}>{bet.player2.name}</span>, ваш результат:{' '}
                                        <span className={profitIfPlayer2Wins >= 0 ? 'text-green-600' : 'text-red-600'}>
                                            {profitIfPlayer2Wins.toFixed(2)} баллов
                                        </span>.
                                    </p>
                                </div>
                            </div>
                        )}

                        {bet.status === 'OPEN' && (
                            <div>
                                <form onSubmit={(event) => handleSubmit(event, bet)}>
                                    <input
                                        type="number"
                                        name="amount"
                                        placeholder="Сумма ставки"
                                        min="1"
                                        step="1"
                                        required
                                        className="border p-2 rounded w-full"
                                        onChange={(e) => {
                                            const value = parseInt(e.target.value, 10);
                                            if (isNaN(value) || value <= 0) {
                                                setPlaceBetError('Сумма должна быть положительным целым числом');
                                                setIsBetDisabled(true); // Отключаем кнопку
                                                setPotentialProfit(null);
                                            } else if (user && user.points < value) {
                                                setPlaceBetError('Недостаточно баллов для совершения ставки');
                                                setIsBetDisabled(true); // Отключаем кнопку
                                                setPotentialProfit(null);
                                            } else {
                                                setPlaceBetError(null);
                                                const selectedPlayer = (e.target.form?.elements.namedItem('player') as RadioNodeList)?.value;
                                                if (selectedPlayer) {
                                                    const odds = selectedPlayer === PlayerChoice.PLAYER1 ? bet.currentOdds1 : bet.currentOdds2;
                                                    const potentialProfit = value * odds;

                                                    // Проверка, чтобы прибыль не превышала 30% от суммы ставок на другого игрока
                                                    const totalPlayer1 = bet.participants
                                                        .filter(p => p.player === PlayerChoice.PLAYER1)
                                                        .reduce((sum, p) => sum + p.amount, bet.initBetPlayer1);

                                                    const totalPlayer2 = bet.participants
                                                        .filter(p => p.player === PlayerChoice.PLAYER2)
                                                        .reduce((sum, p) => sum + p.amount, bet.initBetPlayer2);

                                                    if (selectedPlayer === PlayerChoice.PLAYER1 && potentialProfit > totalPlayer2 * 0.3) {
                                                        setPlaceBetError('Прибыль от ставки превышает 30% от суммы ставок на другого игрока');
                                                        setIsBetDisabled(true); // Отключаем кнопку
                                                    } else if (selectedPlayer === PlayerChoice.PLAYER2 && potentialProfit > totalPlayer1 * 0.3) {
                                                        setPlaceBetError('Прибыль от ставки превышает 30% от суммы ставок на другого игрока');
                                                        setIsBetDisabled(true); // Отключаем кнопку
                                                    } else {
                                                        setIsBetDisabled(false); // Включаем кнопку
                                                    }

                                                    setPotentialProfit(potentialProfit);
                                                } else {
                                                    setPotentialProfit(null);
                                                }
                                            }
                                        }}
                                    />
                                    <div className="flex gap-2 mt-2">
                                        <label>
                                            <input
                                                type="radio"
                                                name="player"
                                                value={PlayerChoice.PLAYER1}
                                                required
                                                onChange={(e) => {
                                                    const amount = parseInt((e.target.form?.elements.namedItem('amount') as HTMLInputElement)?.value, 10);
                                                    if (!isNaN(amount) && amount > 0) {
                                                        setPotentialProfit(amount * bet.currentOdds1);
                                                    }
                                                }}
                                            />
                                            <span className={playerColors[PlayerChoice.PLAYER1]}>{bet.player1.name}</span>
                                        </label>
                                        <label>
                                            <input
                                                type="radio"
                                                name="player"
                                                value={PlayerChoice.PLAYER2}
                                                required
                                                onChange={(e) => {
                                                    const amount = parseInt((e.target.form?.elements.namedItem('amount') as HTMLInputElement)?.value, 10);
                                                    if (!isNaN(amount) && amount > 0) {
                                                        setPotentialProfit(amount * bet.currentOdds2);
                                                    }
                                                }}
                                            />
                                            <span className={playerColors[PlayerChoice.PLAYER2]}>{bet.player2.name}</span>
                                        </label>
                                    </div>
                                    {potentialProfit !== null && (
                                        <p className="mt-2 text-green-600">
                                            Потенциальная прибыль: {potentialProfit.toFixed(2)} баллов
                                        </p>
                                    )}
                                    <Button
                                        type="submit"
                                        className={`mt-2 w-full ${isBetDisabled ? 'bg-gray-400 cursor-not-allowed' : ''}`}
                                        disabled={isBetDisabled}
                                    >
                                        Сделать ставку
                                    </Button>
                                </form>
                                {placeBetError && <p className="text-red-500">{placeBetError}</p>}
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
                                        <span className={playerColors[PlayerChoice.PLAYER1]}>{bet.player1.name}</span> выиграл
                                    </label>
                                    <label>
                                        <input
                                            type="radio"
                                            name="winner"
                                            value={bet.player2Id}
                                            onChange={() => setSelectedWinner(bet.player2Id)}
                                        />
                                        <span className={playerColors[PlayerChoice.PLAYER2]}>{bet.player2.name}</span> выиграл
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
                    </div>
                );
            })}
        </div>
    );
};
