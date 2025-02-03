'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { TFormRegisterValues, formRegisterSchema } from './modals/auth-modal/forms/schemas';
import { User } from '@prisma/client';
import toast from 'react-hot-toast';
import { signOut } from 'next-auth/react';
import { Container } from './container';
import { Title } from './title';
import { FormInput } from './form';
import { Button } from '@/components/ui';
import { referralGet, updateUserInfo } from '@/app/actions';

interface Props {
    data: User;
}

export const ProfileForm: React.FC<Props> = ({ data }) => {
    const form = useForm({
        resolver: zodResolver(formRegisterSchema),
        defaultValues: {
            fullName: data.fullName,
            password: '',
            confirmPassword: '',
        },
    });

    const [referrals, setReferrals] = useState<any[]>([]); // State to hold referral data

    useEffect(() => {
        const fetchReferrals = async () => {
            try {
                const referralData = await referralGet();
                setReferrals(referralData);
            } catch (error) {
                console.error('Error fetching referral data:', error);
            }
        };

        fetchReferrals();
    }, []);

    const onSubmit = async (data: TFormRegisterValues) => {
        try {
            await updateUserInfo({
                fullName: data.fullName,
                password: data.password,
            });

            toast.success('Данные обновлены 📝', {
                icon: '✅',
            });
        } catch (error) {
            toast.error('Ошибка при обновлении данных', {
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
        <Container className="w-[98%]">
            <div className="flex flex-col gap-3 w-full mt-10">
                <div className="flex flex-col md:flex-row gap-3 w-full">
                    {/* Левая колонка: Форма */}
                    <div className="w-full md:w-1/2 p-4 rounded-lg">
                        <Title text={`Личные данные | #${data.id}`} size="md" className="font-bold"/>

                        <FormProvider {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-300">Email: {data.email}</label>
                                    <label className="block text-sm font-medium text-gray-300">Card ID: {data.cardId}</label>
                                </div>
                                <FormInput name="fullName" label="Полное имя" required/>
                                <FormInput type="password" name="password" label="Новый пароль" required/>
                                <FormInput type="password" name="confirmPassword" label="Повторите пароль" required/>

                                <Button disabled={form.formState.isSubmitting} className="text-base mt-10"
                                        type="submit">
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
                        <Title text="История входов" size="md" className="font-bold mb-4"/>
                        {loginHistory.length > 0 ? (
                            <div className="space-y-1">
                                {loginHistory.map((entry: any, index: number) => (
                                    <div key={index} className="p-1 border border-gray-300 rounded-lg">
                                        <p>
                                            <strong>IP:</strong> {entry.ip}, {new Date(entry.lastLogin).toLocaleString()}, <strong>VPN:</strong> {entry.vpn ? 'Да' : 'Нет'}, {entry.loginCount}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>История входов отсутствует.</p>
                        )}
                    </div>

                    {/* IP address */}
                    <div className="w-full md:w-1/2 p-4 rounded-lg">
                        <Title text="IP адреса рефералов" size="md" className="font-bold mb-4"/>
                        {referrals.length > 0 ? (
                            <div className="space-y-1">
                                {referrals.map((referral, index) => (
                                    <div key={index} className="p-1 border border-gray-300 rounded-lg">
                                        <p className={referral.referralStatus ? 'text-green-600' : 'text-gray-400'}>
                                            <strong>IP:</strong> {referral.referralIpAddress}, <strong>Дата:</strong> {new Date(referral.createdAt).toLocaleString()}, +{referral.referralPoints}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>Нет данных о рефералах.</p>
                        )}
                    </div>
                </div>
            </div>
        </Container>
    );
};
