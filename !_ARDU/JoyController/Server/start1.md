
я хочу продавать свою программу в интернете, хочу дать тестовое использование 2 часа в сутки, у меня есть сайт NextJS где программа может подключаться для авторизации, сделать чтобы защитить программу от взлома
лучше что бесплатно и на сервере GO go 1.24 с базой данных Postgres и next js для админки и регистрации с токенами в таком проекте обойтись без сервера Go а использовать только API сайта Next и серверные функции actions?

програма будет продаваться на год или два, так что в Prisma нужно учитывать и даты, так же программа должна будет чекать по двум полям по активации и по дате, если дата просрочена то оповещаем клиента в C# 

2 часа в сутки + периодических проверок JWT — это стандарт де-факто в 2025–2026 годах для десктопных приложений с онлайн-активацией. (что бы при новой установки нельзя было пользоваться копией программы, дополнительно в системе устанавливается единое время, возможно проверка времени через сервер, время по гринвичу?)
Клиент (C# WinForms/WPF)  
↓ HTTPS (POST /api/trial, /api/validate)
Backend (Go 1.24 + Gin / Echo / chi)  
↔ PostgreSQL Prisma
Admin + регистрация покупателей (Next.js 15 App Router)  
→ /api/... (Next.js API routes или тот же Go бэкенд) можно в таком проекте обойтись без сервера Go а использовать только API сайта Next и серверные функции actions?

Go + JWT + PostgreSQL + периодические чеки каждые 5–15 мин → лучший баланс

| Место проверки                                      | Частота                                             | Что именно проверять                                      | Зачем именно здесь                                      |
|-----------------------------------------------------|-----------------------------------------------------|------------------------------------------------------------|---------------------------------------------------------|
| При запуске приложения                              | 1 раз при старте                                    | Обязательная проверка + загрузка токена                    | Блокирует запуск без валидного триала/лицензии          |
| Перед началом отправки данных в виртуальный контроллер (ViGEm ) | Каждый раз при активации читалки / каждые 30–60 сек | Быстрая проверка (только локально: expired?)               | Самое ценное место — здесь живёт монетизация            |
| В uiTimer (16–33 мс тик)                            | Каждый час                                          | Полная онлайн-проверка (запрос к серверу)                  | Обнаруживает подмену системного времени                 |
| При нажатии «SAVE», «ADD DEVICE», открытии настроек | 1 раз на действие                                   | Локальная проверка + иногда онлайн                         | Дополнительные точки «зацепа»                           |
| В критических классах (ControllerReader, SendReport и т.п.) | При каждом отправляемом отчёте                      | Минимальная проверка (токен не null + не expired)          | Очень тяжело вырезать все вызовы                        |


go 1.24.6 - сервер го будет просматривать время по гринвичу?
GO c api сайта для проверки



моя prisma
generator client {
provider = "prisma-client-js"
}

datasource db {
provider  = "postgresql"
url       = env("POSTGRES_PRISMA_URL")
directUrl = env("POSTGRES_URL_NON_POOLING")
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

\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\components\profile\profile-admin.tsx

для начала, давай сделаем регистрацию и вход в приложении C# - добавь сразу нужные поля в Prisma и команды как обновить базу без ее сноса
как это сделаем? вывести в приложении кнопки регистрация и вход, регистрация перенаправляет его на сайт для регистрации? на сайте он регистрируется
кнопка вход выводит два поля для почты и пароля, через сервер GO он логинится в приложении - так лучше? Сделай пользователю 7 неудчных попыток, где он 30 минут не может ввести пароль - с оповещением, сделай окна для этого.


\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\app\api\auth\[...nextauth]\route.ts
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import { authOptions } from '@/components/constants/auth-options';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\components\modals\auth-modal\forms\register-form.tsx
\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\components\modals\auth-modal\forms\login-form.tsx


        server {
            listen 80;
            listen [::]:80;
            server_name ardu.live www.ardu.live;
            return 301 https://ardu.live$request_uri;
        }

        # HTTPS redirect from www to non-www
        server {
            listen 444 ssl;
            listen [::]:444 ssl;
            server_name www.ardu.live;
            http2 on;

            ssl_certificate /etc/letsencrypt/live/ardu.live/fullchain.pem;
            ssl_certificate_key /etc/letsencrypt/live/ardu.live/privkey.pem;

            return 301 https://ardu.live$request_uri;
        }

        # Main HTTPS server
        server {
            listen 444 ssl;
            listen [::]:444 ssl;
            server_name ardu.live;
            http2 on;

            # SSL configuration
            ssl_certificate /etc/letsencrypt/live/ardu.live/fullchain.pem;
            ssl_certificate_key /etc/letsencrypt/live/ardu.live/privkey.pem;
            ssl_protocols TLSv1.2 TLSv1.3;
            ssl_prefer_server_ciphers on;
            ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';

            # Security headers
            add_header X-Frame-Options "SAMEORIGIN" always;
            add_header X-Content-Type-Options "nosniff" always;
            add_header X-XSS-Protection "1; mode=block" always;
            add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
            add_header Referrer-Policy "strict-origin-when-cross-origin" always;

            # SSL session cache
            ssl_session_cache shared:SSL:10m;
            ssl_session_timeout 10m;
            ssl_session_tickets off;

            # Root location
            location / {
                proxy_pass http://192.168.1.121:3002;
                proxy_http_version 1.1;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
                proxy_set_header X-Forwarded-Host $host:$server_port; # Добавьте порт
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection "upgrade";
                proxy_set_header Accept-Encoding ""; # Отключение сжатия для Server Actions
                proxy_buffering off;
                proxy_read_timeout 3600;
                proxy_cache_bypass $http_upgrade;
            }
            
            
            location /joy {
                proxy_pass http://192.168.1.121:8088;
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection "upgrade";
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_read_timeout 86400;
                proxy_send_timeout 86400;
                proxy_connect_timeout 86400;
    
                if ($request_method = 'OPTIONS') {
                    add_header 'Access-Control-Allow-Origin' 'https://ardu.live';
                    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
                    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
                    add_header 'Access-Control-Max-Age' 1728000;
                    add_header 'Content-Length' 0;
                    return 204;
                }
                proxy_buffering off;
                add_header 'Access-Control-Allow-Origin' 'https://ardu.live' always;
            }
        }

сделай все что нужно, это наверное C# сервер GO дай prisma с учетом того что программа должна будет чекать поле из базы данных разрешено использование или нет, выведи информацию - триал или оплата и когда была активация. и когда заканчивается активация. я писал выше про проверку, вышло время у клиента использование программы или нет.
дай все что нужно и go 1.24  чтобы не гадить Form1 и чтобы было проще для меня сделай может отдельный класс в C# 