import { AuthOptions, User } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/prisma/prisma-client';
import { compare, hashSync } from 'bcrypt';
import { UserRole } from '@prisma/client';

// Define custom User type to match Prisma and NextAuth
interface CustomUser {
    id: number; // Match Prisma's id: Int
    email: string;
    name: string;
    role: UserRole;
}

export const authOptions: AuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        }),
        GitHubProvider({
            clientId: process.env.GITHUB_ID || '',
            clientSecret: process.env.GITHUB_SECRET || '',
            profile(profile) {
                return {
                    id: profile.id, // Keep as number for consistency
                    name: profile.name || profile.login,
                    email: profile.email,
                    image: profile.avatar_url,
                    role: 'USER' as UserRole,
                };
            },
        }),
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'text' },
                password: { label: 'Password', type: 'password' },
                isVerifyEmail: { label: 'IsVerifyEmail', type: 'hidden' },
            },
            async authorize(credentials): Promise<CustomUser | null> {
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

                console.log('Authorize credentials:', { email: credentials.email, isVerifyEmail: credentials.isVerifyEmail });

                if (credentials.isVerifyEmail === 'true') {
                    if (!findUser.emailVerified) {
                        throw new Error('Email not verified.');
                    }
                    return {
                        id: findUser.id, // Use number directly
                        email: findUser.email,
                        name: findUser.fullName,
                        role: findUser.role || 'USER',
                    };
                }

                if (!findUser.emailVerified) {
                    throw new Error('Please verify your email before logging in.');
                }

                const isPasswordValid = await compare(credentials.password, findUser.password);

                if (!isPasswordValid) {
                    return null;
                }

                return {
                    id: findUser.id, // Use number directly
                    email: findUser.email,
                    name: findUser.fullName,
                    role: findUser.role || 'USER',
                };
            },
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: 'jwt',
    },
    callbacks: {
        async signIn({ user, account }) {
            try {
                if (account?.provider === 'credentials') {
                    return true;
                }

                if (!user.email) {
                    return false;
                }

                const findUser = await prisma.user.findFirst({
                    where: {
                        OR: [
                            { provider: account?.provider, providerId: account?.providerAccountId },
                            { email: user.email },
                        ],
                    },
                });

                if (findUser) {
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
                        emailVerified: true,
                        role: 'USER',
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
                token.id = findUser.id.toString(); // Convert number to string for JWT
                token.email = findUser.email;
                token.fullName = findUser.fullName;
                token.role = findUser.role || 'USER';
            }

            console.log('authOptions: jwt token:', token);
            return token;
        },
        async session({ session, token }) {
            if (session?.user && token.id) {
                session.user.id = token.id; // Keep as string to match JWT
                session.user.role = token.role || 'USER';
            }

            console.log('authOptions: session:', session);
            return session;
        },
    },
};