import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma/prisma-client';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
        return NextResponse.json({ message: 'Токен не предоставлен' }, { status: 400 });
    }

    try {
        const user = await prisma.user.findFirst({
            where: { verificationToken: token },
        });

        console.log('Found user with token:', user ? {
            id: user.id,
            email: user.email,
            verificationToken: user.verificationToken,
            verificationTokenExpires: user.verificationTokenExpires,
            emailVerified: user.emailVerified,
        } : null); // Логирование для отладки

        if (!user) {
            return NextResponse.json({ message: 'Неверный токен' }, { status: 404 });
        }

        if (user.emailVerified) {
            return NextResponse.json({ message: 'Email уже подтвержден' }, { status: 400 });
        }

        if (user.verificationTokenExpires && new Date() > user.verificationTokenExpires) {
            return NextResponse.json({ message: 'Токен истек' }, { status: 400 });
        }

        // Подтверждаем email
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                verificationToken: null,
                verificationTokenExpires: null, // Сбрасываем срок действия
            },
        });

        console.log('Email verified for user:', {
            id: updatedUser.id,
            email: updatedUser.email,
            emailVerified: updatedUser.emailVerified,
        }); // Логирование для отладки

        // Перенаправляем на клиентскую страницу для входа
        return NextResponse.redirect(new URL(`/verify-email?email=${encodeURIComponent(user.email)}`, req.url));
    } catch (error) {
        console.error('Ошибка при подтверждении email:', error);
        return NextResponse.json({ message: 'Ошибка сервера' }, { status: 500 });
    }
}