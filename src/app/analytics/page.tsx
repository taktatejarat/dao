"use client";

import { useMemo } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useWeb3 } from '@/context/Web3Provider';
import { useReadContract } from 'wagmi';
import { daoRegistryAbi, rayanChainDaoAbi, financeAbi } from '@/lib/blockchain/generated';
import { REGISTRY_KEYS } from '@/lib/blockchain/registry-keys';
import type { Address } from 'viem';
import { useTranslation } from '@/hooks/use-translation';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber } from '@/lib/utils';
import { formatEther } from 'viem';
import { Users, FileText, Landmark } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { StatCard } from '@/components/dashboard/stat-card';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export default function AnalyticsPage() {
    const { t, locale } = useTranslation();
    const { registryAddress, isHydrated } = useWeb3();

    // --- Fetch required contract addresses ---
    const { data: daoAddressResult, isLoading: isDaoAddrLoading } = useReadContract({
        address: registryAddress as Address,
        abi: daoRegistryAbi,
        functionName: 'getAddress',
        args: [REGISTRY_KEYS.DAO] as const,
        query: { enabled: !!registryAddress && isHydrated },
    });
    const { data: financeAddressResult, isLoading: isFinanceAddrLoading } = useReadContract({
        address: registryAddress as Address,
        abi: daoRegistryAbi,
        functionName: 'getAddress',
        args: [REGISTRY_KEYS.FINANCE] as const,
        query: { enabled: !!registryAddress && isHydrated },
    });
    const daoAddress = daoAddressResult as Address | undefined;
    const financeAddress = financeAddressResult as Address | undefined;

    // --- Fetch analytics data from the relevant contracts ---
    const { data: proposalCountResult, isLoading: isProposalCountLoading } = useReadContract({
        address: daoAddress,
        abi: rayanChainDaoAbi,
        functionName: 'nextProposalId',
        query: { enabled: !!daoAddress },
    });
    const proposalCount = proposalCountResult as bigint | undefined;
    const { data: daoOwnerResult, isLoading: isDaoOwnerLoading } = useReadContract({
        address: daoAddress,
        abi: rayanChainDaoAbi,
        functionName: 'owner',
        query: { enabled: !!daoAddress },
    });
    const { data: financeOwnerResult, isLoading: isFinanceOwnerLoading } = useReadContract({
        address: financeAddress,
        abi: financeAbi,
        functionName: 'owner',
        query: { enabled: !!financeAddress },
    });

    const isLoading = isDaoAddrLoading || isFinanceAddrLoading || isProposalCountLoading || isDaoOwnerLoading || isFinanceOwnerLoading;
    
    return (
        <div className="space-y-6">
            <header className="mb-6">
                <h1 className="text-3xl font-bold font-headline">{t('analytics_page.title')}</h1>
                <p className="text-muted-foreground">{t('analytics_page.subtitle')}</p>
            </header>
            <Card className="border-l-4 border-secondary rtl:border-r-4 rtl:border-l-0">
                <CardHeader>
                    <CardTitle className="font-headline">{t('analytics_page.card_title')}</CardTitle>
                    <CardDescription>
                        {t('analytics_page.card_desc')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="w-full sm:w-1/3 space-y-2">
                           <Label htmlFor="proposal-select">{t('analytics_page.select_proposal')}</Label>
                            <Select onValueChange={() => {}} value={undefined} disabled={isLoading}>
                                <SelectTrigger id="proposal-select">
                                    <SelectValue placeholder={t('analytics_page.select_placeholder')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: proposalCount ? Number(proposalCount) : 0 }, (_, i) => (
                                        <SelectItem key={i} value={i.toString()}>
                                            {t('analytics_page.proposal')} #{formatNumber(i + 1, locale)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={() => {}} disabled={isLoading}>
                            {isLoading && <DaoLoadingSpinner className="mx-2" />}
                            {t('analytics_page.start_analysis')}
                        </Button>
                    </div>

                    {/* Intentionally left out generic Error block; wire specific error states if needed */}

                    {isLoading && (
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36" />)}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

    
