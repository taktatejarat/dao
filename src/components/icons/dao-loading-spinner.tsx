// src/components/icons/dao-loading-spinner.tsx - GRADIENT RESTORED

import { cn } from "@/lib/utils";

interface DaoLoadingSpinnerProps {
  className?: string;
}

export function DaoLoadingSpinner({ className }: DaoLoadingSpinnerProps) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <svg
        className="animate-spin"
        width="100%"
        height="100%"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '3em', height: '3em' }} // سایز را از والد می‌گیرد
      >
        <defs>
          <linearGradient id="spinner-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="50%" stopColor="hsl(var(--secondary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
        </defs>
        
        <path
          d="M21 12a9 9 0 1 1-6.219-8.56"
          stroke="url(#spinner-gradient)" // ✅ استفاده از گرادیانت تعریف شده
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}