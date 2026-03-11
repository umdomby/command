
я хочу продавать свою программу JoyControl в интернете, хочу дать тестовое использование 2 часа в сутки, у меня есть сайт NextJS где программа может подключаться для авторизации,
программа защищается Native AOT
с базой данных Postgres и next js для админки и регистрации с токенами
программа будет продаваться на год или два, так что в Prisma нужно учитывать и даты, так же программа должна будет смотреть два поля по активации (админом если пользователь оплатил) и по дате, если дата просрочена то оповещаем клиента в C# и отключаем доступ

ДАвать пользователю 2 часа в сутки + периодических проверок JWT — это стандарт де-факто в 2025–2026 годах для десктопных приложений с онлайн-активацией. (что бы при новой установки нельзя было пользоваться копией программы, дополнительно в системе устанавливается единое время, возможно проверка времени через сервер, время по гринвичу?)
Клиент (C# WinForms/WPF)  
↓ HTTPS
↓ NEXT
↔ PostgreSQL Prisma
Admin + регистрация покупателей (Next.js 16 App Router)

| Место проверки                                      | Частота                                             | Что именно проверять                                      | Зачем именно здесь                                      |
|-----------------------------------------------------|-----------------------------------------------------|------------------------------------------------------------|---------------------------------------------------------|
| При запуске приложения                              | 1 раз при старте                                    | Обязательная проверка + загрузка токена                    | Блокирует запуск без валидного триала/лицензии          |
| Перед началом отправки данных в виртуальный контроллер (ViGEm ) | Каждый раз при активации читалки / каждые 30–60 сек | Быстрая проверка (только локально: expired?)               | Самое ценное место — здесь живёт монетизация            |
| В uiTimer (16–33 мс тик)                            | Каждый час                                          | Полная онлайн-проверка (запрос к серверу)                  | Обнаруживает подмену системного времени                 |
| При нажатии «SAVE», «ADD DEVICE», открытии настроек | 1 раз на действие                                   | Локальная проверка + иногда онлайн                         | Дополнительные точки «зацепа»                           |
| В критических классах (ControllerReader, SendReport и т.п.) | При каждом отправляемом отчёте                      | Минимальная проверка (токен не null + не expired)          | Очень тяжело вырезать все вызовы                        |


NEXT JS (серверные функции или как это будет реализовано в NEXT) будет просматривать время по гринвичу?


Сделай нужные поля в Prisma API Actions aдминка для админа чтобы давать пользователям доступ (когда админ дал доступ автоматически устанавливается и время)
так же админ мог просматривать сколько пользуется в тестовом 2 часа в сутки.
Давай для теста сделаем минимальную регистрацию в C# приложении и минимальный код доступ для старта и проверки всей логики с NEXT JS

https://ardu.live:444/profile страница регистрации на сайте

model User {
id                       Int         @id @default(autoincrement())
fullName                 String
email                    String      @unique
provider                 String?
providerId               String?
password                 String
role                     UserRole    @default(USER)
img                      String?
resetToken               String?
verificationToken        String? // Токен для подтверждения email
emailVerified            Boolean     @default(false) // Статус подтверждения email
verificationTokenExpires DateTime?
points                   Float       @default(1000)
createdAt                DateTime    @default(now())
updatedAt                DateTime    @updatedAt
insurances               Insurance[]
joyLicenses              JoyLicense[]   // связь один-ко-многим
@@map("users")
}

model JoyLicense {
id                  Int       @id @default(autoincrement())
userId              Int
licenseKey          String?   @unique
isActivated         Boolean   @default(false)
subscriptionType    String?   // "trial", "year", "two_years", "lifetime"
startsAt            DateTime  @default(now())
endsAt              DateTime? // null = lifetime
trialMinutesLimit   Int       @default(120)
trialMinutesUsed    Int       @default(0)
lastUsageDate       DateTime  @default(now())
deviceId            String?   // HWID для привязки к ПК
notes               String?
createdAt           DateTime  @default(now())
updatedAt           DateTime  @updatedAt

user                User      @relation(fields: [userId], references: [id], onDelete: Cascade)

@@index([userId])
@@index([licenseKey])
@@map("joy_licenses")
}
admin
\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\app\(root)\admin\joy\page.tsx

api
\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\app\api\joy\heartbeat\route.ts
\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\app\api\joy\login\route.ts
\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\app\api\joy\validate\route.ts

auth
\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\app\api\auth\[...nextauth]\route.ts
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import { authOptions } from '@/components/constants/auth-options';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
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
и если надо
\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\app\api\users\route.ts
import { prisma } from '@/prisma/prisma-client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
const users = await prisma.user.findMany();
return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
const data = await req.json();
const user = await prisma.user.create({
data,
});

return NextResponse.json(user);
}


Замени простой токен на настоящий JWT (jose в Next.js + System.IdentityModel.Tokens.Jwt в C# — Native AOT поддерживает).
Добавь удаление лицензии, лицензия может быть только одна, добавь чтобы админ мог устанавливать дату лицензии год число и месяц
Добавь machine-id проверку (HWID) на сервере, чтобы копия на другом ПК не работала.
В production сделай токен на 30–60 мин + refresh.
C# сделай класс регистрации и входа, пока C# пока программу C# сильно не нагружай. после добавим код защиты в другие классы.

