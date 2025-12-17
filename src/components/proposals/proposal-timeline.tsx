// src/components/proposals/proposal-timeline.tsx

"use client";

import { Check, Search, Vote, Banknote, Rocket, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";

const TIMELINE_STEPS = [
    { id: 1, labelKey: 'proposal_detail.status.validation', icon: Search },
    { id: 2, labelKey: 'proposal_detail.status.active', icon: Vote },
    { id: 3, labelKey: 'landing_page.status.funded', icon: Banknote },
    { id: 4, labelKey: 'proposal_detail.status.executed', icon: Rocket }
];

interface ProposalTimelineProps {
    currentState: bigint;
}

export function ProposalTimeline({ currentState }: ProposalTimelineProps) {
    const { t } = useTranslation();
    const state = Number(currentState);

    // تعیین مرحله فعال بر اساس وضعیت
    const getActiveStep = () => {
        switch (state) {
            case 0: case 1: return 0; // Validation
            case 2: return 1; // Voting
            case 3: case 8: case 10: return 2; // Funding / Approved
            case 5: case 9: return 3; // Executed / Funded
            case 4: return 1; // Defeated (Stop at voting)
            case 6: case 7: return 0; // Expired/Canceled
            default: return 0;
        }
    };

    const isFailedState = [4, 6, 7, 10].includes(state);
    const activeIndex = getActiveStep();

    return (
        <div className="w-full py-6">
            <div className="flex items-center justify-between w-full">
                {TIMELINE_STEPS.map((step, index) => {
                    const isCompleted = index < activeIndex;
                    const isCurrent = index === activeIndex;
                    const isFailed = isCurrent && isFailedState;
                    const isLast = index === TIMELINE_STEPS.length - 1;

                    const Icon = isFailed ? X : (isCompleted ? Check : step.icon);

                    return (
                        <div key={step.id} className="flex-1 flex items-center relative last:flex-none">
                            
                            {/* 1. دایره و آیکون */}
                            <div className="flex flex-col items-center relative z-10 w-full">
                                <div 
                                    className={cn(
                                        "w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-500 bg-background",
                                        isCompleted && "border-green-500 text-green-500",
                                        isCurrent && !isFailed && "border-blue-500 text-blue-500 ring-4 ring-blue-500/10",
                                        isFailed && "border-red-500 text-red-500 bg-red-50",
                                        !isCompleted && !isCurrent && "border-muted text-muted-foreground"
                                    )}
                                >
                                    <Icon className="w-5 h-5" />
                                </div>
                                
                                {/* برچسب زیر دایره */}
                                <span className={cn(
                                    "absolute top-14 text-[10px] sm:text-xs font-bold whitespace-nowrap",
                                    isCurrent || isCompleted ? "text-foreground" : "text-muted-foreground",
                                    isFailed && "text-red-500"
                                )}>
                                    {t(step.labelKey)}
                                    {isFailed && <span className="block text-[9px] opacity-80">{t('proposal_detail.status.failed')}</span>}
                                </span>
                            </div>

                            {/* 2. خط اتصال (Connectors) */}
                            {/* این خط فقط بعد از آیتم‌های غیر آخر رسم می‌شود */}
                            {!isLast && (
                                <div className="absolute top-6 left-0 right-0 w-full h-1 -z-0">
                                    {/* خط پس‌زمینه خاکستری */}
                                    <div className="absolute inset-0 bg-muted h-full w-full" />
                                    
                                    {/* خط پر شده رنگی */}
                                    {/* اگر مرحله فعلی تکمیل شده باشد، خط بعدی پر می‌شود */}
                                    <div 
                                        className={cn(
                                            "absolute inset-y-0 h-full transition-all duration-700",
                                            // در حالت RTL چون از flex-row استفاده کردیم، right/left خودکار هندل می‌شود
                                            "bg-green-500 origin-right rtl:origin-left" 
                                        )}
                                        style={{
                                            width: index < activeIndex ? '100%' : '0%',
                                            // اگر خط به مرحله قرمز می‌رسد، قرمز شود
                                            backgroundColor: (index === activeIndex - 1 && isFailed) ? '#ef4444' : undefined
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}