services:
# Ваш существующий NGINX (без изменений)
nginx:
build:
context: .
ports:
- "80:80"
- "443:443"
- "444:444"
volumes:
- ./nginx.conf:/etc/nginx/nginx.conf:ro
- ./letsencrypt:/etc/letsencrypt
- ./html:/usr/share/nginx/html
- ./ip:/usr/share/nginx/ip
- ./gamerecords:/usr/share/nginx/gamerecords
- ./anybet:/usr/share/nginx/anybet
- ./anycoin:/usr/share/nginx/anycoin
- ./ardu:/usr/share/nginx/ardu
- ./it-startup:/usr/share/nginx/it-startup
- ./site1:/usr/share/nginx/html/site1
- ./site2:/usr/share/nginx/html/site2
- ./certbot/www:/var/www/certbot
restart: unless-stopped
networks:
- sharednetwork

# Ваш certbot (без изменений)
certbot:
image: certbot/certbot
volumes:
- ./letsencrypt:/etc/letsencrypt
- ./certbot/www:/var/www/certbot
entrypoint: "/bin/sh -c 'trap exit TERM; while :; do sleep 12h & wait $${!}; certbot renew; done;'"
networks:
- sharednetwork

# TURN-сервер (coturn)
coturn:
image: coturn/coturn:4.6.2
container_name: coturn
restart: unless-stopped
network_mode: host  # Используем host-режим для лучшей работы UDP
ports:
- "3478:3478/udp"
- "3478:3478/tcp"
- "5349:5349/tcp"
- "49152-50000:49152-50000/udp"  # Расширенный диапазон для медиаданных
volumes:
- ./turnserver.conf:/etc/coturn/turnserver.conf:ro
- ./letsencrypt/live/ardua.site/fullchain.pem:/etc/coturn/certs/fullchain.pem:ro
- ./letsencrypt/live/ardua.site/privkey.pem:/etc/coturn/certs/privkey.pem:ro
- ./turn_logs:/var/log/coturn  # Убрано дублирование логов
environment:
- TURN_EXTERNAL_IP=213.184.249.66
- TURN_REALM=ardua.site
- TURN_MIN_PORT=49152
- TURN_MAX_PORT=50000  # Соответствует расширенному диапазону
- TURN_SECRET=ardua_secret_symbol  # Только секрет для WebRTC
#    sysctls:
#      - net.core.somaxconn=4096  # Уменьшено до разумного значения
    ulimits:
      nofile:
        soft: 65536  # Уменьшено, но достаточно для большинства случаев
        hard: 65536

networks:
sharednetwork:
external: true