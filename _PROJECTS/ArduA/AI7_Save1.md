# Используем официальный образ NGINX
FROM nginx:latest

# Копируем конфиг NGINX
COPY ./nginx.conf /etc/nginx/nginx.conf

# Создаём папки для SSL-сертификатов и проверяем их наличие
RUN mkdir -p /etc/letsencrypt/live /etc/letsencrypt/archive \
&& chmod -R 755 /etc/letsencrypt

# Копируем директории для веб-контента (если нужно)
COPY ./html /usr/share/nginx/html
COPY ./ip /usr/share/nginx/ip
COPY ./gamerecords /usr/share/nginx/gamerecords
COPY ./anybet /usr/share/nginx/anybet
COPY ./anycoin /usr/share/nginx/anycoin
COPY ./ardu /usr/share/nginx/ardu
COPY ./it-startup /usr/share/nginx/it-startup
COPY ./site1 /usr/share/nginx/html/site1
COPY ./site2 /usr/share/nginx/html/site2
COPY ./certbot/www /var/www/certbot

# Открываем порты, указанные в docker-compose.yml
EXPOSE 80 443 444

# Запускаем NGINX в режиме foreground
CMD ["nginx", "-g", "daemon off;"]



