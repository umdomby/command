"use client";

import React, { useState, useEffect } from 'react';
import { playerTurnirAdd, playerTurnirDelete, playerTurnirAdminUpdate, playerTurnirAdminDelete, updateGetDataTurnirPage } from '@/app/actions';
import { Button, Input } from "@/components/ui";
import {
    Table,
    TableBody,
    TableCell,
    TableRow,
    TableHeader,
    TableHead,
} from "@/components/ui/table";

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
    checkPointsPlayer: number | null;
    orderP2PUser: User;
}

interface Props {
    className?: string;
    user: User;
    turnirs: Turnir[];
    turnirPlayers: { turnirId: number; players: TurnirPlayer[] }[];
}

export const TURNIR: React.FC<Props> = ({ className, user, turnirs: initialTurnirs, turnirPlayers: initialTurnirPlayers }) => {
    const [turnirs, setTurnirs] = useState<Turnir[]>(initialTurnirs);
    const [turnirPlayers, setTurnirPlayers] = useState<{ turnirId: number; players: TurnirPlayer[] }[]>(initialTurnirPlayers);
    const [selectedTurnir, setSelectedTurnir] = useState<number | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [editPlayer, setEditPlayer] = useState<{ id: number; newPoints: number; newTurnirId: number } | null>(null);

    const showMessage = (msg: string) => {
        setMessage(msg);
        setTimeout(() => setMessage(null), 3000);
    };

    const handleAddPlayer = async () => {
        if (!selectedTurnir) return;

        try {
            const response = await playerTurnirAdd(user.id, selectedTurnir);
            showMessage(response.message);
            await fetchData(); // Обновляем данные после добавления игрока
        } catch (error) {
            console.error('Ошибка при добавлении игрока:', error);
            showMessage('Не удалось добавить игрока');
        }
    };

    const handleDeletePlayer = async () => {
        if (!selectedTurnir) return;

        try {
            const response = await playerTurnirDelete(user.id, selectedTurnir);
            showMessage(response.message);
            await fetchData(); // Обновляем данные после удаления игрока
        } catch (error) {
            console.error('Ошибка при удалении игрока:', error);
            showMessage('Не удалось удалить игрока');
        }
    };

    const handleAdminUpdatePlayer = async () => {
        if (!editPlayer) return;

        try {
            const response = await playerTurnirAdminUpdate(editPlayer.id, editPlayer.newPoints, editPlayer.newTurnirId);
            showMessage(response.message);
            setEditPlayer(null); // Сбрасываем состояние редактирования после сохранения
            await fetchData(); // Обновляем данные после обновления игрока
        } catch (error) {
            console.error('Ошибка при обновлении игрока:', error);
            showMessage('Не удалось обновить игрока');
        }
    };

    const handleAdminDeletePlayer = async (playerId: number) => {
        try {
            const response = await playerTurnirAdminDelete(playerId);
            showMessage(response.message);
            await fetchData(); // Обновляем данные после удаления игрока
        } catch (error) {
            console.error('Ошибка при удалении игрока администратором:', error);
            showMessage('Не удалось удалить игрока');
        }
    };

    const fetchData = async () => {
        try {
            const data = await updateGetDataTurnirPage();
            setTurnirs(data.turnirs);
            setTurnirPlayers(data.turnirPlayers);
        } catch (error) {
            console.error('Ошибка при обновлении данных:', error);
        }
    };

    useEffect(() => {
        if (selectedTurnir !== null) {
            fetchData();
        }
    }, [selectedTurnir]);

    const playersForSelectedTurnir = selectedTurnir
        ? turnirPlayers.find(tp => tp.turnirId === selectedTurnir)?.players || []
        : [];

    const isUserInTurnir = playersForSelectedTurnir.some(player => player.userId === user.id);

    return (
        <div className={className}>
            <h2>Турниры</h2>
            <select onChange={(e) => setSelectedTurnir(Number(e.target.value))}>
                <option value="">Выберите турнир</option>
                {turnirs.map(turnir => (
                    <option key={turnir.id} value={turnir.id}>
                        {turnir.titleTurnir}, взнос: {turnir.startPointsTurnir}
                    </option>
                ))}
            </select>
            <Button onClick={handleAddPlayer} disabled={!selectedTurnir || isUserInTurnir}>
                Добавить в турнир
            </Button>
            <Button onClick={handleDeletePlayer} disabled={!selectedTurnir || !isUserInTurnir}>
                Удалить себя из турнира
            </Button>

            {message && (
                <div
                    className="fixed top-5 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded shadow-lg z-50"
                >
                    {message}
                </div>
            )}

            {isUserInTurnir && (
                <div className="text-green-500 mt-2">
                    Вы уже зарегистрированы в этом турнире.
                </div>
            )}

            <h2>Игроки в турнире</h2>
            <Table className="w-full">
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Наличие взноса</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {playersForSelectedTurnir.map(player => (
                        <TableRow key={player.id}>
                            <TableCell>{player.orderP2PUser.fullName}</TableCell>
                            <TableCell>
                                <span className={`inline-block w-4 h-4 rounded-full ${player.checkPointsPlayer ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};