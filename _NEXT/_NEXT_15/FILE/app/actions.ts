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
        //console.log('[CreateOrder] Server error', err);
        throw err;
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
        //console.log('Error [UPDATE_USER]', err);
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

        if (findCategory.name === data.name) {
            throw new Error('Данные не обновлены, они одинаковые.');
        }

        await prisma.category.update({
            where: {
                id: Number(data.id),
            },
            data: {
                name: data.name,
            },
        });

        revalidatePath('/admin/category')
    } catch (err) {
        //console.log('Error [UPDATE_CATEGORY]', err);
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

        revalidatePath('/admin/category')

    } catch (err) {
        //console.log('Error [CREATE_CATEGORY]', err);
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
        revalidatePath('/admin/category')
    } catch (err) {
        //console.log('Error [CREATE_CATEGORY]', err);
        throw err;
    }
}

export async function productUpdate(data: any) {
    try {
        const product = await prisma.product.findFirst({
            where: {
                id: Number(data.id),
            },
        });

        if (!product) {
            throw new Error('product not found');
        }

        if (product.name === data.name) {
            throw new Error('No update, data identical.');
        }

        await prisma.product.update({
            where: {
                id: Number(data.id),
            },
            data: {
                name: data.name,
            },
        });
        revalidatePath('/admin/product')
    } catch (err) {
        //console.log('Error [UPDATE_PRODUCT]', err);
        throw err;
    }
}
export async function productCreate(data: any) {
    let product;
    let productNameFind;
    let count;
    let countFind;
    let countFind2 = true;
    try {
        console.log("111111111111111 " + data.categoryId);

        productNameFind = await prisma.product.findFirst({
            where: {
                categoryId: data.categoryId,
                name: data.name,
            }
        });


        if (productNameFind) {
            throw new Error('product already exists');
        }

        count = await prisma.product.count({});

        console.log("2222222222222222 " + count);

        do {
            count = count + 1
            console.log("count WHILE " + count);
            countFind = await prisma.product.findFirst({
                where: {
                    id: Number(count),
                }
            });
            console.log('countFind ' + countFind)
            console.log("555555555555555555555 countFind " + countFind);
        } while(countFind2);

        console.log("3333333333333333 " + count);

        product = await prisma.product.create({
            data: {
                id: Number(count),
                name: data.name,
                categoryId: Number(data.categoryId),
            }
        });
        //console.log("4444444444444444")
        if (!product) {
            throw new Error('Product Error');
        }
        revalidatePath('/admin/product')
        }   catch (error) {
            if (error instanceof Error) {
                console.log(error.stack);
            }
            throw new Error('Failed to record your interaction. Please try again.');
        }
}
export async function productDelete(data: any) {
    let product;
    try {
        product = await prisma.product.findFirst({
            where: {
                id: Number(data.id),
            },
        });
        if (!product) {
            throw new Error('Product delete Error');
        }
        await prisma.product.delete({
            where: {
                id: Number(data.id),
            }
        })
        revalidatePath('/admin/product')
    } catch (err) {
        //console.log('Error [CREATE_PRODUCT]', err);
        throw err;
    }
}

export async function productItemUpdate(data: any) {
    try {
        const product = await prisma.productItem.findFirst({
            where: {
                id: Number(data.id),
            },
        });

        if (!product) {
            throw new Error('product not found');
        }

        if (product.name === data.name) {
            throw new Error('No update, data identical.');
        }

        await prisma.productItem.update({
            where: {
                id: Number(data.id),
            },
            data: {
                name: data.name,
            },
        });
        revalidatePath('/admin/product')
    } catch (err) {
        //console.log('Error [UPDATE_PRODUCT]', err);
        throw err;
    }
}
export async function productItemCreate(data: any) {
    let product;
    let productNameFind;
    let countFind;
    let count;
    try {
        productNameFind = await prisma.productItem.findFirst({
            where: {
                name: data.name,
                productId: Number(data.productId),
            }
        });

        // count = await prisma.productItem.count({});
        // console.log("count = " + count);
        // while(!countFind) {
        //     count++
        //     console.log("count WHILE " + count);
        //     countFind = await prisma.productItem.findFirst({
        //         where: {
        //             id: count
        //         }
        //     });
        // }
        // console.log("1111111111111 = " + Number(data.productId))

        if (productNameFind) {
            throw new Error('product already exists');
        }else {
            console.log("2222222222222  productId " + data.productId + "   name " + data.name);

            product = await prisma.productItem.create({
                data: {
                    // id: count,
                    name: data.name,
                    productId: Number(data.productId),
                }
            });
            console.log("333333333333")
            if (!product) {
                throw new Error('Product Error');
            }
        }

        revalidatePath('/admin/product')
    } catch (error) {
        if (error instanceof Error) {
            console.log(error.stack);
        }
        throw new Error('Failed to record your interaction. Please try again.');
    }
}
export async function productItemDelete(data: any) {
    let product;
    try {
        product = await prisma.productItem.findFirst({
            where: {
                id: Number(data.id),
            },
        });
        if (!product) {
            throw new Error('Product delete Error');
        }
        await prisma.productItem.delete({
            where: {
                id: Number(data.id),
            }
        })
        revalidatePath('/admin/product')
    } catch (err) {
        //console.log('Error [CREATE_PRODUCT]', err);
        throw err;
    }
}




