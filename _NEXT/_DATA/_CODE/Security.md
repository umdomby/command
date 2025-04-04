# По умолчанию, когда действие сервера создается и экспортируется, оно создает публичную конечную точку HTTP 
# и должно обрабатываться с теми же предположениями безопасности и проверками авторизации. Это означает, 
# что даже если действие сервера или служебная функция не импортируются где-либо еще в вашем коде, они все равно являются общедоступными.
```tsx
// app/actions.js
'use server'
 
// This action **is** used in our application, so Next.js
// will create a secure ID to allow the client to reference
// and call the Server Action.
export async function updateUserAction(formData) {}
 
// This action **is not** used in our application, so Next.js
// will automatically remove this code during `next build`
// and will not create a public endpoint.
export async function deleteUserAction(formData) {}
```