Доступ заблокирован: недопустимый запрос от этого приложения

umdom2@gmail.com

Вы не можете выполнить вход, потому что это приложение отправило недопустимый запрос. Повторите попытку позже или сообщите о неполадке разработчику. Подробнее об этой ошибке…

Если вы разработчик этого приложения, прочитайте подробную информацию об ошибке.

Ошибка 400: redirect_uri_mismatch





'use server';

import { prisma } from '@/prisma/prisma-client';
import { getUserSession } from '@/components/lib/get-user-session';
import { Prisma } from '@prisma/client';
import { hashSync } from 'bcrypt';
import * as z from 'zod';
import { revalidatePath } from 'next/cache';
import nodemailer from 'nodemailer';

// Function to update user information
export async function updateUserInfo(body: Prisma.UserUpdateInput) {
try {
const currentUser = await getUserSession();

        if (!currentUser) {
            throw new Error('User not found');
        }

        const userId = Number(currentUser.user.id); // Access user.id from session
        if (isNaN(userId)) {
            throw new Error('Invalid user ID');
        }

        const findUser = await prisma.user.findFirst({
            where: {
                id: userId,
            },
        });

        if (!findUser) {
            throw new Error('User not found in the database');
        }

        await prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                fullName: body.fullName,
                password: body.password ? hashSync(body.password as string, 10) : findUser.password,
            },
        });
        revalidatePath('/profile');
    } catch (err) {
        throw err;
    }
}

// Define type for crypto
interface Crypto {
randomBytes: (size: number) => Buffer;
}

// Declare crypto with type Crypto | undefined
let crypto: Crypto | undefined;
try {
crypto = require('crypto');
} catch (err) {
console.error('Crypto module is unavailable, using alternative method:', err);
}

// Function to register a new user
export async function registerUser(body: Prisma.UserCreateInput) {
try {
const user = await prisma.user.findFirst({
where: {
email: body.email,
},
});

        if (user) {
            throw new Error('User already exists');
        }

        // Generate token for email verification
        let verificationToken: string;
        if (crypto && crypto.randomBytes) {
            verificationToken = crypto.randomBytes(32).toString('hex');
        } else {
            // Alternative token generation method
            verificationToken = Array(32)
                .fill(0)
                .map(() => Math.random().toString(36).charAt(2))
                .join('');
            console.warn('Using alternative token generation method due to absence of crypto.randomBytes');
        }

        // Create user with verification token and expiration
        const newUser = await prisma.user.create({
            data: {
                fullName: body.fullName,
                email: body.email,
                password: hashSync(body.password, 10),
                verificationToken,
                emailVerified: false,
                verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 24 hours
            },
        });

        console.log('Created user:', {
            id: newUser.id,
            email: newUser.email,
            verificationToken: newUser.verificationToken,
            verificationTokenExpires: newUser.verificationTokenExpires,
            emailVerified: newUser.emailVerified,
        });

        // Configure and send email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: `"ChampCup" <${process.env.EMAIL_USER}>`,
            to: body.email,
            subject: 'Registration Confirmation',
            text: `Click the link to verify your email: ${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${verificationToken}`,
        };

        await transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                throw error;
            }
            console.log('Email sent:', info.response);
        });
    } catch (err) {
        console.error('Error [CREATE_USER]', err);
        throw err;
    }
}
\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\it-startup-site-444\app\(root)\not-auth
\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\it-startup-site-444\app\(root)\not-auth\page.tsx
\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\it-startup-site-444\app\(root)\profile
\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\it-startup-site-444\app\(root)\profile\page.tsx


// file: app/(root)/not-auth/page.tsx
import { InfoBlock } from '@/components/info-block';

export default function UnauthorizedPage() {
return (
<div className="flex flex-col items-center justify-center mt-40">
<InfoBlock
title="Access Denied"
text="Only authorized users can view this page"
imageUrl="/assets/images/lock.png"
/>
</div>
);
}


// file: app/(root)/profile/page.tsx
// app/(root)/profile/page.tsx
import { prisma } from '@/prisma/prisma-client';
import { ProfileForm } from '@/components/profile-form';
import { getUserSession } from '@/components/lib/get-user-session';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
const session = await getUserSession();
console.log('ProfilePage: session:', session); // Лог для отладки

    if (!session || !session.user || !session.user.id) {
        console.log('ProfilePage: No valid session or user ID, redirecting to /');
        return redirect('/');
    }

    const userId = Number(session.user.id);
    if (isNaN(userId)) {
        console.error('ProfilePage: Invalid user ID:', session.user.id);
        return redirect('/');
    }

    const user = await prisma.user.findFirst({
        where: { id: userId },
        select: { id: true, email: true, fullName: true, role: true, points: true, createdAt: true, updatedAt: true },
    });
    console.log('ProfilePage: user:', user); // Лог для отладки

    if (!user) {
        console.log('ProfilePage: User not found, redirecting to /');
        return redirect('/');
    }

    return <ProfileForm data={user} />;
}

\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\it-startup-site-444\components\constants\auth-options.ts

import { AuthOptions, User } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/prisma/prisma-client';
import { compare, hashSync } from 'bcrypt';
import { UserRole } from '@prisma/client';

// Define custom User type to match Prisma and NextAuth
interface CustomUser {
id: number; // Match Prisma's id: Int
email: string;
name: string;
role: UserRole;
}

export const authOptions: AuthOptions = {
providers: [
GoogleProvider({
clientId: process.env.GOOGLE_CLIENT_ID || '',
clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
}),
GitHubProvider({
clientId: process.env.GITHUB_ID || '',
clientSecret: process.env.GITHUB_SECRET || '',
profile(profile) {
return {
id: profile.id, // Keep as number for consistency
name: profile.name || profile.login,
email: profile.email,
image: profile.avatar_url,
role: 'USER' as UserRole,
};
},
}),
CredentialsProvider({
name: 'Credentials',
credentials: {
email: { label: 'Email', type: 'text' },
password: { label: 'Password', type: 'password' },
isVerifyEmail: { label: 'IsVerifyEmail', type: 'hidden' },
},
async authorize(credentials): Promise<CustomUser | null> {
if (!credentials) {
return null;
}

                const values = {
                    email: credentials.email,
                };

                const findUser = await prisma.user.findFirst({
                    where: values,
                });

                if (!findUser) {
                    return null;
                }

                console.log('Authorize credentials:', { email: credentials.email, isVerifyEmail: credentials.isVerifyEmail });

                if (credentials.isVerifyEmail === 'true') {
                    if (!findUser.emailVerified) {
                        throw new Error('Email not verified.');
                    }
                    return {
                        id: findUser.id, // Use number directly
                        email: findUser.email,
                        name: findUser.fullName,
                        role: findUser.role || 'USER',
                    };
                }

                if (!findUser.emailVerified) {
                    throw new Error('Please verify your email before logging in.');
                }

                const isPasswordValid = await compare(credentials.password, findUser.password);

                if (!isPasswordValid) {
                    return null;
                }

                return {
                    id: findUser.id, // Use number directly
                    email: findUser.email,
                    name: findUser.fullName,
                    role: findUser.role || 'USER',
                };
            },
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: 'jwt',
    },
    callbacks: {
        async signIn({ user, account }) {
            try {
                if (account?.provider === 'credentials') {
                    return true;
                }

                if (!user.email) {
                    return false;
                }

                const findUser = await prisma.user.findFirst({
                    where: {
                        OR: [
                            { provider: account?.provider, providerId: account?.providerAccountId },
                            { email: user.email },
                        ],
                    },
                });

                if (findUser) {
                    await prisma.user.update({
                        where: {
                            id: findUser.id,
                        },
                        data: {
                            provider: account?.provider,
                            providerId: account?.providerAccountId,
                        },
                    });

                    return true;
                }

                await prisma.user.create({
                    data: {
                        email: user.email,
                        fullName: user.name || 'User #' + user.id,
                        password: hashSync(user.id.toString(), 10),
                        provider: account?.provider,
                        providerId: account?.providerAccountId,
                        emailVerified: true,
                        role: 'USER',
                    },
                });

                return true;
            } catch (error) {
                console.error('Error [SIGNIN]', error);
                return false;
            }
        },
        async jwt({ token }) {
            if (!token.email) {
                return token;
            }

            const findUser = await prisma.user.findFirst({
                where: {
                    email: token.email,
                },
            });

            if (findUser) {
                token.id = findUser.id.toString(); // Convert number to string for JWT
                token.email = findUser.email;
                token.fullName = findUser.fullName;
                token.role = findUser.role || 'USER';
            }

            console.log('authOptions: jwt token:', token);
            return token;
        },
        async session({ session, token }) {
            if (session?.user && token.id) {
                session.user.id = token.id; // Keep as string to match JWT
                session.user.role = token.role || 'USER';
            }

            console.log('authOptions: session:', session);
            return session;
        },
    },
};

// npx prisma migrate dev --name init

generator client {
provider = "prisma-client-js"
}

datasource db {
provider  = "postgresql"
url       = env("POSTGRES_PRISMA_URL")
directUrl = env("POSTGRES_URL_NON_POOLING")
}

model User {
id                       Int       @id @default(autoincrement())
fullName                 String
email                    String    @unique
provider                 String?
providerId               String?
password                 String
role                     UserRole  @default(USER)
img                      String?
resetToken               String?
verificationToken        String? // Токен для подтверждения email
emailVerified            Boolean   @default(false) // Статус подтверждения email
verificationTokenExpires DateTime?
points                   Float     @default(1000)
createdAt                DateTime  @default(now())
updatedAt                DateTime  @updatedAt
}

model Category {
id       Int       @id @default(autoincrement())
name     String    @unique
products Product[]
}

model Product {
id         Int           @id @default(autoincrement())
name       String        @unique
categoryId Int
category   Category      @relation(fields: [categoryId], references: [id])
items      ProductItem[]
}

model ProductItem {
id        Int     @id @default(autoincrement())
name      String  @unique
productId Int
product   Product @relation(fields: [productId], references: [id])
}

enum UserRole {
USER
ADMIN
}


ошибка когда я разлогиниваюсь а потом срзу залогиниваюсь, но если я перезапускаю страницу залогинивается без ошибок
