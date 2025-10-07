"use client";

import { useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/use-translation';
import { useWeb3 } from '@/context/Web3Provider';
import { useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { formatNumber } from '@/lib/utils';
import { Wallet, PiggyBank, Award, Banknote, CheckCircle } from 'lucide-react';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { Skeleton } from '@/components/ui/skeleton';
import { StakingPlanCard } from '@/components/staking/staking-plan-card';
import { useSearchParams } from 'next/navigation';
import { daoRegistryAbi } from '@/lib/blockchain/generated';
import { REGISTRY_KEYS } from '@/lib/blockchain/registry-keys';
import { useStaking } from '@/hooks/useStaking';
import type { Address } from 'viem';

export default function StakingPage() {
    const { t, locale } = useTranslation();
    const { registryAddress, isHydrated } = useWeb3();
    const searchParams = useSearchParams();

    // --- Fetch required contract addresses from the registry ---
    const { data: tokenAddressResult, isLoading: isTokenAddrLoading } = useReadContract({
        address: registryAddress as Address,
        abi: daoRegistryAbi,
        functionName: 'getAddress',
        args: [REGISTRY_KEYS.TOKEN] as const,
        query: { enabled: !!registryAddress && isHydrated },
    });
    const { data: stakingAddressResult, isLoading: isStakingAddrLoading } = useReadContract({
        address: registryAddress as Address,
        abi: daoRegistryAbi,
        functionName: 'getAddress',
        args: [REGISTRY_KEYS.STAKING] as const,
        query: { enabled: !!registryAddress && isHydrated },
    });
    const tokenAddress = tokenAddressResult as Address | undefined;
    const stakingAddress = stakingAddressResult as Address | undefined;

    // --- Use the master custom hook for all staking logic ---
    const {
        rycBalance, stakedBalance, earnedRewards,
        stakeAmount, setStakeAmount,
        unstakeAmount, setUnstakeAmount,
        needsApproval, isActionPending,
        handleApprove, handleStake, handleUnstake, handleClaim,
        isStakeButtonDisabled, isUnstakeButtonDisabled, isClaimButtonDisabled
    } = useStaking({ tokenAddress, stakingAddress });
    
    useEffect(() => {
        const amountFromUrl = searchParams.get('amount');
        if (amountFromUrl) {
            setStakeAmount(amountFromUrl);
        }
    }, [searchParams, setStakeAmount]);

    const investorPlans = [
        {
            title: t('role_selection.plan_bronze_title'),
            tier: "bronze" as const,
            description: t('role_selection.plan_bronze_desc'),
            price: "10000000",
            features: [
                t('role_selection.plan_bronze_feat1'), 
                t('role_selection.plan_bronze_feat2'), 
                t('role_selection.plan_bronze_feat3')
            ]
        },
        {
            title: t('role_selection.plan_silver_title'),
            tier: "silver" as const,
            description: t('role_selection.plan_silver_desc'),
            price: "50000000",
            features: [
                t('role_selection.plan_silver_feat1'),
                t('role_selection.plan_silver_feat2'),
                t('role_selection.plan_silver_feat3'),
                t('role_selection.plan_silver_feat4'),
            ],
            isFeatured: true,
        },
        {
            title: t('role_selection.plan_gold_title'),
            tier: "gold" as const,
            description: t('role_selection.plan_gold_desc'),
            price: "200000000",
            features: [
                t('role_selection.plan_gold_feat1'),
                t('role_selection.plan_gold_feat2'),
                t('role_selection.plan_gold_feat3'),
                t('role_selection.plan_gold_feat4'),
            ]
        }
    ];

    const isLoading = isTokenAddrLoading || isStakingAddrLoading || (!!tokenAddress && !!stakingAddress && (rycBalance === undefined || stakedBalance === undefined || earnedRewards === undefined));

    return (
        <AppLayout>
            <header className="mb-6">
                <h1 className="text-3xl font-bold font-headline">{t('staking_page.title')}</h1>
                <p className="text-muted-foreground">{t('staking_page.subtitle')}</p>
            </header>

             <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                <Card>
                    <CardHeader className="flex-row items-center gap-3 space-y-0 pb-2"><Wallet className="w-6 h-6 text-primary"/><CardTitle className="text-lg">{t('staking_page.ryc_balance')}</CardTitle></CardHeader>
                    <CardContent>{isLoading ? <Skeleton className="h-8 w-3/4" /> : <p className="text-3xl font-bold">{formatNumber(formatEther(rycBalance ?? 0n), locale)}</p>}<p className="text-sm text-muted-foreground">RYC</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex-row items-center gap-3 space-y-0 pb-2"><PiggyBank className="w-6 h-6 text-secondary"/><CardTitle className="text-lg">{t('staking_page.staked_balance')}</CardTitle></CardHeader>
                    <CardContent>{isLoading ? <Skeleton className="h-8 w-3/4" /> : <p className="text-3xl font-bold">{formatNumber(formatEther(stakedBalance ?? 0n), locale)}</p>}<p className="text-sm text-muted-foreground">RYC</p></CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex-row items-center gap-3 space-y-0 pb-2"><Award className="w-6 h-6 text-accent"/><CardTitle className="text-lg">{t('staking_page.earned_rewards')}</CardTitle></CardHeader>
                    <CardContent>{isLoading ? <Skeleton className="h-8 w-3/4" /> : <p className="text-3xl font-bold">{formatNumber(formatEther(earnedRewards ?? 0n), locale)}</p>}<p className="text-sm text-muted-foreground">RYC</p></CardContent>
                </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <Card>
                    <CardHeader><CardTitle>{t('staking_page.stake_tokens_title')}</CardTitle><CardDescription>{t('staking_page.stake_tokens_desc')}</CardDescription></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2"><Label htmlFor="stake-amount">{t('staking_page.amount_to_stake')}</Label><Input id="stake-amount" type="number" placeholder="0.0" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} /></div>
                        {needsApproval ? (
                             <Button className="w-full" disabled={isActionPending || isStakeButtonDisabled} onClick={handleApprove}>
                                 {isActionPending ? <DaoLoadingSpinner /> : <CheckCircle className="me-2"/>}
                                 {t('staking_page.approve_button')}
                             </Button>
                        ) : (
                             <Button className="w-full" disabled={isActionPending || isStakeButtonDisabled} onClick={handleStake}>
                                 {isActionPending ? <DaoLoadingSpinner /> : <PiggyBank className="me-2"/>}
                                 {t('staking_page.stake')}
                             </Button>
                        )}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>{t('staking_page.unstake_tokens_title')}</CardTitle><CardDescription>{t('staking_page.unstake_tokens_desc')}</CardDescription></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2"><Label htmlFor="unstake-amount">{t('staking_page.amount_to_unstake')}</Label><Input id="unstake-amount" type="number" placeholder="0.0" value={unstakeAmount} onChange={(e) => setUnstakeAmount(e.target.value)} /></div>
                         <Button variant="outline" className="w-full" disabled={isUnstakeButtonDisabled} onClick={handleUnstake}>
                            {isActionPending ? <DaoLoadingSpinner /> : <Banknote className="me-2"/>} {t('staking_page.unstake')}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Card className="mb-8">
                <CardHeader><CardTitle>{t('staking_page.claim_rewards_title')}</CardTitle><CardDescription>{t('staking_page.claim_rewards_desc')}</CardDescription></CardHeader>
                <CardContent>
                    <Button className="w-full md:w-auto" disabled={isClaimButtonDisabled} onClick={handleClaim}>
                         {isActionPending ? <DaoLoadingSpinner /> : <Award className="me-2"/>} {t('staking_page.claim_rewards')}
                    </Button>
                </CardContent>
            </Card>

             <div className="text-center mb-8"><h2 className="text-2xl font-semibold font-headline">{t('staking_page.staking_plans_title')}</h2><p className="text-muted-foreground mt-1">{t('staking_page.staking_plans_desc')}</p></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {investorPlans.map((plan) => (
                   <StakingPlanCard key={plan.title} tier={plan.tier} price={formatNumber(plan.price, locale)} title={plan.title} description={plan.description} features={plan.features} isFeatured={plan.isFeatured} onSelect={() => setStakeAmount(plan.price)} />
               ))}
            </div>

        </AppLayout>
    );
}