"use client";

import React, { useState } from 'react';
import { playerTurnirAdd, playerTurnirDelete, playerTurnirAdminUpdate, playerTurnirAdminDelete } from '@/app/actions';
import { Button, Input } from "@/components/ui";

interface User {
    id: number;
    fullName: string;
    role: string;
    points: number;
}

interface Turnir {
    id: number;
    titleTurnir: string;
    startPointsTurnir: number;
}

interface TurnirPlayer {
    id: number;
    userId: number;
    turnirId: number;
    startPointsPlayer: number;
    orderP2PUser: User; // Используем правильное имя отношения
}

interface Props {
    className?: string;
    user: User;
    turnirs: Turnir[];
    turnirPlayers: { turnirId: number; players: TurnirPlayer[] }[];
}

export const TURNIR: React.FC<Props> = ({ className, user, turnirs, turnirPlayers }) => {
    const [selectedTurnir, setSelectedTurnir] = useState<number | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const showMessage = (msg: string) => {
        setMessage(msg);
        setTimeout(() => setMessage(null), 3000);
    };

    const handleAddPlayer = async () => {
        if (!selectedTurnir) return;

        try {
            const response = await playerTurnirAdd(user.id, selectedTurnir);
            showMessage(response.message);
        } catch (error) {
            console.error('Ошибка при добавлении игрока:', error);
            showMessage('Не удалось добавить игрока');
        }
    };

    const handleDeletePlayer = async (playerId: number) => {
        try {
            const response = await playerTurnirDelete(user.id, playerId);
            showMessage(response.message);
        } catch (error) {
            console.error('Ошибка при удалении игрока:', error);
            showMessage('Не удалось удалить игрока');
        }
    };

    const handleAdminUpdatePlayer = async (playerId: number, newPoints: number, newTurnirId: number) => {
        try {
            const response = await playerTurnirAdminUpdate(playerId, newPoints, newTurnirId);
            showMessage(response.message);
        } catch (error) {
            console.error('Ошибка при обновлении игрока:', error);
            showMessage('Не удалось обновить игрока');
        }
    };

    const handleAdminDeletePlayer = async (playerId: number) => {
        try {
            const response = await playerTurnirAdminDelete(playerId);
            showMessage(response.message);
        } catch (error) {
            console.error('Ошибка при удалении игрока администратором:', error);
            showMessage('Не удалось удалить игрока');
        }
    };

    const playersForSelectedTurnir = selectedTurnir
        ? turnirPlayers.find(tp => tp.turnirId === selectedTurnir)?.players || []
        : [];

    return (
        <div className={className}>
            <h2>Турниры</h2>
            <select onChange={(e) => setSelectedTurnir(Number(e.target.value))}>
                <option value="">Выберите турнир</option>
                {turnirs.map(turnir => (
                    <option key={turnir.id} value={turnir.id}>
                        {turnir.titleTurnir}
                    </option>
                ))}
            </select>
            <Button onClick={handleAddPlayer}>Турнир</Button>

            {message && (
                <div
                    className="fixed top-5 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded shadow-lg z-50"
                >
                    {message}
                </div>
            )}

            <h2>Игроки в турнире</h2>
            {playersForSelectedTurnir.map(player => (
                <div key={player.id}>
                    <span>{player.orderP2PUser.fullName} (ID: {player.userId})</span>
                    {user.role === 'ADMIN' && (
                        <>
                            <Input
                                type="number"
                                value={player.startPointsPlayer}
                                onChange={(e) => handleAdminUpdatePlayer(player.id, Number(e.target.value), player.turnirId)}
                            />
                            <Button onClick={() => handleAdminDeletePlayer(player.id)}>Удалить игрока</Button>
                        </>
                    )}
                    {user.id === player.userId && (
                        <Button onClick={() => handleDeletePlayer(player.id)}>Удалить себя из турнира</Button>
                    )}
                </div>
            ))}
        </div>
    );
};