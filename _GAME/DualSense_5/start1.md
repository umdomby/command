update
https://controller.dl.playstation.net/controller/lang/en/2100004.html


https://dualshock-tools.github.io/#

https://www.youtube.com/watch?v=kwcWCiF-q04


DSX + SimHUB для ПК


Что включить/выключить в DSX (по вашему скриншоту):

ViGEmBus_Setup_1.22.0.exe (или новее)

-Параметр Настройка
- Режим тактильной отдачиВКЛ (синяя кнопка)
- Звук в отдачуВКЛОтправляет аудио из SimHub в контроллер.
- Источник звукаDefault DeviceSimHub будет слать сюда звук.
- Задержка (мс)15–30По умолчанию 15 — нормально.
- Назначение каналовКаналы 3 и 4ОБЯЗАТЕЛЬНО! Haptic DualSense использует каналы 3–4 (левый/правый мотор).
- Смешивание звукаOFFЧтобы не мешал системный звук.
- Сквозная передача RumbleВЫКЛВАЖНО! Отключает обычную вибрацию (rumble), чтобы не конфликтовала с SimHub.


# SimHub — ДА, нужен! (без него — только базовая вибрация)
- SimHub → ShakeIt Bass Shakers → Sound Output
  → Выберите "Speaker (DualSense Wireless Controller)"
  → Активировать → Test Now → вибрация в руках!
- 