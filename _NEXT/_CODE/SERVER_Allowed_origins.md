# Allowed origins (advanced)
# Поскольку действия сервера могут быть вызваны в элементе <form>, это открывает их для атак CSRF. 
# За кулисами действия сервера используют метод POST, и только этому методу HTTP разрешено вызывать их. 
# Это предотвращает большинство уязвимостей CSRF в современных браузерах, особенно с файлами cookie SameSite по умолчанию. 
# В качестве дополнительной защиты действия сервера в Next.js также сравнивают заголовок Origin с заголовком Host (или X-Forwarded-Host). 
# Если они не совпадают, запрос будет прерван. Другими словами, действия сервера могут быть вызваны только на том же хосте, что и страница, 
# на которой они размещены. Для больших приложений, использующих обратные прокси или многоуровневые архитектуры бэкэнда (где API сервера 
# отличается от домена производства), рекомендуется использовать параметр конфигурации serverActions.allowedOrigins, 
# чтобы указать список безопасных источников. Параметр принимает массив строк.

```tsx
/** @type {import('next').NextConfig} */
module.exports = {
  experimental: {
    serverActions: {
      allowedOrigins: ['my-proxy.com', '*.my-proxy.com'],
    },
  },
}
```