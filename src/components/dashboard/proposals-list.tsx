// src/components/dashboard/proposals-list.tsx (FINAL, HOOK-BASED VERSION)

"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; 
import { useTranslation } from "@/hooks/use-translation";
import { DaoLoadingSpinner } from "../icons/dao-loading-spinner";
import { useProposals, type ProposalListData } from "@/hooks/useProposals";
import { ArrowRight, CheckCircle, ClipboardCopy, Clock, PlayCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge"; 
import { toast } from "sonner";
import Link from "next/link"; 

//اضافه کردن اینترفیس برای ورودی‌ها
interface ProposalsListProps {
    limit?: number; // اختیاری است
}

export function ProposalsList({ limit }: ProposalsListProps) {
    const { t } = useTranslation();
    const { proposals, isLoading, error } = useProposals();

    // تابع کمکی برای وضعیت
    const getStatusConfig = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'approved': return { icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10", label: t('proposal_detail.status.succeeded') };
            case 'rejected': return { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10", label: t('proposal_detail.status.defeated') };
            case 'voting': 
            case 'active': return { icon: PlayCircle, color: "text-blue-500", bg: "bg-blue-500/10", label: t('proposal_detail.status.active') };
            case 'executed': return { icon: CheckCircle, color: "text-purple-500", bg: "bg-purple-500/10", label: t('proposal_detail.status.executed') };
            default: return { icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10", label: t('proposal_detail.status.pending') };
        }
    };

    // ✅ اعمال محدودیت (Limit) روی داده‌ها
    const displayProposals = limit && proposals ? proposals.slice(0, limit) : proposals;

    if (isLoading) return <div className="flex justify-center p-4"><DaoLoadingSpinner /></div>;
    if (error) return <div className="text-red-500 text-center p-4">{t('common.error')}</div>;
    
    if (!displayProposals || displayProposals.length === 0) {
        return (
            <Card>
                <CardHeader><CardTitle>{t('sidebar.proposals')}</CardTitle></CardHeader>
                <CardContent className="text-center text-muted-foreground py-8">
                    {t('dashboard.no_proposals')}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t('sidebar.proposals')}</CardTitle>
                {/* اگر محدودیت اعمال شده، دکمه مشاهده همه را نشان بده */}
                {limit && (
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/proposals">
                            {t('dashboard.view_all')} <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                )}
            </CardHeader>
            <CardContent className="grid gap-4">
                {displayProposals.map((proposal: any) => {
                    const status = getStatusConfig(proposal.onChainStatus || 'pending');
                    const StatusIcon = status.icon;
                    
                    return (
                        <Link key={proposal._id} href={`/proposals/${proposal._id}`} className="block">
                            <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                                <div className="flex flex-col gap-1">
                                    <span className="font-semibold">{proposal.projectName}</span>
                                    <span className="text-sm text-muted-foreground line-clamp-1">{proposal.tagline}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Badge variant="outline" className={`${status.color} ${status.bg} border-0`}>
                                        <StatusIcon className="w-3 h-3 mr-1" />
                                        {status.label}
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