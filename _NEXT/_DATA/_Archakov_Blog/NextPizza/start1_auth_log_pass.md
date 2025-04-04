# auth login password 20:24:40
# \\wsl$\Ubuntu\home\pi\Projects\next-pizza\shared\components\shared\modals\auth-modal\forms\login-form.tsx

# Providers
# \\wsl$\Ubuntu\home\pi\Projects\next-pizza\shared\constants\auth-options.ts
```jsx
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

        if (!findUser.verified) {
            return null;
        }

        return {
            id: findUser.id,
            email: findUser.email,
            name: findUser.fullName,
            role: findUser.role,
        };
    },
})
```

```jsx
        if (!findUser.verified) {
          return null;
        }
```



# \\wsl$\Ubuntu\home\pi\Projects\next-pizza\shared\components\shared\modals\auth-modal\forms\schemas.ts
```jsx
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
```