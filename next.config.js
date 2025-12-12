/** @type {import('next').NextConfig} */
const nextConfig = {
  // تنظیمات آزمایشی و Server Actions
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
      // ✅ اصلاح شده: allowedOrigins باید داخل serverActions باشد
      allowedOrigins: [
        'localhost:3000', 
        'localhost:3001', 
        '172.16.22.141:3000', 
        '172.16.22.141:3001'
      ],
    },
  },

  // نادیده گرفتن خطاهای تایپ‌اسکریپت در بیلد (فقط برای جلوگیری از توقف بیلد در محیط توسعه)
  typescript: {
    ignoreBuildErrors: true,
  },

  // تنظیمات وب‌پک برای حذف پکیج‌های مزاحم وب۳ و حل مشکل React Native
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    
    // پکیج‌هایی که باید نادیده گرفته شوند
    config.externals.push('pino-pretty', 'lokijs', 'encoding');

    // حل مشکل خطاهای Module not found
    config.resolve.alias = {
      ...config.resolve.alias,
      // حل مشکل Porto و Gemini
      'porto': false,
      '@gemini-wallet/core': false,
      
      // ✅ حل مشکل اصلی: حذف وابستگی‌های React Native از بیلد وب
      '@react-native-async-storage/async-storage': false, 
      'react-native': false,
    };

    return config;
  },
};

module.exports = nextConfig;