import { WebSocketServer, WebSocket } from 'ws'
import { IncomingMessage } from 'http'
import { getAllowedDeviceIds, getDeviceTelegramInfo } from './actions'
import { createServer } from 'http'
import axios from 'axios'

const PORT = 8096
const WS_PATH = '/wsar'

let TELEGRAM_BOT_TOKEN: string | null = null
let TELEGRAM_CHAT_ID: string | null = null
let lastTelegramMessageTime = 0
const TELEGRAM_MESSAGE_INTERVAL = 5000

function formatDateTime(date: Date): string {
    const moscowOffset = 3 * 60 * 60 * 1000
    const moscowDate = new Date(date.getTime() + moscowOffset)
    const day = String(moscowDate.getUTCDate()).padStart(2, '0')
    const month = String(moscowDate.getUTCMonth() + 1).padStart(2, '0')
    const year = moscowDate.getUTCFullYear()
    const hours = String(moscowDate.getUTCHours()).padStart(2, '0')
    const minutes = String(moscowDate.getUTCMinutes()).padStart(2, '0')
    return `${day}.${month}.${year} ${hours}:${minutes}`
}

const server = createServer()
const wss = new WebSocketServer({ server, path: WS_PATH })

interface ClientInfo {
    ws: WebSocket
    ip: string
    isIdentified: boolean
    ct?: 'browser' | 'esp'
    lastActivity: number
    isAlive: boolean
    de?: string
}

const clients = new Map<number, ClientInfo>()

// Пинг-понг каждые 30 секунд
setInterval(() => {
    clients.forEach((client, id) => {
        if (!client.isAlive) {
            client.ws.terminate()
            clients.delete(id)
            console.log(`Клиент ${id} отключен (ping timeout)`)
            return
        }
        client.isAlive = false
        client.ws.ping()
    })
}, 30000)

wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    if (req.url !== WS_PATH) {
        ws.close(1002, 'Invalid path')
        return
    }

    const clientId = Date.now()
    const ip = req.socket.remoteAddress || 'unknown'

    const client: ClientInfo = {
        ws,
        ip,
        isIdentified: false,
        lastActivity: Date.now(),
        isAlive: true
    }
    clients.set(clientId, client)

    console.log(`Новое подключение: ${clientId} (${ip})`)

    ws.on('pong', () => {
        client.isAlive = true
        client.lastActivity = Date.now()
    })

    ws.on('message', async (data, isBinary) => {
        if (!isBinary) {
            console.log(`[${clientId}] Игнорируем текстовое сообщение`);
            return;
        }

        client.lastActivity = Date.now();

        const buf = Buffer.from(data as ArrayBuffer);
        if (buf.length < 1) return;

        const cmd = buf[0];

        try {
            switch (cmd) {
                case 0x02: // CLIENT_TYPE
                    if (buf.length >= 2) {
                        client.ct = buf[1] === 1 ? 'browser' : 'esp';
                        console.log(`[${clientId}] Тип: ${client.ct}`);
                    }
                    break;

                case 0x01: // IDENTIFY
                    if (buf.length === 17) {
                        const de = buf.subarray(1).toString('utf8').trim();
                        const allowed = new Set(await getAllowedDeviceIds());

                        if (allowed.has(de)) {
                            client.de = de;
                            client.isIdentified = true;

                            const telegramInfo = await getDeviceTelegramInfo(de);
                            TELEGRAM_BOT_TOKEN = telegramInfo?.telegramToken ?? null;
                            TELEGRAM_CHAT_ID = telegramInfo?.telegramId?.toString() ?? null;

                            console.log(`[${clientId}] Успешная идентификация: ${de}`);

                            // Если это ESP → уведомляем всех существующих браузеров
                            if (client.ct === 'esp') {
                                clients.forEach(c => {
                                    if (c.ct === 'browser' && c.de === de && c.isIdentified) {
                                        c.ws.send(new Uint8Array([0x60, 1])); // connected
                                        console.log(`[${clientId}] Уведомил браузер ${c.de} → ESP connected`);
                                    }
                                });
                            }

                            // Если это браузер → проверяем, есть ли уже ESP, и сразу уведомляем
                            else if (client.ct === 'browser') {
                                let espIsOnline = false;
                                clients.forEach(c => {
                                    if (c.ct === 'esp' && c.de === de && c.isIdentified) {
                                        espIsOnline = true;
                                    }
                                });

                                // Отправляем статус новому браузеру
                                client.ws.send(new Uint8Array([0x60, espIsOnline ? 1 : 0]));
                                console.log(`[${clientId}] Новый браузер → статус ESP: ${espIsOnline ? 'connected' : 'disconnected'}`);
                            }
                        } else {
                            ws.close(1008, 'Device not allowed');
                        }
                    }
                    break;

                default:
                    if (client.de && client.isIdentified) {
                        const isFromBrowser = client.ct === 'browser';
                        const targetType = isFromBrowser ? 'esp' : 'browser';

                        let forwarded = false;
                        clients.forEach(c => {
                            if (c.de === client.de && c.ct === targetType && c.isIdentified) {
                                c.ws.send(buf);
                                forwarded = true;

                                // ПОДРОБНЫЙ ЛОГ
                                const cmdName = {
                                    0x10: 'HEARTBEAT',
                                    0x20: 'MOTOR',
                                    0x30: 'SERVO_ABS',
                                    0x40: 'RELAY',
                                    0x41: 'ALARM',
                                    0x50: 'FULL_STATUS',
                                    0x51: 'ACK',
                                    0x60: 'ESP_STATUS',
                                }[cmd] || `UNKNOWN(0x${cmd.toString(16)})`;

                                console.log(`[${clientId}] ${isFromBrowser ? 'Браузер → ESP' : 'ESP → Браузер'} | ${cmdName} | de=${client.de} | len=${buf.length}`);
                            }
                        });

                        if (!forwarded) {
                            console.log(`[${clientId}] НЕ НАЙДЕН ${targetType} для de=${client.de} (cmd 0x${cmd.toString(16)})`);
                        }
                    } else {
                        console.log(`[${clientId}] Команда отклонена: не идентифицирован или нет de`);
                    }
            }
        } catch (err) {
            console.error(`[${clientId}] Ошибка:`, err);
        }
    });

    ws.on('close', () => {
        console.log(`Клиент ${clientId} отключился`)
        if (client.ct === 'esp' && client.de) {
            clients.forEach(c => {
                if (c.ct === 'browser' && c.de === client.de) {
                    c.ws.send(new Uint8Array([0x60, 0])) // 0x60 = esp disconnected
                }
            })
        }
        clients.delete(clientId)
    })

    ws.on('error', err => {
        console.error(`[${clientId}] WS ошибка:`, err)
    })
})

server.listen(PORT, () => {
    console.log(`Binary WebSocket сервер запущен на ws://0.0.0.0:${PORT}${WS_PATH}`)
})