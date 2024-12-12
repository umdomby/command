# https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations#cookies

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