✅ Актуальная стабильная версия WebRTC
На момент мая 2025 года последняя стабильная версия WebRTC — M135, 
соответствующая ветке branch-heads/7049. 
Коммит этой версии: 04413d62f754a7b1a3a2d8c3df23bcde040112b2.


🔄 Переключение на актуальную версию
Перейди в директорию исходников WebRTC:

bash
Копировать
Редактировать
cd ~/webrtc-android/src
Сбрось текущее состояние и очисти неотслеживаемые файлы:

bash
Копировать
Редактировать
git reset --hard
git clean -fd
Обнови удалённые ветки и переключись на main:

bash
Копировать
Редактировать
git fetch origin
git checkout main
git pull
Синхронизируй зависимости:

bash
Копировать
Редактировать
gclient sync