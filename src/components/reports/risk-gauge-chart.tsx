// src/components/reports/risk-gauge-chart.tsx (نسخه نهایی با انیمیشن)

"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RiskGaugeChartProps {
  value: number;
  label: string;
}

export function RiskGaugeChart({ value, label }: RiskGaugeChartProps) {
  const normalizedValue = Math.max(0, Math.min(100, value));
  const rotation = (normalizedValue / 100) * 180 - 90;

  const getColor = (val: number): string => {
    if (val > 75) return "#22c55e"; // green-500
    if (val > 40) return "#f59e0b"; // yellow-500
    return "#ef4444"; // red-500
  };

  return (
    <div className="relative flex justify-center items-center w-full max-w-[250px] aspect-[2/1.2] mx-auto">
      {/* گرادینت پس‌زمینه */}
      <div 
        className="absolute top-0 left-0 w-full h-full"
        style={{
          background: `conic-gradient(from -90deg at 50% 100%, #ef4444, #f59e0b, #22c55e)`,
          maskImage: 'radial-gradient(circle at 50% 100%, transparent 0, transparent 65%, black 66%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 100%, transparent 0, transparent 65%, black 66%)',
        }}
      />
      {/* لایه داخلی */}
      <div className="absolute w-[65%] h-[65%] top-[35%] left-[17.5%] bg-background rounded-t-full" />

      {/* عقربه انیمیشنی */}
      <motion.div
        className="absolute top-0 left-0 w-full h-1/2 flex justify-center"
        style={{ transformOrigin: 'bottom center' }}
        animate={{ rotate: rotation }}
        transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.2 }}
      >
        <div className="w-5 h-5 bg-foreground rounded-full border-4 border-background absolute bottom-[-10px] z-10" />
        <div className="w-1 h-full bg-foreground/80 rounded-t-full" />
      </motion.div>
      
      {/* متن مرکزی */}
      <div className="absolute text-center z-10">
        <motion.p
          className="text-5xl font-bold"
          style={{ color: getColor(normalizedValue) }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {normalizedValue}
        </motion.p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>

      {/* اعداد 0, 50, 100 */}
      <div className="absolute bottom-[-5px] w-[calc(100%+20px)] -mx-[10px] flex justify-between text-xs text-muted-foreground">
        <span>0</span>
        <span>50</span>
        <span>100</span>
      </div>
    </div>
  );
}