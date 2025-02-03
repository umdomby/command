"use server";
import { redirect } from 'next/navigation';
import { getUserSession } from "@/components/lib/get-user-session";
import { prisma } from "@/prisma/prisma-client";
import {getIpAddress, referralUserIpAddress} from "@/app/actions";

export default async function ReferralPage({
                                               params,
                                               req
                                           }: {
    params: { id: string };
    req: any; // Убедитесь, что req имеет правильный тип
}) {
    const userId = Number(params.id);
    console.log("1111111111111111111111111 ");
    console.log(req);
    console.log('userId:', userId);

    if (isNaN(userId)) {
        console.error('Некорректный формат параметра id:', params.id);
        return redirect('/');
    }

    const session = await getUserSession();

    if (session) {
        return redirect('/');
    }

    // Получаем IP-адрес из заголовков запроса
    const ip = await getIpAddress(req);
    console.log('IP:', ip);

    // Проверяем, существует ли уже запись с таким IP-адресом для данного пользователя
    const referralIpExists = await prisma.referralUserIpAddress.findFirst({
        where: { referralIpAddress: ip }
    });
    console.log('referralIpExists:', referralIpExists);

    if (referralIpExists) {
        return redirect('/');
    }

    // Проверяем, существует ли уже запись с таким IP-адресом в истории входов пользователей
    const allUsers = await prisma.user.findMany();
    let ipExists = false;
    for (const user of allUsers) {
        if (user.loginHistory && Array.isArray(user.loginHistory)) {
            const hasIP = user.loginHistory.some((entry: any) => entry.ip === ip);
            if (hasIP) {
                ipExists = true;
                break;
            }
        }
    }

    if (ipExists) {
        return redirect('/');
    }

    // Сохраняем IP-адрес пользователя
    try {
        await referralUserIpAddress(userId, ip);
    } catch (error) {
        console.error('Ошибка при сохранении IP адреса:', error);
        throw new Error('Не удалось сохранить IP адрес');
    }

    return redirect('/');
}

