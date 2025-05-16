https://fbflipper.com/

sudo apt update && sudo apt upgrade -y
! npm install -g flipper
or
yarn global add flipper

! npx flipper-server

# Библиотека keytar (для безопасного хранения паролей) требует libsecret.
sudo apt update && sudo apt install -y libsecret-1-dev

# Установите Android SDK в WSL2:
sudo apt install -y android-sdk
# Найдите путь к adb:
which adb
/usr/bin/adb

# добавьте путь в settings.json (если файл не существует, создайте его):
echo '{"androidHome":"/usr/bin/adb"}' > settings.json
# Если ADB не нужен, отключите его в настройках:
echo '{"enableAndroid":false}' > settings.json


Если ADB не найден:
Установи platform-tools отдельно:

bash
sudo apt install -y android-sdk-platform-tools
Альтернативное решение:
Создай симлинк, если Flipper ищет ADB в /opt/android_sdk:

bash
sudo mkdir -p /opt
sudo ln -s /usr/lib/android-sdk /opt/android_sdk
Перезапусти Flipper после изменений.

Дополнительные проверки:
Убедись, что ADB работает:

bash
adb devices


adb devices


Сначала подключись по USB (хотя бы раз):

bash
adb tcpip 5555      # Переводит ADB в режим TCP/IP
adb connect 192.168.1.179:5555  # IP телефона в локальной сети
Отключи USB и проверь:

bash
adb devices         # Должен показать устройство по IP