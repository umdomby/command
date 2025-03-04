-- Создание таблицы TurnirBet
CREATE TABLE "TurnirBet" (
"id" SERIAL PRIMARY KEY,
"name" VARCHAR NOT NULL UNIQUE
);

-- Обновление таблицы Bet
ALTER TABLE "Bet"
ADD COLUMN "turnirBetId" INTEGER,
ADD CONSTRAINT fk_turnir_bet
FOREIGN KEY ("turnirBetId") REFERENCES "TurnirBet"("id");

-- Обновление таблицы BetCLOSED
ALTER TABLE "BetCLOSED"
ADD COLUMN "turnirBetId" INTEGER,
ADD CONSTRAINT fk_turnir_bet_closed
FOREIGN KEY ("turnirBetId") REFERENCES "TurnirBet"("id");

-- Обновление таблицы Bet3
ALTER TABLE "Bet3"
ADD COLUMN "turnirBetId" INTEGER,
ADD CONSTRAINT fk_turnir_bet3
FOREIGN KEY ("turnirBetId") REFERENCES "TurnirBet"("id");

-- Обновление таблицы BetCLOSED3
ALTER TABLE "BetCLOSED3"
ADD COLUMN "turnirBetId" INTEGER,
ADD CONSTRAINT fk_turnir_bet_closed3
FOREIGN KEY ("turnirBetId") REFERENCES "TurnirBet"("id");

-- Обновление таблицы Bet4
ALTER TABLE "Bet4"
ADD COLUMN "turnirBetId" INTEGER,
ADD CONSTRAINT fk_turnir_bet4
FOREIGN KEY ("turnirBetId") REFERENCES "TurnirBet"("id");

-- Обновление таблицы BetCLOSED4
ALTER TABLE "BetCLOSED4"
ADD COLUMN "turnirBetId" INTEGER,
ADD CONSTRAINT fk_turnir_bet_closed4
FOREIGN KEY ("turnirBetId") REFERENCES "TurnirBet"("id");