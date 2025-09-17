'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import toast from 'react-hot-toast';

export default function VerifyEmailPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email');

    useEffect(() => {
        async function handleSignIn() {
            if (!email) {
                toast.error('Email не предоставлен', {
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
                return;
            }

            try {
                // Выполняем вход через CredentialsProvider
                const response = await signIn('credentials', {
                    email,
                    password: '', // Пустой пароль, так как проверка пароля обходится
                    redirect: false,
                });

                console.log('SignIn response:', response); // Логирование для отладки

                if (response?.ok) {
                    toast.success('Email подтвержден и вход выполнен!', {
                        icon: '✅',
                        duration: 3000,
                        style: {
                            background: '#d1fae5',
                            color: '#065f46',
                            border: '1px solid #065f46',
                            padding: '16px',
                            borderRadius: '8px',
                        },
                    });
                    setTimeout(() => router.push('/'), 3000); // Перенаправление через 3 секунды
                } else {
                    toast.error(response?.error || 'Ошибка авторизации', {
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
            } catch (error) {
                console.error('Error [VERIFY_EMAIL]', error);
                toast.error('Ошибка сервера', {
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
        }

        handleSignIn();
    }, [email, router]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold">Подтверждение email</h1>
            <p className="text-gray-500">Пожалуйста, подождите, мы подтверждаем ваш email и выполняем вход...</p>
        </div>
    );
}