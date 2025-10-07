import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import React from 'react'; // ایمپورت کردن React برای استفاده از React.ReactNode

interface StatCardProps {
  title: string;
  value: React.ReactNode; // نوع داده می‌تواند رشته، عدد یا کامپوننت باشد
  description: string;
  icon?: LucideIcon; // آیکون را اختیاری می‌کنیم
  variant?: "default" | "positive" | "negative" | "neutral";
  isLoading?: boolean;
}

export function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, // تغییر نام icon به Icon برای استفاده به عنوان کامپوننت
  variant = "default", 
  isLoading = false 
}: StatCardProps) {
  
  // بهبود: تعریف کلاس‌ها در یک متغیر جداگانه برای خوانایی بهتر
  const valueColorClass = {
    "positive": "text-green-600 dark:text-green-500",
    "negative": "text-destructive",
    "neutral": "text-blue-600 dark:text-blue-500",
    "default": "",
  }[variant];
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
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