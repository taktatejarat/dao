"use client";

import { useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/context/LanguageProvider";
import { formatNumber } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { useReadContract } from 'wagmi';
import { Skeleton } from "../ui/skeleton";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { rayanChainDaoAbi } from '@/lib/blockchain/generated';
import type { Address } from 'viem';

interface ProposalItemProps {
    proposalId: bigint;
    daoAddress: Address | undefined; // ✅ آدرس از طریق props دریافت می‌شود
}

export function ProposalItem({ proposalId, daoAddress }: ProposalItemProps) {
    const { locale } = useLanguage();
    const { t } = useTranslation();

    const { data: proposalResult, isLoading } = useReadContract({
        address: daoAddress, // ✅ استفاده از آدرس props
        abi: rayanChainDaoAbi,
        functionName: 'proposals',
        args: [proposalId],
        query: {
            enabled: !!daoAddress, // فقط زمانی اجرا شود که آدرس موجود باشد
        }
    });

    // ✅ پارس کردن ایمن و خوانای داده‌ها
    const proposal = useMemo(() => {
        if (!proposalResult || typeof proposalResult !== 'object' || !('id' in proposalResult)) {
            return null;
        }
        const p = proposalResult as any;
        return {
            description: p.description as string,
            state: p.state as bigint,
            forVotes: p.forVotes as bigint,
            againstVotes: p.againstVotes as bigint,
        };
    }, [proposalResult]);

    const getStatusInfo = (state: bigint | undefined): { key: string; variant: "default" | "success" | "destructive" } => {
        switch (state) {
            case 0n: return { key: 'pending', variant: 'default' };
            case 1n: return { key: 'active', variant: 'default' };
            case 2n: return { key: 'voting', variant: 'default' };
            case 3n: return { key: 'approved', variant: 'success' };
            case 4n: return { key: 'rejected', variant: 'destructive' };
            case 5n: return { key: 'executed', variant: 'success' };
            default: return { key: 'unknown', variant: 'default' };
        }
    };
    
    if (isLoading) {
        return (
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-10 w-28" />
            </div>
        )
    }
    
    if (!proposal) {
        return null; // یا یک پیام خطا
    }

    const statusInfo = getStatusInfo(proposal.state);
    const totalVotes = proposal.forVotes + proposal.againstVotes;
    const progress = totalVotes > 0n ? Number((proposal.forVotes * 100n) / totalVotes) : 0;

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors">
            <div className="flex-1 mb-4 sm:mb-0">
                <p className="font-medium font-headline">{proposal.description}</p>
                <div className="flex items-center flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                    <Badge variant={statusInfo.variant}>{t(`proposals_page.${statusInfo.key}`)}</Badge>
                    <div className="flex items-center gap-2">
                        <Progress value={progress} className="w-[100px]" />
                        <span>{formatNumber(progress, locale)}%</span>
                    </div>
                </div>
            </div>
            <Button asChild variant="outline" size="sm">
                <Link href={`/proposals/${proposalId.toString()}`}>
                    {t('view_details')}
                    <ArrowRight className="me-2 rtl:rotate-180 size-4" />
                </Link>
            </Button>
        </div>
    );
}