generator client {
provider = "prisma-client-js"
}

datasource db {
provider = "postgresql"
url      = env("POSTGRES_PRISMA_URL")
}

model Product {
id              Int         @id @default(autoincrement())
name            String
description     String?
descriptionFull String?
price           Float?
stock           Int?
images          String[]
youTube         String[]?
createdAt       DateTime    @default(now())
updatedAt       DateTime    @updatedAt
cartItems       CartItem[]
orderItems      OrderItem[]
}

model User {
id        Int      @id @default(autoincrement())
email     String   @unique
name      String?
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
orders    Order[]
}

model CartItem {
id        Int      @id @default(autoincrement())
productId Int
product   Product  @relation(fields: [productId], references: [id])
quantity  Int
contact   String
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
}

model Order {
id         Int         @id @default(autoincrement())
userId     Int
user       User        @relation(fields: [userId], references: [id])
total      Float
createdAt  DateTime    @default(now())
updatedAt  DateTime    @updatedAt
orderItems OrderItem[]
}

model OrderItem {
id        Int      @id @default(autoincrement())
orderId   Int
order     Order    @relation(fields: [orderId], references: [id])
productId Int
product   Product  @relation(fields: [productId], references: [id])
quantity  Int
price     Float
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
}
в model Product { нужно добавить link String

чтобы искало не по [id] а по link , link должен быть уникальным (это заголовок) name
\\wsl.localhost\Ubuntu-24.04\home\pi\prod\it-startup-site-444\app\products\[id]\page.tsx
\\wsl.localhost\Ubuntu-24.04\home\pi\prod\it-startup-site-444\app\products\[id]
\\wsl.localhost\Ubuntu-24.04\home\pi\prod\it-startup-site-444\app\products
\\wsl.localhost\Ubuntu-24.04\home\pi\prod\it-startup-site-444\app

в link должны записываться только английские буквы, если name написан на русском то заменяем его в link
А (рус) ↔ A (англ)
Б (рус) ↔ B (англ)
В (рус) ↔ B (англ)
Г (рус) ↔ G (англ)
Д (рус) ↔ D (англ)
Е (рус) ↔ E (англ)
Ё (рус) ↔ Yo (англ)
Ж (рус) ↔ Zh (англ)
З (рус) ↔ Z (англ)
И (рус) ↔ I (англ)
Й (рус) ↔ Y (англ)
К (рус) ↔ K (англ)
Л (рус) ↔ L (англ)
М (рус) ↔ M (англ)
Н (рус) ↔ N (англ)
О (рус) ↔ O (engl)
П (рус) ↔ P (англ)
Р (рус) ↔ P (англ)
С (рус) ↔ S (англ)
Т (рус) ↔ T (англ)
У (рус) ↔ U (англ)
Ф (рус) ↔ F (англ)
Х (рус) ↔ H (англ)
Ц (рус) ↔ Ts (англ)
Ч (рус) ↔ Ch (англ)
Ш (рус) ↔ Sh (англ)
Щ (рус) ↔ Shch (англ)
Ъ (рус) ↔ b (англ) 
Ы (рус) ↔ bI (англ)
Ь (рус) ↔ b (англ)
Э (рус) ↔ E (англ)
Ю (рус) ↔ Yu (англ)
Я (рус) ↔ Ya (англ)
(русские маленькие буквы аналогично замене большим)
есл и в name есть пробел то заменяем его на -  (дефис)
если уже такой link имеется то добавляем -1 если имеется link-1 то добавляем link-2 и так далее

import { notFound } from 'next/navigation';
import ImageGallery from './ImageGallery';
import prisma from '../../../lib/prisma';
import OrderForm from './OrderForm';
import ReactMarkdown from 'react-markdown';

interface ProductPageProps {
params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
const { id } = await params;

    const product = await prisma.product.findUnique({
        where: { id: parseInt(id) },
    });

    if (!product) {
        notFound();
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
            {product.images && product.images.length > 0 ? (
                <ImageGallery images={product.images} productName={product.name} />
            ) : (
                <div className="w-full h-64 bg-gray-200 flex items-center justify-center mb-4 rounded">
                    <span className="text-gray-500">No images available</span>
                </div>
            )}
            <p className="mb-4">{product.description || 'No description'}</p>
            <div className="prose prose-lg max-w-none">
                <ReactMarkdown>
                    {product.descriptionFull || 'No description'}
                </ReactMarkdown>
            </div>
            <p className="text-lg font-bold mb-2">
                ${product.price !== null ? product.price : 'не указана'}
            </p>
            <p className="mb-4">На складе: {product.stock !== null ? product.stock : 'не указан'}</p>
            <OrderForm productId={product.id} stock={product.stock !== null ? product.stock : 0} />
        </div>
    );
}

'use server';

import prisma from '../lib/prisma';
import { revalidatePath } from 'next/cache';
import axios from 'axios';

const TELEGRAM_MESSAGE_INTERVAL = 5000; // Интервал между сообщениями (5 секунд)
let lastTelegramMessageTime = 0; // Время последней отправки

// Проверка токена бота
async function validateTelegramBotToken(token: string): Promise<boolean> {
try {
const response = await axios.get(`https://api.telegram.org/bot${token}/getMe`);
if (response.data.ok) {
console.log('Telegram bot validated:', response.data.result);
return true;
}
console.error('Invalid Telegram bot token:', response.data);
return false;
} catch (error: any) {
console.error('Error validating Telegram bot token:', error.response?.data || error.message);
return false;
}
}

async function sendTelegramMessage(message: string) {
const currentTime = Date.now();
if (currentTime - lastTelegramMessageTime < TELEGRAM_MESSAGE_INTERVAL) {
console.log('Отправка сообщения в Telegram ограничена по времени');
return;
}

    const token = process.env.T_TOKEN;
    const chatId = process.env.T_ID;
    console.log('Telegram env:', { token: !!token, chatId: !!chatId });

    if (!token || !chatId) {
        console.error('Невозможно отправить сообщение в Telegram: отсутствует токен или ID чата');
        return;
    }

    // Проверяем токен перед отправкой
    const isValidToken = await validateTelegramBotToken(token);
    if (!isValidToken) {
        console.error('Отправка сообщения невозможна: недействительный токен бота');
        return;
    }

    // Проверка, что chatId не совпадает с id бота
    if (chatId === '7861501595') {
        console.error('Ошибка: chatId совпадает с ID бота. Боты не могут отправлять сообщения самим себе.');
        return;
    }

    try {
        console.log('Sending Telegram message:', { url: `https://api.telegram.org/bot${token}/sendMessage`, chatId, message });
        const response = await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text: message,
        });
        console.log(`Сообщение в Telegram отправлено: ${message}`, response.data);
        lastTelegramMessageTime = currentTime;
    } catch (error: any) {
        console.error('Ошибка отправки сообщения в Telegram:', error.response?.data || error.message);
    }
}

export async function addToCart(formData: FormData) {
const productIdStr = formData.get('productId');
const quantityStr = formData.get('quantity');
const contactMethod = formData.get('contactMethod');
const contact = formData.get('contact');

    // Валидация входных данных
    if (!productIdStr || typeof productIdStr !== 'string') {
        throw new Error('Неверный productId');
    }
    if (!quantityStr || typeof quantityStr !== 'string') {
        throw new Error('Неверное количество');
    }
    if (!contactMethod || typeof contactMethod !== 'string' || !['Telegram', 'Phone', 'Email'].includes(contactMethod)) {
        throw new Error('Неверный способ связи');
    }
    if (!contact || typeof contact !== 'string' || !contact.trim()) {
        throw new Error('Контактная информация обязательна');
    }

    const productId = parseInt(productIdStr);
    const quantity = parseInt(quantityStr);

    if (isNaN(productId)) {
        throw new Error('ProductId должен быть числом');
    }
    if (isNaN(quantity) || quantity < 1) {
        throw new Error('Количество должно быть положительным числом');
    }


    // Проверка продукта и запаса
    const product = await prisma.product.findUnique({
        where: { id: productId },
    });
    if (!product) {
        throw new Error('Продукт не найден');
    }
    if (product.stock === null) {
        throw new Error('Запас продукта не указан');
    }
    if (quantity > product.stock) {
        throw new Error(`В наличии только ${product.stock} шт.`);
    }

    try {
        // Сохранение в CartItem
        await prisma.cartItem.create({
            data: {
                productId,
                quantity,
                contact: `${contactMethod}: ${contact}`,
            },
        });

        // Отправка сообщения в Telegram
        const totalPrice = product.price !== null ? (product.price * quantity).toFixed(2) : 'не указана';
        const message = `Новый заказ:\nПродукт: ${product.name}\nКоличество: ${quantity}\nКонтакт: ${contactMethod} (${contact})\nЦена: $${totalPrice}`;
        await sendTelegramMessage(message);

        revalidatePath('/cart');
    } catch (error) {
        console.error('Ошибка добавления в корзину:', error);
        throw new Error('Не удалось добавить товар в корзину');
    }
}

отвечай на русском
