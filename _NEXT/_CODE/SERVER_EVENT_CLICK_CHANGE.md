# API Reference
# https://nextjs.org/docs/app/api-reference

# Server Actions and Mutations
# https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations


# Event handlers onClick
```tsx
'use client'
 
import { incrementLike } from './actions'
import { useState } from 'react'
 
export default function LikeButton({ initialLikes }: { initialLikes: number }) {
  const [likes, setLikes] = useState(initialLikes)
 
  return (
    <>
      <p>Total Likes: {likes}</p>
      <button
        onClick={async () => {
          const updatedLikes = await incrementLike()
          setLikes(updatedLikes)
        }}
      >
        Like
      </button>
    </>
  )
}
```
# onChange app/like-button.tsx
```tsx app/ui/edit-post.tsx
'use client'
 
import { publishPost, saveDraft } from './actions'
 
export default function EditPost() {
  return (
    <form action={publishPost}>
      <textarea
        name="content"
        onChange={async (e) => {
          await saveDraft(e.target.value)
        }}
      />
      <button type="submit">Publish</button>
    </form>
  )
}
```




# Passing additional arguments || Пассинг аддитионал аргументс
```tsx app/invoices/page.tsx
'use client'
 
import { updateUser } from './actions'
 
export function UserProfile({ userId }: { userId: string }) {
  const updateUserWithId = updateUser.bind(null, userId)
 
  return (
    <form action={updateUserWithId}>
      <input type="text" name="name" />
      <button type="submit">Update User Name</button>
    </form>
  )
}
```

# Forms
```tsx app/client-component.tsx
export default function Page() {
  async function createInvoice(formData: FormData) {
    'use server'
 
    const rawFormData = {
      customerId: formData.get('customerId'),
      amount: formData.get('amount'),
      status: formData.get('status'),
    }
 
    // mutate data
    // revalidate cache
  }
 
  return <form action={createInvoice}>...</form>
}
```

# Server 
```tsx app/actions.ts
'use server'
 
export async function updateUser(userId: string, formData: FormData) {}
```


# Programmatic form submission You can trigger a form submission programmatically using the requestSubmit() method. 
# For example, when the user submits a form using the ⌘ + Enter keyboard shortcut, you can listen for the onKeyDown event:
# Программная отправка формы Вы можете запустить отправку формы программно, используя метод requestSubmit(). 
# Например, когда пользователь отправляет форму с помощью сочетания клавиш ⌘ + Enter, вы можете прослушивать событие onKeyDown:
```tsx
'use client'
 
export function Entry() {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.key === 'Enter' || e.key === 'NumpadEnter')
    ) {
      e.preventDefault()
      e.currentTarget.form?.requestSubmit()
    }
  }
 
  return (
    <div>
      <textarea name="entry" rows={20} required onKeyDown={handleKeyDown} />
    </div>
  )
}
```



```tsx
'use server'
 
import { redirect } from 'next/navigation'
 
export async function createUser(prevState: any, formData: FormData) {
  const res = await fetch('https://...')
  const json = await res.json()
 
  if (!res.ok) {
    return { message: 'Please enter a valid email' }
  }
 
  redirect('/dashboard')
}
```

