\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\app\(root)\layout.tsx
import { Header } from '@/components/header';
import type { Metadata } from 'next';
import React, { Suspense } from 'react';

export const metadata: Metadata = {
title: 'ARDU live',
};

export const dynamic = 'force-dynamic'; // Отключаем SSG


export default function HomeLayout({ children }: { children: React.ReactNode }) {
return (
<main className="min-h-screen">
<Suspense>
<Header />
</Suspense>
{children}
</main>
);
}

нужно добавить элемент <Bottom />
docker-ardu\components\bottom.tsx

этот элемент нужен внизу сайта, для общей информации, стиль - серый фон - белые буквы
по центру нужно сделать ссылку - контакты и реквизиты
\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\app\(root)\contacts\page.tsx
компонент этой страницы
\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\components\contacts\contact.tsx

Telegram
@ardulive
https://t.me/ardulive
https://t.me/arduliveinfo
https://t.me/ardulivechat
 
показать данные

USTD    BSC (BEP20)   0x51470b98c8737f14958231cb27491b28c5702c13  - по клику на код копируется в буфер
USTD    ETH (ERC20)   0x51470b98c8737f14958231cb27491b28c5702c13  - по клику на код копируется в буфер
USTD    TRX (TRC20)   TGptXxwwP6YjVfhkrYTxc4oHSYmwaK2i4S          - по клику на код копируется в буфер
BTC                   19hCv645WrUthCNUWb4ncBdHVu6iLhZVow          - по клику на код копируется в буфер

IBAN + SWIFT                
BY25TECN30140000000GR0021881   - по клику на код копируется в буфер           
TECNBY22                       - по клику на код копируется в буфер                     
SIARHEI KUNTSEVICH             - по клику на код копируется в буфер             
220141 Belarus Minsk str.Shugaeva 17-3-20 - по клику на код копируется в буфер
Polis ARDU Live - по клику на код копируется в буфер

ERIP Payment (Belarus)
Payment category: Banking, Financial Services → Banks, Non-Bank Credit and Financial Organizations → Technobank → Card Top-Up GR21881 (по клику на код копируется в буфер GR21881)
To top up your Technobank card (GR21881) from abroad via ERIP:

1. Open any Belarusian bank app or go to https://erip.paritetbank.by (ERIP without borders)
2. Navigate to: Payments > Banking, Financial Services > Banks & Financial Organizations > Technobank > Card Top-Up GR21881
3. Enter card number: GR21881
4. Specify amount in BYN
5. Pay with your Visa/Mastercard from any country
   Funds arrive instantly. Commission ~5%.

ЕРИП-РАСЧЕТ
Платежи - Банковские, финансовые услуги - Банки, НКФО – Технобанк – Пополнение карты GR21881


дай все нужные элементы

