'use client';

import type { PutBlobResult } from '@vercel/blob';
import {useState, useRef, ChangeEvent, Suspense} from 'react';
import {createBlopAction} from '@/app/actions'
import toast from "react-hot-toast";
import {Container, LeftBlockLinkCategory} from "@/shared/components";


export default function AvatarUploadPage() {
    const inputFileRef = useRef<HTMLInputElement>(null);
    const [blob, setBlob] = useState<PutBlobResult | null>(null);

    return (
        <Container className="mt-10 pb-14">
            <div className="flex gap-[80px]">
                {/* Фильтрация */}
                <div className="w-[250px]">
                    <Suspense>
                        <LeftBlockLinkCategory />
                    </Suspense>
                </div>

                {/* Список товаров */}
                <div className="flex-1">
                    <div className="flex flex-col gap-16">
                        <form
                            onSubmit={async (event) => {
                                event.preventDefault();

                                if (!inputFileRef.current?.files) {
                                    throw new Error("No file selected");
                                }

                                const file = inputFileRef.current.files[0];

                                const response = await fetch(
                                    `/api/blop/up?filename=${file.name}`,
                                    {
                                        method: 'POST',
                                        body: file,
                                    },
                                );

                                const newBlob = (await response.json()) as PutBlobResult;
                                setBlob(newBlob);

                                // add database url
                                const result = await createBlopAction({ newBlob })

                                if (result?.error) {
                                    toast.error(result.error)
                                }

                            }}
                        >
                            <input name="file" ref={inputFileRef} type="file" required />
                            <button type="submit">Upload</button>
                        </form>
                        {blob && (
                            <div>
                                Blob url: <a href={blob.url}>{blob.url}</a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Container>

    );
}