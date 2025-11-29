# Проверка статуса загрузчика и FRP на Xiaomi Redmi 9 (и любом другом Redmi/Xiaomi)

Подключи телефон в **fastboot-режим**  
(Выключен → зажми **Громкость ВНИЗ + Питание** → появится надпись FASTBOOT)

### Команды и расшифровка

| № | Команда                                    | Что показывает                                 | Хороший результат (можно шить)       | Плохой результат (нужно снимать)       |
|---|--------------------------------------------|------------------------------------------------|---------------------------------------|-----------------------------------------|
| 1 | `fastboot getvar unlocked`                 | Разблокирован ли загрузчик                     | `unlocked: yes`                       | `unlocked: no`                          |
| 2 | `fastboot oem device-info`                 | Полная информация о блокировках                 | `Device unlocked: true`<br>`Device critical unlocked: true` | `false` в любой из строк                |
| 3 | `fastboot getvar all`                      | ВСЁ сразу (самая полная команда)               | Ищи `unlocked: yes`, `frp: off`       | `unlocked: no` или `frp: on`            |
| 4 | `fastboot getvar anti`                     | Уровень анти-отката                            | Любая цифра (0–5) — нормально         | —                                       |
| 5 | `fastboot getvar secure`                   | Привязка к Mi-аккаунту                         | `secure: no`                          | `secure: yes`                           |
| 6 | **Самая удобная команда (всё нужное одной строкой)** | —                                      | —                                     | —                                       |

```powershell
fastboot oem device-info 2>&1 | findstr -i "unlocked critical tampered frp"
Пример чистого телефона (всё открыто, FRP снят)
text(bootloader)    Device tampered: true
(bootloader)    Device unlocked: true
(bootloader)    Device critical unlocked: true
(bootloader)    frp state: off

The system has been destroyed

Телефон полностью заблокирован:

загрузчик закрыт
Secure Boot включён
FRP скорее всего включён