/** @type {import('next').NextConfig} */
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

  webpack(config, { dev }) {
    // فقط در حالت production تغییر بده
    if (!dev) {
      config.devtool = false;
    }
    // رفع مشکل اتصال برخی کتابخانه‌های وب۳ در سمت سرور
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },

  // تنظیمات جدید توربوپک
  experimental: {
    turbo: {
      rules: {},
    },
  },
};

module.exports = nextConfig;