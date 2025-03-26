/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**', // Разрешаем все домены
            },
        ],
    },


    experimental: {
        serverActions: {
            bodySizeLimit: '5mb',
            allowedOrigins: [
                'localhost:3000', // Убрал лишний слеш
                'localhost:3001',
                'https://ardu.site'
            ],
        },
    },

    eslint: {
        ignoreDuringBuilds: true,
    },

    // Конфигурация для standalone-режима
    output: 'standalone',

    webpack: (config) => {
        config.externals.push('ws');
        return config;
    }
};

export default nextConfig;