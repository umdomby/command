https://browserleaks.com/webrtc

2. Проверка через nmap (командная строка)
   bash
   Copy
   nmap -sU -p 19302 stun.l.google.com
   Если порт открыт, будет статус open.

3. Проверка через telnet или nc (Netcat)
   bash
   Copy
   nc -zv stun.l.google.com 19302
   Или (если установлен telnet):

bash
Copy
telnet stun.l.google.com 19302
Если соединение устанавливается — сервер отвечает.

4. Проверка через Wireshark/tcpdump
   Запустите захват трафика и отправьте STUN-запрос (например, через WebRTC-приложение). Фильтр в Wireshark:

text
Copy
stun || udp.port == 19302
Если видите STUN-пакеты с ответами — сервер работает.

5. Проверка через код (Python пример)
   Установите библиотеку pystun3:

bash
Copy
pip install pystun3
Запустите проверку:

python
Copy
import stun
nat_type, external_ip, external_port = stun.get_ip_info(stun_host="stun.l.google.com", stun_port=19302)
print(f"Тип NAT: {nat_type}, Публичный IP: {external_ip}:{external_port}")