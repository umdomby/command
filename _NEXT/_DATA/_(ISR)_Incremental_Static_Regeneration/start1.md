# 213.184.249.66

# Incremental Static Regeneration (ISR)
# https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration


// Next.js will invalidate the cache when a
// request comes in, at most once every 60 seconds.
# export const revalidate = 60  or             <Suspense> </Suspense>

```tsx
export const dynamic = 'force-dynamic'; // static by default, unless reading the request
 
export function GET(request: Request) {
  return new Response(`Hello from ${process.env.VERCEL_REGION}`);
}
```




### revalidatePath
# Например, это действие сервера будет вызвано после добавления нового поста. 
# Независимо от того, как вы извлекаете данные в компоненте сервера, используя выборку или подключение к базе данных, 
# это очистит кэш для всего маршрута и позволит компоненту сервера извлечь свежие данные.
```tsx
'use server'

import { revalidatePath } from 'next/cache'

export async function createPost() {
    // Invalidate the /posts route in the cache
    revalidatePath('/posts')
}
```

### revalidateTag
# Для большинства случаев использования предпочтительнее перепроверка целых путей. 
# Если вам нужен более детальный контроль, вы можете использовать функцию revalidateTag. 
# Например, вы можете пометить отдельные вызовы выборки:
# On-demand revalidation with revalidateTag
# https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration#on-demand-revalidation-with-revalidatetag
```tsx app/blog/page.tsx
export default async function Page() {
  const data = await fetch('https://api.vercel.app/blog', {
    next: { tags: ['posts'] },
  })
  const posts = await data.json()
  // ...
}
```
# OR --> ORM or connecting to a database
```tsx
import { unstable_cache } from 'next/cache'
import { db, posts } from '@/lib/db'
 
const getCachedPosts = unstable_cache(
  async () => {
    return await db.select().from(posts)
  },
  ['posts'],
  { revalidate: 3600, tags: ['posts'] }
)
 
export default async function Page() {
  const posts = getCachedPosts()
  // ...
}
```
```tsx app/actions.ts
'use server'
 
import { revalidateTag } from 'next/cache'
 
export async function createPost() {
  // Invalidate all data tagged with 'posts' in the cache
  revalidateTag('posts')
}
```