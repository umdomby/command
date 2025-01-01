/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // images: {
  //     domains: ["g7ttfzigvkyrt3gn.public.blop.vercel-storage.com"],
  // },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        port: '',
      },
    ]
  },
};

export default nextConfig;
