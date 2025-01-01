import { list } from '@vercel/blob';
import Image from "next/image";
import {Container, LeftBlockLinkCategory} from "@/shared/components";
import {Suspense} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {prisma} from "@/prisma/prisma-client";
import {DeleteButton} from "@/components/deleteButton";

export const dynamic = 'force-dynamic';
export default async function BlopListDataPage() {

    const post = await prisma.post.findMany();

    return (
        <Container className="mt-10 pb-14">
            <div className="flex gap-[80px]">
                {/* Фильтрация */}
                <div className="w-[250px]">
                    <Suspense>
                        {/*<Filters />*/}
                        <LeftBlockLinkCategory/>
                    </Suspense>
                </div>

                <div className='container'>
                    <h1 className='text-3xl font-bold'>Test</h1>
                    <ul className='mt-6 flex flex-col gap-2'>
                        {post.map(post => (
                            <li key={post.id}>
                                <div className='flex items-center justify-between'>
                                    <Link href={post.content} target='_blank'>
                                        <Image
                                            src={post.content}
                                            alt={post.content}
                                            width={800}
                                            height={600}
                                        >
                                        </Image>
                                    </Link>
                                    <DeleteButton url={post.content} id={post.id} />
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </Container>
    );
}

