// src/components/icons/logo.tsx

import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100" // ViewBox استاندارد برای طراحی‌های دقیق
      fill="none"
      stroke="currentColor"
      strokeWidth="8" // خطوط ضخیم‌تر برای دیده شدن در سایز کوچک
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <defs>
        {/* گرادیانت برای ایجاد حس مدرن و های‌تک */}
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--secondary))" />
        </linearGradient>
      </defs>

      {/* لایه بیرونی: شش‌ضلعی که محافظت و ساختار DAO را نشان می‌دهد */}
      {/* یک شش ضلعی که کمی باز است تا حس پویایی بدهد */}
      <path 
        d="M50 5 L93.3 30 V80 L50 105 L6.7 80 V30 Z" 
        stroke="url(#logo-gradient)"
        fill="none"
        strokeWidth="6"
        transform="scale(0.85) translate(8, 0)" // تنظیم دقیق وسط‌چین
        className="opacity-90"
      />

      {/* لایه داخلی: مکعب سه بعدی که نماد خزانه (Treasury) و سرمایه است */}
      <g transform="translate(50, 52)">
        {/* سقف مکعب */}
        <path 
            d="M0 -22 L19 -11 L0 0 L-19 -11 Z" 
            fill="hsl(var(--primary))" 
            stroke="none"
            className="opacity-80"
        />
        {/* وجه راست مکعب */}
        <path 
            d="M0 0 L19 -11 V11 L0 22 Z" 
            fill="hsl(var(--primary))" 
            stroke="none"
            className="opacity-60"
        />
        {/* وجه چپ مکعب */}
        <path 
            d="M0 0 L-19 -11 V11 L0 22 Z" 
            fill="hsl(var(--primary))" 
            stroke="none" 
            className="opacity-40"
        />
      </g>
    </svg>
  );
}