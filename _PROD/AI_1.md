Сохраненные комнаты:


model SavedRoom {
id          Int           @id @default(autoincrement())
userId      Int
user        User          @relation(fields: [userId], references: [id])
devicesId   Int?          @unique
devices     Devices?      @relation(fields: [devicesId], references: [id])
roomId      String        @unique
isDefault   Boolean       @default(false)
autoConnect Boolean       @default(false)
createdAt   DateTime      @default(now())
updatedAt   DateTime      @updatedAt
proxyAccess ProxyAccess[] // Связь с моделью ProxyAccess
}

model SavedProxy {
id          Int      @id @default(autoincrement())
userId      Int
proxyRoomId String
isDefault   Boolean  @default(false)
autoConnect Boolean  @default(false)
user        User     @relation(fields: [userId], references: [id])
createdAt   DateTime @default(now())
updatedAt   DateTime @updatedAt
}


у одного пользователя может быть только один checkbox true из: SavedRoom isDefault и SavedProxy isDefault
isDefault которого подставляется в
<Input
id="room"
value={roomId}
onChange={handleRoomIdChange}
disabled={isInRoom || isJoining}
placeholder="XXXX-XXXX-XXXX-XXXX"
maxLength={19}
/>

если я выбираю чекбокс из таблицы SavedRoom то все чебоксы этого пользователя в SavedProxy isDefault будут  false и на оборот


