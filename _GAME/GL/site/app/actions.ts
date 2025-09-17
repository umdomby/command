'use server';
import {prisma} from '@/prisma/prisma-client';
import {getUserSession} from '@/components/lib/get-user-session';
import {Prisma} from '@prisma/client';
import {hashSync} from 'bcrypt';
import * as z from 'zod'
import { revalidatePath } from 'next/cache';
import nodemailer from "nodemailer";

// Импортируем crypto через require для серверного окружения
let crypto;
try {
    crypto = require('crypto');
} catch (err) {
    console.error('Модуль crypto недоступен, используем альтернативный метод:', err);
}

export async function registerUser(body: Prisma.UserCreateInput) {
    try {
        const user = await prisma.user.findFirst({
            where: {
                email: body.email,
            },
        });

        if (user) {
            throw new Error('Пользователь уже существует');
        }

        // Генерация токена для подтверждения email
        let verificationToken;
        if (crypto && crypto.randomBytes) {
            verificationToken = crypto.randomBytes(32).toString('hex');
        } else {
            // Альтернативный метод генерации токена
            verificationToken = Array(32)
                .fill(0)
                .map(() => Math.random().toString(36).charAt(2))
                .join('');
            console.warn('Используется альтернативный метод генерации токена из-за отсутствия crypto.randomBytes');
        }

        // Создание пользователя с токеном подтверждения и сроком действия
        const newUser = await prisma.user.create({
            data: {
                fullName: body.fullName,
                email: body.email,
                password: hashSync(body.password, 10),
                verificationToken,
                emailVerified: false,
                verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // Срок действия 24 часа
            },
        });

        console.log('Created user:', {
            id: newUser.id,
            email: newUser.email,
            verificationToken: newUser.verificationToken,
            verificationTokenExpires: newUser.verificationTokenExpires,
            emailVerified: newUser.emailVerified,
        }); // Логирование для отладки

        // Настройка и отправка письма
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: `"Heroes3" <${process.env.EMAIL_USER}>`,
            to: body.email,
            subject: 'Подтверждение регистрации',
            text: `Перейдите по ссылке для подтверждения вашего email: ${process.env.NEXTAUTH_URL}/verify-email?token=${verificationToken}`,
        };

        await transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Ошибка отправки письма:', error);
                throw error;
            }
            console.log('Письмо отправлено:', info.response);
        });

    } catch (err) {
        console.error('Error [CREATE_USER]', err);
        throw err;
    }
}