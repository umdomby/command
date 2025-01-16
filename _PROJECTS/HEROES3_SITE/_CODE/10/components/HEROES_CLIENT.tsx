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

export const HEROES_CLIENT: React.FC<Props> = ({ className, user }) => {
    const { data: session } = useSession();
    const { data: bets, error, isLoading, mutate } = useSWR<Bet[]>('/api/get-bets', fetcher);
    const [placeBetError, setPlaceBetError] = useState<string | null>(null);
    const [closeBetError, setCloseBetError] = useState<string | null>(null);
    const [selectedWinner, setSelectedWinner] = useState<number | null>(null);

    useEffect(() => {
        let source = new EventSource('/api/sse');

        source.onmessage = (event) => {
            const data = JSON.parse(event.data);

            unstable_batchedUpdates(() => {
                if (data.type === 'create' || data.type === 'update' || data.type === 'delete') {
                    mutate();
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
        const amount = parseFloat(formData.get('amount') as string);
        const player = formData.get('player') as PlayerChoice;

        if (isNaN(amount) || amount <= 0) {
            setPlaceBetError('Сумма должна быть положительным числом');
            return;
        }
        handlePlaceBet(bet, amount, player);
    };

    const handleCloseBet = async (betId: number) => {
        if (!selectedWinner) {
            setCloseBetError('Выберите победителя!');
            return;
        }

        try {
            // Проверяем, что selectedWinner не равен null
            if (selectedWinner === null || selectedWinner === undefined) {
                throw new Error("Не выбран победитель.");
            }

            await closeBet(betId, selectedWinner);
            mutate(); // Обновляем данные
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
                // Фильтруем ставки пользователя для текущей ставки (bet)
                const userBets = bet.participants.filter((p) => p.userId === user?.id);

                return (
                    <div key={bet.id} className="border border-gray-300 p-4 mt-4  rounded-lg shadow-sm">

                        {(() => {
                            const totalBetPlayer1 = bet.participants
                                .filter((p) => p.player === PlayerChoice.PLAYER1)
                                .reduce((sum, p) => sum + p.amount, bet.initBetPlayer1);

                            const totalBetPlayer2 = bet.participants
                                .filter((p) => p.player === PlayerChoice.PLAYER2)
                                .reduce((sum, p) => sum + p.amount, bet.initBetPlayer2);

                            const totalBets = totalBetPlayer1 + totalBetPlayer2;

                            // // Маржа букмекера (например, 5%)
                            // const margin = 0.05;
                            // // Расчет коэффициентов с учетом маржи
                            // const currentOdds1 = (totalBets / totalBetPlayer1) * (1 - margin);
                            // const currentOdds2 = (totalBets / totalBetPlayer2) * (1 - margin);

                            // Расчет коэффициентов без учета маржи
                            const currentOdds1 = totalBets / totalBetPlayer1;
                            const currentOdds2 = totalBets / totalBetPlayer2;

                            return (
                                <h3 className="text-lg font-semibold">
                                    {bet.player1.name} vs {bet.player2.name} | Коэффициенты 2: {currentOdds1.toFixed(2)} - {currentOdds2.toFixed(2)} | Ставки на {bet.player1.name}: {totalBetPlayer1} | Ставки на {bet.player2.name}: {totalBetPlayer2}
                                </h3>
                            );
                        })()}


                        <h3 className="text-lg font-semibold">
                            {bet.player1.name} vs {bet.player2.name} |
                            Коэффициенты: {bet.currentOdds1.toFixed(2)} - {bet.currentOdds2.toFixed(2)} | Ставки
                            на {bet.player1.name}: {bet.participants
                            .filter((p) => p.player === PlayerChoice.PLAYER1)
                            .reduce((sum, p) => sum + p.amount, bet.initBetPlayer1)} | Ставки
                            на {bet.player2.name}: {bet.participants
                            .filter((p) => p.player === PlayerChoice.PLAYER2)
                            .reduce((sum, p) => sum + p.amount, bet.initBetPlayer2)}
                        </h3>

                        {/* Отображение ставок пользователя для текущей ставки (bet) */}
                        {userBets.length > 0 && (
                            <div className="mt-4 p-4 rounded-lg">
                                <h4 className="text-md font-semibold mb-2">Ваши ставки на этот матч:</h4>
                                {userBets.map((participant) => (
                                    <div key={participant.id} className="border border-gray-200 p-3 mb-3  rounded-md">
                                        <p>
                                            <strong>Сумма ставки:</strong> {participant.amount} баллов на{' '}
                                            {participant.player === PlayerChoice.PLAYER1 ? bet.player1.name : bet.player2.name}
                                        </p>
                                        <p>
                                            <strong>Коэффициент:</strong> {participant.odds.toFixed(2)}
                                        </p>
                                        <p>
                                            <strong>Прибыль:</strong> {participant.profit.toFixed(2)}
                                        </p>
                                        <p>
                                            <strong>Дата:</strong> {new Date(participant.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {bet.status === 'OPEN' && (
                            <div>
                                <p>Коэффициенты: {bet.currentOdds1.toFixed(2)} - {bet.currentOdds2.toFixed(2)}</p>
                                <p>
                                    Все ставки на {bet.player1.name}:{' '}
                                    {bet.participants
                                        .filter((p) => p.player === PlayerChoice.PLAYER1)
                                        .reduce((sum, p) => sum + p.amount, bet.initBetPlayer1)}
                                </p>
                                <p>
                                    Все ставки на {bet.player2.name}:{' '}
                                    {bet.participants
                                        .filter((p) => p.player === PlayerChoice.PLAYER2)
                                        .reduce((sum, p) => sum + p.amount, bet.initBetPlayer2)}
                                </p>
                                <form onSubmit={(event) => handleSubmit(event, bet)}>
                                    <input
                                        type="number"
                                        name="amount"
                                        placeholder="Сумма ставки"
                                        min="0.01"
                                        step="0.01"
                                        required
                                        className="border p-2 rounded w-full"
                                    />
                                    <div className="flex gap-2 mt-2">
                                        <label>
                                            <input
                                                type="radio"
                                                name="player"
                                                value={PlayerChoice.PLAYER1}
                                                required
                                            />
                                            {bet.player1.name}
                                        </label>
                                        <label>
                                            <input
                                                type="radio"
                                                name="player"
                                                value={PlayerChoice.PLAYER2}
                                                required
                                            />
                                            {bet.player2.name}
                                        </label>
                                    </div>
                                    <Button type="submit" className="mt-2 w-full">
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
                                        {bet.player1.name} выиграл
                                    </label>
                                    <label>
                                        <input
                                            type="radio"
                                            name="winner"
                                            value={bet.player2Id}
                                            onChange={() => setSelectedWinner(bet.player2Id)}
                                        />
                                        {bet.player2.name} выиграл
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
