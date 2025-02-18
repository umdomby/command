import { Nunito } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';


const nunito = Nunito({
    subsets: ['cyrillic'],
    variable: '--font-nunito',
    weight: ['400', '500', '600', '700', '800', '900'],
});

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (

        <html lang="en">
        {/*<html lang="en" suppressHydrationWarning>*/}
        <head>
            {/*<link data-rh="true" rel="icon" href="/logo.webp" />*/}
        </head>
        <body className={nunito.className}>
        <Providers>
            <main>
                {children}
            </main>
        </Providers>
        </body>
        </html>
    );
}
