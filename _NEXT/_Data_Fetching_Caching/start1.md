#
# https://youtu.be/EH1WsQGSrWU?t=502

# Data Fetching
# https://nextjs.org/docs/app/building-your-application/data-fetching



### SSG
# export const dynamicParams = true;
# export const revalidate = 10;
# OR -->
```tsx
next: {
    revalidate : 10
}
```

SSG --> getStaticParams  в app router api
SSG --> getStaticPaths   в page router api

# dynamicParams and revalidate
# https://youtu.be/EH1WsQGSrWU?t=749

# export const dynamic = 'force-dynamic'

```tsx
'use client'
 
import { useState, useEffect } from 'react'
 
export function Posts() {
  const [posts, setPosts] = useState(null)
 
  useEffect(() => {
    async function fetchPosts() {
      const res = await fetch('https://api.vercel.app/blog')
      const data = await res.json()
      setPosts(data)
    }
    fetchPosts()
  }, [])
 
  if (!posts) return <div>Loading...</div>
 
  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

? # export const dynamicParams = true;
? # export const revalidate = 10;
```tsx
import { unstable_cache } from 'next/cache'
import { db, posts } from '@/lib/db'
 
const getPosts = unstable_cache(
  async () => {
    return await db.select().from(posts)
  },
  ['posts'],
  { revalidate: 3600, tags: ['posts'] }
)
 
export default async function Page() {
  const allPosts = await getPosts()
 
  return (
    <ul>
      {allPosts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```


# Если вы не используете fetch, а вместо этого используете ORM или базу данных напрямую, 
# вы можете обернуть выборку данных функцией React cache. 
# Это устранит дубликаты и сделает только один запрос.


```tsx
import { cache } from 'react'
import { db, posts, eq } from '@/lib/db' // Example with Drizzle ORM
import { notFound } from 'next/navigation'
 
export const getPost = cache(async (id) => {
  const post = await db.query.posts.findFirst({
    where: eq(posts.id, parseInt(id)),
  })
 
  if (!post) notFound()
  return post
})
```

```tsx !!!
import { cache } from 'react'
import 'server-only'
 
export const preload = (id: string) => {
  void getItem(id)
}
 
export const getItem = cache(async (id: string) => {
  // ...
})
```