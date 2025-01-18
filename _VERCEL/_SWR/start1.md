# SWR
# https://swr.vercel.app/ru
```tsx
import useSWR from 'swr'
 
function Profile() {
  const { data, error, isLoading } = useSWR('/api/user', fetcher)
 
  if (error) return <div>ошибка загрузки</div>
  if (isLoading) return <div>загрузка...</div>
  return <div>привет, {data.name}!</div>
}
```

https://swr.vercel.app/ru/docs/with-nextjs
```tsx
import useSWR from 'swr' // ❌ Недоступно в серверных компонентах
```
```
Клиентские компоненты
Вы можете пометить свои компоненты директивой 'use client' или импортировать SWR из клиентских компонентов. 
Оба способа позволят вам использовать хуки получения данных SWR на стороне клиента.
```
```tsx
'use client'
import useSWR from 'swr'
export default function Page() {
  const { data } = useSWR('/api/user', fetcher)
  return <h1>{data.name}</h1>
}
```
```tsx
'use client';
import { SWRConfig } from 'swr'
export const SWRProvider = ({ children }) => {
  return <SWRConfig>{children}</SWRConfig>
};
```
SWRConfig может предоставить глобальные конфигурации (опции) для всех SWR хуков.
https://swr.vercel.app/ru/docs/global-configuration
https://swr.vercel.app/ru/docs/api#опции