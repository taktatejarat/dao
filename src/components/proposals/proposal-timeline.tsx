// src/components/proposals/proposal-timeline.tsx - FIXED RTL & LINE VISIBILITY

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

    const getProgressStatus = () => {
        switch (state) {
            case 0: return { step: 0, status: 'process' }; // Pending
            case 1: return { step: 0, status: 'process' }; // Active/Validation
            case 2: return { step: 1, status: 'process' }; // Voting
            case 3: // Succeeded
            case 8: // Funding
                return { step: 2, status: 'process' };
            case 9: // Funded
                return { step: 3, status: 'process' };
            case 5: return { step: 4, status: 'done' }; // Executed
            
            // Fail States
            case 4: return { step: 1, status: 'error' }; // Defeated
            case 6: // Expired
            case 7: return { step: 0, status: 'error' }; // Canceled
            case 10: return { step: 2, status: 'error' }; // Funding Failed
            default: return { step: 0, status: 'process' };
        }
    };

    const { step: activeIndex, status } = getProgressStatus();
    
    // محاسبه درصد پر شدن خط
    // ما 3 فاصله بین 4 دایره داریم. هر گام 33.33% جلو می‌رود.
    const progressPercent = Math.min((activeIndex / (TIMELINE_STEPS.length - 1)) * 100, 100);

    return (
        <div className="relative w-full py-8">
            {/* نگهدارنده خط و دایره‌ها */}
            <div className="relative flex justify-between items-center w-full">
                
                {/* --- خط پس‌زمینه (خاکستری) --- */}
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-muted -z-20 -translate-y-1/2 mx-4 rounded-full" />

                {/* --- خط پیشرفت (رنگی) --- */}
                <div 
                    className={cn(
                        "absolute top-1/2 h-1 bg-primary transition-all duration-1000 ease-out -z-10 -translate-y-1/2 mx-4 rounded-full",
                        // در حالت RTL، این دیو به طور خودکار از راست پر می‌شود چون استایل والد RTL است
                    )}
                    style={{
                        width: `${progressPercent}%`,
                    }}
                />

                {/* --- مراحل (دایره‌ها) --- */}
                {TIMELINE_STEPS.map((step, index) => {
                    const isCompleted = index < activeIndex;
                    const isCurrent = index === activeIndex;
                    const isError = isCurrent && status === 'error';
                    
                    const Icon = isError ? X : (isCompleted ? Check : step.icon);

                    return (
                        <div key={step.id} className="relative flex flex-col items-center group">
                            
                            {/* دایره آیکون */}
                            <div 
                                className={cn(
                                    "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-4 transition-all duration-500 z-10 bg-background shadow-sm",
                                    isCompleted && "border-primary text-primary shadow-[0_0_10px_rgba(var(--primary),0.3)]",
                                    isCurrent && !isError && "border-amber-500 text-amber-500 ring-4 ring-amber-500/10 scale-110",
                                    isError && "border-red-500 text-red-500 ring-4 ring-red-500/10 bg-red-50",
                                    !isCompleted && !isCurrent && "border-muted text-muted-foreground"
                                )}
                            >
                                <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", isCurrent && !isError && "animate-pulse")} />
                            </div>

                            {/* متن زیر دایره */}
                            <div className="absolute top-16 w-32 text-center">
                                <span className={cn(
                                    "text-xs sm:text-sm font-bold block transition-colors duration-300",
                                    isCurrent ? "text-foreground scale-105" : "text-muted-foreground",
                                    isError && "text-red-600",
                                    isCompleted && "text-primary"
                                )}>
                                    {t(step.labelKey)}
                                </span>
                                {isError && (
                                    <span className="text-[10px] text-red-500 font-medium block mt-1">
                                        {t('proposal_detail.status_failed')}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}