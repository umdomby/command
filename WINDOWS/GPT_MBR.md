Windows 11 поддерживает MBR ?Что за ошибка No child node, aborting
Cloud not find kernel image: / jinn/data/syslinux.cfg
записывал загрузочную флешку в MBR Windows 11 , отвечай на русском


1. Secure Boot (отключение)
   Раздел: Boot / Security / Authentication

Пункт: Secure Boot → Disabled

2. Legacy/CSM Mode (включение)
   Раздел: Boot / Advanced / CSM (Compatibility Support Module)

Пункты:

Launch CSM → Enabled

Boot Mode → Legacy (или UEFI and Legacy, если есть выбор)

Storage OpROM Policy → Legacy (если есть)

Примеры для разных производителей
Производитель	Где искать
ASUS	Boot → CSM → Enabled
MSI	Settings → Advanced → Windows OS Configuration → CSM
Gigabyte	BIOS Features → CSM Support → Enabled
ASRock	Boot → CSM → Enabled
HP/Dell/Lenovo	Boot Options → Legacy Support или CSM