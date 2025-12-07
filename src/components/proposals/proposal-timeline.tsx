// src/components/proposals/proposal-timeline.tsx - FIXED VISUALS & LOGIC

"use client";

import { Check, Loader2, Search, Vote, Banknote, Rocket, X, AlertOctagon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";

// تعریف مراحل اصلی (Milestones of the process)
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

    // منطق تبدیل وضعیت بلاکچین به وضعیت بصری تایم‌لاین
    // خروجی: { stepIndex: تا کدام مرحله پر شود, status: 'process' | 'error' | 'done' }
    const getProgressStatus = () => {
        switch (state) {
            case 0: // Pending
            case 1: // Validation
                return { step: 0, status: 'process' }; // روی مرحله ۱ گیر کرده
            
            case 2: // Voting
                return { step: 1, status: 'process' }; // روی مرحله ۲
            
            case 3: // Approved (Waiting for funding start)
            case 8: // Funding
                return { step: 2, status: 'process' }; // روی مرحله ۳
            
            case 9: // Funded (Ready for execution)
                return { step: 3, status: 'process' }; // روی مرحله ۴
            
            case 5: // Executed
                return { step: 4, status: 'done' }; // تمام شده (خط تا آخر پر)

            // --- وضعیت‌های شکست ---
            case 4: // Defeated (in Voting)
                return { step: 1, status: 'error' };
            case 6: // Expired
                return { step: 0, status: 'error' };
            case 7: // Canceled
                return { step: 0, status: 'error' }; // یا مرحله فعلی را قرمز کن
            case 10: // Funding Failed
                return { step: 2, status: 'error' };
                
            default:
                return { step: 0, status: 'process' };
        }
    };

    const { step: activeIndex, status } = getProgressStatus();

    // محاسبه درصد پر شدن خط
    // اگر 4 مرحله داریم، فاصله بینشان 3 بخش است.
    const progressPercent = Math.min((activeIndex / (TIMELINE_STEPS.length - 1)) * 100, 100);

    return (
        <div className="relative w-full py-4">
            {/* کانتینر اصلی */}
            <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center min-h-[300px] md:min-h-0 pl-8 md:pl-0">
                
                {/* --- خط پس‌زمینه (خاکستری) --- */}
                {/* موبایل: عمودی | دسکتاپ: افقی */}
                <div className="absolute left-[1.6rem] top-0 bottom-0 w-1 bg-muted md:left-0 md:right-0 md:top-1/2 md:bottom-auto md:h-1 md:w-full -z-20 rounded-full" />

                {/* --- خط پیشرفت (رنگی) --- */}
                <div 
                    className={cn(
                        "absolute left-[1.6rem] top-0 w-1 bg-primary transition-all duration-1000 ease-out -z-10 rounded-full", // استایل موبایل
                        "md:left-0 md:top-1/2 md:h-1 md:w-0" // استایل دسکتاپ (ریست)
                    )}
                    style={{ 
                        // موبایل: ارتفاع تغییر می‌کند | دسکتاپ: عرض تغییر می‌کند
                        // برای سادگی در این کامپوننت ریسپانسیو، از متغیر CSS استفاده می‌کنیم یا استایل اینلاین شرطی
                        // اما چون مدیا کوئری در JS سخت است، از کلاس‌های Tailwind استفاده می‌کنیم که width/height را کنترل کنند
                    }}
                >
                     {/* 
                        توضیح: پیاده‌سازی نوار پرشونده برای حالت ریسپانسیو (عمودی به افقی) با یک div ساده دشوار است.
                        به جای آن، رنگ دایره‌ها و خطوط بین آن‌ها را به صورت تک‌تک کنترل می‌کنیم.
                     */}
                </div>

                {/* بازنویسی خطوط اتصال برای کنترل دقیق ریسپانسیو */}
                <div className="absolute inset-0 -z-10 flex flex-col md:flex-row pointer-events-none">
                     {TIMELINE_STEPS.slice(0, -1).map((_, i) => {
                         // آیا خط بعد از این دایره باید روشن شود؟
                         const isLineActive = i < activeIndex;
                         return (
                             <div key={i} className={cn(
                                 "flex-1 bg-muted transition-colors duration-700",
                                 "w-1 h-full ml-[1.6rem] md:ml-0 md:w-full md:h-1 md:mt-[2.6rem] lg:mt-0 lg:self-center", // موقعیت‌دهی دقیق
                                 isLineActive && (status === 'error' && i === activeIndex -1 ? "bg-red-500" : "bg-primary")
                             )} />
                         );
                     })}
                </div>


                {/* --- مراحل (آیکون‌ها) --- */}
                {TIMELINE_STEPS.map((step, index) => {
                    const isCompleted = index < activeIndex;
                    const isCurrent = index === activeIndex;
                    const isError = isCurrent && status === 'error';
                    
                    const Icon = isError ? X : (isCompleted ? Check : step.icon);

                    return (
                        <div key={step.id} className="relative flex md:flex-col items-center gap-4 md:gap-3 flex-1 pt-6 md:pt-0 first:pt-0">
                            
                            {/* دایره آیکون */}
                            <div 
                                className={cn(
                                    "w-14 h-14 rounded-full flex items-center justify-center border-4 transition-all duration-500 z-10 bg-background",
                                    // 1. تکمیل شده
                                    isCompleted && "border-primary text-primary shadow-[0_0_15px_rgba(var(--primary),0.4)]",
                                    // 2. در حال انجام
                                    isCurrent && !isError && "border-amber-500 text-amber-500 ring-4 ring-amber-500/20 animate-pulse",
                                    // 3. خطا/شکست
                                    isError && "border-red-500 text-red-500 ring-4 ring-red-500/20 bg-red-50",
                                    // 4. آینده
                                    !isCompleted && !isCurrent && "border-muted text-muted-foreground"
                                )}
                            >
                                <Icon className={cn("w-6 h-6", isCurrent && !isError && "animate-spin-slow")} />
                            </div>

                            {/* متن توضیحات */}
                            <div className="md:absolute md:top-16 md:left-1/2 md:-translate-x-1/2 w-32 md:text-center pb-6 md:pb-0">
                                <span className={cn(
                                    "text-sm font-bold block transition-colors duration-300",
                                    isCurrent ? "text-foreground scale-105" : "text-muted-foreground",
                                    isError && "text-red-600",
                                    isCompleted && "text-primary"
                                )}>
                                    {t(step.labelKey)}
                                </span>
                                {isError && (
                                    <span className="text-[10px] text-red-500 font-medium block">
                                        {t('status.failed')}
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