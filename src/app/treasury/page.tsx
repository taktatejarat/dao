"use client";

import { useMemo } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Landmark, Banknote, Gem, ArrowRight, Info } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useWeb3 } from '@/context/Web3Provider';
import { useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { formatNumber } from '@/lib/utils';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { daoRegistryAbi } from '@/lib/blockchain/generated';
import { REGISTRY_KEYS } from '@/lib/blockchain/registry-keys';
import { useTreasury } from '@/hooks/useTreasury';
import type { Address } from 'viem';

// --- Admin Actions Sub-component ---
const AdminTreasuryActions = ({ financeAddress, tokenAddress }: { financeAddress?: Address; tokenAddress?: Address }) => {
    const { t } = useTranslation();
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
        <div className="space-y-8">
            <Card>
                <CardHeader><CardTitle>{t('treasury_page.fund_treasury_title')}</CardTitle><CardDescription>{t('treasury_page.fund_treasury_desc')}</CardDescription></CardHeader>
                <CardContent>
                   <div className="flex items-center gap-2">
                       <Input id="deposit-ryc-amount" type="number" className="max-w-[200px]" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
                       <Button disabled={isActionPending || isDepositDisabled} onClick={handleDeposit}>
                            {isActionPending ? <DaoLoadingSpinner /> : <ArrowRight className="me-2"/>} {t('treasury_page.fund_button')}
                       </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>{t('treasury_page.withdraw_funds')}</CardTitle><CardDescription>{t('treasury_page.withdraw_funds_desc_admin')}</CardDescription></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="font-semibold">{t('treasury_page.withdraw_ryc')}</h3>
                        <div className="space-y-2"><Label htmlFor="withdraw-ryc-amount">{t('treasury_page.amount')}</Label><Input id="withdraw-ryc-amount" type="number" placeholder="0.0" value={withdrawRycAmount} onChange={(e) => setWithdrawRycAmount(e.target.value)} /></div>
                        <Button className="w-full" disabled={isActionPending || isWithdrawRycDisabled} onClick={handleWithdrawRyc}>
                           {isActionPending ? <DaoLoadingSpinner /> : <Banknote className="me-2"/>} {t('treasury_page.withdraw')} RYC
                        </Button>
                    </div>
                     <div className="space-y-4">
                        <h3 className="font-semibold">{t('treasury_page.withdraw_native')}</h3>
                        <div className="space-y-2"><Label htmlFor="withdraw-native-amount">{t('treasury_page.amount')}</Label><Input id="withdraw-native-amount" type="number" placeholder="0.0" value={withdrawNativeAmount} onChange={(e) => setWithdrawNativeAmount(e.target.value)} /></div>
                         <Button variant="outline" className="w-full" disabled={isActionPending || isWithdrawNativeDisabled} onClick={handleWithdrawNative}>
                            {isActionPending ? <DaoLoadingSpinner /> : <Gem className="me-2"/>} {t('treasury_page.withdraw')} {nativeSymbol}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

// --- Main Page Component ---
export default function TreasuryPage() {
    const { t, locale } = useTranslation();
    const { userRole, registryAddress, isHydrated } = useWeb3();

    const { data: financeAddressResult, isLoading: isFinanceAddrLoading } = useReadContract({
        address: registryAddress as Address,
        abi: daoRegistryAbi,
        functionName: 'getAddress',
        args: [REGISTRY_KEYS.FINANCE] as const,
        query: { enabled: !!registryAddress && isHydrated }
    });
    const { data: tokenAddressResult, isLoading: isTokenAddrLoading } = useReadContract({
        address: registryAddress as Address,
        abi: daoRegistryAbi,
        functionName: 'getAddress',
        args: [REGISTRY_KEYS.TOKEN] as const,
        query: { enabled: !!registryAddress && isHydrated }
    });
    const financeAddress = financeAddressResult as Address | undefined;
    const tokenAddress = tokenAddressResult as Address | undefined;
    
    const { rycTreasuryBalance, nativeTreasuryBalance } = useTreasury({ financeAddress, tokenAddress });

    const isLoading = isFinanceAddrLoading || isTokenAddrLoading || (!!financeAddress && (rycTreasuryBalance === undefined || nativeTreasuryBalance === undefined));
    const nativeSymbol = nativeTreasuryBalance?.symbol ?? t('treasury_page.native_token');

    return (
        <AppLayout>
            <header className="mb-6"><h1 className="text-3xl font-bold font-headline">{t('treasury_page.title')}</h1><p className="text-muted-foreground">{t('treasury_page.subtitle')}</p></header>
            
            <Card className="mb-8">
                <CardHeader><CardTitle className="flex items-center gap-2"><Landmark className="text-primary"/> {t('treasury_page.total_assets')}</CardTitle><CardDescription>{t('treasury_page.assets_in_treasury')}</CardDescription></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                        <div className="p-3 rounded-full bg-primary/10 text-primary"><Banknote className="w-6 h-6" /></div>
                        <div>
                            <p className="text-sm text-muted-foreground">{t('treasury_page.ryc_token_balance')}</p>
                            {isLoading ? <Skeleton className="h-7 w-32 mt-1" /> : <p className="text-xl font-bold">{formatNumber(formatEther(rycTreasuryBalance ?? BigInt(0)), locale)} RYC</p>}
                        </div>
                    </div>
                     <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                        <div className="p-3 rounded-full bg-secondary/10 text-secondary"><Gem className="w-6 h-6" /></div>
                        <div>
                            <p className="text-sm text-muted-foreground">{t('treasury_page.native_token_balance')}</p>
                            {isLoading ? <Skeleton className="h-7 w-32 mt-1" /> : <p className="text-xl font-bold">{formatNumber(nativeTreasuryBalance?.formatted ?? '0', locale)} {nativeSymbol}</p>}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {userRole === 'admin' ? (
                <AdminTreasuryActions financeAddress={financeAddress} tokenAddress={tokenAddress} />
            ) : (
                <Alert className="mb-8"><Info className="h-4 w-4" /><AlertTitle>{t('treasury_page.public_view_title')}</AlertTitle><AlertDescription>{t('treasury_page.public_view_desc')}</AlertDescription></Alert>
            )}

        </AppLayout>
    );
}