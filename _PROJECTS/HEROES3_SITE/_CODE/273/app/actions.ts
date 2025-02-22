'use server';
import {prisma} from '@/prisma/prisma-client';
import {getUserSession} from '@/components/lib/get-user-session';
import {
    $Enums,
    Bet, Bet3, Bet4,
    BetParticipant,
    BetParticipant3, BetParticipant4,
    IsCovered,
    OrderP2P,
    PlayerChoice,
    Prisma,
    UserRole
} from '@prisma/client';
import {hashSync} from 'bcrypt';
import {revalidatePath, revalidateTag} from 'next/cache';
import axios from "axios";
import {JsonArray} from 'type-fest';
import WinGameUserBet = $Enums.WinGameUserBet;

const MARGIN = parseFloat('0.05');

export async function updateUserInfo(body: Prisma.UserUpdateInput) {
    try {
        const currentUser = await getUserSession();

        if (!currentUser) {
            throw new Error('Пользователь не найден');
        }

        const findUser = await prisma.user.findFirst({
            where: {
                id: Number(currentUser.id),
            },
        });

        if (!findUser) {
            throw new Error('Пользователь не найден в базе данных');
        }

        await prisma.user.update({
            where: {
                id: Number(currentUser.id),
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
} // Функция для обновления информации о пользователе
export async function updateUserInfoTelegram(telegram: string, telegramView: boolean) {
    try {
        const currentUser = await getUserSession();

        if (!currentUser) {
            throw new Error('Пользователь не найден');
        }

        const findUser = await prisma.user.findFirst({
            where: {
                id: Number(currentUser.id),
            },
        });

        if (!findUser) {
            throw new Error('Пользователь не найден в базе данных');
        }

        // Check if the telegram handle is already taken by another user
        const existingUserWithTelegram = await prisma.user.findFirst({
            where: {
                telegram: telegram,
                id: {
                    not: Number(currentUser.id), // Exclude the current user from the check
                },
            },
        });

        if (existingUserWithTelegram) {
            throw new Error('Этот Telegram уже используется другим пользователем');
        }

        await prisma.user.update({
            where: {
                id: Number(currentUser.id),
            },
            data: {
                telegram: telegram,
                telegramView: telegramView,
            },
        });

        revalidatePath('/profile');
    } catch (err) {
        throw err;
    }
} // Функция для обновления информации о пользователе
export async function addEditPlayer(playerId: number | null, playerName: string, playerTwitch: string) {
    const session = await getUserSession();
    if (!session || session.role !== 'ADMIN') {
        throw new Error('У вас нет прав для выполнения этой операции');
    }
    if (!playerName || !playerTwitch) {
        throw new Error('Имя игрока и Twitch URL обязательны');
    }
    try {
        const existingPlayer = await prisma.player.findFirst({
            where: {name: playerName},
        });
        if (existingPlayer && existingPlayer.id !== playerId) {
            return {success: false, message: 'Игрок с таким именем уже существует'};
        }
        if (playerId) {
            await prisma.player.update({
                where: {id: playerId},
                data: {name: playerName, twitch: playerTwitch},
            });
        } else {
            await prisma.player.create({
                data: {
                    name: playerName,
                    twitch: playerTwitch,
                    userId: Number(session.id),
                },
            });
        }
        revalidatePath('/add-player');
        return {success: true, message: 'Игрок успешно сохранен'};
    } catch (error) {
        console.error('Ошибка при регистрации игрока:', error);
        throw new Error('Не удалось зарегистрироваться как игрок');
    }
}// Функция для добавления и редактирование имен игроков, админом
export async function deletePlayer(playerId: number) {
    const session = await getUserSession();
    if (!session || session.role !== 'ADMIN') {
        throw new Error('У вас нет прав для выполнения этой операции');
    }

    try {
        await prisma.player.delete({
            where: {id: playerId},
        });
        revalidatePath('/add-player');
        return {success: true, message: 'Игрок успешно удален'};
    } catch (error) {
        console.error('Ошибка при удалении игрока:', error);
        throw new Error('Не удалось удалить игрока');
    }
} // удалить игрока
export async function getIpAddress() {
    let ip = 'unknown';
    try {
        const response = await axios.get('https://api.ipify.org?format=json');
        ip = response.data.ip;
        console.log('IP-адрес:', ip);
    } catch (error) {
        console.error('Ошибка при получении IP-адреса:', error);
        ip = 'unknown';
    }
    return ip;
} // Функция для получения IP-адреса из заголовков запроса
export async function referralUserIpAddress(userId: number, ipAddress: string) {
    try {
        // Проверяем, существует ли уже запись с таким IP-адресом для данного пользователя
        const existingEntry = await prisma.referralUserIpAddress.findFirst({
            where: {
                referralUserId: userId,
                referralIpAddress: ipAddress,
            },
        });

        if (existingEntry) {
            console.log('Запись с таким IP-адресом уже существует для данного пользователя');
            return;
        }

        // Создаем новую запись в таблице ReferralUserIpAddress
        await prisma.referralUserIpAddress.create({
            data: {
                referralUserId: userId,
                referralIpAddress: ipAddress,
            },
        });

        console.log('IP адрес успешно сохранен для пользователя:', userId);

        // Обновляем кэш
        // revalidatePath('/');
    } catch (error) {
        console.error('Ошибка при сохранении IP адреса:', error);
        throw new Error('Не удалось сохранить IP адрес');
    }
} // Функция для сохранения IP-адреса пользователя
export async function referralGet() {
    try {
        const currentUser = await getUserSession();
        if (!currentUser) {
            throw new Error('Пользователь не найден');
        }

        // Find the user based on the current session
        const findUser = await prisma.user.findFirst({
            where: {
                id: Number(currentUser.id),
            },
        });

        // Check if the user was bet-found
        if (!findUser) {
            throw new Error('Пользователь не найден в базе данных');
        }

        // Fetch referral IP addresses associated with the user
        const referrals = await prisma.referralUserIpAddress.findMany({
            where: {
                referralUserId: findUser.id, // Corrected to use referralUserId
            },
        });

        return referrals; // Return the list of referral IP addresses
    } catch (error) {
        console.error('Ошибка при получении IP адресов:', error);
        throw new Error('Не удалось получить IP адреса');
    }
} // рефералы пользователей
export async function getEmailByCardId(cardId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: {cardId},
        });

        if (user) {
            return {email: user.email};
        } else {
            return {error: 'Пользователь не найден'};
        }
    } catch (error) {
        console.error('Ошибка при получении email:', error);
        return {error: 'Ошибка сервера'};
    }
} // Функция для получения email по cardId
export async function transferPoints(cardId: string, points: number) {
    try {
        const currentUser = await getUserSession();
        if (!currentUser) {
            throw new Error('Пользователь не найден');
        }

        const recipient = await prisma.user.findUnique({
            where: {cardId},
        });

        if (!recipient) {
            throw new Error('Получатель не найден');
        }

        // Округляем points до двух знаков после запятой
        const roundedPoints = Math.floor(points * 100) / 100;

        // Обновление баллов у обоих пользователей
        await prisma.user.update({
            where: {cardId},
            data: {points: {increment: roundedPoints}},
        });

        await prisma.user.update({
            where: {id: Number(currentUser.id)}, // Преобразование id в число
            data: {points: {decrement: roundedPoints}},
        });

        // Логирование перевода
        await prisma.transfer.create({
            data: {
                transferUser1Id: Number(currentUser.id), // Преобразование id в число
                transferUser2Id: recipient.id,
                transferPoints: roundedPoints, // Используем округленные баллы
                transferStatus: true,
            },
        });

        revalidatePath('/transfer-points');
        return true;
    } catch (error) {
        console.error('Ошибка при передаче баллов:', error instanceof Error ? error.message : error);
        return false;
    }
} // Функция для передачи баллов
export async function addBankDetails(newDetail: { name: string; details: string; description: string }) {
    try {
        const currentUser = await getUserSession();
        if (!currentUser) {
            throw new Error('Пользователь не найден');
        }

        const user = await prisma.user.findUnique({
            where: {id: Number(currentUser.id)},
        });

        if (!user) {
            throw new Error('Пользователь не найден в базе данных');
        }

        // Преобразуем bankDetails в массив, если это необходимо
        const bankDetails = Array.isArray(user.bankDetails) ? user.bankDetails : [];

        const updatedBankDetails = [...bankDetails, newDetail];

        await prisma.user.update({
            where: {id: Number(currentUser.id)},
            data: {
                bankDetails: updatedBankDetails as JsonArray, // Указываем тип JsonArray
            },
        });

        return updatedBankDetails;
    } catch (error) {
        console.error('Ошибка при добавлении банковского реквизита:', error);
        throw new Error('Не удалось добавить банковский реквизит');
    }
} // добавление банковских реквизитов
export async function deleteBankDetail(index: number) {
    try {
        const currentUser = await getUserSession();
        if (!currentUser) {
            throw new Error('Пользователь не найден');
        }

        const user = await prisma.user.findUnique({
            where: {id: Number(currentUser.id)},
        });

        if (!user) {
            throw new Error('Пользователь не найден в базе данных');
        }

        // Преобразуем bankDetails в массив, если это необходимо
        const bankDetails = Array.isArray(user.bankDetails) ? user.bankDetails : [];

        const updatedBankDetails = bankDetails.filter((_, i) => i !== index);

        await prisma.user.update({
            where: {id: Number(currentUser.id)},
            data: {
                bankDetails: updatedBankDetails as JsonArray, // Указываем тип JsonArray
            },
        });

        return updatedBankDetails;
    } catch (error) {
        console.error('Ошибка при удалении банковского реквизита:', error);
        throw new Error('Не удалось удалить банковский реквизит');
    }
} // удаление банковских реквизитов
export async function updateBankDetails(updatedDetails: { name: string; details: string; description: string }[]) {
    try {
        const currentUser = await getUserSession();
        if (!currentUser) {
            throw new Error('Пользователь не найден');
        }

        await prisma.user.update({
            where: {id: Number(currentUser.id)},
            data: {
                bankDetails: updatedDetails,
            },
        });

        return updatedDetails;
    } catch (error) {
        console.error('Ошибка при обновлении банковских реквизитов:', error);
        throw new Error('Не удалось обновить банковские реквизиты');
    }
} // редактирование банковских реквизитов
export async function createBuyOrder(points: number, bankDetails: any[], allowPartial: boolean) {
    try {
        const currentUser = await getUserSession();
        if (!currentUser) {
            throw new Error('Пользователь не найден');
        }

        if (points < 30 || points > 100000) {
            throw new Error('Количество points должно быть от 30 до 100000');
        }

        const newOrder = await prisma.orderP2P.create({
            data: {
                orderP2PUser1Id: Number(currentUser.id),
                orderP2PBuySell: 'BUY',
                orderP2PPoints: points,
                orderP2PPart: allowPartial,
                orderBankDetails: bankDetails,
                orderP2PStatus: 'OPEN',
            },
        });

        revalidatePath('/order-p2p');
        return newOrder;
    } catch (error) {
        console.error('Ошибка при создании заявки на покупку:', error);
        throw new Error('Не удалось создать заявку на покупку');
    }
} // Функция для создания заявки на покупку points
export async function createSellOrder(points: number, bankDetails: any[], allowPartial: boolean) {
    try {
        const currentUser = await getUserSession();
        if (!currentUser) {
            throw new Error('Пользователь не найден');
        }

        if (points < 30 || points > 100000) {
            throw new Error('Количество points должно быть от 30 до 100000');
        }

        const user = await prisma.user.findUnique({
            where: {id: Number(currentUser.id)},
        });

        if (!user || user.points < points) {
            throw new Error('Недостаточно points для продажи');
        }

        const newOrder = await prisma.orderP2P.create({
            data: {
                orderP2PUser1Id: Number(currentUser.id),
                orderP2PBuySell: 'SELL',
                orderP2PPoints: points,
                orderP2PPart: allowPartial,
                orderBankDetails: bankDetails,
                orderP2PStatus: 'OPEN',
            },
        });

        await prisma.user.update({
            where: {id: Number(currentUser.id)},
            data: {
                points: {
                    decrement: points,
                },
            },
        });

        revalidatePath('/order-p2p');
        return newOrder;
    } catch (error) {
        console.error('Ошибка при создании заявки на продажу:', error);
        throw new Error('Не удалось создать заявку на продажу');
    }
} // Функция для создания заявки на продажу points
export async function closeBuyOrderOpen(orderId: number) {
    try {
        const currentUser = await getUserSession();
        if (!currentUser) {
            throw new Error('Пользователь не найден');
        }

        // Обновление статуса сделки на RETURN
        await prisma.orderP2P.update({
            where: {id: orderId},
            data: {orderP2PStatus: 'RETURN'},
        });

        // Здесь можно добавить дополнительную логику, если необходимо
        revalidatePath('/order-p2p');
        return true;
    } catch (error) {
        console.error('Ошибка при закрытии сделки покупки:', error instanceof Error ? error.message : error);
        return false;
    }
} // Функция закрытия открытой сделки покупки
export async function closeSellOrderOpen(orderId: number) {
    try {
        const currentUser = await getUserSession();
        if (!currentUser) {
            throw new Error('Пользователь не найден');
        }

        // Получение сделки для возврата points
        const order = await prisma.orderP2P.findUnique({
            where: {id: orderId},
        });

        if (!order) {
            throw new Error('Сделка не найдена');
        }

        // Возврат points пользователю
        await prisma.user.update({
            where: {id: Number(currentUser.id)},
            data: {points: {increment: order.orderP2PPoints || 0}},
        });

        // Обновление статуса сделки на RETURN
        await prisma.orderP2P.update({
            where: {id: orderId},
            data: {orderP2PStatus: 'RETURN'},
        });
        revalidatePath('/order-p2p');
        return true;
    } catch (error) {
        console.error('Ошибка при закрытии сделки продажи:', error instanceof Error ? error.message : error);
        return false;
    }
} // Функция закрытия открытой сделки продажи
export async function getOpenOrders(): Promise<OrderP2P[]> {
    try {
        return await prisma.orderP2P.findMany({
            where: {orderP2PStatus: 'OPEN'},
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                orderP2PUser1: {
                    select: {
                        id: true,
                        cardId: true,
                        // Добавьте другие необходимые поля
                    }
                },
                orderP2PUser2: {
                    select: {
                        id: true,
                        cardId: true,
                        // Добавьте другие необходимые поля
                    }
                }
            }
        });
    } catch (error) {
        console.error('Ошибка при получении открытых заказов:', error);
        throw new Error('Не удалось получить открытые заказы'); // Выбрасывание ошибки для лучшей обработки
    }
} // 5 секунд обновление открытых сделок для OrderP2PComponent
export async function getPendingOrders(userId: number): Promise<OrderP2P[]> {
    try {
        return await prisma.orderP2P.findMany({
            where: {
                OR: [
                    {
                        orderP2PUser1: {id: userId},
                        orderP2PStatus: {in: ['PENDING', 'CLOSED', 'RETURN']}
                    },
                    {
                        orderP2PUser2: {id: userId},
                        orderP2PStatus: {in: ['PENDING', 'CLOSED', 'RETURN']}
                    }
                ]
            },
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                orderP2PUser1: {
                    select: {
                        id: true,
                        cardId: true,
                        fullName: true,
                        telegram: true,
                        // Добавьте другие необходимые поля
                    }
                },
                orderP2PUser2: {
                    select: {
                        id: true,
                        cardId: true,
                        fullName: true,
                        telegram: true,
                        // Добавьте другие необходимые поля
                    }
                }
            }
        });
    } catch (error) {
        console.error('Ошибка при получении открытых заказов:', error);
        throw new Error('Не удалось получить открытые заказы'); // Выбрасывание ошибки для лучшей обработки
    }
} // 5 секунд обновление открытых сделок для OrderP2PPending
// подтверждение оплаты для продажи
export async function confirmSellOrderUser2(orderId: number) {
    try {
        const currentUser = await getUserSession();
        if (!currentUser) {
            throw new Error('Пользователь не найден');
        }

        // Обновляем статус сделки и подтверждение пользователя 2
        await prisma.orderP2P.update({
            where: {id: orderId},
            data: {
                orderP2PCheckUser2: true,
            },
        });

        revalidatePath('/order-p2p');
        return true;
    } catch (error) {
        console.error('Ошибка при подтверждении оплаты для продажи:', error instanceof Error ? error.message : error);
        return false;
    }
} // подтверждение оплаты для продажи вторым пользователем
export async function confirmSellOrderCreator(orderId: number) {
    try {
        const currentUser = await getUserSession();
        if (!currentUser) {
            throw new Error('Пользователь не найден');
        }

        const order = await prisma.orderP2P.findUnique({where: {id: orderId}});
        if (!order) {
            throw new Error('Сделка не найдена');
        }
        if (order?.orderP2PCheckUser2) {
            // Проверяем, что orderP2PUser2Id не равен null
            const user2Id = order.orderP2PUser2Id;
            if (user2Id !== null && user2Id !== undefined) {
                await prisma.$transaction(async (prisma) => {
                    await prisma.user.update({
                        where: {id: user2Id},
                        data: {
                            points: {increment: order.orderP2PPoints},
                        },
                    });

                    await prisma.orderP2P.update({
                        where: {id: orderId},
                        data: {
                            orderP2PCheckUser1: true,
                            orderP2PStatus: 'CLOSED',
                        },
                    });
                });
            } else {
                throw new Error('ID пользователя 2 не определен');
            }
        }

        revalidatePath('/order-p2p-pending');
        return true;
    } catch (error) {
        console.error('Ошибка при завершении сделки-продажи:', error instanceof Error ? error.message : error);
        return false;
    }
}// завершение сделки-продажи, подтверждением создателем
export async function confirmBuyOrderUser2(orderId: number) {
    try {
        const currentUser = await getUserSession();
        if (!currentUser) {
            throw new Error('Пользователь не найден');
        }

        // Получаем сделку
        const order = await prisma.orderP2P.findUnique({where: {id: orderId}});

        if (!order) {
            throw new Error('Сделка не найдена');
        }

        if (order?.orderP2PCheckUser1) {
            await prisma.$transaction(async (prisma) => {
                await prisma.user.update({
                    where: {id: order.orderP2PUser1Id},
                    data: {
                        points: {increment: order.orderP2PPoints},
                    },
                });

                await prisma.orderP2P.update({
                    where: {id: orderId},
                    data: {
                        orderP2PCheckUser2: true,
                        orderP2PStatus: 'CLOSED',
                    },
                });
            });
        }

        revalidatePath('/order-p2p-pending');
        return true;
    } catch (error) {
        console.error('Ошибка при подтверждении оплаты для покупки:', error instanceof Error ? error.message : error);
        return false;
    }
}// подтверждение оплаты для покупки
export async function confirmBuyOrderCreator(orderId: number) {
    try {
        const currentUser = await getUserSession();
        if (!currentUser) {
            throw new Error('Пользователь не найден');
        }
        console.log("111111111 " + orderId)
        await prisma.orderP2P.update({
            where: {id: Number(orderId)},
            data: {
                orderP2PCheckUser1: true,
            },
        });


        revalidatePath('/order-p2p-pending');
        return true;
    } catch (error) {
        console.error('Ошибка при завершении сделки-покупки:', error instanceof Error ? error.message : error);
        return false;
    }
}// завершение сделки-покупки, подтверждением создателем оплаты price
export async function openBuyOrder(orderId: number, userId: number, bankDetails: any, price: number, points: number) {
    try {
        const currentUser = await getUserSession();
        if (!currentUser) {
            throw new Error('Пользователь не найден');
        }

        // Обновляем сделку
        await prisma.orderP2P.update({
            where: {id: orderId},
            data: {
                orderP2PUser2Id: userId,
                orderBankPay: bankDetails,
                orderP2PPrice: price,
                orderP2PStatus: 'PENDING',
            },
        });

        // Списываем Points у пользователя, который заключает сделку
        await prisma.user.update({
            where: {id: userId},
            data: {
                points: {decrement: points},
            },
        });

        revalidatePath('/order-p2p');
        return true;
    } catch (error) {
        console.error('Ошибка при открытии сделки покупки:', error instanceof Error ? error.message : error);
        return false;
    }
}// Функция для открытия сделки покупки
export async function openSellOrder(orderId: number, userId: number, bankDetails: any, price: number) {
    try {
        const currentUser = await getUserSession();
        if (!currentUser) {
            throw new Error('Пользователь не найден');
        }

        // Обновляем сделку
        await prisma.orderP2P.update({
            where: {id: orderId},
            data: {
                orderP2PUser2Id: userId,
                orderBankPay: bankDetails,
                orderP2PPrice: price,
                orderP2PStatus: 'PENDING',
            },
        });

        revalidatePath('/order-p2p');
        return true;
    } catch (error) {
        console.error('Ошибка при открытии сделки продажи:', error instanceof Error ? error.message : error);
        return false;
    }
}// Функция для открытия сделки продажи
export async function closeDealTime(orderId: number) {
    // Получаем сделку
    const order = await prisma.orderP2P.findUnique({where: {id: orderId}});
    if (!order) {
        throw new Error('Сделка не найдена');
    }

    if (order.orderP2PBuySell === "SELL" && order.orderP2PStatus === 'PENDING') {
        await prisma.$transaction(async (prisma) => {
            await prisma.user.update({
                where: {id: order.orderP2PUser1Id},
                data: {
                    points: {increment: order.orderP2PPoints},
                },
            });

            await prisma.orderP2P.update({
                where: {id: order.id},
                data: {
                    orderP2PStatus: 'RETURN',
                },
            });
        });
    }

    if (order.orderP2PBuySell === "BUY" && order.orderP2PStatus === 'PENDING') {
        await prisma.$transaction(async (prisma) => {
            await prisma.orderP2P.update({
                where: {id: order.id},
                data: {
                    orderP2PStatus: 'RETURN',
                },
            });
        });
    }
} // закрытие сделки по времени
export async function checkAndCloseExpiredDeals() {
    const now = new Date();
    const expiredDeals = await prisma.orderP2P.findMany({
        where: {
            orderP2PStatus: 'PENDING',
            updatedAt: {
                lt: new Date(now.getTime() - 3600000), // 60 minutes ago 3600000
            },
        },
    });

    for (const deal of expiredDeals) {
        await closeDealTime(deal.id); // Передаем id сделки
    }
}// серверное обновление серверной страницы сделок components\OrderP2PPending.tsx
export async function getServerSideProps() {
    // Проверьте и закройте просроченные сделки перед отображением страницы
    await checkAndCloseExpiredDeals();
    // Извлечь другие необходимые данные для страницы
    const openOrders = await prisma.orderP2P.findMany({
        where: {orderP2PStatus: 'PENDING'},
        include: {
            orderP2PUser1: true,
            orderP2PUser2: true,
        },
    });

    return {
        props: {
            openOrders,
        },
    };
}// серверное обновление серверной страницы сделок components\OrderP2PPending.tsx
export async function updateUserRole(id: number, role: UserRole) {
    try {
        const currentUser = await getUserSession();

        if (!currentUser) {
            throw new Error('Пользователь не найден');
        }

        const findUser = await prisma.user.findFirst({
            where: {
                id: Number(currentUser.id),
            },
        });

        if (!findUser || findUser.role !== 'ADMIN') {
            throw new Error('Пользователь не найден в базе данных или вы не admin');
        }

        await prisma.user.update({
            where: {
                id: Number(id),
            },
            data: {
                role: role,
            },
        });
        revalidatePath('/admin-user');
    } catch (err) {
        throw err;
    }
} // изменять роли пользователей
// ################################################

export async function globalDataPoints() {
    try {
        // Получаем текущие данные из GlobalData
        const currentGlobalData = await prisma.globalData.findUnique({
            where: {id: 1},
        });

        // Проверяем, прошло ли 10 секунд с момента последнего обновления
        if (currentGlobalData && (new Date().getTime() - new Date(currentGlobalData.updatedAt).getTime()) < 10000) {
            console.log('Данные обновлены недавно, пропускаем обновление.');
            return;
        }

        // Если прошло больше 10 секунд, выполняем обновление
        const usersCount = await prisma.user.count();

        // Изменяем regCount, чтобы он равнялся сумме поля regPointsPoints
        const regPointsResult = await prisma.regPoints.aggregate({
            _sum: {regPointsPoints: true},
        });
        const regCount = regPointsResult._sum.regPointsPoints || 0;

        const refCount = await prisma.referralUserIpAddress.count({
            where: {referralStatus: true}
        }) * 10;
        const usersPointsResult = await prisma.user.aggregate({
            _sum: {points: true}
        });

        const usersPointsSum = Math.floor((usersPointsResult._sum?.points || 0) * 100) / 100;

        // Получаем сумму поля margin из таблиц BetCLOSED, BetCLOSED3 и BetCLOSED4
        const marginResult = await prisma.betCLOSED.aggregate({
            _sum: {margin: true}
        });

        const marginResult3 = await prisma.betCLOSED3.aggregate({
            _sum: {margin: true}
        });

        const marginResult4 = await prisma.betCLOSED4.aggregate({
            _sum: {margin: true}
        });

        // Суммируем все полученные значения margin из трех таблиц
        const marginSum = Math.floor(((marginResult._sum?.margin || 0) +
            (marginResult3._sum?.margin || 0) +
            (marginResult4._sum?.margin || 0)) * 100) / 100;

        // Получаем сумму поля totalBetAmount из таблиц bet, bet3 и bet4, где статус 'OPEN'
        const openBetsPointsResult = await prisma.bet.aggregate({
            _sum: {totalBetAmount: true},
            where: {status: 'OPEN'}
        });

        const openBetsPointsResult3 = await prisma.bet3.aggregate({
            _sum: {totalBetAmount: true},
            where: {status: 'OPEN'}
        });

        const openBetsPointsResult4 = await prisma.bet4.aggregate({
            _sum: {totalBetAmount: true},
            where: {status: 'OPEN'}
        });

        // Суммируем все полученные значения totalBetAmount из трех таблиц
        const openBetsPointsSum = Math.floor(((openBetsPointsResult._sum?.totalBetAmount || 0) +
            (openBetsPointsResult3._sum?.totalBetAmount || 0) +
            (openBetsPointsResult4._sum?.totalBetAmount || 0)) * 100) / 100;

        // Обновляем или создаем запись в GlobalData
        await prisma.globalData.upsert({
            where: {id: 1},
            update: {
                users: usersCount,
                reg: regCount,
                ref: refCount,
                usersPoints: usersPointsSum,
                margin: marginSum,
                openBetsPoints: openBetsPointsSum,
            },
            create: {
                users: usersCount,
                reg: regCount,
                ref: refCount,
                usersPoints: usersPointsSum,
                margin: marginSum,
                openBetsPoints: openBetsPointsSum,
            },
        });
        console.log('Данные успешно обновлены.');
    } catch (error) {
        console.error('Ошибка при обновлении GlobalData:', error);
    }
}

export async function transferPointsToFund(amount: number) {
    try {
        const session = await getUserSession();

        if (!session) {
            throw new Error('Пользователь не найден');
        }

        const user = await prisma.user.findUnique({
            where: {id: Number(session.id)},
        });

        if (!user || user.role !== 'ADMIN') {
            throw new Error('У вас нет прав для выполнения этой операции');
        }

        // Проверка, что пользователь не может перевести больше баллов, чем у него есть
        if (user.points < amount) {
            throw new Error('Недостаточно баллов для перевода');
        }

        // Обновление betFund
        await prisma.globalData.update({
            where: {id: 1},
            data: {
                betFund: {
                    increment: amount,
                },
            },
        });

        // Обновление баллов пользователя
        await prisma.user.update({
            where: {id: Number(session.id)},
            data: {
                points: {
                    decrement: amount,
                },
            },
        });

        return {success: true, message: 'Баллы успешно переведены в фонд'};
    } catch (error) {
        console.error('Ошибка при переводе баллов в фонд:', error);
        throw new Error('Не удалось перевести баллы в фонд');
    }
}

export async function withdrawPointsFromFund(amount: number) {
    try {
        const session = await getUserSession();

        if (!session) {
            throw new Error('Пользователь не найден');
        }

        const user = await prisma.user.findUnique({
            where: {id: Number(session.id)},
        });

        if (!user || user.role !== 'ADMIN') {
            throw new Error('У вас нет прав для выполнения этой операции');
        }

        // Получаем текущий betFund
        const globalData = await prisma.globalData.findUnique({
            where: {id: 1},
        });

        if (!globalData) {
            throw new Error('Данные фонда ставок не найдены');
        }

        // Проверка, что пользователь не может снять больше баллов, чем есть в betFund
        if ((globalData.betFund ?? 0) < amount) {
            throw new Error('Недостаточно баллов в фонде для снятия');
        }

        // Обновление betFund
        await prisma.globalData.update({
            where: {id: 1},
            data: {
                betFund: {
                    decrement: amount,
                },
            },
        });

        // Обновление баллов пользователя
        await prisma.user.update({
            where: {id: Number(session.id)},
            data: {
                points: {
                    increment: amount,
                },
            },
        });

        return {success: true, message: 'Баллы успешно сняты из фонда'};
    } catch (error) {
        console.error('Ошибка при снятии баллов из фонда:', error);
        throw new Error('Не удалось снять баллы из фонда');
    }
}

export async function chatUsers(userId?: number, chatText?: string) {
    try {
        if (userId && chatText) {
            // Добавляем новое сообщение
            await prisma.chatUsers.create({
                data: {
                    chatUserId: userId,
                    chatText: chatText,
                },
            });

            // Удаляем старые сообщения, если их больше 300
            const allMessages = await prisma.chatUsers.findMany({
                orderBy: {createdAt: 'asc'},
            });

            if (allMessages.length > 300) {
                const messagesToDelete = allMessages.slice(0, allMessages.length - 300);
                for (const message of messagesToDelete) {
                    await prisma.chatUsers.delete({where: {id: message.id}});
                }
            }
        }

        // Возвращаем последние 300 сообщений
        const recentMessages = await prisma.chatUsers.findMany({
            orderBy: {createdAt: 'desc'},
            take: 300,
            include: {
                chatUser: true, // Включаем информацию о пользователе
            },
        });

        // Обновляем кэш
        revalidatePath('/');

        return recentMessages.map(msg => ({
            id: msg.id, // Убедитесь, что id включен
            userEmail: msg.chatUser.email,
            userTelegram: msg.chatUser.telegram,
            chatText: msg.chatText,
        }));
    } catch (error) {
        console.error('Ошибка в chatUsers:', error);
        throw new Error('Не удалось обработать запрос чата. Пожалуйста, попробуйте еще раз.');
    }
}

export async function chatUsersGet() {
    try {
        // Fetch the latest 300 messages
        const recentMessages = await prisma.chatUsers.findMany({
            orderBy: {createdAt: 'desc'},
            take: 300,
            include: {
                chatUser: true, // Include user information
            },
        });

        return recentMessages.map(msg => ({
            id: msg.id, // Убедитесь, что id включен
            userEmail: msg.chatUser.email,
            userTelegram: msg.chatUser.telegram,
            chatText: msg.chatText,
        }));
    } catch (error) {
        console.error('Error fetching chat messages:', error);
        throw new Error('Failed to fetch chat messages. Please try again.');
    }
}

export async function chatUsersDelete(messageId: number) {
    try {
        await prisma.chatUsers.delete({
            where: {id: messageId},
        });
    } catch (error) {
        console.error('Error deleting chat message:', error);
        throw new Error('Failed to delete chat message. Please try again.');
    }
}

export async function registrationPlayer(twitch: string) {
    try {
        console.log(twitch)
        const currentUser = await getUserSession();

        if (!currentUser) {
            throw new Error('Пользователь не найден');
        }

        // Найдите пользователя в базе данных
        const findUser = await prisma.user.findFirst({
            where: {id: Number(currentUser.id)},
        });

        // Убедитесь, что пользователь найден и fullName не пустой
        if (!findUser || !findUser.fullName) {
            throw new Error('Полное имя пользователя не найдено');
        }

        // Проверяем, существует ли уже игрок с таким userId
        const existingPlayer = await prisma.player.findFirst({
            where: {userId: Number(currentUser.id)},
        });

        if (existingPlayer) {
            throw new Error('Вы уже зарегистрированы как игрок');
        }

        // Создаем нового игрока
        const newPlayer = await prisma.player.create({
            data: {
                name: findUser.fullName, // Используем fullName как name
                userId: Number(currentUser.id),
                twitch: twitch,
            },
        });
        return newPlayer;
    } catch (error) {
        if (error === null || error === undefined) {
            console.error('Ошибка при регистрации игрока: Неизвестная ошибка (error is null или undefined)');
        } else if (error instanceof Error) {
            console.error('Ошибка при регистрации игрока:', error.message);
            console.error('Стек ошибки:', error.stack);
        } else {
            console.error('Ошибка при регистрации игрока:', error);
        }

        throw new Error('Не удалось зарегистрироваться как игрок');
    }
}

export async function isUserPlayer() {
    const currentUser = await getUserSession();

    if (!currentUser) {
        throw new Error('Пользователь не найден');
    }

    const player = await prisma.player.findFirst({
        where: {userId: Number(currentUser.id)},
    });

    return {
        isPlayer: !!player, // Возвращает true, если пользователь зарегистрирован как игрок
        twitch: player ? player.twitch : '', // Возвращает twitch для редактирования
        playerName: player ? player.name : '', // Возвращает имя игрока для редактирования
    };
}

export async function updateTwitch(twitch: string) {
    try {
        const currentUser = await getUserSession();

        if (!currentUser) {
            throw new Error('Пользователь не найден');
        }

        // Проверяем, существует ли игрок с таким userId
        const existingPlayer = await prisma.player.findFirst({
            where: {userId: Number(currentUser.id)},
        });

        if (!existingPlayer) {
            throw new Error('Вы не зарегистрированы как игрок');
        }

        await prisma.player.update({
            where: {id: existingPlayer.id},
            data: {twitch: twitch},
        });

        return {success: true, message: 'Twitch успешно обновлен'};
    } catch (error) {
        if (error instanceof Error) {
            console.error('Ошибка при обновлении Twitch:', error.message);
        } else {
            console.error('Ошибка при обновлении Twitch:', error);
        }
        throw new Error('Не удалось обновить Twitch');
    }
}

export async function updatePlayerName(name: string) {
    try {
        const currentUser = await getUserSession();

        if (!currentUser) {
            throw new Error('Пользователь не найден');
        }

        // Проверяем, существует ли игрок с таким userId
        const existingPlayer = await prisma.player.findFirst({
            where: {userId: Number(currentUser.id)},
        });

        if (!existingPlayer) {
            throw new Error('Вы не зарегистрированы как игрок');
        }

        // Обновляем имя игрока
        await prisma.player.update({
            where: {id: existingPlayer.id},
            data: {name: name},
        });

        return {success: true, message: 'Имя игрока успешно обновлено'};
    } catch (error) {
        if (error instanceof Error) {
            console.error('Ошибка при обновлении имени игрока:', error.message);
        } else {
            console.error('Ошибка при обновлении имени игрока:', error);
        }
        throw new Error('Не удалось обновить имя игрока');
    }
}


type GameUserBetDataUser = {
    userId: number;
    betUser2: number; // Замените `any` на конкретный тип, если он известен
    gameUserBetDetails: string; // Замените `any` на конкретный тип, если он известен
    userTelegram: string;
};

export async function removeGameUserBetRegistration(gameData: {
    userId: number;
    gameUserBetId: number;
}) {
    try {
        const currentBet = await prisma.gameUserBet.findUnique({
            where: {id: gameData.gameUserBetId},
            select: {gameUserBetDataUsers2: true}
        });

        if (!currentBet) {
            throw new Error("Ставка не найдена");
        }

        const gameUserBetDataUsers2: GameUserBetDataUser[] = Array.isArray(currentBet.gameUserBetDataUsers2)
            ? currentBet.gameUserBetDataUsers2
                .filter((entry): entry is GameUserBetDataUser => {
                    return typeof entry === 'object' &&
                        entry !== null &&
                        'userId' in entry &&
                        'betUser2' in entry &&
                        'gameUserBetDetails' in entry &&
                        'userTelegram' in entry;
                })
                .map(entry => entry as GameUserBetDataUser) // Преобразуем к нужному типу
            : [];

        const updatedData = gameUserBetDataUsers2.filter(
            (entry) => entry.userId !== gameData.userId
        );

        const updatedBet = await prisma.gameUserBet.update({
            where: {id: gameData.gameUserBetId},
            data: {gameUserBetDataUsers2: updatedData}
        });

        return updatedBet;
    } catch (error) {
        console.error("Ошибка при удалении записи пользователя:", error);
        throw new Error("Не удалось удалить запись пользователя");
    }
}

export async function gameUserBetCreate(gameData: {
    initBetPlayer1: number;
    categoryId: number;
    productId: number;
    productItemId: number;
    gameUserBetDetails: string;
    userId: number;
    gameUserBetOpen: boolean;
}) {
    try {
        const currentUser = await getUserSession();

        if (!currentUser) {
            throw new Error('Пользователь не найден');
        }

        const existingGame = await prisma.gameUserBet.findFirst({
            where: {
                gameUserBet1Id: Number(currentUser.id),
                statusUserBet: {
                    in: ['OPEN', 'START']
                }
            }
        });

        if (existingGame) {
            throw new Error('Открытое событие можно создать только один раз');
        }

        const newBet = await prisma.gameUserBet.create({
            data: {
                gameUserBet1Id: gameData.userId,
                betUser1: gameData.initBetPlayer1,
                gameUserBetDetails: gameData.gameUserBetDetails,
                categoryId: gameData.categoryId,
                productId: gameData.productId,
                productItemId: gameData.productItemId,
                gameUserBetOpen: gameData.gameUserBetOpen,
                statusUserBet: 'OPEN',
            },
        });
        return newBet;
    } catch (error) {
        if (error instanceof Error) {
            console.error("Открытое событие уже создано:", error.message);
            throw error; // Повторно выбрасываем ту же ошибку
        } else {
            console.error("Неизвестная ошибка при создании ставки:", error);
            throw new Error("Произошла неизвестная ошибка");
        }
    }
}

export async function gameUserBetRegistrations(gameData: {
    userId: number;
    betUser2: number;
    gameUserBetDetails: string;
    gameUserBetId: number;
    userTelegram: string;
}) {
    try {
        const currentBet = await prisma.gameUserBet.findUnique({
            where: {id: gameData.gameUserBetId},
            select: {gameUserBetDataUsers2: true}
        });

        const gameUserBetDataUsers2 = currentBet?.gameUserBetDataUsers2 as GameUserBetDataUser[] | undefined;
        const isAlreadyRegistered = Array.isArray(gameUserBetDataUsers2) && gameUserBetDataUsers2.some((participant) => participant.userId === gameData.userId);
        if (isAlreadyRegistered) {
            throw new Error('Вы уже зарегистрированы в этой игре');
        }

        const updatedData = [
            ...(Array.isArray(currentBet?.gameUserBetDataUsers2) ? currentBet.gameUserBetDataUsers2 : []),
            {
                userId: gameData.userId,
                betUser2: gameData.betUser2,
                gameUserBetDetails: gameData.gameUserBetDetails,
                userTelegram: gameData.userTelegram
            }
        ];

        const updatedBet = await prisma.gameUserBet.update({
            where: {id: gameData.gameUserBetId},
            data: {gameUserBetDataUsers2: updatedData}
        });

        return updatedBet;
    } catch (error) {
        if (error instanceof Error) {
            console.error("Зарегистрироваться можно только один раз:", error.message);
            throw error; // Повторно выбрасываем ту же ошибку
        } else {
            console.error("Неизвестная ошибка при создании ставки:", error);
            throw new Error("Произошла неизвестная ошибка");
        }
    }
}

export async function gameUserBetStart(gameData: {
    gameUserBetId: number;
    gameUserBet2Id: number;
    betUser2: number;
}) {
    try {
        await prisma.$transaction(async (prisma) => {
            const gameUserBet = await prisma.gameUserBet.update({
                where: {id: gameData.gameUserBetId},
                data: {
                    gameUserBet2Id: gameData.gameUserBet2Id,
                    betUser2: gameData.betUser2,
                    statusUserBet: 'START',
                },
            });

            await prisma.user.update({
                where: {id: gameUserBet.gameUserBet1Id},
                data: {points: {decrement: gameUserBet.betUser1}},
            });

            await prisma.user.update({
                where: {id: gameData.gameUserBet2Id},
                data: {points: {decrement: gameData.betUser2}},
            });

            return gameUserBet;
        });
    } catch (error) {
        console.error("Ошибка при запуске игры:", error);
        throw new Error("Не удалось запустить игру");
    }
}

export async function gameUserBetClosed(gameData: {
    gameUserBetId: number;
    checkWinUser1: WinGameUserBet | null;
    checkWinUser2: WinGameUserBet | null;
}) {
    try {
        await prisma.$transaction(async (prisma) => {
            const gameUserBet = await prisma.gameUserBet.findUnique({
                where: {id: gameData.gameUserBetId},
            });

            if (!gameUserBet) {
                throw new Error("Ставка не найдена");
            }

            // Обновляем только те поля, которые были изменены
            const updateData: Partial<typeof gameUserBet> = {};
            if (gameData.checkWinUser1 !== null) {
                updateData.checkWinUser1 = gameData.checkWinUser1;
            }
            if (gameData.checkWinUser2 !== null) {
                updateData.checkWinUser2 = gameData.checkWinUser2;
            }

            await prisma.gameUserBet.update({
                where: {id: gameData.gameUserBetId},
                data: updateData,
            });

            // Отладочные сообщения
            console.log("checkWinUser1:", gameData.checkWinUser1);
            console.log("checkWinUser2:", gameData.checkWinUser2);

            // Проверяем, если оба пользователя подтвердили результат
            const updatedGameUserBet = await prisma.gameUserBet.findUnique({
                where: {id: gameData.gameUserBetId},
            });

            // Проверяем, если оба пользователя подтвердили результат и они не равны друг другу и не равны DRAW
            if (
                updatedGameUserBet?.checkWinUser1 !== null &&
                updatedGameUserBet?.checkWinUser2 !== null
            ) {
                if (updatedGameUserBet.checkWinUser1 !== updatedGameUserBet.checkWinUser2 &&
                    updatedGameUserBet.checkWinUser1 !== WinGameUserBet.DRAW &&
                    updatedGameUserBet.checkWinUser2 !== WinGameUserBet.DRAW) {

                    console.log("Оба пользователя выбрали не одинаковый результат и не равен ничье");

                    if (updatedGameUserBet.checkWinUser1 === WinGameUserBet.DRAW) {
                        console.log("Оба пользователя выбрали ничью");

                        if (gameData.checkWinUser1 === WinGameUserBet.WIN && gameData.checkWinUser2 === WinGameUserBet.LOSS) {
                            // User1 победил
                            await prisma.user.update({
                                where: {id: gameUserBet.gameUserBet1Id},
                                data: {points: {increment: gameUserBet.betUser1 + (gameUserBet.betUser2 ?? 0)}},
                            });
                        } else if (gameData.checkWinUser1 === WinGameUserBet.LOSS && gameData.checkWinUser2 === WinGameUserBet.WIN) {
                            // User2 победил
                            if (gameUserBet.gameUserBet2Id !== null) {
                                await prisma.user.update({
                                    where: {id: gameUserBet.gameUserBet2Id},
                                    data: {points: {increment: gameUserBet.betUser1 + (gameUserBet.betUser2 ?? 0)}},
                                });
                            }
                        } else if (gameData.checkWinUser1 === WinGameUserBet.DRAW || gameData.checkWinUser2 === WinGameUserBet.DRAW) {
                            // Ничья
                            await prisma.user.update({
                                where: {id: gameUserBet.gameUserBet1Id},
                                data: {points: {increment: gameUserBet.betUser1}},
                            });
                            if (gameUserBet.gameUserBet2Id !== null) {
                                await prisma.user.update({
                                    where: {id: gameUserBet.gameUserBet2Id},
                                    data: {points: {increment: gameUserBet.betUser2 ?? 0}},
                                });
                            }
                        }
                    }

                    // Обновляем статус игры на CLOSED только если оба подтвердили
                    await prisma.gameUserBet.update({
                        where: {id: gameData.gameUserBetId},
                        data: {statusUserBet: 'CLOSED'},
                    });
                }
            }
        });
    } catch (error) {
        console.error("Ошибка при завершении игры:", error);
        throw new Error("Не удалось завершить игру");
    }
}

export async function gameUserBetDelete() {

}


function calculateOdds(totalWithInitPlayer1: number, totalWithInitPlayer2: number) {
    // Add a constant value to each player's total to stabilize the odds
    const adjustedTotalPlayer1 = totalWithInitPlayer1 + 2000;
    const adjustedTotalPlayer2 = totalWithInitPlayer2 + 2000;

    const totalWithInit = adjustedTotalPlayer1 + adjustedTotalPlayer2;

    // Calculate odds without margin
    const oddsPlayer1 = adjustedTotalPlayer1 === 0 ? 1 : totalWithInit / adjustedTotalPlayer1;
    const oddsPlayer2 = adjustedTotalPlayer2 === 0 ? 1 : totalWithInit / adjustedTotalPlayer2;

    return {
        // Round to two decimal places
        oddsPlayer1: Math.floor((oddsPlayer1 * 100)) / 100,
        oddsPlayer2: Math.floor((oddsPlayer2 * 100)) / 100,
    };
} // Функция для расчета коэффициентов
function calculateMaxBets(initBetPlayer1: number, initBetPlayer2: number): {
    maxBetPlayer1: number,
    maxBetPlayer2: number
} {
    // Округляем до двух знаков после запятой
    const maxBetPlayer1 = Math.floor((initBetPlayer2 * 1.00) * 100) / 100; // 100% от суммы ставок на Player2
    const maxBetPlayer2 = Math.floor((initBetPlayer1 * 1.00) * 100) / 100; // 100% от суммы ставок на Player1
    return {maxBetPlayer1, maxBetPlayer2};
} // Функция для расчета максимальных ставок
export async function clientCreateBet(formData: any) {
    const session = await getUserSession();
    if (!session || session.role !== 'ADMIN') {
        throw new Error('У вас нет прав для выполнения этой операции');
    }

    try {
        const user = await prisma.user.findUnique({
            where: {id: Number(session.id)},
        });

        if (!user) {
            throw new Error("Пользователь не найден");
        }

        // Округляем до двух знаков после запятой
        const totalBetAmount = Math.floor((formData.initBetPlayer1 + formData.initBetPlayer2) * 100) / 100;
        if (totalBetAmount > 1000) {
            throw new Error("Сумма начальных ставок не должна превышать 1000 баллов");
        }

        const {maxBetPlayer1, maxBetPlayer2} = calculateMaxBets(formData.initBetPlayer1, formData.initBetPlayer2);

        const newBet = await prisma.bet.create({
            data: {
                status: 'OPEN', // Устанавливаем статус ставки как "открытая"
                totalBetAmount: 0, // Общая сумма начальных ставок
                maxBetPlayer1: maxBetPlayer1, // Максимальная сумма ставок на игрока 1
                maxBetPlayer2: maxBetPlayer2, // Максимальная сумма ставок на игрока 2
                // Округляем до двух знаков после запятой
                oddsBetPlayer1: Math.floor((parseFloat(formData.oddsBetPlayer1) * 100)) / 100, // Инициализируем текущие коэффициенты
                oddsBetPlayer2: Math.floor((parseFloat(formData.oddsBetPlayer2) * 100)) / 100, // Инициализируем текущие коэффициенты
                player1Id: formData.player1Id,
                player2Id: formData.player2Id,
                // Округляем до двух знаков после запятой
                initBetPlayer1: Math.floor((parseFloat(formData.initBetPlayer1) * 100)) / 100,
                initBetPlayer2: Math.floor((parseFloat(formData.initBetPlayer2) * 100)) / 100,
                overlapPlayer1: 0, // Перекрытие на игрока 1
                overlapPlayer2: 0, // Перекрытие на игрока 2
                categoryId: formData.categoryId,
                productId: formData.productId,
                productItemId: formData.productItemId,
                creatorId: formData.creatorId,
                totalBetPlayer1: 0, // Инициализируем сумму ставок на игрока 1
                totalBetPlayer2: 0, // Инициализируем сумму ставок на игрока 2
                margin: 0, // Инициализируем общую маржу
            },
        });

        console.log("New bet created:", newBet); // Логируем созданную ставку

        console.log("User points remain unchanged:", user.points); // Логируем неизмененный баланс

        revalidatePath('/');

        return newBet; // Возвращаем созданную ставку
    } catch (error) {
        if (error instanceof Error) {
            console.log(error.stack);
        }
        throw new Error('Failed to create bet. Please try again.');
    }
} // создание ставок
export async function placeBet(formData: { betId: number; userId: number; amount: number; player: PlayerChoice }) {
    try {
        console.log('Запуск функции placeBet с formData:', formData);

        if (!formData || typeof formData !== 'object') {
            throw new Error('Неверные данные формы');
        }

        const {betId, userId, amount, player} = formData;

        if (!betId || !userId || !amount || !player) {
            throw new Error('Отсутствуют обязательные поля в данных формы');
        }

        const bet = await prisma.bet.findUnique({
            where: {id: betId},
            include: {participants: true},
        });

        if (!bet || bet.status !== 'OPEN') {
            throw new Error('Ставка недоступна для участия');
        }

        const user = await prisma.user.findUnique({
            where: {id: userId},
        });

        if (!user || user.points < amount) {
            throw new Error('Недостаточно баллов для совершения ставки');
        }

        const totalPlayer1 = bet.participants
            .filter(p => p.player === PlayerChoice.PLAYER1)
            .reduce((sum, p) => sum + p.amount, 0);

        const totalPlayer2 = bet.participants
            .filter(p => p.player === PlayerChoice.PLAYER2)
            .reduce((sum, p) => sum + p.amount, 0);

        const totalPlayer1Profit = bet.participants
            .filter(p => p.player === PlayerChoice.PLAYER1)
            .reduce((sum, p) => sum + p.profit, 0);

        const totalPlayer2Profit = bet.participants
            .filter(p => p.player === PlayerChoice.PLAYER2)
            .reduce((sum, p) => sum + p.profit, 0);

        const totalWithInitPlayer1 = totalPlayer1Profit + (bet.initBetPlayer1 || 0);
        const totalWithInitPlayer2 = totalPlayer2Profit + (bet.initBetPlayer2 || 0);

        const currentOdds = player === PlayerChoice.PLAYER1 ? bet.oddsBetPlayer1 : bet.oddsBetPlayer2;
        if (currentOdds <= 1.04) {
            throw new Error('Коэффициент ставки слишком низкий. Минимально допустимый коэффициент: 1.05');
        }

        const potentialProfit = Math.floor((amount * (currentOdds - 1)) * 100) / 100;

        const maxAllowedBet = player === PlayerChoice.PLAYER1 ? bet.maxBetPlayer1 : bet.maxBetPlayer2;
        if (amount > maxAllowedBet) {
            throw new Error(`Максимально допустимая ставка: ${maxAllowedBet}`);
        }

        await prisma.betParticipant.create({
            data: {
                betId,
                userId,
                amount,
                player,
                odds: currentOdds,
                profit: potentialProfit,
                margin: 0,
                isCovered: "OPEN",
                overlap: 0,
            },
        });

        await prisma.user.update({
            where: {id: userId},
            data: {
                points: user.points - amount,
            },
        });

        const {
            oddsPlayer1,
            oddsPlayer2
        } = calculateOdds(
            totalWithInitPlayer1 + (player === PlayerChoice.PLAYER1 ? potentialProfit : 0),
            totalWithInitPlayer2 + (player === PlayerChoice.PLAYER2 ? potentialProfit : 0)
        );

        const totalMargin = await prisma.betParticipant.aggregate({
            _sum: {
                margin: true,
            },
            where: {
                betId: betId,
            },
        });

        const updatedBetData = {
            oddsBetPlayer1: Math.floor((oddsPlayer1 * 100)) / 100,
            oddsBetPlayer2: Math.floor((oddsPlayer2 * 100)) / 100,
            totalBetPlayer1: player === PlayerChoice.PLAYER1 ? totalPlayer1 + amount : totalPlayer1,
            totalBetPlayer2: player === PlayerChoice.PLAYER2 ? totalPlayer2 + amount : totalPlayer2,
            totalBetAmount: totalPlayer1 + totalPlayer2 + amount,
            margin: totalMargin._sum.margin || 0,
            maxBetPlayer1: player === PlayerChoice.PLAYER1 ? bet.maxBetPlayer1 : bet.maxBetPlayer1 + amount,
            maxBetPlayer2: player === PlayerChoice.PLAYER2 ? bet.maxBetPlayer2 : bet.maxBetPlayer2 + amount,
            overlapPlayer1: player === PlayerChoice.PLAYER1 ? bet.overlapPlayer1 + amount : bet.overlapPlayer1,
            overlapPlayer2: player === PlayerChoice.PLAYER2 ? bet.overlapPlayer2 + amount : bet.overlapPlayer2,
        };

        await prisma.bet.update({
            where: {id: betId},
            data: updatedBetData,
        })

        revalidatePath('/');

        return {success: true};
    } catch (error) {
        if (error === null || error === undefined) {
            console.error('Ошибка в placeBet: Неизвестная ошибка (error is null или undefined)');
        } else if (error instanceof Error) {
            console.error('Ошибка в placeBet:', error.message);
            console.error('Стек ошибки:', error.stack);
        } else {
            console.error('Ошибка в placeBet:', error);
        }

        throw new Error('Не удалось разместить ставку. Пожалуйста, попробуйте еще раз.');
    }
}// ставки
export async function closeBet(betId: number, winnerId: number) {
    const session = await getUserSession();
    if (!session || session.role !== 'ADMIN') {
        throw new Error('У вас нет прав для выполнения этой операции');
    }

    try {
        if (winnerId === null || winnerId === undefined) {
            throw new Error("Не выбран победитель.");
        }

        await prisma.$transaction(async (prisma) => {
            // Обновляем статус ставки и получаем данные
            const bet = await prisma.bet.update({
                where: {id: betId},
                data: {
                    status: 'CLOSED',
                    winnerId: winnerId,
                },
                include: {
                    participants: true,
                    player1: true,
                    player2: true,
                },
            });

            if (!bet) {
                throw new Error("Ставка не найдена");
            }

            // Создаем запись в BetCLOSED
            const betClosed = await prisma.betCLOSED.create({
                data: {
                    player1Id: bet.player1Id,
                    player2Id: bet.player2Id,
                    initBetPlayer1: bet.initBetPlayer1,
                    initBetPlayer2: bet.initBetPlayer2,
                    totalBetPlayer1: bet.totalBetPlayer1,
                    totalBetPlayer2: bet.totalBetPlayer2,
                    maxBetPlayer1: bet.maxBetPlayer1,
                    maxBetPlayer2: bet.maxBetPlayer2,
                    totalBetAmount: bet.totalBetAmount,
                    creatorId: bet.creatorId,
                    status: 'CLOSED',
                    categoryId: bet.categoryId,
                    productId: bet.productId,
                    productItemId: bet.productItemId,
                    winnerId: bet.winnerId,
                    margin: 0, // Инициализируем маржу
                    createdAt: bet.createdAt,
                    updatedAt: bet.updatedAt,
                    oddsBetPlayer1: bet.oddsBetPlayer1,
                    oddsBetPlayer2: bet.oddsBetPlayer2,
                    overlapPlayer1: 0, // Инициализируем overlapPlayer1
                    overlapPlayer2: 0, // Инициализируем overlapPlayer2
                    returnBetAmount: 0, // Инициализируем returnBetAmount
                    globalDataBetFund: 0, // Инициализируем globalDataBetFund
                },
            });

            // Определяем победителя
            const winningPlayer = bet.winnerId === bet.player1Id ? PlayerChoice.PLAYER1 : PlayerChoice.PLAYER2;

            // Перераспределяем баллы
            const allParticipants = await prisma.betParticipant.findMany({
                where: {betId: betId},
            });

            let totalMargin = 0;
            let totalPointsToReturn = 0; // Сумма всех возвращаемых баллов
            let overlapPlayer1Sum = 0;
            let overlapPlayer2Sum = 0;

            // Сначала вычисляем общую прибыль победителей
            let totalProfit = 0;
            for (const participant of allParticipants) {
                if (participant.player === winningPlayer) {
                    totalProfit += participant.profit;
                }
            }

            // Получаем текущий betFund
            const globalData = await prisma.globalData.findUnique({
                where: {id: 1},
            });

            if (!globalData || globalData.betFund === null) {
                throw new Error('Данные фонда ставок не найдены или betFund равен null');
            }

            let betFundAdjustment = 0;

            // Теперь распределяем общую сумму ставок
            for (const participant of allParticipants) {
                let pointsToReturn = 0;
                let margin = 0;
                let overlap = participant.amount + participant.profit;

                if (participant.player === winningPlayer) {
                    // Рассчитываем долю от общей суммы
                    const share = participant.profit / totalProfit;
                    pointsToReturn = bet.totalBetAmount * share;

                    // Вычитаем маржу
                    margin = participant.profit * MARGIN;
                    pointsToReturn = participant.amount + participant.profit - margin;

                    totalMargin += margin;
                }

                // Обновляем баллы пользователя
                if (pointsToReturn > 0) {
                    await prisma.user.update({
                        where: {id: participant.userId},
                        data: {
                            points: {
                                increment: Math.floor(pointsToReturn * 100) / 100,
                            },
                        },
                    });
                }

                // Добавляем к общей сумме возвращаемых баллов
                totalPointsToReturn += pointsToReturn;

                // Суммируем overlap для каждого игрока
                if (participant.player === PlayerChoice.PLAYER1) {
                    overlapPlayer1Sum += overlap;
                } else if (participant.player === PlayerChoice.PLAYER2) {
                    overlapPlayer2Sum += overlap;
                }

                // Создаем запись в BetParticipantCLOSED
                await prisma.betParticipantCLOSED.create({
                    data: {
                        betCLOSEDId: betClosed.id,
                        userId: participant.userId,
                        amount: participant.amount,
                        odds: participant.odds,
                        profit: participant.profit,
                        player: participant.player,
                        isWinner: participant.player === winningPlayer,
                        margin: Math.floor(margin * 100) / 100,
                        createdAt: participant.createdAt,
                        isCovered: "CLOSED", // Устанавливаем isCovered в "CLOSED"
                        overlap: Math.floor(overlap * 100) / 100,
                        return: Math.floor(pointsToReturn * 100) / 100,
                    },
                });
            }

            // Проверяем, что сумма всех возвращаемых баллов плюс маржа равна общей сумме ставок
            totalPointsToReturn += totalMargin;

            // Если сумма ставок недостаточна для выплат, берем из betFund
            if (totalPointsToReturn > bet.totalBetAmount) {
                const deficit = totalPointsToReturn - bet.totalBetAmount;
                if (globalData.betFund < deficit) {
                    throw new Error('Недостаточно средств в фонде для покрытия дефицита');
                }
                betFundAdjustment = -deficit;
                await prisma.globalData.update({
                    where: {id: 1},
                    data: {
                        betFund: {
                            decrement: deficit,
                        },
                    },
                });
            } else {
                // Если остались излишки, добавляем в betFund
                const surplus = bet.totalBetAmount - totalPointsToReturn;
                betFundAdjustment = surplus;
                await prisma.globalData.update({
                    where: {id: 1},
                    data: {
                        betFund: {
                            increment: surplus,
                        },
                    },
                });
            }

            // Обновляем поле margin, globalDataBetFund, overlapPlayer1 и overlapPlayer2 в BetCLOSED
            await prisma.betCLOSED.update({
                where: {id: betClosed.id},
                data: {
                    margin: Math.floor(totalMargin * 100) / 100,
                    returnBetAmount: Math.floor(totalPointsToReturn * 100) / 100, // Записываем сумму возвращенных баллов
                    globalDataBetFund: Math.floor(betFundAdjustment * 100) / 100, // Записываем изменение фонда
                    overlapPlayer1: Math.floor(overlapPlayer1Sum * 100) / 100,
                    overlapPlayer2: Math.floor(overlapPlayer2Sum * 100) / 100,
                },
            });

            // Удаляем участников и ставку
            await prisma.betParticipant.deleteMany({
                where: {betId: betId},
            });

            await prisma.bet.delete({
                where: {id: betId},
            });
        });

        // Ревалидация данных
        revalidatePath('/');
        revalidateTag('bets');
        revalidateTag('user');

        return {success: true, message: 'Ставка успешно закрыта'};
    } catch (error) {
        console.error("Ошибка при закрытии ставки:", error);

        if (error instanceof Error) {
            throw new Error(error.message);
        } else {
            throw new Error("Не удалось закрыть ставку.");
        }
    }
}

export async function closeBetDraw(betId: number) {
    const session = await getUserSession();
    if (!session || session.role !== 'ADMIN') {
        throw new Error('У вас нет прав для выполнения этой операции');
    }

    try {
        await prisma.$transaction(async (prisma) => {
            // Обновляем статус ставки на CLOSED и устанавливаем winnerId в null
            const bet = await prisma.bet.update({
                where: {id: betId},
                data: {
                    status: 'CLOSED',
                    winnerId: null,
                },
                include: {
                    participants: true,
                },
            });

            if (!bet) {
                throw new Error("Ставка не найдена");
            }

            // Создаем запись в BetCLOSED
            const betClosed = await prisma.betCLOSED.create({
                data: {
                    player1Id: bet.player1Id,
                    player2Id: bet.player2Id,
                    initBetPlayer1: bet.initBetPlayer1,
                    initBetPlayer2: bet.initBetPlayer2,
                    totalBetPlayer1: bet.totalBetPlayer1,
                    totalBetPlayer2: bet.totalBetPlayer2,
                    maxBetPlayer1: bet.maxBetPlayer1,
                    maxBetPlayer2: bet.maxBetPlayer2,
                    totalBetAmount: bet.totalBetAmount,
                    creatorId: bet.creatorId,
                    status: 'CLOSED',
                    categoryId: bet.categoryId,
                    productId: bet.productId,
                    productItemId: bet.productItemId,
                    winnerId: null,
                    margin: 0,
                    createdAt: bet.createdAt,
                    updatedAt: bet.updatedAt,
                    oddsBetPlayer1: bet.oddsBetPlayer1,
                    oddsBetPlayer2: bet.oddsBetPlayer2,
                    overlapPlayer1: bet.overlapPlayer1,
                    overlapPlayer2: bet.overlapPlayer2,
                },
            });

            // Возвращаем сумму ставки всем участникам
            for (const participant of bet.participants) {
                await prisma.user.update({
                    where: {id: participant.userId},
                    data: {
                        points: {
                            increment: participant.amount,
                        },
                    },
                });

                // Создаем запись в BetParticipantCLOSED
                await prisma.betParticipantCLOSED.create({
                    data: {
                        betCLOSEDId: betClosed.id,
                        userId: participant.userId,
                        amount: participant.amount,
                        odds: participant.odds,
                        profit: participant.profit,
                        player: participant.player,
                        isWinner: false, // Устанавливаем isWinner в "CLOSED"
                        margin: 0,
                        createdAt: participant.createdAt,
                        isCovered: "CLOSED", // Устанавливаем isCovered в "CLOSED"
                        overlap: participant.overlap,
                        return: participant.amount,
                    },
                });
            }

            // Удаляем участников и ставку
            await prisma.betParticipant.deleteMany({
                where: {betId: betId},
            });

            await prisma.bet.delete({
                where: {id: betId},
            });
        });

        // Обновляем данные

        revalidatePath('/');
        revalidateTag('bets');
        revalidateTag('user');

        return {success: true, message: 'Ставка успешно закрыта как ничья'};
    } catch (error) {
        console.error("Ошибка при закрытии ставки как ничья:", error);

        if (error instanceof Error) {
            throw new Error(error.message);
        } else {
            throw new Error("Не удалось закрыть ставку как ничья.");
        }
    }
}


function calculateOdds3(totalWithInitPlayer1: number, totalWithInitPlayer2: number, totalWithInitPlayer3: number) {
    // Add a constant value to each player's total to stabilize the odds
    const adjustedTotalPlayer1 = totalWithInitPlayer1 + 3000;
    const adjustedTotalPlayer2 = totalWithInitPlayer2 + 3000;
    const adjustedTotalPlayer3 = totalWithInitPlayer3 + 3000;

    const totalWithInit = adjustedTotalPlayer1 + adjustedTotalPlayer2 + adjustedTotalPlayer3;

    const oddsPlayer1 = adjustedTotalPlayer1 === 0 ? 1 : totalWithInit / adjustedTotalPlayer1;
    const oddsPlayer2 = adjustedTotalPlayer2 === 0 ? 1 : totalWithInit / adjustedTotalPlayer2;
    const oddsPlayer3 = adjustedTotalPlayer3 === 0 ? 1 : totalWithInit / adjustedTotalPlayer3;

    return {
        // Round to two decimal places
        oddsPlayer1: Math.floor((oddsPlayer1 * 100)) / 100,
        oddsPlayer2: Math.floor((oddsPlayer2 * 100)) / 100,
        oddsPlayer3: Math.floor((oddsPlayer3 * 100)) / 100,
    };
}// Функция для расчета коэффициентов на 3 игроков
function calculateMaxBets3(initBetPlayer1: number, initBetPlayer2: number, initBetPlayer3: number): {
    maxBetPlayer1: number,
    maxBetPlayer2: number,
    maxBetPlayer3: number
} {
    const maxBetPlayer1 = Math.floor((initBetPlayer2 + initBetPlayer3) * 100) / 100;
    const maxBetPlayer2 = Math.floor((initBetPlayer1 + initBetPlayer3) * 100) / 100;
    const maxBetPlayer3 = Math.floor((initBetPlayer1 + initBetPlayer2) * 100) / 100;
    return {maxBetPlayer1, maxBetPlayer2, maxBetPlayer3};
}// Функция для расчета максимальных ставок на 3 игрока
export async function clientCreateBet3(formData: any) {
    const session = await getUserSession();
    if (!session || session.role !== 'ADMIN') {
        throw new Error('У вас нет прав для выполнения этой операции');
    }
    console.log("Form Data:", formData);
    try {
        const user = await prisma.user.findUnique({
            where: {id: Number(session.id)},
        });

        if (!user) {
            throw new Error("Пользователь не найден");
        }

        const totalBetAmount = Math.floor((formData.initBetPlayer1 + formData.initBetPlayer2 + formData.initBetPlayer3) * 100) / 100;
        if (totalBetAmount > 1000) {
            throw new Error("Сумма начальных ставок не должна превышать 1000 баллов");
        }

        const {
            maxBetPlayer1,
            maxBetPlayer2,
            maxBetPlayer3
        } = calculateMaxBets3(formData.initBetPlayer1, formData.initBetPlayer2, formData.initBetPlayer3);

        const newBet = await prisma.bet3.create({
            data: {
                status: 'OPEN',
                totalBetAmount: 0,
                maxBetPlayer1,
                maxBetPlayer2,
                maxBetPlayer3,
                oddsBetPlayer1: Math.floor((parseFloat(formData.oddsBetPlayer1) * 100)) / 100,
                oddsBetPlayer2: Math.floor((parseFloat(formData.oddsBetPlayer2) * 100)) / 100,
                oddsBetPlayer3: Math.floor((parseFloat(formData.oddsBetPlayer3) * 100)) / 100,
                player1Id: formData.player1Id,
                player2Id: formData.player2Id,
                player3Id: formData.player3Id,
                initBetPlayer1: Math.floor((parseFloat(formData.initBetPlayer1) * 100)) / 100,
                initBetPlayer2: Math.floor((parseFloat(formData.initBetPlayer2) * 100)) / 100,
                initBetPlayer3: Math.floor((parseFloat(formData.initBetPlayer3) * 100)) / 100,
                overlapPlayer1: 0,
                overlapPlayer2: 0,
                overlapPlayer3: 0,
                categoryId: formData.categoryId,
                productId: formData.productId,
                productItemId: formData.productItemId,
                creatorId: formData.creatorId,
                totalBetPlayer1: 0,
                totalBetPlayer2: 0,
                totalBetPlayer3: 0,
                margin: 0,
            },
        });

        console.log("New bet created:", newBet);

        revalidatePath('/');

        return newBet;
    } catch (error) {
        if (error === null || error === undefined) {
            console.error('Неизвестная ошибка (error is null или undefined)');
        } else if (error instanceof Error) {
            console.error(error.message);
            console.error('Стек ошибки:', error.stack);
        } else {
            console.error('Ошибка в placeBet:', error);
        }

        throw new Error('Не удалось разместить ставку. Пожалуйста, попробуйте еще раз.');
    }
}// создание ставок на 3 игрока
export async function placeBet3(formData: { betId: number; userId: number; amount: number; player: PlayerChoice }) {
    try {
        console.log('Запуск функции placeBet3 с formData:', formData);

        if (!formData || typeof formData !== 'object') {
            throw new Error('Неверные данные формы');
        }

        const {betId, userId, amount, player} = formData;

        if (!betId || !userId || !amount || !player) {
            throw new Error('Отсутствуют обязательные поля в данных формы');
        }

        const bet = await prisma.bet3.findUnique({
            where: {id: betId},
            include: {participants: true},
        });

        if (!bet || bet.status !== 'OPEN') {
            throw new Error('Ставка недоступна для участия');
        }

        const user = await prisma.user.findUnique({
            where: {id: userId},
        });

        if (!user || user.points < amount) {
            throw new Error('Недостаточно баллов для совершения ставки');
        }

        const totalPlayer1 = bet.participants
            .filter(p => p.player === PlayerChoice.PLAYER1)
            .reduce((sum, p) => sum + p.amount, 0);

        const totalPlayer2 = bet.participants
            .filter(p => p.player === PlayerChoice.PLAYER2)
            .reduce((sum, p) => sum + p.amount, 0);

        const totalPlayer3 = bet.participants
            .filter(p => p.player === PlayerChoice.PLAYER3)
            .reduce((sum, p) => sum + p.amount, 0);

        const totalPlayer1Profit = bet.participants
            .filter(p => p.player === PlayerChoice.PLAYER1)
            .reduce((sum, p) => sum + p.profit, 0);

        const totalPlayer2Profit = bet.participants
            .filter(p => p.player === PlayerChoice.PLAYER2)
            .reduce((sum, p) => sum + p.profit, 0);

        const totalPlayer3Profit = bet.participants
            .filter(p => p.player === PlayerChoice.PLAYER3)
            .reduce((sum, p) => sum + p.profit, 0);

        const totalWithInitPlayer1 = totalPlayer1Profit + (bet.initBetPlayer1 || 0);
        const totalWithInitPlayer2 = totalPlayer2Profit + (bet.initBetPlayer2 || 0);
        const totalWithInitPlayer3 = totalPlayer3Profit + (bet.initBetPlayer3 || 0);

        const currentOdds = player === PlayerChoice.PLAYER1 ? bet.oddsBetPlayer1 : player === PlayerChoice.PLAYER2 ? bet.oddsBetPlayer2 : bet.oddsBetPlayer3;
        if (currentOdds <= 1.04) {
            throw new Error('Коэффициент ставки слишком низкий. Минимально допустимый коэффициент: 1.05');
        }

        const potentialProfit = Math.floor((amount * (currentOdds - 1)) * 100) / 100;

        const maxAllowedBet = player === PlayerChoice.PLAYER1 ? bet.maxBetPlayer1 : player === PlayerChoice.PLAYER2 ? bet.maxBetPlayer2 : bet.maxBetPlayer3;
        if (amount > maxAllowedBet) {
            throw new Error(`Максимально допустимая ставка: ${maxAllowedBet}`);
        }

        await prisma.betParticipant3.create({
            data: {
                betId,
                userId,
                amount,
                player,
                odds: currentOdds,
                profit: potentialProfit,
                margin: 0,
                isCovered: "OPEN",
                overlap: 0,
            },
        });

        await prisma.user.update({
            where: {id: userId},
            data: {
                points: user.points - amount,
            },
        });

        const {
            oddsPlayer1,
            oddsPlayer2,
            oddsPlayer3
        } = calculateOdds3(
            totalWithInitPlayer1 + (player === PlayerChoice.PLAYER1 ? potentialProfit : 0),
            totalWithInitPlayer2 + (player === PlayerChoice.PLAYER2 ? potentialProfit : 0),
            totalWithInitPlayer3 + (player === PlayerChoice.PLAYER3 ? potentialProfit : 0)
        );

        const totalMargin = await prisma.betParticipant3.aggregate({
            _sum: {
                margin: true,
            },
            where: {
                betId: betId,
            },
        });

        const updatedBetData = {
            oddsBetPlayer1: Math.floor((oddsPlayer1 * 100)) / 100,
            oddsBetPlayer2: Math.floor((oddsPlayer2 * 100)) / 100,
            oddsBetPlayer3: Math.floor((oddsPlayer3 * 100)) / 100,
            totalBetPlayer1: player === PlayerChoice.PLAYER1 ? totalPlayer1 + amount : totalPlayer1,
            totalBetPlayer2: player === PlayerChoice.PLAYER2 ? totalPlayer2 + amount : totalPlayer2,
            totalBetPlayer3: player === PlayerChoice.PLAYER3 ? totalPlayer3 + amount : totalPlayer3,
            totalBetAmount: totalPlayer1 + totalPlayer2 + totalPlayer3 + amount,
            margin: totalMargin._sum.margin || 0,
            maxBetPlayer1: player === PlayerChoice.PLAYER1 ? bet.maxBetPlayer1 : bet.maxBetPlayer1 + amount,
            maxBetPlayer2: player === PlayerChoice.PLAYER2 ? bet.maxBetPlayer2 : bet.maxBetPlayer2 + amount,
            maxBetPlayer3: player === PlayerChoice.PLAYER3 ? bet.maxBetPlayer3 : bet.maxBetPlayer3 + amount,
            overlapPlayer1: player === PlayerChoice.PLAYER1 ? bet.overlapPlayer1 + amount : bet.overlapPlayer1,
            overlapPlayer2: player === PlayerChoice.PLAYER2 ? bet.overlapPlayer2 + amount : bet.overlapPlayer2,
            overlapPlayer3: player === PlayerChoice.PLAYER3 ? bet.overlapPlayer3 + amount : bet.overlapPlayer3,
        };

        await prisma.bet3.update({
            where: {id: betId},
            data: updatedBetData,
        });

        revalidatePath('/');

        return {success: true};
    } catch (error) {
        if (error === null || error === undefined) {
            console.error('Ошибка в placeBet3: Неизвестная ошибка (error is null или undefined)');
        } else if (error instanceof Error) {
            console.error('Ошибка в placeBet3:', error.message);
            console.error('Стек ошибки:', error.stack);
        } else {
            console.error('Ошибка в placeBet3:', error);
        }

        throw new Error('Не удалось разместить ставку. Пожалуйста, попробуйте еще раз.');
    }
}// ставки на 3 игрока
export async function closeBet3(betId: number, winnerId: number) {
    const session = await getUserSession();
    if (!session || session.role !== 'ADMIN') {
        throw new Error('У вас нет прав для выполнения этой операции');
    }

    try {
        if (winnerId === null || winnerId === undefined) {
            throw new Error("Не выбран победитель.");
        }

        await prisma.$transaction(async (prisma) => {
            // Обновляем статус ставки и получаем данные
            const bet = await prisma.bet3.update({
                where: {id: betId},
                data: {
                    status: 'CLOSED',
                    winnerId: winnerId,
                },
                include: {
                    participants: true,
                    player1: true,
                    player2: true,
                    player3: true,
                },
            });

            if (!bet) {
                throw new Error("Ставка не найдена");
            }

            // Создаем запись в BetCLOSED3
            const betClosed = await prisma.betCLOSED3.create({
                data: {
                    player1Id: bet.player1Id,
                    player2Id: bet.player2Id,
                    player3Id: bet.player3Id,
                    initBetPlayer1: bet.initBetPlayer1,
                    initBetPlayer2: bet.initBetPlayer2,
                    initBetPlayer3: bet.initBetPlayer3,
                    totalBetPlayer1: bet.totalBetPlayer1,
                    totalBetPlayer2: bet.totalBetPlayer2,
                    totalBetPlayer3: bet.totalBetPlayer3,
                    maxBetPlayer1: bet.maxBetPlayer1,
                    maxBetPlayer2: bet.maxBetPlayer2,
                    maxBetPlayer3: bet.maxBetPlayer3,
                    totalBetAmount: bet.totalBetAmount,
                    creatorId: bet.creatorId,
                    status: 'CLOSED',
                    categoryId: bet.categoryId,
                    productId: bet.productId,
                    productItemId: bet.productItemId,
                    winnerId: bet.winnerId,
                    margin: 0, // Инициализируем маржу
                    createdAt: bet.createdAt,
                    updatedAt: bet.updatedAt,
                    oddsBetPlayer1: bet.oddsBetPlayer1,
                    oddsBetPlayer2: bet.oddsBetPlayer2,
                    oddsBetPlayer3: bet.oddsBetPlayer3,
                    overlapPlayer1: 0, // Инициализируем overlapPlayer1
                    overlapPlayer2: 0, // Инициализируем overlapPlayer2
                    overlapPlayer3: 0, // Инициализируем overlapPlayer3
                    returnBetAmount: 0, // Инициализируем returnBetAmount
                    globalDataBetFund: 0, // Инициализируем globalDataBetFund
                },
            });

            // Определяем победителя
            const winningPlayer =
                bet.winnerId === bet.player1Id ? PlayerChoice.PLAYER1 :
                    bet.winnerId === bet.player2Id ? PlayerChoice.PLAYER2 : PlayerChoice.PLAYER3;

            // Перераспределяем баллы
            const allParticipants = await prisma.betParticipant3.findMany({
                where: {betId: betId},
            });

            let totalMargin = 0;
            let totalPointsToReturn = 0; // Сумма всех возвращаемых баллов
            let overlapPlayer1Sum = 0;
            let overlapPlayer2Sum = 0;
            let overlapPlayer3Sum = 0;

            // Сначала вычисляем общую прибыль победителей
            let totalProfit = 0;
            for (const participant of allParticipants) {
                if (participant.player === winningPlayer) {
                    totalProfit += participant.profit;
                }
            }

            // Получаем текущий betFund
            const globalData = await prisma.globalData.findUnique({
                where: {id: 1},
            });

            if (!globalData || globalData.betFund === null) {
                throw new Error('Данные фонда ставок не найдены или betFund равен null');
            }

            let betFundAdjustment = 0;

            // Теперь распределяем общую сумму ставок
            for (const participant of allParticipants) {
                let pointsToReturn = 0;
                let margin = 0;
                let overlap = participant.amount + participant.profit;

                if (participant.player === winningPlayer) {
                    // Рассчитываем долю от общей суммы
                    const share = participant.profit / totalProfit;
                    pointsToReturn = bet.totalBetAmount * share;

                    // Вычитаем маржу
                    margin = participant.profit * MARGIN;
                    pointsToReturn = participant.amount + participant.profit - margin;

                    totalMargin += margin;
                }

                // Обновляем баллы пользователя
                if (pointsToReturn > 0) {
                    await prisma.user.update({
                        where: {id: participant.userId},
                        data: {
                            points: {
                                increment: Math.floor(pointsToReturn * 100) / 100,
                            },
                        },
                    });
                }

                // Добавляем к общей сумме возвращаемых баллов
                totalPointsToReturn += pointsToReturn;

                // Суммируем overlap для каждого игрока
                if (participant.player === PlayerChoice.PLAYER1) {
                    overlapPlayer1Sum += overlap;
                } else if (participant.player === PlayerChoice.PLAYER2) {
                    overlapPlayer2Sum += overlap;
                } else if (participant.player === PlayerChoice.PLAYER3) {
                    overlapPlayer3Sum += overlap;
                }

                // Создаем запись в BetParticipantCLOSED3
                await prisma.betParticipantCLOSED3.create({
                    data: {
                        betCLOSED3Id: betClosed.id,
                        userId: participant.userId,
                        amount: participant.amount,
                        odds: participant.odds,
                        profit: participant.profit,
                        player: participant.player,
                        isWinner: participant.player === winningPlayer,
                        margin: Math.floor(margin * 100) / 100,
                        createdAt: participant.createdAt,
                        isCovered: "CLOSED", // Устанавливаем isCovered в "CLOSED"
                        overlap: Math.floor(overlap * 100) / 100,
                        return: Math.floor(pointsToReturn * 100) / 100,
                    },
                });
            }

            // Проверяем, что сумма всех возвращаемых баллов плюс маржа равна общей сумме ставок
            totalPointsToReturn += totalMargin;

            // Если сумма ставок недостаточна для выплат, берем из betFund
            if (totalPointsToReturn > bet.totalBetAmount) {
                const deficit = totalPointsToReturn - bet.totalBetAmount;
                if (globalData.betFund < deficit) {
                    throw new Error('Недостаточно средств в фонде для покрытия дефицита');
                }
                betFundAdjustment = -deficit;
                await prisma.globalData.update({
                    where: {id: 1},
                    data: {
                        betFund: {
                            decrement: deficit,
                        },
                    },
                });
            } else {
                // Если остались излишки, добавляем в betFund
                const surplus = bet.totalBetAmount - totalPointsToReturn;
                betFundAdjustment = surplus;
                await prisma.globalData.update({
                    where: {id: 1},
                    data: {
                        betFund: {
                            increment: surplus,
                        },
                    },
                });
            }

            // Обновляем поле margin, globalDataBetFund, overlapPlayer1, overlapPlayer2 и overlapPlayer3 в BetCLOSED3
            await prisma.betCLOSED3.update({
                where: {id: betClosed.id},
                data: {
                    margin: Math.floor(totalMargin * 100) / 100,
                    returnBetAmount: Math.floor(totalPointsToReturn * 100) / 100, // Записываем сумму возвращенных баллов
                    globalDataBetFund: Math.floor(betFundAdjustment * 100) / 100, // Записываем изменение фонда
                    overlapPlayer1: Math.floor(overlapPlayer1Sum * 100) / 100,
                    overlapPlayer2: Math.floor(overlapPlayer2Sum * 100) / 100,
                    overlapPlayer3: Math.floor(overlapPlayer3Sum * 100) / 100,
                },
            });

            // Удаляем участников и ставку
            await prisma.betParticipant3.deleteMany({
                where: {betId: betId},
            });

            await prisma.bet3.delete({
                where: {id: betId},
            });
        });

        // Ревалидация данных
        revalidatePath('/');
        revalidateTag('bets');
        revalidateTag('user');

        return {success: true, message: 'Ставка успешно закрыта'};
    } catch (error) {
        console.error("Ошибка при закрытии ставки:", error);

        if (error instanceof Error) {
            throw new Error(error.message);
        } else {
            throw new Error("Не удалось закрыть ставку.");
        }
    }
}// Функция для закрытия ставки на 3 игрока
export async function closeBetDraw3(betId: number) {
    const session = await getUserSession();
    if (!session || session.role !== 'ADMIN') {
        throw new Error('У вас нет прав для выполнения этой операции');
    }

    try {
        await prisma.$transaction(async (prisma) => {
            // Обновляем статус ставки на CLOSED и устанавливаем winnerId в null
            const bet = await prisma.bet3.update({
                where: {id: betId},
                data: {
                    status: 'CLOSED',
                    winnerId: null,
                },
                include: {
                    participants: true,
                },
            });

            if (!bet) {
                throw new Error("Ставка не найдена");
            }

            // Создаем запись в BetCLOSED3
            const betClosed = await prisma.betCLOSED3.create({
                data: {
                    player1Id: bet.player1Id,
                    player2Id: bet.player2Id,
                    player3Id: bet.player3Id,
                    initBetPlayer1: bet.initBetPlayer1,
                    initBetPlayer2: bet.initBetPlayer2,
                    initBetPlayer3: bet.initBetPlayer3,
                    totalBetPlayer1: bet.totalBetPlayer1,
                    totalBetPlayer2: bet.totalBetPlayer2,
                    totalBetPlayer3: bet.totalBetPlayer3,
                    maxBetPlayer1: bet.maxBetPlayer1,
                    maxBetPlayer2: bet.maxBetPlayer2,
                    maxBetPlayer3: bet.maxBetPlayer3,
                    totalBetAmount: bet.totalBetAmount,
                    creatorId: bet.creatorId,
                    status: 'CLOSED',
                    categoryId: bet.categoryId,
                    productId: bet.productId,
                    productItemId: bet.productItemId,
                    winnerId: null,
                    margin: 0,
                    createdAt: bet.createdAt,
                    updatedAt: bet.updatedAt,
                    oddsBetPlayer1: bet.oddsBetPlayer1,
                    oddsBetPlayer2: bet.oddsBetPlayer2,
                    oddsBetPlayer3: bet.oddsBetPlayer3,
                    overlapPlayer1: bet.overlapPlayer1,
                    overlapPlayer2: bet.overlapPlayer2,
                    overlapPlayer3: bet.overlapPlayer3,
                },
            });

            // Возвращаем сумму ставки всем участникам
            for (const participant of bet.participants) {
                await prisma.user.update({
                    where: {id: participant.userId},
                    data: {
                        points: {
                            increment: participant.amount,
                        },
                    },
                });

                // Создаем запись в BetParticipantCLOSED3
                await prisma.betParticipantCLOSED3.create({
                    data: {
                        betCLOSED3Id: betClosed.id,
                        userId: participant.userId,
                        amount: participant.amount,
                        odds: participant.odds,
                        profit: participant.profit,
                        player: participant.player,
                        isWinner: false, // Устанавливаем isWinner в "CLOSED"
                        margin: 0,
                        createdAt: participant.createdAt,
                        isCovered: "CLOSED", // Устанавливаем isCovered в "CLOSED"
                        overlap: participant.overlap,
                        return: participant.amount,
                    },
                });
            }

            // Удаляем участников и ставку
            await prisma.betParticipant3.deleteMany({
                where: {betId: betId},
            });

            await prisma.bet3.delete({
                where: {id: betId},
            });
        });

        // Обновляем глобальные данные

        revalidatePath('/');
        revalidateTag('bets');
        revalidateTag('user');

        return {success: true, message: 'Ставка успешно закрыта как ничья'};
    } catch (error) {
        console.error("Ошибка при закрытии ставки как ничья:", error);

        if (error instanceof Error) {
            throw new Error(error.message);
        } else {
            throw new Error("Не удалось закрыть ставку как ничья.");
        }
    }
}// ничья на 3 игрока

function calculateOdds4(totalWithInitPlayer1: number, totalWithInitPlayer2: number, totalWithInitPlayer3: number, totalWithInitPlayer4: number) {
    // Add a constant value to each player's total to stabilize the odds
    const adjustedTotalPlayer1 = totalWithInitPlayer1 + 4000;
    const adjustedTotalPlayer2 = totalWithInitPlayer2 + 4000;
    const adjustedTotalPlayer3 = totalWithInitPlayer3 + 4000;
    const adjustedTotalPlayer4 = totalWithInitPlayer4 + 4000;

    const totalWithInit = adjustedTotalPlayer1 + adjustedTotalPlayer2 + adjustedTotalPlayer3 + adjustedTotalPlayer4;

    const oddsPlayer1 = adjustedTotalPlayer1 === 0 ? 1 : totalWithInit / adjustedTotalPlayer1;
    const oddsPlayer2 = adjustedTotalPlayer2 === 0 ? 1 : totalWithInit / adjustedTotalPlayer2;
    const oddsPlayer3 = adjustedTotalPlayer3 === 0 ? 1 : totalWithInit / adjustedTotalPlayer3;
    const oddsPlayer4 = adjustedTotalPlayer4 === 0 ? 1 : totalWithInit / adjustedTotalPlayer4;

    return {
        // Round to two decimal places
        oddsPlayer1: Math.floor((oddsPlayer1 * 100)) / 100,
        oddsPlayer2: Math.floor((oddsPlayer2 * 100)) / 100,
        oddsPlayer3: Math.floor((oddsPlayer3 * 100)) / 100,
        oddsPlayer4: Math.floor((oddsPlayer4 * 100)) / 100,
    };
}// Функция для расчета коэффициентов на 4 игроков
export async function clientCreateBet4(formData: any) {
    const session = await getUserSession();
    if (!session || session.role !== 'ADMIN') {
        throw new Error('У вас нет прав для выполнения этой операции');
    }
    console.log("Form Data:", formData);
    try {
        const user = await prisma.user.findUnique({
            where: {id: Number(session.id)},
        });

        if (!user) {
            throw new Error("Пользователь не найден");
        }

        const totalBetAmount = Math.floor((formData.initBetPlayer1 + formData.initBetPlayer2 + formData.initBetPlayer3 + formData.initBetPlayer4) * 100) / 100;
        if (totalBetAmount > 1000) {
            throw new Error("Сумма начальных ставок не должна превышать 1000 баллов");
        }

        const {
            maxBetPlayer1,
            maxBetPlayer2,
            maxBetPlayer3,
            maxBetPlayer4
        } = calculateMaxBets4(formData.initBetPlayer1, formData.initBetPlayer2, formData.initBetPlayer3, formData.initBetPlayer4);

        const newBet = await prisma.bet4.create({
            data: {
                status: 'OPEN',
                totalBetAmount: 0,
                maxBetPlayer1,
                maxBetPlayer2,
                maxBetPlayer3,
                maxBetPlayer4,
                oddsBetPlayer1: Math.floor((parseFloat(formData.oddsBetPlayer1) * 100)) / 100,
                oddsBetPlayer2: Math.floor((parseFloat(formData.oddsBetPlayer2) * 100)) / 100,
                oddsBetPlayer3: Math.floor((parseFloat(formData.oddsBetPlayer3) * 100)) / 100,
                oddsBetPlayer4: Math.floor((parseFloat(formData.oddsBetPlayer4) * 100)) / 100,
                player1Id: formData.player1Id,
                player2Id: formData.player2Id,
                player3Id: formData.player3Id,
                player4Id: formData.player4Id,
                initBetPlayer1: Math.floor((parseFloat(formData.initBetPlayer1) * 100)) / 100,
                initBetPlayer2: Math.floor((parseFloat(formData.initBetPlayer2) * 100)) / 100,
                initBetPlayer3: Math.floor((parseFloat(formData.initBetPlayer3) * 100)) / 100,
                initBetPlayer4: Math.floor((parseFloat(formData.initBetPlayer4) * 100)) / 100,
                overlapPlayer1: 0,
                overlapPlayer2: 0,
                overlapPlayer3: 0,
                overlapPlayer4: 0,
                categoryId: formData.categoryId,
                productId: formData.productId,
                productItemId: formData.productItemId,
                creatorId: formData.creatorId,
                totalBetPlayer1: 0,
                totalBetPlayer2: 0,
                totalBetPlayer3: 0,
                totalBetPlayer4: 0,
                margin: 0,
            },
        });

        console.log("New bet created:", newBet);

        revalidatePath('/');

        return newBet;
    } catch (error) {
        if (error === null || error === undefined) {
            console.error('Неизвестная ошибка (error is null или undefined)');
        } else if (error instanceof Error) {
            console.error(error.message);
            console.error('Стек ошибки:', error.stack);
        } else {
            console.error('Ошибка в placeBet:', error);
        }

        throw new Error('Не удалось разместить ставку. Пожалуйста, попробуйте еще раз.');
    }
}// создание ставок на 4 игрока
function calculateMaxBets4(initBetPlayer1: number, initBetPlayer2: number, initBetPlayer3: number, initBetPlayer4: number): {
    maxBetPlayer1: number,
    maxBetPlayer2: number,
    maxBetPlayer3: number,
    maxBetPlayer4: number
} {
    const maxBetPlayer1 = Math.floor((initBetPlayer2 + initBetPlayer3 + initBetPlayer4) * 100) / 100;
    const maxBetPlayer2 = Math.floor((initBetPlayer1 + initBetPlayer3 + initBetPlayer4) * 100) / 100;
    const maxBetPlayer3 = Math.floor((initBetPlayer1 + initBetPlayer2 + initBetPlayer4) * 100) / 100;
    const maxBetPlayer4 = Math.floor((initBetPlayer1 + initBetPlayer2 + initBetPlayer3) * 100) / 100;
    return {maxBetPlayer1, maxBetPlayer2, maxBetPlayer3, maxBetPlayer4};
}// Функция для расчета максимальных ставок на 4 игрока
// ставки на 4 игрока
// Function to place a bet for four players
export async function placeBet4(formData: { betId: number; userId: number; amount: number; player: PlayerChoice }) {
    try {
        console.log('Запуск функции placeBet4 с formData:', formData);

        if (!formData || typeof formData !== 'object') {
            throw new Error('Неверные данные формы');
        }

        const {betId, userId, amount, player} = formData;

        if (!betId || !userId || !amount || !player) {
            throw new Error('Отсутствуют обязательные поля в данных формы');
        }

        const bet = await prisma.bet4.findUnique({
            where: {id: betId},
            include: {participants: true},
        });

        if (!bet || bet.status !== 'OPEN') {
            throw new Error('Ставка недоступна для участия');
        }

        const user = await prisma.user.findUnique({
            where: {id: userId},
        });

        if (!user || user.points < amount) {
            throw new Error('Недостаточно баллов для совершения ставки');
        }

        const totalPlayer1 = bet.participants
            .filter(p => p.player === PlayerChoice.PLAYER1)
            .reduce((sum, p) => sum + p.amount, 0);

        const totalPlayer2 = bet.participants
            .filter(p => p.player === PlayerChoice.PLAYER2)
            .reduce((sum, p) => sum + p.amount, 0);

        const totalPlayer3 = bet.participants
            .filter(p => p.player === PlayerChoice.PLAYER3)
            .reduce((sum, p) => sum + p.amount, 0);

        const totalPlayer4 = bet.participants
            .filter(p => p.player === PlayerChoice.PLAYER4)
            .reduce((sum, p) => sum + p.amount, 0);

        const totalPlayer1Profit = bet.participants
            .filter(p => p.player === PlayerChoice.PLAYER1)
            .reduce((sum, p) => sum + p.profit, 0);

        const totalPlayer2Profit = bet.participants
            .filter(p => p.player === PlayerChoice.PLAYER2)
            .reduce((sum, p) => sum + p.profit, 0);

        const totalPlayer3Profit = bet.participants
            .filter(p => p.player === PlayerChoice.PLAYER3)
            .reduce((sum, p) => sum + p.profit, 0);

        const totalPlayer4Profit = bet.participants
            .filter(p => p.player === PlayerChoice.PLAYER4)
            .reduce((sum, p) => sum + p.profit, 0);

        const totalWithInitPlayer1 = totalPlayer1Profit + (bet.initBetPlayer1 || 0);
        const totalWithInitPlayer2 = totalPlayer2Profit + (bet.initBetPlayer2 || 0);
        const totalWithInitPlayer3 = totalPlayer3Profit + (bet.initBetPlayer3 || 0);
        const totalWithInitPlayer4 = totalPlayer4Profit + (bet.initBetPlayer4 || 0);

        const currentOdds = player === PlayerChoice.PLAYER1 ? bet.oddsBetPlayer1 :
            player === PlayerChoice.PLAYER2 ? bet.oddsBetPlayer2 :
                player === PlayerChoice.PLAYER3 ? bet.oddsBetPlayer3 :
                    bet.oddsBetPlayer4;
        if (currentOdds <= 1.04) {
            throw new Error('Коэффициент ставки слишком низкий. Минимально допустимый коэффициент: 1.05');
        }

        const potentialProfit = Math.floor((amount * (currentOdds - 1)) * 100) / 100;

        const maxAllowedBet = player === PlayerChoice.PLAYER1 ? bet.maxBetPlayer1 :
            player === PlayerChoice.PLAYER2 ? bet.maxBetPlayer2 :
                player === PlayerChoice.PLAYER3 ? bet.maxBetPlayer3 :
                    bet.maxBetPlayer4;
        if (amount > maxAllowedBet) {
            throw new Error(`Максимально допустимая ставка: ${maxAllowedBet}`);
        }

        await prisma.betParticipant4.create({
            data: {
                betId,
                userId,
                amount,
                player,
                odds: currentOdds,
                profit: potentialProfit,
                margin: 0,
                isCovered: "OPEN",
                overlap: 0,
            },
        });

        await prisma.user.update({
            where: {id: userId},
            data: {
                points: user.points - amount,
            },
        });

        const {
            oddsPlayer1,
            oddsPlayer2,
            oddsPlayer3,
            oddsPlayer4
        } = calculateOdds4(
            totalWithInitPlayer1 + (player === PlayerChoice.PLAYER1 ? potentialProfit : 0),
            totalWithInitPlayer2 + (player === PlayerChoice.PLAYER2 ? potentialProfit : 0),
            totalWithInitPlayer3 + (player === PlayerChoice.PLAYER3 ? potentialProfit : 0),
            totalWithInitPlayer4 + (player === PlayerChoice.PLAYER4 ? potentialProfit : 0)
        );

        const totalMargin = await prisma.betParticipant4.aggregate({
            _sum: {
                margin: true,
            },
            where: {
                betId: betId,
            },
        });

        const updatedBetData = {
            oddsBetPlayer1: Math.floor((oddsPlayer1 * 100)) / 100,
            oddsBetPlayer2: Math.floor((oddsPlayer2 * 100)) / 100,
            oddsBetPlayer3: Math.floor((oddsPlayer3 * 100)) / 100,
            oddsBetPlayer4: Math.floor((oddsPlayer4 * 100)) / 100,
            totalBetPlayer1: player === PlayerChoice.PLAYER1 ? totalPlayer1 + amount : totalPlayer1,
            totalBetPlayer2: player === PlayerChoice.PLAYER2 ? totalPlayer2 + amount : totalPlayer2,
            totalBetPlayer3: player === PlayerChoice.PLAYER3 ? totalPlayer3 + amount : totalPlayer3,
            totalBetPlayer4: player === PlayerChoice.PLAYER4 ? totalPlayer4 + amount : totalPlayer4,
            totalBetAmount: totalPlayer1 + totalPlayer2 + totalPlayer3 + totalPlayer4 + amount,
            margin: totalMargin._sum.margin || 0,
            maxBetPlayer1: player === PlayerChoice.PLAYER1 ? bet.maxBetPlayer1 : bet.maxBetPlayer1 + amount,
            maxBetPlayer2: player === PlayerChoice.PLAYER2 ? bet.maxBetPlayer2 : bet.maxBetPlayer2 + amount,
            maxBetPlayer3: player === PlayerChoice.PLAYER3 ? bet.maxBetPlayer3 : bet.maxBetPlayer3 + amount,
            maxBetPlayer4: player === PlayerChoice.PLAYER4 ? bet.maxBetPlayer4 : bet.maxBetPlayer4 + amount,
            overlapPlayer1: player === PlayerChoice.PLAYER1 ? bet.overlapPlayer1 + amount : bet.overlapPlayer1,
            overlapPlayer2: player === PlayerChoice.PLAYER2 ? bet.overlapPlayer2 + amount : bet.overlapPlayer2,
            overlapPlayer3: player === PlayerChoice.PLAYER3 ? bet.overlapPlayer3 + amount : bet.overlapPlayer3,
            overlapPlayer4: player === PlayerChoice.PLAYER4 ? bet.overlapPlayer4 + amount : bet.overlapPlayer4,
        };

        await prisma.bet4.update({
            where: {id: betId},
            data: updatedBetData,
        });

        revalidatePath('/');

        return {success: true};
    } catch (error) {
        if (error === null || error === undefined) {
            console.error('Ошибка в placeBet4: Неизвестная ошибка (error is null или undefined)');
        } else if (error instanceof Error) {
            console.error('Ошибка в placeBet4:', error.message);
            console.error('Стек ошибки:', error.stack);
        } else {
            console.error('Ошибка в placeBet4:', error);
        }

        throw new Error('Не удалось разместить ставку. Пожалуйста, попробуйте еще раз.');
    }
}

export async function closeBet4(betId: number, winnerId: number) {
    const session = await getUserSession();
    if (!session || session.role !== 'ADMIN') {
        throw new Error('У вас нет прав для выполнения этой операции');
    }

    try {
        if (winnerId === null || winnerId === undefined) {
            throw new Error("Не выбран победитель.");
        }

        await prisma.$transaction(async (prisma) => {
            // Обновляем статус ставки и получаем данные
            const bet = await prisma.bet4.update({
                where: {id: betId},
                data: {
                    status: 'CLOSED',
                    winnerId: winnerId,
                },
                include: {
                    participants: true,
                    player1: true,
                    player2: true,
                    player3: true,
                    player4: true,
                },
            });

            if (!bet) {
                throw new Error("Ставка не найдена");
            }

            // Создаем запись в BetCLOSED4
            const betClosed = await prisma.betCLOSED4.create({
                data: {
                    player1Id: bet.player1Id,
                    player2Id: bet.player2Id,
                    player3Id: bet.player3Id,
                    player4Id: bet.player4Id,
                    initBetPlayer1: bet.initBetPlayer1,
                    initBetPlayer2: bet.initBetPlayer2,
                    initBetPlayer3: bet.initBetPlayer3,
                    initBetPlayer4: bet.initBetPlayer4,
                    totalBetPlayer1: bet.totalBetPlayer1,
                    totalBetPlayer2: bet.totalBetPlayer2,
                    totalBetPlayer3: bet.totalBetPlayer3,
                    totalBetPlayer4: bet.totalBetPlayer4,
                    maxBetPlayer1: bet.maxBetPlayer1,
                    maxBetPlayer2: bet.maxBetPlayer2,
                    maxBetPlayer3: bet.maxBetPlayer3,
                    maxBetPlayer4: bet.maxBetPlayer4,
                    totalBetAmount: bet.totalBetAmount,
                    creatorId: bet.creatorId,
                    status: 'CLOSED',
                    categoryId: bet.categoryId,
                    productId: bet.productId,
                    productItemId: bet.productItemId,
                    winnerId: bet.winnerId,
                    margin: 0, // Инициализируем маржу
                    createdAt: bet.createdAt,
                    updatedAt: bet.updatedAt,
                    oddsBetPlayer1: bet.oddsBetPlayer1,
                    oddsBetPlayer2: bet.oddsBetPlayer2,
                    oddsBetPlayer3: bet.oddsBetPlayer3,
                    oddsBetPlayer4: bet.oddsBetPlayer4,
                    overlapPlayer1: 0, // Инициализируем overlapPlayer1
                    overlapPlayer2: 0, // Инициализируем overlapPlayer2
                    overlapPlayer3: 0, // Инициализируем overlapPlayer3
                    overlapPlayer4: 0, // Инициализируем overlapPlayer4
                    returnBetAmount: 0, // Инициализируем returnBetAmount
                    globalDataBetFund: 0, // Инициализируем globalDataBetFund
                },
            });

            // Определяем победителя
            const winningPlayer =
                bet.winnerId === bet.player1Id ? PlayerChoice.PLAYER1 :
                    bet.winnerId === bet.player2Id ? PlayerChoice.PLAYER2 :
                        bet.winnerId === bet.player3Id ? PlayerChoice.PLAYER3 : PlayerChoice.PLAYER4;

            // Перераспределяем баллы
            const allParticipants = await prisma.betParticipant4.findMany({
                where: {betId: betId},
            });

            let totalMargin = 0;
            let totalPointsToReturn = 0; // Сумма всех возвращаемых баллов
            let overlapPlayer1Sum = 0;
            let overlapPlayer2Sum = 0;
            let overlapPlayer3Sum = 0;
            let overlapPlayer4Sum = 0;

            // Сначала вычисляем общую прибыль победителей
            let totalProfit = 0;
            for (const participant of allParticipants) {
                if (participant.player === winningPlayer) {
                    totalProfit += participant.profit;
                }
            }

            // Получаем текущий betFund
            const globalData = await prisma.globalData.findUnique({
                where: {id: 1},
            });

            if (!globalData || globalData.betFund === null) {
                throw new Error('Данные фонда ставок не найдены или betFund равен null');
            }

            let betFundAdjustment = 0;

            // Теперь распределяем общую сумму ставок
            for (const participant of allParticipants) {
                let pointsToReturn = 0;
                let margin = 0;
                let overlap = participant.amount + participant.profit;

                if (participant.player === winningPlayer) {
                    // Рассчитываем долю от общей суммы
                    const share = participant.profit / totalProfit;
                    pointsToReturn = bet.totalBetAmount * share;

                    // Вычитаем маржу
                    margin = participant.profit * MARGIN;
                    pointsToReturn = participant.amount + participant.profit - margin;

                    totalMargin += margin;
                }

                // Обновляем баллы пользователя
                if (pointsToReturn > 0) {
                    await prisma.user.update({
                        where: {id: participant.userId},
                        data: {
                            points: {
                                increment: Math.floor(pointsToReturn * 100) / 100,
                            },
                        },
                    });
                }

                // Добавляем к общей сумме возвращаемых баллов
                totalPointsToReturn += pointsToReturn;

                // Суммируем overlap для каждого игрока
                if (participant.player === PlayerChoice.PLAYER1) {
                    overlapPlayer1Sum += overlap;
                } else if (participant.player === PlayerChoice.PLAYER2) {
                    overlapPlayer2Sum += overlap;
                } else if (participant.player === PlayerChoice.PLAYER3) {
                    overlapPlayer3Sum += overlap;
                } else if (participant.player === PlayerChoice.PLAYER4) {
                    overlapPlayer4Sum += overlap;
                }

                // Создаем запись в BetParticipantCLOSED4
                await prisma.betParticipantCLOSED4.create({
                    data: {
                        betCLOSED4Id: betClosed.id,
                        userId: participant.userId,
                        amount: participant.amount,
                        odds: participant.odds,
                        profit: participant.profit,
                        player: participant.player,
                        isWinner: participant.player === winningPlayer,
                        margin: Math.floor(margin * 100) / 100,
                        createdAt: participant.createdAt,
                        isCovered: "CLOSED", // Устанавливаем isCovered в "CLOSED"
                        overlap: Math.floor(overlap * 100) / 100,
                        return: Math.floor(pointsToReturn * 100) / 100,
                    },
                });
            }

            // Проверяем, что сумма всех возвращаемых баллов плюс маржа равна общей сумме ставок
            totalPointsToReturn += totalMargin;

            // Если сумма ставок недостаточна для выплат, берем из betFund
            if (totalPointsToReturn > bet.totalBetAmount) {
                const deficit = totalPointsToReturn - bet.totalBetAmount;
                if (globalData.betFund < deficit) {
                    throw new Error('Недостаточно средств в фонде для покрытия дефицита');
                }
                betFundAdjustment = -deficit;
                await prisma.globalData.update({
                    where: {id: 1},
                    data: {
                        betFund: {
                            decrement: deficit,
                        },
                    },
                });
            } else {
                // Если остались излишки, добавляем в betFund
                const surplus = bet.totalBetAmount - totalPointsToReturn;
                betFundAdjustment = surplus;
                await prisma.globalData.update({
                    where: {id: 1},
                    data: {
                        betFund: {
                            increment: surplus,
                        },
                    },
                });
            }

            // Обновляем поле margin, globalDataBetFund, overlapPlayer1, overlapPlayer2, overlapPlayer3 и overlapPlayer4 в BetCLOSED4
            await prisma.betCLOSED4.update({
                where: {id: betClosed.id},
                data: {
                    margin: Math.floor(totalMargin * 100) / 100,
                    returnBetAmount: Math.floor(totalPointsToReturn * 100) / 100, // Записываем сумму возвращенных баллов
                    globalDataBetFund: Math.floor(betFundAdjustment * 100) / 100, // Записываем изменение фонда
                    overlapPlayer1: Math.floor(overlapPlayer1Sum * 100) / 100,
                    overlapPlayer2: Math.floor(overlapPlayer2Sum * 100) / 100,
                    overlapPlayer3: Math.floor(overlapPlayer3Sum * 100) / 100,
                    overlapPlayer4: Math.floor(overlapPlayer4Sum * 100) / 100,
                },
            });

            // Удаляем участников и ставку
            await prisma.betParticipant4.deleteMany({
                where: {betId: betId},
            });

            await prisma.bet4.delete({
                where: {id: betId},
            });
        });

        // Ревалидация данных
        revalidatePath('/');
        revalidateTag('bets');
        revalidateTag('user');

        return {success: true, message: 'Ставка успешно закрыта'};
    } catch (error) {
        console.error("Ошибка при закрытии ставки:", error);

        if (error instanceof Error) {
            throw new Error(error.message);
        } else {
            throw new Error("Не удалось закрыть ставку.");
        }
    }
}// Функция для закрытия ставки на 4 игрока
export async function closeBetDraw4(betId: number) {
    const session = await getUserSession();
    if (!session || session.role !== 'ADMIN') {
        throw new Error('У вас нет прав для выполнения этой операции');
    }

    try {
        await prisma.$transaction(async (prisma) => {
            // Обновляем статус ставки на CLOSED и устанавливаем winnerId в null
            const bet = await prisma.bet4.update({
                where: {id: betId},
                data: {
                    status: 'CLOSED',
                    winnerId: null,
                },
                include: {
                    participants: true,
                },
            });

            if (!bet) {
                throw new Error("Ставка не найдена");
            }

            // Создаем запись в BetCLOSED4
            const betClosed = await prisma.betCLOSED4.create({
                data: {
                    player1Id: bet.player1Id,
                    player2Id: bet.player2Id,
                    player3Id: bet.player3Id,
                    player4Id: bet.player4Id,
                    initBetPlayer1: bet.initBetPlayer1,
                    initBetPlayer2: bet.initBetPlayer2,
                    initBetPlayer3: bet.initBetPlayer3,
                    initBetPlayer4: bet.initBetPlayer4,
                    totalBetPlayer1: bet.totalBetPlayer1,
                    totalBetPlayer2: bet.totalBetPlayer2,
                    totalBetPlayer3: bet.totalBetPlayer3,
                    totalBetPlayer4: bet.totalBetPlayer4,
                    maxBetPlayer1: bet.maxBetPlayer1,
                    maxBetPlayer2: bet.maxBetPlayer2,
                    maxBetPlayer3: bet.maxBetPlayer3,
                    maxBetPlayer4: bet.maxBetPlayer4,
                    totalBetAmount: bet.totalBetAmount,
                    creatorId: bet.creatorId,
                    status: 'CLOSED',
                    categoryId: bet.categoryId,
                    productId: bet.productId,
                    productItemId: bet.productItemId,
                    winnerId: null,
                    margin: 0,
                    createdAt: bet.createdAt,
                    updatedAt: bet.updatedAt,
                    oddsBetPlayer1: bet.oddsBetPlayer1,
                    oddsBetPlayer2: bet.oddsBetPlayer2,
                    oddsBetPlayer3: bet.oddsBetPlayer3,
                    oddsBetPlayer4: bet.oddsBetPlayer4,
                    overlapPlayer1: bet.overlapPlayer1,
                    overlapPlayer2: bet.overlapPlayer2,
                    overlapPlayer3: bet.overlapPlayer3,
                    overlapPlayer4: bet.overlapPlayer4,
                },
            });

            // Возвращаем сумму ставки всем участникам
            for (const participant of bet.participants) {
                await prisma.user.update({
                    where: {id: participant.userId},
                    data: {
                        points: {
                            increment: participant.amount,
                        },
                    },
                });

                // Создаем запись в BetParticipantCLOSED4
                await prisma.betParticipantCLOSED4.create({
                    data: {
                        betCLOSED4Id: betClosed.id,
                        userId: participant.userId,
                        amount: participant.amount,
                        odds: participant.odds,
                        profit: participant.profit,
                        player: participant.player,
                        isWinner: false, // Устанавливаем isWinner в "CLOSED"
                        margin: 0,
                        createdAt: participant.createdAt,
                        isCovered: "CLOSED", // Устанавливаем isCovered в "CLOSED"
                        overlap: participant.overlap,
                        return: participant.amount,
                    },
                });
            }

            // Удаляем участников и ставку
            await prisma.betParticipant4.deleteMany({
                where: {betId: betId},
            });

            await prisma.bet4.delete({
                where: {id: betId},
            });
        });

        // Обновляем глобальные данные

        revalidatePath('/');
        revalidateTag('bets');
        revalidateTag('user');

        return {success: true, message: 'Ставка успешно закрыта как ничья'};
    } catch (error) {
        console.error("Ошибка при закрытии ставки как ничья:", error);

        if (error instanceof Error) {
            throw new Error(error.message);
        } else {
            throw new Error("Не удалось закрыть ставку как ничья.");
        }
    }
}// ничья на 4 игрока
