/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true
})

const nextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  
  typescript: { 
    ignoreBuildErrors: true 
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co'
      }
    ]
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
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
        ]
      }
    ]
  },

  webpack(config, { dev, isServer }) {
    // تنظیمات مربوط به بیلد پروداکشن
    if (!dev) {
      config.devtool = false
    }

    // اضافه کردن پکیج‌های خاص Web3 به externals برای جلوگیری از خطای بیلد
    config.externals.push('pino-pretty', 'lokijs', 'encoding')

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }

    return config
  },

  experimental: {
    serverActions: {
        bodySizeLimit: '2mb',
    },
  }
}

module.exports = withPWA(nextConfig)