# Таблица драйверов и способов ловли порта для разных режимов Android (2025)

| № | Название драйвера в Диспетчере устройств                     | Какой режим телефона                      | Какой программой ловится                  | Как правильно ловить порт (2025)                                                                 |
|---|--------------------------------------------------------------|--------------------------------------------|--------------------------------------------|---------------------------------------------------------------------------------------------------|
| 1 | **MediaTek PreLoader USB VCOM Port (COMx)**                  | BROM / Preloader (MediaTek)                | SP Flash Tool, MTK Client, Hydra           | Телефон выключен → зажать Vol– → вставить кабель → держать 5–8 сек → отпустить                  |
| 2 | **MediaTek DA USB VCOM Port (COMx)**                         | BROM (новые чипы MT6768–MT6983)            | SP Flash Tool, MTK Client                  | То же самое, но часто ловится без Vol– (просто вставить кабель в выключенный телефон)            |
| 3 | **Qualcomm HS-USB QDLoader 9008 (COMx)**                     | EDL-режим (Qualcomm)                       | QFIL, QPST, Miracle, Hydra                 | Тест-поинт или `fastboot oem edl` / специальные кнопки (Vol+ и Vol– + кабель)                    |
| 4 | **Android Bootloader Interface** или **Google USB Driver**  | Fastboot / Bootloader                      | fastboot (platform-tools)                  | Телефон в Fastboot (`adb reboot bootloader` или Vol– + Power)                                    |
| 5 | **Android Device → Android Composite ADB Interface**        | ADB (система, рекавери, sideload)          | adb (platform-tools)                       | Телефон включён + отладка по USB включена                                                         |
| 6 | **MTK USB Port (COMx)**                                      | Старый BROM (MT65xx–MT67xx)                | SP Flash Tool (старые версии)              | Выключен + подключить кабель (часто без кнопок)                                                   |
| 7 | **Samsung Mobile USB Composite Device**                      | Download Mode (Odin)                       | Odin3, Heimdall                            | Vol– + Home + Power (старые) или новые комбинации + кабель                                        |
| 8 | **Huawei USB COM 1.0**                                       | Fastboot / eRecovery (Huawei/Honor)        | HiSuite, fastboot                          | Vol– + Power + кабель (или `adb reboot bootloader`)                                               |

### Самые важные драйверы (скачать один раз и забыть)

| Драйвер                                      | Для чего                                   | Ссылка (живая 29.11.2025)                                                                 |
|----------------------------------------------|--------------------------------------------|-------------------------------------------------------------------------------------------------|
| MediaTek PreLoader USB VCOM (3.0.1504.0)     | Ловит BROM на 99 % MTK-устройств           | https://androidmtk.com/download-mtk-usb-all-drivers                                             |
| LibUSB + WinUSB (для MTK Client)             | MTK Client без COM-порта                   | Устанавливается через Zadig[](https://zadig.akeo.ie)                                             |
| Qualcomm HS-USB QDLoader 9008                | EDL 9008                                   | Входит в Qualcomm Driver Pack → https://androiddatahost.com/download-qualcomm-usb-drivers       |
| Google USB Driver / Universal ADB Driver     | ADB + Fastboot (Pixel, Xiaomi и др.)       | https://developer.android.com/tools/extras/oem-usb                                            |

### Правило запомнить навсегда:
- **COMx + MediaTek** → SP Flash Tool / MTK Client → телефон выключен
- **Fastboot** → `fastboot devices` → телефон в режиме загрузчика
- **ADB** → `adb devices` → телефон включён
- **9008** → QFIL → Qualcomm в EDL

Сохрани табличку — больше никогда не спутаешь драйвер и программу!
# DRIVER!
# Android Bootloader Interface 
# Qualcomm HS-USB QDLoader 9008 (COM6)
