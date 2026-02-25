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
новый подход два в одном 1) — массив 3 HWID + дата создания каждой записи (по истечении 7 дней можно будет обновить самый ранний HWID)  + 2 ) при регистрации проверять в базе все HWID, если в базе есть HWID - отказ в регистрации
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

