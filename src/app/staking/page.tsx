// src/app/staking/page.tsx - SMART BUTTON INTEGRATED

"use client";

import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Wallet, ArrowRight, Lock, Unlock, Award, Users, ShieldCheck } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useWeb3 } from '@/context/Web3Provider';
import { useReadContracts } from 'wagmi';
import { formatEther } from 'viem';
import { formatNumber } from '@/lib/utils';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { daoRegistryAbi } from '@/lib/blockchain/generated';
import { REGISTRY_KEYS } from '@/lib/blockchain/registry-keys';
import { useStaking } from '@/hooks/useStaking';
import type { Address } from 'viem';
import { StatCard } from '@/components/dashboard/stat-card';

const useSafeTranslation = () => {
    const { t: originalT, locale } = useTranslation();
    const t = (key: string, params?: any) => (originalT as any)(key, params);
    return { t, locale };
};

export default function StakingPage() {
    const { t, locale } = useSafeTranslation();
    const { registryAddress, isHydrated } = useWeb3();

    // 1. دریافت آدرس‌ها
    const { data: addresses, isLoading: isAddrLoading } = useReadContracts({
        contracts: [
            { address: registryAddress as Address, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.TOKEN] },
            { address: registryAddress as Address, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.STAKING] },
        ],
        query: { enabled: !!registryAddress && isHydrated }
    });

    const tokenAddress = addresses?.[0].result as Address;
    const stakingAddress = addresses?.[1].result as Address;

    // 2. اتصال به هوک هوشمند
    const {
        rycBalance, stakedBalance, earnedRewards, currentDelegatee,
        stakeAmount, setStakeAmount,
        unstakeAmount, setUnstakeAmount,
        delegateeAddress, setDelegateeAddress,
        needsApproval, // ✅ متغیر کلیدی برای دکمه هوشمند
        isActionPending,
        handleStake, // ✅ این تابع هم Approve و هم Stake را انجام می‌دهد
        handleUnstake, handleClaim, handleDelegate, handleUndelegate,
        isStakeButtonDisabled, isUnstakeButtonDisabled, isClaimButtonDisabled, isDelegateButtonDisabled, isUndelegateButtonDisabled,
    } = useStaking({ tokenAddress, stakingAddress });

    const isLoading = isAddrLoading;

    // متن دکمه هوشمند
    const getStakeButtonText = () => {
        if (isActionPending) return <DaoLoadingSpinner />;
        if (needsApproval) return t('staking_page.approve_token'); // "Approve RYC"
        return t('staking_page.stake_button'); // "Stake RYC"
    };

    return (
        <AppLayout>
            <header className="mb-10">
                <h1 className="text-4xl font-bold font-headline text-gradient">{t('staking_page.title')}</h1>
                <p className="text-lg text-muted-foreground mt-2">{t('staking_page.subtitle')}</p>
            </header>

            {/* Stats Overview */}
            <div className="grid gap-6 grid-cols-1 md:grid-cols-3 mb-10">
                <StatCard 
                    title={t('staking_page.your_staked_balance')} 
                    value={`${formatNumber(formatEther(stakedBalance || 0n), locale)} RYC`} 
                    icon={Lock} 
                    variant="default"
                    isLoading={isLoading} 
                />
                <StatCard 
                    title={t('staking_page.earned_rewards')} 
                    value={`${formatNumber(formatEther(earnedRewards || 0n), locale)} RYC`} 
                    icon={Award} 
                    variant="positive"
                    isLoading={isLoading} 
                />
                <StatCard 
                    title={t('staking_page.wallet_balance')} 
                    value={`${formatNumber(formatEther(rycBalance || 0n), locale)} RYC`} 
                    icon={Wallet} 
                    variant="neutral"
                    isLoading={isLoading} 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* --- Left: Actions Panel --- */}
                <div className="lg:col-span-2">
                    <Card className="border-primary/10 shadow-lg bg-card">
                        <CardHeader>
                            <CardTitle>{t('staking_page.manage_staking')}</CardTitle>
                            <CardDescription>{t('staking_page.manage_desc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="stake" className="w-full">
                                <TabsList className="grid w-full grid-cols-3 mb-8">
                                    <TabsTrigger value="stake">{t('staking_page.tab_stake')}</TabsTrigger>
                                    <TabsTrigger value="unstake">{t('staking_page.tab_unstake')}</TabsTrigger>
                                    <TabsTrigger value="claim">{t('staking_page.tab_claim')}</TabsTrigger>
                                </TabsList>

                                {/* STAKE TAB */}
                                <TabsContent value="stake" className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <Label>{t('staking_page.amount_to_stake')}</Label>
                                            <span className="text-muted-foreground cursor-pointer hover:text-primary" onClick={() => setStakeAmount(formatEther(rycBalance || 0n))}>
                                                {t('common.max')}: {formatNumber(formatEther(rycBalance || 0n), locale)}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Input 
                                                type="number" 
                                                placeholder="0.0" 
                                                className="text-lg font-mono"
                                                value={stakeAmount}
                                                onChange={(e) => setStakeAmount(e.target.value)}
                                            />
                                            {/* ✅ دکمه هوشمند */}
                                            <Button 
                                                className="min-w-[140px] bg-primary hover:bg-primary/90"
                                                onClick={handleStake}
                                                disabled={isStakeButtonDisabled}
                                            >
                                                {getStakeButtonText()}
                                            </Button>
                                        </div>
                                    </div>
                                    <Alert className="bg-blue-500/10 border-blue-500/20">
                                        <ShieldCheck className="h-4 w-4 text-blue-500" />
                                        <AlertTitle className="text-blue-600">{t('staking_page.staking_info_title')}</AlertTitle>
                                        <AlertDescription className="text-blue-600/80 text-xs">
                                            {t('staking_page.staking_info_desc')}
                                        </AlertDescription>
                                    </Alert>
                                </TabsContent>

                                {/* UNSTAKE TAB */}
                                <TabsContent value="unstake" className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <Label>{t('staking_page.amount_to_unstake')}</Label>
                                            <span className="text-muted-foreground cursor-pointer hover:text-primary" onClick={() => setUnstakeAmount(formatEther(stakedBalance || 0n))}>
                                                {t('common.max')}: {formatNumber(formatEther(stakedBalance || 0n), locale)}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Input 
                                                type="number" 
                                                placeholder="0.0" 
                                                className="text-lg font-mono"
                                                value={unstakeAmount}
                                                onChange={(e) => setUnstakeAmount(e.target.value)}
                                            />
                                            <Button 
                                                className="min-w-[140px]" 
                                                variant="outline"
                                                onClick={handleUnstake}
                                                disabled={isUnstakeButtonDisabled}
                                            >
                                                {isActionPending ? <DaoLoadingSpinner /> : t('staking_page.unstake_button')}
                                            </Button>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* CLAIM TAB */}
                                <TabsContent value="claim" className="flex flex-col items-center justify-center py-8 space-y-4">
                                    <div className="text-center">
                                        <h3 className="text-2xl font-bold text-green-600">{formatNumber(formatEther(earnedRewards || 0n), locale)} RYC</h3>
                                        <p className="text-muted-foreground">{t('staking_page.available_rewards')}</p>
                                    </div>
                                    <Button 
                                        size="lg" 
                                        className="w-full max-w-xs bg-green-600 hover:bg-green-700 text-white"
                                        onClick={handleClaim}
                                        disabled={isClaimButtonDisabled}
                                    >
                                        {isActionPending ? <DaoLoadingSpinner /> : (
                                            <>
                                                <Award className="mr-2 h-5 w-5" />
                                                {t('staking_page.claim_rewards_button')}
                                            </>
                                        )}
                                    </Button>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>

                {/* --- Right: Governance Power --- */}
                <div className="space-y-6">
                    <Card className="border-purple-500/20 bg-purple-500/5">
                        <CardHeader>
                            <CardTitle className="text-purple-600 flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                {t('staking_page.governance_power')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg border">
                                <span className="text-sm text-muted-foreground">{t('staking_page.current_delegatee')}</span>
                                <span className="font-mono text-xs truncate max-w-[120px]">
                                    {!currentDelegatee || currentDelegatee === '0x0000000000000000000000000000000000000000' 
                                        ? t('staking_page.self_delegated') 
                                        : `${currentDelegatee.slice(0,6)}...${currentDelegatee.slice(-4)}`}
                                </span>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs">{t('staking_page.delegate_to_address')}</Label>
                                <Input 
                                    placeholder="0x..." 
                                    className="h-9 text-xs font-mono"
                                    value={delegateeAddress}
                                    onChange={(e) => setDelegateeAddress(e.target.value)}
                                />
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <Button 
                                        variant="secondary" 
                                        size="sm"
                                        onClick={handleDelegate}
                                        disabled={isDelegateButtonDisabled}
                                    >
                                        {isActionPending ? <DaoLoadingSpinner className="w-3 h-3" /> : t('staking_page.delegate_button')}
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={handleUndelegate}
                                        disabled={isUndelegateButtonDisabled}
                                    >
                                        {isActionPending ? <DaoLoadingSpinner className="w-3 h-3" /> : t('staking_page.undelegate_button')}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}