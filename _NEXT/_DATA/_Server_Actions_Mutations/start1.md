# Server Actions and Mutations
# https://nextjs.org/docs/14/app/building-your-application/data-fetching/server-actions-and-mutations



```tsx
'use server'
 
export async function create() {}
```
```tsx
'use client'
 
import { create } from '@/app/actions'
 
export function Button() {
  return <button onClick={() => create()}>Create</button>
}
```

# Передача действий в качестве реквизита
# Вы также можете передать действие сервера клиентскому компоненту в качестве свойства:
```tsx
<ClientComponent updateItemAction={updateItem} />
```
```tsx
'use client'

export default function ClientComponent({
                                            updateItemAction,
                                        }: {
    updateItemAction: (formData: FormData) => void
}) {
    return <form action={updateItemAction}>{/* ... */}</form>
}
```


