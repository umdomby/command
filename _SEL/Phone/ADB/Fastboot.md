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


В режиме Fastboot телефон определяется в Другие Устройства можно как ни будь восстановить из Fastboot найти драйвер и программу которая установит прошивку?

https://github.com/MiUnlockTool/XiaomiADBFastbootDrivers/releases/latest

miflash_pro_en_7.3.706.21_setup.exe

MediaTek → Android Bootloader Interface

Mi Flash Pro не видит устройство

Откройте командную строку от администратора прямо в папке с прошивкой:
Зайдите в папку
C:\lancelot_global_images_V13.0.4.0.SJCMIXM_20230111.0000.00_12.0_global
Зажмите Shift + правая кнопка мыши внутри папки →
«Открыть окно PowerShell здесь (или командную строку)»

flash_all_except_data_storage.bat


https://4pda.to/forum/index.php?showtopic=998845
https://4pda.to/forum/index.php?showtopic=998845&st=25520#entry120572814
Fastboot
bigota
hugeota


— именно то, что тебе нужно. Это официальная Fastboot ROM с сервера bigota, последняя стабильная Global для Redmi 9 (lancelot)**, 
которая 100 % прошивается с заблокированным загрузчиком и убирает «The system has been destroyed».

https://mifirm.net/download/8944

PowerShell
.\flash_all_except_data_storage.bat