"use client"
import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/components/ui';
import toast from 'react-hot-toast';
import { useForm, FormProvider, SubmitHandler } from 'react-hook-form';
import { FormInput } from '@/components/form/form-input';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Схема валидации с использованием zod
const resetPasswordSchema = z.object({
    password: z
        .string()
        .min(4, 'Пароль должен содержать минимум 4 символа')
        .nonempty('Пароль обязателен'),
});

// Тип для формы
type FormValues = z.infer<typeof resetPasswordSchema>;

const ResetPassword: React.FC = () => {
    const methods = useForm<FormValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            password: '',
        },
    });
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    // Обработка ошибок валидации
    const { formState: { errors, isSubmitting } } = methods;

    // Показываем toast с ошибкой, если пароль короче 4 символов
    useEffect(() => {
        if (errors.password) {
            toast.error(errors.password.message || 'Ошибка валидации пароля', {
                duration: 2000, // Модальное окно отображается 3 секунды
                style: {
                    background: '#fee2e2',
                    color: '#b91c1c',
                    border: '1px solid #b91c1c',
                    padding: '16px',
                    borderRadius: '8px',
                },
            });
        }
    }, [errors.password]);

    const handleResetPassword: SubmitHandler<FormValues> = async (data) => {
        try {
            await axios.post('/api/auth/update-password', { token, password: data.password });
            toast.success('Пароль успешно обновлён', {
                icon: '✅',
                duration: 2000,
                style: {
                    background: '#d1fae5',
                    color: '#065f46',
                    border: '1px solid #065f46',
                    padding: '16px',
                    borderRadius: '8px',
                },
            });
            router.push('/');
        } catch (error) {
            console.error('Error [UPDATE PASSWORD]', error);
            toast.error('Не удалось обновить пароль', {
                icon: '❌',
                duration: 2000,
                style: {
                    background: '#fee2e2',
                    color: '#b91c1c',
                    border: '1px solid #b91c1c',
                    padding: '16px',
                    borderRadius: '8px',
                },
            });
        }
    };

    return (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(handleResetPassword)} className="flex flex-col items-center gap-5 max-w-md mx-auto p-6">
                <h1 className="text-2xl font-bold mb-4">Сброс пароля</h1>
                <FormInput
                    name="password"
                    label="Новый пароль * (Минимум 4 символа)"
                    type="password"
                    required
                />
                <Button
                    type="submit"
                    className="h-12 text-base w-full"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Обновление...' : 'Обновить пароль'}
                </Button>
            </form>
        </FormProvider>
    );
};

export default ResetPassword;