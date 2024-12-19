// app\actions.ts

'use server';

import { prisma } from '@/prisma/prisma-client';

export async function updateCategory(data) {
  try {

    console.log(data.id + ' ' + data.name);

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



