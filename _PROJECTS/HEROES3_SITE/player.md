pup_ok_
HotaGirl
2BISHOP
HILTYHA
Master_of__mind
yarostnayaKoshka
kesZu_h3
KnyazeMakarSumski
KICK_FREAK
Redwhait
ViSoVi
sstrattegy
ARTI_da_KING
YAR_
newb1kk
tyranuxus11
Evlampich
Pavllovich
Sav1tarrr
papashkaiz4atika
Tender_cat
Relig00s
amieloo
M_on_t
RitoSux
beZZdar_
AnzhPri
MeatWagonGG
mrplane_
ChambiQ
akaStinger
Tihiy__
unutcon
Daddy_Boka
amieloo
GomungulsTV
HellLighT111
Weronest
VovastikMashina
zherarrr
Wukosha



отвечай на русском коммментарии на русском,
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\heroes\app\(root)\add-player\page.tsx
"use server";
import { redirect } from 'next/navigation';
import {getUserSession} from "@/components/lib/get-user-session";
import {prisma} from "@/prisma/prisma-client";
import {AddEditPlayer} from "@/components/addEditPlayer";
import Loading from "@/app/(root)/loading";
import React, {Suspense} from "react";
import {Container} from "@/components/container";


export default async function AddPlayerPage() {
const session = await getUserSession();

    if (!session) {
        return redirect('/not-auth');
    }

    const user = await prisma.user.findFirst({ where: { id: Number(session?.id) } });

    if (user?.role !== 'ADMIN') {
        return redirect('/');
    }
    const players = await prisma.player.findMany();

    return (
        <Container className="w-[100%]">
            <Suspense fallback={<Loading />}>
                <AddEditPlayer user={user} players={players} />
            </Suspense>
        </Container>
    );
}
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\heroes\components\addEditPlayer.tsx
'use client';

import React, { useState } from 'react';
import { addEditPlayer, deletePlayer } from '@/app/actions';
import { Player, User } from "@prisma/client";
import { Input, Button } from "@/components/ui";
import {
Table,
TableBody,
TableCell, TableHead, TableHeader,
TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface Props {
user: User;
players: Player[];
className?: string;
}

export const AddEditPlayer: React.FC<Props> = ({ user, players, className }) => {
const [playerName, setPlayerName] = useState('');
const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
const [message, setMessage] = useState('');
const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
const [isDialogOpen, setIsDialogOpen] = useState(false);
const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
const [confirmName, setConfirmName] = useState('');

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        console.log('Отправка:', { selectedPlayerId, playerName }); // Логирование значений
        if (!playerName.trim()) {
            setMessage('Имя игрока не может быть пустым');
            setMessageType('error');
            return;
        }
        try {
            const response = await addEditPlayer(selectedPlayerId, playerName);
            setMessage(response.message);
            setMessageType(response.success ? 'success' : 'error');
        } catch (error) {
            console.error('Не удалось сохранить игрока:', error);
            setMessage('Не удалось сохранить игрока');
            setMessageType('error');
        }
    };

    const handleEditClick = (player: Player) => {
        setPlayerName(player.name);
        setSelectedPlayerId(player.id);
    };

    const handleDeleteClick = (player: Player) => {
        setPlayerToDelete(player);
        setIsDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (playerToDelete && confirmName === playerToDelete.name) {
            try {
                await deletePlayer(playerToDelete.id);
                setMessage('Игрок успешно удален');
                setMessageType('success');
                setIsDialogOpen(false);
                setConfirmName('');
            } catch (error) {
                console.error('Не удалось удалить игрока:', error);
                setMessage('Не удалось удалить игрока');
                setMessageType('error');
            }
        } else {
            setMessage('Имя не совпадает');
            setMessageType('error');
        }
    };

    return (
        <div className={className}>
            <h1 className="text-3xl font-bold mb-4">Manage Players</h1>
            <form onSubmit={handleSubmit} className="mb-6">
                <Input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter player name"
                    required
                    className="mb-4"
                />
                <Button type="submit" className="bg-blue-500 text-white">
                    {selectedPlayerId ? 'Edit Player' : 'Add Player'}
                </Button>
                {message && (
                    <p className={`mt-2 ${messageType === 'error' ? 'text-red-500' : 'text-green-500'}`}>
                        {message}
                    </p>
                )}
            </form>

            <h2 className="text-2xl font-semibold mb-2">Existing Players</h2>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Player Name</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {players.map((player) => (
                        <TableRow key={player.id}>
                            <TableCell>{player.name}</TableCell>
                            <TableCell>
                                <Button onClick={() => handleEditClick(player)} className="bg-green-500 text-white">
                                    Edit
                                </Button>
                                <Button onClick={() => handleDeleteClick(player)} className="bg-red-500 text-white ml-2">
                                    Delete
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Подтвердите удаление</DialogTitle>
                    </DialogHeader>
                    <p>Введите имя игрока для подтверждения удаления:</p>
                    <Input
                        type="text"
                        value={confirmName}
                        onChange={(e) => setConfirmName(e.target.value)}
                        placeholder="Введите имя игрока"
                        className="mb-4"
                    />
                    <DialogFooter>
                        <Button onClick={() => setIsDialogOpen(false)} className="bg-gray-500 text-white">
                            Отмена
                        </Button>
                        <Button onClick={handleDeleteConfirm} className="bg-red-500 text-white">
                            Удалить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
export async function addEditPlayer(playerId: number | null, playerName: string) {
if (!playerName) {
throw new Error('Имя игрока обязательно');
}
try {
// Проверяем, существует ли игрок с таким именем
const existingPlayer = await prisma.player.findUnique({
where: { name: playerName },
});

        if (existingPlayer) {
            // Уведомляем клиента, что игрок с таким именем уже существует
            return { success: false, message: 'Игрок с таким именем уже существует' };
        }

        if (playerId) {
            // Редактируем существующего игрока
            await prisma.player.update({
                where: { id: playerId },
                data: { name: playerName },
            });
        } else {
            // Добавляем нового игрока
            await prisma.player.create({
                data: { name: playerName },
            });
        }

        return { success: true, message: 'Игрок успешно сохранен' };
    } catch (error) {
        console.error('Ошибка:', error);
        throw new Error('Не удалось обновить игрока');
    }
}