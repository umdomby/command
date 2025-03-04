-- Добавление нового столбца для связи с TurnirBet
```sql
ALTER TABLE "Bet"
ADD COLUMN "turnirBets" INTEGER[];
```


-- Если вы хотите изменить существующий столбец, например, его тип данных или имя
-- ALTER TABLE "Bet" RENAME COLUMN "oldColumnName" TO "newColumnName";
-- ALTER TABLE "Bet" ALTER COLUMN "columnName" TYPE newDataType;

```sql
CREATE TABLE "TurnirBet" (
"id" SERIAL PRIMARY KEY,
"betId" INTEGER NOT NULL REFERENCES "Bet"("id"),
"turnirName" VARCHAR NOT NULL,
"createdAt" TIMESTAMP DEFAULT NOW(),
"updatedAt" TIMESTAMP DEFAULT NOW()
);
```

ALTER TABLE "BetCLOSED"
ADD COLUMN "turnirBets" INTEGER[];

ALTER TABLE "Bet3"
ADD COLUMN "turnirBets" INTEGER[];

ALTER TABLE "BetCLOSED3"
ADD COLUMN "turnirBets" INTEGER[];

ALTER TABLE "Bet4"
ADD COLUMN "turnirBets" INTEGER[];

ALTER TABLE "BetCLOSED4"
ADD COLUMN "turnirBets" INTEGER[];


CREATE TABLE "TurnirBet" (
"id" SERIAL PRIMARY KEY,
"betId" INTEGER NOT NULL REFERENCES "Bet"("id"),
"bet3Id" INTEGER NOT NULL REFERENCES "Bet3"("id"),
"bet4Id" INTEGER NOT NULL REFERENCES "Bet4"("id"),
"betCLOSEDId" INTEGER NOT NULL REFERENCES "BetCLOSED"("id"),
"betCLOSED3Id" INTEGER NOT NULL REFERENCES "BetCLOSED3"("id"),
"betCLOSED4Id" INTEGER NOT NULL REFERENCES "BetCLOSED4"("id"),
"turnirName" VARCHAR NOT NULL,
"createdAt" TIMESTAMP DEFAULT NOW(),
"updatedAt" TIMESTAMP DEFAULT NOW()
);

```
-- Пример добавления нового столбца
ALTER TABLE "TurnirBet"
ADD COLUMN "newColumnName" VARCHAR;

-- Пример изменения типа данных существующего столбца
ALTER TABLE "TurnirBet"
ALTER COLUMN "turnirName" TYPE TEXT;

-- Пример добавления внешнего ключа, если он еще не добавлен
ALTER TABLE "TurnirBet"
ADD CONSTRAINT fk_bet3 FOREIGN KEY ("bet3Id") REFERENCES "Bet3"("id");
```

```
-- Удаление существующей таблицы
DROP TABLE IF EXISTS "TurnirBet";

-- Создание таблицы заново
CREATE TABLE "TurnirBet" (
  "id" SERIAL PRIMARY KEY,
  "bet3Id" INTEGER NOT NULL REFERENCES "Bet3"("id"),
  "bet4Id" INTEGER NOT NULL REFERENCES "Bet4"("id"),
  "betCLOSEDId" INTEGER NOT NULL REFERENCES "BetCLOSED"("id"),
  "betCLOSED3Id" INTEGER NOT NULL REFERENCES "BetCLOSED3"("id"),
  "betCLOSED4Id" INTEGER NOT NULL REFERENCES "BetCLOSED4"("id"),
  "turnirName" VARCHAR NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
```


# УДАЛИТЬ СТОЛБЕЦ ОТНОШЕНИЙ
```
ALTER TABLE "Bet"
DROP COLUMN IF EXISTS "turnirBets";
```
# ALTER TABLE "Bet": Указывает, что вы хотите изменить таблицу Bet.
# DROP COLUMN IF EXISTS "turnirBets": Удаляет столбец turnirBets, если он существует. Использование IF EXISTS предотвращает ошибку, если столбец уже был удален или никогда не существовал.