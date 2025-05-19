# Проверьте конфигурацию .gclient:
Убедитесь, что ваш файл .gclient (он должен находиться в директории ~/webrtc-android/, то есть на один уровень выше src/) содержит указание на сборку под Android. Он должен включать строку target_os = ['android'] в списке solutions.

Пример содержания файла .gclient:
```
solutions = [
{
"name": "src",
"url": "https://webrtc.googlesource.com/src.git",
"managed": False,
"custom_deps": {},
"custom_vars": {
"checkout_ios": False, # если не собираете под iOS
"checkout_pgo_profiles": False,
},
},
]
target_os = ["android"] # Убедитесь, что эта строка есть и раскомментирована
```

# rm -rf out/Debug # Опционально, для полной чистоты
gn gen out/Debug --args='
rtc_system_openh264 = true
target_cpu = "arm64"
target_os = "android"
is_debug = true
android_ndk_api_level = 36
android_sdk_platform_version = "36"
'
ninja -C out/Debug -v 2>&1 | tee ninja_log.txt

###
rm -rf /home/pi/webrtc-android/src/third_party/lss
rm -rf /home/pi/webrtc-android/src/third_party/libyuv
# и другие, если были упомянуты в ошибках конфликтов
Запустите gclient sync снова и будьте терпеливы:
Перейдите в директорию ~/webrtc-android/ и выполните:

Bash

cd ~/webrtc-android
gclient sync -D --force --reset

cd src
gclient runhooks
###

cd ~/webrtc-android/src
git status

git add .
git commit -m "Temporary changes to DEPS for AndroidX version"

gclient sync


-D (или --delete_unversioned_trees): Удаляет неверсионированные деревья (помогает при проблемах с зависимостями).
--force: Принудительно перезаписывает любые локальные изменения в зависимостях.
--reset: Сбрасывает все зависимости к состоянию "как в DEPS".

cd ~/webrtc/src
git fetch origin
git branch -r | grep branch-heads



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