// src/app/staking/page.tsx - FINAL, CLEANED, AND CORRECTED VERSION

"use client";

import { useEffect, useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/use-translation';
import { useWeb3, UserRole } from '@/context/Web3Provider'; 
import { formatEther, BaseError } from 'viem';
import { formatNumber } from '@/lib/utils';
import { Wallet, PiggyBank, Award, Banknote, CheckCircle, Users, Vote } from 'lucide-react'; 
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { Skeleton } from '@/components/ui/skeleton';
import { StakingPlanCard } from '@/components/staking/staking-plan-card';
import { useSearchParams } from 'next/navigation';
import { daoRegistryAbi } from '@/lib/blockchain/generated';
import { REGISTRY_KEYS } from '@/lib/blockchain/registry-keys';
import { useStaking } from '@/hooks/useStaking';
import { useBuyTokens } from '@/hooks/useBuyTokens'; 
import type { Address } from 'viem';
import { toast } from 'sonner';
import { useReadContract } from 'wagmi';
import { AddToWalletButton } from '@/components/common/add-to-wallet-button';

export default function StakingPage() {
    const { t, locale } = useTranslation();
    const { registryAddress, isHydrated } = useWeb3();
    const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') as UserRole : 'voter';
    const searchParams = useSearchParams();

    const getTranslatedRoleName = (role: UserRole | null | string) => {
        const safeRole = role || 'voter';
        return t(`role_selection.${safeRole}`);
    };
    const roleName = getTranslatedRoleName(userRole);    

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

    // ✅ FIX: دریافت صحیح refetch از useStaking و نام‌گذاری مجدد برای خوانایی
    const {
        rycBalance, stakedBalance, earnedRewards,
        stakeAmount, setStakeAmount,
        unstakeAmount, setUnstakeAmount,
        needsApproval, isActionPending: isStakingActionPending,
        handleApprove, handleStake, handleUnstake, handleClaim,
        currentDelegatee, delegateeAddress, setDelegateeAddress,
        handleDelegate, handleUndelegate,
        isDelegateButtonDisabled, isUndelegateButtonDisabled,
        isStakeButtonDisabled, isUnstakeButtonDisabled, isClaimButtonDisabled,
        refetch: refetchStakingData // <-- اطمینان از دریافت این تابع
    } = useStaking({ tokenAddress, stakingAddress });

    // ✅ FIX: دریافت مقادیر کامل از هوک useBuyTokens
    const {
        buyAmount, setBuyAmount,
        handleBuyTokens,
        isBuyActionPending,
        isBuyConfirmed,
        estimatedRycReceived,
        isEstimatingPrice,
    } = useBuyTokens({ tokenAddress });

    // این useEffect اکنون به درستی کار خواهد کرد و موجودی‌ها را به‌روز می‌کند
    useEffect(() => {
        if (isBuyConfirmed) {
            toast.success("Tokens purchased successfully! Updating balances...");
            refetchStakingData();
        }
    }, [isBuyConfirmed, refetchStakingData]);


    
    useEffect(() => {
        const amountFromUrl = searchParams.get('amount');
        if (amountFromUrl) {
            setStakeAmount(amountFromUrl);
        }
    }, [searchParams, setStakeAmount]);

  // --- Dynamic Staking Plans Logic ---
    const allPlans = useMemo(() => [
        { // Base Voter Plan
            roles: ['voter'], 
            title: t('staking_page.plan_voter_title'), 
            tier: "bronze" as const, 
            price: "1000000", 
            features: [t('voter_feat1'), t('voter_feat2')],
            // ✅ FIX 3: Added missing description field
            description: t('staking_page.plan_voter_desc'),
        },
        { // Startup / Base Investor Plan
            roles: ['startup', 'investor'], 
            title: t('staking_page.plan_startup_title'), 
            tier: "silver" as const, 
            price: "50000000", 
            features: [t('staking_page.startup_feat1'), t('staking_page.startup_feat2')],
            isFeatured: userRole === 'startup',
            // ✅ FIX 3: Added missing description field
            description: t('staking_page.plan_startup_desc'),
        },
        { // Delegate Plan (High Commitment)
            roles: ['delegate', 'investor'], 
            title: t('staking_page.plan_delegate_title'), 
            tier: "gold" as const, 
            price: "200000000", 
            features: [t('delegate_feat1'), t('delegate_feat2')],
            isFeatured: userRole === 'delegate',
            // ✅ FIX 3: Added missing description field
            description: t('staking_page.plan_delegate_desc'),
        },
    ], [t, userRole]);


    const filteredPlans = useMemo(() => {
        // Show all plans if admin (for management), otherwise show plans relevant to the role
        if (userRole === 'admin') return allPlans;
        
        // Filter by the user's current selected role. Handles 'null' role by showing voter plans.
        const currentRole = userRole === null ? 'voter' : userRole;
        return allPlans.filter(plan => plan.roles.includes(currentRole as any));
    }, [allPlans, userRole]);

   const isLoading = isTokenAddrLoading || isStakingAddrLoading || (!!tokenAddress && !!stakingAddress && (rycBalance === undefined || stakedBalance === undefined || earnedRewards === undefined));

    return (
        <AppLayout>
            {/* --- HEADER --- */}
            <header className="mb-8">
                <h1 className="text-3xl font-bold font-headline">{t('staking_page.title')}</h1>
                <p className="text-muted-foreground">{t('staking_page.subtitle_for_role')} {roleName}</p>
            </header>

            {/* --- BALANCE CARDS (UNTOUCHED - LOGIC IS GOOD) --- */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                <Card>
                    <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg font-medium">{t('staking_page.ryc_balance')}</CardTitle>
                        <Wallet className="w-6 h-6 text-primary"/>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-3xl font-bold">{formatNumber(formatEther(rycBalance ?? 0n), locale)}</div>}
                        <p className="text-sm text-muted-foreground">RYC</p>
                        {tokenAddress && (
                            <div className="mt-4">
                                <AddToWalletButton tokenAddress={tokenAddress} tokenSymbol="RYC" tokenDecimals={18} />
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg font-medium">{t('staking_page.staked_balance')}</CardTitle>
                        <PiggyBank className="w-6 h-6 text-secondary"/>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-3xl font-bold">{formatNumber(formatEther(stakedBalance ?? 0n), locale)}</div>}
                        <p className="text-sm text-muted-foreground">RYC Staked</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg font-medium">{t('staking_page.earned_rewards')}</CardTitle>
                        <Award className="w-6 h-6 text-accent"/>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-3xl font-bold">{formatNumber(formatEther(earnedRewards ?? 0n), locale)}</div>}
                        <p className="text-sm text-muted-foreground">RYC Earned</p>
                    </CardContent>
                </Card>
            </div>
            
            {/* --- ACTION CARDS - RESTRUCTURED FOR LOGICAL FLOW --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                
                {/* --- LEFT COLUMN: ONBOARDING ACTIONS (BUY & STAKE) --- */}
                <div className="space-y-8">
                    {/* 1. Buy RYC Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('staking_page.buy_ryc_title')}</CardTitle>
                            <CardDescription>{t('staking_page.buy_ryc_desc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="buy-amount">{t('staking_page.amount_of_matic_to_spend')}</Label>
                                <Input id="buy-amount" type="number" placeholder="0.1" value={buyAmount} onChange={(e) => setBuyAmount(e.target.value)} />
                            </div>
                            {/* ✅ NEW: Preview of received tokens */}
                            <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md text-center">
                                {isEstimatingPrice ? (
                                    <DaoLoadingSpinner className="mx-auto" />
                                ) : (
                                    <span>
                                        {t('staking_page.you_will_receive')}{' '}
                                        <strong className="text-primary">{formatNumber(estimatedRycReceived, locale)}</strong> RYC
                                    </span>
                                )}
                            </div>
                            <Button className="w-full" disabled={isBuyActionPending || isEstimatingPrice} onClick={handleBuyTokens}>
                                {isBuyActionPending ? <DaoLoadingSpinner /> : <Wallet className="me-2"/>}
                                {t('staking_page.buy_ryc_cta')}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* 2. Stake Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('staking_page.stake_tokens_title')}</CardTitle>
                            <CardDescription>{t('staking_page.stake_tokens_desc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="stake-amount">{t('staking_page.amount_to_stake')}</Label>
                                <Input id="stake-amount" type="number" placeholder="0.0" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} />
                            </div>
                            {needsApproval ? (
                                <Button className="w-full" disabled={isStakingActionPending || isStakeButtonDisabled} onClick={handleApprove}>
                                    {isStakingActionPending ? <DaoLoadingSpinner /> : <CheckCircle className="me-2"/>}
                                    {t('staking_page.approve_button')}
                                </Button>
                            ) : (
                                <Button className="w-full" disabled={isStakingActionPending || isStakeButtonDisabled} onClick={handleStake}>
                                    {isStakingActionPending ? <DaoLoadingSpinner /> : <PiggyBank className="me-2"/>}
                                    {t('staking_page.stake')}
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* --- RIGHT COLUMN: MANAGEMENT ACTIONS (UNSTAKE, DELEGATE, CLAIM) --- */}
                <div className="space-y-8">
                    {/* 3. Unstake & Claim Card (Combined for better space usage) */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('staking_page.manage_stake_title')}</CardTitle>
                            <CardDescription>{t('staking_page.manage_stake_desc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Unstake Section */}
                            <div className="space-y-2">
                                <Label htmlFor="unstake-amount">{t('staking_page.amount_to_unstake')}</Label>
                                <div className="flex gap-2">
                                    <Input id="unstake-amount" className="flex-grow" type="number" placeholder="0.0" value={unstakeAmount} onChange={(e) => setUnstakeAmount(e.target.value)} />
                                    <Button variant="outline" disabled={isUnstakeButtonDisabled} onClick={handleUnstake}>
                                        {isStakingActionPending ? <DaoLoadingSpinner /> : <Banknote className="me-2 h-4 w-4"/>}
                                        {t('staking_page.unstake')}
                                    </Button>
                                </div>
                            </div>
                            {/* Claim Section */}
                            <div className="space-y-2">
                                <Label>{t('staking_page.claim_rewards_title')}</Label>
                                <Button className="w-full" disabled={isClaimButtonDisabled} onClick={handleClaim}>
                                    {isStakingActionPending ? <DaoLoadingSpinner /> : <Award className="me-2"/>}
                                    {t('staking_page.claim_rewards')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 4. Delegate Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('staking_page.delegate_title')}</CardTitle>
                            <CardDescription>{t('staking_page.delegate_desc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>{t('staking_page.current_delegatee')}</Label>
                                <p className="text-sm font-mono break-all p-2 bg-muted rounded-md">{currentDelegatee && currentDelegatee !== '0x0000000000000000000000000000000000000000' ? currentDelegatee : t('staking_page.no_delegatee')}</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="delegate-address">{t('staking_page.delegatee_address')}</Label>
                                <Input id="delegate-address" placeholder="0x..." value={delegateeAddress} onChange={(e) => setDelegateeAddress(e.target.value)} disabled={isStakingActionPending} />
                            </div>
                            <div className="flex gap-2">
                                <Button className="flex-grow" disabled={isDelegateButtonDisabled} onClick={handleDelegate}>
                                    {isStakingActionPending ? <DaoLoadingSpinner /> : <Users className="me-2"/>}
                                    {t('staking_page.delegate_cta')}
                                </Button>
                                <Button variant="outline" className="flex-grow" disabled={isUndelegateButtonDisabled} onClick={handleUndelegate}>
                                    {isStakingActionPending ? <DaoLoadingSpinner /> : <Vote className="me-2"/>}
                                    {t('staking_page.undelegate_cta')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* --- STAKING PLANS SECTION (UNTOUCHED) --- */}
            <div className="text-center mb-8 pt-8 border-t">
                <h2 className="text-2xl font-semibold font-headline">{t('staking_page.plans_for_role')} {roleName}</h2>
                <p className="text-muted-foreground mt-1">{t('staking_page.plans_for_role_desc')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => (
                <StakingPlanCard key={plan.title} 
                tier={plan.tier} 
                price={formatNumber(plan.price, locale)} 
                title={plan.title} 
                description={plan.description} 
                features={plan.features} 
                isFeatured={plan.isFeatured}  
                onSelect={() => {
                        setStakeAmount(plan.price);
                        toast.info(t('staking_page.plan_selected_toast'));
                        }} 
                />
            ))}
            </div>
        </AppLayout>
    );
}