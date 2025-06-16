Я добавил одну модель, чтобы пользователь мог сохранять proxy доступ

model SavedProxy {
id          Int      @id @default(autoincrement())
userId      Int
proxyRoomId String
isDefault   Boolean  @default(false)
user        User     @relation(fields: [userId], references: [id])
createdAt   DateTime @default(now())
updatedAt   DateTime @updatedAt
}


перед сохранением комнаты нужно проверить есть ли она в SavedRoom roomId  и  ProxyAccess  proxyRoomId
если комнаты нет там и там то сохраняется в SavedRoom roomId
если комната есть в SavedRoom roomId то уточняется в диалоговом окне пользователю: такая комната уже существует
если комната есть в ProxyAccess proxyRoomId то комната сохраняется в model SavedProxy proxyRoomId

можно множество комнат создавать в SavedProxy


при загрузке должны показывать все
Сохраненные комнаты:
и
Сохраненные комнаты proxy:


по умолчанию нужно сделать доработку по  isDefault   Boolean  @default(false) в SavedRoom и SavedProxy
можно только установить одно  дефолтное значение для Сохраненные комнаты Сохраненные комнаты proxy:
если выбираем isDefault для SavedProxy то у всех SavedRoom isDefault будет false и на оборот

ЕЩЕ РАЗ для долбоебов, только один чекбокс isDefault может быть true во всех сохраненных полях proxy и целевых

отвечай на русском.




