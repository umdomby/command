# это действие сервера будет вызвано после добавления новой записи. Независимо от того, 
# как вы извлекаете данные в компоненте сервера, используя fetch или подключаясь к базе данных, 
# это очистит кэш для всего маршрута и позволит компоненту сервера извлекать свежие данные.

# https://youtu.be/bRnxUUxkogU
```tsx
'use server'
 
import { revalidatePath } from 'next/cache'
 
export async function createPost() {
  // Invalidate the /posts route in the cache
  revalidatePath('/posts')
}
```