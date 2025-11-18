// src/components/reports/risk-gauge-chart.tsx (نسخه نهایی با طیف رنگی)

"use client";

import { useTranslation } from "@/hooks/use-translation"; // ✅ NEW: برای ترجمه اعداد
import { cn } from "@/lib/utils";

interface RiskGaugeChartProps {
  value: number;
  label: string;
}

export function RiskGaugeChart({ value, label }: RiskGaugeChartProps) {
  const { t } = useTranslation();
  const normalizedValue = Math.max(0, Math.min(100, value));
  // زاویه عقربه را بین -90 درجه (برای 0) و +90 درجه (برای 100) محاسبه می‌کنیم
  const rotation = (normalizedValue / 100) * 180 - 90;

  // تابع برای دریافت رنگ عقربه و متن بر اساس مقدار
  const getValueColor = (val: number): string => {
    if (val > 75) return "text-green-500";
    if (val > 40) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="relative flex justify-center items-center w-full max-w-[250px] aspect-square mx-auto">
      {/* بخش اصلی نمودار با استفاده از گرادینت مخروطی */}
      <div 
        className="absolute top-0 left-0 w-full h-full rounded-full"
        style={{
          background: `conic-gradient(
            from -90deg,
            #ef4444 0deg,      /* Red */
            #f97316 45deg,     /* Orange */
            #f59e0b 90deg,     /* Yellow */
            #84cc16 135deg,    /* Lime */
            #22c55e 180deg     /* Green */
          )`,
          // ماسک برای ایجاد شکل نیم‌دایره
          maskImage: 'radial-gradient(circle at 50% 100%, transparent 0, transparent 65%, black 66%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 100%, transparent 0, transparent 65%, black 66%)',
        }}
      />
      
      {/* لایه سفید/تیره داخلی برای ایجاد افکت Gauge */}
      <div className="absolute w-[65%] h-[65%] bg-background rounded-full" />

      {/* عقربه یا Pointer */}
      <div
        className="absolute top-0 left-0 w-full h-1/2 flex justify-center"
        style={{
          transform: `rotate(${rotation}deg)`,
          transformOrigin: 'bottom center',
        }}
      >
        <div className="w-1 h-8 bg-foreground rounded-full" />
        <div className="absolute bottom-[-10px] w-5 h-5 bg-foreground rounded-full border-4 border-background" />
      </div>

      {/* متن مرکزی */}
      <div className="absolute text-center">
        <p className={cn("text-4xl font-bold", getValueColor(normalizedValue))}>
          {normalizedValue}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>

      {/* ✅✅✅ FIX: لیبل‌های عددی 0, 50, 100 ✅✅✅ */}
      <div className="absolute bottom-[10%] w-full flex justify-between text-xs text-muted-foreground px-[12%]">
        <span>{t('numbers.0')}</span>
        <span>{t('numbers.50')}</span>
        <span>{t('numbers.100')}</span>
      </div>
    </div>
  );
}