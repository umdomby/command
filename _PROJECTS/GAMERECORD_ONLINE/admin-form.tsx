'use client';

import {zodResolver} from '@hookform/resolvers/zod';
import React, {useEffect} from 'react';
import {FormProvider, useForm} from 'react-hook-form';
import {TFormRegisterValues, formRegisterSchema} from './modals/auth-modal/forms/schemas';
import {Category, User} from '@prisma/client';
import toast from 'react-hot-toast';
import {signOut} from 'next-auth/react';
import {Container} from './container';
import {Title} from './title';
import {FormInput} from './form';
import {Button, Input} from '../ui';
import {categoryUpdate, categoryCreate, categoryDelete} from '@/app/actions';
import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";


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
    const [categories, setCategories] = React.useState<Category[]>(category);
    const [categories2, setCategories2] = React.useState<Category[]>(category);
    const [categoryAdd, setCategoryAdd] = React.useState('');


    const eventHandler = (id: any, value: any) => {
        setCategories2(
            categories2.map((item) =>
                item.id === id ? {...item, name: value} : item
            )
        )
    };

    const eventSubmitCreate = async () => {
        try {
            if(categoryAdd === '') {
                return toast.error('Ошибка при создании данных, пустое поле', {
                    icon: '❌',
                });
            }

            await categoryCreate({
                name: categoryAdd,
            });

            toast.error('Данные созданы 📝', {
                icon: '✅',
            });

        } catch (error) {
            return toast.error('Ошибка при создании данных', {
                icon: '❌',
            });
        }
        redirect(`/admin`)
    }

    const eventSubmitDelete = async (id: any) => {
        try {
            await categoryDelete({
                id: id,
            });

            toast.error('Данные удалены📝', {
                icon: '✅',
            });

        } catch (error) {
            return toast.error('Ошибка при удалении данных', {
                icon: '❌',
            });
        }
        redirect(`/admin`)
    }

    const eventSubmitUpdate = async (data: any) => {
        try {
            console.log(data)

            if(data.name === '') {
                return toast.error('Ошибка при обновлении данных, пустое поле', {
                    icon: '❌',
                });
            }

            await categoryUpdate({
                id: data.id,
                name: data.name,
            });

            toast.error('Данные обновлены 📝', {
                icon: '✅',
            });

        } catch (error) {
            return toast.error('Ошибка при обновлении данных', {
                icon: '❌',
            });
        }
        redirect(`/admin`)
    }

    return (
        <Container className="my-10">

            <Title text={`#${data.role}`} size="md" className="font-bold"/>
            <Title text={`Category Edit`} size="md" className="font-bold"/>

            {categories.map((item, index) => (
                <div key={index} className="flex w-full max-w-sm items-center space-x-2 mb-1">
                    <Input type='text'
                           defaultValue={item.name}
                           onChange={e => eventHandler(item.id, e.target.value)
                    }/>
                    <Button
                            type="submit"
                            disabled={categories[index].name === categories2[index].name}
                            onClick={() => eventSubmitUpdate(categories2[index])}
                    >Up</Button>
                    <Button
                        type="submit"
                        onClick={() => eventSubmitDelete(item.id)}
                    >Del</Button>
                </div>
            ))}

            <Title text={`Category Add`} size="md" className="font-bold"/>
            <div className="flex w-full max-w-sm items-center space-x-2 mb-1">
                <Input type='text'
                       onChange={e => setCategoryAdd(e.target.value)
                }/>
                <Button
                    type="submit"
                    onClick={eventSubmitCreate}
                >Add</Button>
            </div>
        </Container>
    );
};
