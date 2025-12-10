/** @type {import('next').NextConfig} */
const nextConfig = {
  // تنظیمات آزمایشی برای Next.js 16
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // لیست دامنه/IPهای مجاز
    allowedOrigins: [
      'localhost:3000', 
      'localhost:3001', 
      '172.16.22.141:3000', 
      '172.16.22.141:3001'
    ],
  },

  // نادیده گرفتن خطاهای تایپ‌اسکریپت در بیلد
  typescript: {
    ignoreBuildErrors: true,
  },

  // تنظیمات وب‌پک برای حذف پکیج‌های مزاحم وب۳
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    
    // پکیج‌هایی که باید نادیده گرفته شوند
    config.externals.push('pino-pretty', 'lokijs', 'encoding');

    // حل مشکل خطاهای Module not found برای کانکتورهایی که استفاده نمی‌کنیم
    config.resolve.alias = {
      ...config.resolve.alias,
      'porto': false,              // ✅ حل خطای porto
      '@gemini-wallet/core': false // ✅ حل خطای gemini
    };

    return config;
  },
};

module.exports = nextConfig;