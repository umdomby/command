Hoverboard smart balance 10 для подключения к ESP PA2,PA3,GND
15v (3.3v)
PA2
PA3
GND




GPIO16 (15pin на плате)     PA3 ESP RX ← Hover TX
GPIO17 (16pin на плате)     PA2 ESP TX → Hover RX
GND             GNDО         бщаяземля
ESP32-S3        Hoverboard (левый кабель)



TX (например, GPIO 17)	Передача данных	RX (USART3 RX PB11)
RX (например, GPIO 16)	Прием данных	TX (USART3 TX PB10)

# команды
S 60 → оба колеса медленно вперёд
S -60 → оба назад
L 60 → только левое колесо вперёд
R -60 → только правое колесо назад
T 60 → разворот влево
B или STOP → тормоз



