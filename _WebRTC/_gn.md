# android приложение сделать свою сборку Android с поддержкой H264 в WSL2 Ubuntu 24.04 
Скачал WebRTC  "\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src"

нужно использовать последнюю ставбильную ветку WebRTC 136 7103

pi@PC:~/android-sdk$ sdkmanager --version
12.0
"\\wsl.localhost\Ubuntu-24.04\home\pi\android-sdk\cmdline-tools\latest\bin"
"\\wsl.localhost\Ubuntu-24.04\home\pi\android-sdk\cmdline-tools\latest\lib"


depot_tools установлен home\pi\depot_tools

androidx в рабочих репозиториях
mkdir -p ~/android-sdk/extras/android/m2repository/androidx/test/runner/1.5.2
wget -O ~/android-sdk/extras/android/m2repository/androidx/test/runner/1.5.2/runner-1.5.2.aar https://dl.google.com/dl/android/maven2/androidx/test/runner/1.5.2/runner-1.5.2.aar

mkdir -p ~/android-sdk/extras/android/m2repository/androidx/test/core/1.5.0
wget -O ~/android-sdk/extras/android/m2repository/androidx/test/core/1.5.0/core-1.5.0.aar https://dl.google.com/dl/android/maven2/androidx/test/core/1.5.0/core-1.5.0.aar

mkdir -p ~/android-sdk/extras/android/m2repository/androidx/test/ext/junit/1.1.5
wget -O ~/android-sdk/extras/android/m2repository/androidx/test/ext/junit/1.1.5/junit-1.1.5.aar https://dl.google.com/dl/android/maven2/androidx/test/ext/junit/1.1.5/junit-1.1.5.aar

mkdir -p ~/android-sdk/extras/android/m2repository/androidx/test/rules/1.5.0
wget -O ~/android-sdk/extras/android/m2repository/androidx/test/rules/1.5.0/rules-1.5.0.aar https://dl.google.com/dl/android/maven2/androidx/test/rules/1.5.0/rules-1.5.0.aar

рабочая директория pi@PC: /home/pi/webrtc/src  или ~/webrtc/src


ninja --version
1.11.1
gn --version
1000 (03d10f1)
java -version
openjdk version "21.0.7" 2025-04-15
OpenJDK Runtime Environment (build 21.0.7+6-Ubuntu-0ubuntu124.04)
OpenJDK 64-Bit Server VM (build 21.0.7+6-Ubuntu-0ubuntu124.04, mixed mode, sharing)

unzip platform-tools-latest-linux.zip

```
   gn gen out/android_release_arm64 --args='
      target_os = "android"
      target_cpu = "arm64"  # или "arm", "x86", "x64"
      is_debug = false      # false для релиза, true для отладки
      
      # --- Настройки кодеков ---
      proprietary_codecs = true
      ffmpeg_branding = "Chrome"
      rtc_use_h264 = true   # VP8 включен по умолчанию
      
      # --- Пути к Android SDK и NDK ---
      android_sdk_root = "/home/pi/android-sdk"
      android_ndk_root = "/home/pi/android-sdk/ndk/29.0.13113456"
      # android_ndk_api_level = 21 # Минимальный API уровень для NDK, если нужно указать
      
      # --- Опционально, но часто полезно ---
      is_component_build = false
      use_custom_libcxx = false
      symbol_level = 0
      treat_warnings_as_errors = false
      rtc_include_tests = false
      enable_stripping = true
   '
```

cd ~/webrtc/src
```
gn gen out/android_release_arm64 --args='
   target_os = "android"
   target_cpu = "arm64"
   is_debug = false
   proprietary_codecs = true
   ffmpeg_branding = "Chrome"
   rtc_use_h264 = true
   android_sdk_root = "/home/pi/android-sdk"
   android_ndk_root = "/home/pi/android-sdk/ndk/29.0.13113456"
   is_component_build = false
   use_custom_libcxx = false
   symbol_level = 0
   treat_warnings_as_errors = false
   rtc_include_tests = false
   enable_stripping = true
   rtc_build_examples = false
'
```
ninja -C out/android_release_arm64

# cpu-features.c
find third_party/cpu_features -name "cpu-features.c"
find /home/pi/android-sdk/ndk/25.2.9519653 -name "cpu-features.c"
find /home/pi/android-sdk/ndk/29.0.13113456 -name "cpu-features.c"
mkdir -p third_party/cpu_features/src/ndk_compat/

cp /home/pi/android-sdk/ndk/29.0.13113456/sources/android/cpufeatures/cpu-features.c third_party/cpu_features/src/ndk_compat/


дай полную инструкцию на русском по установке и сборке Android с поддержкой H264 в WSL2


sdkmanager --sdk_root=$ANDROID_HOME "platform-tools" "platforms;android-36" "build-tools;36.0.0"

sudo chmod -R 755 ~/android-sdk
sudo chmod -R 755 ~/webrtc

# Выполните команду: Проверьте, исчезли ли предупреждения. Если предупреждений больше нет, конфигурация готова для сборки.
gn gen out/android_release_arm64

# Проверка текущей ветки:
git branch
git log --oneline -n 5

# Обновление depot_tools (замените /path/to/depot_tools на ваш реальный путь)
cd ~/depot_tools
git pull

# Перейдите в директорию с исходниками WebRTC
cd /home/pi/webrtc/src

# Очистка текущего состояния git (ОСТОРОЖНО: если у вас есть несохраненные локальные изменения, сделайте их резервную копию!)
# git reset --hard HEAD
# git clean -fdx

# Принудительная синхронизация gclient
gclient sync -D -f -R
gclient sync -D -f -R --with_branch_heads

find third_party/cpu_features -name "cpu-features.c"

# Проверьте наличие локальных изменений:
cd /home/pi/webrtc/src
git status
git diff

cd /home/pi/webrtc/src
git fetch origin
# Например, для ветки M126 (если она существует и актуальна):
# git checkout branch-heads/m126
# Для более старой, но потенциально стабильной, можно посмотреть предыдущие:
git checkout branch-heads/m125 # Замените m125 на актуальный номер стабильной ветки
gclient sync -D -f -R # Важно после смены ветки!


Актуальные имена веток можно посмотреть на https://chromiumdash.appspot.com/branches (ищите ветки refs/branch-heads/XXXX для WebRTC/Chromium).

cd /home/pi/webrtc/src
# Обновите список удаленных веток:
git fetch origin
git branch -r

https://chromiumdash.appspot.com/branches
# 125  не доступен
git checkout branch-heads/6422
# 126
git checkout branch-heads/6478
# 136
git checkout -b m136 branch-heads/7103

sudo chmod -R 755 ~/android-sdk
sudo chmod -R 755 ~/webrtc

# После успешного переключения на ветку branch-heads/6478 (если команда выше выполнится без ошибок), 
# не забудьте ОБЯЗАТЕЛЬНО синхронизировать зависимости:
gclient sync -D -f -R

git branch -r
Копировать
cd ~/webrtc/src/base
Проверьте статус изменений:
bash

Копировать
git status
git add .
git commit -m "Сохранение изменений в src/base"
Сохранить изменения временно (stash), чтобы вернуться к ним позже:
bash



###
# Проверка наличия файла cpu-features.c Сначала убедитесь, что файл cpu-features.c присутствует в репозитории.
ls -l ~/webrtc/src/third_party/cpu_features/src/ndk_compat/cpu-features.c
# Если файл отсутствует, проверьте наличие директории ndk_compat:
ls -l ~/webrtc/src/third_party/cpu_features/src/ndk_compat/
Вы должны увидеть cpu-features.c и другие файлы, такие как cpu-features.h. Если файлы отсутствуют, проблема может быть в самом репозитории или ветке.

cd ~/webrtc/src
gclient sync --force


