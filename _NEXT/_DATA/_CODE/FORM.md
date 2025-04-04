# <Form>
# Компонент <Form> расширяет элемент HTML <form>, чтобы обеспечить предварительную выборку пользовательского интерфейса загрузки, 
# навигацию на стороне клиента при отправке и прогрессивное улучшение. Он полезен для форм, которые обновляют параметры поиска URL, 
# поскольку он сокращает шаблонный код, необходимый для достижения вышеуказанного.
```tsx /app/ui/search.tsx
import Form from 'next/form'

export default function Page() {
    return (
        <Form action="/search">
            {/* On submission, the input value will be appended to 
          the URL, e.g. /search?query=abc */}
            <input name="query" />
            <button type="submit">Submit</button>
        </Form>
    )
}
```
# На странице результатов вы можете получить доступ к запросу с помощью свойства searchParams page.js 
# и использовать его для извлечения данных из внешнего источника.
```tsx /app/search/page.tsx
import { getSearchResults } from '@/lib/search'
 
export default async function SearchPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const results = await getSearchResults(searchParams.query)
 
  return <div>...</div>
}
```

# /app/search/loading.tsx
```tsx
export default function Loading() {
  return <div>Loading...</div>
}
```

#  Сначала создайте компонент, который отображает состояние загрузки, когда форма находится в состоянии ожидания:
```tsx /app/ui/search-button.tsx
'use client'
import { useFormStatus } from 'react-dom'
 
export default function SearchButton() {
  const status = useFormStatus()
  return (
    <button type="submit">{status.pending ? 'Searching...' : 'Search'}</button>
  )
}
```
# Затем обновите страницу формы поиска, чтобы использовать компонент SearchButton:
```tsx /app/page.tsx
import Form from 'next/form'
import { SearchButton } from '@/ui/search-button'
 
export default function Page() {
  return (
    <Form action="/search">
      <input name="query" />
      <SearchButton />
    </Form>
  )
}
```


# Мутации с действиями сервера Вы можете выполнять мутации, передавая функцию в свойство действия.
```tsx /app/posts/create/page.tsx
import Form from 'next/form'
import { createPost } from '@/posts/actions'

export default function Page() {
    return (
        <Form action={createPost}>
            <input name="title"/>
            {/* ... */}
            <button type="submit">Create Post</button>
        </Form>
    )
}
```
# После мутации обычно перенаправляют на новый ресурс. 
# Вы можете использовать функцию перенаправления из next/navigation, чтобы перейти на новую страницу поста.
```tsx /app/posts/actions.ts
'use server'
import { redirect } from 'next/navigation'
 
export async function createPost(formData: FormData) {
  // Create a new post
  // ...
 
  // Redirect to the new post
  redirect(`/posts/${data.id}`)
}
```
# Затем на новой странице вы можете получить данные, используя свойство params:
```tsx
import { getPost } from '@/posts/data'
 
export default async function PostPage( {params,}: { params: Promise<{ id: string }> }) {
  const data = await getPost((await params).id)
 
  return (
    <div>
      <h1>{data.title}</h1>
      {/* ... */}
    </div>
  )
}
```

