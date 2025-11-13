// src/components/dashboard/proposal-item.tsx (نسخه کامل و نهایی)
"use client";

import { useMemo, useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatNumber } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { useReadContract } from 'wagmi';
import { Skeleton } from "../ui/skeleton";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { rayanChainDaoAbi } from '@/lib/blockchain/generated';
import type { Address } from 'viem';
import { formatEther } from 'viem';
import { ProposalData } from './proposals-list';


interface ProposalItemProps {
    proposalData: ProposalData;
}

export function ProposalItem({ proposalData }: ProposalItemProps) {
    const { t, locale } = useTranslation();
    const { registryAddress } = useWeb3();
    const [offChainData, setOffChainData] = useState<OffChainData | null>(null);

    // 1. واکشی داده‌های On-chain
    const { data: onChainResult, isLoading: isOnChainLoading } = useReadContract({ /* ... (کد فعلی شما برای خواندن پروپوزال) ... */ });

    // 2. واکشی داده‌های Off-chain
    useEffect(() => {
        fetch(`/api/proposals/${proposalId}`)
            .then(res => res.json())
            .then(apiData => {
                if (apiData.success) setOffChainData(apiData.data);
            });
    }, [proposalId]);

    const onChainData = useMemo(() => { /* ... (کد فعلی شما برای پارس کردن onChainResult) ... */ }, [onChainResult]);

    const isLoading = isOnChainLoading || !offChainData; // منتظر هر دو منبع داده می‌مانیم

    if (isLoading) { return <Skeleton className="h-20 w-full mb-2" />; }
    if (!onChainData) { return null; }

    const statusInfo = /* ... */;
    const totalVotes = onChainData.forVotes + onChainData.againstVotes;
    const progress = totalVotes > 0n ? Number((onChainData.forVotes * 100n) / totalVotes) : 0;

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b">
            <div className="flex-1 mb-4 sm:mb-0">
                {/* ✅ FIX: نمایش عنوان از داده‌های آف‌چین */}
                <p className="font-medium font-headline text-lg">{offChainData.projectName}</p>
                <p className="text-sm text-muted-foreground">{offChainData.tagline}</p>
                
                <div className="flex items-center flex-wrap gap-4 mt-2">
                    <Badge variant={statusInfo.variant}>{t(`proposals_page.status.${statusInfo.key}`)}</Badge>
                    <div className="flex items-center gap-2 text-sm"><Progress value={progress} className="w-[100px]" /><span>{formatNumber(progress, locale)}% {t('proposals_page.for_votes')}</span></div>
                </div>
            </div>
            <Button asChild variant="outline" size="sm">
                <Link href={`/proposals/${proposalId.toString()}`}>
                    {t('proposals_page.view_details')} <ArrowRight className="ms-2 size-4" />
                </Link>
            </Button>
        </div>
    );
}