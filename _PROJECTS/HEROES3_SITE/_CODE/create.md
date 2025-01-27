model User {
id                Int                    @id @default(autoincrement())
fullName          String
email             String                 @unique
provider          String?
providerId        String?
password          String
role              UserRole               @default(USER)
img               String?
points            Float                  @default(1000) // баллы пользователя
p2pPlus           Int?                   @default(0)
p2pMinus          Int?                   @default(0)
contact           Json? // поле для хранения контактных данных
loginHistory      Json? // поле для хранения истории входов
betsCreated       Bet[]                  @relation("BetsCreated")
betsCLOSEDCreated BetCLOSED[]            @relation("BetsCLOSEDCreated")
betsPlaced        BetParticipant[]
betsCLOSEDPlaced  BetParticipantCLOSED[]
createdAt         DateTime               @default(now())
updatedAt         DateTime               @updatedAt
}


model Bet {
id              Int              @id @default(autoincrement())
player1         Player   @relation(name: "Player1Bets", fields: [player1Id], references: [id]) // ставки на игрока 1
player1Id       Int
player2         Player   @relation(name: "Player2Bets", fields: [player2Id], references: [id]) // ставки на игрока 2
player2Id       Int
initBetPlayer1  Float // инициализация ставок на игрока 1
initBetPlayer2  Float // инициализация ставок на игрока 2
totalBetPlayer1 Float // Сумма ставок на игрока 1
totalBetPlayer2 Float // Сумма ставок на игрока 2
oddsBetPlayer1  Float // Текущий коэффициент для игрока 1
oddsBetPlayer2  Float // Текущий коэффициент для игрока 2
maxBetPlayer1   Float // Максимальная сумма ставок на игрока 1
maxBetPlayer2   Float // Максимальная сумма ставок на игрока 2
totalBetAmount  Float            @default(0) // сумма всех ставок.
creator         User       @relation("BetsCreated", fields: [creatorId], references: [id]) // создатель события
creatorId       Int
status          BetStatus   @default(OPEN) // если статус = CLOSED то ставка закрыта, и перемещается в model BetCLOSED
participants    BetParticipant[]
categoryId      Int?
category        Category?        @relation(fields: [categoryId], references: [id])
productId       Int?
product         Product?         @relation(fields: [productId], references: [id])
productItemId   Int?
productItem     ProductItem?     @relation(fields: [productItemId], references: [id])
winnerId        Int? // кто победил PLAYER1 или PLAYER2
margin          Float? // в placeBet = 0
createdAt       DateTime         @default(now())
updatedAt       DateTime         @updatedAt
}


// export async function placeBet actions.ts
model BetParticipant {
id            Int          @id @default(autoincrement())
betId         Int
bet           Bet          @relation(fields: [betId], references: [id])
userId        Int // пользователь который ставит ставку
user          User         @relation(fields: [userId], references: [id])
player        PlayerChoice // выбранный игрок в событии
amount        Float // ставка пользователя
odds          Float // Коэффициент ставки
profit        Float // Показывает пользователю потенциальную выигрышную сумму. Сюда не входит маржа. Сюда не входит ставка пользователя, тут чистый потенциальный выигрыш.
overlap       Float // на какую сумму перекрыто, именно с этого поля начисляются выигранные суммы.
overlapRemain Float?       @default(0) // если ставка перекрыта сверх положенного ocerlap, остаток для перекрытия будущих ставок.
margin        Float // в placeBet = 0
isCovered     IsCovered //   OPEN: не перекрыта совсем "0", CLOSED: полностью перекрыта "overlap = profit", PENDING: частично перекрыта "overlap < profit"
isWinner      Boolean      @default(false) // Победила ли ставка
createdAt     DateTime     @default(now())
}
enum PlayerChoice {
PLAYER1
PLAYER2
}

общие правила

При каждой ставки и расчетов в function placeBet, в model Bet записываются уже измененные:
totalBetPlayer1 Float // Сумма ставок на игрока 1
totalBetPlayer2 Float // Сумма ставок на игрока 2
oddsBetPlayer1  Float // Текущий коэффициент для игрока 1
oddsBetPlayer2  Float // Текущий коэффициент для игрока 2
maxBetPlayer1   Float // Максимальная ставка на игрока 1
maxBetPlayer2   Float // Максимальная ставка на игрока 2

Мой код представляет собой реализацию системы ставок с перекрытием, где пользователи могут делать ставки на двух игроков (Player1 и Player2). Пользователи могут делать множество ставок на одно событие. Основная задача — обеспечить постоянство баллов пользователей в системе, за исключением случаев, когда пользователи покупают баллы за реальные деньги. Давайте разберем ключевые моменты и предложим улучшения.
Основные моменты:
Постоянство баллов: Общее количество баллов в системе должно оставаться постоянным, за исключением случаев, когда пользователи покупают баллы за реальные деньги.
Создание ставки: При создании ставки пользователь указывает начальные коэффициенты и максимальные ставки. Эти начальные значения не влияют на общее количество баллов в системе.
Перекрытие ставок: Когда много пользователей ставят на разных игроков, ставки регулируются “перекрытием”.  
Все расчеты и логика находится в actions.ts placeBet и closeBet , на клиенте не ведуться рсчеты и логика.



Общие правила ставок function placeBet:
Ставки на противоположных игроков PLAYER1 и PLAYER2 - реализация перекрытия. Победители ставок забирают свой выигрыш (в model User points - баллы пользователя) только из поля (model BetParticipant overlap), overlap - это и есть перекрытие. Пример: ставка (model BetParticipant amount) на PLAYER1 всегда заносится в поля overlap с PLAYER2, а ставка на PLAYER2 всегда заносится в поля overlap с PLAYER1 - это называется перекрытием (противоположная ставка).

overlap регулирует isCovered

isCovered = OPEN: ставка не перекрыта совсем "overlap = 0",  0 - это инициализация sCovered.
isCovered = CLOSED: полностью перекрыта "overlap = profit", overlap никогда не может быть > profit.
isCovered = PENDING: ставка частично перекрыта "overlap != 0 или overlap < profit"

isCovered = PENDING или  "overlap != 0 или overlap < profit" должен быть по одному в записях с PLAYER1 и PLAYER2

Первая ставка (например на PLAYER1):поле betId = номер события, userId = id пользователя, поле amount(размер ставки) = amount, поле oddsBetPlayer1 (коэффициент) = oddsBetPlayer1, поле overlap (перекрытие ставки) = 0, поле profit = amount * oddsBetPlayer1, overlapRemain = profit, isCovered = OPEN.

Каждая следующая запись и все последующие должны делать два действия.
//Цикл заполнения своей чистой прибыли overlap, используя все overlapRemain ставкой на другого игрока начиная по дате создания.
Перекрыть свою чистую прибыль overlap, от противоположных ставок на другого игрока во всех полях overlapRemain по дате создания. Проверяем все записи с одинаковым betId, противоположный PLAYER, где есть overlapRemain != 0 по дате создания и забираем баллы из этих записей по очереди в нашу запись в поле overlap, пока не станет наш overlap равен profit, то что не вошло в overlap нашей записи, остается в overlapRemain, и выходим из цикла. Не забудь обновлять isCovered.

// Цикл перекрытия чистой прибыли (profit) других пользователей поставивших ставку на другого игрока, начиная по дате создания.
Отдавать размер своей ставки в чистую прибыль (overlap) других пользователей поставивших на другого игрока. Ищем ставки на другого игрока по дате создания, где overlap не равен profit, заполняя overlap чтобы overlap стал равен profit, если у нас остались баллы и все ставки на другого игрока стали overlap равно profit, то наш остаток ставки (amount), заносится к нам в overlapRemain и выходим из цикла.
"overlap не равно 0 или profit больше overlap" может быть только по одному в записях с PLAYER1 и PLAYER2 , если есть частично не перекрытая ставка, нужно перекрывать её до конца чтобы overlap был равен profit, а потом заполнять другой profit, сортировка от создания ставки.
overlap никогда и нигде в записях не может быть больше profit
все ставки должны создаваться


Допиши function placeBet , чтобы соблюдались эти условия. Ответ и комментарии давай на русском.





