'use client';
import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui';
import { FormInput } from '@/components/form/form-input';
import toast from 'react-hot-toast';
import { registerUser } from '@/app/actions';

// Схема валидации для формы регистрации
const registerSchema = z.object({
    fullName: z.string().min(2, 'Имя должно содержать минимум 2 символа').nonempty('Имя обязательно'),
    email: z.string().email('Некорректный email').nonempty('Email обязателен'),
    password: z.string().min(4, 'Пароль должен содержать минимум 4 символа').nonempty('Пароль обязателен'),
});

type FormValues = z.infer<typeof registerSchema>;

interface Props {
    onClose?: VoidFunction;
}

export const RegisterForm: React.FC<Props> = ({ onClose }) => {
    const form = useForm<FormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            fullName: '',
            email: '',
            password: '',
        },
    });

    const onSubmit = async (data: FormValues) => {
        try {
            await registerUser(data);
            toast.success('Регистрация успешна! Проверьте ваш email для подтверждения.', {
                icon: '📧',
                duration: 5000,
                style: {
                    background: '#d1fae5',
                    color: '#065f46',
                    border: '1px solid #065f46',
                    padding: '16px',
                    borderRadius: '8px',
                },
            });
            onClose?.();
        } catch (error) {
            console.error('Error [REGISTER]', error);
            toast.error('Не удалось зарегистрироваться. Возможно, email уже занят.', {
                icon: '❌',
                duration: 3000,
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
        <FormProvider {...form}>
            <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(onSubmit)}>
                <FormInput name="fullName" label="Полное имя" required />
                <FormInput name="email" label="E-Mail" required />
                <FormInput name="password" label="Пароль (Минимум 4 символа)" type="password" required />

                <Button loading={form.formState.isSubmitting} className="h-12 text-base" type="submit">
                    Зарегистрироваться
                </Button>
            </form>
        </FormProvider>
    );
};