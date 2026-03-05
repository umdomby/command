apk
В верхнем меню → Build → Build Bundle(s) / APK(s) → Build APK(s)
Дождись окончания сборки
В правом нижнем углу появится уведомление → кликни locate (или найди вручную)



# Native
В верхнем меню Android Studio кликни Tools (Инструменты)
Выбери SDK Manager (это прямой ярлык, работает всегда)
Или используй иконку в тулбаре (обычно выглядит как кубик/андроид с шестерёнкой, справа от поиска — иногда нужно включить в View → Appearance → Toolbar)
После открытия SDK Manager:
Перейди на вкладку SDK Tools (вторая вкладка сверху)
Поставь галочки:
NDK (Side by side) — выбери нужную версию (рекомендую последнюю, например 27.x или 28.x)
CMake (обычно 3.22+ или новее)


--> слон


Удали эти папки (они безопасно пересоздадутся):
G:\AndroidStudio\ARduA\app\build
G:\AndroidStudio\ARduA\.gradle (или хотя бы подпапку build-cache-* внутри неё)
G:\AndroidStudio\ARduA\app\.cxx (если есть)
Открой проект заново → File → Invalidate Caches... → отметь все галочки → Invalidate and Restart


Временный обход (если срочно нужно запустить)
В файле AndroidManifest.xml измени иконку на встроенную (чтобы Gradle не искал твою):XML<application
...
android:icon="@mipmap/ic_launcher"
android:roundIcon="@mipmap/ic_launcher_round"
...>Убедись, что атрибуты именно такие (они уже должны быть). Если хочешь совсем отключить проверку — временно закомментируй строку с ic_launcher в манифесте (но потом верни).

После любого из фиксов

File → Sync Project with Gradle Files
Build → Clean Project
Build → Rebuild Project
Подключи телефон → зелёная стрелка Run


gradle/libs.versions.toml




Проблема с правами или антивирусом/Defender
Запусти Android Studio от имени администратора (правой кнопкой на ярлыке → Запуск от имени администратора)
Добавь исключение в Windows Defender:
Параметры → Обновление и безопасность → Защита от вирусов и угроз → Управление настройками → Исключения → Добавить исключение → Папка → укажи G:\AndroidStudio\ARduA

Если антивирус сторонний — добавь исключение для всей папки проекта.


