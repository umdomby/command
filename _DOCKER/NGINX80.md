Сервер Nginx, который обрабатывает HTTP-запросы на порт 80, может не быть настроен правильно для обработки 
.well-known/acme-challenge/ запросов.

Docker может не пробрасывать порты корректно, или порты могут быть заняты другими процессами или контейнерами.

Сервер, на котором работает Docker, может быть недоступен извне (например, брандмауэр или настройки безопасности могут блокировать подключение).


sudo netstat -tuln | grep ':80\|:443'


Проверьте доступность домена с внешнего устройства, например, с помощью команды:

sudo ufw allow 80,443/tcp


curl http://anybet.site/.well-known/acme-challenge/testfile

curl http://anybet.site

curl http://anybet.site/.well-known/acme-challenge/testfile


curl http://anycoin.site/.well-known/acme-challenge/testfile
