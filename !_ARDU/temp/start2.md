может тогда сделать другую папку для файлов?

# Сайт 2 ardu.live
server {
listen 80;
listen [::]:80;
server_name ardu.live www.ardu.live;
return 301 https://ardu.live$request_uri;
}

# HTTPS redirect from www to non-www
server {
listen 444 ssl;
listen [::]:444 ssl;
server_name www.ardu.live;
http2 on;

    ssl_certificate /etc/letsencrypt/live/ardu.live/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ardu.live/privkey.pem;

    return 301 https://ardu.live$request_uri;
}

# Main HTTPS server
server {
listen 444 ssl;
listen [::]:444 ssl;
server_name ardu.live;
http2 on;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/ardu.live/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ardu.live/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # SSL session cache
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;


    location /bank/ {
        alias /home/umdom/projects/prod/docker-ardu/public/bank/;
        add_header Cache-Control "public, max-age=31536000";
        try_files $uri =404;
    }

    # Root location
    location / {
        # proxy_pass http://localhost:3022;
        # proxy_pass http://127.0.0.1:3022;
        proxy_pass http://192.168.1.121:3022;
        # proxy_pass http://ardua:3022;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host:$server_port; # Добавьте порт
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Accept-Encoding ""; # Отключение сжатия для Server Actions
        proxy_buffering off;
        proxy_read_timeout 3600;
        proxy_cache_bypass $http_upgrade;
    }
}

\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\Dockerfile
\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\tailwind.config.ts
\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\next.config.mjs
\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\docker-compose.yml
\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\postcss.config.mjs
\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\.dockerignore
\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\components\profile\profile-start.tsx
\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\components\profile\profile-edit.tsx
\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\components\profile\profile-admin.tsx
\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\components\get-insurance\get-insurance-start.tsx
\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\app\api\insurance\route.ts
\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\app\api\upload-proof\route.ts
\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\app\(root)\get-insurance\page.tsx
\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\app\(root)\profile\admin\page.tsx
\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\app\(root)\profile\edit\page.tsx
\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\app\(root)\profile\page.tsx


// file: Dockerfile
# Этап сборки
FROM node:22 AS builder
WORKDIR /app2

# Копируем код и устанавливаем зависимости от пользователя node (хорошая практика)
COPY --chown=node:node . .
USER node

RUN yarn install --frozen-lockfile
RUN yarn build

# Этап запуска
FROM node:22

WORKDIR /app2

# Переключаемся на пользователя node сразу
USER node

# Копируем артефакты из builder с правильным владельцем
COPY --from=builder --chown=node:node /app2/.next ./.next
COPY --from=builder --chown=node:node /app2/public ./public
COPY --from=builder --chown=node:node /app2/package.json .
COPY --from=builder --chown=node:node /app2/node_modules ./node_modules

# Создаём папку для загруженных файлов (если её нет) — от node
RUN mkdir -p /app2/public/bank && chmod 755 /app2/public/bank

ENV NODE_ENV=production
EXPOSE 3022

CMD ["yarn", "start"]

// file: tailwind.config.ts
import type { Config } from 'tailwindcss';

const config = {
darkMode: ['class'],
content: [
'./pages/**/*.{ts,tsx}',
'./components/**/*.{ts,tsx}',
'./app/**/*.{ts,tsx}',
'./src/**/*.{ts,tsx}',
],
prefix: '',
theme: {
container: {
center: true,
padding: '2rem',
screens: {
'2xl': '1980px',
},
},
extend: {
colors: {
border: 'hsl(var(--border))',
input: 'hsl(var(--input))',
ring: 'hsl(var(--ring))',
background: 'hsl(var(--background))',
foreground: 'hsl(var(--foreground))',
primary: {
DEFAULT: 'hsl(var(--primary))',
foreground: 'hsl(var(--primary-foreground))',
},
secondary: {
DEFAULT: 'hsl(var(--secondary))',
foreground: 'hsl(var(--secondary-foreground))',
},
destructive: {
DEFAULT: 'hsl(var(--destructive))',
foreground: 'hsl(var(--destructive-foreground))',
},
muted: {
DEFAULT: 'hsl(var(--muted))',
foreground: 'hsl(var(--muted-foreground))',
},
accent: {
DEFAULT: 'hsl(var(--accent))',
foreground: 'hsl(var(--accent-foreground))',
},
popover: {
DEFAULT: 'hsl(var(--popover))',
foreground: 'hsl(var(--popover-foreground))',
},
card: {
DEFAULT: 'hsl(var(--card))',
foreground: 'hsl(var(--card-foreground))',
},
},
borderRadius: {
lg: 'var(--radius)',
md: 'calc(var(--radius) - 2px)',
sm: 'calc(var(--radius) - 4px)',
},
keyframes: {
'accordion-down': {
from: { height: '0' },
to: { height: 'var(--radix-accordion-content-height)' },
},
'accordion-up': {
from: { height: 'var(--radix-accordion-content-height)' },
to: { height: '0' },
},
},
animation: {
'accordion-down': 'accordion-down 0.2s ease-out',
'accordion-up': 'accordion-up 0.2s ease-out',
},
},
},
} satisfies Config;

export default config;


// file: next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
output: 'standalone',
poweredByHeader: false, // Добавлено: скрывает заголовок X-Powered-By

    turbopack: {},

    experimental: {
        serverActions: {
            bodySizeLimit: '50mb',
            allowedOrigins: [
                'localhost',
                '127.0.0.1',
                '192.168.1.121',
                '192.168.1.141',
                'ardu.live',
                'https://ardu.live',
                'https://ardu.live:444',
            ],
        },
    },

    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                fs: false,
                path: false,
                os: false,
            };
        }
        return config;
    },

    images: {
        unoptimized: true,
        // formats: ['image/avif', 'image/webp'],
        localPatterns: [
            {
                pathname: '/bank/**',
            },
        ],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
};

export default nextConfig;

// file: docker-compose.yml
services:
ardu:
build: .
working_dir: /app2
ports:
- "3022:3022"
volumes:
- /app2/node_modules  # Только для node_modules
- ./public:/app2/public  # Только public
env_file:
- .env
networks:
- sharednetwork
restart: unless-stopped

networks:
sharednetwork:
external: true

// file: postcss.config.mjs
/** @type {import('postcss-load-config').Config} */
const config = {
plugins: {
tailwindcss: {},
},
};

export default config;


// file: .dockerignore
public/bank/

// file: components/profile/profile-start.tsx
'use client';

import React, { useState, useRef } from 'react';
import { Container } from '../container';
import { Title } from '../title';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';
import {
Accordion,
AccordionContent,
AccordionItem,
AccordionTrigger,
} from '@/components/ui/accordion';
import axios from 'axios';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { cn } from '@/components/lib/utils';

interface Insurance {
id: number;
fullName: string;
birthDate: string | Date;
phoneNumber: string;
contacts: string[];
plan: string;
paymentMethod: string;
proofImage?: string | null;
status: string;
createdAt: string | Date;
updatedAt: string | Date;
}

interface Props {
data: {
id: number;
fullName: string;
email: string;
role?: string;
points?: number;
createdAt?: Date;
updatedAt?: Date;
};
insurances: Insurance[];
}

export const ProfileStart: React.FC<Props> = ({ data, insurances }) => {
const onClickSignOut = () => {
signOut({ callbackUrl: '/' });
};

    return (
        <Container className="my-10">
            <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
                <Title text={`Профиль | #${data.id}`} size="md" className="font-bold mb-8" />

                <div className="space-y-4 mb-8">
                    <p><strong>Имя:</strong> {data.fullName || 'Не указано'}</p>
                    <p><strong>Email:</strong> {data.email}</p>
                    {data.role && <p><strong>Роль:</strong> {data.role}</p>}
                    {data.points !== undefined && <p><strong>Баллы:</strong> {data.points}</p>}
                </div>

                {data.role === 'ADMIN' && (
                    <Link href="/profile/admin">
                        <Button className="mb-6">Админ-панель</Button>
                    </Link>
                )}

                <Button onClick={onClickSignOut} variant="destructive" className="mb-8">
                    Выйти
                </Button>

                <div>
                    <h2 className="text-2xl font-semibold mb-6">Ваши заявки на страховку</h2>

                    {insurances.length === 0 ? (
                        <p className="text-gray-500">У вас пока нет заявок на страховку</p>
                    ) : (
                        <Accordion type="single" collapsible className="w-full space-y-4">
                            {insurances.map((ins) => (
                                <EditableInsuranceCard key={ins.id} insurance={ins} />
                            ))}
                        </Accordion>
                    )}
                </div>
            </div>
        </Container>
    );
};

// Компонент для одной заявки с редактированием изображения
const EditableInsuranceCard: React.FC<{ insurance: Insurance }> = ({ insurance }) => {
const [isEditingImage, setIsEditingImage] = useState(false);
const [imagePreview, setImagePreview] = useState<string | null>(insurance.proofImage || null);
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const pasteRef = useRef<HTMLDivElement>(null);

    const isApproved = insurance.status === 'OK';

    const formatDate = (date: string | Date) => {
        return new Date(date).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        if (isApproved) return;
        e.preventDefault();
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) {
                    const file = new File([blob], 'pasted-image.png', { type: blob.type });
                    setSelectedFile(file);
                    const reader = new FileReader();
                    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
                    reader.readAsDataURL(file);
                    toast.success('Изображение вставлено из буфера!');
                    setIsEditingImage(true);
                }
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isApproved) return;
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onload = (ev) => setImagePreview(ev.target?.result as string);
            reader.readAsDataURL(file);
            setIsEditingImage(true);
        }
    };

    const removeImage = () => {
        setSelectedFile(null);
        setImagePreview(null);
        setIsEditingImage(true);
    };

    const handleSaveImage = async () => {
        if (isApproved) {
            toast.error('Изменение изображения недоступно после одобрения');
            return;
        }

        if (!selectedFile && !imagePreview && insurance.proofImage) {
            // Удаление изображения
            const formData = new FormData();
            formData.append('id', insurance.id.toString());

            try {
                await axios.put('/api/insurance', formData);
                toast.success('Изображение удалено');
                setImagePreview(null);
                setIsEditingImage(false);
                window.location.reload();
            } catch {
                toast.error('Ошибка при удалении');
            }
            return;
        }

        if (!selectedFile) {
            setIsEditingImage(false);
            return;
        }

        const formData = new FormData();
        formData.append('id', insurance.id.toString());
        formData.append('proofImage', selectedFile);

        try {
            await axios.put('/api/insurance', formData);
            toast.success('Изображение успешно обновлено');
            setIsEditingImage(false);
            window.location.reload();
        } catch {
            toast.error('Ошибка при загрузке изображения');
        }
    };

    return (
        <AccordionItem value={`item-${insurance.id}`} className="border rounded-lg">
            <AccordionTrigger className="px-6">
                Заявка от {formatDate(insurance.createdAt)}
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <p><strong>ФИО:</strong> {insurance.fullName}</p>
                            <p><strong>Дата рождения:</strong> {new Date(insurance.birthDate).toLocaleDateString('ru-RU')}</p>
                            <p><strong>Телефон:</strong> {insurance.phoneNumber}</p>
                            <p><strong>Для связи:</strong> {insurance.contacts.join(', ')}</p>
                        </div>
                        <div>
                            <p><strong>План:</strong> {insurance.plan === '50_year' ? '50$ на 1 год' : '150$ на 4 года'}</p>
                            <p><strong>Способ оплаты:</strong> {insurance.paymentMethod}</p>
                        </div>
                    </div>

                    {/* Статус */}
                    <div>
                        <p>
                            <strong>Статус:</strong>{' '}
                            <span
                                className={cn(
                                    'ml-2 px-3 py-1 rounded-full text-sm font-medium',
                                    isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                )}
                            >
                {isApproved ? 'Одобрено' : 'На рассмотрении'}
              </span>
                        </p>
                    </div>

                    {/* Подтверждение оплаты */}

                    {!isApproved ? (
                    <div>
                        <p className="font-medium mb-3">Подтверждение оплаты</p>

                        {!isEditingImage ? (
                            <div>
                                {insurance.proofImage ? (
                                    <div className="relative max-w-md mb-4">
                                        <Image
                                            src={insurance.proofImage}
                                            alt="Подтверждение оплаты"
                                            width={600}
                                            height={800}
                                            className="rounded-lg shadow-md object-contain"
                                            unoptimized
                                        />
                                    </div>
                                ) : (
                                    <p className="text-gray-500 mb-4">Подтверждение не загружено</p>
                                )}

                                {!isApproved ? (
                                    <Button onClick={() => setIsEditingImage(true)} size="sm">
                                        Изменить изображение
                                    </Button>
                                ) : (
                                    <p className="text-sm text-gray-500">
                                        {/*Изменение изображения недоступно после одобрения*/}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div>
                                <div
                                    ref={pasteRef}
                                    onPaste={handlePaste}
                                    contentEditable={true}
                                    suppressContentEditableWarning={true}
                                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 min-h-48 flex flex-col items-center justify-center focus:outline-none"
                                >
                                    {imagePreview ? (
                                        <div className="relative">
                                            <Image
                                                src={imagePreview}
                                                alt="Превью"
                                                width={500}
                                                height={500}
                                                className="max-w-full max-h-96 rounded-lg shadow-md object-contain"
                                            />
                                            <button
                                                type="button"
                                                onClick={removeImage}
                                                className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-gray-500 mb-2">Вставьте изображение (Ctrl+V) или выберите файл</p>
                                            <p className="text-sm text-gray-400">JPG, PNG</p>
                                        </div>
                                    )}
                                </div>

                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="mt-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:bg-blue-50 file:text-blue-700"
                                />

                                <div className="flex gap-3 mt-6">
                                    <Button onClick={handleSaveImage}>
                                        Сохранить изображение
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setIsEditingImage(false);
                                            setImagePreview(insurance.proofImage || null);
                                            setSelectedFile(null);
                                        }}
                                    >
                                        Отмена
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                    ):(<div></div>)}

                    {/* Кнопка удаления заявки */}
                    <div>
                        {!isApproved ? (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={async () => {
                                    if (confirm('Вы уверены, что хотите удалить эту заявку? Это действие нельзя отменить.')) {
                                        try {
                                            await axios.delete(`/api/insurance?id=${insurance.id}`);
                                            toast.success('Заявка удалена');
                                            window.location.reload();
                                        } catch {
                                            toast.error('Ошибка при удалении заявки');
                                        }
                                    }
                                }}
                            >
                                Удалить заявку
                            </Button>
                        ) : (
                            <p className="text-sm text-gray-500">
                                {/*Удаление заявки недоступно после одобрения*/}
                            </p>
                        )}
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
};

// file: components/profile/profile-edit.tsx
'use client';

import {zodResolver} from '@hookform/resolvers/zod';
import React from 'react';
import {FormProvider, useForm} from 'react-hook-form';
import {TFormRegisterValues, formRegisterSchema} from '../modals/auth-modal/forms/schemas';
import toast from 'react-hot-toast';
import {signOut} from 'next-auth/react';
import {Container} from '../container';
import {Title} from '../title';
import {FormInput} from '../form';
import {Button} from '@/components/ui';
import {updateUserInfo} from '@/app/actions';

// Исправленный интерфейс Props, соответствующий данным из ProfilePage
interface Props {
data: {
id: number;
fullName: string;
email: string;
role?: string; // Необязательное, так как используется в форме только id, fullName, email
points?: number;
createdAt?: Date;
updatedAt?: Date;
// Остальные поля модели User не нужны, но добавлены как необязательные для совместимости
provider?: string | null;
providerId?: string | null;
password?: string;
img?: string | null;
resetToken?: string | null;
verificationToken?: string | null;
emailVerified?: boolean;
verificationTokenExpires?: Date | null;
betsCreated?: any[];
betsPlaced?: any[];
};
}

export const ProfileEdit: React.FC<Props> = ({data}) => {
const form = useForm<TFormRegisterValues>({
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

            toast.success('Data updated 📝', {
                icon: '✅',
            });
        } catch (error) {
            return toast.error('Error updating data', {
                icon: '❌',
            });
        }
    };

    const onClickSignOut = () => {
        signOut({
            callbackUrl: '/',
        });
    };

    return (
        <Container className="my-10">
            <div className="max-w-md mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
                <Title text={`Personal Data | #${data.id}`} size="md" className="font-bold"/>

                <FormProvider {...form}>
                    <form className="flex flex-col gap-5 w-96 mt-10" onSubmit={form.handleSubmit(onSubmit)}>
                        <FormInput name="email" label="E-Mail" required/>
                        <FormInput name="fullName" label="Full Name" required/>
                        <FormInput type="password" name="password" label="New Password" required/>
                        <FormInput type="password" name="confirmPassword" label="Confirm Password" required/>

                        <Button disabled={form.formState.isSubmitting} className="text-base mt-10" type="submit">
                            Save
                        </Button>

                        <Button
                            onClick={onClickSignOut}
                            variant="secondary"
                            disabled={form.formState.isSubmitting}
                            className="text-base"
                            type="button">
                            Sign Out
                        </Button>
                    </form>
                </FormProvider>
            </div>
        </Container>
    );
};

// file: components/profile/profile-admin.tsx
'use client';

import React from 'react';
import {
Accordion,
AccordionContent,
AccordionItem,
AccordionTrigger,
} from '@/components/ui/accordion';
import Image from 'next/image';
import {Button} from "@/components/ui";
import axios from "axios";
import toast from "react-hot-toast";
import {cn} from "@/components/lib/utils";

interface Insurance {
id: number;
fullName: string;
birthDate: Date;
phoneNumber: string;
contacts: string[];
plan: string;
paymentMethod: string;
proofImage?: string | null;
status: string;
createdAt: Date;
updatedAt: Date;
user?: {
email: string;
fullName: string;
} | null;
}

interface Props {
insurances: Insurance[];
}

const ProfileAdmin: React.FC<Props> = ({insurances}) => {
return (
<div className="container mx-auto py-10 max-w-5xl">
<h1 className="text-3xl font-bold mb-8">Админ-панель: Заявки на страховку</h1>

            {insurances.length === 0 ? (
                <p className="text-gray-500">Заявок пока нет</p>
            ) : (
                <Accordion type="single" collapsible className="w-full">
                    {insurances.map((ins) => (
                        <AccordionItem key={ins.id} value={`item-${ins.id}`}>
                            <AccordionTrigger>
                                <div className="flex justify-between w-full pr-8">
                  <span>
                    {/* Форматируем дату красиво на русском */}
                      {new Date(ins.createdAt).toLocaleDateString('ru-RU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                      })}
                  </span>
                                    <span className="font-medium">{ins.fullName}</span>
                                    {/*{ins.user && <span className="text-sm text-gray-500">{ins.user.email}</span>}*/}
                                </div>
                            </AccordionTrigger>

                            <AccordionContent>
                                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p><strong>ФИО:</strong> {ins.fullName}</p>
                                            <p><strong>Дата
                                                рождения:</strong> {new Date(ins.birthDate).toLocaleDateString('ru-RU')}
                                            </p>
                                            <p><strong>Телефон:</strong> {ins.phoneNumber}</p>
                                            <p><strong>Для связи:</strong> {ins.contacts.join(', ')}</p>
                                            <p>
                                                <strong>План:</strong> {ins.plan === '50_year' ? '50$ на 1 год' : '150$ на 4 года'}
                                            </p>
                                            <p><strong>Способ оплаты:</strong> {ins.paymentMethod}</p>
                                            <p><strong>Статус:</strong> <span className="capitalize">{ins.status}</span>
                                            </p>
                                            {ins.user && (
                                                <p><strong>Пользователь:</strong> {ins.user.fullName} ({ins.user.email})
                                                </p>
                                            )}
                                        </div>

                                        {ins.proofImage && (
                                            <div>
                                                <p className="font-medium mb-2">Подтверждение оплаты:</p>
                                                <div className="relative max-w-sm">
                                                    <Image
                                                        src={ins.proofImage}
                                                        alt="Подтверждение оплаты"
                                                        width={600}
                                                        height={800}
                                                        className="rounded-lg shadow-md object-contain"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-sm text-gray-500">
                                        <p>Создано: {new Date(ins.createdAt).toLocaleString('ru-RU')}</p>
                                        <p>Обновлено: {new Date(ins.updatedAt).toLocaleString('ru-RU')}</p>
                                    </div>

                                    <div className="mt-4 flex gap-3">
                                        <p><strong>Статус:</strong>
                                            <span
                                                className={cn(
                                                    'ml-2 px-3 py-1 rounded-full text-sm font-medium',
                                                    ins.status === 'OK'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                )}
                                            >
{ins.status === 'OK' ? 'Одобрено' : 'На рассмотрении'}
</span>
</p>
<div>
{ins.status !== 'OK' && (
<Button
size="sm"
variant="outline"
className="border-green-600 text-green-600 hover:bg-green-50"
onClick={async () => {
if (confirm('Одобрить заявку?')) {
try {
await axios.patch('/api/insurance', { id: ins.id, status: 'ok' });
toast.success('Заявка одобрена');
window.location.reload();
} catch {
toast.error('Ошибка при одобрении');
}
}
}}
>
Одобрить
</Button>
)}
</div>
</div>
<div className="m-2">
<Button
variant="destructive"
size="sm"
onClick={async () => {
if (confirm('Удалить эту заявку навсегда?')) {
try {
await axios.delete(`/api/insurance?id=${ins.id}`);
toast.success('Заявка удалена');
window.location.reload();
} catch {
toast.error('Ошибка при удалении');
}
}
}}
>
Удалить
</Button>
</div>
</div>
</AccordionContent>
</AccordionItem>
))}
</Accordion>
)}
</div>
);
};

export default ProfileAdmin;

// file: components/get-insurance/get-insurance-start.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FormInput } from '@/components/form/form-input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AuthModal } from '@/components/modals/auth-modal';
import toast from 'react-hot-toast';
import axios from 'axios';
import Image from 'next/image';

const formSchema = z.object({
fullName: z.string().min(2, 'Введите ФИО'),
birthDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Неверная дата' }),
phoneNumber: z.string().min(5, 'Введите номер телефона'),
contacts: z.array(z.string()).optional(),
plan: z.string().min(1, 'Выберите план страхования'),
paymentMethod: z.string().min(1, 'Выберите способ оплаты'),
});

type FormValues = z.infer<typeof formSchema>;

interface PaymentItem {
name: string;
value: string;
description?: string;
}

interface PaymentGroup {
title: string;
items: PaymentItem[];
}

interface Props {
session: any;
paymentData: Record<string, PaymentGroup>;
}

const GetInsuranceStart: React.FC<Props> = ({ session, paymentData }) => {
const [openAuthModal, setOpenAuthModal] = useState(false);
const [selectedMethodDetails, setSelectedMethodDetails] = useState<PaymentItem | null>(null);
const [imagePreview, setImagePreview] = useState<string | null>(null);
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const pasteRef = useRef<HTMLDivElement>(null);

    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        mode: 'onChange',
        defaultValues: {
            fullName: session?.user?.fullName || '',
            birthDate: '',
            phoneNumber: '',
            contacts: [],
            plan: '',
            paymentMethod: '',
        },
    });

    const { setValue, watch, handleSubmit, formState: { errors }, trigger } = methods;
    const watchedPaymentMethod = watch('paymentMethod');

    // Показываем ошибки сразу
    useEffect(() => {
        trigger();
    }, [trigger]);

    // Детали способа оплаты
    useEffect(() => {
        if (!watchedPaymentMethod) {
            setSelectedMethodDetails(null);
            return;
        }

        let found: PaymentItem | null = null;
        Object.values(paymentData).forEach(group => {
            const item = group.items.find(i => i.name === watchedPaymentMethod);
            if (item) found = item;
        });

        setSelectedMethodDetails(found);
    }, [watchedPaymentMethod, paymentData]);

    const paymentMethods = React.useMemo(() => {
        return Object.values(paymentData)
            .flatMap(group => group.items.map(item => item.name));
    }, [paymentData]);

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) {
                    const file = new File([blob], 'pasted-image.png', { type: blob.type });
                    setSelectedFile(file);
                    const reader = new FileReader();
                    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
                    reader.readAsDataURL(file);
                    toast.success('Изображение вставлено из буфера!');
                    return;
                }
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onload = (ev) => setImagePreview(ev.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setSelectedFile(null);
        setImagePreview(null);
    };

    const onSubmit = async (data: FormValues) => {
        const formData = new FormData();

        formData.append('fullName', data.fullName);
        formData.append('birthDate', data.birthDate);
        formData.append('phoneNumber', data.phoneNumber);
        (data.contacts || []).forEach(contact => formData.append('contacts', contact));
        formData.append('plan', data.plan);
        formData.append('paymentMethod', data.paymentMethod);

        if (selectedFile) {
            formData.append('proofImage', selectedFile);
        }

        try {
            await axios.post('/api/insurance', formData);
            toast.success('Заявка на страховку успешно отправлена!');
            methods.reset();
            setImagePreview(null);
            setSelectedFile(null);
        } catch (error: any) {
            console.error('Error submitting insurance:', error);
            toast.error(error.response?.data?.error || 'Ошибка при отправке заявки');
        }
    };

    // Скролл к первой ошибке при отправке
    const handleFormSubmit = async () => {
        const isValid = await trigger();
        if (!isValid) {
            const firstError = Object.keys(errors)[0];
            if (firstError) {
                const element = document.querySelector(`[data-field="${firstError}"]`) as HTMLElement;
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }
    };

    if (!session) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold mb-4">Для оформления страховки нужно войти</h2>
                <Button onClick={() => setOpenAuthModal(true)} size="lg">
                    Войти / Зарегистрироваться
                </Button>
                <AuthModal open={openAuthModal} onClose={() => setOpenAuthModal(false)} />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-10">
            <h1 className="text-3xl font-bold mb-6">Оформление страховки</h1>
            <p className="text-gray-600 mb-10">
                Страхование при несчастных случаях (авариях), повлекших серьёзное ухудшение здоровья, не связанное с возрастными или иными заболеваниями.
            </p>

            <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

                    <FormInput name="fullName" label="ФИО" required />
                    <FormInput name="birthDate" label="Дата рождения" type="date" required />
                    <FormInput name="phoneNumber" label="Номер телефона" required />

                    {/* Для связи — необязательно */}
                    <div data-field="contacts">
                        <label className="block text-sm font-medium mb-3">
                            Для связи (выберите один или несколько)
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {['mobile', 'telegram', 'WhatsApp', 'Viber'].map((contact) => (
                                <label key={contact} className="flex items-center gap-3 cursor-pointer">
                                    <Checkbox
                                        checked={methods.watch('contacts')?.includes(contact) || false}
                                        onCheckedChange={(checked) => {
                                            const current = methods.watch('contacts') || [];
                                            if (checked) {
                                                setValue('contacts', [...current, contact]);
                                            } else {
                                                setValue('contacts', current.filter((c: string) => c !== contact));
                                            }
                                        }}
                                    />
                                    <span className="capitalize">{contact}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* План страхования */}
                    <div data-field="plan">
                        <label className="block text-sm font-medium mb-3">
                            Выберите план страхования <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <Checkbox
                                    checked={methods.watch('plan') === '50_year'}
                                    onCheckedChange={(checked) => setValue('plan', checked ? '50_year' : '', { shouldValidate: true })}
                                />
                                <span>50$ на 1 год</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <Checkbox
                                    checked={methods.watch('plan') === '150_4years'}
                                    onCheckedChange={(checked) => setValue('plan', checked ? '150_4years' : '', { shouldValidate: true })}
                                />
                                <span>150$ на 4 года</span>
                            </label>
                        </div>
                        {errors.plan && (
                            <p className="text-red-500 text-sm mt-2">
                                Выберите план страхования
                            </p>
                        )}
                    </div>

                    {/* Способ оплаты */}
                    <div data-field="paymentMethod" className="space-y-4">
                        <label className="block text-sm font-medium">
                            Способ оплаты <span className="text-red-500">*</span>
                        </label>
                        <Select onValueChange={(value) => setValue('paymentMethod', value, { shouldValidate: true })}>
                            <SelectTrigger className={errors.paymentMethod ? 'border-red-500' : ''}>
                                <SelectValue placeholder="Выберите способ оплаты" />
                            </SelectTrigger>
                            <SelectContent>
                                {paymentMethods.map((method) => (
                                    <SelectItem key={method} value={method}>
                                        {method}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.paymentMethod && (
                            <p className="text-red-500 text-sm">
                                Выберите способ оплаты
                            </p>
                        )}

                        {selectedMethodDetails && (
                            <div className="mt-6 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                                <h3 className="text-lg font-semibold mb-4">
                                    Реквизиты: {selectedMethodDetails.name}
                                </h3>

                                {selectedMethodDetails.value && (
                                    <div className="mb-4">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Значение для перевода:</p>
                                        <div className="flex items-center justify-between bg-white dark:bg-gray-900 p-3 rounded border">
                                            <code className="text-sm break-all">{selectedMethodDetails.value}</code>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(selectedMethodDetails.value);
                                                    toast.success('Скопировано!');
                                                }}
                                            >
                                                Копировать
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {selectedMethodDetails.description && (
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Инструкция:</p>
                                        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                                            {selectedMethodDetails.description}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Фото подтверждения */}
                    <div>
                        <label className="block text-sm font-medium mb-3">
                            Подтверждение оплаты (скриншот) — можно прислать позже
                        </label>

                        <div
                            ref={pasteRef}
                            onPaste={handlePaste}
                            contentEditable={true}
                            suppressContentEditableWarning={true}
                            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors min-h-48 flex flex-col items-center justify-center focus:outline-none focus:border-blue-500"
                        >
                            {imagePreview ? (
                                <div className="relative">
                                    <Image
                                        src={imagePreview}
                                        alt="Превью подтверждения оплаты"
                                        width={500}
                                        height={500}
                                        className="max-w-full max-h-96 rounded-lg shadow-md object-contain"
                                    />
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700 transition"
                                    >
                                        ×
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-gray-500 mb-2">Кликните сюда или вставьте изображение (Ctrl+V)</p>
                                    <p className="text-sm text-gray-400">Поддерживаются JPG, PNG, GIF</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-4">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        size="lg"
                        className="w-full"
                        onClick={handleFormSubmit}
                    >
                        Отправить заявку
                    </Button>
                </form>
            </FormProvider>
        </div>
    );
};

export default GetInsuranceStart;

// file: app/api/insurance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma/prisma-client';
import { getUserSession } from '@/components/lib/get-user-session';
import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'bank');

export async function POST(req: NextRequest) {
try {
const session = await getUserSession();
const formData = await req.formData();

        const fullName = formData.get('fullName') as string;
        const birthDateStr = formData.get('birthDate') as string;
        const phoneNumber = formData.get('phoneNumber') as string;
        const contacts = formData.getAll('contacts') as string[];
        const plan = formData.get('plan') as string;
        const paymentMethod = formData.get('paymentMethod') as string;
        const file = formData.get('proofImage') as File | null;

        if (!fullName || !birthDateStr || !phoneNumber || !plan || !paymentMethod) {
            return NextResponse.json({ error: 'Заполните все обязательные поля' }, { status: 400 });
        }

        const birthDate = new Date(birthDateStr);

        let proofImage: string | undefined;

        if (file && file instanceof File && file.size > 0) {
            if (!existsSync(UPLOAD_DIR)) {
                await mkdir(UPLOAD_DIR, { recursive: true });
            }

            const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
            const filename = `proof_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;
            const filepath = path.join(UPLOAD_DIR, filename);

            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            await fs.writeFile(filepath, buffer);

            proofImage = `/bank/${filename}`;
        }

        const insurance = await prisma.insurance.create({
            data: {
                userId: session?.user?.id ? Number(session.user.id) : undefined,
                fullName,
                birthDate,
                phoneNumber,
                contacts,
                plan,
                paymentMethod,
                proofImage,
            },
        });

        return NextResponse.json(insurance, { status: 201 });
    } catch (error) {
        console.error('Error creating insurance:', error);
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
try {
const session = await getUserSession();
if (!session?.user?.id) {
return NextResponse.json({ error: 'Неавторизован' }, { status: 401 });
}

        const userId = Number(session.user.id);
        const formData = await req.formData();

        const idStr = formData.get('id') as string;
        const id = parseInt(idStr);

        if (!id || isNaN(id)) {
            return NextResponse.json({ error: 'Неверный ID заявки' }, { status: 400 });
        }

        const insurance = await prisma.insurance.findUnique({
            where: { id },
        });

        if (!insurance || insurance.userId !== userId) {
            return NextResponse.json({ error: 'Заявка не найдена или доступ запрещён' }, { status: 404 });
        }

        // Запрещаем редактировать одобренную заявку
        if (insurance.status === 'OK') {
            return NextResponse.json({ error: 'Нельзя изменять одобренную заявку' }, { status: 403 });
        }

        const file = formData.get('proofImage') as File | null;

        let proofImage = insurance.proofImage;

        if (file && file instanceof File) {
            if (file.size === 0) {
                // Удаление изображения
                if (proofImage) {
                    const oldPath = path.join(process.cwd(), 'public', proofImage);
                    if (existsSync(oldPath)) {
                        await fs.unlink(oldPath).catch(() => console.log('Не удалось удалить старое изображение'));
                    }
                }
                proofImage = null;
            } else {
                // Загрузка нового
                if (proofImage) {
                    const oldPath = path.join(process.cwd(), 'public', proofImage);
                    if (existsSync(oldPath)) {
                        await fs.unlink(oldPath).catch(() => console.log('Не удалось удалить старое изображение'));
                    }
                }

                if (!existsSync(UPLOAD_DIR)) {
                    await mkdir(UPLOAD_DIR, { recursive: true });
                }

                const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
                const filename = `proof_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;
                const filepath = path.join(UPLOAD_DIR, filename);

                const bytes = await file.arrayBuffer();
                const buffer = Buffer.from(bytes);
                await fs.writeFile(filepath, buffer);

                proofImage = `/bank/${filename}`;
            }
        }

        const updated = await prisma.insurance.update({
            where: { id },
            data: { proofImage },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating insurance image:', error);
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
try {
const session = await getUserSession();
if (!session || session.user.role !== 'ADMIN') {
return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
}

        const { id, status } = await req.json();

        if (!id || !['pending', 'ok'].includes(status.toLowerCase())) {
            return NextResponse.json({ error: 'Неверные данные' }, { status: 400 });
        }

        const prismaStatus = status.toLowerCase() === 'ok' ? 'OK' : 'PENDING';

        const updated = await prisma.insurance.update({
            where: { id: Number(id) },
            data: { status: prismaStatus },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating status:', error);
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
try {
const session = await getUserSession();
if (!session?.user?.id) {
return NextResponse.json({ error: 'Неавторизован' }, { status: 401 });
}

        const { searchParams } = new URL(req.url);
        const idStr = searchParams.get('id');
        const id = parseInt(idStr || '');

        if (!id || isNaN(id)) {
            return NextResponse.json({ error: 'Неверный ID заявки' }, { status: 400 });
        }

        const insurance = await prisma.insurance.findUnique({
            where: { id },
        });

        if (!insurance) {
            return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 });
        }

        const isAdmin = session.user.role === 'ADMIN';
        const isOwner = insurance.userId === Number(session.user.id);

        if (!isAdmin && !isOwner) {
            return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
        }

        // Запрещаем удалять одобренную заявку
        if (insurance.status === 'OK') {
            return NextResponse.json({ error: 'Нельзя удалить одобренную заявку' }, { status: 403 });
        }

        if (insurance.proofImage) {
            const filePath = path.join(process.cwd(), 'public', insurance.proofImage);
            if (existsSync(filePath)) {
                await fs.unlink(filePath).catch(() => console.log('Не удалось удалить файл изображения'));
            }
        }

        await prisma.insurance.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting insurance:', error);
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
try {
const session = await getUserSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Неавторизован' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const isAdminRequest = searchParams.get('admin') === 'true';

        if (isAdminRequest && session.user.role === 'ADMIN') {
            const insurances = await prisma.insurance.findMany({
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: { email: true, fullName: true },
                    },
                },
            });
            return NextResponse.json(insurances);
        }

        const insurances = await prisma.insurance.findMany({
            where: { userId: Number(session.user.id) },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(insurances);
    } catch (error) {
        console.error('Error fetching insurances:', error);
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
    }
}

// file: app/api/upload-proof/route.ts
import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';

// Папка для хранения скриншотов
const UPLOAD_DIR = join(process.cwd(), 'public', 'bank');

export async function POST(request: Request) {
try {
// Убеждаемся, что папка существует
if (!existsSync(UPLOAD_DIR)) {
await mkdir(UPLOAD_DIR, { recursive: true });
}

        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json(
                { error: 'Файл не найден' },
                { status: 400 }
            );
        }

        // Проверка: только изображения
        if (!file.type.startsWith('image/')) {
            return NextResponse.json(
                { error: 'Разрешены только изображения' },
                { status: 400 }
            );
        }

        // Ограничение по размеру (10 МБ)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'Файл слишком большой (максимум 10 МБ)' },
                { status: 400 }
            );
        }

        // Генерируем уникальное имя: timestamp + random + оригинальное расширение
        const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const filename = `proof_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;
        const filepath = join(UPLOAD_DIR, filename);

        // Преобразуем File в Buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Сохраняем файл
        await writeFile(filepath, buffer);

        // Возвращаем публичный URL
        const publicUrl = `/bank/${filename}`;

        return NextResponse.json({
            message: 'Файл успешно загружен',
            path: publicUrl,
        });
    } catch (error) {
        console.error('Ошибка загрузки файла:', error);
        return NextResponse.json(
            { error: 'Внутренняя ошибка сервера при загрузке файла' },
            { status: 500 }
        );
    }
}

// file: app/(root)/get-insurance/page.tsx
import { getUserSession } from '@/components/lib/get-user-session';
import { getPaymentDetails } from '@/app/actions';
import GetInsuranceStart from '@/components/get-insurance/get-insurance-start';

export default async function GetInsurancePage() {
const session = await getUserSession();
const paymentData = await getPaymentDetails();

    return (
        <div className="container mx-auto px-4 py-12 max-w-5xl">
            <GetInsuranceStart session={session} paymentData={paymentData} />
        </div>
    );
}

// file: app/(root)/profile/admin/page.tsx
// app/(root)/profile/admin/page.tsx
import { prisma } from '@/prisma/prisma-client';
import { getUserSession } from '@/components/lib/get-user-session';
import { redirect } from 'next/navigation';
import ProfileAdmin from '@/components/profile/profile-admin';

export const dynamic = 'force-dynamic';

export default async function AdminProfilePage() {
const session = await getUserSession();

    if (!session || session.user.role !== 'ADMIN') {
        return redirect('/not-auth');
    }

    // Все заявки для админа
    const insurances = await prisma.insurance.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: { email: true, fullName: true },
            },
        },
    });

    return <ProfileAdmin insurances={insurances} />;
}

// file: app/(root)/profile/edit/page.tsx
// app/(root)/profile/edit/page.tsx
import { prisma } from '@/prisma/prisma-client';
import { ProfileEdit } from '@/components/profile/profile-edit';
import { getUserSession } from '@/components/lib/get-user-session';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ProfileEditPage() {
const session = await getUserSession();

    if (!session || !session.user || !session.user.id) {
        return redirect('/');
    }

    const userId = Number(session.user.id);
    if (isNaN(userId)) {
        return redirect('/');
    }

    const user = await prisma.user.findFirst({
        where: { id: userId },
        select: { id: true, email: true, fullName: true, role: true, points: true, createdAt: true, updatedAt: true },
    });

    if (!user) {
        return redirect('/');
    }

    return <ProfileEdit data={user} />;
}

// file: app/(root)/profile/page.tsx
// app/(root)/profile/page.tsx
import { prisma } from '@/prisma/prisma-client';
import { ProfileStart } from '@/components/profile/profile-start';
import { getUserSession } from '@/components/lib/get-user-session';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
const session = await getUserSession();

    if (!session || !session.user || !session.user.id) {
        return redirect('/');
    }

    const userId = Number(session.user.id);
    if (isNaN(userId)) {
        return redirect('/');
    }

    const user = await prisma.user.findFirst({
        where: { id: userId },
        select: { id: true, email: true, fullName: true, role: true, points: true, createdAt: true, updatedAt: true },
    });

    if (!user) {
        return redirect('/');
    }

    // Прямой запрос к Prisma — быстро и безопасно
    const insurances = await prisma.insurance.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });

    return <ProfileStart data={user} insurances={insurances} />;
}







