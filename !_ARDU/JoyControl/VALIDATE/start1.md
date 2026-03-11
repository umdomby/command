validate

Основная задача /validate
Это серверный эндпоинт проверки статуса лицензии.
Клиент (твоё C# приложение) периодически отправляет на него текущий токен и HWID устройства, чтобы узнать:

Действительна ли лицензия
Какой тип (trial / year / lifetime и т.д.)
Сколько осталось минут в триале (если trial)
Истекла ли платная лицензия
Авторизовано ли текущее устройство (HWID проверка)

Если токен недействителен или лицензия не найдена → возвращается fallback-режим триала (60 минут, чтобы пользователь мог хоть как-то пользоваться).
Полный разбор кода (что происходит внутри)

```c#
TypeScriptexport async function POST(req: NextRequest) {
const { token, deviceId } = await req.json();

    // 1. Нет токена → fallback на триал (чтобы не блокировать полностью)
    if (!token) {
        return NextResponse.json(getDefaultTrialResponse());
    }

    // 2. Проверяем токен (JWT)
    let payload;
    try {
        payload = await verifyLicenseToken(token);
    } catch {
        // Токен недействителен/просрочен → fallback на триал
        return NextResponse.json(getDefaultTrialResponse());
    }

    const userId = Number(payload.sub);
    if (!userId || isNaN(userId)) {
        return NextResponse.json(getDefaultTrialResponse());
    }

    const now = new Date();

    // 3. Ищем лицензию пользователя (единственную запись)
    let license = await prisma.joyLicense.findUnique({
        where: { userId },
    });

    // Если лицензии нет → fallback на триал
    if (!license) {
        return NextResponse.json(getDefaultTrialResponse());
    }

    // 4. Проверка HWID — есть ли устройство в разрешённых
    const hwids = license.deviceIds as Array<{ hwid: string }>;
    if (!hwids.some(item => item.hwid === deviceId)) {
        // HWID не найден в массиве → устройство не авторизовано
        return NextResponse.json({
            valid: false,
            message: "Device not authorized (HWID not allowed)"
        });
    }

    // 5. Если платная лицензия истекла → fallback на триал
    if (license.subscriptionType !== 'trial' && license.endsAt && license.endsAt < now) {
        return NextResponse.json(getDefaultTrialResponse());
    }

    // 6. Триал-режим: считаем минуты
    if (license.subscriptionType === 'trial') {
        let used = license.trialMinutesUsed ?? 0;
        const isNewDay = !license.lastUsageDate || license.lastUsageDate.toDateString() !== now.toDateString();
        if (isNewDay) used = 0;

        const remaining = Math.max(0, license.trialMinutesLimit - used);

        return NextResponse.json({
            valid: true,
            type: "trial",
            endsAt: null,
            trialUsed: used,
            trialLimit: license.trialMinutesLimit,
            trialRemaining: remaining,
            nextResetAt: null,
            message: "Trial mode active",
        });
    }

    // 7. Платная лицензия (активна)
    return NextResponse.json({
        valid: true,
        type: license.subscriptionType,
        endsAt: license.endsAt?.toISOString() ?? null,
        trialUsed: 0,
        trialLimit: 0,
        trialRemaining: 0,
        nextResetAt: null,
        message: "License active",
    });
}
```