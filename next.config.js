/** @type {import('next').NextConfig} */
const fs = require('fs');
const path = require('path');

const isDev = process.env.NODE_ENV !== 'production';

const nextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  swcMinify: true,

  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'X-Powered-By', value: 'Next.js' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },

  webpack(config, { dev, isServer }) {
    // فقط در حالت production تغییر بده
    if (!dev) {
      config.devtool = false;
    }
    return config;
  },

  // تنظیمات جدید توربوپک
  experimental: {
    turbo: {
      rules: {},
    },
  },
};

// فعال‌سازی HTTPS در dev اگر گواهی موجود باشد
if (isDev) {
  const certPath = path.join(__dirname, 'certs');
  const keyFile = path.join(certPath, 'cert.key');
  const certFile = path.join(certPath, 'cert.crt');

  if (fs.existsSync(keyFile) && fs.existsSync(certFile)) {
    nextConfig.devServer = {
      https: {
        key: fs.readFileSync(keyFile),
        cert: fs.readFileSync(certFile),
      },
      host: '0.0.0.0',
      port: 3000,
    };
  }
}

module.exports = nextConfig;
