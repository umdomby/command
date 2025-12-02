Как 100 % попасть в BROM (проверено на сотнях таких же кирпичей):

драйвер должен быть libusb-win32 devices - устройство с последовательным интерфейсом USB?

Наличие SLA/DAA (Secure Boot).
загрузчик закрыт
Secure Boot включён
FRP
Все это лечит MTK Client через BROM в Readmi9 ?

Отключи кабель от телефона
В Диспетчере устройств удали Android Bootloader Interface (правой кнопкой → удалить устройство)
Удали также всё, что связано с COM6 (если появилось)
Полностью выключи телефон — держи кнопку питания 15–20 секунд (даже если экран чёрный — держи, чтобы сбросить любой режим)
Запусти команду от имени администратора:

zadig-2.9.exe - ловить BROOM

cd "F:\Program\ANDROID\mtkclient-2.0.1.freeze"

py -3.11 mtk.py da seccfg unlock



F:\Program\ANDROID\mtkclient-2.0.1.freeze

cd "F:\Program\ANDROID\mtkclient-2.0.1.freeze"

"F:\Program\ANDROID\mtkclient-2.0.1.freeze\mtkclient\Library\DA\mtk_da_handler.py"


py -3.11 mtk.py da seccfg unlock
py -3.11 mtk.py reset frp
py -3.11 mtk.py w super "C:\lancelot_global_images_V13.0.4.0.SJCMIXM\images\super.img"
py -3.11 mtk.py w vbmeta "C:\lancelot_global_images_V13.0.4.0.SJCMIXM\images\vbmeta.img"
py -3.11 mtk.py w vbmeta_system "C:\lancelot_global_images_V13.0.4.0.SJCMIXM\images\vbmeta_system.img"
py -3.11 mtk.py w vbmeta_vendor "C:\lancelot_global_images_V13.0.4.0.SJCMIXM\images\vbmeta_vendor.img"
py -3.11 mtk.py reset


zadig-2.9.exe - ловить BROOM


# ПРОБЛЕМА
SLA/DAA (Secure Boot) - SLA/DAA (Secure Boot) в Redmi/Poco на процессорах MediaTek — это аппаратная защита, которую Xiaomi начала включать примерно с 2020–2021 года, чтобы обычными бесплатными инструментами (mtkclient, SP Flash Tool и т.д.) нельзя было:
разблокировать загрузчик
снять FRP
прошить инженерную прошивку
получить полный доступ к разделам

загрузчик закрыт
Secure Boot включён
FRP 


