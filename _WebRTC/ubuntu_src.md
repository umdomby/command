Решение
1. Преобразовать все файлы в Unix-формат (LF)
   В WSL выполните:

bash
# Установите dos2unix, если ещё не установлен
sudo apt-get update && sudo apt-get install -y dos2unix

# Перейдите в корень репозитория WebRTC
cd /mnt/c/webrtc/src

# Рекурсивно преобразуйте все файлы
find . -type f -print0 | xargs -0 dos2unix
2. Убедитесь, что установлены все зависимости
   bash
   sudo apt-get install -y python3 python3-pip git curl unzip
3. Повторите сборку
   bash
# Очистите предыдущую попытку (если нужно)
rm -rf out/Debug

# Задайте переменные окружения
export ANDROID_HOME="/mnt/c/Users/PC1/AppData/Local/Android/Sdk"
export ANDROID_NDK_ROOT="$ANDROID_HOME/ndk/25.2.9519653"

# Запустите генерацию
gn gen out/Debug --args='target_os="android" target_cpu="arm64"'
Если проблема сохраняется
Проверьте NDK:
Убедитесь, что NDK установлен по указанному пути:

bash
ls -la $ANDROID_NDK_ROOT
Используйте другой Python:
Попробуйте явно указать Python:

bash
export PYTHON=python3
gn gen out/Debug --args='target_os="android" target_cpu="arm64"'
Соберите в Docker:
Если ничего не помогает, используйте официальный образ для сборки:

bash
docker run -it --rm -v /mnt/c/webrtc:/webrtc gcr.io/webrtc-buildstep/webrtc-build:latest
cd /webrtc/src
gn gen out/Debug --args='target_os="android" target_cpu="arm64"'