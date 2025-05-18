docker run --rm -it \
-v /etc/letsencrypt:/etc/letsencrypt \
-p 80:80 \
certbot/certbot certonly \
--standalone \
-d ardua.site \
--email umdom2@gmail.com \
--agree-tos \
--no-eff-email


docker run --rm -it \
-v /home/pi/docker/docker-nginx/letsencrypt:/etc/letsencrypt \
-p 80:80 \
certbot/certbot certonly \
--standalone \
-d ardua.site \
--email umdom2@gmail.com \
--agree-tos \
--no-eff-email

chmod -R 755 /home/pi/docker/docker-nginx/letsencrypt

Чтобы получить SSL/TLS-сертификаты для домена ardua.site с помощью Certbot, запущенного в Docker на машине с IP 192.168.1.121 в WSL2, нужно выполнить несколько шагов. Ваша конфигурация WSL2 с bridged networking (как указано ранее) позволяет машине быть доступной в локальной сети, что важно для проверки владения доменом. Предполагаю, что:

У вас есть Docker и Certbot, установленные в WSL2 (Ubuntu).
Домен ardua.site настроен так, чтобы указывать на 192.168.1.121 (например, через A-запись в DNS).
Вы хотите использовать Certbot в Docker для получения сертификатов от Let's Encrypt.
Вот пошаговое руководство:

Шаг 1. Проверка сетевой конфигурации
Убедитесь, что 192.168.1.121 доступен:
В WSL2 выполните:
bash

Копировать
ip addr show eth0
Убедитесь, что IP-адрес — 192.168.1.121.
Проверьте доступность с другого устройства в локальной сети:
bash

Копировать
ping 192.168.1.121
Проверка DNS:
Убедитесь, что домен ardua.site указывает на 192.168.1.121:
bash

Копировать
nslookup ardua.site
В выводе должен быть IP 192.168.1.121.
Если домен не настроен, обновите A-запись в панели управления вашего регистратора доменов (например, Namecheap, GoDaddy) и подождите 5–60 минут для распространения DNS.
Проверка портов:
Let's Encrypt использует порт 80 (для HTTP-01 challenge) или 443 (для TLS-ALPN-01). Убедитесь, что порт 80 открыт:
bash

Копировать
sudo netstat -tuln | grep :80
Если порт занят, остановите временно веб-сервер (если он работает).
Шаг 2. Запуск Certbot в Docker
Предполагаю, что вы используете официальный образ Certbot (certbot/certbot). Если он еще не настроен, вот как запустить Certbot.

Создайте директорию для сертификатов:
В WSL2:
bash

Копировать
sudo mkdir -p /etc/letsencrypt
sudo chmod -R 755 /etc/letsencrypt
Запустите Certbot для получения сертификатов:
Используйте режим --standalone (Certbot сам обрабатывает HTTP-запросы на порту 80) или --webroot (если у вас есть веб-сервер). Для простоты начнем с --standalone:
bash

Копировать
docker run --rm -it \
-v /etc/letsencrypt:/etc/letsencrypt \
-p 80:80 \
certbot/certbot certonly \
--standalone \
-d ardua.site \
--email <ваш_email> \
--agree-tos \
--no-eff-email
Объяснение:
-v /etc/letsencrypt:/etc/letsencrypt — монтирует директорию для хранения сертификатов.
-p 80:80 — открывает порт 80 для проверки Let's Encrypt.
-d ardua.site — ваш домен.
--email — ваш email для уведомлений.
--agree-tos — согласие с условиями Let's Encrypt.
--no-eff-email — отключает подписку на новости EFF.
Альтернатива: режим --webroot: Если у вас уже работает веб-сервер (например, Nginx) на порту 80, используйте --webroot:
Создайте директорию для проверки:
bash

Копировать
sudo mkdir -p /var/www/certbot
Запустите Certbot:
bash

Копировать
docker run --rm -it \
-v /etc/letsencrypt:/etc/letsencrypt \
-v /var/www/certbot:/var/www/certbot \
certbot/certbot certonly \
--webroot \
--webroot-path /var/www/certbot \
-d ardua.site \
--email <ваш_email> \
--agree-tos \
--no-eff-email
Убедитесь, что ваш веб-сервер настроен для обслуживания /var/www/certbot по пути /.well-known/acme-challenge.
Шаг 3. Проверка сертификатов
После успешного выполнения команды сертификаты будут сохранены в /etc/letsencrypt/live/ardua.site/:

bash

Копировать
sudo ls /etc/letsencrypt/live/ardua.site
Вы увидите файлы:

cert.pem — сертификат.
chain.pem — цепочка сертификатов.
fullchain.pem — полный сертификат (сертификат + цепочка).
privkey.pem — приватный ключ.
Шаг 4. Настройка веб-сервера (если нужно)
Если вы используете веб-сервер (например, Nginx), настройте его для использования сертификатов:

Пример конфигурации Nginx:
nginx

Копировать
server {
listen 443 ssl;
server_name ardua.site;
ssl_certificate /etc/letsencrypt/live/ardua.site/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/ardua.site/privkey.pem;
...
}
Перезапустите Nginx:
bash

Копировать
sudo systemctl restart nginx
Или, если Nginx в Docker, перезапустите контейнер.
Шаг 5. Автоматизация обновления сертификатов
Сертификаты Let's Encrypt действительны 90 дней. Настройте автоматическое обновление:

Создайте скрипт для обновления:
bash

Копировать
nano renew-cert.sh
Добавьте:
bash

Копировать
#!/bin/bash
docker run --rm \
-v /etc/letsencrypt:/etc/letsencrypt \
-p 80:80 \
certbot/certbot renew
Сохраните и сделайте исполняемым:
bash

Копировать
chmod +x renew-cert.sh
Настройте cron для запуска:
Откройте crontab:
bash

Копировать
crontab -e
Добавьте задачу для запуска раз в неделю:
bash

Копировать
0 3 * * 0 /path/to/renew-cert.sh
Это запускает обновление каждое воскресенье в 3:00.
Возможные проблемы и решения
Ошибка "Cannot bind to port 80":
Убедитесь, что порт 80 не занят другим процессом:
bash

Копировать
sudo netstat -tuln | grep :80
Остановите веб-сервер перед запуском --standalone:
bash

Копировать
sudo systemctl stop nginx
DNS не настроен:
Если nslookup ardua.site не возвращает 192.168.1.121, проверьте DNS-записи.
Сеть WSL2:
Если 192.168.1.121 недоступен извне, проверьте настройки брандмауэра Windows:
cmd

Копировать
netsh advfirewall firewall add rule name="Allow Port 80" dir=in action=allow protocol=TCP localport=80
Убедитесь, что bridged networking работает (см. ваш .wslconfig).
Certbot в Docker не работает:
Проверьте, установлен ли Docker:
bash

Копировать
docker --version
Если образ certbot/certbot не загружен, выполните:
bash

Копировать
docker pull certbot/certbot
Дополнительные замечания
Если ardua.site — это локальный домен для тестирования, Let's Encrypt не выдаст сертификат для частных IP (например, 192.168.1.121). В этом случае используйте --staging для тестов:
bash

Копировать
--test-cert
Добавьте этот флаг в команду Certbot.
Для продакшена убедитесь, что ardua.site — публичный домен с правильной DNS-записью.






docker run -it --rm --name certbot \
-v "/etc/letsencrypt:/etc/letsencrypt" \
-v "/var/lib/letsencrypt:/var/lib/letsencrypt" \
-p 80:80 \
certbot/certbot certonly --standalone -d ardua.site --email umdom2@email.com --agree-tos --non-interactive




# Сертификаты сохраняются в /etc/letsencrypt/live/ваш.домен.com/:


sudo cp -r /etc/letsencrypt/archive/ardua.site /home/pi/Projects/docker/docker-nginx/letsencrypt/archive
sudo cp -r /etc/letsencrypt/live/ardua.site /home/pi/Projects/docker/docker-nginx/letsencrypt/live




Сначала перейдите в целевую директорию:
cd /home/pi/projects/docker/docker-nginx/letsencrypt/live/ardua.site

Затем создайте символические ссылки для каждого файла:
ln -s ../../archive/ardua.site/cert.pem cert.pem
ln -s ../../archive/ardua.site/chain.pem chain.pem
ln -s ../../archive/ardua.site/fullchain.pem fullchain.pem
ln -s ../../archive/ardua.site/privkey.pem privkey.pem
