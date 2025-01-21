// hooks/useUser.ts
import useSWR from 'swr';
import { User } from '@prisma/client';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useUser(userId: number | null) {
    const { data, error, mutate } = useSWR<User>(userId ? `/api/user/${userId}` : null, fetcher);

    return {
        user: data,
        isLoading: !error && !data,
        isError: error,
        mutate,
    };
}