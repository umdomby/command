Отключите автоматическую установку драйверов в Windows
Чтобы Windows не устанавливала драйверы автоматически (особенно некорректные):

Нажмите Win + R, введите gpedit.msc (если у вас Windows Pro/Enterprise) или sysdm.cpl (для всех версий).

Перейдите в:

Конфигурация компьютера → Административные шаблоны → Система → Установка устройства → Ограничения на установку устройства
Включите политику "Запретить установку устройств, не описанных другими параметрами политики".

Примените изменения и перезагрузите ПК.

Альтернативный способ (через реестр):

Откройте regedit и перейдите в:

HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Microsoft\Windows\DeviceInstall\Restrictions
Создайте DWORD-параметр DenyUnspecified со значением 1.

5. Проверьте права доступа к COM-порту
   Если ошибка PermissionError(13, 'Отказано в доступе'), возможно, порт занят другой программой (например, Arduino IDE, терминалом).

Закройте все программы, которые могут использовать COM-порт.

Попробуйте отключить и снова подключить устройство.

6. Измените COM-порт вручную
   В Диспетчере устройств найдите ваше устройство в разделе Порты (COM и LPT).

Кликните правой кнопкой → Свойства → вкладка Параметры порта → Дополнительно.

Измените номер COM-порта на другой (например, COM4 или COM9), если COM8 занят.

7. Попробуйте PlatformIO с явным указанием порта
   В platformio.ini укажите порт явно:

ini
upload_port = COM8
monitor_port = COM8

8. Проверьте Python и зависимости
   Убедитесь, что у вас установлены последние версии:

sh
pip install -U pyserial esptool platformio