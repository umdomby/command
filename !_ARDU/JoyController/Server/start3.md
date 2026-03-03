Тестовый период — 2 часа в сутки (120 минут)
Платные лицензии — год / 2 года / lifetime
Привязка к устройству (HWID / machine fingerprint)
JWT вместо простого токена userId:expires
Периодическая проверка онлайн + защита от подмены системного времени
Админка для управления лицензиями (активация, просмотр использования trial, удаление/замена лицензии)
C# клиент — минимальная регистрация/логин + проверка лицензии при старте

<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>WinExe</OutputType>
    <TargetFramework>net9.0-windows</TargetFramework>
    <Nullable>enable</Nullable>
    <UseWindowsForms>true</UseWindowsForms>
    <ImplicitUsings>enable</ImplicitUsings>
    <ApplicationIcon>icon.ico</ApplicationIcon>

    <!-- Основные настройки публикации и AOT -->
    <PublishAot>true</PublishAot>
    <PublishTrimmed>true</PublishTrimmed>
    <_SuppressWinFormsTrimError>true</_SuppressWinFormsTrimError>
    <TrimMode>partial</TrimMode>
    <!-- partial — безопаснее для WinForms + ViGEm; full можно попробовать позже -->

    <!-- Single-file и сжатие -->
    <PublishSingleFile>true</PublishSingleFile>
    <IncludeAllContentForSelfExtract>true</IncludeAllContentForSelfExtract>
    <IncludeNativeLibrariesForSelfExtract>true</IncludeNativeLibrariesForSelfExtract>
    <EnableCompressionInSingleFile>true</EnableCompressionInSingleFile>

    <!-- Оптимизации размера -->
    <InvariantGlobalization>false</InvariantGlobalization>
    <OptimizationPreference>Size</OptimizationPreference>

    <!-- Анализаторы -->
    <EnableTrimAnalyzer>true</EnableTrimAnalyzer>
    <EnableAotAnalyzer>true</EnableAotAnalyzer>

    <!-- JSON без рефлексии -->
    <JsonSerializerIsReflectionEnabledByDefault>false</JsonSerializerIsReflectionEnabledByDefault>

    <!-- Подавление предупреждений -->
    <NoWarn>$(NoWarn);IL3000</NoWarn>
  </PropertyGroup>

  <ItemGroup>
    <Content Include="icon.ico" />
  </ItemGroup>

  <ItemGroup>
    <PackageReference Include="HidSharp" Version="2.6.4" />
    <PackageReference Include="Nefarius.ViGEm.Client" Version="1.21.256" />
    <PackageReference Include="SharpDX.DirectInput" Version="4.2.0" />
    <PackageReference Include="SharpDX.XInput" Version="4.2.0" />
    <PackageReference Include="Microsoft.IdentityModel.JsonWebTokens" Version="8.1.2" />
    <PackageReference Include="Microsoft.IdentityModel.Tokens" Version="8.1.2" />
  </ItemGroup>

  <!-- Защита библиотек от trimming -->
  <ItemGroup>
    <TrimmerRootAssembly Include="HidSharp" />
    <TrimmerRootAssembly Include="Nefarius.ViGEm.Client" />
    <TrimmerRootAssembly Include="SharpDX" />
    <TrimmerRootAssembly Include="SharpDX.DirectInput" />
    <TrimmerRootAssembly Include="SharpDX.XInput" />
    <TrimmerRootAssembly Include="Microsoft.VisualBasic.Forms" />
    <TrimmerRootAssembly Include="System.Windows.Forms" />
    <TrimmerRootAssembly Include="System.Windows.Forms.Primitives" />
  </ItemGroup>

</Project>

model User {
id                       Int          @id @default(autoincrement())
fullName                 String
email                    String       @unique
provider                 String?
providerId               String?
password                 String
role                     UserRole     @default(USER)
img                      String?
resetToken               String?
verificationToken        String? // Токен для подтверждения email
emailVerified            Boolean      @default(false) // Статус подтверждения email
verificationTokenExpires DateTime?
points                   Float        @default(1000)
createdAt                DateTime     @default(now())
updatedAt                DateTime     @updatedAt
insurances               Insurance[]
joyLicenses              JoyLicense[] // связь один-ко-многим

@@map("users")
}

model JoyLicense {
id                Int       @id @default(autoincrement())
userId            Int
licenseKey        String?   @unique
isActivated       Boolean   @default(false)
isCurrent         Boolean   @default(true) // ← новое
subscriptionType  String? // "trial", "year", "two_years", "lifetime"
startsAt          DateTime  @default(now())
endsAt            DateTime? // null = lifetime
trialMinutesLimit Int       @default(120)
trialMinutesUsed  Int       @default(0)
lastUsageDate     DateTime  @default(now())
deviceId          String? // HWID (обязательно для платных)
notes             String?
createdAt         DateTime  @default(now())
updatedAt         DateTime  @updatedAt

user User @relation(fields: [userId], references: [id], onDelete: Cascade)

@@index([userId])
@@index([licenseKey, isActivated])
@@map("joy_licenses")
}


\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\app\api\joy\heartbeat\route.ts

\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\app\api\joy\login

\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\app\api\joy\login\route.ts

\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\app\api\joy\validate

\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\app\api\joy\validate\route.ts


На Form1 нужна кнопка логирование, при успешном логировании показать на главной странице Form1 email пользователя, и лицензию до какого числа, если нет то пишем триал 2 часа в сутки


Я пишу верный логин и пароль, но мне указывает что email или пароль не верный. Так де в форме входа запамимай в поле Email последний введенный email пользователем, так же где на форме пишется Trial 2 часа  - пиши сколько осталось времени до конца триала в сутки и время и дату когда триал обновится чтобы получить новые два часа.
подскажи от куда программа будет брать эти данные локально или с сервера? Где находится Привязка к устройству (HWID / machine fingerprint) опиши подробно все и сделай изменения.




Исправлено — теперь показывается точно то сообщение, которое пришло с сервера («No active license», «Invalid credentials or not verified» и т.д.).
в любом случае пользователь должен логиниться в приложении и сохраняться, чтобы при новом входе у него не требовало вводить повторно логин и пароль


нужно чтобы в поле для логирования Email успешный Email сохранялся, так же логин и пароль с успешным логированием сохранялся, или при новом запуске программы отправлялся запрос и сразу показывался сколько лицензии осталось, со временем года дата и время по-минутно и кнопку обновить - чтобы пользователь мог посмотреть


machine-id проверку (HWID) на сервере если пользователь переустановит виндовс ему в доступе будет отказано?
как лучше сделать защиту триала? перезаписывать подпись, а при новом логировании проверять все подписи, если подпись есть, и он логиниться с новым емелом, таблицу не создавать и выдавать тот триал который привязан к machine-id  подскажи как делают, мой этот подход хороший?


Много триалов на одном ПК — легко (новая почта → новый триал)
Переустановка Windows — почти всегда ломает доступ к триалу/подписке
Нет гибкости — один HWID на аккаунт слишком жёстко

###
подход два в одном 1) — массив 3 HWID + дата создания каждой записи (по истечении 7 дней можно будет обновить самый ранний HWID)  + 2 ) при регистрации проверять в базе все HWID, если в базе есть HWID - отказ в регистрации
Как это работает

При первом логине → создаётся запись триала с deviceIds: [{ hwid: "...", createdAt: "2026-02-25T..." }]
При каждом новом логине с неизвестным HWID:
если массив < 3 → добавляем новый
если массив уже 3 → смотрим на самую старую запись (по createdAt)
если ей больше N дней → заменяем её на новую
если всем трём меньше N дней → отказ в новом триале (или просто не добавляем)
срок N выбрать - 7 дней

при новой регистрации если HWID есть во всей базе - выводить пользователю - отказ в регистрации с сообщением - одно устройство один аккаунт
если пользователь исчерпал все 3 HWID (и ни у одной записи не прошла неделя) пишем сообщения - вы исчерпали все лимиты - просим подождать столько то дней часов и минут

жёсткий двухуровневый подход:

При регистрации нового аккаунта — проверять всю базу. Если этот HWID уже где-то используется (в любой записи JoyLicense) → полный отказ в регистрации с сообщением «Одно устройство — один аккаунт».
Для уже существующих аккаунтов — разрешить до 3 HWID с механизмом замены самого старого через 7 дней.


### 
Почему перелогин сейчас лучше, чем автообновление токена

У тебя лицензионная система с жёсткими правилами (одно устройство — один аккаунт, лимит 3 HWID, ежедневный триал 60 мин).
Основные изменения лицензии происходят редко, но критически (админ активирует подписку, удаляет триал, меняет тип).
Пользователи не сидят в приложении часами — это не игра или чат, а инструмент, который запускают по необходимости.
Безопасность важнее удобства — если кто-то купил подписку, а потом её отозвали (например, за нарушение), старый токен не должен продолжать работать.
Реализация автообновления токена добавит код, потенциальные баги и усложнит отладку, а выгода минимальна.

@@unique([userId]) — теперь физически нельзя создать вторую запись на одного пользователя
Поиск лицензии → findFirst({ where: { userId } }) — всегда одна
HWID проверяется по всей базе, но исключая своего пользователя ("userId" != $2)
HWID добавляется/обновляется в существующую запись (триал или платную)
Нет разделения на trialLicense и activePaid — всё в одной записи

админская активация теперь обновляет существующую запись, а не создаёт новую. Триал превращается в платную лицензию, HWID сохраняется. Когда админ удаляет лицензию, то у пользователя должна лицензия (та же запись) переделаться в триал
когда пользователь логиниться в программе С# и у него нет трила, триал запись должна создаваться автоматически.
Если админ удалил триал, или изменил лицензию, значит изменился токен, и пользователь нажимает обновить - его просят перелогиниться и появляется окно с входом.
проверка HWID по всей базе (кроме своей записи), если HWID есть хоть у одного пользователя, отказ в регистрации, выводим ему сообщение Это устройство уже зарегистрировано. Одно устройство — один аккаунт.

так же я заметил что Heartbeart может создавать HWID сделай везде во всем коде проверку, если в базе HWID есть таблица новая таблица не получает HWID если в базе HWID есть, может быть такое что админ удалил триал а у пользователя в токене осталась или еще как, чтобы весь проект не заносил HWID если HWID есть

heartbeat обновляет HWID сделай так когда приходит heartbeat он не создает в базе HWID он проверяет его (все три если есть)  если HWID присутствует то минуты списываются программа работает, если HWID нет то просит перелогиниться, это правильно?

таймер триала и лицензии должен обновляться через private System.Windows.Forms.Timer licenseTimer = new(); и показываться пользователю heartbeat должен сверять время с сервером, и устанавливать серверное время если оно не совпадает. сейчас таймер не тикает для пользователя, дай точечный ответ
если программа не имела доступ к серверу один час - должно показываться сообщение нет доступа к серверу и окно логирования


когда пользователь вышел, и пишет Не выполнен вход то таймер продолжает идти (но на сервере не отнимается) сделай так чтобы время не шло, так же сделай если пользователь не залогинился сделай в коде на свое усмотрение неактивной, если триал закончился так же, и если платная лицензия закончилась так же на свое усмотрение.

Добавить триал!


добавь если сервер недоступен, а у пользователя любая платная лицензия то программа должна работать
сбросить лицензию на триал


сбросить платную лицензию на триал в админке - когда установлена платная лицензия добавь кнопку - сбросить на триал (HWID при этом не сбрасывается) дай точечные изменения, посмотри может где можно использовать существующую функцию  в актионс или изменить существующую не изменяя существующей логики. Логику существующую не изменяй не удаляй дай точечный ответ



[HEARTBEAT] Платная лицензия: ошибка игнорируется, продолжаем по локальному endsAt

так и надо, но в случае если сервер будет недоступен, нужно сделать чтобы при запуске программы, проверялось есть ли платная лицензия и нет доступ к серверу то программа должна заруститься и и работать. При появлении доступа к серверу время лицензий синхронизировалось с сервером. Так же если лицензия изменилась на триал платная лицензия должна удаляться. дай точечный ответ

у пользователя платная лицензия сохранненный licstate.dat"  пользователю сначала пишет Load а потом Триал исчерпан на сегодня доступ завтра (приостановлено) я сервер отключил для теста, можно делать проверку если licstate.dat есть то сервер для платного пользователя не нужен и программа должна работать без ограничений, время в это время должно отниматься и сохраняться локально, и локально даеж если пользователь не вошел в интернет лицензия локально отнимается и удаляется и доступ  private void DisableFeaturesOnLicenseExpire() прекращается . Если лицензия сборошена на триал или  с сервера приходит триал то licstate.dat  удаляется.



да но проблема осталась при офлайне или если сервер не доступен пользователю с платной лицензией пишет - лицензия изменилась - и происходит перелогин, у такого пользователя так не должно быть


проблема - при новом запуске у платного пользователя меняется доступ и лицензия, наверное не подтягивается лицензия для платного пользователя. Так же проходит время около минуты - джойстик у палатного пользователя перестает работать. Так же с кнопками обновить лицензию и выход, после этих манипуляций пользователя так же сбрасывается лицензия при отключенном интернете или недоступности сервера. нужно что то сделать с кнопками для платного пользователя.
JoyControl\bin\Debug\net9.0-windows - файл не создается licstate.dat  - выведи логи для платного пользователя , который запускает программу без доступа к серверу (чтобы было видно как обрабатывается) - когда сервер доступен и когда не доступен


# запуск с сервером
сервер
[VALIDATE] Пользователь 2, лицензия #2, тип: year, HWID: 79052ee9a2606e62fab56bd670bcc6fd7f2ba36d1c62a734ae43ad606d34b1eb
 POST /api/joy/validate 200 in 363ms (compile: 249ms, render: 114ms)
❤️ HEARTBEAT REQUEST: {
  deviceId: '79052ee9a2606e62fab56bd670bcc6fd7f2ba36d1c62a734ae43ad606d34b1eb',
  minutesUsed: 1
}
[HEARTBEAT] HWID 79052ee9a2606e62fab56bd670bcc6fd7f2ba36d1c62a734ae43ad606d34b1eb подтверждён в лицензии #2
 POST /api/joy/heartbeat 200 in 41ms (compile: 31ms, render: 10ms)
❤️ HEARTBEAT REQUEST: {
  deviceId: '79052ee9a2606e62fab56bd670bcc6fd7f2ba36d1c62a734ae43ad606d34b1eb',
  minutesUsed: 1
}
[HEARTBEAT] HWID 79052ee9a2606e62fab56bd670bcc6fd7f2ba36d1c62a734ae43ad606d34b1eb подтверждён в лицензии #2
 POST /api/joy/heartbeat 200 in 8ms (compile: 2ms, render: 6ms)
❤️ HEARTBEAT REQUEST: {
  deviceId: '79052ee9a2606e62fab56bd670bcc6fd7f2ba36d1c62a734ae43ad606d34b1eb',
  minutesUsed: 1
}
[HEARTBEAT] HWID 79052ee9a2606e62fab56bd670bcc6fd7f2ba36d1c62a734ae43ad606d34b1eb подтверждён в лицензии #2
 POST /api/joy/heartbeat 200 in 7ms (compile: 1847µs, render: 5ms)
 
Загружен сохранённый логин: 123@gmail.com
=== UpdateLicenseUIAsync ВЫЗВАН ===
_token перед payload: eyJhbGciOiJIUzI1NiJ9.eyJzdWIiO...
=== ОТПРАВЛЯЕМЫЙ JSON НА /validate ===
{"token":"eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOjIsImxpYyI6MiwidHlwZSI6InllYXIiLCJqdGkiOiJjNnJ3MUc4WGcxX05sVmF1MGJiM0giLCJpYXQiOjE3NzI0NDI0MzksImV4cCI6MTc3MjQ0NjAzOX0.geN6MWd_9SC3SbvhO7EHaqD_ZdCv3DwvfQad_wujKwE","deviceId":"79052ee9a2606e62fab56bd670bcc6fd7f2ba36d1c62a734ae43ad606d34b1eb"}
[LICENSE] Persistent state сохранён
VALIDATE МЕТОД ВЫЗВАН !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
Validate response:
  valid: True
  type: year
  endsAt: 2027-03-02T09:07:13.4190000Z
  trialUsed: 0
  trialLimit: 0
  trialRemaining: 0
  nextResetAt: null
  message: License active
[HEARTBEAT TICK] Отправка запроса для обновления лицензии...
[HEARTBEAT] Отправка запроса на сервер...
[LICENSE] Persistent state сохранён
[LICENSE] Persistent state сохранён
[HEARTBEAT] Платная лицензия подтверждена с сервера
[HEARTBEAT TICK] Отправка запроса для обновления лицензии...
[HEARTBEAT] Отправка запроса на сервер...
[LICENSE] Persistent state сохранён
[LICENSE] Persistent state сохранён
[HEARTBEAT] Платная лицензия подтверждена с сервера
[HEARTBEAT TICK] Отправка запроса для обновления лицензии...
[HEARTBEAT] Отправка запроса на сервер...
[LICENSE] Persistent state сохранён
[LICENSE] Persistent state сохранён
[HEARTBEAT] Платная лицензия подтверждена с сервера
[HEARTBEAT TICK] Отправка запроса для обновления лицензии...
[HEARTBEAT] Отправка запроса на сервер...
[LICENSE] Persistent state сохранён
[LICENSE] Persistent state сохранён
[HEARTBEAT] Платная лицензия подтверждена с сервера
 
сервер отключаю программаработает
[HEARTBEAT] Платная лицензия: ошибка игнорируется, продолжаем по локальному endsAt
[HEARTBEAT TICK] Отправка запроса для обновления лицензии...
[HEARTBEAT] Отправка запроса на сервер...
Heartbeat failed: BadGateway - <html>
<head><title>502 Bad Gateway</title></head>
<body>
<center><h1>502 Bad Gateway</h1></center>
<hr><center>nginx/1.29.5</center>
</body>
</html>
[HEARTBEAT] Ошибка: <html>
<head><title>502 Bad Gateway</title></head>
<body>
<center><h1>502 Bad Gateway</h1></center>
<hr><center>nginx/1.29.5</center>
</body>
</html>
[HEARTBEAT] Платная лицензия: ошибка игнорируется, продолжаем по локальному endsAt
 
запуск программы без сервера
Загружен сохранённый логин: 123@gmail.com
=== UpdateLicenseUIAsync ВЫЗВАН ===
_token перед payload: eyJhbGciOiJIUzI1NiJ9.eyJzdWIiO...
=== ОТПРАВЛЯЕМЫЙ JSON НА /validate ===
{"token":"eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOjIsImxpYyI6MiwidHlwZSI6InllYXIiLCJqdGkiOiJjNnJ3MUc4WGcxX05sVmF1MGJiM0giLCJpYXQiOjE3NzI0NDI0MzksImV4cCI6MTc3MjQ0NjAzOX0.geN6MWd_9SC3SbvhO7EHaqD_ZdCv3DwvfQad_wujKwE","deviceId":"79052ee9a2606e62fab56bd670bcc6fd7f2ba36d1c62a734ae43ad606d34b1eb"}
======================================
Validate ошибка: <html>
<head><title>502 Bad Gateway</title></head>
<body>
<center><h1>502 Bad Gateway</h1></center>
<hr><center>nginx/1.29.5</center>
</body>
</html>
Триал Триал исчерпан на сегодня • доступ завтра (приостановлено) - нужно если у пользователя есть платная лицензия и файл licstate.dat у него должна программа работать и выводиться в информации что у тебя Подписка активна осталось ... и джойстк и функции все должно работать


сейчас во время работы я отключаю сервер джойстик виртуальный отсоединяется ,  - нет не отсоединяется я подождал пока пришло подтверждение платной лицензии, после я отключил сервер программа стала работать дальше, но при новой загрузке программы без сервера локальная платная лицензия не подтягивается и программа не дает доступ к виртуальному контроллеру и платным функциям

ip

в компоненте docker-ardu\components\joy\joy-admin.tsx нужно сделать кнопку на компонент
docker-ardu\components\joy\joy-account-create.tsx

actions-joy-lic.ts

components\joy\joy-account-create.tsx в этом компоненте нужно создавать лицензии оптом - в отдельную таблицу
в components\joy\joy-admin.tsx нужно сделать ссылку на серверный page \app\(root)\admin\joyadd\page.tsx сюда будут импортированы все server actions из нового файла app\actions-joy-lic.ts для работы с bd prisma и пропсаи в клиентский компонент components\joy\joy-account-create.tsx
так же в joy-admin.tsx нужно сделать ссылку на app\(root)\admin\joylic\page.tsx серверный компонент page и его клиентский компонент (передаем через пропсы prisma actions) components\joy\joy-account.tsx и actions-joy-lic.ts для работы с bd prisma

сервер admin\joyadd\page.tsx + клиент components\joy\joy-account-create.tsx - создаем лицензии
1) выплывающий список от 0 - до 100 - количество лицензий, 
2) три чекбокса которые могут устанавливаться сразу все - это лицензия на год, на два, на пожизненно если выбираешь 3 чекбокса и например 100 в первом выплывающем списке то создается по 100 лицензий (по 100 на год, по 100 на два, по 100 на пожизненно)
3) выбор оптовика из списка зарегистрированных пользователей на сайте
4) выпадающий список всех имен - для того чтобы к нему можно было добавить дополнительные аккаунты - если при создании этот список пуст создается новый
5) кнопку создать 
под капотом должен создаваться 32 двух значный код
под этими импутами выведи поля имени всех кому создал админ аккаунты

сервер admin\joylic\page.tsx  + клиент components\joy\joy-account.tsx там список оптовиков
админ при нажатии на любое имя оптовика - попадает на его список купленных аккаунтов
через компонент docker-ardu\components\joy\joy-account.tsx  (сделай так чтобы админ мог удобно скопировать все 32-х значные кода), общую кнопку - заморозить все лицензии, и удалить все лицензии, можно заморозить отдельную, можно удалить отдельную лицензию - чтобы админ видел к какой пользователь активировал лицензию - его почту.
отображается количество лицензий и их тип - напротив каждой лицензии 32 двух значный код (активирована лицензия или нет)

когда новый зарегистрированный пользователь будет заходить на страницу app\(root)\joy\code\page.tsx его клиентский компонент components\joy\joy-code-activation.tsx там поле для ввода кода - и кнопка активировать, пользователь активирует и к нему добавляется (обновляется если у него триал лицензия, у пользователя таблица может быть с лицензией только одна!)
при вводе 32 двух значного кода, лицензия так же  становится активной у оптовика (зелененький кружочек - показана админу что она активирована) и этот код больше использовать уже нельзя. Пользователь при вводе 5 раз неправильно, заблокируй ему ввод на 1 час. с оповещением. так же если час прошел все неудачные попытки обнуляются


серверная страница app\(root)\joy\activelic\page.tsx оптовик заходя на нее видит какие лицензии активны, какие удалены, какие остановлены (удаленные и остановлены нельзя активировать, как и одну и туже лицензию нельзя активировать) и какому пользователю присвоена лицензия

app\actions-joy-lic.ts - серверные функции. Не используй api бери пример работы и концепцию как это реализовано в app\actions.ts + admin\joy\page.tsx + components\joy\joy-admin.tsx
доработай улучшение на свое усмотрение, отвечай на русском



https://drive.google.com/file/d/1QxcXWWD8mstxL7pTcq2_gSAx0z_QPv2r/view?usp=sharing   exe
https://drive.google.com/file/d/1g3oitT89tFQ134Ds4EdTyuZAGdbqeU3j/view?usp=sharing   rar