STMicroelectronics
VS Code + STM32CubeIDE
https://www.st.com/en/development-tools/stm32cubeprog.html
https://www.st.com/content/st_com/en/stm32cubemx.html?tab=installer#stm32-software-downloads-container

Установи следующие расширения (Extensions):
STM32CubeIDE (официальное от STMicroelectronics)
C/C++ (от Microsoft)
Cortex-Debug (для отладки)
CMake (от twxs)
CMake Tools (от Microsoft)

Нажми Ctrl+Shift+X → найди STM32CubeIDE

# Создание проекта
Нажми Ctrl+Shift+P → введи STM32: Create Project


# STM32CubeMX — программа для визуальной настройки контроллера. 
В ней кликом мышки выбираются ножки (например, PA10 как RX), настраивается скорость UART, включается DMA и генерируется готовый проект.


# STM32CubeIDE — полноценная среда разработки (IDE), где пишется код, 
компилируется и прошивается плата. Рекомендуется использовать её, так как CubeMX уже встроен внутрь этой программы.