// src/components/dashboard/stat-card.tsx - FINAL RTL SUPPORT FIXED

"use client"; // این خط برای استفاده از هوک ضروری است

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { useLanguage } from '@/context/LanguageProvider'; // ✅ ایمپورت هوک زبان

type CardVariant = "default" | "positive" | "negative" | "neutral" | "warning";

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  description?: string;
  icon: LucideIcon;
  variant?: CardVariant;
  isLoading?: boolean;
  onClick?: () => void;
}

const variantStyles: Record<CardVariant, { 
    iconColor: string, 
    bgColor: string, 
    borderColor: string, 
    shadowColor: string 
}> = {
  default: { 
    iconColor: "text-primary",
    bgColor: "bg-primary/10 group-hover:bg-primary/20",
    borderColor: "group-hover:border-primary/50",
    shadowColor: "group-hover:shadow-primary/5"
  },
  positive: { 
    iconColor: "text-green-600 dark:text-green-500",
    bgColor: "bg-green-500/10 group-hover:bg-green-500/20",
    borderColor: "group-hover:border-green-500/50",
    shadowColor: "group-hover:shadow-green-500/5"
  },
  negative: { 
    iconColor: "text-red-600 dark:text-red-500",
    bgColor: "bg-red-500/10 group-hover:bg-red-500/20",
    borderColor: "group-hover:border-red-500/50",
    shadowColor: "group-hover:shadow-red-500/5"
  },
  warning: { 
    iconColor: "text-amber-600 dark:text-amber-500",
    bgColor: "bg-amber-500/10 group-hover:bg-amber-500/20",
    borderColor: "group-hover:border-amber-500/50",
    shadowColor: "group-hover:shadow-amber-500/5"
  },
  neutral: { 
    iconColor: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10 group-hover:bg-blue-500/20",
    borderColor: "group-hover:border-blue-500/50",
    shadowColor: "group-hover:shadow-blue-500/5"
  }
};

  export function StatCard({ 
    title, 
    value, 
    description, 
    icon: Icon,
    variant = "default", 
    isLoading = false,
    onClick
  }: StatCardProps) {
    
    const styles = variantStyles[variant];
    const { direction } = useLanguage(); // ✅ تشخیص جهت زبان

    // ✅ منطق تعیین موقعیت آیکون بر اساس جهت زبان
    // اگر RTL باشد، آیکون به چپ (-left-6) می‌رود، وگرنه راست (-right-6)
    const bgIconPosition = direction === 'rtl' ? '-left-6' : '-right-6';

    return (
      <Card 
          onClick={onClick}
          className={cn(
              "relative overflow-hidden transition-all duration-300 border bg-card",
              "group hover:shadow-lg hover:-translate-y-1", 
              styles.borderColor,
              styles.shadowColor,
              onClick && "cursor-pointer"
          )}
      >
          {/* 1. Background Icon (Smart Positioning) */}
          <div 
              className={cn(
                  "absolute -top-6 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 pointer-events-none",
                  bgIconPosition // کلاس داینامیک اعمال شد
              )}
          >
              <Icon className="w-32 h-32" />
          </div>
          <CardHeader className="flex flex-row items-center gap-4 pb-2 relative z-10">
              {/* 2. Primary Icon */}
              <div className={cn("p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110 shadow-sm", styles.bgColor)}>
                  {isLoading ? (
                      <Skeleton className="w-6 h-6 rounded-md" />
                  ) : (
                       <Icon className={cn("w-6 h-6 animate-pulse-medium", styles.iconColor)} />
                  )}
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                  {title}
              </CardTitle>
          </CardHeader>
        <CardContent className="relative z-10">
            {isLoading ? (
                <div className="space-y-2">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
            ) : (
                <div className="space-y-1">
                    <div className={cn("text-2xl font-bold tracking-tight font-headline", styles.iconColor)}>
                        {value}
                    </div>
                    {description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                            {description}
                        </p>
                    )}
                </div>
            )}
        </CardContent>
    </Card>
  );
}