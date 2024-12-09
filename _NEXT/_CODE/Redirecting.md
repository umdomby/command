# Redirecting
# Перенаправление Если вы хотите перенаправить пользователя на другой маршрут после завершения действия сервера, 
# вы можете использовать API перенаправления. Перенаправление необходимо вызывать вне блока try/catch:
```tsx app/actions.ts
'use server'
 
import { redirect } from 'next/navigation'
import { revalidateTag } from 'next/cache'
 
export async function createPost(id: string) {
  try {
    // ...
  } catch (error) {
    // ...
  }
 
  revalidateTag('posts') // Update cached posts
  redirect(`/post/${id}`) // Navigate to the new post page
}
```