\\wsl.localhost\Ubuntu-24.04\home\pi\prod\docker-ardua-444\@types
\\wsl.localhost\Ubuntu-24.04\home\pi\prod\docker-ardua-444\@types\next-auth.d.ts
\\wsl.localhost\Ubuntu-24.04\home\pi\prod\docker-ardua-444\app\api\auth\[...nextauth]\route.ts
\\wsl.localhost\Ubuntu-24.04\home\pi\prod\docker-ardua-444\app\api\auth\[...nextauth]
\\wsl.localhost\Ubuntu-24.04\home\pi\prod\docker-ardua-444\app\api\auth
\\wsl.localhost\Ubuntu-24.04\home\pi\prod\docker-ardua-444\app\api
\\wsl.localhost\Ubuntu-24.04\home\pi\prod\docker-ardua-444\app\api\users
\\wsl.localhost\Ubuntu-24.04\home\pi\prod\docker-ardua-444\app\api\users\route.ts
\\wsl.localhost\Ubuntu-24.04\home\pi\prod\docker-ardua-444\app\register
\\wsl.localhost\Ubuntu-24.04\home\pi\prod\docker-ardua-444\app\register\page.tsx
\\wsl.localhost\Ubuntu-24.04\home\pi\prod\docker-ardua-444\components\constants\auth-options.ts
\\wsl.localhost\Ubuntu-24.04\home\pi\prod\docker-ardua-444\components\modals\auth-modal\forms\login-form.tsx
\\wsl.localhost\Ubuntu-24.04\home\pi\prod\docker-ardua-444\components\modals\auth-modal\forms\register-form.tsx
\\wsl.localhost\Ubuntu-24.04\home\pi\prod\docker-ardua-444\components\modals\auth-modal\forms
\\wsl.localhost\Ubuntu-24.04\home\pi\prod\docker-ardua-444\components\modals\auth-modal\forms\schemas.ts
\\wsl.localhost\Ubuntu-24.04\home\pi\prod\docker-ardua-444\components\modals\auth-modal\auth-modal.tsx
\\wsl.localhost\Ubuntu-24.04\home\pi\prod\docker-ardua-444\components\modals\auth-modal\index.ts
\\wsl.localhost\Ubuntu-24.04\home\pi\prod\docker-ardua-444\components\modals\index.ts
\\wsl.localhost\Ubuntu-24.04\home\pi\prod\docker-ardua-444\components\register-page.tsx



// file: docker-ardua-444/@types/next-auth.d.ts
// Ref: https://next-auth.js.org/getting-started/typescript#module-augmentation

import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';
import type { UserRole } from '@prisma/client';

declare module 'next-auth' {
interface Session {
user: {
id: string;
role: UserRole;
name: string;
image: string;
};
}

interface User extends DefaultUser {
id: number;
role: UserRole;
}
}

declare module 'next-auth/jwt' {
interface JWT extends DefaultJWT {
id: string;
role: UserRole;
}
}


// file: docker-ardua-444/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import { authOptions } from '@/components/constants/auth-options';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };


// file: docker-ardua-444/app/api/users/route.ts
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


// file: docker-ardua-444/app/register/page.tsx
import { RegisterPage } from '@/components/register-page';

export default RegisterPage;

// file: docker-ardua-444/components/constants/auth-options.ts
import { AuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

import { prisma } from '@/prisma/prisma-client';
import { compare, hashSync } from 'bcrypt';
import { UserRole } from '@prisma/client';

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
id: profile.id,
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
},
async authorize(credentials) {
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

        const isPasswordValid = await compare(credentials.password, findUser.password);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: findUser.id,
          email: findUser.email,
          name: findUser.fullName,
          role: findUser.role,
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
        token.id = String(findUser.id);
        token.email = findUser.email;
        token.fullName = findUser.fullName;
        token.role = findUser.role;
      }

      return token;
    },
    session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }

      return session;
    },
},
};


// file: docker-ardua-444/components/modals/auth-modal/forms/login-form.tsx
import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { TFormLoginValues, formLoginSchema } from './schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { Title } from '../../../title';
import { FormInput } from '@/components/form/form-input';
import { Button } from '@/components/ui';
import toast from 'react-hot-toast';
import { signIn } from 'next-auth/react';

interface Props {
onClose?: VoidFunction;
}

export const LoginForm: React.FC<Props> = ({ onClose }) => {
const form = useForm<TFormLoginValues>({
resolver: zodResolver(formLoginSchema),
defaultValues: {
email: '',
password: '',
},
});

const onSubmit = async (data: TFormLoginValues) => {
try {
const resp = await signIn('credentials', {
...data,
redirect: false,
});

      if (!resp?.ok) {
        throw Error();
      }

      toast.success('Вы успешно вошли в аккаунт', {
        icon: '✅',
      });

      onClose?.();
    } catch (error) {
      console.error('Error [LOGIN]', error);
      toast.error('Не удалось войти в аккаунт', {
        icon: '❌',
      });
    }
};

return (
<FormProvider {...form}>
<form className="flex flex-col gap-5" onSubmit={form.handleSubmit(onSubmit)}>
<div className="flex justify-between items-center">
<div className="mr-2">
<Title text="Вход в аккаунт" size="md" className="font-bold text-gray-400" />
<p className="text-gray-400">Введите свою почту, чтобы войти в свой аккаунт</p>
</div>
<img src="/assets/images/phone-icon.png" alt="phone-icon" width={60} height={60} />
</div>

        <FormInput name="email" label="E-Mail" required />
        <FormInput name="password" label="Пароль" type="password" required />

        <Button loading={form.formState.isSubmitting} className="h-12 text-base" type="submit">
          Войти
        </Button>
      </form>
    </FormProvider>
);
};


// file: docker-ardua-444/components/modals/auth-modal/forms/register-form.tsx
'use client';

import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { registerUser } from '@/app/actions';
import { TFormRegisterValues, formRegisterSchema } from './schemas';
import { FormInput } from '@/components/form/form-input';
import { Button } from '@/components/ui';

interface Props {
onClose?: VoidFunction;
onClickLogin?: VoidFunction;
}

export const RegisterForm: React.FC<Props> = ({ onClose, onClickLogin }) => {
const form = useForm<TFormRegisterValues>({
resolver: zodResolver(formRegisterSchema),
defaultValues: {
email: '',
fullName: '',
password: '',
confirmPassword: '',
},
});

const onSubmit = async (data: TFormRegisterValues) => {
console.log('Form data:', data); // Логирование входных данных
try {
await registerUser({
email: data.email,
fullName: data.fullName,
password: data.password,
});
// toast.error('Регистрация успешна 📝. Подтвердите свою почту', {
toast.error('Регистрация успешна 📝. Можете войти в акккаунт', {
icon: '✅',
});

      onClose?.();
    } catch (error) {
      console.error('Registration error:', error);
      return toast.error('Неверный E-Mail или пароль, может пользователь уже существует', {
        icon: '❌',
      });
    }
};

return (
<FormProvider {...form}>
<form className="flex flex-col gap-5" onSubmit={form.handleSubmit(onSubmit)}>
<FormInput name="email" label="E-Mail" required />
<FormInput name="fullName" label="Полное имя" required />
<FormInput name="password" label="Пароль" type="password" required />
<FormInput name="confirmPassword" label="Подтвердите пароль" type="password" required />

        <Button loading={form.formState.isSubmitting} className="h-12 text-base" type="submit">
          Зарегистрироваться
        </Button>
      </form>
    </FormProvider>
);
};


// file: docker-ardua-444/components/modals/auth-modal/forms/schemas.ts
import { z } from 'zod';

export const passwordSchema = z.string().min(4, { message: 'Введите корректный пароль' });

export const formLoginSchema = z.object({
email: z.string().email({ message: 'Введите корректную почту' }),
password: passwordSchema,
});

export const formRegisterSchema = formLoginSchema
.merge(
z.object({
fullName: z.string().min(2, { message: 'Введите имя и фамилию' }),
confirmPassword: passwordSchema,
}),
)
.refine((data) => data.password === data.confirmPassword, {
message: 'Пароли не совпадают',
path: ['confirmPassword'],
});

export type TFormLoginValues = z.infer<typeof formLoginSchema>;
export type TFormRegisterValues = z.infer<typeof formRegisterSchema>;


// file: docker-ardua-444/components/modals/auth-modal/auth-modal.tsx
'use client';

import { Button } from '@/components/ui/button';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import { signIn } from 'next-auth/react';
import React from 'react';
import { LoginForm } from './forms/login-form';
import { RegisterForm } from './forms/register-form';


interface Props {
open: boolean;
onClose: () => void;
}

export const AuthModal: React.FC<Props> = ({ open, onClose }) => {
const [type, setType] = React.useState<'login' | 'register'>('login');

    const onSwitchType = () => {
        setType(type === 'login' ? 'register' : 'login');
    };

    const handleClose = () => {
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="w-[450px] bg-secondary p-10">
                <DialogHeader>
                    <DialogTitle>Edit profile</DialogTitle>
                    <DialogDescription>
                        Auth
                    </DialogDescription>
                </DialogHeader>
                {type === 'login' ? (
                    <LoginForm onClose={handleClose} />
                ) : (
                    <RegisterForm onClose={handleClose} />
                )}

                <hr />
                <div className="flex gap-2">

                    {/*<Button*/}
                    {/*  variant="secondary"*/}
                    {/*  onClick={() =>*/}
                    {/*    signIn('github', {*/}
                    {/*      callbackUrl: '/',*/}
                    {/*      redirect: true,*/}
                    {/*    })*/}
                    {/*  }*/}
                    {/*  type="button"*/}
                    {/*  className="gap-2 h-12 p-2 flex-1">*/}
                    {/*  <img className="w-6 h-6" src="https://github.githubassets.com/favicons/favicon.svg" />*/}
                    {/*  GitHub*/}
                    {/*</Button>*/}

                    <Button
                        variant="secondary"
                        onClick={() =>
                            signIn('google', {
                                callbackUrl: '/',
                                redirect: true,
                            })
                        }
                        type="button"
                        className="gap-2 h-12 p-2 flex-1">
                        <img
                            className="w-6 h-6"
                            src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg"
                        />
                        Google
                    </Button>
                </div>

                <Button variant="outline" onClick={onSwitchType} type="button" className="h-12">
                    {type !== 'login' ? 'Войти' : 'Регистрация'}
                </Button>
            </DialogContent>
        </Dialog>
    );
};


// file: docker-ardua-444/components/modals/auth-modal/index.ts
export { AuthModal } from './auth-modal';


// file: docker-ardua-444/components/modals/index.ts
export { AuthModal } from './auth-modal';


// file: docker-ardua-444/components/register-page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';
import React, { useState } from 'react';
import { LoginForm } from '@/components/modals/auth-modal/forms/login-form';
import { RegisterForm } from '@/components/modals/auth-modal/forms/register-form';
import { Container } from '@/components/container';
import { useRouter } from 'next/navigation'; // Импортируем useRouter

export const RegisterPage: React.FC = () => {
const [type, setType] = useState<'login' | 'register'>('register');
const router = useRouter(); // Для управления маршрутами

    const onSwitchType = () => {
        setType(type === 'login' ? 'register' : 'login');
    };

    // Функция для обработки успешного входа/регистрации
    const handleSuccess = () => {
        // Не закрываем форму и не редиректим на главную, оставляем на текущей странице
        // Или редиректим на нужную страницу, например:
        router.push('/'); // Замените '/profile' на нужный маршрут
    };

    return (
        <Container className="flex flex-col my-10 items-center justify-center min-h-screen">
            <div className="w-[350px] bg-secondary p-10 rounded-lg shadow-lg">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold">Профиль</h2>
                    <p className="text-sm text-muted-foreground">
                        Пожалуйста, войдите или зарегистрируйтесь, чтобы продолжить.
                    </p>
                </div>
                {type === 'login' ? (
                    <LoginForm onClose={handleSuccess} /> // Передаем handleSuccess вместо пустой функции
                ) : (
                    <RegisterForm onClose={handleSuccess} onClickLogin={onSwitchType} />
                )}

                <hr className="my-6" />
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        onClick={() =>
                            signIn('google', {
                                callbackUrl: '/', // Указываем нужный маршрут
                                redirect: false, // Отключаем автоматический редирект
                            }).then((result) => {
                                if (result?.ok) {
                                    handleSuccess(); // Вызываем handleSuccess при успехе
                                }
                            })
                        }
                        type="button"
                        className="gap-2 h-12 p-2 flex-1">
                        <img
                            className="w-6 h-6"
                            src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg"
                        />
                        Google
                    </Button>
                </div>

                <Button
                    variant="outline"
                    onClick={onSwitchType}
                    type="button"
                    className="h-12 w-full mt-4"
                >
                    {type !== 'login' ? 'Войти' : 'Регистрация'}
                </Button>
            </div>
        </Container>
    );
};

после регистрации нет редиректа на главную страницу, потому что не выполняется вход
\\wsl.localhost\Ubuntu-24.04\home\pi\prod\docker-ardua-444\app\(root)\page.tsx
import { prisma } from "@/prisma/prisma-client";
import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Loading from "@/app/(root)/loading";
import WebRTC from "@/components/webrtc";

export default async function Home() {
const session = await getUserSession();

    if (!session?.id) {
        redirect('/register');
    }

    const user = await prisma.user.findFirst({
        where: {
            id: Number(session.id)
        }
    });

    if (!user) {
        redirect('/register');
    }

    return (
        // <Container className="flex flex-col my-10">
            <Suspense fallback={<Loading />}>
                <WebRTC />
            </Suspense>
        // </Container>
    );
}
идет обратное перенаправление, сделай так чтобы с регистрацией происходил вход, и было перенаправление на главную страницу , чтобы тот кто зарегистрировался у него появилась сессия session и он мог посетить страницу главную сразу после регистрации с редиректом
отвечай на русском