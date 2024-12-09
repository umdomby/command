https://vercel.com/docs/storage/vercel-blob/using-blob-sdk

https://vercel.com/docs/storage/vercel-blob

https://vercel.com/docs/storage/vercel-blob/server-upload

https://www.youtube.com/watch?v=kQfwNwpDiPQ

# Delete a blob
# del(url, options);
```jsx
import { del } from '@vercel/blob';
 
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const urlToDelete = searchParams.get('url') as string;
  await del(urlToDelete);
 
  return new Response();
}
```


https://vercel.com/docs/storage/vercel-blob/server-upload
# https://youtu.be/-HSFV9ILFuk  Hamed Bahram --> How to use Vercel blob storage in NextJs 

# app/components/form.tsx
```tsx
import { put } from '@vercel/blob';
import { revalidatePath } from 'next/cache';
 
export async function Form() {
  async function uploadImage(formData: FormData) {
    'use server';
    const imageFile = formData.get('image') as File;
    const blob = await put(imageFile.name, imageFile, {
      access: 'public',
    });
    revalidatePath('/');
    return blob;
  }
 
  return (
    <form action={uploadImage}>
      <label htmlFor="image">Image</label>
      <input type="file" id="image" name="image" required />
      <button>Upload</button>
    </form>
  );
}
```

# next.config.js
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'g7ttfzigvkyrt3gn.public.blob.vercel-storage.com',
        port: '',
      },
    ],
  },
};
 
module.exports = nextConfig;
```

# app/components/images.tsx
```tsx
import { list } from '@vercel/blob';
import Image from 'next/image';
 
export async function Images() {
  async function allImages() {
    const blobs = await list();
    return blobs;
  }
  const images = await allImages();
 
  return (
    <section>
      {images.blobs.map((image) => (
        <Image
          priority
          key={image.pathname}
          src={image.url}
          alt="Image"
          width={200}
          height={200}
        />
      ))}
    </section>
  );
}
```

##################### Upload a file using a server upload page and route ####################

# src/app/avatar/upload/page.tsx
```tsx
'use client';
 
import type { PutBlobResult } from '@vercel/blob';
import { useState, useRef } from 'react';
 
export default function AvatarUploadPage() {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [blob, setBlob] = useState<PutBlobResult | null>(null);
  return (
    <>
      <h1>Upload Your Avatar</h1>
 
      <form
        onSubmit={async (event) => {
          event.preventDefault();
 
          if (!inputFileRef.current?.files) {
            throw new Error('No file selected');
          }
 
          const file = inputFileRef.current.files[0];
 
          const response = await fetch(
            `/api/avatar/upload?filename=${file.name}`,
            {
              method: 'POST',
              body: file,
            },
          );
 
          const newBlob = (await response.json()) as PutBlobResult;
 
          setBlob(newBlob);
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
    </>
  );
}
```
# src/app/api/avatar/upload/route.ts
```tsx
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
 
export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');
 
  const blob = await put(filename, request.body, {
    access: 'public',
  });
 
  return NextResponse.json(blob);
}
```

https://github.com/HamedBahram/next-novel
