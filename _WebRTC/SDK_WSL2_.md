1. Исправление структуры папок Android SDK
   Чтобы sdkmanager работал корректно, нужно переместить содержимое ~/android-sdk/tools в ~/android-sdk/cmdline-tools/latest.

Выполните следующие команды:

bash

Копировать
cd ~/android-sdk
mkdir -p cmdline-tools/latest
mv tools/* cmdline-tools/latest/
rm -rf tools
Проверьте, что структура теперь выглядит так:

bash

Копировать
ls ~/android-sdk/cmdline-tools/latest/bin



# итог
"\\wsl.localhost\Ubuntu-24.04\home\pi\android-sdk\cmdline-tools\latest\bin"
"\\wsl.localhost\Ubuntu-24.04\home\pi\android-sdk\cmdline-tools\latest\lib"


# Установка компонентов Android SDK
# Теперь установите необходимые компоненты:
sdkmanager --sdk_root=$ANDROID_HOME "platform-tools" "platforms;android-36" "build-tools;36.0.0"


# Проверьте, что компоненты установлены:
ls ~/android-sdk/platform-tools
ls ~/android-sdk/platforms/android-36
ls ~/android-sdk/build-tools/36.0.0


# Установка Android NDK Установите NDK версии 29.0.13113456:
sdkmanager --sdk_root=$ANDROID_HOME "ndk;28.1.13356709"
# Проверьте, что NDK установлен:
ls ~/android-sdk/ndk/28.1.13356709

# Установка Android NDK Установите NDK версии 29.0.13113456:
sdkmanager --sdk_root=$ANDROID_HOME "ndk;29.0.13113456"
# Проверьте, что NDK установлен:
ls ~/android-sdk/ndk/29.0.13113456


# Установка Android NDK Установите NDK версии 29.0.13113456:
sdkmanager --sdk_root=$ANDROID_HOME "21.4.7075529"
# Проверьте, что NDK установлен:
