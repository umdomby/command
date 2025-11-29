Huawei p8 lite PRA-LA1 EMUI8 Android8 Процессор Kirin655
FRP
прошивка Huawei p8 lite мне нужна прошивка, которую нужно переделать в EDL и установить через QFIL
HiSilicon Kirin 620
(ARM-based, не Qualcomm)

EDL Qualcomm Snapdragon NO p8Lite
SP Flash Tool,  MTK Client войти в режим драйверов USB (FASTBOOT) или 
COM PORT "MTK Auth Bypass Tool_V6.0.0.1"


## Основные ADB команды
| Команда                              | Описание                                      |
|--------------------------------------|-----------------------------------------------|
| `adb devices`                        | Показать подключённые устройства              |
| `adb reboot`                         | Обычная перезагрузка                          |
| `adb reboot bootloader`              | Перезагрузка в Fastboot                       |
| `adb reboot recovery`                | Перезагрузка в рекавери                       |
| `adb reboot edl`                     | В EDL-режим (Qualcomm)                        |
| `adb reboot disem`                   | Emergency Mode на Xiaomi                      |
| `adb shell`                          | Войти в терминал телефона                     |
| `adb sideload update.zip`            | Прошить zip через стоковое рекавери           |
| `adb push файл /sdcard/`             | Залить файл на телефон                        |
| `adb pull /sdcard/file.zip .`        | Скачать файл с телефона                       |
| `adb install app.apk`                | Установить APK                                |
| `adb uninstall com.package.name`     | Удалить приложение (оставит данные)           |
| `adb uninstall -k --user 0 com.package.name` | Удалить для текущего пользователя     |
| `adb logcat`                         | Логи в реальном времени                       |

adb devices -l
PSE7N17909002378 unauthorized transport_id:1
PS C:\adb> adb shell getprop ro.build.version.release
8.0.0
PS C:\adb> adb shell getprop ro.build.version.emui
EmotionUI_8.0.0


# Можно прямо сейчас узнать, стоит ли PIN/пароль/графический ключ и убрать его.
adb shell dumpsys lock_settings | findstr lockscreen.password_type
adb shell dumpsys trust | findstr isTrusted


PowerShelladb shell getprop ro.build.version.release
adb shell getprop ro.build.version.emui

adb shell dumpsys lock_settings | findstr -i password
adb shell dumpsys lock_settings | findstr -i pattern
adb shell dumpsys lock_settings | findstr -i pin
adb shell dumpsys lock_settings get-disabled && echo

adb shell "su -c 'cat /data/system/password.key 2>/dev/null || echo no_password_key'"
adb shell "su -c 'cat /data/system/gesture.key 2>/dev/null || echo no_gesture_key'"
adb shell "ls -la /data/system/*.key"
