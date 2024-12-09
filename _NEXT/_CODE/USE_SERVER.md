# Директива use server обозначает функцию или файл, которые будут выполнены на стороне сервера. 
# Ее можно использовать в верхней части файла, чтобы указать, что все функции в файле являются серверными, 
# или встроить в верхнюю часть функции, чтобы обозначить функцию как функцию сервера. Это функция React.

```tsx
'use server'
import { db } from '@/lib/db' // Your database client
 
export async function createUser(data: { name: string; email: string }) {
  const user = await db.user.create({ data })
  return user
}
```

# ################### Using Server Functions in a Client Component
# Затем вы можете импортировать серверную функцию fetchUsers в клиентский компонент и выполнить ее на стороне клиента.
```tsx app/actions.ts
'use server'
import { db } from '@/lib/db' // Your database client
 
export async function fetchUsers() {
  const users = await db.user.findMany()
  return users
}
```

```tsx app/components/my-button.tsx
'use client'
import { fetchUsers } from '../actions'
 
export default function MyButton() {
  return <button onClick={() => fetchUsers()}>Fetch Users</button>
}
```

# ############## Using use server inline
# В следующем примере use server используется в верхней части функции, чтобы обозначить ее как функцию сервера:
```tsx app/page.tsx
import { db } from '@/lib/db' // Your database client

export default function UserList() {
    async function fetchUsers() {
        'use server'
        const users = await db.user.findMany()
        return users
    }

    return <button onClick={() => fetchUsers()}>Fetch Users</button>
}
```




# Authentication and authorization
```tsx app/actions.ts
'use server'
 
import { db } from '@/lib/db' // Your database client
import { authenticate } from '@/lib/auth' // Your authentication library
 
export async function createUser(
  data: { name: string; email: string },
  token: string
) {
  const user = authenticate(token)
  if (!user) {
    throw new Error('Unauthorized')
  }
  const newUser = await db.user.create({ data })
  return newUser
}
```

