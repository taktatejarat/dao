// src/components/dashboard/stat-card.tsx - FINAL ENTERPRISE DESIGN

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type CardVariant = "default" | "positive" | "negative" | "neutral" | "warning";

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  description?: string;
  icon: LucideIcon; // آیکون در این طرح اجباری است
  variant?: CardVariant;
  isLoading?: boolean;
  onClick?: () => void; // قابلیت کلیک شدن
}

// تنظیمات رنگ‌بندی بر اساس نوع کارت
const variantStyles: Record<CardVariant, { 
    iconColor: string, 
    bgColor: string, 
    borderColor: string, 
    shadowColor: string 
}> = {
  default: { // Primary (Blue/Indigo based on theme)
    iconColor: "text-primary",
    bgColor: "bg-primary/10 group-hover:bg-primary/20",
    borderColor: "group-hover:border-primary/50",
    shadowColor: "group-hover:shadow-primary/5"
  },
  positive: { // Green (Growth/Success)
    iconColor: "text-green-600 dark:text-green-500",
    bgColor: "bg-green-500/10 group-hover:bg-green-500/20",
    borderColor: "group-hover:border-green-500/50",
    shadowColor: "group-hover:shadow-green-500/5"
  },
  negative: { // Red (Errors/Loss)
    iconColor: "text-red-600 dark:text-red-500",
    bgColor: "bg-red-500/10 group-hover:bg-red-500/20",
    borderColor: "group-hover:border-red-500/50",
    shadowColor: "group-hover:shadow-red-500/5"
  },
  warning: { // Yellow/Orange (Alerts)
    iconColor: "text-amber-600 dark:text-amber-500",
    bgColor: "bg-amber-500/10 group-hover:bg-amber-500/20",
    borderColor: "group-hover:border-amber-500/50",
    shadowColor: "group-hover:shadow-amber-500/5"
  },
  neutral: { // Blue/Gray (Info)
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

  return (
    <Card 
        onClick={onClick}
        className={cn(
            "relative overflow-hidden transition-all duration-300 border bg-card",
            "group hover:shadow-lg", 
            styles.borderColor,
            styles.shadowColor,
            onClick && "cursor-pointer"
        )}
    >
        {/* 1. Background Icon (Big & Faded) */}
        <div className="absolute -top-2 -right-2 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 pointer-events-none">
            <Icon className="w-32 h-32" />
        </div>

        <CardHeader className="flex flex-row items-center gap-4 pb-2 relative z-10">
            {/* 2. Primary Icon (Small & Colored) */}
            <div className={cn("p-2.5 rounded-xl transition-colors duration-300", styles.bgColor)}>
                {isLoading ? (
                    <Skeleton className="w-6 h-6 rounded-md" />
                ) : (
                    <Icon className={cn("w-6 h-6", styles.iconColor)} />
                )}
            </div>
            
            <CardTitle className="text-lg font-medium text-muted-foreground">
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