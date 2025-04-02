1. Установка Coturn на сервер (Ubuntu/Debian)
   bash
   Copy
# Обновление пакетов
sudo apt update && sudo apt upgrade -y

# Установка Coturn
sudo apt install coturn -y

# Включение автозапуска
sudo systemctl enable coturn
2. Настройка Coturn (основной конфиг)
   Отредактируйте файл конфигурации:

bash
Copy
sudo nano /etc/turnserver.conf
Добавьте следующие настройки:

ini
Copy
# Общие настройки
listening-port=3478
tls-listening-port=5349
listening-ip=ВАШ_IP_СЕРВЕРА
external-ip=ВАШ_ПУБЛИЧНЫЙ_IP
min-port=49152
max-port=65535
verbose
fingerprint
lt-cred-mech

# Безопасность
use-auth-secret
static-auth-secret=ВАШ_СЕКРЕТНЫЙ_КЛЮЧ

# Логи
log-file=/var/log/turn.log
simple-log
3. Создание пользователей (альтернативный метод)
   Для простой аутентификации добавьте в конец конфига:

ini
Copy
user=username1:password1
user=username2:password2
Или для динамических учетных данных используйте:

ini
Copy
# Использование общего секрета для генерации временных учетных данных
use-auth-secret
static-auth-secret=ВАШ_СЕКРЕТНЫЙ_КЛЮЧ
4. Настройка брандмауэра
   bash
   Copy
# Открытие портов
sudo ufw allow 3478/udp
sudo ufw allow 3478/tcp
sudo ufw allow 5349/udp
sudo ufw allow 5349/tcp
sudo ufw allow 49152:65535/udp
5. Запуск сервера
   bash
   Copy
   sudo systemctl restart coturn
6. Проверка работы
   bash
   Copy
# Проверка статуса
sudo systemctl status coturn

# Просмотр логов
tail -f /var/log/turn.log
7. Настройка клиента WebRTC
   Используйте полученные данные в клиентском коде:

javascript
Copy
const pc = new RTCPeerConnection({
iceServers: [
{ urls: 'stun:stun.l.google.com:19302' },
{
urls: [
'turn:ВАШ_СЕРВЕР:3478?transport=udp',
'turn:ВАШ_СЕРВЕР:3478?transport=tcp'
],
username: 'username1',
credential: 'password1'
}
]
});


sudo systemctl restart coturn

# Просмотр логов
tail -f /var/log/turn.log

# Установка тестового клиента
sudo apt install trickle-ice -y

# Запуск теста
trickle-ice -s stun:stun.l.google.com:19302 -s turn:213.184.249.66:3478 -u username1 -p password1

https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/

Нажмите "Add Server" и введите:
- STUN: stun:stun.l.google.com:19302
- TURN: turn:213.184.249.66:3478
  Username: username1
  Credential: password1


listening-ip=0.0.0.0
external-ip=213.184.249.66
realm=anybet.site
user=username1:password1


turnutils_uclient -v -u username1 -w password1 -y 213.184.249.66