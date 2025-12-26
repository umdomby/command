bank/proof_1766707207328_jnsj1c.png:1  GET https://ardu.live:444/bank/proof_1766707207328_jnsj1c.png 404 (Not Found)



$ umdom@PC1:~/projects/prod/docker-ardu$ docker exec -it docker-ardu-ardu-1 sh

$ ls -la

total 48

drwxr-xr-x   1 root root  4096 Dec 25 23:42 .

drwxr-xr-x   1 root root  4096 Dec 25 23:43 ..

drwxr-xr-x  10 node node  4096 Dec 25 23:42 .next

drwxr-xr-x 491 node node 24576 Dec 25 23:43 node_modules

-rw-r--r--   1 node node  2790 Dec 25 02:54 package.json

drwxr-xr-x   5 node node  4096 Dec 25 00:52 public

$ cd /app2/public/bank

$ ls -la

total 124

drwxrwxrwx 2 node node  4096 Dec 25 23:54 .

drwxr-xr-x 5 node node  4096 Dec 25 00:52 ..

-rw-r--r-- 1 node node  9271 Dec 25 03:24 proof_1766633081600_7cy6db.png

-rw-r--r-- 1 node node  4699 Dec 25 03:36 proof_1766633765583_17t7rb.png

-rw-r--r-- 1 node node 12030 Dec 25 03:56 proof_1766634970276_ycq8e4.png

-rw-r--r-- 1 node node  1511 Dec 25 04:36 proof_1766637405816_8xpmvs.png

-rw-r--r-- 1 node node 24070 Dec 25 20:30 proof_1766694602699_exsw9o.png

-rw-r--r-- 1 node node 54509 Dec 25 23:54 proof_1766706852870_wz9hiv.png



перезагружаю контейнер, файлы появляются

e487b1ef57f3   docker-ardu-ardu           "docker-entrypoint.s…"   17 minutes ago   Up About a minute   0.0.0.0:3022->3022/tcp, [::]:3022->3022/tcp                                    docker-ardu-ardu-1



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

\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\docker-compose.yml

\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\components\profile\profile-start.tsx

\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\components\profile\profile-edit.tsx

\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\.dockerignore

\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\postcss.config.mjs

\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\next.config.mjs

\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\tailwind.config.ts

\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\tsconfig.json





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



// file: .dockerignore

public/bank/



// file: postcss.config.mjs

/** @type {import('postcss-load-config').Config} */

const config = {

plugins: {

    tailwindcss: {},

},

};



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





// file: tsconfig.json

{

"compilerOptions": {

    "lib": [

      "dom",

      "dom.iterable",

      "esnext"

    ],

    "allowJs": true,

    "skipLibCheck": true,

    "strict": true,

    "noEmit": true,

    "esModuleInterop": true,

    "module": "esnext",

    "moduleResolution": "bundler",

    "resolveJsonModule": true,

    "isolatedModules": true,

    "jsx": "react-jsx",

    "incremental": true,

    "plugins": [

      {

        "name": "next"

      }

    ],

    "paths": {

      "@/*": [

        "./*"

      ]

    },

    "target": "ES2017"

},

"include": [

    "next-env.d.ts",

    "**/*.ts",

    "**/*.tsx",

    ".next/types/**/*.ts",

    "@types/*.d.ts",

    ".next/dev/types/**/*.ts"

],

"exclude": [

    "node_modules",

    "public"

]

}



почему файл не видно сразу или при редактировании, он то есть на в докере и в хосте






chmod +x /home/umdom
chmod +x /home/umdom/projects
chmod +x /home/umdom/projects/prod
chmod +x /home/umdom/projects/prod/docker-ardu
chmod -R 777 /home/umdom/projects/prod/docker-ardu/public/bank

cd /home/umdom/projects/prod/docker-ardu/public
sudo chmod -R 755 bank 
sudo chmod -R 644 bank/*  
sudo chgrp -R www-data bank

sudo su -s /bin/sh -c 'cat /home/umdom/projects/prod/docker-ardu/public/bank/proof_1766710542876_zmktkg.png' www-data
