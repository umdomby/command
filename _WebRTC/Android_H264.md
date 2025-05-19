https://chatgpt.com/c/682a0647-38c4-800b-8fe0-e0442c5ab3a4
sudo apt update
sudo apt install -y git python3 python3-pip python3-setuptools \
curl unzip gnupg openjdk-17-jdk cmake ninja-build clang build-essential \
pkg-config yasm libgtk-3-dev libnss3-dev libxss1 libasound2-dev


2. Установка depot_tools
   bash
   Копировать
   Редактировать
   cd ~
   git clone https://chromium.googlesource.com/chromium/tools/depot_tools.git
   echo 'export PATH=$PATH:$HOME/depot_tools' >> ~/.bashrc
   source ~/.bashrc

# Очистите предыдущий каталог (если был)
   bash
   Копировать
   Редактировать
   rm -rf ~/webrtc-android
   mkdir ~/webrtc-android
   cd ~/webrtc-android
# Включите логирование Git и Curl
   bash
   Копировать
   Редактировать
   export GIT_TRACE=1
   export GIT_CURL_VERBOSE=1
   export DEPOT_TOOLS_UPDATE=0  # отключим автообновление
   fetch --nohooks webrtc_android



cd ~/webrtc-android/src
mkdir -p out/android_arm64
```
gn gen out/Release --args='
is_debug=false
rtc_use_h264=true
rtc_enable_libopenh264=true
ffmpeg_branding="Chrome"
rtc_include_tests=false
target_cpu="x64"
use_rtti=true
use_custom_libcxx=false
'
```
ninja -C out/android_arm64



### Альтернатива: вручную без fetch ###

Если fetch продолжает виснуть, можно обойтись напрямую через gclient:

1. Создайте .gclient:
   bash
   Копировать
   Редактировать
   mkdir -p ~/webrtc-android/src
   cd ~/webrtc-android
   gclient config --name=src https://webrtc.googlesource.com/src.git
2. Синхронизация зависимостей:
   bash
   Копировать
   Редактировать
   cd ~/webrtc-android
   gclient sync --nohooks --no-history
### #


### Android SDK/NDK ###
cd ~/webrtc-android/src
🛠 5. Подготовка Android-инструментов
# WebRTC автоматически подтянет Android SDK/NDK. Проверим:

ls third_party/android_toolchain
# Если надо — можно задать свои переменные:

export ANDROID_SDK_ROOT=$HOME/Android/Sdk
export ANDROID_NDK_ROOT=$ANDROID_SDK_ROOT/ndk/25.2.9519653
⚙️ 6. Генерация конфигурации (с поддержкой H264)
Создай конфигурацию для Android:

bash
Копировать
Редактировать
mkdir -p out/android_arm64
gn gen out/android_arm64 --args='
target_os="android"
target_cpu="arm64"
is_debug=false
is_component_build=false
use_rtti=true
rtc_use_h264=true
rtc_include_tests=false
rtc_enable_android_aaudio=false
enable_libaom=false
ffmpeg_branding="Chrome"
use_custom_libcxx=false
'
rtc_use_h264=true — включает поддержку H264
rtc_include_tests=false — исключает тесты, уменьшает размер сборки
is_component_build=false — создаёт единый libwebrtc.jar и .so

🔨 7. Сборка
bash
Копировать
Редактировать
ninja -C out/android_arm64
Или можно указать конкретные цели:

bash
Копировать
Редактировать
ninja -C out/android_arm64 libwebrtc jar
Результаты:

.so файлы в out/android_arm64/obj

libwebrtc.jar в out/android_arm64/lib.java

📦 8. Использование результатов
Извлекай и подключай:

libwebrtc.jar — Java API

libwebrtc.so — для jniLibs в Android

✅ 9. Проверка H264
Поддержка H264 должна быть включена по флагу. Для проверки:

Логируй кодеки в Android-приложении.

Убедись, что VideoEncoderFactory возвращает H264.

🧩 10. (Опционально) Включение OpenH264
Если хочешь аппаратный/софт H264:

Собери openh264 (https://github.com/cisco/openh264)

Укажи путь к нему в args.gn:

text
Копировать
Редактировать
rtc_enable_libopenh264=true
rtc_libopenh264_path="/absolute/path/to/openh264"
Хочешь — могу собрать скрипт сборки под Android или сделать Gradle-шаблон подключения.
### #


### OpenH264 ###
Шаг 2. Сборка Cisco OpenH264
1. Клонируем:
   bash
   Копировать
   Редактировать
   cd ~
   git clone https://github.com/cisco/openh264.git
   cd openh264
2. Сборка для Android (arm64)
   Убедитесь, что ANDROID_NDK_ROOT указывает на актуальный NDK:

bash
Копировать
Редактировать
export ANDROID_NDK_ROOT=~/webrtc-android/src/third_party/android_ndk/android-ndk-r25
3. Сборка:
   bash
   Копировать
   Редактировать
   make OS=android NDKROOT=$ANDROID_NDK_ROOT ARCH=arm64
   Результат:

libopenh264.so или libopenh264.a в openh264/lib/android/arm64

🧩 Шаг 3. Подключить openh264 в WebRTC
Допиши в args.gn:

gn
Копировать
Редактировать
rtc_use_h264=true
rtc_enable_libopenh264=true
rtc_libopenh264_path="/home/youruser/openh264"
Полный пример:

bash
Копировать
Редактировать
gn gen out/android_arm64 --args='
target_os="android"
target_cpu="arm64"
is_debug=false
is_component_build=false
rtc_use_h264=true
rtc_enable_libopenh264=true
rtc_libopenh264_path="/home/pi/openh264"
rtc_include_tests=false
use_custom_libcxx=false
'
Замените путь на ваш реальный.

🔨 Шаг 4. Сборка WebRTC с OpenH264
bash
Копировать
Редактировать
ninja -C out/android_arm64
✅ Проверка
После сборки:

libwebrtc.so будет содержать H264 (используя openh264)

В Android можно проверить MediaCodecVideoEncoderFactory или SoftwareVideoEncoderFactory

❗Важно
OpenH264 от Cisco — бесплатный, но требует лицензии при распространении.

Для некоммерческого или личного использования — можно спокойно использовать
### #
cd ~/openh264
export ANDROID_NDK_ROOT=~/webrtc-android/src/third_party/android_ndk/android-ndk-r25
make OS=android NDKROOT=$ANDROID_NDK_ROOT TARGET=aarch64

openh264/lib/android/aarch64/libopenh264.a