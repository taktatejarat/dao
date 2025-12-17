// src/components/icons/dao-loading-spinner.tsx

"use client";

import { cn } from "@/lib/utils";
import { Loader2, Hexagon, Box } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

interface DaoSpinnerProps {
    className?: string;
    size?: "sm" | "md" | "lg" | "xl" | "fullscreen";
    variant?: "spinner" | "blockchain"; 
    text?: string;
    showText?: boolean;
}

export function DaoLoadingSpinner({ 
    className, 
    size = "sm", 
    variant = "spinner",
    text,
    showText = false
}: DaoSpinnerProps) {
    const { t } = useTranslation();

    // تعیین ابعاد آیکون بر اساس سایز
    const iconSizeClasses = {
        sm: "w-4 h-4",
        md: "w-8 h-8",
        lg: "w-16 h-16",
        xl: "w-24 h-24",
        fullscreen: "w-32 h-32"
    };

    // اگر سایز fullscreen یا xl/lg باشد، حالت بلاکچین را ترجیح می‌دهیم (مگر اینکه دستی spinner خواسته شده باشد)
    const isLarge = ["lg", "xl", "fullscreen"].includes(size);
    const effectiveVariant = (isLarge && variant === "spinner") ? "blockchain" : variant;
    
    // کانتینر اصلی
    const containerClasses = cn(
        "flex flex-col items-center justify-center transition-all duration-500 z-50",
        size === "fullscreen" ? "fixed inset-0 bg-background/90 backdrop-blur-md" : "",
        className
    );

    return (
        <div className={containerClasses}>
            <div className="relative flex items-center justify-center">
                
                {/* --- VARIANT: SPINNER (ساده برای دکمه‌ها) --- */}
                {effectiveVariant === "spinner" && (
                    <Loader2 className={cn("animate-spin text-primary", iconSizeClasses[size === "fullscreen" ? "xl" : size])} />
                )}

                {/* --- VARIANT: BLOCKCHAIN (گرافیکی برای صفحات) --- */}
                {effectiveVariant === "blockchain" && (
                    <div className="relative flex items-center justify-center">
                        {/* 1. پالس نوری پشت زمینه */}
                        <div className={cn(
                            "absolute rounded-full bg-primary/20 blur-xl animate-pulse",
                            size === "fullscreen" ? "w-64 h-64" : "w-32 h-32"
                        )} />

                        {/* 2. حلقه چرخان بیرونی */}
                        <div className={cn(
                            "absolute border-2 border-dashed border-primary/30 rounded-full animate-[spin_10s_linear_infinite]",
                            size === "fullscreen" ? "w-48 h-48" : "w-24 h-24"
                        )} />

                        {/* 3. آیکون شش ضلعی (Hexagon) با افکت تنفس */}
                        <Hexagon 
                            className={cn(
                                "text-primary fill-primary/5 animate-[pulse_3s_ease-in-out_infinite] drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]",
                                iconSizeClasses[size === "fullscreen" ? "fullscreen" : size]
                            )}
                            strokeWidth={1}
                        />

                        {/* 4. مکعب مرکزی (Box) که می‌چرخد یا بالا پایین می‌رود */}
                        <Box 
                            className={cn(
                                "absolute text-white dark:text-black animate-[bounce_3s_infinite]",
                                size === "fullscreen" ? "w-12 h-12" : "w-6 h-6"
                            )}
                            fill="currentColor"
                            strokeWidth={0}
                        />
                    </div>
                )}
            </div>

            {/* --- متن لودینگ --- */}
            {(showText || isLarge) && (
                <div className="mt-8 flex flex-col items-center gap-2">
                    <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600 animate-pulse">
                        {text || t('common.loading')}
                    </h3>
                    <div className="flex gap-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-[bounce_1s_infinite_0ms]" />
                        <div className="w-2 h-2 bg-primary rounded-full animate-[bounce_1s_infinite_200ms]" />
                        <div className="w-2 h-2 bg-primary rounded-full animate-[bounce_1s_infinite_400ms]" />
                    </div>
                </div>
            )}
        </div>
    );
}