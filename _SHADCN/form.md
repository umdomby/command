# FORM
# https://ui.shadcn.com/docs/components/form

```tsx
    import { Category, User } from '@prisma/client';

    interface Props {
        data: User;
        category: Category[];
    }

    export const AdminForm: React.FC<Props> = ({data, category}) => {
        const form = useForm({
            defaultValues: {
                role: data.role,
                category: category,
            },
        });


    <FormProvider {...form}>
        <form className="flex flex-col gap-5 w-96 mt-10" onSubmit={form.handleSubmit(onSubmit)}>
            <FormInput name="email" label="E-Mail" required/>
            <FormInput name="fullName" label="Полное имя" required/>

            <FormInput type="password" name="password" label="Новый пароль" required/>
            <FormInput type="password" name="confirmPassword" label="Повторите пароль" required/>

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
```