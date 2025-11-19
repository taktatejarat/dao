// src/components/dashboard/stat-card.tsx - FINAL, OPTIMIZED VERSION

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import React from 'react';

// ✅ تعریف تایپ‌ها خارج از کامپوننت برای خوانایی بهتر
type CardVariant = "default" | "positive" | "negative" | "neutral";

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  description: string;
  icon?: LucideIcon;
  variant?: CardVariant;
  isLoading?: boolean;
}

// ✅ تعریف کلاس‌های رنگ به صورت یک Map برای دسترسی آسان
const variantColorMap: Record<CardVariant, string> = {
  "positive": "text-green-600 dark:text-green-500",
  "negative": "text-destructive",
  "neutral": "text-blue-600 dark:text-blue-500",
  "default": "text-gradient", // استفاده از رنگ پیش‌فرض متن
};

export function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon,
  variant = "default", 
  isLoading = false 
}: StatCardProps) {
  
  const valueColorClass = variantColorMap[variant];
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {/* ✅ در حالت لودینگ، آیکون نمایش داده نمی‌شود */}
        {Icon && !isLoading && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2 pt-1">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : (
          <>
            <div className={cn("text-2xl font-bold truncate", valueColorClass)}>
              {value}
            </div>
            <p className="text-xs text-muted-foreground pt-1">{description}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}