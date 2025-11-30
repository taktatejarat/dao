// src/app/admin/[secureHash]/settings/page.tsx - FINAL REAL

"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useWriteContract, useReadContracts } from 'wagmi';
import { useWeb3 } from '@/context/Web3Provider';
import { useTranslation } from '@/hooks/use-translation';
import { rayanChainDaoAbi, financeAbi } from '@/lib/blockchain/generated';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';

export default function AdminSettingsPage() {
    const { t } = useTranslation();
    const { daoAddress, financeAddress, isHydrated } = useWeb3();
    const { writeContractAsync, isPending } = useWriteContract();
    
    // State برای مقادیر فرم
    const [votingPeriod, setVotingPeriod] = useState('');
    const [protocolFee, setProtocolFee] = useState('');
    const [clientFee, setClientFee] = useState('');

    // 1. خواندن مقادیر فعلی از بلاکچین
    const { data: contractData, isLoading: isReading } = useReadContracts({
        contracts: [
            { address: daoAddress, abi: rayanChainDaoAbi, functionName: 'votingPeriod' },
            { address: financeAddress, abi: financeAbi, functionName: 'protocolFeeBps' },
            { address: financeAddress, abi: financeAbi, functionName: 'clientFeeBps' },
        ],
        query: { enabled: isHydrated && !!daoAddress && !!financeAddress }
    });

    // پر کردن فرم با مقادیر فعلی بلاکچین
    useEffect(() => {
        if (contractData) {
            if (contractData[0].status === 'success') setVotingPeriod(contractData[0].result.toString());
            // تبدیل BPS به درصد (مثلا 100 به 1)
            if (contractData[1].status === 'success') setProtocolFee((Number(contractData[1].result) / 100).toString());
            if (contractData[2].status === 'success') setClientFee((Number(contractData[2].result) / 100).toString());
        }
    }, [contractData]);

    // 2. تابع بروزرسانی زمان رأی‌گیری
    const updateVotingPeriod = async () => {
        try {
            const toastId = toast.loading(t('toasts.submitting_transaction'));
            await writeContractAsync({
                address: daoAddress!,
                abi: rayanChainDaoAbi,
                functionName: 'setVotingPeriod',
                args: [BigInt(votingPeriod)],
            });
            toast.success(t('toasts.transaction_success'), { id: toastId });
        } catch (e) { 
            toast.error(t('common.error'), { description: (e as Error).message });
        }
    };

    // 3. تابع بروزرسانی کارمزدها
    const updateFees = async () => {
        try {
            const toastId = toast.loading(t('toasts.submitting_transaction'));
            // تبدیل درصد به BPS (مثلا 1 به 100)
            const pFeeBps = BigInt(Number(protocolFee) * 100);
            const cFeeBps = BigInt(Number(clientFee) * 100);

            await writeContractAsync({
                address: financeAddress!,
                abi: financeAbi,
                functionName: 'setFeeConfiguration',
                args: [pFeeBps, cFeeBps],
            });
            toast.success(t('toasts.transaction_success'), { id: toastId });
        } catch (e) { 
            toast.error(t('common.error'), { description: (e as Error).message });
        }
    };

    if (isReading) return <div className="flex justify-center p-10"><DaoLoadingSpinner /></div>;

    return (
        <div className="container py-10 max-w-4xl">
            <h1 className="text-2xl font-bold mb-6 font-headline text-gradient">
                {t('dashboard.admin.title')}
            </h1>
            
            <div className="space-y-6">
                {/* Governance Settings */}
                <Card>
                    <CardHeader><CardTitle>{t('dashboard.admin.governance_card_title')}</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid w-full items-center gap-1.5">
                            <Label>{t('dashboard.admin.voting_period_label')}</Label>
                            <div className="flex gap-2">
                                <Input 
                                    type="number" 
                                    value={votingPeriod} 
                                    onChange={e => setVotingPeriod(e.target.value)} 
                                />
                                <Button onClick={updateVotingPeriod} disabled={isPending}>
                                    {isPending ? <DaoLoadingSpinner /> : t('dashboard.admin.update_button')}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Financial Settings */}
                <Card>
                    <CardHeader><CardTitle>{t('dashboard.admin.financial_card_title')}</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {/* Protocol Fee */}
                        <div className="grid w-full items-center gap-1.5">
                            <Label>{t('dashboard.admin.protocol_fee_label')}</Label>
                            <Input 
                                type="number" 
                                step="0.01"
                                value={protocolFee} 
                                onChange={e => setProtocolFee(e.target.value)} 
                            />
                        </div>
                        
                        {/* ✅ NEW: Client Fee */}
                        <div className="grid w-full items-center gap-1.5">
                            <Label>{t('dashboard.admin.client_fee_label')}</Label>
                            <Input 
                                type="number" 
                                step="0.01"
                                value={clientFee} 
                                onChange={e => setClientFee(e.target.value)} 
                            />
                        </div>

                        <Button variant="secondary" onClick={updateFees} disabled={isPending} className="w-full">
                            {isPending ? <DaoLoadingSpinner /> : t('dashboard.admin.update_fee_button')}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}