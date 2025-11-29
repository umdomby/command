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