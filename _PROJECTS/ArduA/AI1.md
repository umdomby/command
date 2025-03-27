nginx
server {
listen 443 ssl;
server_name ardu.site;

        ssl_certificate /etc/letsencrypt/live/ardu.site/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/ardu.site/privkey.pem;

        location / {
            proxy_pass http://ardua:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_buffering off;
            proxy_read_timeout 3600;
        }

        location /ws {
            proxy_pass http://ardua:1444;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
         }
    }

server docker (без докера принимал сообщения)
import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { readFileSync } from 'fs';
import { getAllowedDeviceIds } from './app/actions';
import { createServer } from 'https';
import * as path from 'path';

const PORT = 1444;
const WS_PATH = '/ws';

// Загрузите ваши SSL-сертификаты
const server = createServer({
key: readFileSync(path.join(__dirname, './letsencrypt/live/ardu.site/privkey.pem')),
cert: readFileSync(path.join(__dirname, './letsencrypt/live/ardu.site/fullchain.pem')),
});

const wss = new WebSocketServer({
server,
path: WS_PATH
});

interface ClientInfo {
ws: WebSocket;
deviceId?: string;
ip: string;
isIdentified: boolean;
clientType?: 'browser' | 'esp';
lastActivity: number;
isAlive: boolean;
}

const clients = new Map<number, ClientInfo>();

// Ping clients every 30 seconds
setInterval(() => {
clients.forEach((client, clientId) => {
if (!client.isAlive) {
client.ws.terminate();
clients.delete(clientId);
console.log(`Client ${clientId} terminated (no ping response)`);
return;
}
client.isAlive = false;
client.ws.ping(null, false);
});
}, 30000);

wss.on('connection', async (ws: WebSocket, req: IncomingMessage) => {
// Проверяем путь подключения
if (req.url !== WS_PATH) {
ws.close(1002, 'Invalid path');
return;
}

    const clientId = Date.now();
    const ip = req.socket.remoteAddress || 'unknown';
    const client: ClientInfo = {
        ws,
        ip,
        isIdentified: false,
        lastActivity: Date.now(),
        isAlive: true
    };
    clients.set(clientId, client);

    console.log(`New connection: ${clientId} from ${ip}`);

    ws.on('pong', () => {
        client.isAlive = true;
        client.lastActivity = Date.now();
    });

    ws.send(JSON.stringify({
        type: 'system',
        message: 'Connection established',
        clientId,
        status: 'awaiting_identification'
    }));

    ws.on('message', async (data: Buffer) => {
        try {
            client.lastActivity = Date.now();
            const message = data.toString();
            console.log(`[${clientId}] Received: ${message}`);
            const parsed = JSON.parse(message);

            if (parsed.type === 'client_type') {
                client.clientType = parsed.clientType;
                return;
            }

            if (parsed.type === 'identify') {
                const allowedIds = new Set(await getAllowedDeviceIds());
                if (parsed.deviceId && allowedIds.has(parsed.deviceId)) {
                    client.deviceId = parsed.deviceId;
                    client.isIdentified = true;

                    ws.send(JSON.stringify({
                        type: 'system',
                        message: 'Identification successful',
                        clientId,
                        deviceId: parsed.deviceId,
                        status: 'connected'
                    }));

                    // Notify browser clients about ESP connection
                    if (client.clientType === 'esp') {
                        clients.forEach(targetClient => {
                            if (targetClient.clientType === 'browser' &&
                                targetClient.deviceId === parsed.deviceId) {
                                console.log(`Notifying browser client ${targetClient.deviceId} about ESP connection`);
                                targetClient.ws.send(JSON.stringify({
                                    type: 'esp_status',
                                    status: 'connected',
                                    deviceId: parsed.deviceId,
                                    timestamp: new Date().toISOString()
                                }));
                            }
                        });
                    }
                } else {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Invalid device ID',
                        clientId,
                        status: 'rejected'
                    }));
                    ws.close();
                }
                return;
            }

            if (!client.isIdentified) {
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Not identified',
                    clientId
                }));
                return;
            }

            // Process logs from ESP
            if (parsed.type === 'log' && client.clientType === 'esp') {
                clients.forEach(targetClient => {
                    if (targetClient.clientType === 'browser' &&
                        targetClient.deviceId === client.deviceId) {
                        targetClient.ws.send(JSON.stringify({
                            type: 'log',
                            message: parsed.message,
                            deviceId: client.deviceId,
                            timestamp: new Date().toISOString(),
                            origin: 'esp'
                        }));
                    }
                });
                return;
            }

            // Process command acknowledgements
            if (parsed.type === 'command_ack' && client.clientType === 'esp') {
                clients.forEach(targetClient => {
                    if (targetClient.clientType === 'browser' &&
                        targetClient.deviceId === client.deviceId) {
                        targetClient.ws.send(JSON.stringify({
                            type: 'command_ack',
                            command: parsed.command,
                            deviceId: client.deviceId,
                            timestamp: new Date().toISOString()
                        }));
                    }
                });
                return;
            }

            // Route commands to ESP
            if (parsed.command && parsed.deviceId) {
                let delivered = false;
                clients.forEach(targetClient => {
                    if (targetClient.deviceId === parsed.deviceId &&
                        targetClient.clientType === 'esp' &&
                        targetClient.isIdentified) {
                        targetClient.ws.send(message);
                        delivered = true;
                    }
                });

                ws.send(JSON.stringify({
                    type: delivered ? 'command_status' : 'error',
                    status: delivered ? 'delivered' : 'esp_not_found',
                    command: parsed.command,
                    deviceId: parsed.deviceId,
                    timestamp: new Date().toISOString()
                }));
            }

        } catch (err) {
            console.error(`[${clientId}] Message error:`, err);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid message format',
                error: (err as Error).message,
                clientId
            }));
        }
    });

    ws.on('close', () => {
        console.log(`Client ${clientId} disconnected`);
        if (client.clientType === 'esp' && client.deviceId) {
            clients.forEach(targetClient => {
                if (targetClient.clientType === 'browser' &&
                    targetClient.deviceId === client.deviceId) {
                    targetClient.ws.send(JSON.stringify({
                        type: 'esp_status',
                        status: 'disconnected',
                        deviceId: client.deviceId,
                        timestamp: new Date().toISOString(),
                        reason: 'connection closed'
                    }));
                }
            });
        }
        clients.delete(clientId);
    });

    ws.on('error', (err: Error) => {
        console.error(`[${clientId}] WebSocket error:`, err);
    });
});

server.listen(PORT, () => {
console.log(`WebSocket server running on wss://0.0.0.0:${PORT}${WS_PATH}`);
});

docker ardua
services:
ardua:
build: .
working_dir: /app2
ports:
- "3003:3000"
- "1444:1444"  # WebSocket-порт
environment:
NODE_ENV: production
volumes:
- ./letsencrypt:/etc/letsencrypt
env_file:
- .env
networks:
- sharednetwork
restart: always

networks:
sharednetwork:
external: true

ardua Dockerfile
# Этап 1: Сборка приложения
FROM node:22 AS builder

# Установите рабочую директорию
WORKDIR /app2

# Скопируйте package.json и yarn.lock в контейнер
COPY package.json yarn.lock ./

# Скопируйте директорию prisma в контейнер
COPY prisma ./prisma

# Установите зависимости
RUN yarn install --frozen-lockfile

# Скопируйте остальной код вашего приложения
COPY . .

# Выполните сборку приложения
RUN yarn build

# Этап 2: Финальный образ
FROM node:22

# Установите рабочую директорию
WORKDIR /app2

COPY --from=builder /app2 /app2

RUN yarn install --production --frozen-lockfile
RUN yarn global add ts-node typescript @types/node @types/ws concurrently path
RUN yarn prisma generate

# Установите переменные окружения
ENV NODE_ENV=production

# Порты
EXPOSE 3000
EXPOSE 1444

# Запустите приложение
#CMD ["yarn", "start"]
CMD ["sh", "-c", "concurrently \"yarn next start\" \"ts-node server.ts\""]


ошибки в Nginx
nginx-1    | 172.20.0.1 - - [27/Mar/2025:07:58:10 +0000] "GET /ws HTTP/1.1" 502 157 "-" "TinyWebsockets Client"
nginx-1    | 172.20.0.1 - - [27/Mar/2025:07:58:10 +0000] "\x88\x82\x00\x00\x00\x00\x03\xEA" 400 157 "-" "-"                                                                                                                         
nginx-1    | 2025/03/27 07:58:15 [error] 33#33: *9 upstream prematurely closed connection while reading response header from upstream, client: 172.20.0.1, server: ardu.site, request: "GET /ws HTTP/1.1", upstream: "http://172.20.0.7:1444/ws", host: "ardu.site"
nginx-1    | 172.20.0.1 - - [27/Mar/2025:07:58:15 +0000] "GET /ws HTTP/1.1" 502 157 "-" "TinyWebsockets Client"
nginx-1    | 172.20.0.1 - - [27/Mar/2025:07:58:15 +0000] "\x88\x82\x00\x00\x00\x00\x03\xEA" 400 157 "-" "-"                                                                                                                         
nginx-1    | 2025/03/27 07:58:20 [error] 34#34: *11 upstream prematurely closed connection while reading response header from upstream, client: 172.20.0.1, server: ardu.site, request: "GET /ws HTTP/1.1", upstream: "http://172.20.0.7:1444/ws", host: "ardu.site"
nginx-1    | 172.20.0.1 - - [27/Mar/2025:07:58:20 +0000] "GET /ws HTTP/1.1" 502 157 "-" "TinyWebsockets Client"
nginx-1    | 172.20.0.1 - - [27/Mar/2025:07:58:20 +0000] "\x88\x82\x00\x00\x00\x00\x03\xEA" 400 157 "-" "-"                                                                                                                         
nginx-1    | 2025/03/27 07:58:25 [error] 35#35: *13 upstream prematurely closed connection while reading response header from upstream, client: 172.20.0.1, server: ardu.site, request: "GET /ws HTTP/1.1", upstream: "http://172.20.0.7:1444/ws", host: "ardu.site"
nginx-1    | 172.20.0.1 - - [27/Mar/2025:07:58:25 +0000] "GET /ws HTTP/1.1" 502 157 "-" "TinyWebsockets Client"
nginx-1    | 172.20.0.1 - - [27/Mar/2025:07:58:25 +0000] "\x88\x82\x00\x00\x00\x00\x03\xEA" 400 157 "-" "-"                                                                                                                         
nginx-1    | 2025/03/27 07:58:30 [error] 36#36: *15 upstream prematurely closed connection while reading response header from upstream, client: 172.20.0.1, server: ardu.site, request: "GET /ws HTTP/1.1", upstream: "http://172.20.0.7:1444/ws", host: "ardu.site"
nginx-1    | 172.20.0.1 - - [27/Mar/2025:07:58:30 +0000] "GET /ws HTTP/1.1" 502 157 "-" "TinyWebsockets Client"
nginx-1    | 172.20.0.1 - - [27/Mar/2025:07:58:30 +0000] "\x88\x82\x00\x00\x00\x00\x03\xEA" 400 157 "-" "-"                                                                                                                         
nginx-1    | 172.20.0.1 - - [27/Mar/2025:07:58:35 +0000] "GET /ws HTTP/1.1" 502 157 "-" "TinyWebsockets Client"
nginx-1    | 2025/03/27 07:58:35 [error] 37#37: *17 upstream prematurely closed connection while reading response header from upstream, client: 172.20.0.1, server: ardu.site, request: "GET /ws HTTP/1.1", upstream: "http://172.20.0.7:1444/ws", host: "ardu.site"                                                                                                                                                                                                    
nginx-1    | 172.20.0.1 - - [27/Mar/2025:07:58:35 +0000] "\x88\x82\x00\x00\x00\x00\x03\xEA" 400 157 "-" "-"
nginx-1    | 172.20.0.1 - - [27/Mar/2025:07:58:40 +0000] "GET /ws HTTP/1.1" 502 157 "-" "TinyWebsockets Client"
nginx-1    | 2025/03/27 07:58:40 [error] 38#38: *19 upstream prematurely closed connection while reading response header from upstream, client: 172.20.0.1, server: ardu.site, request: "GET /ws HTTP/1.1", upstream: "http://172.20.0.7:1444/ws", host: "ardu.site"                                                                                                                                                                                                    
nginx-1    | 172.20.0.1 - - [27/Mar/2025:07:58:40 +0000] "\x88\x82\x00\x00\x00\x00\x03\xEA" 400 157 "-" "-"
nginx-1    | 2025/03/27 07:58:45 [error] 39#39: *21 upstream prematurely closed connection while reading response header from upstream, client: 172.20.0.1, server: ardu.site, request: "GET /ws HTTP/1.1", upstream: "http://172.20.0.7:1444/ws", host: "ardu.site"
nginx-1    | 172.20.0.1 - - [27/Mar/2025:07:58:45 +0000] "GET /ws HTTP/1.1" 502 157 "-" "TinyWebsockets Client"
nginx-1    | 172.20.0.1 - - [27/Mar/2025:07:58:45 +0000] "\x88\x82\x00\x00\x00\x00\x03\xEA" 400 157 "-" "-"                                                                                                                         
nginx-1    | 2025/03/27 07:58:50 [error] 40#40: *23 upstream prematurely closed connection while reading response header from upstream, client: 172.20.0.1, server: ardu.site, request: "GET /ws HTTP/1.1", upstream: "http://172.20.0.7:1444/ws", host: "ardu.site"
nginx-1    | 172.20.0.1 - - [27/Mar/2025:07:58:50 +0000] "GET /ws HTTP/1.1" 502 157 "-" "TinyWebsockets Client"
nginx-1    | 172.20.0.1 - - [27/Mar/2025:07:58:51 +0000] "\x88\x82\x00\x00\x00\x00\x03\xEA" 400 157 "-" "-"                                                                                                                         
nginx-1    | 172.20.0.1 - - [27/Mar/2025:07:58:55 +0000] "GET /ws HTTP/1.1" 502 157 "-" "TinyWebsockets Client"
nginx-1    | 2025/03/27 07:58:55 [error] 41#41: *25 upstream prematurely closed connection while reading response header from upstream, client: 172.20.0.1, server: ardu.site, request: "GET /ws HTTP/1.1", upstream: "http://172.20.0.7:1444/ws", host: "ardu.site"                                                                                                                                                                                                    
nginx-1    | 172.20.0.1 - - [27/Mar/2025:07:58:55 +0000] "\x88\x82\x00\x00\x00\x00\x03\xEA" 400 157 "-" "-"
nginx-1    | 172.20.0.1 - - [27/Mar/2025:07:59:00 +0000] "GET /ws HTTP/1.1" 502 157 "-" "TinyWebsockets Client"
nginx-1    | 2025/03/27 07:59:00 [error] 42#42: *27 upstream prematurely closed connection while reading response header from upstream, client: 172.20.0.1, server: ardu.site, request: "GET /ws HTTP/1.1", upstream: "http://172.20.0.7:1444/ws", host: "ardu.site"                                                                                                                                                                                                    
nginx-1    | 172.20.0.1 - - [27/Mar/2025:07:59:00 +0000] "\x88\x82\x00\x00\x00\x00\x03\xEA" 400 157 "-" "-"
nginx-1    | 2025/03/27 07:59:05 [error] 43#43: *29 upstream prematurely closed connection while reading response header from upstream, client: 172.20.0.1, server: ardu.site, request: "GET /ws HTTP/1.1", upstream: "http://172.20.0.7:1444/ws", host: "ardu.site"
nginx-1    | 172.20.0.1 - - [27/Mar/2025:07:59:05 +0000] "GET /ws HTTP/1.1" 502 157 "-" "TinyWebsockets Client"
nginx-1    | 172.20.0.1 - - [27/Mar/2025:07:59:05 +0000] "\x88\x82\x00\x00\x00\x00\x03\xEA" 400 157 "-" "-"                                                                                                                         
nginx-1    | 2025/03/27 07:59:10 [error] 44#44: *31 upstream prematurely closed connection while reading response header from upstream, client: 172.20.0.1, server: ardu.site, request: "GET /ws HTTP/1.1", upstream: "http://172.20.0.7:1444/ws", host: "ardu.site"
nginx-1    | 172.20.0.1 - - [27/Mar/2025:07:59:10 +0000] "GET /ws HTTP/1.1" 502 157 "-" "TinyWebsockets Client"
nginx-1    | 172.20.0.1 - - [27/Mar/2025:07:59:10 +0000] "\x88\x82\x00\x00\x00\x00\x03\xEA" 400 157 "-" "-"                                                                                                                         
nginx-1    | 172.20.0.1 - - [27/Mar/2025:07:59:15 +0000] "GET /ws HTTP/1.1" 502 157 "-" "TinyWebsockets Client"
nginx-1    | 2025/03/27 07:59:15 [error] 29#29: *33 upstream prematurely closed connection while reading response header from upstream, client: 172.20.0.1, server: ardu.site, request: "GET /ws HTTP/1.1", upstream: "http://172.20.0.7:1444/ws", host: "ardu.site"
nginx-1    | 172.20.0.1 - - [27/Mar/2025:07:59:15 +0000] "\x88\x82\x00\x00\x00\x00\x03\xEA" 400 157 "-" "-"
nginx-1    | 2025/03/27 07:59:20 [error] 29#29: *35 upstream prematurely closed connection while reading response header from upstream, client: 172.20.0.1, server: ardu.site, request: "GET /ws HTTP/1.1", upstream: "http://172.20.0.7:1444/ws", host: "ardu.site"
nginx-1    | 172.20.0.1 - - [27/Mar/2025:07:59:20 +0000] "GET /ws HTTP/1.1" 502 157 "-" "TinyWebsockets Client"
nginx-1    | 172.20.0.1 - - [27/Mar/2025:07:59:20 +0000] "\x88\x82\x00\x00\x00\x00\x03\xEA" 400 157 "-" "-"

