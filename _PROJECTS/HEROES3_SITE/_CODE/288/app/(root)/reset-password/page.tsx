"use client"
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/components/ui';
import toast from 'react-hot-toast';
import { FormInput } from '@/components/form/form-input';

const ResetPassword: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [password, setPassword] = useState('');

    const handleResetPassword = async () => {
        try {
            await axios.post('/api/auth/update-password', { token, password });
            toast.success('Пароль успешно обновлён', {
                icon: '✅',
            });
            router.push('/login');
        } catch (error) {
            console.error('Error [UPDATE PASSWORD]', error);
            toast.error('Не удалось обновить пароль', {
                icon: '❌',
            });
        }
    };

    return (
        <div className="flex flex-col items-center">
            <h1>Сброс пароля</h1>
            <FormInput
                name="password"
                label="Новый пароль"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            <Button onClick={handleResetPassword} className="h-12 text-base">
                Обновить пароль
            </Button>
        </div>
    );
};

export default ResetPassword;
