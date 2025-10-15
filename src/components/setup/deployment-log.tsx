// src/components/setup/deployment-log.tsx - نسخه نهایی با Tailwind

import React from 'react';

interface DeploymentLogProps {
  logs: string; // ✅ CHANGE: لاگ‌ها را به صورت یک رشته واحد دریافت می‌کنیم
}

export function DeploymentLog({ logs }: DeploymentLogProps) {
  return (
    <div 
      className="bg-muted/50 rounded-lg p-4 overflow-y-auto h-[400px] border"
      dir="ltr" // ✅ FIX: جهت کلی کانتینر LTR است تا ساختار لاگ‌ها حفظ شود
    >
      <pre 
        // ✅ FIX: استفاده از فونت وزیر برای کل متن و بازگشت به مونو برای بخش‌های انگلیسی
        // `whitespace-pre-wrap` برای حفظ فاصله‌ها و شکستن خطوط طولانی
        className="text-xs whitespace-pre-wrap font-vazir rtl:font-vazir ltr:font-mono"
      >
        {logs.split('\n').map((line, index) => (
          // ✅ FIX: استفاده از dir="auto" روی هر خط برای تشخیص خودکار جهت
          <p key={index} dir="auto" className="mb-1 leading-relaxed">
            {line}
          </p>
        ))}
      </pre>
    </div>
  );
}