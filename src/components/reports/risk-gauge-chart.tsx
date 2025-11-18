// src/components/reports/risk-gauge-chart.tsx (نسخه نهایی و حرفه‌ای)

"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RiskGaugeChartProps {
  value: number;
  label: string;
  className?: string;
}

export function RiskGaugeChart({ value, label, className }: RiskGaugeChartProps) {
  // نرمال‌سازی مقدار بین 0 و 100
  const normalizedValue = Math.max(0, Math.min(100, value));
  // زاویه عقربه: -90 درجه برای 0، 0 درجه برای 50، +90 درجه برای 100
  const rotation = (normalizedValue / 100) * 180 - 90;

  // تابعی برای تعیین رنگ بر اساس مقدار (از قرمز به سبز)
  const getColor = (val: number): string => {
    // 0 = قرمز (hue=0), 50 = زرد (hue=60), 100 = سبز (hue=120)
    const hue = (val / 100) * 120;
    return `hsl(${hue}, 80%, 45%)`;
  };

  return (
    <div className={cn("relative w-full max-w-[280px] aspect-video mx-auto flex flex-col items-center justify-end", className)}>
      {/* گرادینت پس‌زمینه نیم‌دایره برای نمایش طیف رنگ */}
      <div
        className="absolute top-0 left-0 w-full h-[200%] rounded-full"
        style={{
          background: `conic-gradient(from -90deg at 50% 100%, hsl(0, 80%, 45%), hsl(60, 80%, 45%) 50%, hsl(120, 80%, 45%))`,
          transformOrigin: 'bottom center',
        }}
      />
      
      {/* لایه داخلی برای ایجاد افکت Gauge */}
      <div className="absolute top-0 left-0 w-full h-[200%] bg-background rounded-full" style={{ transform: 'scale(0.8)', transformOrigin: 'bottom center' }} />

      {/* عقربه انیمیشنی با framer-motion */}
      <motion.div
        className="absolute top-0 left-0 w-full h-1/2 flex justify-center"
        style={{ transformOrigin: 'bottom center' }}
        initial={{ rotate: -90 }}
        animate={{ rotate: rotation }}
        transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.3, duration: 1.2 }}
      >
        <div className="w-1 h-[90%] bg-foreground/80 rounded-full" />
        {/* مرکز عقربه */}
        <div className="absolute bottom-[-12px] w-6 h-6 bg-background rounded-full border-4 border-foreground" />
      </motion.div>
      
      {/* متن مرکزی (مقدار و لیبل) */}
      <div className="relative text-center z-10 -translate-y-4">
        <motion.p
          className="text-6xl font-bold font-mono tracking-tighter"
          style={{ color: getColor(normalizedValue) }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {normalizedValue}
        </motion.p>
        <p className="text-sm text-muted-foreground mt-1 font-semibold">{label}</p>
      </div>

      {/* اعداد راهنما در پایین گیج */}
      <div className="absolute bottom-[-20px] w-[110%] -translate-x-1/2 left-1/2 flex justify-between text-xs text-muted-foreground px-1">
        <span>0</span>
        <span>50</span>
        <span>100</span>
      </div>
    </div>
  );
}