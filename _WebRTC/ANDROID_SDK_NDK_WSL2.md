




echo $ANDROID_NDK
export ANDROID_NDK=/home/pi/android/sdk/ndk/28.1.13356709
ls $ANDROID_NDK/toolchains/llvm/prebuilt/linux-x86_64/sysroot/usr/lib


# Должно 
\\wsl.localhost\Ubuntu-24.04\home\pi\android\sdk\cmdline-tools\latest\bin
export PATH=$HOME/android/sdk/cmdline-tools/latest/bin:$PATH

# Добавь Android SDK Tools в PATH
# Открой терминал и выполни:
export PATH=$HOME/android/sdk/cmdline-tools/latest/bin:$PATH
# Чтобы путь сохранялся всегда, добавь его в ~/.bashrc или ~/.zshrc:
echo 'export PATH=$HOME/android/sdk/cmdline-tools/latest/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

```
sdkmanager --sdk_root=$HOME/android/sdk \
  "platform-tools" \
  "platforms;android-34" \
  "build-tools;34.0.0" \
  "ndk;25.2.9519653"
```
# license
yes | sdkmanager --licenses --sdk_root=$HOME/android/sdk

# После установки проверь путь:
ls ~/android/sdk/ndk/25.2.9519653

# (Опционально) Добавь переменные среды
export ANDROID_SDK_ROOT=$HOME/android/sdk
export ANDROID_NDK_HOME=$ANDROID_SDK_ROOT/ndk/25.2.9519653

# Проверка
sdkmanager --list
ndk-build --version

# Проверь, где лежит ndk-build:
ls ~/android/sdk/ndk/25.2.9519653/ndk-build

# Добавь его в $PATH:
export PATH=$PATH:$ANDROID_NDK_HOME
ndk-build --version

# Чтобы это сохранялось всегда:
echo 'export PATH=$PATH:$ANDROID_NDK_HOME' >> ~/.bashrc
source ~/.bashrc

# Отключи IPv6 в WSL2 временно:
echo "precedence ::ffff:0:0/96  100" | sudo tee -a /etc/gai.conf

sudo apt update
sudo apt install unzip zip openjdk-11-jdk wget git

# Скачай и установи Android SDK Command Line Tools
bash
Копировать
Редактировать
mkdir -p $HOME/android/sdk
cd $HOME/android/sdk

# Загрузка command-line tools
wget https://dl.google.com/android/repository/commandlinetools-linux-10406996_latest.zip
unzip commandlinetools-linux-*.zip -d cmdline-tools

# Обязательный шаг: перемести содержимое во вложенную папку
mkdir -p cmdline-tools/latest
mv cmdline-tools/* cmdline-tools/latest/

#### ARM ####
armv7a — это 32-битный ARM
aarch64 — это 64-битный ARM

# Попробуй указать минимальный API уровень вручную:
! make OS=android NDKROOT=$ANDROID_NDK_HOME TARGET=aarch64 NDKLEVEL=21

# Удали старые артефакты сборки
make clean
# or
rm -rf build/obj build/android build/*.o

# Выполни сборку с точным указанием TARGET и API level
cd ~/openh264
make clean
make OS=android NDKROOT=$ANDROID_NDK_ROOT ARCH=arm64 TARGET=android-21


```
make OS=android \
  NDKROOT=$ANDROID_NDK_HOME \
  TARGET=aarch64 \
  ANDROID_API=21 \
  CC=$ANDROID_NDK_HOME/toolchains/llvm/prebuilt/linux-x86_64/bin/aarch64-linux-android21-clang \
  CXX=$ANDROID_NDK_HOME/toolchains/llvm/prebuilt/linux-x86_64/bin/aarch64-linux-android21-clang++
```


nano build/platform-android.mk
```
ARCH = arm
на:
ARCH := $(TARGET)
```


make OS=android NDKROOT=$ANDROID_NDK_HOME TARGET=aarch64 NDKLEVEL=21
export ANDROID_NDK_ROOT=/home/pi/android/sdk/ndk/25.2.9519653
make OS=android NDKROOT=$ANDROID_NDK_ROOT TARGET=aarch64 TARGET=android-21


cd ~/openh264
make clean

# Для сборки OpenH264 нужен ассемблер nasm:
sudo apt update
sudo apt install nasm
nasm --version

# Для сборки OpenH264 gradle
sudo apt update
sudo apt install gradle
gradle --version
cd ~/openh264
gradle wrapper --gradle-version=8.7

# Ручная компиляция cpu-features.o
Ошибка связана с несовместимостью cpu-features.o. Скомпилируем его вручную с правильными флагами для aarch64-linux-android21:

bash

Копировать
cd ~/openh264
/home/pi/android/sdk/ndk/25.2.9519653/toolchains/llvm/prebuilt/linux-x86_64/bin/aarch64-linux-android21-clang \
-c /home/pi/android/sdk/ndk/25.2.9519653/sources/android/cpufeatures/cpu-features.c \
-o codec/common/src/cpu-features.o \
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


cd ~/openh264
make clean
make OS=android NDKROOT=$ANDROID_NDK_ROOT ARCH=arm64 TARGET=android-21
make OS=android NDKROOT=$ANDROID_NDK_ROOT ARCH=arm64 TARGET=android-21 libraries
make OS=android NDKROOT=$ANDROID_NDK_ROOT ARCH=arm64 TARGET=android-21 BUILDTYPE=Static libraries
####
file ~/openh264/libopenh264.so
/home/pi/openh264/libopenh264.so: ELF 64-bit LSB shared object, ARM aarch64, version 1 (SYSV), dynamically linked, with debug_info, not stripped
Если вывод показывает ELF 64-bit LSB shared object, ARM aarch64, то библиотека уже собрана для нужной архитектуры (arm64-v8a).
####

### Переместите или скопируйте libopenh264.so в нужную директорию: ###
mkdir -p /home/pi/webrtc-android/src/third_party/openh264/lib/android/arm64-v8a
cp /home/pi/webrtc-android/src/third_party/openh264/lib/libopenh264.so /home/pi/webrtc-android/src/third_party/openh264/lib/android/arm64-v8a/
# Проверьте, что файл теперь доступен:
ls /home/pi/webrtc-android/src/third_party/openh264/lib/android/arm64-v8a
###


libopenh264.so: ELF 64-bit LSB shared object, ARM aarch64, version 1 (SYSV), dynamically linked, not stripped

# Убедись, что в результате у тебя есть:

bash
Копировать
Редактировать
openh264/
├── lib/
│   └── android/
│       └── arm64-v8a/
│           └── libopenh264.so
├── include/
│   └── wels/
│       └── <headers>


sudo apt update
sudo apt install python3 python3-pip
python3 --version


cd ~/webrtc-android/src
mkdir -p out/Debug
nano out/Debug/args.gn

```
# rtc_enable_libopenh264 = true

rtc_libopenh264_path = "/home/pi/webrtc-android/src/third_party/openh264/lib"
target_cpu = "arm64"
target_os = "android"
is_debug = true
```

```
gn gen out/Debug --args='
rtc_system_openh264 = true
rtc_libopenh264_path = "/home/pi/webrtc-android/src/third_party/openh264/lib/android/arm64-v8a"
target_cpu = "arm64"
target_os = "android"
is_debug = true
'
```

rm -rf out/Debug
rtc_enable_libopenh264 = true — включает OpenH264.
rtc_libopenh264_path — путь к libopenh264.so.
target_cpu = "arm64" — архитектура arm64-v8a.
target_os = "android" — целевая ОС.
is_debug = true — сборка в режиме отладки.

cd ~/webrtc-android/src
build/linux/sysroot_scripts/install-sysroot.py --arch=arm64

cd ~/webrtc-android/src
gn gen out/Debug
ninja -C out/Debug
rm -rf out/Debug
mkdir ~/webrtc-android/src/out/Debug

# Проверь версию WebRTC:
cd ~/webrtc-android/src
git log -1
```
pi@PC1:~/webrtc-android/src$ cd ~/webrtc-android/src
pi@PC1:~/webrtc-android/src$ git log -1
commit 658d2f57f201457e9f8fb7c76ab7ce25505b580a (HEAD, origin/master, origin/main, origin/lkgr, origin/HEAD, main)
Author: Jeremy Leconte <jleconte@webrtc.org>
Date:   Fri May 16 13:58:43 2025 +0200

    [Doc] Fix broken buganizer template links.

    Change-Id: Ie629097bd78864afe97d1fc71845a35fb82cd9e9
    Bug: None
    Reviewed-on: https://webrtc-review.googlesource.com/c/src/+/392140
    Commit-Queue: Jeremy Leconte <jleconte@google.com>
    Reviewed-by: Artem Titov <titovartem@webrtc.org>
    Cr-Commit-Position: refs/heads/main@{#44673}
```
cat ~/webrtc-android/src/DEPS


gn args --list out/Debug | grep -i openh264
```
pi@PC1:~/webrtc-android/src$ gn args --list out/Debug | grep -i openh264
rtc_enable_libopenh264 = true
The variable "rtc_enable_libopenh264" was set as a build argument
rtc_system_openh264
    Use system OpenH264
```

Следующий шаг:
Проверить, поддерживает ли твоя версия WebRTC OpenH264.
Устранить предупреждение, найдя правильный параметр или подтвердив, что OpenH264 включается автоматически.
Собрать WebRTC и интегрировать в MyTest

# Чтобы понять, почему rtc_enable_libopenh264 не работает, проверим GN-файлы WebRTC:
cd ~/webrtc-android/src
grep -r "rtc_enable_libopenh264" .
grep -r "openh264" build/ webrtc/

pi@PC1:~/webrtc-android/src$ gn gen out/Debug
WARNING at build arg file (use "gn args <out_dir>" to edit):1:26: Build argument has no effect.
rtc_enable_libopenh264 = true
^---
The variable "rtc_enable_libopenh264" was set as a build argument
but never appeared in a declare_args() block in any buildfile.

To view all possible args, run "gn args --list <out_dir>"

The build continued as if that argument was unspecified.

Generating compile_commands took 82ms
Done. Made 8906 targets from 443 files in 810ms
pi@PC1:~/webrtc-android/src$ grep -r "rtc_enable_libopenh264" .
./out/Debug/args.gn:rtc_enable_libopenh264 = true
^C
pi@PC1:~/webrtc-android/src$ grep -r "openh264" build/ webrtc/
grep: build/.git/objects/pack/pack-42f37f974f85d94a9b0e13a4aacdbe1316c3f8dd.pack: binary file matches
grep: build/.git/index: binary file matches
build/linux/unbundle/openh264.gn:    openh264_cfi_ignorelist_path =
build/linux/unbundle/openh264.gn:        rebase_path("//build/linux/unbundle/openh264_encoder_cfi_ignores.txt",
build/linux/unbundle/openh264.gn:    cflags += [ "-fsanitize-ignorelist=$openh264_cfi_ignorelist_path" ]
build/linux/unbundle/openh264.gn:  packages = [ "openh264" ]
build/linux/unbundle/openh264.gn:shim_headers("openh264_shim") {
build/linux/unbundle/openh264.gn:  deps = [ ":openh264_shim" ]
build/linux/unbundle/openh264.gn:  deps = [ ":openh264_shim" ]
build/linux/unbundle/openh264.gn:  deps = [ ":openh264_shim" ]
build/linux/unbundle/openh264.gn:  deps = [ ":openh264_shim" ]
build/linux/unbundle/replace_gn_files.py:    'openh264': 'third_party/openh264/BUILD.gn',
grep: webrtc/: No such file or directory



```
"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc-android\src\out\Debug\clang_x64"
"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc-android\src\out\Debug\clang_x64_for_rust_host_build_tools"
"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc-android\src\out\Debug\gen"
"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc-android\src\out\Debug\gen.runtime"
"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc-android\src\out\Debug\local_rustc_sysroot"
"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc-android\src\out\Debug\obj"
"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc-android\src\out\Debug\.gitignore"
"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc-android\src\out\Debug\args.gn"
"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc-android\src\out\Debug\build.ninja"
"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc-android\src\out\Debug\build.ninja.d"
"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc-android\src\out\Debug\build.ninja.stamp"
"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc-android\src\out\Debug\build_vars.json"
"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc-android\src\out\Debug\compile_commands.json"
"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc-android\src\out\Debug\gn_logs.txt"
"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc-android\src\out\Debug\test_env_py_unittests.runtime_deps"
"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc-android\src\out\Debug\toolchain.ninja"
"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc-android\src\out\Debug\xvfb_py_unittests.runtime_deps"
```


pi@PC1:~/webrtc-android/src$ ninja -C out/Debug
ninja: Entering directory `out/Debug'
ninja: error: '../../third_party/android_sdk/public/platforms/android-36/android.jar', needed by 'gen/jni_headers/sdk/android/generated_external_classes_jni/Integer_jni.h', missing and no known rule to make it

Вы уже на правильном пути. 
Ваша библиотека libopenh264.so находится в /home/pi/webrtc-android/src/third_party/openh264/lib/android/arm64-v8a

77
https://chatgpt.com/c/682a5ce3-baec-8012-bb62-e1c4c2b5a079 
# export ANDROID_NDK=/home/pi/android/sdk/ndk/29.0.13113456
rm -rf out/Debug
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
export AUTONINJA_BUILD_ID=1234
```
gn gen out/Debug --args='
rtc_system_openh264 = true
target_cpu = "arm64"
target_os = "android"
is_debug = true
android_ndk_api_level = 36
android_sdk_platform_version = "36"
'
```
ninja -C out/Debug

ninja -C out/Debug -v 2>&1 | tee ninja_log.txt

```
gn gen out/Debug --args='rtc_system_openh264 = true target_cpu = "arm64" target_os = "android" is_debug = true android_ndk_api_level = 36 android_sdk_platform_version = "36"'
```

cipd --version
cipd auth-login

gclient sync --with_tags --with_branch_heads

cipd install chromium/third_party/turbine PbV7UFdzFIl6b_4lNwsj4VnlvnoULNAZRDwsndTGXTsC -root ~/temp_cipd_turbine 2>&1 | tee cipd_log.txt


./build/install-build-deps.sh
./build/install-build-deps-android.sh  # Если такой скрипт существует


echo $ANDROID_NDK
Если она пустая или путь не существует, нужно задать её вручную:


export ANDROID_NDK=/home/pi/android/sdk/ndk/28.1.13356709
Затем проверь наличие нужных директорий:


ls $ANDROID_NDK/toolchains/llvm/prebuilt/linux-x86_64/sysroot/usr/lib
✅ Что должно быть в структуре директорий
После установки ANDROID_NDK, путь:

$ANDROID_NDK/toolchains/llvm/prebuilt/linux-x86_64/sysroot/usr/lib

# Вариант 2. Проверь API уровни, которые реально есть ###############

ls /home/pi/android/sdk/ndk/29.0.13113456/toolchains/llvm/prebuilt/linux-x86_64/sysroot/usr/lib/aarch64-linux-android/
# Скорее всего, там есть:

21/

24/

28/

# Если 36/ отсутствует, то в GN args используй тот, что есть, например:
android_ndk_api_level = 28
# ############