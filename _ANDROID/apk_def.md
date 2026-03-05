Пошагово: как выбрать и собрать APK с защитой
Твой скриншот показывает старое меню (в новых версиях Android Studio оно немного другое, но принцип тот же).
Правильный путь в 2025–2026 (Android Studio Narwhal / Opossum / Giraffe и выше):

В верхнем меню: Build → Generate Signed Bundle / APK...
(или правой кнопкой на модуле app → Build → Generate Signed Bundle / APK...)
В открывшемся окне выбери APK (не Bundle, если хочешь именно APK-файл)<img src="https://i.imgur.com/XXXXX.png" width="400" alt="Generate Signed APK">
Нажми Next
Выбери или создай keystore (файл подписи):
Если у тебя уже есть keystore (.jks или .keystore) — нажми Choose existing... → укажи путь, введи пароли
Если нет — нажми Create new...
Key store path: выбери куда сохранить (например G:\AndroidStudio\my-release-key.jks)
Password: придумай надёжный (запомни!)
Key alias: например "ardua-key"
Key password: обычно такой же как store password
Validity (years): 25–30
Certificate: заполни имя/организацию (можно любое)
Нажми OK


На следующем экране:
Build variant: выбери release (обязательно!)
Signature versions: поставь галочки V1 и V2 (V3/V4 можно, но V1+V2 — минимум для старых устройств)
Нажми Finish

Дождись сборки (может занять 1–5 минут, в зависимости от ПК)
Готовый APK найдёшь здесь:textG:\AndroidStudio\ARduA\app\release\app-release.apk


Как проверить, что защита работает

Установи app-release.apk на телефон.
Открой APK в JADX-GUI (скачай с https://github.com/skylot/jadx):
Увидишь, что код в MainActivity и других классах почти нечитаемый (имена вроде a.a.b.c(), логика запутана).
Распакуй APK (переименуй в .zip) → зайди в lib/arm64-v8a/libnative-lib.so → открой в Ghidra или IDA Free — без дополнительной обфускации читаемо, с OLLVM — почти невозможно разобрать.


Скачай Eclipse Temurin JDK 21 (от Adoptium) — https://adoptium.net/temurin/releases/
Выбери JDK 21 → Windows → x64 → .msi или .zip
Установи (msi) или распакуй zip и добавь в PATH

java -version