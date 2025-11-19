// src/components/proposals/proposal-timeline.tsx (فایل جدید)

"use client";

import { useTranslation } from "@/hooks/use-translation";
import { CheckCircle, CircleDashed, Hourglass, PlayCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

// نگاشت وضعیت‌های قرارداد به مراحل تایم‌لاین
const stateToStep: { [key: number]: number } = {
  0: 0, // Pending
  1: 1, // Active
  2: 1, // Voting
  3: 2, // Approved
  4: 2, // Rejected
  5: 3, // Executed
};

interface ProposalTimelineProps {
  currentState: bigint;
}

export function ProposalTimeline({ currentState }: ProposalTimelineProps) {
    const { t } = useTranslation();
    const currentStep = stateToStep[Number(currentState)] ?? 0;
    const isRejected = Number(currentState) === 4;

    const steps = [
        { label: t('proposal_detail.timeline.submitted'), icon: CheckCircle },
        { label: t('proposal_detail.timeline.voting'), icon: Hourglass },
        { label: t('proposal_detail.timeline.approved'), icon: isRejected ? XCircle : CheckCircle },
        { label: t('proposal_detail.timeline.executed'), icon: PlayCircle },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('proposal_detail.timeline.title')}</CardTitle>
            </CardHeader>
            <CardContent>
                <ol className="relative border-s border-border dark:border-gray-700 ms-3">
                    {steps.map((step, index) => {
                        const isCompleted = currentStep > index;
                        const isCurrent = currentStep === index;
                        const isFuture = currentStep < index;
                        const finalColor = isRejected && index === 2 ? "text-destructive" : "text-primary";

                        return (
                            <li key={index} className="mb-10 ms-6">
                                <span className={cn(
                                    "absolute flex items-center justify-center w-6 h-6 rounded-full -start-3 ring-8 ring-background",
                                    isCompleted ? `bg-primary ${finalColor}` : "bg-muted-foreground",
                                    isCurrent && "animate-pulse"
                                )}>
                                    <step.icon className="w-4 h-4 text-white" />
                                </span>
                                <h3 className={cn(
                                    "font-semibold",
                                    isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"
                                )}>
                                    {step.label}
                                </h3>
                            </li>
                        );
                    })}
                </ol>
            </CardContent>
        </Card>
    );
}