
нужно создать таблицы 
```
model PlayerStatistic {
id Int @id @default(autoincrement())
turnirBet TurnirBet @relation(fields: [turnirId], references: [id])
turnirId  Int
category   Category @relation(fields: [categoryId], references: [id])
categoryId Int
player   Player @relation(fields: [playerId], references: [id])
playerId Int
color    ColorPlayer
city     CityHeroes?
gold     Int         @default(0)
security String      @default("")
win      Boolean
link     String?     @default("")
}

enum ColorPlayer {
RED //(КРАСНЫЙ)
BLUE //(СИНИЙ)
GREEN //(ЗЕЛЁНЫЙ)
YELLOW //(ЖЁЛТЫЙ)
PURPLE //(ФИОЛЕТОВЫЙ)
ORANGE //(ОРАНЖЕВЫЙ)
TEAL //(БИРЮЗОВЫЙ)
PINK //(РОЗОВЫЙ)
}

enum CityHeroes {
CASTLE //(ЗАМОК) 1
RAMPART //(ОПЛОТ) 1
TOWER //(БАШНЯ) 1
INFERNO //(ИНФЕРНО) 1
NECROPOLIS //(НЕКРОПОЛИС) 1
DUNGEON //(ТЕМНИЦА) 1
STRONGHOLD //(ЦИТАДЕЛЬ) 1
FORTRESS //(КРЕПОСТЬ) 1
CONFLUX //(СОПРЯЖЕНИЕ) 1
COVE //(ПРИЧАЛ) 1
FACTORY //(ФАБРИКА) 1
}
```
и добавить ссылки
```
model TurnirBet {
playerStatistics PlayerStatistic[]
}
model Category {
playerStatistics PlayerStatistic[]
}
model Player {
playerStatistics   PlayerStatistic[]
}
```
сделай sql запросы через PGAdmin
отвечай на русском


```
-- Создание таблицы TurnirBet
CREATE TABLE "TurnirBet" (
    id SERIAL PRIMARY KEY
);

-- Создание таблицы Category
CREATE TABLE "Category" (
    id SERIAL PRIMARY KEY
);

-- Создание таблицы Player
CREATE TABLE "Player" (
    id SERIAL PRIMARY KEY
);

-- Создание перечисления ColorPlayer
CREATE TYPE "ColorPlayer" AS ENUM (
    'RED',
    'BLUE',
    'GREEN',
    'YELLOW',
    'PURPLE',
    'ORANGE',
    'TEAL',
    'PINK'
);

-- Создание перечисления CityHeroes
CREATE TYPE "CityHeroes" AS ENUM (
    'CASTLE',
    'RAMPART',
    'TOWER',
    'INFERNO',
    'NECROPOLIS',
    'DUNGEON',
    'STRONGHOLD',
    'FORTRESS',
    'CONFLUX',
    'COVE',
    'FACTORY'
);

-- Создание таблицы PlayerStatistic
CREATE TABLE "PlayerStatistic" (
    "id" SERIAL PRIMARY KEY,
    "turnirId" INT NOT NULL,
    "categoryId" INT NOT NULL,
    "playerId" INT NOT NULL,
    "color" "ColorPlayer" NOT NULL,
    "city" "CityHeroes",
    "gold" INT DEFAULT 0,
    "security" VARCHAR(255) DEFAULT '',
    "win" BOOLEAN NOT NULL,
    "link" VARCHAR(255) DEFAULT '',
    FOREIGN KEY ("turnirId") REFERENCES "TurnirBet"(id),
    FOREIGN KEY ("categoryId") REFERENCES "Category"(id),
    FOREIGN KEY ("playerId") REFERENCES "Player"(id)
);
```