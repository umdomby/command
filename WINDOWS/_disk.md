Нажмите Win + X → "Терминал Windows (администратор)" или "Командная строка (администратор)".

Введите diskpart и нажмите Enter.

Определите номер диска:

Введите list disk и найдите нужный диск (по размеру).

Запомните номер диска (например, Диск 1).

Очистите диск и конвертируйте в MBR:

diskpart
list disk
select disk 3       # замените 1 на номер вашего диска
clean               # полностью очистит диск
convert mbr         # преобразует в MBR
convert gpt            # Преобразовать диск в GPT
exit                # выйти из DiskPart



create partition primary   # Создать основной раздел
format fs=ntfs quick       # Быстрое форматирование в NTFS
assign letter=E            # Назначить букву диска (например, E:)
exit                       # Выйти из DiskPart


create partition primary   # Создать основной раздел
format fs=fat32 quick      # Быстрое форматирование в FAT32
assign letter=E            # Назначить букву диска (например, E:)
exit                       # Выйти из DiskPart
format fs=fat32 quick override  # Принудительное форматирование