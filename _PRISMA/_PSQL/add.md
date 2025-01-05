```
сделайте запрос для создания model CarModel 
{ id Int @id @default(autoincrement()) 
name String gameRecords GameRecords[] 
product Product @relation(fields: [productId], references: [id]) productId Int } 
и обновления данных в GameRecords поле carModel
```
1)
-- Создание таблицы CarModel
CREATE TABLE "CarModel" (
"id" SERIAL PRIMARY KEY,
"name" TEXT NOT NULL,
"productId" INT NOT NULL,
CONSTRAINT fk_product
FOREIGN KEY ("productId")
REFERENCES "Product"("id")
ON DELETE CASCADE
);

-- Добавление поля carModelId в таблицу GameRecords
ALTER TABLE "GameRecords"
ADD COLUMN "carModelId" INT;

-- Добавление внешнего ключа для связи с таблицей CarModel
ALTER TABLE "GameRecords"
ADD CONSTRAINT fk_game_records_car_model
FOREIGN KEY ("carModelId")
REFERENCES "CarModel"("id")
ON DELETE SET NULL;

2) 
-- Создание таблицы GameCreateTime
   CREATE TABLE "GameCreateTime" (
   "id" SERIAL PRIMARY KEY,
   "userId" INT UNIQUE NOT NULL,
   "category" TIMESTAMP NOT NULL,
   "product" TIMESTAMP NOT NULL,
   "productItem" TIMESTAMP NOT NULL,
   "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
   "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
   CONSTRAINT fk_user
   FOREIGN KEY ("userId")
   REFERENCES "User"("id")
   ON DELETE CASCADE
   );

-- Добавление поля gameCreateTimeId в таблицу User
ALTER TABLE "User"
ADD COLUMN "gameCreateTimeId" INT;

-- Добавление внешнего ключа для связи с таблицей GameCreateTime
ALTER TABLE "User"
ADD CONSTRAINT fk_user_game_create_time
FOREIGN KEY ("gameCreateTimeId")
REFERENCES "GameCreateTime"("id")
ON DELETE SET NULL;