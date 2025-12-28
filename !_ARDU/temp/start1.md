version: '3.8'

services:
minio:
image: minio/minio
container_name: minio
# ports: убраны — доступ только через Nginx
environment:
MINIO_ROOT_USER: minioadmin
MINIO_ROOT_PASSWORD: minioadmin123
MINIO_SERVER_URL: https://s3.ardu.live:444
MINIO_BROWSER_REDIRECT_URL: https://s3.ardu.live:444
command: server /data --console-address ":9001"
volumes:
- minio-data:/data
networks:
- sharednetwork
restart: unless-stopped
healthcheck:
test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
timeout: 20s
retries: 3

create-bucket:
image: minio/mc
depends_on:
minio:
condition: service_healthy
entrypoint: >
/bin/sh -c "
until mc alias set myminio http://minio:9000 minioadmin minioadmin123; do
echo 'Waiting for MinIO...'
sleep 2
done;
mc mb myminio/proofs --ignore-existing;
mc anonymous set public myminio/proofs;
echo 'Bucket proofs is now fully public';
"
networks:
- sharednetwork

volumes:
minio-data:

networks:
sharednetwork:
external: true
worker_processes auto;

events {
worker_connections 1024;
}

http {

    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    include /etc/nginx/mime.types;
    sendfile on;
    keepalive_timeout 65;
    http2 on;

    #     upstream backend {
    #         server http://192.168.1.151:3000 max_fails=3 fail_timeout=5s;
    #         #server nextjs1:3000 max_fails=3 fail_timeout=5s;
    #         server nextjs2:3000 backup; # резервный сервер
    #     }

    # Блок по умолчанию для localhost
    server {
        listen 80 default_server;
        server_name _;

        root /usr/share/nginx/ip;
        index index.html;

        location / {
            try_files $uri $uri/ =404;
        }
    }

    # Сайт 1 ardua.site
    server {
        listen 80;
        listen [::]:80;
        server_name ardua.site www.ardua.site;
        return 301 https://ardua.site$request_uri;
    }

    # HTTPS redirect from www to non-www
    server {
        listen 444 ssl;
        listen [::]:444 ssl;
        server_name www.ardua.site;
        http2 on;

        ssl_certificate /etc/letsencrypt/live/ardua.site/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/ardua.site/privkey.pem;

        return 301 https://ardua.site$request_uri;
    }

    # Main HTTPS server
    server {
        listen 444 ssl;
        listen [::]:444 ssl;
        server_name ardua.site;
        http2 on;

        # SSL configuration
        ssl_certificate /etc/letsencrypt/live/ardua.site/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/ardua.site/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_prefer_server_ciphers on;
        ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # SSL session cache
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;
        ssl_session_tickets off;

        # Root location
        location / {
            # proxy_pass http://localhost:3001;
            proxy_pass http://192.168.1.121:3021;
            # proxy_pass http://ardua:3001;
              proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Forwarded-Host $host:$server_port; # Добавьте порт
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Accept-Encoding ""; # Отключение сжатия для Server Actions
            proxy_buffering off;
            proxy_read_timeout 3600;
            proxy_cache_bypass $http_upgrade;
        }

        location /wsgo {
            # proxy_pass http://localhost:8085;
            proxy_pass http://192.168.1.121:8095;
            # proxy_pass http://webrtc_server:8085;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

            # Таймауты
            proxy_read_timeout 86400;
            proxy_send_timeout 86400;
            proxy_connect_timeout 86400;

            # CORS для WebSocket
            if ($request_method = 'OPTIONS') {
                add_header 'Access-Control-Allow-Origin' 'https://ardua.site';
                  add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
                add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
                add_header 'Access-Control-Max-Age' 1728000;
                add_header 'Content-Length' 0;
                return 204;
            }

            # Отключаем буферизацию для WebSocket
            proxy_buffering off;

            add_header 'Access-Control-Allow-Origin' 'https://ardua.site' always;
        }

        # location /_next/webpack-hmr {
        #     proxy_pass http://192.168.1.141:8086;
        #     proxy_http_version 1.1;
        #     proxy_set_header Upgrade $http_upgrade;
        #     proxy_set_header Connection "upgrade";
        #     proxy_set_header Host $host;
        #     proxy_read_timeout 86400;
        #     proxy_send_timeout 86400;
        #     proxy_connect_timeout 86400;
        # }

        # WebSocket endpoint
        location /wsar {
            proxy_pass http://192.168.1.121:8096;
            # proxy_pass http://localhost:8086;
              proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_read_timeout 86400;
            proxy_send_timeout 86400;
            proxy_connect_timeout 86400;

            if ($request_method = 'OPTIONS') {
                add_header 'Access-Control-Allow-Origin' 'https://ardua.site';
                  add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
                add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
                add_header 'Access-Control-Max-Age' 1728000;
                add_header 'Content-Length' 0;
                return 204;
            }
            proxy_buffering off;
            add_header 'Access-Control-Allow-Origin' 'https://ardua.site' always;
        }
        # WebSocket endpoint
        # location /wsar {
        #     proxy_pass http://localhost:8086;
        #     # proxy_pass http://192.168.1.141:8086;
        #     # proxy_pass http://websocket-server:8086;
        #     proxy_http_version 1.1;
        #     proxy_set_header Upgrade $http_upgrade;
        #     proxy_set_header Connection "upgrade";
        #     proxy_set_header Host $host;
        #     proxy_read_timeout 86400;
        #     proxy_send_timeout 86400;
        #     proxy_connect_timeout 86400;
        # }

        # Block access to hidden files
        location ~ /\.(?!well-known) {
            deny all;
            access_log off;
            log_not_found off;
        }

        # Error handling
        error_page 500 502 503 504 /50x.html;
        location = /50x.html {
            root /usr/share/nginx/html;
            internal;
        }
    }


# Сайт 2 ardu.live
server {
listen 80;
listen [::]:80;
server_name ardu.live www.ardu.live;
return 301 https://ardu.live$request_uri;
}

server {
listen 444 ssl;
listen [::]:444 ssl;
server_name www.ardu.live;
http2 on;

    ssl_certificate /etc/letsencrypt/live/ardu.live/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ardu.live/privkey.pem;

    return 301 https://ardu.live$request_uri;
}

server {
listen 444 ssl;
listen [::]:444 ssl;
server_name ardu.live;
http2 on;

    ssl_certificate /etc/letsencrypt/live/ardu.live/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ardu.live/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;

    # Всё остальное — Next.js
    location / {
        proxy_pass http://192.168.1.121:3022;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host:$server_port;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Accept-Encoding "";
        proxy_buffering off;
        proxy_read_timeout 3600;
        proxy_cache_bypass $http_upgrade;
    }
}

###

# Основной сервер для s3.ardu.live:444 — S3 API + консоль MinIO под /minio/
server {
listen 444 ssl;
listen [::]:444 ssl;
server_name s3.ardu.live;
http2 on;

    ssl_certificate /etc/letsencrypt/live/s3.ardu.live/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/s3.ardu.live/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;

    client_max_body_size 0;
    proxy_buffering off;
    proxy_request_buffering off;
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;

    # Корень → консоль
    location = / {
        return 301 /minio/;
    }

    # Публичный бакет proofs
    location ^~ /proofs/ {
        proxy_pass http://minio:9000/proofs/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Консоль MinIO под /minio/
    location ^~ /minio/ {
        rewrite ^/minio/(.*)$ /$1 break;

        proxy_pass http://minio:9001;

        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host:$server_port;

        proxy_set_header Origin "https://$host:$server_port";
        proxy_set_header Referer "https://$host:$server_port$request_uri";

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Accept-Encoding "";

        proxy_buffering off;
        proxy_redirect off;
        proxy_cache off;

        sub_filter_once off;
        sub_filter_types text/html text/css application/javascript;

        sub_filter '<head>' '<head><base href="/minio/">';

        sub_filter "/static/" "/minio/static/";
        sub_filter "/styles/" "/minio/styles/";
        sub_filter "/media/" "/minio/media/";
        sub_filter "/manifest.json" "/minio/manifest.json";
        sub_filter "/favicon.ico" "/minio/favicon.ico";
        sub_filter "./" "/minio/";
        sub_filter '"/' '"/minio/';
        sub_filter "'/" "'/minio/";

        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # S3 API на корне
    location / {
        proxy_pass http://minio:9000;

        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        proxy_set_header Authorization $http_authorization;

        chunked_transfer_encoding off;
    }
}

    # Сайт 3 it-startup.site
    server {
        listen 80;
        listen [::]:80;
        server_name it-startup.site www.it-startup.site;
        return 301 https://it-startup.site$request_uri;
    }

    # HTTPS redirect from www to non-www
    server {
        listen 444 ssl;
        listen [::]:444 ssl;
        server_name www.it-startup.site;
        http2 on;

        ssl_certificate /etc/letsencrypt/live/it-startup.site/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/it-startup.site/privkey.pem;

        return 301 https://it-startup.site$request_uri;
    }

    # Main HTTPS server
    server {
        listen 444 ssl;
        listen [::]:444 ssl;
        server_name it-startup.site;
        http2 on;

        # SSL configuration
        ssl_certificate /etc/letsencrypt/live/it-startup.site/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/it-startup.site/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_prefer_server_ciphers on;
        ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256: ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # SSL session cache
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;
        ssl_session_tickets off;

        # Root location
        location / {
            # proxy_pass http://localhost:3033;
            proxy_pass http://192.168.1.121:3033;
            # proxy_pass http://ardua:3003;
            # proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Forwarded-Host $host:$server_port; # Добавьте порт
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Accept-Encoding ""; # Отключение сжатия для Server Actions
            proxy_buffering off;
            proxy_read_timeout 3600;
            proxy_cache_bypass $http_upgrade;
        }
    }

    # Сайт 9 champcup.site
    client_max_body_size 3000M;

    server {
        listen 80;
        listen [::]:80;
        server_name champcup.site www.champcup.site;
        return 301 https://champcup.site$request_uri;
    }

    # HTTPS redirect from www to non-www
    server {
        listen 444 ssl;
        listen [::]:444 ssl;
        server_name www.champcup.site;
        http2 on;

        ssl_certificate /etc/letsencrypt/live/champcup.site/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/champcup.site/privkey.pem;

        return 301 https://champcup.site$request_uri;
    }

    # Main HTTPS server
    server {
        listen 444 ssl;
        listen [::]:444 ssl;
        server_name champcup.site;
        http2 on;

        # SSL configuration
        ssl_certificate /etc/letsencrypt/live/champcup.site/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/champcup.site/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_prefer_server_ciphers on;
        ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256: ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # SSL session cache
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;
        ssl_session_tickets off;

        # Root location
        location / {
            # proxy_pass http://localhost:3034;
            proxy_pass http://192.168.1.121:3034;
            # proxy_pass http://ardua:3003;
            # proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Forwarded-Host $host:$server_port; # Добавьте порт
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Accept-Encoding ""; # Отключение сжатия для Server Actions
            proxy_buffering off;
            proxy_read_timeout 3600;
            proxy_cache_bypass $http_upgrade;
        }

        # HLS-видео
        location /videos/ {
            root /var/www;
            add_header Access-Control-Allow-Origin "https://champcup.site:444";
            add_header Cache-Control "no-cache";
        }
    }
}

https://s3.ardu.live:444/minio/login
main.bb7c7604.js:2
POST https://s3.ardu.live:444/minio/api/v1/login 401 (Unauthorized)
customFetch	@	main.bb7c7604.js:2
request	@	main.bb7c7604.js:2
s.request	@	main.bb7c7604.js:2
login	@	main.bb7c7604.js:2
(anonymous)	@	main.bb7c7604.js:2
(anonymous)	@	main.bb7c7604.js:2
(anonymous)	@	main.bb7c7604.js:2
(anonymous)	@	main.bb7c7604.js:2
(anonymous)	@	main.bb7c7604.js:2
Ee	@	main.bb7c7604.js:2
(anonymous)	@	main.bb7c7604.js:2
Object.assign.pending	@	main.bb7c7604.js:2
(anonymous)	@	main.bb7c7604.js:2
onSubmit	@	main.bb7c7604.js:2
Le	@	main.bb7c7604.js:2
Ue	@	main.bb7c7604.js:2
(anonymous)	@	main.bb7c7604.js:2
Mr	@	main.bb7c7604.js:2
Lr	@	main.bb7c7604.js:2
(anonymous)	@	main.bb7c7604.js:2
ic	@	main.bb7c7604.js:2
Oe	@	main.bb7c7604.js:2
Ur	@	main.bb7c7604.js:2
Wt	@	main.bb7c7604.js:2
Vt	@	main.bb7c7604.js:2

отвечай на русском