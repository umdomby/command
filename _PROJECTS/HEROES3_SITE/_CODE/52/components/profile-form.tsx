'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { TFormRegisterValues, formRegisterSchema } from './modals/auth-modal/forms/schemas';
import { User } from '@prisma/client';
import toast from 'react-hot-toast';
import { signOut } from 'next-auth/react';
import { Container } from './container';
import { Title } from './title';
import { FormInput } from './form';
import { Button } from '@/components/ui';
import { updateUserInfo } from '@/app/actions';

interface Props {
    data: User;
}

export const ProfileForm: React.FC<Props> = ({ data }) => {
    const form = useForm({
        resolver: zodResolver(formRegisterSchema),
        defaultValues: {
            fullName: data.fullName,
            email: data.email,
            password: '',
            confirmPassword: '',
        },
    });

    const onSubmit = async (data: TFormRegisterValues) => {
        try {
            await updateUserInfo({
                email: data.email,
                fullName: data.fullName,
                password: data.password,
            });

            toast.error('Данные обновлены 📝', {
                icon: '✅',
            });
        } catch (error) {
            return toast.error('Ошибка при обновлении данных', {
                icon: '❌',
            });
        }
    };

    const onClickSignOut = () => {
        signOut({
            callbackUrl: '/',
        });
    };

    // Проверяем, что data.loginHistory является массивом
    const loginHistory = Array.isArray(data.loginHistory) ? data.loginHistory : [];

    return (
        <Container className="my-10">
            <div className="flex flex-col gap-3 w-full mt-10">
                <div className="flex flex-col md:flex-row gap-3 w-full">
                    {/* Левая колонка: Форма */}
                    <div className="w-full md:w-1/2 p-4 rounded-lg">
                        <Title text={`Личные данные | #${data.id}`} size="md" className="font-bold" />

                        <FormProvider {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)}>
                                <FormInput name="email" label="E-Mail" required />
                                <FormInput name="fullName" label="Полное имя" required />

                                <FormInput type="password" name="password" label="Новый пароль" required />
                                <FormInput type="password" name="confirmPassword" label="Повторите пароль" required />

                                <Button disabled={form.formState.isSubmitting} className="text-base mt-10" type="submit">
                                    Сохранить
                                </Button>

                                <Button
                                    onClick={onClickSignOut}
                                    variant="secondary"
                                    disabled={form.formState.isSubmitting}
                                    className="text-base"
                                    type="button"
                                >
                                    Выйти
                                </Button>
                            </form>
                        </FormProvider>
                    </div>

                    {/* Правая колонка: История входов */}
                    <div className="w-full md:w-1/2 p-4 rounded-lg">
                        <Title text="История входов" size="md" className="font-bold mb-4" />
                        <Title text="Для получения бонусов не злоупотребляйте созданием аккаунтов :) Хороших ставок!" size="xs" className="font-bold mb-4" />
                        {loginHistory.length > 0 ? (
                            <div className="space-y-1">
                                {loginHistory.map((entry: any, index: number) => (
                                    <div key={index} className="p-1 border border-gray-300 rounded-lg">
                                        <p><strong>IP:</strong> {entry.ip}, {new Date(entry.lastLogin).toLocaleString()}, <strong>VPN:</strong> {entry.vpn ? 'Да' : 'Нет'}, {entry.loginCount}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>История входов отсутствует.</p>
                        )}
                    </div>
                </div>
            </div>
        </Container>
    );
};
