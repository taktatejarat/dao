// src/app/treasury/page.tsx - FINAL CORRECTED I18N & BUTTONS

"use client";

import { useMemo } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Banknote, Gem, ArrowRight, Wallet, Info } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useWeb3 } from '@/context/Web3Provider';
import { useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { formatNumber } from '@/lib/utils';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { daoRegistryAbi } from '@/lib/blockchain/generated';
import { REGISTRY_KEYS } from '@/lib/blockchain/registry-keys';
import { useTreasury } from '@/hooks/useTreasury';
import type { Address } from 'viem';
import { StatCard } from '@/components/dashboard/stat-card';

// --- Helper to fix Type Error (Expected 3 arguments) ---
const useSafeTranslation = () => {
    const { t: originalT, locale } = useTranslation();
    // تبدیل تابع ترجمه برای سازگاری با تایپ‌اسکریپت
    const t = (key: string) => (originalT as any)(key);
    return { t, locale };
};

const AdminTreasuryActions = ({ financeAddress, tokenAddress }: { financeAddress?: Address; tokenAddress?: Address }) => {
    const { t } = useSafeTranslation(); // ✅ استفاده از هوک اصلاح شده
    const {
        depositAmount, setDepositAmount,
        withdrawRycAmount, setWithdrawRycAmount,
        withdrawNativeAmount, setWithdrawNativeAmount,
        handleDeposit, handleWithdrawRyc, handleWithdrawNative,
        isActionPending, isDepositDisabled, isWithdrawRycDisabled, isWithdrawNativeDisabled,
        nativeTreasuryBalance
    } = useTreasury({ financeAddress, tokenAddress });
    
    const nativeSymbol = nativeTreasuryBalance?.symbol ?? t('treasury_page.native_token');

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Fund Treasury */}
            <Card className="flex flex-col border-primary/20 bg-primary/5">
                <CardHeader>
                    <CardTitle className="text-primary flex items-center gap-2"><Wallet className="w-5 h-5"/> {t('treasury_page.fund_treasury_title')}</CardTitle>
                    <CardDescription>{t('treasury_page.fund_treasury_desc')}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end gap-4">
                   <div className="flex items-center gap-2">
                       <Input id="deposit-ryc-amount" type="number" className="bg-background h-12 text-lg" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="0.0" />
                       <Button className="h-12 px-6" disabled={isActionPending || isDepositDisabled} onClick={handleDeposit}>
                            {isActionPending ? <DaoLoadingSpinner /> : <ArrowRight className="me-2"/>} {t('treasury_page.fund_button')}
                       </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Withdraw Funds */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Banknote className="w-5 h-5"/> {t('treasury_page.withdraw_funds')}</CardTitle>
                    <CardDescription>{t('treasury_page.withdraw_funds_desc_admin')}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="space-y-2">
                        <Label>{t('treasury_page.withdraw_ryc')}</Label>
                        <div className="flex gap-2">
                            <Input type="number" placeholder="0.0" value={withdrawRycAmount} onChange={(e) => setWithdrawRycAmount(e.target.value)} />
                            <Button variant="outline" disabled={isActionPending || isWithdrawRycDisabled} onClick={handleWithdrawRyc}>
                                {isActionPending ? <DaoLoadingSpinner /> : (
                                    <>
                                        <Banknote className="me-2 h-4 w-4"/> 
                                        {t('treasury_page.withdraw')} RYC
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label>{t('treasury_page.withdraw_native')} ({nativeSymbol})</Label>
                        <div className="flex gap-2">
                            <Input type="number" placeholder="0.0" value={withdrawNativeAmount} onChange={(e) => setWithdrawNativeAmount(e.target.value)} />
                            <Button variant="outline" disabled={isActionPending || isWithdrawNativeDisabled} onClick={handleWithdrawNative}>
                                {isActionPending ? <DaoLoadingSpinner /> : (
                                    <>
                                        <Gem className="me-2 h-4 w-4"/>
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
    const { t, locale } = useSafeTranslation(); // ✅ استفاده از هوک اصلاح شده
    const { userRole, registryAddress, isHydrated } = useWeb3();

    const { data: financeAddressResult, isLoading: isFinanceAddrLoading } = useReadContract({
        address: registryAddress as Address, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.FINANCE], query: { enabled: !!registryAddress && isHydrated }
    });
    const { data: tokenAddressResult, isLoading: isTokenAddrLoading } = useReadContract({
        address: registryAddress as Address, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.TOKEN], query: { enabled: !!registryAddress && isHydrated }
    });
    const financeAddress = financeAddressResult as Address | undefined;
    const tokenAddress = tokenAddressResult as Address | undefined;
    
    const { rycTreasuryBalance, nativeTreasuryBalance } = useTreasury({ financeAddress, tokenAddress });

    const isLoading = isFinanceAddrLoading || isTokenAddrLoading || (!!financeAddress && (rycTreasuryBalance === undefined || nativeTreasuryBalance === undefined));
    const nativeSymbol = nativeTreasuryBalance?.symbol ?? t('treasury_page.native_token');

    return (
        <AppLayout>
            <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h1 className="text-3xl font-bold font-headline text-gradient">{t('treasury_page.title')}</h1>
                    <p className="text-muted-foreground">{t('treasury_page.subtitle')}</p>
                </div>
            </header>
            
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 mb-10">
                <StatCard 
                    title={t('treasury_page.ryc_token_balance')} 
                    value={`${formatNumber(formatEther(rycTreasuryBalance ?? BigInt(0)), locale)} RYC`} 
                    icon={Banknote} 
                    description={t('treasury_page.assets_in_treasury')} 
                    variant="default"
                    isLoading={isLoading} 
                />
                <StatCard 
                    title={t('treasury_page.native_token_balance')} 
                    value={`${formatNumber(nativeTreasuryBalance?.formatted ?? '0', locale)} ${nativeSymbol}`} 
                    icon={Gem} 
                    description={t('treasury_page.gas_reserves')} 
                    variant="neutral"
                    isLoading={isLoading} 
                />
            </div>

            {userRole === 'admin' ? (
                <AdminTreasuryActions financeAddress={financeAddress} tokenAddress={tokenAddress} />
            ) : (
                <Alert className="mb-8 border-blue-500/20 bg-blue-500/5">
                    <Info className="h-4 w-4 text-blue-500" />
                    <AlertTitle className="text-blue-500">{t('treasury_page.public_view_title')}</AlertTitle>
                    <AlertDescription>{t('treasury_page.public_view_desc')}</AlertDescription>
                </Alert>
            )}
        </AppLayout>
    );
}