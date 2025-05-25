"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc-android\src\out\Debug\lib.java\sdk\android\libwebrtc.jar"



как мне собрать aar с нативными библиотеками для проекта ? Проект для Android устройств, желательно добавить все популярные архитектуры мобильных телефонов

arm64-v8a: Современные 64-битные устройства (большинство новых смартфонов).
armeabi-v7a: 32-битные устройства (старые или бюджетные модели).
x86: Эмуляторы и некоторые старые устройства.
x86_64: 64-битные эмуляторы и редкие устройства.


# WebRTC для всех архитектур, нужно создать отдельные директории сборки для каждой ABI. Например:
https://grok.com/chat/824461a6-9d6f-4ef5-97f5-813b4122f351

out/Debug-arm64-v8a для arm64-v8a
out/Debug-armeabi-v7a для armeabi-v7a
out/Debug-x86 для x86
out/Debug-x86_64 для x86_64

rm -rf out/Debug-arm64-v8a
cd ~/webrtc-android/src


export AUTONINJA_BUILD_ID=$RANDOM
# 1 # arm64-v8a
```
gn gen out/Debug-arm64-v8a --args='
rtc_system_openh264 = true
target_cpu = "arm64"
target_os = "android"
is_debug = true
target_sysroot = "/home/pi/android/sdk/ndk/25.1.8937393/toolchains/llvm/prebuilt/linux-x86_64/sysroot"
android_ndk_root = "/home/pi/android/sdk/ndk/25.1.8937393"
android_ndk_api_level = 24
android_sdk_platform_version = "36"
is_component_build = false
rtc_include_tests = false
treat_warnings_as_errors = false
'
```
ninja -C out/Debug-arm64-v8a webrtc

# 2 # armeabi-v7a
```
gn gen out/Debug-armeabi-v7a --args='
    rtc_system_openh264 = true
    target_cpu = "arm"
    target_os = "android"
    is_debug = true
    target_sysroot = "/home/pi/android/sdk/ndk/25.1.8937393/toolchains/llvm/prebuilt/linux-x86_64/sysroot"
    android_ndk_root = "/home/pi/android/sdk/ndk/25.1.8937393"
    android_ndk_api_level = 24
    android_sdk_platform_version = "36"
    is_component_build = false
    rtc_include_tests = false
    treat_warnings_as_errors = false
'
```
ninja -C out/Debug-armeabi-v7a webrtc

# 3 # x86
```
gn gen out/Debug-x86 --args='
    rtc_system_openh264 = true
    target_cpu = "x86"
    target_os = "android"
    is_debug = true
    target_sysroot = "/home/pi/android/sdk/ndk/25.1.8937393/toolchains/llvm/prebuilt/linux-x86_64/sysroot"
    android_ndk_root = "/home/pi/android/sdk/ndk/25.1.8937393"
    android_ndk_api_level = 24
    android_sdk_platform_version = "36"
    is_component_build = false
    rtc_include_tests = false
    treat_warnings_as_errors = false
'
```
ninja -C out/Debug-x86 webrtc

# 4 # x86_64
```
gn gen out/Debug-x86_64 --args='
    rtc_system_openh264 = true
    target_cpu = "x64"
    target_os = "android"
    is_debug = true
    target_sysroot = "/home/pi/android/sdk/ndk/25.1.8937393/toolchains/llvm/prebuilt/linux-x86_64/sysroot"
    android_ndk_root = "/home/pi/android/sdk/ndk/25.1.8937393"
    android_ndk_api_level = 24
    android_sdk_platform_version = "36"
    is_component_build = false
    rtc_include_tests = false
    treat_warnings_as_errors = false
'
```
ninja -C out/Debug-x86_64 webrtc

# логи сборки
ninja -C out/Debug-arm64-v8a webrtc | tee build.log



cd ~/openh264
make clean
make OS=android NDKROOT=$ANDROID_NDK_ROOT ARCH=arm64 TARGET=android-21 libraries
####
file ~/openh264/libopenh264.so
/home/pi/openh264/libopenh264.so: ELF 64-bit LSB shared object, ARM aarch64, version 1 (SYSV), dynamically linked, with debug_info, not stripped
###





cd ~/openh264
make clean
make OS=android NDKROOT=/home/pi/android/sdk/ndk/25.2.9519653 ARCH=arm64 TARGET=android-21 libraries
make OS=android NDKROOT=/home/pi/android/sdk/ndk/25.2.9519653 ARCH=arm TARGET=android-21 libraries
make OS=android NDKROOT=/home/pi/android/sdk/ndk/25.2.9519653 ARCH=x86 TARGET=android-21 libraries
make OS=android NDKROOT=/home/pi/android/sdk/ndk/25.2.9519653 ARCH=x86 TARGET=android-21 USE_ASM=No libraries
make OS=android NDKROOT=/home/pi/android/sdk/ndk/25.2.9519653 ARCH=x86_64 TARGET=android-21 libraries

file libopenh264.so
# ARM aarch64 libopenh264.so: ELF 64-bit LSB shared object, ARM aarch64, version 1 (SYSV), dynamically linked, not stripped

```
mkdir -p ~/openh264-libs/arm64-v8a
mkdir -p ~/openh264-libs/armeabi-v7a
mkdir -p ~/openh264-libs/x86
mkdir -p ~/openh264-libs/x86_64
cp ~/openh264/libopenh264.so ~/openh264-libs/arm64-v8a/
cp ~/openh264/libopenh264.so ~/openh264-libs/armeabi-v7a/  # После сборки для arm
cp ~/openh264/libopenh264.so ~/openh264-libs/x86/  # После сборки для x86
cp ~/openh264/libopenh264.so ~/openh264-libs/x86_64/
```


rm -f codec/common/src/cpu-features.o
cd ~/arm64-v8a
### openh264 ###
/home/pi/android/sdk/ndk/25.2.9519653/toolchains/llvm/prebuilt/linux-x86_64/bin/aarch64-linux-android21-clang \
-c /home/pi/android/sdk/ndk/25.2.9519653/sources/android/cpufeatures/cpu-features.c \
-o ~/openh264/codec/common/src/cpu-features.o \
-DANDROID_NDK -fpic -fstack-protector-all \
-Dandroid_getCpuIdArm=wels_getCpuIdArm \
-Dandroid_setCpuArm=wels_setCpuArm \
-Dandroid_getCpuCount=wels_getCpuCount \
-Dandroid_getCpuFamily=wels_getCpuFamily \
-Dandroid_getCpuFeatures=wels_getCpuFeatures \
-Dandroid_setCpu=wels_setCpu \
-I/home/pi/android/sdk/ndk/25.2.9519653/sysroot/usr/include \
-I/home/pi/android/sdk/ndk/25.2.9519653/sources/android/cpufeatures \
--target=aarch64-linux-android21

### armeabi-v7a ###
/home/pi/android/sdk/ndk/25.2.9519653/toolchains/llvm/prebuilt/linux-x86_64/bin/armv7a-linux-androideabi21-clang \
-c /home/pi/android/sdk/ndk/25.2.9519653/sources/android/cpufeatures/cpu-features.c \
-o ~/openh264/codec/common/src/cpu-features.o \
-DANDROID_NDK -fpic -fstack-protector-all \
-Dandroid_getCpuIdArm=wels_getCpuIdArm \
-Dandroid_setCpuArm=wels_setCpuArm \
-Dandroid_getCpuCount=wels_getCpuCount \
-Dandroid_getCpuFamily=wels_getCpuFamily \
-Dandroid_getCpuFeatures=wels_getCpuFeatures \
-Dandroid_setCpu=wels_setCpu \
-I/home/pi/android/sdk/ndk/25.2.9519653/sysroot/usr/include \
-I/home/pi/android/sdk/ndk/25.2.9519653/sources/android/cpufeatures \
--target=armv7a-linux-androideabi21

### x86 ###
/home/pi/android/sdk/ndk/25.2.9519653/toolchains/llvm/prebuilt/linux-x86_64/bin/i686-linux-android21-clang \
-c /home/pi/android/sdk/ndk/25.2.9519653/sources/android/cpufeatures/cpu-features.c \
-o ~/openh264/codec/common/src/cpu-features.o \
-DANDROID_NDK -fpic -fstack-protector-all \
-Dandroid_getCpuIdArm=wels_getCpuIdArm \
-Dandroid_setCpuArm=wels_setCpuArm \
-Dandroid_getCpuCount=wels_getCpuCount \
-Dandroid_getCpuFamily=wels_getCpuFamily \
-Dandroid_getCpuFeatures=wels_getCpuFeatures \
-Dandroid_setCpu=wels_setCpu \
-I/home/pi/android/sdk/ndk/25.2.9519653/sysroot/usr/include \
-I/home/pi/android/sdk/ndk/25.2.9519653/sources/android/cpufeatures \
--target=i686-linux-android21

### x86_64 ###
make clean
/home/pi/android/sdk/ndk/25.2.9519653/toolchains/llvm/prebuilt/linux-x86_64/bin/x86_64-linux-android21-clang \
-c /home/pi/android/sdk/ndk/25.2.9519653/sources/android/cpufeatures/cpu-features.c \
-o ~/openh264/codec/common/src/cpu-features.o \
-DANDROID_NDK -fpic -fstack-protector-all \
-Dandroid_getCpuIdArm=wels_getCpuIdArm \
-Dandroid_setCpuArm=wels_setCpuArm \
-Dandroid_getCpuCount=wels_getCpuCount \
-Dandroid_getCpuFamily=wels_getCpuFamily \
-Dandroid_getCpuFeatures=wels_getCpuFeatures \
-Dandroid_setCpu=wels_setCpu \
-I/home/pi/android/sdk/ndk/25.2.9519653/sysroot/usr/include \
-I/home/pi/android/sdk/ndk/25.2.9519653/sources/android/cpufeatures \
--target=x86_64-linux-android21
make OS=android NDKROOT=/home/pi/android/sdk/ndk/25.2.9519653 ARCH=x86_64 TARGET=android-21 libraries


```
gn gen out/Debug --args='
rtc_system_openh264 = true
target_cpu = "arm64"
target_os = "android"
is_debug = true
target_sysroot = "/home/pi/android/sdk/ndk/25.1.8937393/toolchains/llvm/prebuilt/linux-x86_64/sysroot"
android_ndk_root = "/home/pi/android/sdk/ndk/25.1.8937393"
android_ndk_api_level = 24
android_sdk_platform_version = "36"
is_component_build = false
rtc_include_tests = false
treat_warnings_as_errors = false
'
```

### FILE LIBS ###
"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc-android\src\out\Debug-arm64-v8a\lib.java\sdk\android\libwebrtc.jar"
"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc-android\src\out\Debug-armeabi-v7a\lib.java\sdk\android\libwebrtc.jar"
"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc-android\src\out\Debug-x86\lib.java\sdk\android\libwebrtc.jar"
"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc-android\src\out\ebug-x86_64\lib.java\sdk\android\libwebrtc.jar"
"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc-android\src\out\Debug-arm64-v8a\libjingle_peerconnection_so.so"
"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc-android\src\out\Debug-armeabi-v7a\libjingle_peerconnection_so.so"
"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc-android\src\out\Debug-x86\libjingle_peerconnection_so.so"
"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc-android\src\out\Debug-x86_64\libjingle_peerconnection_so.so"

"\\wsl.localhost\Ubuntu-24.04\home\pi\openh264-libs\arm64-v8a\libopenh264.so"
"\\wsl.localhost\Ubuntu-24.04\home\pi\openh264-libs\armeabi-v7a\libopenh264.so"
"\\wsl.localhost\Ubuntu-24.04\home\pi\openh264-libs\x86\libopenh264.so"
"\\wsl.localhost\Ubuntu-24.04\home\pi\openh264-libs\x86_64\libopenh264.so"



# Рекомендация: Используйте libwebrtc.jar из любой архитектуры, например, из arm64-v8a, так как это наиболее распространенная архитектура:
cp /home/pi/webrtc-android/src/out/Debug-arm64-v8a/lib.java/sdk/android/libwebrtc.jar /home/pi/aar_root/classes.jar
```
cat > /home/pi/aar_root/AndroidManifest.xml << EOF
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
package="org.webrtc">
</manifest>
EOF
```

/home/pi/aar_root
├── AndroidManifest.xml
├── classes.jar
├── R.txt
├── res/
├── assets/
└── jni/
├── arm64-v8a/
│   ├── libjingle_peerconnection_so.so
│   ├── libopenh264.so
├── armeabi-v7a/
│   ├── libjingle_peerconnection_so.so
│   ├── libopenh264.so
├── x86/
│   ├── libjingle_peerconnection_so.so
│   ├── libopenh264.so
├── x86_64/
│   ├── libjingle_peerconnection_so.so
│   ├── libopenh264.so

find /home/pi/aar_root

/home/pi/aar_root
/home/pi/aar_root/res
/home/pi/aar_root/jni
/home/pi/aar_root/jni/x86_64
/home/pi/aar_root/jni/x86_64/libjingle_peerconnection_so.so
/home/pi/aar_root/jni/x86_64/libopenh264.so
/home/pi/aar_root/jni/armeabi-v7a
/home/pi/aar_root/jni/armeabi-v7a/libjingle_peerconnection_so.so
/home/pi/aar_root/jni/armeabi-v7a/libopenh264.so
/home/pi/aar_root/jni/x86
/home/pi/aar_root/jni/x86/libjingle_peerconnection_so.so
/home/pi/aar_root/jni/x86/libopenh264.so
/home/pi/aar_root/jni/arm64-v8a
/home/pi/aar_root/jni/arm64-v8a/libjingle_peerconnection_so.so
/home/pi/aar_root/jni/arm64-v8a/libopenh264.so
/home/pi/aar_root/classes.jar
/home/pi/aar_root/R.txt
/home/pi/aar_root/AndroidManifest.xml
/home/pi/aar_root/assets

# Перейдите в папку /home/pi/aar_root и создайте .aar файл с помощью команды zip:
cd /home/pi/aar_root
zip -r /home/pi/webrtc.aar .
cd -

# Эта команда создаст /home/pi/webrtc.aar, который включает все файлы и папки из /home/pi/aar_root.

# Распакуйте AAR в временную папку, чтобы убедиться, что структура правильная:
mkdir /tmp/aar_check
cd /tmp/aar_check
unzip /home/pi/webrtc.aar
ls -R
cd -
rm -rf /tmp/aar_chec

# Убедитесь, что все файлы и папки (AndroidManifest.xml, classes.jar, R.txt, jni/*, res/, assets/) присутствуют.

6. Интеграция в проект
   Скопируйте /home/pi/webrtc.aar в папку libs вашего Android-проекта и добавьте в build.gradle модуля:

gradle

Копировать
dependencies {
implementation files('libs/webrtc.aar')
}

# Убедитесь, что ваш проект поддерживает все архитектуры:

gradle

Копировать
android {
defaultConfig {
ndk {
abiFilters 'arm64-v8a', 'armeabi-v7a', 'x86', 'x86_64'
}
}
}