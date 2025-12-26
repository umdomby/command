нужно сделать страничку оформление страховки и компонент
\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\app\(root)\get-insurance\page.tsx
\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\components\get-insurance\get-insurance-start.tsx

мне нужно чтобы пользователь мог оформить страховку при нажатии на кнопку, <p className="text-sm text-gray-500 m-1">Оформить страховку</p>


Страхование при несчастных случаях (авариях) повлекшее к серьезному ухудшению здоровью не связанного с возрастными или иными заболеваниями.
пользователь без регистрации заполняет

если пользователь не зарегистрирован - предложить ему регистрацию
<AuthModal open={openAuthModal} onClose={() => setOpenAuthModal(false)} />

Выбрать из списка форму оплаты (из базы данных)
model Product {
id         Int           @id @default(autoincrement())
name       String        @unique
categoryId Int
category   Category      @relation(fields: [categoryId], references: [id])
items      ProductItem[]
}

чекбоксом выбрать:
50$ на год
150$ на 4 года


Создание заявки Input
- ФИО, одна строчка
- дата рождения
- номер телефона, одна строчка
- Для связи: mobile, telegram, WhatsApp, Viber  - можно выбрать несколько
- Кнопка заказать
(если пользователь авторизирован, поле ФИО подставляется из базы)
- загрузить img в \\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\public\bank подтверждение оплаты файлом или из буфера (чтобы можно было вставить изображение в поле cntr+v)

model Insurance {

}

Администратору UserRole ADMIN  \\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\app\(root)\profile\admin\page.tsx  (добавь ссылку на страничку для администратора в
\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\app\(root)\profile\page.tsx
)
\\wsl.localhost\Ubuntu-24.04\home\umdom\projects\prod\docker-ardu\components\profile\profile-admin.tsx
должны показываться заказы аккордионом при нажатии на который раскрываются данные об всех заявках. сначала новые с отображением даты


так же у самих пользователей должны отображаться оплата, и чтобы они могли редактировать свои заявки включая изменения изображения, при загрузки нового изображения старое изображение должно удаляться.


дай полностью рабочий код
не забудь что пользователь должен выбрать способ оплаты model Bank

model ProductItem Product Category - эти модели никак не должны быть подключены к этому заданию.


