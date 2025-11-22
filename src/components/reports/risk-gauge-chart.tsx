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
  const normalizedValue = Math.max(0, Math.min(100, value));
  // زاویه عقربه: -90 درجه برای 0 (چپ)، 0 درجه برای 50 (بالا)، +90 درجه برای 100 (راست)
  const rotation = (normalizedValue / 100) * 180 - 90;

  const getColor = (val: number): string => {
    const hue = (val / 100) * 120; // 0=red, 120=green
    return `hsl(${hue}, 80%, 50%)`;
  };

  return (
    // ✅✅✅ FIX: استفاده از aspect-ratio برای حفظ نسبت ابعاد و flexbox برای تراز کردن ✅✅✅
    <div className={cn("relative w-full max-w-[300px] mx-auto flex flex-col items-center justify-center aspect-[4/3]", className)}>
        
        {/* کانتینر نیم‌دایره برای گیج */}
        <div className="relative w-full aspect-[2/1] overflow-hidden">
            {/* گرادینت پس‌زمینه */}
            <div
                className="absolute top-0 left-0 w-full h-[200%] rounded-full"
                style={{
                    background: `conic-gradient(from -90deg at 50% 100%, hsla(0, 100%, 50%, 1.00), hsla(60, 100%, 50%, 1.00) 50%, hsla(120, 100%, 50%, 1.00))`,
                }}
            />
            
            {/* ماسک داخلی برای ایجاد افکت Gauge */}
            <div className="absolute top-0 left-0 w-full h-[200%] bg-card rounded-full" style={{ transform: 'scale(0.9)', transformOrigin: 'bottom center' }} />

            {/* عقربه انیمیشنی */}
            <motion.div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1/2"
                style={{ transformOrigin: 'bottom center' }}
                initial={{ rotate: -90 }}
                animate={{ rotate: rotation }}
                transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.3 }}
            >
                <div className="w-full h-[85%] bg-foreground/80 rounded-full" />
            </motion.div>

            {/* مرکز عقربه */}
            <div className="absolute bottom-[-12px] left-1/2 -translate-x-1/2 w-6 h-6 bg-card rounded-full border-4 border-foreground" />
        </div>

        {/* متن (مقدار و لیبل) در زیر گیج */}
        <div className="text-center mt-[-40px] z-10">
            <motion.p
                className="text-5xl font-bold font-mono tracking-tighter"
                style={{ color: getColor(normalizedValue) }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
            >
                {normalizedValue}
            </motion.p>
            <p className="text-sm text-muted-foreground mt-1 font-semibold">{label}</p>
        </div>

        {/* اعداد راهنما */}
        <div className="absolute bottom-0 w-[95%] flex justify-between text-xs text-muted-foreground px-2">
            <span>0</span>
            <span>100</span>
        </div>
    </div>
  );
}