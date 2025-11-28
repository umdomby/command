# Самые важные ADB & Fastboot команды 2025 года

## Подготовка
- Скачать свежий **platform-tools** → https://developer.android.com/tools/releases/platform-tools
- Распаковать → открыть терминал/PowerShell/CMD в этой папке (Shift + ПКМ → «Открыть окно PowerShell здесь»)
- Подключить телефон с включённой **отладкой по USB**

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

## Fastboot команды (телефон в режиме Fastboot)
| Команда                                               | Описание                                                  |
|-------------------------------------------------------|-----------------------------------------------------------|
| `fastboot devices`                                    | Показать устройства в Fastboot                            |
| `fastboot oem unlock` / `fastboot flashing unlock`    | Разблокировать загрузчик                                  |
| `fastboot oem lock` / `fastboot flashing lock`        | Заблокировать загрузчик                                   |
| `fastboot flash boot boot.img`                        | Прошить boot / Magisk-патченый                            |
| `fastboot flash recovery twrp.img`                    | Прошить TWRP / OrangeFox                                  |
| `fastboot flash vbmeta vbmeta.img --disable-verity --disable-verification` | Отключить AVB 2.0                         |
| `fastboot flash init_boot init_boot.img`              | Для Android 13+ (A/B устройства)                          |
| `fastboot set_active a` / `b`                         | Переключить слот A/B                                      |
| `fastboot erase userdata`                             | Стереть данные                                            |
| `fastboot -w`                                         | Wipe data + cache                                         |
| `fastboot oem edl`                                    | Перевод Qualcomm в EDL 9008                               |
| `fastboot getvar all`                                 | Показать все переменные (unlocked: yes/no и т.д.)         |
| `fastboot reboot`                                     | Перезагрузить                                             |

## Самые спасательные команды 2025 года
| Команда                                               | Когда нужна                                               |
|-------------------------------------------------------|-----------------------------------------------------------|
| `fastboot flashing unlock_critical`                   | Разблокировка критических разделов (Xiaomi 2023+)         |
| `fastboot oem cdma` / `fastboot oem edl`              | Принудительный EDL на Qualcomm                            |
| `adb reboot bootloader && fastboot oem unlock`        | Быстрая разблокировка                                     |
| `fastboot flash boot_ab boot.img`                     | Прошивка на A/B-устройствах (Pixel, Xiaomi 12+)           |
| `fastboot continue`                                   | Продолжить загрузку после прерванного fastboot            |

## Полезные .bat-скрипты (Windows) — просто сохрани и запусти
```bat
:: 1. Разблокировка + TWRP
adb reboot bootloader
fastboot oem unlock
fastboot flash recovery twrp.img
fastboot reboot

:: 2. Xiaomi 2024+ (A/B + vbmeta)
adb reboot bootloader
fastboot flash boot_ab boot.img
fastboot flash vbmeta_ab vbmeta.img --disable-verity --disable-verification
fastboot set_active a
fastboot reboot