https://api.telegram.org/bot8030776194:AAHGFpXqwIFVl38YV9W1TixopXDdKopP5rY/sendMessage.
https://api.telegram.org/bot8030776194:AAHGFpXqwIFVl38YV9W1TixopXDdKopP5rY/getUpdates

```
curl -X POST \
  -H 'Content-Type: application/json' \
  -d '{"chat_id": 5112905163, "text": "Привет! Это ответ от бота."}' \
  https://api.telegram.org/bot8030776194:AAHGFpXqwIFVl38YV9W1TixopXDdKopP5rY/sendMessage
```


# Настройка Telegram Bot для оповещения сигнализации
Откройте Telegram и найдите @BotFather:
Запустите приложение Telegram на телефоне, компьютере или в веб-версии.
В строке поиска введите @BotFather и выберите официального бота (он будет с синей галочкой верификации).
Нажмите кнопку Start (или отправьте команду /start).
Создайте нового бота: /newbot
Отправьте команду /newbot.
BotFather попросит вас придумать имя бота (например, MySecurityBot). Это отображаемое имя, оно может быть любым.
Затем введите username бота, который должен заканчиваться на _bot или Bot (например, @MySecurityBot). Username должен быть уникальным.

Получите токен бота:
После успешного создания бота BotFather отправит вам сообщение с токеном (это строка вида 1234567890:ABCDEF1234567890abcdef1234567890) - установите его в Telegram Token.

Через поиск зайдите в ваш только что созданный @MySecurityBot и отправьте /start
Через браузер отправьте https://api.telegram.org/1234567890:ABCDEF1234567890abcdef1234567890/getUpdates
Вам придет сообщение такого вида:
{"ok":true,"result":[{"update_id":96165655,
"message":{"message_id":1,"from":{"id":5112905163,"is_bot":false,"first_name":"Pi","username":"navatar85","language_code":"ru"},"chat":{"id":5112905163,"first_name":"Pi","username":"navatar85","type":"private"},"date":1750762444,"text":"/start","entities":[{"offset":0,"length":6,"type":"bot_command"}]}}]}pi@PC1:~$
id в этом месте 5112905163 - это ващ ID установите его в поле Telegram ID

Скопируйте этот токен и сохраните в безопасном месте. Он понадобится для настройки сервера (например, для вставки в TELEGRAM_BOT_TOKEN в коде server.ts).



(Опционально) Настройте бота:
Если хотите, задайте описание бота через команду /setdescription или добавьте другие настройки с помощью команд, которые предложит BotFather (например, /setcommands для пользовательских команд).
Важно:

Никому не передавайте токен бота, так как он дает полный контроль над ботом.
Если токен утерян, вы можете сгенерировать новый с помощью команды /token в диалоге с BotFather (выберите нужного бота из списка).
Пример:

Вы отправляете: /newbot
BotFather: "Alright, a new bot. How are we going to call it? Please choose a name for your bot."
Вы: MySecurityBot
BotFather: "Good. Now let's choose a username for your bot. It must end in bot. Like @NiceBot or @LondonBot"
Вы: @MySecurityBot
BotFather: "Done! Congratulations on your new bot. Your bot token is: 1234567890:ABCDEF1234567890abcdef1234567890"
Теперь вставьте полученный токен в переменную TELEGRAM_BOT_TOKEN в коде сервера (server.ts) из предыдущего ответа.


# t.me/ArduarBot.
https://grok.com/chat/b58d048a-ed33-4432-8731-91dc6dc03236

curl https://api.telegram.org/7861501595:AAGEDzbeBVLVVLkzffreI5OX-aRjmGWkcw8/getUpdates

1. Инициализируйте диалог с ботом
   Чтобы получить chat_id для личного чата с @navatar85:

Найдите вашего бота в Telegram по его имени (например, @MySecurityBot, созданного с токеном 7861501595:AAGEDzbeBVLVVLkzffreI5OX-aRjmGWkcw8).
Отправьте боту сообщение, например:
/start


pi@PC1:~$ curl https://api.telegram.org/bot8030776194:AAHGFpXqwIFVl38YV9W1TixopXDdKopP5rY/getUpdates
{"ok":true,"result":[{"update_id":96165655,
"message":{"message_id":1,"from":{"id":5112905163,"is_bot":false,"first_name":"Pi","username":"navatar85","language_code":"ru"},"chat":{"id":5112905163,"first_name":"Pi","username":"navatar85","type":"private"},"date":1750762444,"text":"/start","entities":[{"offset":0,"length":6,"type":"bot_command"}]}}]}pi@PC1:~$

curl https://api.telegram.org/bot7861501595:AAGEDzbeBVLVVLkzffreI5OX-aRjmGWkcw8/getUpdates

1. Получите числовой chat_id
   Добавьте бота в чат:
   Если @navatar85 — это ваш личный аккаунт, начните диалог с ботом, отправив ему любое сообщение (например, /start).
   Если это канал или группа, добавьте бота в неё как участника или администратора с правом отправки сообщений.
   Узнайте chat_id:
   Отправьте боту любое сообщение (например, test) в чате @navatar85.
   Затем выполните HTTP-запрос к Telegram API, чтобы получить обновления:
   text

Свернуть

Перенос

Копировать
https://api.telegram.org/botВАШ_ТОКЕН_БОТА/getUpdates
Замените ВАШ_ТОКЕН_БОТА на ваш токен (например, 7861501595:AAGEDzbeBVLVVLkzffreI5OX-aRjmGWkcw8). Выполните запрос в браузере или с помощью curl:
bash

Свернуть

Перенос

Исполнить

Копировать
curl https://api.telegram.org/bot7861501595:AAGEDzbeBVLVVLkzffreI5OX-aRjmGWkcw8/getUpdates
В ответе найдите JSON-объект с полем chat, где будет id (например, 123456789 для личного чата или -100123456789 для группы/канала). Это и есть числовой chat_id.
2. Обновите код сервера
   В файле server.ts замените TELEGRAM_CHAT_ID на полученный числовой chat_id. Найдите строку:

typescript

Свернуть

Перенос

Исполнить

Копировать
const TELEGRAM_CHAT_ID = '@navatar85'; // ID чата или имя пользователя
Замените её на:

typescript

Свернуть

Перенос

Исполнить

Копировать
const TELEGRAM_CHAT_ID = '123456789'; // Замените на числовой chat_id, полученный из getUpdates
Пример: Если ваш chat_id из getUpdates — это 123456789, строка будет:

typescript

Свернуть

Перенос

Исполнить

Копировать
const TELEGRAM_CHAT_ID = '123456789';