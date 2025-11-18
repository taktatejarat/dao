// src/components/reports/risk-gauge-chart.tsx (نسخه نهایی و حرفه‌ای)

"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RiskGaugeChartProps {
  value: number;
  label: string;
}

export function RiskGaugeChart({ value, label }: RiskGaugeChartProps) {
  const normalizedValue = Math.max(0, Math.min(100, value));
  // زاویه عقربه: -90 درجه برای 0، 0 درجه برای 50، +90 درجه برای 100
  const rotation = (normalizedValue / 100) * 180 - 90;

  const getColor = (val: number): string => {
    const hue = (val / 100) * 120; // 0 (قرمز) تا 120 (سبز)
    return `hsl(${120 - hue}, 80%, 45%)`;
  };

  return (
    <div className="relative w-full max-w-[250px] aspect-[2/1.5] mx-auto flex flex-col justify-end">
      {/* گرادینت پس‌زمینه نیم‌دایره */}
      <div 
        className="absolute top-0 left-0 w-full h-[200%] rounded-full"
        style={{
          background: `conic-gradient(from -90deg at 50% 100%, #ef4444, #f59e0b 50%, #22c55e)`,
          transformOrigin: 'bottom center',
        }}
      />
      
      {/* لایه داخلی برای ایجاد افکت Gauge */}
      <div className="absolute top-0 left-0 w-full h-[200%] bg-background rounded-full" style={{ transform: 'scale(0.7)', transformOrigin: 'bottom center' }}/>

      {/* عقربه انیمیشنی */}
      <motion.div
        className="absolute top-0 left-0 w-full h-1/2 flex justify-center"
        style={{ transformOrigin: 'bottom center' }}
        initial={{ rotate: -90 }}
        animate={{ rotate: rotation }}
        transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.2, duration: 1 }}
      >
        <div className="w-0.5 h-full bg-foreground/70" />
        <div className="absolute bottom-[-12px] w-6 h-6 bg-background rounded-full border-4 border-foreground" />
      </motion.div>
      
      {/* متن مرکزی */}
      <div className="absolute top-[30%] text-center z-10">
        <motion.p
          className="text-5xl font-bold"
          style={{ color: getColor(normalizedValue) }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {normalizedValue}
        </motion.p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>

      {/* اعداد 0, 50, 100 */}
      <div className="absolute bottom-[-15px] w-full flex justify-between text-xs text-muted-foreground px-1">
        <span>0</span>
        <span>50</span>
        <span>100</span>
      </div>
    </div>
  );
}