"use server";
import { prisma } from '@/prisma/prisma-client';
import { Rating } from '@/components/rating';
import { Container } from "@/components/container";

export default async function RatingPage({ searchParams }: { searchParams: URLSearchParams }) {
    const page = parseInt(searchParams.get('page') || '1');
    const usersPerPage = 100;
    const skip = (page - 1) * usersPerPage;

    const users = await prisma.user.findMany({
        orderBy: {
            points: 'desc', // Sort by points in descending order
        },
        skip: skip,
        take: usersPerPage,
    });

    const totalUsers = await prisma.user.count();
    const totalPages = Math.ceil(totalUsers / usersPerPage);

    return (
        <Container className="flex flex-col my-10">
            <Rating users={users} currentPage={page} totalPages={totalPages} />
        </Container>
    );
}
