import { createServer } from 'http';
import next from 'next';
import { startWebSocketServer } from '@/components/lib/websocket';

const dev = process.env.NODE_ENV !== 'production';
const app = next({
    dev,
    hostname: '0.0.0.0',
    port: 3000
});

const handler = app.getRequestHandler();

app.prepare().then(() => {
    const server = createServer(handler);

    // Запуск WebSocket сервера
    startWebSocketServer();

    // Запуск HTTP сервера
    server.listen(3000, '0.0.0.0', () => {
        console.log(`
            > HTTP server: http://localhost:3000
            > WebSocket server: ws://localhost:8085
            > Mode: ${dev ? 'development' : 'production'}
        `);
    });
}).catch((err) => {
    console.error('Server startup error:', err);
    process.exit(1);
});