// src/app/staking/page.tsx - FIXED ICONS & UNIFIED DESIGN

"use client";

import { useEffect, useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/use-translation';
import { useWeb3 } from '@/context/Web3Provider'; 
import { formatEther } from 'viem';
import { formatNumber } from '@/lib/utils';
import { Wallet, PiggyBank, Award, Banknote, CheckCircle, Users, Vote, Coins, TrendingUp } from 'lucide-react'; 
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { StakingPlanCard } from '@/components/staking/staking-plan-card';
import { useSearchParams } from 'next/navigation';
import { daoRegistryAbi } from '@/lib/blockchain/generated';
import { REGISTRY_KEYS } from '@/lib/blockchain/registry-keys';
import { useStaking } from '@/hooks/useStaking';
import { useBuyTokens } from '@/hooks/useBuyTokens'; 
import type { Address } from 'viem';
import { toast } from 'sonner';
import { useReadContract } from 'wagmi';
import { StatCard } from '@/components/dashboard/stat-card';

export default function StakingPage() {
    const { t, locale } = useTranslation();
    const { registryAddress, isHydrated, userRole } = useWeb3();
    const searchParams = useSearchParams();

    const getTranslatedRoleName = () => {
        const safeRole = userRole || 'voter';
        return t(`role_selection.${safeRole}`);
    };
    const roleName = getTranslatedRoleName();   

    // --- Contract Addresses ---
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

    // --- Hooks ---
    const {
        rycBalance, stakedBalance, earnedRewards,
        stakeAmount, setStakeAmount,
        unstakeAmount, setUnstakeAmount,
        needsApproval, isActionPending: isStakingActionPending,
        handleApprove, handleStake, handleUnstake, handleClaim,
        currentDelegatee, delegateeAddress, setDelegateeAddress,
        handleDelegate, handleUndelegate,
        isDelegateButtonDisabled, isUndelegateButtonDisabled,
        isStakeButtonDisabled, isClaimButtonDisabled, isApproveButtonDisabled, isUnstakeButtonDisabled, 
        refetch: refetchStakingData
    } = useStaking({ tokenAddress, stakingAddress });

    const {
        buyAmount, setBuyAmount,
        handleBuyTokens,
        isBuyActionPending,
        isBuyConfirmed,
        estimatedRycReceived,
        isEstimatingPrice,
        resetBuyState
    } = useBuyTokens({ tokenAddress });

    useEffect(() => {
        if (isBuyConfirmed) {
            toast.success(t('staking_page.buy_success_title'), { description: t('staking_page.buy_success_desc') });
            refetchStakingData();
            resetBuyState();
        }
    }, [isBuyConfirmed, refetchStakingData, resetBuyState, t]);
    
    useEffect(() => {
        const amountFromUrl = searchParams.get('amount');
        if (amountFromUrl) setStakeAmount(amountFromUrl);
    }, [searchParams, setStakeAmount]);

    // --- Plans ---
    const allPlans = useMemo(() => [
        { 
            roles: ['voter'], 
            title: t('staking_page.plan_voter_title'), 
            tier: "bronze" as const, 
            price: "1000000", 
            features: [t('voter_feat1'), t('voter_feat2')],
            description: t('staking_page.plan_voter_desc'),
        },
        { 
            roles: ['startup', 'investor'], 
            title: t('staking_page.plan_startup_title'), 
            tier: "silver" as const, 
            price: "50000000", 
            features: [t('staking_page.startup_feat1'), t('staking_page.startup_feat2')],
            isFeatured: userRole === 'startup',
            description: t('staking_page.plan_startup_desc'),
        },
        { 
            roles: ['delegate', 'investor'], 
            title: t('staking_page.plan_delegate_title'), 
            tier: "gold" as const, 
            price: "200000000", 
            features: [t('delegate_feat1'), t('delegate_feat2')],
            isFeatured: userRole === 'delegate',
            description: t('staking_page.plan_delegate_desc'),
        },
    ], [t, userRole]);

    const filteredPlans = useMemo(() => {
        if (userRole === 'admin') return allPlans;
        const currentRole = userRole || 'voter';
        return allPlans.filter(plan => plan.roles.includes(currentRole as any));
    }, [allPlans, userRole]);

   const isLoading = isTokenAddrLoading || isStakingAddrLoading || (!!tokenAddress && !!stakingAddress && (rycBalance === undefined || stakedBalance === undefined || earnedRewards === undefined));

    return (
        <AppLayout>
            <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h1 className="text-3xl font-bold font-headline text-gradient">{t('staking_page.title')}</h1>
                    <p className="text-muted-foreground">{t('staking_page.subtitle_for_role')} {roleName}</p>
                </div>
            </header>

            {/* Section 1: Overview Stats (StatCard) */}
            <div className="grid gap-6 grid-cols-1 md:grid-cols-3 mb-10">
                <StatCard title={t('staking_page.ryc_balance')} value={`${formatNumber(formatEther(rycBalance ?? 0n), locale)} RYC`} icon={Wallet} description={t('staking_page.card_label_balance')} isLoading={isLoading} />
                <StatCard title={t('staking_page.staked_balance')} value={`${formatNumber(formatEther(stakedBalance ?? 0n), locale)} RYC`} icon={PiggyBank} description={t('staking_page.card_label_staked')} variant="default" isLoading={isLoading} />
                <StatCard title={t('staking_page.earned_rewards')} value={`${formatNumber(formatEther(earnedRewards ?? 0n), locale)} RYC`} icon={Award} description={t('staking_page.card_label_earned')} variant="positive" isLoading={isLoading} />
            </div>
            
            {/* Section 2: Actions Grid (Interactive Cards with Background Icons) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                
                {/* 1. Buy RYC */}
                <Card className="flex flex-col h-full hover:shadow-lg transition-all duration-300 relative overflow-hidden group border-primary/20">
                    {/* ✅ Background Icon */}
                    <div className="absolute -top-4 -right-4 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 pointer-events-none">
                        <Coins className="w-40 h-40" />
                    </div>
                    
                    <CardHeader className="relative z-10">
                        <CardTitle className="flex items-center gap-3 text-primary text-xl">
                            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                <Coins className="w-6 h-6" />
                            </div>
                            {t('staking_page.buy_ryc_title')}
                        </CardTitle>
                        <CardDescription className="text-base">{t('staking_page.buy_ryc_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-6 relative z-10">
                        <div className="space-y-3">
                            <Label className="text-base">{t('staking_page.amount_of_matic_to_spend')}</Label>
                            <Input type="number" placeholder="0.1" value={buyAmount} onChange={(e) => setBuyAmount(e.target.value)} className="h-12 text-lg" />
                        </div>
                        <div className="text-lg text-muted-foreground p-4 bg-muted/50 rounded-lg border border-border/50 text-center flex items-center justify-center min-h-[3.5rem]">
                            {isEstimatingPrice ? <DaoLoadingSpinner className="h-5 w-5" /> : <span>{t('staking_page.you_will_receive')}: <strong className="text-foreground text-lg ml-2">{formatNumber(estimatedRycReceived, locale)}</strong> RYC</span>}
                        </div>
                        <Button className="w-full h-12 text-lg mt-auto" disabled={isBuyActionPending || isEstimatingPrice} onClick={handleBuyTokens}>
                            {isBuyActionPending ? <DaoLoadingSpinner /> : t('staking_page.buy_ryc_cta')}
                        </Button>
                    </CardContent>
                </Card>

                {/* 2. Stake Tokens */}
                <Card className="flex flex-col h-full hover:shadow-lg transition-all duration-300 relative overflow-hidden group border-primary/20 bg-primary/5">
                    {/* ✅ Background Icon */}
                    <div className="absolute -top-4 -right-4 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 pointer-events-none">
                        <TrendingUp className="w-40 h-40" />
                    </div>

                    <CardHeader className="relative z-10">
                        <CardTitle className="flex items-center gap-3 text-primary text-xl">
                            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            {t('staking_page.stake_tokens_title')}
                        </CardTitle>
                        <CardDescription className="text-base">{t('staking_page.stake_tokens_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-6 relative z-10">
                        <div className="space-y-3">
                            <Label className="text-base">{t('staking_page.amount_to_stake')}</Label>
                            <Input type="number" placeholder="0.0" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} className="h-12 text-lg bg-background/80" />
                        </div>
                        <div className="flex-1" />
                        {needsApproval ? (
                            <Button className="w-full h-12 text-lg mt-auto" disabled={isBuyActionPending || isApproveButtonDisabled} onClick={handleApprove}>
                                {isStakingActionPending ? <DaoLoadingSpinner /> : t('staking_page.approve_button')}
                            </Button>
                        ) : (
                            <Button className="w-full h-12 text-lg mt-auto" disabled={isBuyActionPending || isStakeButtonDisabled} onClick={handleStake}>
                                {isStakingActionPending ? <DaoLoadingSpinner /> : t('staking_page.stake')}
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* 3. Manage Stake */}
                <Card className="flex flex-col h-full hover:shadow-lg transition-all duration-300 relative overflow-hidden group border-border">
                    {/* ✅ Background Icon */}
                    <div className="absolute -top-4 -right-4 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 pointer-events-none">
                        <Banknote className="w-40 h-40" />
                    </div>

                    <CardHeader className="relative z-10">
                        <CardTitle className="flex items-center gap-3 text-foreground text-xl">
                            <div className="p-2 bg-muted rounded-lg group-hover:bg-muted/80 transition-colors">
                                <Banknote className="w-6 h-6" />
                            </div>
                            {t('staking_page.manage_stake_title')}
                        </CardTitle>
                        <CardDescription className="text-base">{t('staking_page.manage_stake_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-8 relative z-10">
                        <div className="space-y-3">
                            <Label className="text-base">{t('staking_page.amount_to_unstake')}</Label>
                            <div className="flex gap-2">
                                <Input className="flex-grow h-12 text-lg" type="number" placeholder="0.0" value={unstakeAmount} onChange={(e) => setUnstakeAmount(e.target.value)} />
                                <Button variant="outline" className="h-12 px-6" disabled={isUnstakeButtonDisabled} onClick={handleUnstake}>
                                    {isStakingActionPending ? <DaoLoadingSpinner /> : t('staking_page.unstake')}
                                </Button>
                            </div>
                        </div>
                        
                        <div className="mt-auto pt-6 border-t">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-base text-muted-foreground">{t('staking_page.unclaimed_rewards')}:</span>
                                <span className="text-xl font-bold text-green-600">{formatNumber(formatEther(earnedRewards ?? 0n), locale)} RYC</span>
                            </div>
                            <Button className="w-full h-12 text-lg bg-green-600 hover:bg-green-700 text-white" disabled={isClaimButtonDisabled} onClick={handleClaim}>
                                {isStakingActionPending ? <DaoLoadingSpinner /> : <Award className="me-2 h-5 w-5"/>}
                                {t('staking_page.claim_rewards')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Plans Section */}
            <div className="text-center mb-10 pt-8 border-t">
                <h2 className="text-2xl font-semibold font-headline text-gradient">{t('staking_page.plans_for_role')} {roleName}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPlans.map((plan) => (
                    <StakingPlanCard key={plan.title} tier={plan.tier} price={formatNumber(plan.price, locale)} title={plan.title} description={plan.description} features={plan.features} isFeatured={plan.isFeatured} onSelect={() => { setStakeAmount(plan.price); window.scrollTo({ top: 0, behavior: 'smooth' }); toast.info(t('staking_page.plan_selected_toast')); }} />
                ))}
            </div>
        </AppLayout>
    );
}