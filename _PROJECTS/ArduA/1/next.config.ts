module.exports = {
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=*, microphone=*'
                    }
                ]
            }
        ]
    },
    webpack: (config) => {
        config.resolve.fallback = { fs: false, net: false, tls: false };
        return config;
    }
}


// file: docker-webrtc-js/next.config.ts
import { Configuration } from 'webpack';

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    webpack: (config: Configuration, { dev, isServer }: { dev: boolean; isServer: boolean }) => {
        if (dev && !isServer) {
            // Отключаем HMR WebSocket в продакшене
            if (config.plugins) {
                config.plugins = config.plugins.filter(
                    (plugin) => plugin && plugin.constructor.name !== 'HotModuleReplacementPlugin'
                );
            }
        }
        return config;
    },
    // Разрешаем кросс-доменные запросы для разработки
    experimental: {
        allowedDevOrigins: ['anybet.site', 'localhost', 'anybet.site:3000']
    }
};

export default nextConfig;
