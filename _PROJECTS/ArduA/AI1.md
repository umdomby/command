    # Сайт 4
    server {
        listen 80;
        server_name ardu.site www.ardu.site;

        location / {
            return 301 https://ardu.site$request_uri;
        }
    }

    server {
        listen 443 ssl;
        server_name www.ardu.site;

        ssl_certificate /etc/letsencrypt/live/ardu.site/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/ardu.site/privkey.pem;

        return 301 https://ardu.site$request_uri;
    }

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
    }

        server {
            listen 444 ssl;
            server_name ardu.site;

            ssl_certificate /etc/letsencrypt/live/ardu.site/fullchain.pem;
            ssl_certificate_key /etc/letsencrypt/live/ardu.site/privkey.pem;

    location / {
        proxy_pass http://ardua:1444;  # Используйте http:// для внутреннего проксирования
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
        }


nginx:
build:
context: .
ports:
- "80:80"
- "443:443"
- "1444:1444"
volumes:

# Используем официальный образ NGINX
FROM nginx:latest

# Копируем конфиг NGINX
COPY ./nginx.conf /etc/nginx/nginx.conf

# Создаём папки для SSL-сертификатов
RUN mkdir -p /etc/letsencrypt/live && mkdir -p /etc/letsencrypt/archive

EXPOSE 80 443 1444

CMD ["nginx", "-g", "daemon off;"]


import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { readFileSync } from 'fs';
import { getAllowedDeviceIds } from './app/actions';
import { createServer } from 'http';


const PORT = 1444;
const server = createServer();
//Загрузите ваши SSL-сертификаты
// const server = createServer({
//     key: readFileSync('/etc/letsencrypt/live/ardu.site/privkey.pem'),
//     cert: readFileSync('/etc/letsencrypt/live/ardu.site/fullchain.pem'),
// });
// Загрузите ваши SSL-сертификаты
// const server = createServer({
//     cert: readFileSync('/etc/letsencrypt/live/ardu.site/fullchain.pem'),
//     key: readFileSync('/etc/letsencrypt/live/ardu.site/privkey.pem')
// });

const wss = new WebSocketServer({ server });

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
console.log(`WebSocket server running on ws://0.0.0.0:${PORT}`);
});


вот приложение которое должно получить из интернета SSL по порту 444 в докер 1444
services:
ardua:
build: .
working_dir: /app2
ports:
- "3003:3000"
- "444:1444"
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



почему нет соединения SSL к серверу ?

