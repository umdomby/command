"use server";
import { prisma } from '@/prisma/prisma-client';
import { ProfileForm } from '@/components/profile-form';
import { getUserSession } from '@/components/lib/get-user-session';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const session = await getUserSession();

  if (!session) {
    return redirect('/not-auth');
  }

  const user = await prisma.user.findFirst({ where: { id: Number(session?.id) } });

  if (!user) {
    return redirect('/not-auth');
  }

  // Преобразуем loginHistory из строки в массив, если это необходимо
  if (user.loginHistory && typeof user.loginHistory === 'string') {
    user.loginHistory = JSON.parse(user.loginHistory);
  }

  return <ProfileForm data={user} />;
}
