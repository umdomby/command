
# Authentication and authorization
# Вы должны убедиться, что пользователь имеет право выполнить действие. Например:
```tsx
'use server'
 
import { auth } from './lib'
 
export function addItem() {
  const { user } = auth()
  if (!user) {
    throw new Error('You must be signed in to perform this action')
  }
 
  // ...
}
```
