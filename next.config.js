/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  serverComponentsExternalPackages: ['node-cron'],
  experimental: {
    serverComponentsExternalPackages: ['node-cron'],
  },
};

module.exports = nextConfig;
