// src/components/dashboard/proposals-list.tsx

"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; 
import { useTranslation } from "@/hooks/use-translation";
import { DaoLoadingSpinner } from "../icons/dao-loading-spinner";
import { useProposals } from "@/hooks/useProposals"; // هوک قدیمی برای حالت مستقل
import { ArrowRight, CheckCircle, Clock, PlayCircle, XCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge"; 
import Link from "next/link"; 

// تعریف دقیق تایپ داده پروپوزال
export interface ProposalSummary {
    _id: string;
    proposalIdOnChain?: string;
    projectName: string;
    tagline: string;
    onChainStatus: string;
    // سایر فیلدها...
}

interface ProposalsListProps {
    limit?: number;
    data?: ProposalSummary[]; // ✅ داده‌های اختیاری از والد
    isLoading?: boolean;      // ✅ وضعیت لودینگ از والد
    emptyMessage?: string;    // ✅ پیام خالی سفارشی
}

export function ProposalsList({ limit, data, isLoading: parentLoading, emptyMessage }: ProposalsListProps) {
    const { t } = useTranslation();
    
    // اگر داده از بیرون نیامد، خودمان فچ می‌کنیم (حالت مستقل)
    const { proposals: fetchedData, isLoading: isFetchLoading } = useProposals();
    
    // تصمیم‌گیری نهایی: داده والد اولویت دارد
    const displayData = data || fetchedData;
    const isLoading = parentLoading !== undefined ? parentLoading : isFetchLoading;

    const getStatusConfig = (status: string) => {
        const s = status?.toLowerCase() || 'pending';
        switch (s) {
            case 'approved': 
            case 'funded':
                return { icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10", label: t('proposal_detail.status.succeeded') };
            case 'rejected': 
            case 'failed':
                return { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10", label: t('proposal_detail.status.defeated') };
            case 'voting': 
            case 'active': 
            case 'funding':
                return { icon: PlayCircle, color: "text-blue-500", bg: "bg-blue-500/10", label: t('proposal_detail.status.active') };
            case 'executed': 
                return { icon: CheckCircle, color: "text-purple-500", bg: "bg-purple-500/10", label: t('proposal_detail.status.executed') };
            default: 
                return { icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10", label: t('proposal_detail.status.pending') };
        }
    };

    const finalProposals = limit && displayData ? displayData.slice(0, limit) : displayData;

    if (isLoading) return <div className="flex justify-center p-4"><DaoLoadingSpinner /></div>;
    
    if (!finalProposals || finalProposals.length === 0) {
        return (
            <Card>
                <CardHeader><CardTitle>{t('sidebar.proposals')}</CardTitle></CardHeader>
                <CardContent className="text-center text-muted-foreground py-8 flex flex-col items-center gap-2">
                    <AlertCircle className="h-8 w-8 opacity-50" />
                    <p>{emptyMessage || t('dashboard.no_proposals')}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">{t('sidebar.proposals')}</CardTitle>
                {limit && (
                    <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
                        <Link href="/proposals">
                            {t('dashboard.view_all')} <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                    </Button>
                )}
            </CardHeader>
            <CardContent className="grid gap-3">
                {finalProposals.map((proposal: any) => {
                    const status = getStatusConfig(proposal.onChainStatus || proposal.status);
                    const StatusIcon = status.icon;
                    // اولویت لینک: شناسه آنچین > شناسه دیتابیس
                    const linkId = proposal.proposalIdOnChain || proposal._id;
                    
                    return (
                        <Link key={proposal._id} href={`/proposals/${linkId}`} className="group block">
                            <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-all duration-200">
                                <div className="flex flex-col gap-1 min-w-0">
                                    <span className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                                        {proposal.projectName}
                                    </span>
                                    <span className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-xs">
                                        {proposal.tagline}
                                    </span>
                                </div>
                                <div className="flex items-center shrink-0">
                                    <Badge variant="outline" className={`${status.color} ${status.bg} border-0 text-[10px] px-2 py-0.5 h-6 flex items-center gap-1`}>
                                        <StatusIcon className="w-3 h-3" />
                                        <span className="hidden sm:inline">{status.label}</span>
                                    </Badge>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </CardContent>
        </Card>
    );
}