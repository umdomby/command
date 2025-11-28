# ADB vs Fastboot vs Другие режимы — когда что работает (2025)

| Режим телефона                              | ADB работает? | Fastboot работает? | Что видно в командах                                      | Как попасть в этот режим                              |
|---------------------------------------------|---------------|--------------------|-----------------------------------------------------------|-------------------------------------------------------|
| Обычная система (Android запущен)           | Да            | Нет                | `adb devices` → `device`                                  | Просто включён + отладка по USB включена              |
| Стоковое рекавери (MIUI/EMUI/Stock Recovery)| Да (чаще всего)| Нет                | `adb devices` → `recovery` или `sideload`                 | Vol+ + Power или `adb reboot recovery`                |
| Кастомное рекавери (TWRP, OrangeFox и т.д.) | Да            | Нет                | `adb devices` → `recovery`                                | Через fastboot или кнопки                             |
| Fastboot / Bootloader режим                 | Нет           | Да                 | `fastboot devices` → `fastboot`                           | Vol– + Power или `adb reboot bootloader`              |
| Телефон полностью выключен (чёрный экран)   | Нет           | Нет                | Ничего не видно                                           | —                                                     |
| MediaTek BROM / Preloader                   | Нет           | Нет                | В диспетчере → MediaTek PreLoader USB VCOM (COMx)         | Выключен + подключить кабель (часто с Vol–)           |
| Qualcomm EDL (9008)                         | Нет           | Нет                | В диспетчере → Qualcomm HS-USB QDLoader 9008 (COMx)       | Специальные кнопки / `fastboot oem edl` / тест-поинт  |
| Sideload mode в стоковом рекавери           | Да (только sideload)| Нет           | `adb devices` → `sideload`                                | В рекавери выбрать «Apply update from ADB»            |
| Download mode (Odin) — Samsung              | Нет           | Нет                | Определяется как Samsung USB Driver                       | Vol– + Home + Power (старые) или новые комбинации    |

### Краткое правило запомнить навсегда:
- **ADB** → телефон должен быть **включён хотя бы частично** (система или рекавери)
- **Fastboot** → телефон в **режиме загрузчика** (bootloader)
- **SP Flash Tool / BROM** → телефон **выключен**, ловим COM-порт
- **QPST / QFIL / EDL** → телефон в режиме 9008

Сохрани эту табличку — больше никогда не запутаешься!