
я хочу продавать свою программу JoyControl в интернете, хочу дать тестовое использование 2 часа в сутки, у меня есть сайт NextJS где программа может подключаться для авторизации, 
программа защищается Native AOT
с базой данных Postgres и next js для админки и регистрации с токенами 
программа будет продаваться на год или два, так что в Prisma нужно учитывать и даты, так же программа должна будет смотреть два поля по активации (админом если пользователь оплатил) и по дате, если дата просрочена то оповещаем клиента в C# и отключаем доступ

ДАвать пользователю 2 часа в сутки + периодических проверок JWT — это стандарт де-факто в 2025–2026 годах для десктопных приложений с онлайн-активацией. (что бы при новой установки нельзя было пользоваться копией программы, дополнительно в системе устанавливается единое время, возможно проверка времени через сервер, время по гринвичу?)
Клиент (C# WinForms/WPF)  
↓ HTTPS
↓ NEXT
↔ PostgreSQL Prisma
Admin + регистрация покупателей (Next.js 16 App Router)

| Место проверки                                      | Частота                                             | Что именно проверять                                      | Зачем именно здесь                                      |
|-----------------------------------------------------|-----------------------------------------------------|------------------------------------------------------------|---------------------------------------------------------|
| При запуске приложения                              | 1 раз при старте                                    | Обязательная проверка + загрузка токена                    | Блокирует запуск без валидного триала/лицензии          |
| Перед началом отправки данных в виртуальный контроллер (ViGEm ) | Каждый раз при активации читалки / каждые 30–60 сек | Быстрая проверка (только локально: expired?)               | Самое ценное место — здесь живёт монетизация            |
| В uiTimer (16–33 мс тик)                            | Каждый час                                          | Полная онлайн-проверка (запрос к серверу)                  | Обнаруживает подмену системного времени                 |
| При нажатии «SAVE», «ADD DEVICE», открытии настроек | 1 раз на действие                                   | Локальная проверка + иногда онлайн                         | Дополнительные точки «зацепа»                           |
| В критических классах (ControllerReader, SendReport и т.п.) | При каждом отправляемом отчёте                      | Минимальная проверка (токен не null + не expired)          | Очень тяжело вырезать все вызовы                        |


NEXT JS (серверные функции или как это будет реализовано в NEXT) будет просматривать время по гринвичу?


Сделай нужные поля в Prisma API Actions aдминка для админа чтобы давать пользователям доступ (когда админ дал доступ автоматически устанавливается и время)
так же админ мог просматривать сколько пользуется в тестовом 2 часа в сутки.
Давай для теста сделаем минимальную регистрацию в C# приложении и минимальный код доступ для старта и проверки всей логики с NEXT JS

https://ardu.live:444/profile страница регистрации на сайте


prisma
generator client {
provider = "prisma-client-js" // можно оставить так, или "prisma-client" — но для Next.js + Turbopack лучше "prisma-client-js"
}

datasource db {
provider = "postgresql"
// ← УДАЛИТЬ эти две строки полностью
// url = env("POSTGRES_PRISMA_URL")
// directUrl = env("POSTGRES_URL_NON_POOLING")
}

model User {
id                       Int         @id @default(autoincrement())
fullName                 String
email                    String      @unique
provider                 String?
providerId               String?
password                 String
role                     UserRole    @default(USER)
img                      String?
resetToken               String?
verificationToken        String? // Токен для подтверждения email
emailVerified            Boolean     @default(false) // Статус подтверждения email
verificationTokenExpires DateTime?
points                   Float       @default(1000)
createdAt                DateTime    @default(now())
updatedAt                DateTime    @updatedAt
insurances               Insurance[]
}

model Insurance {
id            Int             @id @default(autoincrement())
userId        Int?
fullName      String
birthDate     DateTime
phoneNumber   String
contacts      String[] // e.g., ["mobile", "telegram"]
plan          String // "50_year" or "150_4years"
paymentMethod String // e.g., "USDT (BSC BEP-20)"
proofImage    String? // e.g., "/bank/proof_123.jpg"
status        InsuranceStatus @default(PENDING)
createdAt     DateTime        @default(now())
updatedAt     DateTime        @updatedAt
user          User?           @relation(fields: [userId], references: [id])
}

enum InsuranceStatus {
PENDING
OK
}

model Category {
id       Int       @id @default(autoincrement())
name     String    @unique
products Product[]
}

model Product {
id         Int           @id @default(autoincrement())
name       String        @unique
categoryId Int
category   Category      @relation(fields: [categoryId], references: [id])
items      ProductItem[]
}

model Bank {
id          Int     @id @default(autoincrement())
type        String // Например: "crypto", "bank", "erip"
title       String // Заголовок раздела, например: "Криптовалюта", "Банковский перевод (IBAN / SWIFT)"
name        String // Название реквизита, например: "USDT (BSC BEP-20)"
value       String // Сам реквизит
description String? // Дополнительное описание (для ERIP инструкции)
order       Int // Порядок отображения
}

model ProductItem {
id        Int     @id @default(autoincrement())
name      String  @unique
productId Int
product   Product @relation(fields: [productId], references: [id])
}

enum UserRole {
USER
ADMIN
}


админ
app\(root)\admin\joy\page.tsx

import { getUserSession } from '@/components/lib/get-user-session';
import { redirect } from 'next/navigation';
import AdminJoy from "@/app/(root)/AdminJoy";

export default async function AdminJoyPage() {
const session = await getUserSession();

    // Проверяем, что пользователь — админ
    if (!session?.user || session.user.role !== 'ADMIN') {
        redirect('/profile'); // или '/' — куда хочешь перенаправить не-админа
    }

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl center font-bold mb-8">JoyControl</h1>
            <AdminJoy />
        </div>
    );
}

2 file
'use client';
import React, { useState, useEffect } from 'react';

export default function AdminJoy() {


    return (
        <div className="p-6 max-w-6xl mx-auto">

        </div>
    );
}



Замени простой токен на настоящий JWT (jose в Next.js + System.IdentityModel.Tokens.Jwt в C# — Native AOT поддерживает).
Добавь удаление лицензии, лицензия может быть только одна , добавь чтобы админ мог устанавливать дату лицензии год число и месяц


Добавь machine-id проверку (HWID) на сервере, чтобы копия на другом ПК не работала.
В production сделай токен на 30–60 мин + refresh.