```js
async function fetchBitcoinRate() {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
            params: {
                ids: 'bitcoin',
                vs_currencies: 'usd',
            },
        });
        return response.data.bitcoin.usd;
    } catch (error) {
        console.error('Ошибка при получении курса биткойна:', error);

        // Если запрос не удался, возвращаем предыдущее значение из базы данных
        const previousData = await prisma.courseValuta.findUnique({
            where: { id: 1 },
        });

        if (previousData) {
            console.log('Возвращаем предыдущее значение курса биткойна:', previousData.BTC);
            return previousData.BTC;
        }

        return 0; // Если данных нет, возвращаем 0 или другое значение по умолчанию
    }
}
export async function updateCurrencyRatesIfNeeded() {
    try {
        // Получаем первую запись с курсами валют
        const courseValutaData = await prisma.courseValuta.findUnique({
            where: { id: 1 }, // Проверяем только первую запись
        });

        // Проверяем, прошло ли 10 секунд с момента последнего обновления
        if (courseValutaData && (new Date().getTime() - new Date(courseValutaData.updatedAt).getTime()) < 10000) {
            console.log('Данные обновлены недавно, пропускаем обновление.');
            return;
        }

        const response = await axios.get('https://www.nbrb.by/api/exrates/rates?periodicity=0');
        const rates = response.data;

        // Извлекаем курсы валют относительно белорусского рубля
        const usdToBynRate = rates.find((rate: any) => rate.Cur_Abbreviation === 'USD')?.Cur_OfficialRate || 1;
        const eurToBynRate = rates.find((rate: any) => rate.Cur_Abbreviation === 'EUR')?.Cur_OfficialRate || 0;
        const rubToBynRate = rates.find((rate: any) => rate.Cur_Abbreviation === 'RUB')?.Cur_OfficialRate || 0;

        // Пересчитываем курсы валют относительно доллара США
        const usdRate = usdToBynRate; // USD к USD всегда 1
        const eurRate = eurToBynRate / usdToBynRate;
        const rubRate = rubToBynRate / usdToBynRate;
        const belRate = 1 / usdToBynRate; // BYN к USD
        const btcRate = await fetchBitcoinRate(); // Получаем курс биткойна отдельно
        const usdtRate = usdToBynRate; // Предполагаем, что USDT привязан к USD

        // Обновляем курсы валют в базе данных
        await prisma.courseValuta.update({
            where: { id: 1 }, // Обновляем только первую запись
            data: {
                USD: Math.floor(usdRate * 100) / 100,
                EUR: Math.floor(eurRate * 100) / 100,
                RUS: Math.floor(rubRate * 100) / 100,
                BEL: Math.floor(belRate * 100) / 100,
                BTC: btcRate,
                USTD: Math.floor(usdtRate * 100) / 100,
                updatedAt: new Date(),
            },
        });

        console.log('Курсы валют успешно обновлены.');
    } catch (error) {
        console.error('Ошибка при обновлении курсов валют:', error);
    }
} // 600000 - courseValut
```