// src/components/proposals/proposal-timeline.tsx - FULLY FIXED

"use client";

import { Check, Loader2, Search, Vote, Banknote, Rocket, X, AlertOctagon } from "lucide-react";
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
    const { t, locale } = useTranslation();
    const isRtl = locale === 'fa' || locale === 'ar';
    const state = Number(currentState);

    const getProgressStatus = () => {
        switch (state) {
            case 0: // Pending
            case 1: // Validation
                return { step: 0, status: 'process' };
            
            case 2: // Voting
                return { step: 1, status: 'process' };
            
            case 3: // Approved
            case 8: // Funding
                return { step: 2, status: 'process' };
            
            case 9: // Funded
                return { step: 3, status: 'process' };
            
            case 5: // Executed
                return { step: 4, status: 'done' };

            // Error/Fail States
            case 4: // Defeated
                return { step: 1, status: 'error' };
            case 6: // Expired
            case 7: // Canceled
                return { step: 0, status: 'error' };
            case 10: // Funding Failed
                return { step: 2, status: 'error' };
                
            default:
                return { step: 0, status: 'process' };
        }
    };

    const { step: activeIndex, status } = getProgressStatus();

    // Calculate progress percentage (0 to 100)
    // 3 segments between 4 steps -> 100 / 3 = 33.33% per step
    const progressPercent = Math.min((activeIndex / (TIMELINE_STEPS.length - 1)) * 100, 100);

    return (
        <div className="relative w-full py-4" dir="ltr"> {/* Always LTR for structural alignment, text handles direction */}
            <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center min-h-[300px] md:min-h-0 pl-8 md:pl-0">
                
                {/* --- Background Line (Gray) --- */}
                <div className="absolute left-[1.6rem] top-0 bottom-0 w-1 bg-muted md:left-0 md:right-0 md:top-1/2 md:bottom-auto md:h-1 md:w-full -z-20 rounded-full" />

                {/* --- Progress Line (Colored) --- */}
                <div 
                    className={cn(
                        "absolute bg-primary transition-all duration-1000 ease-out -z-10 rounded-full",
                        // Mobile: Vertical filling
                        "left-[1.6rem] top-0 w-1",
                        // Desktop: Horizontal filling
                        "md:left-0 md:top-1/2 md:h-1 md:w-auto"
                    )}
                    style={{
                        // Use CSS variables or inline styles for dynamic width/height
                        // On Mobile: Height changes, Width is fixed by class
                        // On Desktop: Width changes, Height is fixed by class
                        height: `var(--progress-mobile, 100%)`, 
                        width: `var(--progress-desktop, 100%)`
                    }}
                >
                    <style jsx>{`
                        div {
                            --progress-val: ${progressPercent}%;
                        }
                        @media (max-width: 768px) {
                            div[class*="absolute bg-primary"] {
                                height: var(--progress-val) !important;
                                width: 0.25rem; /* w-1 */
                            }
                        }
                        @media (min-width: 769px) {
                            div[class*="absolute bg-primary"] {
                                width: var(--progress-val) !important;
                                height: 0.25rem; /* h-1 */
                            }
                        }
                    `}</style>
                </div>

                {/* --- Connecting Lines Mask (Optional: To hide line behind circles perfectly) --- */}
                {/* Logic handled by z-index: Line is -10, Circles are +10 */}

                {/* --- Steps --- */}
                {TIMELINE_STEPS.map((step, index) => {
                    const isCompleted = index < activeIndex;
                    const isCurrent = index === activeIndex;
                    const isError = isCurrent && status === 'error';
                    
                    const Icon = isError ? X : (isCompleted ? Check : step.icon);

                    return (
                        <div key={step.id} className="relative flex md:flex-col items-center gap-4 md:gap-3 flex-1 pt-10 md:pt-0 first:pt-0">
                            
                            {/* Circle Icon */}
                            <div 
                                className={cn(
                                    "w-14 h-14 rounded-full flex items-center justify-center border-4 transition-all duration-500 z-10 bg-background shadow-sm",
                                    isCompleted && "border-primary text-primary shadow-[0_0_10px_rgba(var(--primary),0.3)]",
                                    isCurrent && !isError && "border-amber-500 text-amber-500 ring-4 ring-amber-500/10 scale-110",
                                    isError && "border-red-500 text-red-500 ring-4 ring-red-500/10 bg-red-50",
                                    !isCompleted && !isCurrent && "border-muted text-muted-foreground"
                                )}
                            >
                                <Icon className={cn("w-6 h-6", isCurrent && !isError && "animate-pulse")} />
                            </div>

                            {/* Label */}
                            <div className={cn(
                                "md:absolute md:top-16 md:left-1/2 md:-translate-x-1/2 w-40 md:text-center pb-0",
                                isRtl ? "text-right md:text-center" : "text-left md:text-center"
                            )}>
                                <span className={cn(
                                    "text-sm font-bold block transition-colors duration-300",
                                    isCurrent ? "text-foreground" : "text-muted-foreground",
                                    isError && "text-red-600",
                                    isCompleted && "text-primary"
                                )}>
                                    {t(step.labelKey)}
                                </span>
                                {isError && (
                                    <span className="text-[11px] text-red-500 font-medium block mt-1">
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