# (root)\profile\page.tsx
# \\wsl$\Ubuntu\home\pi\Projects\next-pizza\app\(root)\profile\page.tsx
# profile 21:12:00
# Auth Session 21:13:10

# \\wsl$\Ubuntu\home\pi\Projects\next-pizza\shared\lib\get-user-session.ts
```jsx
import { getServerSession } from 'next-auth';
import { authOptions } from '../constants/auth-options';

export const getUserSession = async () => {
  const session = await getServerSession(authOptions);

  return session?.user ?? null;
};

```

# \\wsl$\Ubuntu\home\pi\Projects\next-pizza\app\(root)\profile\page.tsx  21:27:00
```jsx
import { prisma } from '@/prisma/prisma-client';
import { ProfileForm } from '@/shared/components';
import { getUserSession } from '@/shared/lib/get-user-session';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const session = await getUserSession();

  if (!session) {
    return redirect('/not-auth');
  }

  const user = await prisma.user.findFirst({ where: { id: Number(session?.id) } });

  if (!user) {
    return redirect('/not-auth');
  }

  return <ProfileForm data={user} />;
}

```

# \\wsl$\Ubuntu\home\pi\Projects\next-pizza\shared\components\shared\profile-form.tsx 21:28:30
```jsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { TFormRegisterValues, formRegisterSchema } from './modals/auth-modal/forms/schemas';
import { User } from '@prisma/client';
import toast from 'react-hot-toast';
import { signOut } from 'next-auth/react';
import { Container } from './container';
import { Title } from './title';
import { FormInput } from './form';
import { Button } from '../ui';
import { updateUserInfo } from '@/app/actions';

interface Props {
  data: User;
}

export const ProfileForm: React.FC<Props> = ({ data }) => {
  const form = useForm({
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

      toast.error('Данные обновлены 📝', {
        icon: '✅',
      });
    } catch (error) {
      return toast.error('Ошибка при обновлении данных', {
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
      <Title text={`Личные данные | #${data.id}`} size="md" className="font-bold" />

      <FormProvider {...form}>
        <form className="flex flex-col gap-5 w-96 mt-10" onSubmit={form.handleSubmit(onSubmit)}>
          <FormInput name="email" label="E-Mail" required />
          <FormInput name="fullName" label="Полное имя" required />

          <FormInput type="password" name="password" label="Новый пароль" required />
          <FormInput type="password" name="confirmPassword" label="Повторите пароль" required />

          <Button disabled={form.formState.isSubmitting} className="text-base mt-10" type="submit">
            Сохранить
          </Button>

          <Button
            onClick={onClickSignOut}
            variant="secondary"
            disabled={form.formState.isSubmitting}
            className="text-base"
            type="button">
            Выйти
          </Button>
        </form>
      </FormProvider>
    </Container>
  );
};

```