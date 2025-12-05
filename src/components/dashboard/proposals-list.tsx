// src/components/dashboard/proposals-list.tsx

"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; 
import { useTranslation } from "@/hooks/use-translation";
import { DaoLoadingSpinner } from "../icons/dao-loading-spinner";
import { useProposals } from "@/hooks/useProposals"; 
import { ArrowRight, CheckCircle, Clock, PlayCircle, XCircle, AlertCircle, SearchX } from "lucide-react";
import { Badge } from "@/components/ui/badge"; 
import Link from "next/link"; 
import { useSearchParams } from "next/navigation"; // ✅ اضافه شد
import { useMemo } from "react";

export interface ProposalSummary {
    _id: string;
    proposalIdOnChain?: string;
    projectName: string;
    tagline: string;
    onChainStatus: string;
}

interface ProposalsListProps {
    limit?: number;
    data?: ProposalSummary[]; 
    isLoading?: boolean;      
    emptyMessage?: string;    
}

export function ProposalsList({ limit, data, isLoading: parentLoading, emptyMessage }: ProposalsListProps) {
    const { t } = useTranslation();
    const searchParams = useSearchParams(); // ✅ دریافت پارامترهای URL
    const searchQuery = searchParams.get('q')?.toLowerCase() || '';

    const { proposals: fetchedData, isLoading: isFetchLoading } = useProposals();
    
    const sourceData = data || fetchedData;
    const isLoading = parentLoading !== undefined ? parentLoading : isFetchLoading;

    // ✅ منطق فیلترینگ
    const filteredProposals = useMemo(() => {
        if (!sourceData) return [];
        if (!searchQuery) return sourceData;

        return sourceData.filter((p: any) => 
            p.projectName.toLowerCase().includes(searchQuery) || 
            p.tagline.toLowerCase().includes(searchQuery) ||
            p.proposalIdOnChain?.toString() === searchQuery
        );
    }, [sourceData, searchQuery]);

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

    const displayProposals = limit ? filteredProposals.slice(0, limit) : filteredProposals;

    if (isLoading) return <div className="flex justify-center p-4"><DaoLoadingSpinner /></div>;
    
    if (!displayProposals || displayProposals.length === 0) {
        return (
            <Card>
                <CardHeader><CardTitle>{t('sidebar.proposals')}</CardTitle></CardHeader>
                <CardContent className="text-center text-muted-foreground py-8 flex flex-col items-center gap-2">
                    {searchQuery ? (
                        <>
                            <SearchX className="h-8 w-8 opacity-50" />
                            <p>{t('common.no_results_for')} "{searchQuery}"</p>
                            <Button variant="link" asChild className="mt-2">
                                <Link href="/proposals">{t('common.clear_search')}</Link>
                            </Button>
                        </>
                    ) : (
                        <>
                            <AlertCircle className="h-8 w-8 opacity-50" />
                            <p>{emptyMessage || t('dashboard.no_proposals')}</p>
                        </>
                    )}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full border-none shadow-none bg-transparent">
            {!limit && (
                <CardHeader className="px-0 pt-0 pb-4">
                   {searchQuery && (
                       <div className="flex items-center justify-between bg-muted/30 p-2 rounded-lg">
                           <span className="text-sm text-muted-foreground">
                               {t('common.search_results')}: <strong>{filteredProposals.length}</strong>
                           </span>
                           <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
                               <Link href="/proposals">{t('common.clear_search')}</Link>
                           </Button>
                       </div>
                   )}
                </CardHeader>
            )}
            <CardContent className="grid gap-3 px-0">
                {displayProposals.map((proposal: any) => {
                    const status = getStatusConfig(proposal.onChainStatus || proposal.status);
                    const StatusIcon = status.icon;
                    const linkId = proposal.proposalIdOnChain || proposal._id;
                    
                    return (
                        <Link key={proposal._id} href={`/proposals/${linkId}`} className="group block">
                            <div className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent/50 hover:border-primary/30 hover:shadow-md transition-all duration-300">
                                <div className="flex flex-col gap-1 min-w-0">
                                    <span className="font-bold text-base truncate group-hover:text-primary transition-colors">
                                        {proposal.projectName}
                                    </span>
                                    <span className="text-sm text-muted-foreground truncate max-w-[300px] sm:max-w-md">
                                        {proposal.tagline}
                                    </span>
                                </div>
                                <div className="flex items-center shrink-0 gap-4">
                                    {/* برای دسکتاپ، آی‌دی را هم نشان بده */}
                                    <span className="hidden sm:inline-block text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                                        ID: {proposal.proposalIdOnChain || "?"}
                                    </span>
                                    <Badge variant="outline" className={`${status.color} ${status.bg} border-0 px-3 py-1 h-7 flex items-center gap-1.5`}>
                                        <StatusIcon className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline font-medium">{status.label}</span>
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