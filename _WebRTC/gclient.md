gclient — это не самостоятельная программа, а Python-скрипт (gclient.py)

Он ожидает команду (например, sync, config, status), а --version не является командой.

В отличие от многих утилит (например, git --version), gclient не поддерживает прямой вывод версии через --version.

Как узнать версию gclient?
Есть несколько способов:

1. Проверить путь к скрипту и его содержимое
   sh
   which gclient

/home/pi/depot_tools/gclient
cat $(which gclient) | grep "VERSION"