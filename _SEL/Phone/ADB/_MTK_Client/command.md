https://www.python.org/ftp/python/3.11.9/python-3.11.9-amd64.exe
Запусти скачанный файл и ОБЯЗАТЕЛЬНО поставь галочку
    «Add python.exe to PATH» (внизу окна установки)
Потом просто жми Install Now.
После установки перезагрузи PowerShell (закрой и открой заново) или перезагрузи компьютер.
Проверь, что всё встало:PowerShell
    python --version
    pip --version
Должно выдать что-то вроде Python 3.11.9 и pip 24.x.


Пошагово (ровно 7 команд в PowerShell — 5–10 минут)

Открой PowerShell от администратора
Перейди в папку с MTK Client:PowerShell
cd "F:\Program\ANDROID\mtkclient-2.0.1.freeze"

Установи зависимости (один раз):PowerShell
pip install -r requirements.txt


# 1. Обход SLA/DAA + разблокировка загрузчика
python mtk.py da seccfg unlock
# → подключи выключенный телефон, когда попросит

# 2. Удаление FRP
python mtk.py reset frp
# → снова подключи выключенный телефон

# 3. Заливка основных разделов
python mtk.py w super "C:\lancelot_global_images_V13.0.4.0.SJCMIXM_20230111.0000.00_12.0_global\images\super.img"
python mtk.py w vbmeta "C:\lancelot_global_images_V13.0.4.0.SJCMIXM_...\images\vbmeta.img"
python mtk.py w vbmeta_system "C:\lancelot_global_images_V13.0.4.0.SJCMIXM_...\images\vbmeta_system.img"
python mtk.py w vbmeta_vendor "C:\lancelot_global_images_V13.0.4.0.SJCMIXM_...\images\vbmeta_vendor.img"

# 4. Перезагрузка
python mtk.py reset


py -3.11 mtk.py da seccfg unlock

NotImplementedError

py -3.11 mtk.py da seccfg unlock --vid 0x0E8D --pid 0x0003

pip install colorama tqdm pycryptodome pyusb pyserial docopt
pip install .

# Укажи правильный Python (тот, где pip работает)
py -3.11 -m pip install colorama tqdm pycryptodome pyusb pyserial docopt --force-reinstall

cd "F:\Program\ANDROID\mtkclient-2.0.1.freeze"
py -3.11 mtk.py da seccfg unlock

py -3.11 -m pip install python-fuse

Открой файл по пути:
F:\Program\ANDROID\mtkclient-2.0.1.freeze\mtkclient\Library\DA\mtk_da_handler.py
Открой его в обычном Блокноте (правой кнопкой → Изменить)
Найди строку (примерно 12-я):Pythonfrom mtkclient.Library.Filesystem.mtkdafs import MtkDaFS
Поставь перед ней решётку, чтобы получилось так:Python# from mtkclient.Library.Filesystem.mtkdafs import MtkDaFS