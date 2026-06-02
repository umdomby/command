Hoverboard smart balance 10 для подключения к ESP PA2,PA3,GND
15v (3.3v)
PA2
PA3
GND




GPIO16 (15)     PA3 ESP RX ← Hover TX
GPIO17 (16)     PA2 ESP TX → Hover RX
GND             GNDО         бщаяземля
ESP32-S3        Hoverboard (левый кабель)

# команды
S 60 → оба колеса медленно вперёд
S -60 → оба назад
L 60 → только левое колесо вперёд
R -60 → только правое колесо назад
T 60 → разворот влево
B или STOP → тормоз



