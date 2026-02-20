'use client';

import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formLoginSchema, TFormLoginValues } from './schemas';
import { FormInput } from '@/components/form/form-input';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { signIn } from 'next-auth/react';
import axios from 'axios';

interface Props {
    onClose?: () => void;
}

export const LoginForm: React.FC<Props> = ({ onClose }) => {
    const form = useForm<TFormLoginValues>({
        resolver: zodResolver(formLoginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const onSubmit = async (data: TFormLoginValues) => {
        try {
            const resp = await signIn('credentials', {
                ...data,
                redirect: false,
            });

            if (!resp?.ok) {
                // Вместо throw сразу показываем ошибку
                const errorMessage = resp?.error || 'Неверный email или пароль';
                toast.error(errorMessage, { icon: '❌' });
                return; // выходим из функции
            }

            toast.success('Вы успешно вошли', { icon: '✅' });
            onClose?.();
        } catch (error: any) {
            console.error('[LOGIN]', error);
            // Обработка неожиданных ошибок (например, сеть упала)
            toast.error('Произошла ошибка при входе. Попробуйте позже', { icon: '❌' });
        }
    };

    const handlePasswordReset = async () => {
        const email = form.getValues('email');
        const validation = formLoginSchema.shape.email.safeParse(email);

        if (!validation.success) {
            toast.error('Введите корректный email', { icon: '❌' });
            return;
        }

        try {
            await axios.post('/api/auth/reset-password', { email });
            toast.success('Инструкции по сбросу пароля отправлены на email', {
                icon: '📧',
                duration: 5000,
            });
        } catch (error: any) {
            console.error('[RESET PASSWORD]', error);
            toast.error(
                error.response?.data?.message ||
                'Не удалось отправить инструкции. Попробуйте позже',
                { icon: '❌' }
            );
        }
    };

    return (
        <FormProvider {...form}>
            <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(onSubmit)}>
                <FormInput name="email" label="E-Mail" required />
                <FormInput name="password" label="Пароль" type="password" required />

                <Button
                    type="submit"
                    loading={form.formState.isSubmitting}
                    className="h-12 text-base"
                >
                    Войти
                </Button>

                <Button
                    type="button"
                    variant="outline"
                    onClick={handlePasswordReset}
                    className="h-12 text-base"
                >
                    Забыли пароль?
                </Button>
            </form>
        </FormProvider>
    );
};