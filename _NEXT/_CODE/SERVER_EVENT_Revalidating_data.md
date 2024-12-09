# Revalidating data
# Вы можете повторно проверить кэш Next.js внутри действий сервера с помощью API revalidatePath:
```tsx app/actions.ts
'use server'
 
import { revalidatePath } from 'next/cache'
 
export async function createPost() {
  try {
    // ...
  } catch (error) {
    // ...
  }
 
  revalidatePath('/posts')
}
```

# Или сделайте недействительной определенную выборку данных с помощью тега кэша, используя revalidateTag:
```tsx
'use server'
 
import { revalidateTag } from 'next/cache'
 
export async function createPost() {
  try {
    // ...
  } catch (error) {
    // ...
  }
 
  revalidateTag('posts')
}
```