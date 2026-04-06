picoCam-303C I2D303C-RCA11

 — это аналог модели IDS UI-5240CP-C-HQ
192.168.87.2
255.255.255.0

pip install pyueye opencv-python numpy

Открой CMD (Командную строку) от имени Администратора.

Введи следующую команду и нажми Enter:

Bash
pip install pyueye opencv-python numpy
После установки проверь, что библиотека появилась в списке:

Bash
pip list


https://www.sick.com/pl/ru
Скачайте SICK GigE Vision SDK:
Перейдите на официальный сайт SICK по ссылке: SICK GigE Vision SDK (v2.4.9629.0).
Это версия специально для вашей модели picoCam-303C.
Где найти файл после установки:
Установите этот пакет. Нужный файл прошивки появится по пути:
C:\Program Files\SICK\GigE Vision SDK\Firmware\picoCam\picoCam-303C_GigE_Vision_4.96.0998.ifw

IDS peak Cockpit ids-peak-win-standard-setup-64-2.19.0.0 установить guf  picoCam-303C (I2D303C) SopasET64 - только драйвер GigE Vision
IDS GigE Vision Core и GenTL Producer.
524x
https://en.ids-imaging.com/download-details/AB02027.html

прошивка сбрасывается на 0.00.0000, потому что происходит конфликт между драйвером uEye (от IDS) и протоколом GigE Vision (который нужен для SOPAS).

IDS Software Suite
IDS peak Cockpit
uEye Cockpit
IDS Camera Manager
Interface: Ethernet
Family: uEye CP (это аппаратная платформа вашей камеры)
Model: UI-5240CP-C-HQ (это полный технический аналог вашей камеры с тем же сенсором e2v 1.3 MP)
https://en.ids-imaging.com/download-details/AB02611.html

picoCam-303C (I2D303C)
SopasET64 - только драйвер GigE Vision
IDS Software Suite (обычно это версия 4.96.1 или новее).
IDS peak Cockpit 64-2.20.0.0-484-full
https://www.sick.com/media/pdf/8/38/338/dataSheet_I2D303C-2RCA11_6071824_en.pdf

https://www.1stvision.com/cameras/IDS-imaging-software#

IDS Software Suite 4.96.1. Во время установки обязательно выберите "Custom" (Выборочная) и убедитесь, что отмечен пункт "GigE uEye" или "uEye Transport Layer".
https://en.ids-imaging.com/release-note/items/release-notes-ids-software-suite-4-96.html

https://en.ids-imaging.com/download-peak.html

uEye Transport Layer ids software Suite 4.95

I2D303C-RCA11
Ваша камера picoCam-303C — это аналог модели IDS UI-5240CP-C-HQ (на базе сенсора e2v).
mac 00:1B:A2:00:29:25
p/n 6060395
s/n 1615 0036
ncpa.cpl

ids_ipconfig.exe -F -s 16150036 -i 192.168.88.95 -n 255.255.255.0

IDS peak Extended Setup C:\Program Files\IDS\ids_peak\firmware\uEye\


driver link
IDS GigE Vision Core
IDS GigE Filter Driver

cd "C:\Program Files\IDS\ids_peak\program"
ids_ipconfig.exe /l

ids_ipconfig.exe -F -m 00:1b:a2:00:29:25 -i 192.168.88.95 -n 255.255.255.0

ids_ipconfig.exe /a 192.168.88.95 /m 255.255.255.0 /i 00:1b:a2:00:29:25 /f


/a — желаемый IP камеры.
/m — маска подсети (обычно 255.255.255.0).
/i — ваш MAC-адрес (из Wireshark).
/f — Force IP (принудительная запись).

ids_ipconfig.exe --force-addr --mac 00:1b:a2:00:29:25 --ip 192.168.88.95 --subnet-mask 255.255.255.0
ids_ipconfig.exe -F -m 00:1b:a2:00:29:25 -i 192.168.88.95 -n 255.255.255.0




https://www.sick.com/us/en/s/downloads?category=g569793
Open DHCP Server или TFTPServer) и запустите DHCP-сервис на вашем сетевом адаптере. Камера получит адрес из заданного вами диапазона, и SOPAS её увидит.

arp -s 192.168.0.139 00-1b-a2-00-29-25

устройства (как IDS Imaging) часто используют протокол BOOTP (предшественник DHCP).
Посмотрите в Wireshark: в пакете от 0.0.0.0 на 255.255.255.255 раскройте вкладку Bootstrap Protocol (DHCP). Посмотрите поле Message type: если там написано Boot Request (1), а не DHCP Discover, значит роутер его точно проигнорирует.

DHCP Server for Windows

ids-imaging.com
https://en.ids-imaging.com/download-peak.html#anc-driver