


HEX файла нет, потому что он не настроен на генерацию.
Как сгенерировать .hex файл:

Правой кнопкой по проекту BlinkTest2 → Properties
Перейди в:
C/C++ Build → Settings
Слева в дереве выбери MCU Post build outputs
Поставь галочку напротив:
Convert to Intel Hex file (-O ihex)
Нажми Apply and Close
Project → Clean... (выбери проект)
Project → Build All (или Ctrl + B)


C:\Users\user\STM32CubeIDE\workspace_2.1.1\BlinkTest2

Target → Program & Verify...