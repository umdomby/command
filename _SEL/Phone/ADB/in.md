# Все режимы Android-телефона — как войти и для чего нужны (2025)

| Режим                              | Как видно в Диспетчере устройств / командах            | Как войти (универсально)                                                                 | Основное назначение (2025)                                                                 |
|------------------------------------|--------------------------------------------------------|-------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------|
| **Обычная система**                | ADB: `device`                                          | Просто включить телефон                                                                   | Работа, ADB, установка APK, root через Magisk и т.д.                                        |
| **Fastboot / Bootloader**          | `fastboot devices` → `fastboot`                        | 1. `adb reboot bootloader`  <br>2. Vol– + Power (большинство)                             | Разблокировка загрузчика, прошивка boot/recovery/vbmeta, переключение слотов A/B            |
| **Стоковое Recovery**              | ADB: `recovery`                                        | 1. `adb reboot recovery`  <br>2. Vol+ + Power (Xiaomi/Huawei)  <br>3. Vol– + Power (Samsung) | Сброс до заводских, sideload OTA, wipe cache                                                |
| **TWRP / OrangeFox / custom recovery** | ADB: `recovery`                                    | Через fastboot: `fastboot flash recovery twrp.img` → `fastboot reboot`                    | Полный бэкап/восстановление, установка кастомов, Magisk, прошивка zip без ПК                 |
| **Sideload mode**                  | ADB: `sideload`                                        | В стоковом рекавери выбрать «Apply update from ADB»                                       | Прошивка официальных OTA без SD-карты                                                       |
| **Download Mode (Odin)**           | Samsung USB Driver                                     | Старые: Vol– + Home + Power  <br>Новые: Vol– + Power (при подключённом кабеле)           | Прошивка через Odin3 (Samsung)                                                              |
| **BROM / Preloader (MediaTek)**    | MediaTek PreLoader USB VCOM / DA USB VCOM (COMx)       | Телефон выключен → зажать Vol– → вставить кабель (держать 5–8 сек)                        | Unbrick «The system has been destroyed», прошивка через SP Flash Tool / MTK Client         |
| **EDL 9008 (Qualcomm)**            | Qualcomm HS-USB QDLoader 9008 (COMx)                   | 1. `fastboot oem edl`  <br>2. Vol+ + Vol– + кабель  <br>3. Тест-поинт                       | Unbrick полностью мёртвых Snapdragon-устройств через QFIL/MiFlash                          |
| **Meta Mode (MediaTek)**           | MediaTek USB Port + Meta                                   | Зажать Vol+ + Vol– → вставить кабель                                                      | Ремонт IMEI, NVram через Maui META / SN Write Tool                                          |
| **9006 / Diag mode (Qualcomm)**    | Qualcomm HS-USB Diagnostics 9006                       | Специальные команды или QPST                                                              | Ремонт IMEI, QCN, включение диаг-порта                                                      |
| **Safe Mode**                      | —                                                      | Зажать Power → долго держать «Перезагрузка» → ОК                                          | Запуск без сторонних приложений (для удаления вирусов)                                      |
| **Emergency Mode (Xiaomi)**        | —                                                      | `adb reboot disem` или 7 раз быстро нажать кнопку Power                                   | Прошивка через MiAssistant когда обычный fastboot не работает                              |

### Самые важные комбинации кнопок (2025)

| Бренд          | Fastboot                  | Recovery                   | EDL 9008                     | BROM (MTK)                  |
|----------------|---------------------------|----------------------------|------------------------------|-----------------------------|
| Xiaomi/Redmi   | Vol– + Power              | Vol+ + Power               | Vol+ + Vol– + кабель         | Vol– + кабель               |
| Samsung        | Vol– + Power (новые)      | Vol+ + Power               | Vol– + Power + кабель        | —                           |
| Realme/OPPO    | Vol– + Power              | Vol+ + Power               | Vol+ + Vol– + кабель         | Vol– + кабель               |
| Huawei/Honor   | Vol– + Power + кабель     | Vol+ + Power + кабель      | Тест-поинт (чаще всего)      | Vol– + кабель (старые MTK)  |

Сохрани эту таблицу — и больше никогда не спутаешь, куда и как зайти!