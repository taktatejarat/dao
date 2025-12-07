// src/app/treasury/page.tsx - FIXED & CLEANED

"use client";

import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Banknote, Gem, ArrowRight, Wallet, Info, Lock, TrendingUp, CircleDollarSign, PieChart } from 'lucide-react';
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

// --- Admin Actions Component ---
// ✅ FIX: اضافه کردن onRefresh به ورودی‌ها
const AdminTreasuryActions = ({ 
    financeAddress, 
    tokenAddress, 
    onRefresh 
}: { 
    financeAddress?: Address; 
    tokenAddress?: Address; 
    onRefresh: () => void;
}) => {
    const { t } = useSafeTranslation();
    
    // ✅ FIX: دریافت تمام استیت‌ها و هندلرها فقط از هوک (بدون useState اضافی)
    const {
        depositAmount, setDepositAmount,
        withdrawRycAmount, setWithdrawRycAmount,
        withdrawNativeAmount, setWithdrawNativeAmount,
        handleDeposit, handleWithdrawRyc, handleWithdrawNative,
        isActionPending, 
        isDepositDisabled, isWithdrawRycDisabled, isWithdrawNativeDisabled,
        nativeTreasuryBalance
    } = useTreasury({ 
        financeAddress, 
        tokenAddress,
        onSuccess: onRefresh // اتصال تابع رفرش به هوک
    });
    
    const nativeSymbol = nativeTreasuryBalance?.symbol ?? t('treasury_page.native_token');

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-8">
            {/* Fund Treasury */}
            <Card className="flex flex-col border-primary/20 bg-primary/5 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-primary flex items-center gap-2 text-xl"><Wallet className="w-6 h-6"/> {t('treasury_page.fund_treasury_title')}</CardTitle>
                    <CardDescription className="text-base">{t('treasury_page.fund_treasury_desc')}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end gap-6">
                   <div className="flex items-center gap-3">
                       <Input 
                            id="deposit-ryc-amount" 
                            type="number" 
                            className="bg-background h-12 text-lg font-mono" 
                            value={depositAmount} 
                            onChange={(e) => setDepositAmount(e.target.value)} 
                            placeholder="0.0" 
                       />
                       <Button className="h-12 px-8 text-lg" disabled={isActionPending || isDepositDisabled} onClick={handleDeposit}>
                            {isActionPending ? <DaoLoadingSpinner /> : <ArrowRight className="me-2 w-5 h-5"/>} {t('treasury_page.fund_button')}
                       </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Withdraw Funds */}
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive text-xl"><Banknote className="w-6 h-6"/> {t('treasury_page.withdraw_funds')}</CardTitle>
                    <CardDescription className="text-base">{t('treasury_page.withdraw_funds_desc_admin')}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="space-y-3">
                        <Label className="text-base">{t('treasury_page.withdraw_ryc')}</Label>
                        <div className="flex gap-3">
                            <Input type="number" placeholder="0.0" className="h-12 text-lg font-mono" value={withdrawRycAmount} onChange={(e) => setWithdrawRycAmount(e.target.value)} />
                            <Button variant="outline" className="h-12 px-6" disabled={isActionPending || isWithdrawRycDisabled} onClick={handleWithdrawRyc}>
                                {isActionPending ? <DaoLoadingSpinner /> : (
                                    <>
                                        <Banknote className="me-2 h-4 w-4" />
                                        {t('treasury_page.withdraw')} RYC
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                     <div className="space-y-3">
                        <Label className="text-base">{t('treasury_page.withdraw_native')} ({nativeSymbol})</Label>
                        <div className="flex gap-3">
                            <Input type="number" placeholder="0.0" className="h-12 text-lg font-mono" value={withdrawNativeAmount} onChange={(e) => setWithdrawNativeAmount(e.target.value)} />
                            <Button variant="outline" className="h-12 px-6" disabled={isActionPending || isWithdrawNativeDisabled} onClick={handleWithdrawNative}>
                                {isActionPending ? <DaoLoadingSpinner /> : (
                                    <>
                                        <Gem className="me-2 h-4 w-4" />
                                        {t('treasury_page.withdraw')} {nativeSymbol}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
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
    // ✅ FIX: استخراج تابع refetch و تغییر نام آن به refetchBalances
    const { data: balances, isLoading: isBalLoading, refetch: refetchBalances } = useReadContracts({
        contracts: [
            { address: tokenAddress, abi: rayanChainTokenAbi, functionName: 'balanceOf', args: [financeAddress!] },
            { address: tokenAddress, abi: rayanChainTokenAbi, functionName: 'balanceOf', args: [stakingAddress!] },
            { address: tokenAddress, abi: rayanChainTokenAbi, functionName: 'totalSupply' },
        ],
        query: { enabled: !!financeAddress && !!tokenAddress && !!stakingAddress }
    });

    // 3. دریافت موجودی Native
    // ✅ FIX: استخراج تابع refetch و تغییر نام آن
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

    // ✅ FIX: تعریف تابع هندلر برای رفرش کردن همه داده‌ها
    const handleGlobalRefresh = () => {
        console.log("🔄 Refreshing Treasury Data...");
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
                
                {/* 1. Treasury Reserve */}
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

                {/* 2. Staked Value (TVL) */}
                <StatCard 
                    title={t('treasury_page.total_value_locked')} 
                    value={`${formatNumber(formatEther(stakedRyc), locale)} RYC`} 
                    icon={Lock} 
                    description={t('treasury_page.users_staked_funds')} 
                    variant="positive" 
                    isLoading={isLoading} 
                />

                {/* 3. Sales Revenue */}
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
            <Card className="mb-8 overflow-hidden border-none bg-gradient-to-r from-muted/50 to-background shadow-md">
                <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row items-stretch">
                        
                        {/* Left Side: Circulating */}
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

                        {/* Right Side: Total Supply */}
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

            {userRole === 'admin' ? (
                <AdminTreasuryActions 
                    financeAddress={financeAddress} 
                    tokenAddress={tokenAddress} 
                    onRefresh={handleGlobalRefresh} // ✅ ارسال تابع رفرش
                />
            ) : (
                <Alert className="mb-8 border-blue-500/20 bg-blue-500/5">
                    <Info className="h-5 w-5 text-blue-500" />
                    <AlertTitle className="text-blue-500 font-semibold text-lg">{t('treasury_page.public_view_title')}</AlertTitle>
                    <AlertDescription className="text-base mt-1">{t('treasury_page.public_view_desc')}</AlertDescription>
                </Alert>
            )}
        </AppLayout>
    );
}