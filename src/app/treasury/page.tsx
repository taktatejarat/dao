// src/app/treasury/page.tsx - DAO GOVERNANCE COMPLIANT

"use client";

import Link from 'next/link';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
    Banknote, Wallet, Lock, TrendingUp, 
    CircleDollarSign, PieChart, ShieldCheck, 
    ArrowRight, Vote, AlertCircle 
} from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useWeb3 } from '@/context/Web3Provider';
import { useReadContracts, useBalance } from 'wagmi';
import { formatEther } from 'viem';
import { formatNumber } from '@/lib/utils';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { daoRegistryAbi, rayanChainTokenAbi } from '@/lib/blockchain/generated';
import { REGISTRY_KEYS } from '@/lib/blockchain/registry-keys';
import { useTreasury } from '@/hooks/useTreasury';
import type { Address } from 'viem';
import { StatCard } from '@/components/dashboard/stat-card';

// --- Helper for Type-Safe Translation ---
const useSafeTranslation = () => {
    const { t: originalT, locale } = useTranslation();
    const t = (key: string, params?: any) => (originalT as any)(key, params);
    return { t, locale };
};

// --- Component: Treasury Funding (Anyone can deposit) ---
const TreasuryFundingCard = ({ 
    financeAddress, 
    tokenAddress, 
    onRefresh 
}: { 
    financeAddress?: Address; 
    tokenAddress?: Address; 
    onRefresh: () => void;
}) => {
    const { t } = useSafeTranslation();
    
    // ما فقط از توابع واریز هوک استفاده می‌کنیم
    const {
        depositAmount, setDepositAmount,
        handleDeposit, 
        isActionPending, 
        isDepositDisabled
    } = useTreasury({ 
        financeAddress, 
        tokenAddress,
        onSuccess: onRefresh 
    });

    return (
        <Card className="flex flex-col border-emerald-500/20 bg-emerald-500/5 shadow-lg h-full">
            <CardHeader>
                <CardTitle className="text-emerald-600 flex items-center gap-2 text-xl">
                    <Wallet className="w-6 h-6"/> {t('treasury_page.fund_treasury_title')}
                </CardTitle>
                <CardDescription className="text-base">
                    {t('treasury_page.fund_treasury_desc')}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end gap-6">
               <div className="space-y-2">
                   <label className="text-sm font-medium text-muted-foreground">{t('treasury_page.deposit_amount')} (RYC)</label>
                   <div className="flex gap-3">
                       <Input 
                            type="number" 
                            className="bg-background h-12 text-lg font-mono" 
                            value={depositAmount} 
                            onChange={(e) => setDepositAmount(e.target.value)} 
                            placeholder="1000" 
                       />
                       <Button 
                            className="h-12 px-6 text-lg bg-emerald-600 hover:bg-emerald-700 text-white" 
                            disabled={isActionPending || isDepositDisabled} 
                            onClick={handleDeposit}
                       >
                            {isActionPending ? <DaoLoadingSpinner /> : <ArrowRight className="w-5 h-5 rtl:rotate-180"/>}
                       </Button>
                   </div>
               </div>
            </CardContent>
        </Card>
    );
};

// --- Component: Governance Actions (Withdrawal via Proposal) ---
const GovernanceActionsCard = () => {
    const { t } = useSafeTranslation();

    return (
        <Card className="flex flex-col border-primary/20 shadow-lg h-full relative overflow-hidden">
            {/* Background Icon */}
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                <ShieldCheck className="w-40 h-40" />
            </div>

            <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2 text-xl">
                    <ShieldCheck className="w-6 h-6"/> {t('treasury_page.manage_funds_title')}
                </CardTitle>
                <CardDescription className="text-base">
                    {t('treasury_page.manage_funds_desc')}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Alert className="bg-primary/5 border-primary/10">
                    <Lock className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-primary">{t('treasury_page.secure_vault_title')}</AlertTitle>
                    <AlertDescription className="text-xs text-muted-foreground">
                        {t('treasury_page.secure_vault_desc')}
                    </AlertDescription>
                </Alert>
                
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {t('treasury_page.withdrawal_instruction')}
                </p>
            </CardContent>
            <CardFooter className="mt-auto pt-0">
                <Link href="/proposals/new?type=treasury" className="w-full">
                    <Button variant="outline" className="w-full h-12 border-primary/30 hover:bg-primary/5 hover:border-primary text-primary font-semibold group">
                        <Vote className="w-5 h-5 mr-2" />
                        {t('treasury_page.create_withdrawal_proposal')}
                        <ArrowRight className="w-4 h-4 ml-auto opacity-50 group-hover:opacity-100 transition-opacity rtl:rotate-180 rtl:mr-auto rtl:ml-0" />
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    );
};

export default function TreasuryPage() {
    const { t, locale } = useSafeTranslation();
    const { userRole, registryAddress, isHydrated } = useWeb3();

    // 1. دریافت آدرس قراردادها
    const { data: addresses, isLoading: isAddrLoading } = useReadContracts({
        contracts: [
            { address: registryAddress as Address, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.FINANCE] },
            { address: registryAddress as Address, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.TOKEN] },
            { address: registryAddress as Address, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.STAKING] },
        ],
        query: { enabled: !!registryAddress && isHydrated }
    });

    const financeAddress = addresses?.[0].result as Address;
    const tokenAddress = addresses?.[1].result as Address;
    const stakingAddress = addresses?.[2].result as Address;

    // 2. دریافت موجودی‌ها
    const { data: balances, isLoading: isBalLoading, refetch: refetchBalances } = useReadContracts({
        contracts: [
            { address: tokenAddress, abi: rayanChainTokenAbi, functionName: 'balanceOf', args: [financeAddress!] },
            { address: tokenAddress, abi: rayanChainTokenAbi, functionName: 'balanceOf', args: [stakingAddress!] },
            { address: tokenAddress, abi: rayanChainTokenAbi, functionName: 'totalSupply' },
        ],
        query: { enabled: !!financeAddress && !!tokenAddress && !!stakingAddress }
    });

    // 3. دریافت موجودی Native
    const { data: tokenNativeBal, refetch: refetchTokenNative } = useBalance({ address: tokenAddress });
    const { data: financeNativeBal, refetch: refetchFinanceNative } = useBalance({ address: financeAddress });

    const isLoading = isAddrLoading || isBalLoading;

    // استخراج اعداد
    const treasuryRyc = balances?.[0].result as bigint ?? 0n;
    const stakedRyc = balances?.[1].result as bigint ?? 0n;
    const totalSupply = balances?.[2].result as bigint ?? 0n;
    const salesRevenue = tokenNativeBal?.value ?? 0n;
    const treasuryNative = financeNativeBal?.value ?? 0n;
    
    const circulating = totalSupply - (treasuryRyc + stakedRyc);
    const nativeSymbol = financeNativeBal?.symbol || 'POL';

    const handleGlobalRefresh = () => {
        refetchBalances();
        refetchTokenNative();
        refetchFinanceNative();
    };

    return (
        <AppLayout>
            <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h1 className="text-4xl font-bold font-headline text-gradient">{t('treasury_page.title')}</h1>
                    <p className="text-lg text-muted-foreground mt-2">{t('treasury_page.subtitle')}</p>
                </div>
            </header>
            
            {/* Section 1: Protocol Health Stats */}
            <div className="grid gap-6 grid-cols-1 md:grid-cols-3 mb-10">
                <StatCard 
                    title={t('treasury_page.treasury_reserves')} 
                    value={`${formatNumber(formatEther(treasuryRyc), locale)} RYC`} 
                    icon={Banknote} 
                    description={t('treasury_page.native_available', { 
                        amount: formatNumber(formatEther(treasuryNative), locale),
                        symbol: nativeSymbol
                    })}
                    variant="default"
                    isLoading={isLoading} 
                />
                <StatCard 
                    title={t('treasury_page.total_value_locked')} 
                    value={`${formatNumber(formatEther(stakedRyc), locale)} RYC`} 
                    icon={Lock} 
                    description={t('treasury_page.users_staked_funds')} 
                    variant="positive" 
                    isLoading={isLoading} 
                />
                <StatCard 
                    title={t('treasury_page.sales_revenue')} 
                    value={`${formatNumber(formatEther(salesRevenue), locale)} ${nativeSymbol}`} 
                    icon={TrendingUp} 
                    description={t('treasury_page.revenue_from_token_sales')} 
                    variant="neutral"
                    isLoading={isLoading} 
                />
            </div>

            {/* Section 2: Circulating Supply Banner */}
            <Card className="mb-10 overflow-hidden border-none bg-gradient-to-r from-muted/50 to-background shadow-md">
                <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row items-stretch">
                        <div className="flex-1 p-8 flex items-center gap-6 border-b md:border-b-0 md:border-e border-border/50">
                            <div className="p-4 rounded-full bg-primary/10 text-primary">
                                <CircleDollarSign className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-base font-medium text-muted-foreground mb-1">{t('treasury_page.circulating_supply')}</h3>
                                {isLoading ? (
                                    <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                                ) : (
                                    <div className="text-3xl font-bold tracking-tight text-foreground">
                                        {formatNumber(formatEther(circulating), locale)} <span className="text-sm font-sans text-muted-foreground">RYC</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex-1 p-8 flex items-center gap-6 bg-muted/20">
                            <div className="p-4 rounded-full bg-secondary/10 text-secondary-foreground">
                                <PieChart className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-base font-medium text-muted-foreground mb-1">{t('treasury_page.total_supply')}</h3>
                                {isLoading ? (
                                    <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                                ) : (
                                    <div className="text-3xl font-bold tracking-tight text-foreground/80">
                                        {formatNumber(formatEther(totalSupply), locale)} <span className="text-sm font-sans text-muted-foreground">RYC</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ✅ Section 3: Treasury Actions (Separated & Governance Compliant) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* 1. Funding (Open to All) */}
                <TreasuryFundingCard 
                    financeAddress={financeAddress} 
                    tokenAddress={tokenAddress} 
                    onRefresh={handleGlobalRefresh} 
                />

                {/* 2. Withdrawal (Governance Required) */}
                <GovernanceActionsCard />
            </div>

            {/* Info Alert */}
            <Alert className="mb-8 border-blue-500/20 bg-blue-500/5">
                <AlertCircle className="h-5 w-5 text-blue-500" />
                <AlertTitle className="text-blue-500 font-semibold">{t('treasury_page.dao_governance_active')}</AlertTitle>
                <AlertDescription className="text-xs mt-1 text-muted-foreground">
                    {t('treasury_page.dao_governance_desc')}
                </AlertDescription>
            </Alert>
        </AppLayout>
    );
}