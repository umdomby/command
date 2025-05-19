echo $ANDROID_SDK_ROOT

# Если она не установлена или указывает на неверный путь, настройте её:
export ANDROID_SDK_ROOT=$HOME/android/sdk
echo 'export ANDROID_SDK_ROOT=$HOME/android/sdk' >> ~/.bashrc
source ~/.bashrc


sdkmanager --sdk_root=$HOME/android/sdk "platforms;android-36"


sdkmanager --install "ndk;28.1.13356709"
sdkmanager --install "ndk;29.0.13113456"
sdkmanager --install "ndk;25.1.8937393"

# Затем измените настройки сборки WebRTC, чтобы использовать API 34. Откройте файл
out/Debug/args.gn и убедитесь, что параметры сборки соответствуют:

target_os = "android"
target_cpu = "arm64"
is_debug = true
android_api_level = 36



export ANDROID_NDK=/home/pi/android/sdk/ndk/25.1.8937393
export ANDROID_NDK_HOME=/home/pi/android/sdk/ndk/25.1.8937393

echo $ANDROID_NDK_HOME

sdkmanager --sdk_root=$ANDROID_SDK_ROOT "ndk;25.1.8937393"


echo $ANDROID_NDK

ls $ANDROID_NDK/toolchains/llvm/prebuilt/linux-x86_64/sysroot/usr/lib
