npx prisma migrate dev --name make-carModelId-optional

```PostgreSQL
CREATE TABLE "CarModel" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    productId INT NOT NULL,
    FOREIGN KEY (productId) REFERENCES "Product"(id) ON DELETE CASCADE
);
```
```
id SERIAL PRIMARY KEY: Поле id, которое также является первичным ключом и будет автоматически увеличиваться.
name VARCHAR(255) NOT NULL: Поле для хранения названия автомобиля, обязательное для заполнения.
productId INT NOT NULL: Поле, которое ссылается на id в таблице Product.
FOREIGN KEY (productId) REFERENCES Product(id) ON DELETE CASCADE: Устанавливает связь с таблицей Product, 
где productId ссылается на id. Опция ON DELETE CASCADE означает, что если запись в таблице Product будет удалена, 
то соответствующие записи в таблице CarModel также будут удалены.
```
```PostgreSQL
ALTER TABLE carmodel RENAME TO "CarModel";
```

```PostgreSQL
ALTER TABLE "GameRecords"
ADD COLUMN "car" VARCHAR(255);
```
```PostgreSQL
ALTER TABLE "GameRecords"
DROP COLUMN "car"; 
```

```psql update add carModelId + relations "GameRecords"
ALTER TABLE "GameRecords"
ADD COLUMN "carModelId" INT;

ALTER TABLE "GameRecords"
ADD CONSTRAINT fk_game_records_car_model
FOREIGN KEY ("carModelId")
REFERENCES "CarModel"("id")
ON DELETE SET NULL;
```

```psql
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
```