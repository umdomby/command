import os
import xml.etree.ElementTree as ET
import shutil

# === НАСТРОЙКИ (только эти две строки, если у тебя другие пути) ===
ROM_PATH = r'C:\lancelot_global_images_V13.0.4.0.SJCMIXM'
EXTRACTED_SUPER = r'C:\super_extracted'          # ← сюда ты уже распаковал super.img
# ==================================================================

IMAGES_PATH = os.path.join(ROM_PATH, 'images')
OUTPUT_PATH = os.path.join(ROM_PATH, 'qfil_ready')
os.makedirs(OUTPUT_PATH, exist_ok=True)

# Копируем все распакованные образы из super.img в папку для QFIL
print("Копируем образы из super...")
for file in os.listdir(EXTRACTED_SUPER):
    if file.endswith('.img'):
        shutil.copy(os.path.join(EXTRACTED_SUPER, file), OUTPUT_PATH)

# Копируем остальные образ emphasisedы (boot, vbmeta, recovery и т.д.)
print("Копируем остальные файлы...")
for file in os.listdir(IMAGES_PATH):
    if file.endswith(('.img', '.bin', '.elf', '.mbn')) and file != 'super.img':
        shutil.copy(os.path.join(IMAGES_PATH, file), OUTPUT_PATH)

# Создаём правильный rawprogram0.xml для Redmi 9 (lancelot)
rawprogram = '''<?xml version="1.0" ?>
<data>
  <program SECTOR_SIZE_IN_BYTES="512" file_sector_offset="0" filename="system.img" label="system" num_partition_sectors="5368709" physical_partition_number="0" size_in_KB="2621440" sparse="false" start_sector="0"/>
  <program SECTOR_SIZE_IN_BYTES="512" file_sector_offset="0" filename="vendor.img" label="vendor" num_partition_sectors="1310720" physical_partition_number="0" size_in_KB="640000" sparse="false" start_sector="0"/>
  <program SECTOR_SIZE_IN_BYTES="512" file_sector_offset="0" filename="product.img" label="product" num_partition_sectors="1048576" physical_partition_number="0" size_in_KB="512000" sparse="false" start_sector="0"/>
  <program SECTOR_SIZE_IN_BYTES="512" file_sector_offset="0" filename="odm.img" label="odm" num_partition_sectors="262144" physical_partition_number="0" size_in_KB="128000" sparse="false" start_sector="0"/>
  <program SECTOR_SIZE_IN_BYTES="512" file_sector_offset="0" filename="system_ext.img" label="system_ext" num_partition_sectors="524288" physical_partition_number="0" size_in_KB="256000" sparse="false" start_sector="0"/>
  <program SECTOR_SIZE_IN_BYTES="512" file_sector_offset="0" filename="boot.img" label="boot" num_partition_sectors="131072" physical_partition_number="0" size_in_KB="65536" sparse="false" start_sector="0"/>
  <program SECTOR_SIZE_IN_BYTES="512" file_sector_offset="0" filename="vbmeta.img" label="vbmeta" num_partition_sectors="16" physical_partition_number="0" size_in_KB="8" sparse="false" start_sector="0"/>
  <program SECTOR_SIZE_IN_BYTES="512" file_sector_offset="0" filename="vbmeta_system.img" label="vbmeta_system" num_partition_sectors="16" physical_partition_number="0" size_in_KB="8" sparse="false" start_sector="0"/>
  <program SECTOR_SIZE_IN_BYTES="512" file_sector_offset="0" filename="vbmeta_vendor.img" label="vbmeta_vendor" num_partition_sectors="16" physical_partition_number="0" size_in_KB="8" sparse="false" start_sector="0"/>
  <program SECTOR_SIZE_IN_BYTES="512" file_sector_offset="0" filename="recovery.img" label="recovery" num_partition_sectors="196608" physical_partition_number="0" size_in_KB="98304" sparse="false" start_sector="0"/>
  <program SECTOR_SIZE_IN_BYTES="512" file_sector_offset="0" filename="dtbo.img" label="dtbo" num_partition_sectors="16384" physical_partition_number="0" size_in_KB="8192" sparse="false" start_sector="0"/>
</data>'''

with open(os.path.join(OUTPUT_PATH, 'rawprogram0.xml'), 'w', encoding='utf-8') as f:
    f.write(rawprogram)

# Пустой patch0.xml (для Redmi 9 обычно пустой)
patch = '<?xml version="1.0" ?><data></data>'
with open(os.path.join(OUTPUT_PATH, 'patch0.xml'), 'w', encoding='utf-8') as f:
    f.write(patch)

print("ГОТОВО!")
print(f"Всё лежит здесь: {OUTPUT_PATH}")
print("Теперь открывай QFIL → Flat Build → Programmer → любой .elf из этой папки → Load XML → rawprogram0.xml + patch0.xml → Download")