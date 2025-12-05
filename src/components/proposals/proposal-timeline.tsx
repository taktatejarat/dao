// src/components/proposals/proposal-timeline.tsx - FINAL STATUS COLORS

"use client";

import { Check, Circle, Loader2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";

// نگاشت وضعیت‌ها به مراحل خطی
// 0-1: بررسی -> 2: رای‌گیری -> 3: تایید/رد -> 8: تامین مالی -> 5/9: اجرا/تکمیل
const STEPS = [
    { id: 0, labelKey: 'proposal_detail.status.validation', icon: Clock }, // بررسی اولیه
    { id: 2, labelKey: 'proposal_detail.status.active', icon: Loader2 },   // رای‌گیری
    { id: 8, labelKey: 'landing_page.status.funded', icon: Circle },      // تامین مالی (Funding)
    { id: 5, labelKey: 'proposal_detail.status.executed', icon: Check }   // اجرا
];

interface ProposalTimelineProps {
    currentState: bigint;
}

export function ProposalTimeline({ currentState }: ProposalTimelineProps) {
    const { t } = useTranslation();
    const stateNum = Number(currentState);

    // تابع کمکی برای پیدا کردن وضعیت فعلی در آرایه مراحل
    const getCurrentStepIndex = () => {
        if (stateNum === 3) return 2; // Approved -> نمایش به عنوان قبل از Funding
        if (stateNum === 4 || stateNum === 6 || stateNum === 7 || stateNum === 10) return -1; // Failed states
        if (stateNum === 9) return 3; // Funded -> Executed
        
        // پیدا کردن نزدیک‌ترین مرحله
        const index = STEPS.findIndex(s => s.id === stateNum);
        return index !== -1 ? index : 0; 
    };

    const activeStepIndex = getCurrentStepIndex();

    return (
        <div className="relative flex flex-col md:flex-row justify-between items-center w-full py-6 px-2">
            {/* خط اتصال پس‌زمینه */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -z-10 hidden md:block transform -translate-y-1/2 rounded-full" />
            
            {/* نوار پیشرفت رنگی (تا مرحله فعلی) */}
            <div 
                className="absolute top-1/2 left-0 h-1 bg-primary -z-10 hidden md:block transform -translate-y-1/2 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${(activeStepIndex / (STEPS.length - 1)) * 100}%` }}
            />

            {STEPS.map((step, index) => {
                const isCompleted = index < activeStepIndex;
                const isCurrent = index === activeStepIndex;
                const Icon = step.icon;

                return (
                    <div key={step.id} className="flex flex-col items-center gap-3 relative group">
                        <div 
                            className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-500 z-10",
                                // 🟣 مرحله انجام شده: بنفش (Primary)
                                isCompleted && "bg-primary border-primary text-primary-foreground shadow-[0_0_15px_rgba(124,58,237,0.5)]",
                                
                                // 🟡 مرحله فعلی: زرد + چشمک زن + بوردر درخشان
                                isCurrent && "bg-background border-amber-500 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-pulse ring-4 ring-amber-500/20",
                                
                                // ⚫ مرحله آینده: خاکستری
                                !isCompleted && !isCurrent && "bg-background border-muted text-muted-foreground"
                            )}
                        >
                            {/* آیکون داخل دایره */}
                            {isCurrent ? (
                                <Icon className="w-6 h-6 animate-spin-slow" /> 
                            ) : (
                                <Icon className="w-5 h-5" />
                            )}
                        </div>
                        
                        <span 
                            className={cn(
                                "text-sm font-medium transition-colors duration-300 absolute top-14 whitespace-nowrap",
                                isCurrent ? "text-amber-500 font-bold scale-110" : "text-muted-foreground",
                                isCompleted && "text-primary"
                            )}
                        >
                            {t(step.labelKey)}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}