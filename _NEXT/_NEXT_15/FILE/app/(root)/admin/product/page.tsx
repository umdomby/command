'use server';
import { prisma } from '@/prisma/prisma-client';
import { AdminProduct } from '@/shared/components';
import { getUserSession } from '@/shared/lib/get-user-session';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const session = await getUserSession();


  if (!session) {
    return redirect('/not-auth');
  }

  const user = await prisma.user.findFirst({ where: { id: Number(session?.id) } });
  const category = await prisma.category.findMany();
  const product = await prisma.product.findMany();

  if (user && user.role === 'ADMIN') {
    return <AdminProduct data={user} category={category} product={product} />;
  }else{
    return redirect('/not-auth');
  }
}
