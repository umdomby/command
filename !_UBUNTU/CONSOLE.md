Способ 1: Добавить пункт "Open in Ubuntu" (или другой дистрибутив) в контекстное меню

    Откройте редактор реестра (Win + R → regedit → Enter).

    Перейдите в:
    Copy

    HKEY_CLASSES_ROOT\Directory\Background\shell\

    Создайте новый раздел (папку) с именем, например, WSL2_Here.

    В этом разделе создайте строковый параметр (REG_SZ) с именем Icon и значением:
    Copy

    C:\Windows\System32\wsl.exe

    Создайте подраздел command внутри WSL2_Here.

    В command измените значение по умолчанию на:
    Copy

    wsl.exe --cd "%v"

    (Если используете конкретный дистрибутив, например Ubuntu, можно указать ubuntu.exe вместо wsl.exe).

Теперь при правом клике в проводнике появится пункт "Open in WSL2", который откроет терминал в текущей папке.
