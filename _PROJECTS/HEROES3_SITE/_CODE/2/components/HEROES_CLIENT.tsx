'use client';
import React, { useEffect, useState } from 'react';
import { Bet as PrismaBet, Player, PlayerChoice, User } from '@prisma/client';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { placeBet, closeBet } from '@/app/actions';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { unstable_batchedUpdates } from 'react-dom';
import { Form } from "@/components/ui/form";
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

// Исправленный fetcher
const fetcher = (url: string, options?: RequestInit) => fetch(url, options).then(res => res.json());

const placeBetSchema = z.object({
    amount: z.number().positive({ message: 'Сумма должна быть положительным числом' }),
    player: z.nativeEnum(PlayerChoice),
});

interface Bet extends PrismaBet {
    player1: Player; // Добавляем поле player1
    player2: Player; // Добавляем поле player2
}

interface Props {
    user: User | null;
    className?: string;
}

export const HEROES_CLIENT: React.FC<Props> = ({ className, user }) => {
    const form = useForm<z.infer<typeof placeBetSchema>>({
        resolver: zodResolver(placeBetSchema),
        defaultValues: {
            amount: 0,
            player: PlayerChoice.PLAYER1,
        },
    });

    const { data: session } = useSession();
    const { data: bets, error, isLoading, mutate } = useSWR<Bet[]>('/api/get-bets', fetcher);
    const [placeBetError, setPlaceBetError] = useState<string | null>(null);
    const [closeBetError, setCloseBetError] = useState<string | null>(null);
    const [selectedWinner, setSelectedWinner] = useState<number | null>(null);

    useEffect(() => {
        let source = new EventSource('/api/sse');

        // const intervalId = setInterval(() => {
        //     mutate();
        // }, 5000);

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
            // clearInterval(intervalId);
        };
    }, [mutate]);

    const handlePlaceBet = async (bet: Bet, amount: number, player: PlayerChoice) => {
        try {
            if (!user) {
                throw new Error("Пользователь не найден");
            }

            console.log("Placing bet with:", { betId: bet.id, userId: user.id, amount, player });

            // Вызываем placeBet
            await placeBet({
                betId: bet.id,
                userId: user.id,
                amount,
                player,
            });

            // Обновляем данные
            mutate();

            // Очищаем ошибки
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
        event.preventDefault(); // Предотвращаем перезагрузку страницы

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
            {bets.map((bet: Bet) => (
                <div key={bet.id} className="border border-gray-300 p-4 mt-4">
                    <h3>{bet.player1.name} vs {bet.player2.name}</h3>

                    {bet.status === 'OPEN' && (
                        <div>
                            <p>Ваши баллы: {user?.points}</p>
                            <p>Текущие ставки: {bet.currentOdds1} - {bet.currentOdds2}</p>

                            <form onSubmit={(event) => handleSubmit(event, bet)}>
                                <input
                                    type="number"
                                    name="amount"
                                    placeholder="Сумма ставки"
                                    min="0.01"
                                    step="0.01"
                                    required
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
                                <Button type="submit" className="mt-2">
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
                                className="mt-2"
                            >
                                Закрыть ставку
                            </Button>
                            {closeBetError && <p className="text-red-500">{closeBetError}</p>}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
