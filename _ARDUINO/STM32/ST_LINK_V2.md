ST-LINK V2

ST-LINK V2Blue      Pill (STM32F103C8)

SWDIO               PA13 (или SWDIO)
SWCLK               PA14 (или SWCLK)
GND                 GND (любой)3.3V3.3V
3.3V                3.3V


Что делать сейчас:

Вернись в STM32CubeIDE
Собери проект:
Нажми кнопку Build (молоточек) или Ctrl + B

Сгенерируй .hex файл:
Правой кнопкой по проекту → Properties
Перейди: C/C++ Build → Settings
Слева выбери MCU Post build outputs
Поставь галочку Convert to Intel Hex file (-O ihex)
Нажми Apply and Close

Снова Build проект (Ctrl + B)

Теперь в папке Debug должен появиться файл с расширением .hex