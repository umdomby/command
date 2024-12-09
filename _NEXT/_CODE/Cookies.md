# Cookies https://nextjs.org/docs/app/api-reference/functions/cookies#deleting-cookies
# Вы можете получать, устанавливать и удалять файлы cookie внутри действия сервера, используя API файлов cookie:
```tsx app/actions.ts
'use server'
 
import { cookies } from 'next/headers'
 
export async function exampleAction() {
  const cookieStore = await cookies()
 
  // Get cookie
  cookieStore.get('name')?.value
 
  // Set cookie
  cookieStore.set('name', 'Delba')
 
  // Delete cookie
  cookieStore.delete('name')
}
```

# Deleting cookies
```tsx
'use server'
 
import { cookies } from 'next/headers'
 
export async function delete(data) {
  (await cookies()).delete('name')
}
```

# Установка нового cookie-файла с тем же именем и пустым значением:
```tsx
'use server'
 
import { cookies } from 'next/headers'
 
export async function delete(data) {
  (await cookies()).set('name', '')
}
```

# Установка maxAge на 0 приведет к немедленному прекращению действия cookie. maxAge принимает значение в секундах.
```tsx
'use server'
 
import { cookies } from 'next/headers'
 
export async function delete(data) {
  (await cookies()).set('name', 'value', { maxAge: 0 })
}
```