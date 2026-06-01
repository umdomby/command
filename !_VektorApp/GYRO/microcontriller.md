ARM STM32F103RCT6990GA 98 MYS 99 730

Hoverboard smart balance 10 классических платах от TaoTao

мне нужно подпаяться к плате прошить программатором файл найти файл и управлять оборотами двигателя и принимать показания от датчиков холла , 
динамическое торможение и рекуперация если есть опиши все подробно, как сделать где найти

SWD-пины для программирования (самое важное):
Обычно на плате есть площадки или отверстия рядом с микроконтроллером:

# SOFT

STM32 ST-LINK Utility
STM32CubeProgrammer

# Важно: 
Перед первой прошивкой плата может быть защищена read protection. Сними защиту в STM32CubeProgrammer (Full chip erase + disable RDP).

# модифицировать config.h:
Максимальный ток
Торможение
Режимы контроля


3.3V (VCC)
SWDIO (PA13)
SWCLK (PA14)
GND

Hoverboard smart balance 10 SWD-пины
https://www.youtube.com/watch?v=eWZVEjJW-9Q&list=PLeQcqtKhNVvE-qdg_MPHeMht4wsRgT4hv

# git
https://github.com/EFeru/hoverboard-firmware-hack-FOC

# Через ST-Link (самый надёжный способ для этих плат):
Используй STM32CubeProgrammer
Выбери firmware.bin
Address = 0x08000000
Нажми Download

# Или через PlatformIO:
Bashpio run -t upload


ESP32 с хорошей обработкой пакетов и защитой от мусора в UART