# Error Handling
```tsx app/actions.ts
'use server'

export async function createTodo(prevState: any, formData: FormData) {
    try {
        // Mutate data
    } catch (e) {
        throw new Error('Failed to create task')
    }
}
```