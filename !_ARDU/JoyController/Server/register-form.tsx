'use client';

import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formRegisterSchema, TFormRegisterValues } from './schemas';
import { FormInput } from '@/components/form/form-input';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { registerUser } from '@/app/actions';

interface Props {
    onClose?: () => void;
}

export const RegisterForm: React.FC<Props> = ({ onClose }) => {
    const form = useForm<TFormRegisterValues>({
        resolver: zodResolver(formRegisterSchema),
        defaultValues: {
            fullName: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
    });

    const onSubmit = async (data: TFormRegisterValues) => {
        try {
            await registerUser({
                fullName: data.fullName,
                email: data.email,
                password: data.password,
            });

            toast.success('Регистрация успешна! Проверьте email для подтверждения', {
                icon: '📧',
                duration: 6000,
            });
            onClose?.();
        } catch (error: any) {
            console.error('[REGISTER]', error);
            toast.error(
                error.message || 'Ошибка регистрации. Возможно, email уже используется.',
                { icon: '❌' }
            );
        }
    };

    return (
        <FormProvider {...form}>
            <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(onSubmit)}>
                <FormInput name="fullName" label="Имя и фамилия" required />
                <FormInput name="email" label="E-Mail" required />
                <FormInput name="password" label="Пароль" type="password" required />
                <FormInput
                    name="confirmPassword"
                    label="Повторите пароль"
                    type="password"
                    required
                />

                <Button
                    type="submit"
                    loading={form.formState.isSubmitting}
                    className="h-12 text-base"
                >
                    Зарегистрироваться
                </Button>
            </form>
        </FormProvider>
    );
};