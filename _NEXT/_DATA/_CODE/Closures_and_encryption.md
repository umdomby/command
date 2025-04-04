# Closures and encryption
# Определение Server Action внутри компонента создает замыкание, где действие имеет доступ к области действия внешней функции. 
# Например, действие publish имеет доступ к переменной publishVersion:
```tsx app/page.tsx
export default async function Page() {
  const publishVersion = await getLatestVersion();
 
  async function publish() {
    "use server";
    if (publishVersion !== await getLatestVersion()) {
      throw new Error('The version has changed since pressing publish');
    }
    ...
  }
 
  return (
    <form>
      <button formAction={publish}>Publish</button>
    </form>
  );
}
```
# Замыкания полезны, когда вам нужно захватить снимок данных (например, publishVersion) во время рендеринга,
# чтобы его можно было использовать позже при вызове действия. Однако для этого захваченные переменные отправляются 
# клиенту и обратно на сервер при вызове действия. Чтобы предотвратить раскрытие конфиденциальных данных клиенту, 
# Next.js автоматически шифрует закрытые переменные. Новый закрытый ключ генерируется для каждого действия каждый раз, 
# когда создается приложение Next.js. Это означает, что действия могут быть вызваны только для определенной сборки.
