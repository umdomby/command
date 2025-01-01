# <Form>

https://nextjs.org/docs/app/api-reference/components/form#mutations-with-server-actions
# Mutations with Server Actions
```tsx /app/posts/create/page.tsx
import Form from 'next/form'
import { createPost } from '@/posts/actions'
 
export default function Page() {
  return (
    <Form action={createPost}>
      <input name="title" />
      {/* ... */}
      <button type="submit">Create Post</button>
    </Form>
  )
}
```
```tsx /app/posts/actions.ts Вы можете выполнять мутации, передавая функцию в свойство действия.
'use server'
import { redirect } from 'next/navigation'
 
export async function createPost(formData: FormData) {
  // Create a new post
  // ...
 
  // Redirect to the new post
  redirect(`/posts/${data.id}`)
}
```

```tsx /app/posts/[id]/page.tsx Затем на новой странице вы можете получить данные, используя свойство params:
import { getPost } from '@/posts/data'
 
export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const data = await getPost((await params).id)
 
  return (
    <div>
      <h1>{data.title}</h1>
      {/* ... */}
    </div>
  )
}
```



https://nextjs.org/docs/app/api-reference/components/form
```tsx /app/ui/search.tsx
import Form from 'next/form'
 
export default function Page() {
  return (
    <Form action="/search">
      {/* On submission, the input value will be appended to 
          the URL, e.g. /search?query=abc */}
      <input name="query" />
      <button type="submit">Submit</button>
    </Form>
  )
}
```

###
```tsx /app/page.tsx
import Form from 'next/form'
 
export default function Page() {
  return (
    <Form action="/search">
      <input name="query" />
      <button type="submit">Submit</button>
    </Form>
  )
}
```
```tsx /app/search/page.tsx
import { getSearchResults } from '@/lib/search'
 
export default async function SearchPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const results = await getSearchResults(searchParams.query)
 
  return <div>...</div>
}
```

