MTK Auth Bypass Tool_V6.0.0.1 ловить COM режим


https://xmfirmwareupdater.com/miui/lancelot
Скачай SP Flash Tool + Драйвера (готовый комплект, ~30–50 МБ)
https://drive.google.com/file/d/130wFK-EBfFS8bf-VLIO0_EE6yxZlqLz5/view?usp=sharing
https://xiaomirom.com/en/download/redmi-9-9-prime-lancelot-stable-V13.0.4.0.SJCMIXM/

Android ADB itt, Android Bootloader int, Android Composite ADB int что выбрать из этих или нужен

The system has been destroyed

https://www.mediafire.com/folder/ev67lui4vj09b/MediaTek_Flashing_Tools

MediaTek PreLoader USB VCOM Port
MediaTek DA USB VCOM Port
MediaTek USB Port
Выбирай именно этот → PreLoader USB VCOM Port
BROM-режим (BootROM)
DA USB VCOM Port (COM6)

BV330523698BY

☑ preloader
☐ recovery
☐ vbmeta
☐ vbmeta_system
☐ vbmeta_vendor
☐ logo
☐ md1img
☐ всё остальное
☑ nvram
☑ nvdata
☑ persist
☑ protect1
☑ protect2
☑ frp (если в списке есть)

Huawei p8 забыл почту и пароль как восстановить с помощью компьютора на Windows 11 pro и кабеля?

обойти защиту  (Factory Reset Protection) от Google


1. Скачайте и установите Huawei HiSuite (официальный инструмент Huawei для управления устройством):
   Перейдите на consumer.huawei.com/en/support/hisuite.
   Установите версию для Windows (поддерживает Win 11).
   Запустите HiSuite и войдите в свой Huawei ID (если не помните — пропустите, используем для драйверов).

fastboot devices
adb shell am start -n com.google.android.gsf.login/


adb shell content insert --uri content://settings/secure --bind name:s:user_setup_complete --bind value:s:1
adb shell am start -n com.google.android.gsf.login/
adb shell am start -n com.google.android.gsf.login.LoginActivity


MRT 1.98 Fix (Cracked


https://ntslab.blogspot.com/search?q=Free+Huawei+Kirin+Tool+2025+FRP+Unlock


https://ntslab.blogspot.com/2025/11/gsm-unlocker-pro-latest-free-download.html
zdo6Ka2Rl9hDI-ehjvUEngf3AH8wk06Y7_CSemhxrN4


https://ntslab.blogspot.com/2025/11/tps-tool-v31-latest-update-2025-free.html
IQBWzKW5SXw-IxQvpvFtPIpDw-boe275VhPOuS7KsKI
 123




2. Официальная прошивка Fastboot для Redmi Note 9S Global
   Самая стабильная и свежая на сегодня — MIUI 14, V14.0.3.0.SJWMIXM (Android 12). Размер ~4.9 ГБ, это Fastboot-версия (.tgz).

Прямая ссылка на скачивание:
https://xiaomirom.com/en/download/redmi-note-9s-note-9-pro-note-10-lite-curtana-stable-V14.0.3.0.SJWMIXM/
(Выбери "Fastboot ROM" — ссылка на bigota_curtana-global-V14.0.3.0.SJWMIXM-20230307.tgz. Если нужно, зарегистрируйся на сайте для скачивания.)

Альтернатива (если ссылка не открывается):

https://miuirom.org/phones/redmi-note-9s (ищи V14.0.3.0.SJWMIXM Fastboot, 4.93 GB).

Распакуй архив в отдельную папку (например, C:\firmware) — там будет куча .img файлов.
3. Mi Flash Tool (последняя версия)
   Бери v20220507 — это обновлённая версия после 2021.08.13, с поддержкой новых устройств и фиксами ошибок. Размер ~100 МБ.

Скачай Mi Flash v20220507:
https://www.xiaomiflash.com/download/
(Кликни "Download Mi Flash Tool 20220507" — файл XiaoMiFlash20220507.zip. Распакуй и запусти setup.exe от админа.)

Альтернатива (официал от Xiaomi):

https://xiaomiflashtool.com/ (выбери Latest Version).
https://4pda.to/forum/index.php?showtopic=889822



я могу снять (Factory Reset Protection) от Google в режиме Test Point, когда я ставлю перемычку на телефоне и открывается COM PORT - COM PORT Huawei usb 1.0 COM3
adb командами через консоль? или нужна отдельная программа?
cd C:/adb
cd C:/adb2

fastboot devices
fastboot getvar product  -- lancelot
fastboot oem device-info  -- разблок. ли загрузчик?
adb devices
adb shell rm -rf /data/system/users/0/settings_ssaid.xml
adb shell rm -rf /data/system/users/0/settings_global.xml
adb shell rm -rf /data/data/com.google.android.gsf/databases/gservices.db
adb reboot

https://www.mrttool.com/

Проблема в том, что у тебя телефон сейчас определяется только как Huawei USB COM 1.0 (COM3) в диспетчере устройств, но ADB его не видит (команда `adb devices ничего не показывает).
Это классическая ситуация на всех Huawei/Honor с Kirin после 2019–2020 года: в режиме Test Point + COM 1.0 обычный ADB не работает, потому что драйвер Huawei USB COM 1.0 не поддерживает ADB-протокол.
Тебе нужны специальные инструменты, которые работают именно через этот COM-порт (не через обычный adb.exe).
Рабочие бесплатные варианты 2025 года:

PotatoNV (самый простой и полностью бесплатный сейчас)
Скачать последнюю версию: https://potatonv.me или поиск «PotatoNV 2025 github»
Запускаешь → выбираешь COM3 → жмёшь «Reset FRP» → 5–10 секунд и готово.
Работает на всех Kirin 659/710/970/980/990/985/9000 и даже на новых 9000S.
https://github.com/mashed-potatoes/PotatoNV

https://consumer.huawei.com/en/support/phones/p8-lite-2017/

Huawei FRP & ID Bypass Tool (один клик, 2024–2025 версия)
Ищется по запросу: Huawei_COM_1.0_FRP_tool_2025
Там уже внутри всё настроено под COM-порт, просто выбираешь порт и жмёшь Reset FRP.

HCU-Client (бесплатно только функция FRP в режиме COM 1.0)
Сейчас чтение кодов платное, но Reset FRP через Test Point остался бесплатным.

Avenger Huawei COM 1.0 tool (тоже бесплатно)




ты можешь мне помочь написать самому в VisualStudio 2022 программу для снятия FRP ? для Huawei p8 
COM PORT Huawei usb 1.0 COM3
C:\adb

для обхода FRP на Huawei P8 Lite 2017 (PRA-LX1, Kirin 655)
ADB-команды ADB команды установлены и путь 
сделай мне полноценное приложение, а не консольное
