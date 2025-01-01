import {list} from "@vercel/blob"
import Image from "next/image";
import { DeleteButton } from "@/components/deleteButton"
import {Container, LeftBlockLinkCategory} from "@/shared/components";
import {Suspense} from "react";

export const dynamic = 'force-dynamic';
export default async function AllFilesPage() {
    const blops = await list();
    if(!blops){
        return <div>No found...</div>;
    }
    return (
        <div>
            <Container className="mt-10 pb-14">
                <div className="flex gap-[80px]">
                    {/* Фильтрация */}
                    <div className="w-[250px]">
                        <Suspense>
                            {/*<Filters />*/}
                            <LeftBlockLinkCategory/>
                        </Suspense>
                    </div>

                    <div className="flex-1">
                        <div className="flex flex-col gap-16">
                            {blops.blobs.map((blop, i) => (
                                <div key={blop.pathname + i}>
                                    {blop.pathname}
                                        <Image
                                            src={blop.url}
                                            alt={blop.pathname}
                                            width={700}
                                            height={500}
                                        />
                                    <DeleteButton url={blop.url} id={0} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Container>
        </div>
    )
}