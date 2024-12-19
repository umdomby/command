# easydev 
# Next.js 14 App Router #9 - Кэширование 
# https://youtu.be/f0sP3b29C6w

# Caching in Next.js
https://nextjs.org/docs/app/building-your-application/caching

# Например, если вам нужно использовать одни и те же данные по маршруту (например, в макете, странице и нескольких компонентах), 
# вам не нужно извлекать данные из верхней части дерева и пересылать props между компонентами. Вместо этого вы можете извлекать 
# данные из компонентов, которым они нужны, не беспокоясь о последствиях для производительности при выполнении нескольких 
# запросов по сети для одних и тех же данных.

```tsx app/example.tsx
async function getItem() {
  // The `fetch` function is automatically memoized and the result is cached
  // Функция `fetch` автоматически запоминается, а результат кэшируется
  const res = await fetch('https://.../item/1')
  return res.json()
}
 
// This function is called twice, but only executed the first time
// Эта функция вызывается дважды, но выполняется только в первый раз
const item = await getItem() // cache MISS
 
// The second call could be anywhere in your route
// Второй вызов может быть в любом месте вашего маршрута
const item = await getItem() // cache HIT
```

Opting out
# If you do not want to cache the response from fetch, you can do the following:
# Если вы не хотите кэшировать ответ от fetch, вы можете сделать следующее:
```tsx
let data = await fetch('https://api.vercel.app/blog', { cache: 'no-store' })
```
```tsx
// Revalidate at most after 1 hour
fetch(`https://...`, { next: { revalidate: 3600 } })
```

# // Revalidate at most after 1 hour
# fetch(`https://...`, { next: { revalidate: 3600 } })


##### ####
# // Cache data with a tag
```tsx
    fetch(`https://...`, { next: { tags: ['a', 'b', 'c'] } })
     // Revalidate entries with a specific tag
    revalidateTag('a')
```

// We'll prerender only the params from `generateStaticParams` at build time.
// If a request comes in for a path that hasn't been generated,
// Next.js will server-render the page on-demand.
# export const dynamicParams = true // or false, to 404 on unknown paths

# , { cache: 'no-store' })
