'use server';

import {prisma} from '@/prisma/prisma-client';
import {PayOrderTemplate} from '@/shared/components';
import {VerificationUserTemplate} from '@/shared/components/shared/email-temapltes/verification-user';
import {CheckoutFormValues} from '@/shared/constants';
import {createPayment, sendEmail} from '@/shared/lib';
import {getUserSession} from '@/shared/lib/get-user-session';
import {OrderStatus, Prisma} from '@prisma/client';
import {hashSync} from 'bcrypt';
import {cookies} from 'next/headers';
import toast from "react-hot-toast";
import {revalidatePath} from 'next/cache'
import {redirect} from 'next/navigation'
import {PutBlobResult} from "@vercel/blob";


export async function createOrder(data: CheckoutFormValues) {
    try {
        const cookieStore = await cookies();
        const cartToken = cookieStore.get('cartToken')?.value;

        if (!cartToken) {
            throw new Error('Cart token not found');
        }

        /* Находим корзину по токену */
        const userCart = await prisma.cart.findFirst({
            include: {
                user: true,
                items: {
                    include: {
                        ingredients: true,
                        productItem: {
                            include: {
                                product: true,
                            },
                        },
                    },
                },
            },
            where: {
                token: cartToken,
            },
        });

        /* Если корзина не найдена возращаем ошибку */
        if (!userCart) {
            throw new Error('Cart not found');
        }

        /* Если корзина пустая возращаем ошибку */
        if (userCart?.totalAmount === 0) {
            throw new Error('Cart is empty');
        }

        /* Создаем заказ */
        const order = await prisma.order.create({
            data: {
                token: cartToken,
                fullName: data.firstName + ' ' + data.lastName,
                email: data.email,
                phone: data.phone,
                address: data.address,
                comment: data.comment,
                totalAmount: userCart.totalAmount,
                status: OrderStatus.PENDING,
                items: JSON.stringify(userCart.items),
            },
        });

        /* Очищаем корзину */
        await prisma.cart.update({
            where: {
                id: userCart.id,
            },
            data: {
                totalAmount: 0,
            },
        });

        await prisma.cartItem.deleteMany({
            where: {
                cartId: userCart.id,
            },
        });

        const paymentData = await createPayment({
            amount: order.totalAmount,
            orderId: order.id,
            description: 'Оплата заказа #' + order.id,
        });

        if (!paymentData) {
            throw new Error('Payment data not found');
        }

        await prisma.order.update({
            where: {
                id: order.id,
            },
            data: {
                paymentId: paymentData.id,
            },
        });

        const paymentUrl = paymentData.confirmation.confirmation_url;

        await sendEmail(
            data.email,
            'Next Pizza / Оплатите заказ #' + order.id,
            PayOrderTemplate({
                orderId: order.id,
                totalAmount: order.totalAmount,
                paymentUrl,
            }),
        );

        return paymentUrl;
    } catch (err) {
        console.log('[CreateOrder] Server error', err);
    }
}

export async function updateUserInfo(body: Prisma.UserUpdateInput) {
    try {
        const currentUser = await getUserSession();

        if (!currentUser) {
            throw new Error('Пользователь не найден');
        }

        const findUser = await prisma.user.findFirst({
            where: {
                id: Number(currentUser.id),
            },
        });

        await prisma.user.update({
            where: {
                id: Number(currentUser.id),
            },
            data: {
                fullName: body.fullName,
                email: body.email,
                password: body.password ? hashSync(body.password as string, 10) : findUser?.password,
            },
        });
    } catch (err) {
        console.log('Error [UPDATE_USER]', err);
        throw err;
    }
}

export async function registerUser(body: Prisma.UserCreateInput) {
    try {
        const user = await prisma.user.findFirst({
            where: {
                email: body.email,
            },
        });

        if (user) {
            // if (!user.verified) {
            //   throw new Error('Почта не подтверждена');
            // }

            throw new Error('Пользователь уже существует');
        }
        // const createdUser = await prisma.user.create({
        await prisma.user.create({
            data: {
                fullName: body.fullName,
                email: body.email,
                password: hashSync(body.password, 10),
                verified: new Date(),
            },
        });

        // const code = Math.floor(100000 + Math.random() * 900000).toString();

        // await prisma.verificationCode.create({
        //   data: {
        //     code,
        //     userId: createdUser.id,
        //   },
        // });

        // await sendEmail(
        //   createdUser.email,
        //   'Next Pizza / 📝 Подтверждение регистрации',
        //   VerificationUserTemplate({
        //     code,
        //   }),
        // );
    } catch (err) {
        console.log('Error [CREATE_USER]', err);
        throw err;
    }
}


export async function createBlopAction(data: { newBlob: PutBlobResult }) {
    let post
    try {
        post = await prisma.post.create({
            data: {
                content: data.newBlob.url,
            }
        })

        if (!post) {
            return {error: 'Failed to create the blog.'}
        }
    } catch (error: any) {
        if (error.code === 'P2002') {
            return {error: 'That slug already exists.'}
        }

        return {error: error.message || 'Failed to create the blog.'}
    }

    revalidatePath('/')
    redirect(`/blop/list-data`)
}

export async function deleteBlopAction(data: { id: Number }) {
    let post
    try {
        post = await prisma.post.delete({
            where: {
                id: Number(data.id),
            },
        });
        if (!post) {
            return {error: 'No Delete'}
        }
    } catch (e) {

    }
}


export async function categoryUpdate(data: any) {
    try {
        const findCategory = await prisma.category.findFirst({
            where: {
                id: Number(data.id),
            },
        });

        if (!findCategory) {
            throw new Error('Пользователь не найден');
        }

        await prisma.category.update({
            where: {
                id: Number(data.id),
            },
            data: {
                name: data.name,
            },
        });
    } catch (err) {
        console.log('Error [UPDATE_CATEGORY]', err);
        throw err;
    }
}

export async function categoryCreate(data: any) {
    let category;
    let categoryNameFind;
    try {
       categoryNameFind = await prisma.category.findFirst({
            where: {
                name: data.name,
            }
        })
        console.log(categoryNameFind);
        if (categoryNameFind) {
            throw new Error('Данная категория уже существует');
        }

        category = await prisma.category.create({
            data: {
                name: data.name,
            }
        })

        if (!category) {
            throw new Error('Category Error');
        }

    } catch (err) {
        console.log('Error [CREATE_CATEGORY]', err);
        throw err;
    }

}

export async function categoryDelete(data: any) {

    let categoryDelete;
    try {
        categoryDelete = await prisma.category.findFirst({
            where: {
                id: Number(data.id),
            },
        });

        if (!categoryDelete) {
            throw new Error('Category delete Error');
        }

        await prisma.category.delete({
            where: {
                id: Number(data.id),
            }
        })

    } catch (err) {
        console.log('Error [CREATE_CATEGORY]', err);
        throw err;
    }
}




