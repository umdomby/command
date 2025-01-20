import { AuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import requestIp from 'request-ip';
import axios from 'axios';

import { prisma } from '@/prisma/prisma-client';
import { compare, hashSync } from 'bcrypt';
import { UserRole } from '@prisma/client';

// Функция для проверки VPN
async function checkVPN(ip: string): Promise<boolean> {
  try {
    const response = await axios.get(`https://v2.api.iphub.info/ip/${ip}`, {
      headers: {
        'X-Key': process.env.IPHUB_API_KEY!, // Ваш API-ключ от IPHub
      },
    });
    return response.data.block === 1; // Если block === 1, то это VPN/прокси
  } catch (error) {
    console.error('Ошибка при проверке VPN:', error);
    return false;
  }
}

// Функция для обновления истории входов
async function updateLoginHistory(userId: number, ip: string, isVPN: boolean) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('Пользователь не найден');
    }

    const loginHistory = user.loginHistory || [];
    const existingEntry = loginHistory.find((entry: any) => entry.ip === ip);

    if (existingEntry) {
      // Обновляем существующую запись
      existingEntry.lastLogin = new Date().toISOString();
      existingEntry.vpn = isVPN;
      existingEntry.loginCount += 1;
    } else {
      // Добавляем новую запись
      loginHistory.push({
        ip,
        lastLogin: new Date().toISOString(),
        vpn: isVPN,
        loginCount: 1,
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        loginHistory,
      },
    });

    console.log('Login history updated for user:', userId); // Логируем обновление истории
  } catch (error) {
    console.error('Ошибка при обновлении истории входов:', error);
    throw error;
  }
}

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials) {
          return null;
        }

        const values = {
          email: credentials.email,
        };

        const findUser = await prisma.user.findFirst({
          where: values,
        });

        if (!findUser) {
          return null;
        }

        const isPasswordValid = await compare(credentials.password, findUser.password);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: findUser.id,
          email: findUser.email,
          name: findUser.fullName,
          role: findUser.role,
        };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account, req }) {
      try {
        if (account?.provider === 'credentials') {
          return true;
        }

        if (!user.email) {
          return false;
        }

        const ip = requestIp.getClientIp(req); // Получаем IP-адрес
        const isVPN = await checkVPN(ip); // Проверяем VPN

        const findUser = await prisma.user.findFirst({
          where: {
            OR: [
              { provider: account?.provider, providerId: account?.providerAccountId },
              { email: user.email },
            ],
          },
        });

        if (findUser) {
          // Обновляем историю входов
          await updateLoginHistory(findUser.id, ip, isVPN);
          await prisma.user.update({
            where: {
              id: findUser.id,
            },
            data: {
              provider: account?.provider,
              providerId: account?.providerAccountId,
            },
          });
          return true;
        }

        await prisma.user.create({
          data: {
            email: user.email,
            fullName: user.name || 'User #' + user.id,
            password: hashSync(user.id.toString(), 10),
            provider: account?.provider,
            providerId: account?.providerAccountId,
            loginHistory: [
              {
                ip,
                lastLogin: new Date().toISOString(),
                vpn: isVPN,
                loginCount: 1,
              },
            ],
          },
        });

        return true;
      } catch (error) {
        console.error('Error [SIGNIN]', error);
        return false;
      }
    },
    async jwt({ token }) {
      if (!token.email) {
        return token;
      }

      const findUser = await prisma.user.findFirst({
        where: {
          email: token.email,
        },
      });

      if (findUser) {
        token.id = String(findUser.id);
        token.email = findUser.email;
        token.fullName = findUser.fullName;
        token.role = findUser.role;
      }

      return token;
    },
    session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }

      return session;
    },
  },
};
