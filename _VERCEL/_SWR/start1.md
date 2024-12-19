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