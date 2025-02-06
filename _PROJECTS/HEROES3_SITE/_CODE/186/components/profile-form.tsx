"use client";
import React, { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TFormRegisterValues, formRegisterSchema } from './modals/auth-modal/forms/schemas';
import { User } from '@prisma/client';
import toast from 'react-hot-toast';
import { signOut } from 'next-auth/react';
import { Container } from './container';
import { Title } from './title';
import { FormInput } from './form';
import { Button } from '@/components/ui';
import { referralGet, updateUserInfo, addBankDetails, deleteBankDetail, updateBankDetails } from '@/app/actions';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

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

    const [referrals, setReferrals] = useState<any[]>([]);
    const [bankDetails, setBankDetails] = useState<any[]>(Array.isArray(data.bankDetails) ? data.bankDetails : []);
    const [newBankDetail, setNewBankDetail] = useState({ name: '', details: '', description: '' });
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [editedDetail, setEditedDetail] = useState({ name: '', details: '', description: '' });

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

    const handleAddBankDetail = async () => {
        try {
            if (!newBankDetail.name || !newBankDetail.details || !newBankDetail.description) {
                throw new Error('Все поля должны быть заполнены');
            }
            const updatedBankDetails = await addBankDetails(newBankDetail);
            setBankDetails(updatedBankDetails);
            setNewBankDetail({ name: '', details: '', description: '' });
            toast.success('Банковский реквизит добавлен');
        } catch (error) {
            toast.error('Ошибка при добавлении банковского реквизита');
        }
    };

    const handleDeleteBankDetail = async (index: number) => {
        try {
            const updatedBankDetails = await deleteBankDetail(index);
            setBankDetails(updatedBankDetails);
            toast.success('Банковский реквизит удален');
        } catch (error) {
            toast.error('Ошибка при удалении банковского реквизита');
        }
    };

    const handleEditBankDetail = (index: number) => {
        setEditIndex(index);
        setEditedDetail(bankDetails[index]);
    };

    const handleSaveBankDetail = async () => {
        if (editIndex !== null) {
            const updatedDetails = [...bankDetails];
            updatedDetails[editIndex] = editedDetail;
            try {
                await updateBankDetails(updatedDetails);
                setBankDetails(updatedDetails);
                setEditIndex(null);
                toast.success('Банковские реквизиты обновлены');
            } catch (error) {
                toast.error('Ошибка при обновлении банковских реквизитов');
            }
        }
    };

    const loginHistory = Array.isArray(data.loginHistory) ? data.loginHistory : [];

    return (
        <Container className="w-[98%]">
            <div className="flex flex-col gap-3 w-full mt-10">
                <div className="flex flex-col md:flex-row gap-3 w-full">
                    <div className="w-full md:w-1/3 p-4 rounded-lg">
                        <Title text={`Личные данные | #${data.id}`} size="md" className="font-bold"/>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-300">Email: {data.email}</label>
                            <label className="block text-sm font-medium text-gray-300">Card ID: {data.cardId}</label>
                        </div>

                        <FormProvider {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)}>
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

                    <div className="w-full md:w-2/3 p-4 rounded-lg">
                        <Accordion type="single" collapsible>
                            <AccordionItem value="loginHistory">
                                <AccordionTrigger>История входов</AccordionTrigger>
                                <AccordionContent>
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
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="referralIPs">
                                <AccordionTrigger>IP адреса рефералов</AccordionTrigger>
                                <AccordionContent>
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
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="bankDetails">
                                <AccordionTrigger>Реквизиты банков</AccordionTrigger>
                                <AccordionContent>
                                    <div className="mb-4">
                                        <FormProvider {...form}>
                                        <FormInput
                                            name="bankName"
                                            label="Название"
                                            value={newBankDetail.name}
                                            onChange={(e) => setNewBankDetail({ ...newBankDetail, name: e.target.value })}
                                        />
                                        <FormInput
                                            name="bankDetails"
                                            label="Реквизиты"
                                            value={newBankDetail.details}
                                            onChange={(e) => setNewBankDetail({ ...newBankDetail, details: e.target.value })}
                                        />
                                        <FormInput
                                            name="bankDescription"
                                            label="Описание"
                                            value={newBankDetail.description}
                                            onChange={(e) => setNewBankDetail({ ...newBankDetail, description: e.target.value })}
                                        />
                                            </FormProvider>
                                        <Button onClick={handleAddBankDetail} className="mt-2">Добавить</Button>
                                    </div>

                                    <div className="space-y-1">
                                        {bankDetails.map((detail, index) => (
                                            <div key={index} className="p-1 border border-gray-300 rounded-lg flex justify-between items-center">
                                                {editIndex === index ? (
                                                    <div>
                                                        <input
                                                            type="text"
                                                            value={editedDetail.name}
                                                            onChange={(e) => setEditedDetail({ ...editedDetail, name: e.target.value })}
                                                            className="block w-full mb-1"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={editedDetail.details}
                                                            onChange={(e) => setEditedDetail({ ...editedDetail, details: e.target.value })}
                                                            className="block w-full mb-1"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={editedDetail.description}
                                                            onChange={(e) => setEditedDetail({ ...editedDetail, description: e.target.value })}
                                                            className="block w-full mb-1"
                                                        />
                                                        <Button onClick={handleSaveBankDetail} className="mt-2">Сохранить</Button>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <p><strong>Название:</strong> {detail.name}</p>
                                                        <p><strong>Реквизиты:</strong> {detail.details}</p>
                                                        <p><strong>Описание:</strong> {detail.description}</p>
                                                    </div>
                                                )}
                                                <div className="flex space-x-2">
                                                    <Button onClick={() => handleEditBankDetail(index)} variant="secondary">Изменить</Button>
                                                    <Button onClick={() => handleDeleteBankDetail(index)} variant="secondary">Удалить</Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </div>
            </div>
        </Container>
    );
};
