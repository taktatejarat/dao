// src/components/icons/dao-loading-spinner.tsx

import { cn } from "@/lib/utils";

interface DaoLoadingSpinnerProps {
  className?: string;
}

export function DaoLoadingSpinner({ className }: DaoLoadingSpinnerProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("animate-spin text-primary", className)} // پیش‌فرض: رنگ پرایمری
      // اگر کلاسی پاس داده نشود، سایز پیش‌فرض 24px (w-6 h-6) است که برای دکمه‌ها عالی است
      width="24" 
      height="24"
    >
      {/* حلقه کم‌رنگ ثابت در پس‌زمینه برای زیبایی بیشتر */}
      <circle cx="12" cy="12" r="10" className="opacity-25" />
      
      {/* بخش متحرک که نشان‌دهنده لودینگ است */}
      <path d="M21 12a9 9 0 1 1-6.219-8.56" className="opacity-75" />
    </svg>
  );
}