'use client';

import React, { useState } from 'react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { cn } from '@/components/lib/utils';

interface User {
    email: string;
    fullName: string;
}

interface Insurance {
    id: number;
    fullName: string;
    birthDate: Date;
    phoneNumber: string;
    contacts: string[];
    plan: string;
    paymentMethod: string;
    proofImage?: string | null;
    status: 'PENDING' | 'OK';
    createdAt: Date;
    updatedAt: Date;
    user?: User | null;
}

interface Props {
    insurances: Insurance[];
}

const ProfileAdmin: React.FC<Props> = ({ insurances: initialInsurances }) => {
    const [insurances, setInsurances] = useState<Insurance[]>(initialInsurances);
    const [loadingId, setLoadingId] = useState<number | null>(null);

    const handleApprove = async (id: number) => {
        if (!confirm('Одобрить эту заявку? После одобрения изменить её будет нельзя.')) return;

        setLoadingId(id);
        try {
            const res = await fetch(`/api/insurance?id=${id}`, {
                method: 'PATCH',
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || 'Ошибка при одобрении заявки');
                return;
            }

            const updated = await res.json();

            setInsurances((prev) =>
                prev.map((ins) => (ins.id === id ? updated : ins))
            );

            toast.success('Заявка успешно одобрена');
        } catch (err) {
            toast.error('Ошибка сети при одобрении заявки');
        } finally {
            setLoadingId(null);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Удалить эту заявку навсегда? Это действие нельзя отменить.')) return;

        setLoadingId(id);
        try {
            const res = await fetch(`/api/insurance?id=${id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || 'Ошибка при удалении заявки');
                return;
            }

            setInsurances((prev) => prev.filter((ins) => ins.id !== id));
            toast.success('Заявка удалена');
        } catch (err) {
            toast.error('Ошибка сети при удалении заявки');
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="container mx-auto py-10 max-w-5xl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Админ-панель: Заявки</h1>
                <div className="flex gap-4">
                    <Button
                        variant="outline"
                        onClick={() =>
                            window.open(
                                process.env.NEXT_PUBLIC_MINIO_CONSOLE_URL || 'https://minio.ardu.live/',
                                '_blank'
                            )
                        }
                    >
                        MinIO консоль
                    </Button>
                    <Button variant="default" onClick={() => (window.location.href = '/admin/s3')}>
                        Управление файлами S3
                    </Button>
                </div>
            </div>

            {insurances.length === 0 ? (
                <p className="text-gray-500 text-lg text-center py-12">Заявок пока нет</p>
            ) : (
                <Accordion type="single" collapsible className="w-full space-y-4">
                    {insurances.map((ins) => {
                        const isApproved = ins.status === 'OK';
                        const isLoading = loadingId === ins.id;

                        return (
                            <AccordionItem
                                key={ins.id}
                                value={`item-${ins.id}`}
                                className="border rounded-lg bg-white shadow hover:shadow-md transition"
                            >
                                <AccordionTrigger className="px-6 hover:no-underline">
                                    <div className="flex justify-between w-full pr-8 items-center">
                                        <span className="text-sm text-gray-600">
                                            {new Date(ins.createdAt).toLocaleDateString('ru-RU', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                        <span className="font-medium text-lg">{ins.fullName}</span>
                                        <span
                                            className={cn(
                                                'px-4 py-1 rounded-full text-sm font-semibold',
                                                isApproved
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                            )}
                                        >
                                            {isApproved ? 'Одобрено' : 'На рассмотрении'}
                                        </span>
                                    </div>
                                </AccordionTrigger>

                                <AccordionContent className="px-6 pb-6">
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                            <div className="space-y-2">
                                                <p><strong>ФИО:</strong> {ins.fullName}</p>
                                                <p><strong>Дата рождения:</strong> {new Date(ins.birthDate).toLocaleDateString('ru-RU')}</p>
                                                <p><strong>Телефон:</strong> {ins.phoneNumber}</p>
                                                <p><strong>Для связи:</strong> {ins.contacts.length ? ins.contacts.join(', ') : '—'}</p>
                                                <p><strong>План:</strong> {ins.plan === '50_year' ? '50$ на 1 год' : '150$ на 4 года'}</p>
                                                <p><strong>Способ оплаты:</strong> {ins.paymentMethod}</p>
                                                {ins.user && (
                                                    <p><strong>Пользователь:</strong> {ins.user.fullName} ({ins.user.email})</p>
                                                )}
                                            </div>

                                            <div>
                                                {ins.proofImage ? (
                                                    <>
                                                        <p className="font-medium mb-3">Подтверждение оплаты:</p>
                                                        <div className="relative max-w-md mx-auto">
                                                            <Image
                                                                src={ins.proofImage}
                                                                alt="Подтверждение оплаты"
                                                                width={600}
                                                                height={800}
                                                                className="rounded-lg shadow-md object-contain border bg-gray-50"
                                                                unoptimized
                                                            />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <p className="text-gray-500 italic">Подтверждение оплаты не загружено</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-sm text-gray-600 border-t pt-4 space-y-1">
                                            <p>Создано: {new Date(ins.createdAt).toLocaleString('ru-RU')}</p>
                                            <p>Обновлено: {new Date(ins.updatedAt).toLocaleString('ru-RU')}</p>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4 pt-4 border-t">
                                            {!isApproved && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-green-600 text-green-600 hover:bg-green-50"
                                                    onClick={() => handleApprove(ins.id)}
                                                    disabled={isLoading}
                                                >
                                                    {isLoading ? 'Обработка...' : 'Одобрить'}
                                                </Button>
                                            )}

                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDelete(ins.id)}
                                                disabled={isLoading}
                                            >
                                                {isLoading ? 'Удаление...' : 'Удалить заявку'}
                                            </Button>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            )}
        </div>
    );
};

export default ProfileAdmin;