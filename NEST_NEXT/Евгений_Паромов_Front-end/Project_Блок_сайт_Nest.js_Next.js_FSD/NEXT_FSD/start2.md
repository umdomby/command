# Problem CORS
# next.config.js : --> rewrites()
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3000/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
```
# test src/pages/home.tsx
```js
    useEffect (()=> {
    authControllerSignIn({email: "test@gmail.com", password:"1234"}).then(r => console.log())
})
```

$ npm i @tanstack/react-query
# create src/app/app-provider.tsx   save all cash app
```js
import { queryClient } from "@/shared/api/query-client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

export function AppProvider({ children }: { children?: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```
# src/shared/api/query-client.ts
```js
import { QueryClient } from "@tanstack/react-query";
export const queryClient = new QueryClient();
```
# app.tsx App Pages <AppProvider>
```js
    <AppProvider>
    <div className={inter.className}>
        <Component {...pageProps} />
    </div>
</AppProvider>
```
```js
//   const {data} = useQuery({
//     queryKey: ['session'],
//     queryFn: () => authControllerGetSessionInfo()
// })
```

# src/shared/ui







