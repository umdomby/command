'use server';

import { prisma } from '@/prisma/prisma-client';
import { getUserSession } from '@/components/lib/get-user-session';
import { Prisma } from '@prisma/client';
import { hashSync } from 'bcrypt';
import { revalidatePath } from 'next/cache';


// Function to update user information
export async function updateUserInfo(body: Prisma.UserUpdateInput) {
    const currentUser = await getUserSession();

    if (!currentUser) {
        throw new Error('User not found');
    }

    const userId = Number(currentUser.user.id);
    if (isNaN(userId)) {
        throw new Error('Invalid user ID');
    }

    const findUser = await prisma.user.findFirst({
        where: { id: userId },
    });

    if (!findUser) {
        throw new Error('User not found in the database');
    }

    await prisma.user.update({
        where: { id: userId },
        data: {
            fullName: body.fullName,
            password: body.password ? hashSync(body.password as string, 10) : findUser.password,
        },
    });

    revalidatePath('/profile');
}

// Crypto для генерации токена
interface Crypto {
    randomBytes: (size: number) => Buffer;
}

let crypto: Crypto | undefined;
try {
    crypto = require('crypto');
} catch (err) {
    console.error('Crypto module is unavailable, using alternative method:', err);
}

// Function to register a new user
// Function to register a new user
export async function registerUser(body: Prisma.UserCreateInput) {
    const user = await prisma.user.findFirst({
        where: { email: body.email },
    });

    if (user) {
        // Если пользователь уже существует
        if (user.emailVerified) {
            throw new Error('Пользователь с таким email уже зарегистрирован и подтверждён');
        }

        // Если не подтверждён — отправляем письмо повторно с ТЕМ ЖЕ токеном
        console.log('Повторная отправка письма верификации для:', user.email);

        try {
            const { Resend } = await import('resend');
            const resend = new Resend(process.env.RESEND_API_KEY);

            await resend.emails.send({
                from: `ARDU Live <${process.env.EMAIL_FROM}>`,
                to: [user.email],
                subject: 'Подтверждение регистрации на ARDU Live (повторно)',
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #ff6200;">Подтверждение email</h2>
                    <p>Вы (или кто-то другой) снова запросили регистрацию с этим email.</p>
                    <p>Если это были вы — подтвердите email по ссылке ниже:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${user.verificationToken}"
                           style="background-color: #ff6200; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                            Подтвердить email
                        </a>
                    </div>
                    <p>Ссылка действительна до: ${user.verificationTokenExpires?.toLocaleString('ru-RU') || '24 часов'}.</p>
                </div>
            `,
            });

            console.log('Повторное письмо отправлено');
        } catch (error) {
            console.error('Ошибка повторной отправки:', error);
        }

        // Можно бросить ошибку или вернуть сообщение
        throw new Error('Пользователь с таким email уже существует. Письмо для подтверждения отправлено повторно.');
    }

    // Generate token for email verification
    let verificationToken: string;
    if (crypto && crypto.randomBytes) {
        verificationToken = crypto.randomBytes(32).toString('hex');
    } else {
        verificationToken = Array(32)
            .fill(0)
            .map(() => Math.random().toString(36).charAt(2))
            .join('');
        console.warn('Using alternative token generation method due to absence of crypto.randomBytes');
    }

    // Create user
    const newUser = await prisma.user.create({
        data: {
            fullName: body.fullName,
            email: body.email,
            password: hashSync(body.password, 10),
            verificationToken,
            emailVerified: false,
            verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
    });

    console.log('Created user:', {
        id: newUser.id,
        email: newUser.email,
        verificationToken: newUser.verificationToken,
        verificationTokenExpires: newUser.verificationTokenExpires,
        emailVerified: newUser.emailVerified,
    });

    // === ОТПРАВКА ПИСЬМА ЧЕРЕЗ RESEND ===
    try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
            from: `ARDU Live <${process.env.EMAIL_FROM}>`,
            to: [body.email],
            subject: 'Подтверждение регистрации на ARDU Live',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #ff6200;">Добро пожаловать в ARDU Live!</h2>
                    <p>Спасибо за регистрацию. Для завершения регистрации подтвердите ваш email:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${verificationToken}"
                           style="background-color: #ff6200; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                            Подтвердить email
                        </a>
                    </div>
                    <p>Или перейдите по прямой ссылке:</p>
                    <p><a href="${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${verificationToken}">
                        ${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${verificationToken}
                    </a></p>
                    <p style="color: #666; font-size: 12px; margin-top: 40px;">
                        Ссылка действительна 24 часа. Если вы не регистрировались — проигнорируйте это письмо.
                    </p>
                </div>
            `,
            text: `Подтвердите регистрацию: ${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${verificationToken}`,
        });

        console.log('Verification email sent successfully via Resend');
    } catch (error) {
        console.error('Failed to send verification email:', error);
        // Не бросаем ошибку — пользователь создан, просто письмо не ушло
        // Можно добавить уведомление админу или логирование
    }
}

// Получение всех платёжных реквизитов
export async function getPaymentDetails() {
    'use server';

    const details = await prisma.bank.findMany({
        orderBy: [
            { type: 'asc' },
            { order: 'asc' },
        ],
    });

    // Группируем по типу и сразу возвращаем результат reduce
    return details.reduce((acc, item) => {
        if (!acc[item.type]) {
            acc[item.type] = {
                title: item.title,
                items: [],
            };
        }
        acc[item.type].items.push({
            name: item.name,
            value: item.value,
            description: item.description ?? undefined, // null → undefined для TypeScript
        });
        return acc;
    }, {} as Record<string, { title: string; items: { name: string; value: string; description?: string }[] }>);
}