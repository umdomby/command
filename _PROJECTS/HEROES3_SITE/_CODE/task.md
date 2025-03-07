model Player {
id                Int         @id @default(autoincrement())
name              String
}

нужно добавить поля 

countGame         Int?
winGame           Int?
lossGame          Int?
rateGame          Int?

сделай sql запрос PGAdmin  учитывай регистр, название возьми в ковычки


ALTER TABLE "Player"
ADD COLUMN "countGame" INT,
ADD COLUMN "winGame" INT,
ADD COLUMN "lossGame" INT,
ADD COLUMN "rateGame" INT;