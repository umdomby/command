- COMPUTER: Embedded PC Sinsegye SX2133
- DRIVER SC3: Sereis MODEL SC303AAD00
- SERVO MOTOR: Model M71040CKNSC00

1. С помощью Embedded PC Sinsegye SX2133 управлять мотором M71040CKNSC00 через драйвер SC303AAD00 по EtherCat через утилиту CODEESYS soft SINSEGYE V3.5 SP18 Patch 4

2. + ESI-файл (Device Description) для SC3
Перейдите на сайт FATEK: https://www.fatek.com/en/download.php?act=list&cid=211.
Скачайте FATEK Servo Drive SC3 EtherCat Configuration file (V1.0).
Распакуйте XML-файл (ESI).

3. + Установка CODESYS SINSEGYE V3.5 SP18
Убедитесь, что установлен CODESYS EtherCAT Master SL (из CODESYS Store).
Запустите CODESYS.

4. + Импорт ESI-файла драйвера
В CODESYS: Tools → Device Repository (или Install Device).
Нажмите Install → выберите скачанный .xml файл для SC3 EtherCAT.
Подтвердите импорт. Драйвер появится в репозитории под FATEK / SC3 Series.

5. Создание проекта в CODESYS
File → New Project.
Выберите устройство: Sinsegye SX2133 (или соответствующий Embedded PC target из SINSEGYE).
Добавьте EtherCAT Master:
Правой кнопкой на устройстве → Add Device → EtherCAT → EtherCAT Master.

Добавьте slave:
Правой кнопкой на EtherCAT Master → Add Device → найдите FATEK SC3 (или SC303).
Установите Station Alias = адрес, который выставили на драйвере (обычно 1).

6. Настройка сети EtherCAT

Дважды кликните на EtherCAT Master.
На вкладке EtherCAT → Browse → выберите сетевую карту SX2133, dedicated для EtherCAT (не используйте её для обычного Ethernet!).
Включите Distributed Clocks (DC) для синхронизации (рекомендуется для серво).
Сканируйте сеть: Online → Scan Devices (или кнопка Scan в мастерe). Драйвер должен обнаружиться.

7. Настройка Process Data (PDO Mapping)

Откройте slave-драйвер (SC3) → вкладка Process Data.
Выберите подходящие PDO (обычно для серво: RxPDO — Controlword, Target Position/Velocity/Torque; TxPDO — Statusword, Actual Position и т.д.).
Для Motion Control используйте DS402 profile (если поддерживается SC3) или кастомные PDO.
Сохраните конфигурацию.

8. Добавление SoftMotion Axis (рекомендуется для серво)

Добавьте библиотеку SoftMotion (если нужно).
Правой кнопкой на Application → Add Device → Axis → EtherCAT Drive (или Generic Axis).
Привяжите Axis к вашему SC3 slave.
Настройте scaling (единицы: pulses/rev — зависит от энкодера 17-bit).
В Startup Parameters можно задать начальные параметры драйвера (например, через SDO).

9. Программирование

Используйте PLCopen Motion блоки: MC_Power, MC_MoveAbsolute, MC_MoveVelocity и т.д.
Пример простого управления:iecstMC_Power(Axis := Axis_1, Enable := TRUE, Status => PowerStatus);
MC_MoveAbsolute(Axis := Axis_1, Position := 1000.0, Execute := StartMove, Done => MoveDone);

10. Загрузка и запуск

Login → Download проекта на SX2133.
Переведите в RUN.
Мониторьте диагностику EtherCAT (в мастерe) и ошибки на драйвере (LED или ProTuner от FATEK).
Для тонкой настройки используйте ProTuner (ПО FATEK) через USB/RS485 на драйвере или EoE (Ethernet over EtherCAT), если настроено.

Полезные советы и частые проблемы

Нет связи → Проверьте кабель, порт, WinPcap/NPcap (для runtime), правильный сетевой адаптер.
DC Sync error → Установите Cycle Time (обычно 1–4 мс для серво).
ESI не найден → Перезапустите CODESYS после импорта.
Документация:
FATEK SC3 User Manual + EtherCAT supplement.
CODESYS EtherCAT Tutorial: официальный гайд.
Sinsegye SX2133 manuals на help.sinsegye.com.