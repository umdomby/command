docker run -it --rm --name certbot \
-v "/etc/letsencrypt:/etc/letsencrypt" \
-v "/var/lib/letsencrypt:/var/lib/letsencrypt" \
-p 80:80 \
certbot/certbot certonly --standalone -d ardua.site --email umdom2@email.com --agree-tos --non-interactive




# Сертификаты сохраняются в /etc/letsencrypt/live/ваш.домен.com/:


sudo cp -r /etc/letsencrypt/archive/ardua.site /home/pi/Projects/docker/docker-nginx/letsencrypt/archive
sudo cp -r /etc/letsencrypt/live/ardua.site /home/pi/Projects/docker/docker-nginx/letsencrypt/live
