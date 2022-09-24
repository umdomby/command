sudo dmesg | grep tty      #просмотр устройств  
sudo chmod 777 /dev/ttyUSB0               #права на порт
sudo chmod 777 /dev/ttyUSB0

sudo usermod -a -G dialout $USER

sudo adduser pi dialout
sudo reboot


Это происходит из-за конфликта между идентификаторами продуктов (программа чтения с экрана Брайля и мой чип на базе CH340). Вот решение:

Редактировать/usr/lib/udev/rules.d/85-brltty.rules
Найдите эту строку и закомментируйте ее:  
ENV{PRODUCT}=="1a86/7523/*", ENV{BRLTTY_BRAILLE_DRIVER}="bm", GOTO="brltty_usb_run"  
reboot  
Подробнее о https://unix.stackexchange.com/questions/670636/unable-to-use-usb-dongle-based-on-usb-serial-converter-chip

#? sudo apt remove brltty