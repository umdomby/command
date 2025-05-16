основными проблемами при сборке WebRTC для Android

https://github.com/cisco/openh264.git third_party/openh264
gn gen out/Debug --args='target_os="android" target_cpu="arm64" rtc_use_h264=true proprietary_codecs=true is_debug=false'

nano ~/webrtc/src/out/Debug/args.gn

# find SDK
find ~ -name "sdk" -type d 2>/dev/null


/home/pi/projects/docker/docker-ardua/node_modules/@modelcontextprotocol/sdk
/home/pi/webrtc/src/third_party/cardboard/src_overrides/sdk
/home/pi/webrtc/src/third_party/blink/web_tests/http/tests/devtools/sdk
/home/pi/webrtc/src/third_party/catapult/devil/devil/android/sdk
/home/pi/webrtc/src/third_party/perfetto/examples/sdk
/home/pi/webrtc/src/sdk
/home/pi/webrtc/src/out/Debug/obj/sdk
/home/pi/webrtc/src/out/Debug/gen/sdk
/home/pi/.cache/yarn/v6/npm-@modelcontextprotocol-sdk-1.11.0-9f1762efe6f3365f0bf3b019cc9bd1629d19bc50-integrity/node_modules/@modelcontextprotocol/sdk


# find NDK
find ~ -name "ndk" -type d 2>/dev/null

/home/pi/webrtc/src/third_party/catapult/devil/devil/android/ndk
/home/pi/webrtc/src/third_party/mediapipe/shims/ndk
/home/pi/android-sdk/ndk



# Если NDK/SDK не найдены
Установите их заново:
Скачайте Android SDK:

bash
mkdir -p ~/android-sdk
cd ~/android-sdk
wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip
unzip commandlinetools-linux-9477386_latest.zip
Установите NDK через sdkmanager:

bash
cd ~/android-sdk/cmdline-tools/bin
./sdkmanager --install "ndk;25.2.9519653"


# Убедитесь, что пути верны:
echo $ANDROID_SDK_ROOT
echo $ANDROID_NDK_ROOT
ls -l $ANDROID_NDK_ROOT


# Обычные пути:

/home/pi/android-sdk/ndk/[версия] (например, 25.2.9519653)

/home/pi/Android/Sdk/ndk/[версия]

2. Установка переменных окружения
   Добавьте пути в ~/.bashrc (если используете bash):

bash
echo 'export ANDROID_SDK_ROOT=/home/pi/android-sdk' >> ~/.bashrc
echo 'export ANDROID_NDK_ROOT=/home/pi/android-sdk/ndk/25.2.9519653' >> ~/.bashrc
source ~/.bashrc