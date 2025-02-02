'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';
import { addEditPlayer } from '@/app/actions';

export default function AddEditPlayer() {
    const [playerName, setPlayerName] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [playerId, setPlayerId] = useState<number | null>(null);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addEditPlayer(playerId, playerName);
            setPlayerName('');
            setIsEditing(false);
            setPlayerId(null);
            alert('Игрок успешно добавлен/отредактирован');
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Не удалось обновить игрока');
        }
    };

    return (
        <div>
            <h1>{isEditing ? 'Редактировать игрока' : 'Добавить игрока'}</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Введите имя игрока"
                    required
                />
                <button type="submit">{isEditing ? 'Редактировать' : 'Добавить'} игрока</button>
            </form>
        </div>
    );
}
