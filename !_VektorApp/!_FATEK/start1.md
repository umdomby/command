FBs-20MCJU-AC + FBs-CMEH Ethernet + 
магнитный энкодер Hohner - R4096
WinProladder

Какие приложения под Windows 11 
Среда разработки
Официальный сайт https://www.fatek.com/ https://www.fatek.com/en/download.php 
 
https://newtech.pk/fatek-software-manuals/  

Основная программа: WinProladder (последняя версия V3.32 Build 29313).
Альтернатива (новая): UperLogic (для M-серии, но может быть полезна; для чистых FBs лучше WinProladder).
Ethernet Module Configure Tools (версия V5.0.22) — специальная утилита для настройки IP, веб-сервера, Modbus TCP, e-mail и т.д. для модулей CMEH / CBEH.
Энкодер подключается к high-speed input'ам PLC (например, на FBs-20MCJU), а счётчики/позиционирование программируются в WinProladder (инструкции HSC, SPD, PLS и т.д.)
Fatek Ethernet Configuration Tool FATEK EtherConfig release note


Install-Package NewLife.Fatek -Version 1.0.2022.1015-beta0141

1. Как убрать задержки (ускоряем опрос)
   Чтобы получать данные «без задержек», нужно убрать Task.Delay(40). Но если просто его удалить, программа забьет всё ядро процессора бесконечным циклом.

Правильный путь: использовать await Task.Yield(). Это заставит цикл «пропустить вперед» другие задачи (например, отрисовку интерфейса), 
но тут же вернуться к опросу без ожидания в 40 мс.

