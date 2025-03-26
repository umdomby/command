import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { getAllowedDeviceIds } from './app/actions';

const PORT = 8085;

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
let wss: WebSocketServer;

export function startWebSocketServer() {
    wss = new WebSocketServer({
        port: PORT,
        host: '0.0.0.0'
    });

    // Heartbeat проверка
    const interval = setInterval(() => {
        clients.forEach((client, clientId) => {
            if (!client.isAlive) {
                client.ws.terminate();
                clients.delete(clientId);
                console.log(`Client ${clientId} terminated (no ping response)`);

                // Уведомляем браузеры об отключении ESP
                if (client.clientType === 'esp' && client.deviceId) {
                    notifyBrowserClients('disconnected', client.deviceId, 'timeout');
                }
                return;
            }
            client.isAlive = false;
            client.ws.ping();
        });
    }, 5000);

    wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
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

                        if (client.clientType === 'esp') {
                            notifyBrowserClients('connected', parsed.deviceId);
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
                    broadcastToBrowsers(client.deviceId!, {
                        type: 'log',
                        message: parsed.message,
                        deviceId: client.deviceId,
                        timestamp: new Date().toISOString(),
                        origin: 'esp'
                    });

                    // Обновляем статус подключения ESP при получении heartbeat
                    if (parsed.message.includes('Heartbeat')) {
                        notifyBrowserClients('connected', client.deviceId!);
                    }
                    return;
                }

                // Process command acknowledgements
                if (parsed.type === 'command_ack' && client.clientType === 'esp') {
                    broadcastToBrowsers(client.deviceId!, {
                        type: 'command_ack',
                        command: parsed.command,
                        deviceId: client.deviceId,
                        timestamp: new Date().toISOString()
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
                notifyBrowserClients('disconnected', client.deviceId, 'connection closed');
            }
            clients.delete(clientId);
        });

        ws.on('error', (err) => {
            console.error(`[${clientId}] WebSocket error:`, err);
        });
    });

    wss.on('close', () => {
        clearInterval(interval);
    });

    return wss;
}

function notifyBrowserClients(status: 'connected' | 'disconnected', deviceId: string, reason?: string) {
    broadcastToBrowsers(deviceId, {
        type: 'esp_status',
        status,
        deviceId,
        timestamp: new Date().toISOString(),
        reason
    });
}

function broadcastToBrowsers(deviceId: string, message: any) {
    clients.forEach(targetClient => {
        if (targetClient.clientType === 'browser' &&
            targetClient.deviceId === deviceId &&
            targetClient.ws.readyState === WebSocket.OPEN) {
            targetClient.ws.send(JSON.stringify(message));
        }
    });
}

export const wsServer = {
    getClientCount: () => clients.size,
    broadcastToDevice: (deviceId: string, message: any) => {
        clients.forEach(client => {
            if (client.deviceId === deviceId && client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(JSON.stringify(message));
            }
        });
    }
};