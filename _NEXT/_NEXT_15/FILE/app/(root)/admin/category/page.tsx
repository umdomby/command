'use server';
import { prisma } from '@/prisma/prisma-client';
import {AdminCategory} from '@/shared/components';
import { getUserSession } from '@/shared/lib/get-user-session';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const session = await getUserSession();


  if (!session) {
    return redirect('/not-auth');
  }

  const user = await prisma.user.findFirst({ where: { id: Number(session?.id) } });
  const category = await prisma.category.findMany();

  if (user && user.role === 'ADMIN') {
    return <AdminCategory data={user} category={category} />;
  }else{
    return redirect('/not-auth');
  }



}
