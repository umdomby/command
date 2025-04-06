# На Windows:
# Убедитесь, что установлен Android Studio и Android SDK (через SDK Manager).
# Запомните путь к SDK (обычно C:\Users\<User>\AppData\Local\Android\Sdk).
C:\Users\PC1\AppData\Local\Android\Sdk
# Peparing "Install Android Emulator v.35.4.9".

adb connect 192.168.1.151:5555 

# Настройка для Android
   Добавьте разрешения в файл:
   android/app/src/main/AndroidManifest.xml
```
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```
# Синхронизация Gradle (для Android)
cd android && ./gradlew clean && cd ..

# Запуск Metro-сервера
npx react-native start
(Оставьте этот терминал открытым.)

# Запуск приложения на Android
npx react-native run-android

# ERROR
sudo apt update && sudo apt install -y adb

# В WSL2 пропишите путь к SDK в ~/.bashrc или ~/.zshrc:
export ANDROID_HOME=/mnt/c/Users/ВАШ_ПОЛЬЗОВАТЕЛЬ/AppData/Local/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/emulator

# Обновите конфиг:
source ~/.bashrc

# Создайте файл android/local.properties в проекте:
echo "sdk.dir=$ANDROID_HOME" > android/local.properties

# Проверьте подключение устройства
adb devices

# Если устройство не найдено:
adb connect localhost:5555  # Для эмулятора
adb kill-server && adb start-server


# Запуск на реальном устройстве (рекомендуется)
# Включите Режим разработчика на телефоне.
# Подключите по USB и разрешите отладку.
npx react-native run-android


⚠️ Если эмулятор нужен
# Запустите эмулятор в Windows через Android Studio.
adb connect localhost:5555


# Убедитесь, что Java JDK установлен:
sudo apt install -y openjdk-11-jdk

# Проверьте переменные среды:
echo $ANDROID_HOME
which adb


✅ После исправлений
# Очистите кеш Gradle:
cd android && ./gradlew clean && cd ..