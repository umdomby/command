# https://nextjs.org/docs/app/building-your-application/rendering/server-components#dynamic-rendering

### Стратегии рендеринга сервера
# Существует три подмножества серверного рендеринга: статический, динамический и потоковый.

{ cache: 'no-store' } 

Переход на динамический рендеринг
Во время рендеринга, если обнаружен динамический API или опция выборки{ cache: 'no-store' } ,
Next.js переключится на динамический рендеринг всего маршрута. 
В этой таблице суммировано, как динамические API и кэширование данных влияют на то, 
удет ли маршрут статически или динамически рендериться:

Динамические API	Данные	Маршрут
Нет	Кэшировано	Статически визуализированный
Да	Кэшировано	Динамически визуализированный
Нет	Не кэшировано	Динамически визуализированный
Да	Не кэшировано	Динамически визуализированный

https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming

```tsx
import { Suspense } from 'react'
import { PostFeed, Weather } from './Components'
 
export default function Posts() {
  return (
    <section>
      <Suspense fallback={<p>Loading feed...</p>}>
        <PostFeed />
      </Suspense>
      <Suspense fallback={<p>Loading weather...</p>}>
        <Weather />
      </Suspense>
    </section>
  )
}
```
            <Suspense>
            </Suspense>