1. Настройка Prisma для существующей базы данных
   Установите Prisma и клиент (если еще не установлены):

Копировать
npm install prisma --save-dev
npm install @prisma/client
Инициализируйте Prisma: Выполните:

npx prisma init
npx prisma db pull
npx prisma generate


сделай новый проект с нуля
база уже создана мне на втором сайте нужно просто получать и выводить данные

npx create-next-app@latest prisma-test
cd prisma-test

yarn add prisma @prisma/client --save-dev
# yarn install prisma --save-dev
# yarn install @prisma/client

npx prisma init
yarn prisma db pull
yarn prisma generate

.env
DATABASE_URL=postgresql://postgres:Weterr123@192.168.1.121:5432/ardua?schema=public

actions.ts
```
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

interface Device {
    idDevice: string;
}

export async function getAllowedDeviceIds(): Promise<string[]> {
    try {
        // Запрашиваем все idDevice из таблицы Devices
        const devices: Device[] = await prisma.devices.findMany({
            select: {
                idDevice: true,
            },
        });

        console.log(devices);
        return devices.map((device) => device.idDevice);
    } catch (error) {
        console.error('Ошибка при получении idDevice из базы данных:', error);
        return []; // Возвращаем пустой массив в случае ошибки
    } finally {
        await prisma.$disconnect(); // Закрываем соединение
    }
}
```

сделай новый проект prisma-test с реактом, чтобы на главной выводились данные  getAllowedDeviceIds()




Копировать
npx prisma init
Это создаст папку prisma с файлом schema.prisma и файл .env.
Настройте .env: В файле .env укажите строку подключения к вашей базе данных:
text

Свернуть

Перенос

Копировать
DATABASE_URL=postgresql://postgres:Weterr123@192.168.1.121:5432/ardua?schema=public
Синхронизируйте схему с существующей базой данных: Используйте команду db pull для автоматической генерации модели Prisma на основе существующей таблицы Devices:




Копировать
npx prisma db pull
Это обновит prisma/schema.prisma, добавив модель, соответствующую вашей таблице Devices. Пример сгенерированной модели:
prisma

Свернуть

Перенос

Копировать
model Devices {
idDevice String @id @unique
}
Сгенерируйте Prisma Client: Выполните:




Копировать
npx prisma generate
Это создаст Prisma Client для работы с вашей базой данных.
2. Обновление функции getAllowedDeviceIds
   Теперь измените файл fun.ts, чтобы использовать Prisma Client для получения idDevice из таблицы Devices:

typescript



Копировать
// file: docker-socket-96/fun.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getAllowedDeviceIds(): Promise<string[]> {
try {
// Запрашиваем все idDevice из таблицы Devices
const devices = await prisma.devices.findMany({
select: {
idDevice: true,
},
});

    // Возвращаем массив idDevice
    return devices.map((device) => device.idDevice);
} catch (error) {
console.error('Ошибка при получении idDevice из базы данных:', error);
return []; // Возвращаем пустой массив в случае ошибки
} finally {
await prisma.$disconnect(); // Закрываем соединение
}
}
3. Важные замечания
   Только подключение: Вы используете Prisma только для выполнения запросов к существующей базе данных. Команда db pull не изменяет структуру базы, а лишь создает модель для Prisma на основе текущих таблиц.
   Проверка модели: После выполнения npx prisma db pull проверьте schema.prisma. Убедитесь, что модель Devices и поле idDevice определены корректно. Если имя таблицы в базе данных отличается (например, devices или DEVICES), Prisma автоматически сопоставит его с моделью, но имя модели в schema.prisma будет в PascalCase (Devices).
   Регистр и схема: Убедитесь, что схема public и таблица Devices доступны. Если таблица находится в другой схеме, обновите DATABASE_URL или укажите схему в schema.prisma.
4. Проверка подключения
   Убедитесь, что PostgreSQL сервер доступен по адресу 192.168.1.121:5432, и пользователь postgres с паролем Weterr123 имеет доступ к базе ardua.
   Проверьте, что таблица Devices содержит поле idDevice (тип VARCHAR или TEXT).
   Запустите сервер и проверьте логи. Если есть ошибки подключения, они будут выведены в консоль.
5. Дополнительные шаги
   Зависимости: Убедитесь, что @prisma/client и prisma добавлены в package.json:
   json

Свернуть

Перенос

Копировать
"dependencies": {
"@prisma/client": "^5.0.0"
},
"devDependencies": {
"prisma": "^5.0.0"
}
Перезапуск сервера: После изменения fun.ts перезапустите сервер (node server.ts).
Отладка: Если запросы не работают, включите логи Prisma, добавив в .env:
text

Свернуть

Перенос

Копировать
PRISMA_LOG_LEVEL=info
6. Если что-то пошло не так
   Ошибка подключения: Проверьте DATABASE_URL и доступность сервера PostgreSQL.
   Несоответствие схемы: Если db pull создал неверную модель, проверьте структуру таблицы в базе данных (например, через psql или pgAdmin).
   Ошибки запросов: Убедитесь, что таблица Devices не пуста и содержит данные в поле idDevice.
   Теперь функция getAllowedDeviceIds будет получать идентификаторы устройств из базы данных через Prisma, без необходимости создавать новые таблицы. Если нужны дополнительные уточнения, напишите!