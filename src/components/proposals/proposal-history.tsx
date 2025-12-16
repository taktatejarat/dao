// src/components/proposals/proposal-history.tsx

"use client";

import { useProposalHistory } from "@/hooks/useProposalHistory";
import { useTranslation } from "@/hooks/use-translation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatLocaleDate } from "@/lib/utils";
import { 
    Clock, CheckCircle, XCircle, AlertTriangle, FileText, 
    Bot, RefreshCw, Activity 
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// ✅ دریافت آدرس پایه اکسپلورر از متغیر محیطی
const EXPLORER_URL = process.env.NEXT_PUBLIC_EXPLORER_URL || "https://amoy.polygonscan.com";

export function ProposalHistory({ proposalId }: { proposalId: string }) {
    const { history, isLoading } = useProposalHistory(proposalId);
    const { t, locale } = useTranslation();

    const getIcon = (type: string) => {
        switch (type) {
            case 'CREATED': return <FileText className="w-4 h-4 text-blue-500" />;
            case 'STATUS_CHANGE': return <RefreshCw className="w-4 h-4 text-purple-500" />;
            case 'VOTE': return <Activity className="w-4 h-4 text-gray-500" />;
            case 'AI_ANALYSIS': return <Bot className="w-4 h-4 text-emerald-500" />;
            case 'ERROR': return <AlertTriangle className="w-4 h-4 text-red-500" />;
            default: return <Clock className="w-4 h-4 text-gray-400" />;
        }
    };

    if (isLoading) return <Skeleton className="h-40 w-full" />;

    return (
        <Card className="mt-6">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Clock className="w-4 h-4" /> {t('proposal_detail.history_title')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative border-s border-muted ml-2 space-y-6">
                    {history.length === 0 ? (
                        <p className="text-xs text-muted-foreground ml-4">{t('common.no_data')}</p>
                    ) : (
                        history.map((event) => (
                            <div key={event.id} className="ml-4 relative group">
                                <div className="absolute -start-[21px] top-1 w-6 h-6 bg-background rounded-full border flex items-center justify-center group-hover:border-primary transition-colors">
                                    {getIcon(event.type)}
                                </div>
                                
                                <div className="flex flex-col gap-1">
                                    <div className="flex justify-between items-start">
                                        <p className="text-xs font-bold text-foreground">
                                            {t(event.titleKey) !== event.titleKey ? t(event.titleKey) : event.description}
                                        </p>
                                        <span className="text-[10px] text-muted-foreground">
                                            {formatLocaleDate(new Date(event.timestamp), locale)}
                                        </span>
                                    </div>
                                    
                                    {event.txHash && (
                                        <a 
                                            href={`${EXPLORER_URL}/tx/${event.txHash}`} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="text-[10px] text-blue-500 hover:underline font-mono"
                                        >
                                            {event.txHash.slice(0, 10)}...
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}