// src/app/admin/[secureHash]/settings/page.tsx

"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useReadContracts, useSignMessage, useAccount } from 'wagmi';
import { useWeb3 } from '@/context/Web3Provider';
import { useTranslation } from '@/hooks/use-translation';
import { rayanChainDaoAbi, financeAbi } from '@/lib/blockchain/generated';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { ShieldCheck } from 'lucide-react';

export default function AdminSettingsPage() {
    const { t } = useTranslation();
    const { daoAddress, financeAddress, isHydrated } = useWeb3();
    const { address } = useAccount();
    const { signMessageAsync } = useSignMessage();
    
    // State ها
    const [votingPeriod, setVotingPeriod] = useState('');
    const [protocolFee, setProtocolFee] = useState('');
    const [clientFee, setClientFee] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // 1. خواندن مقادیر فعلی (Current On-Chain State)
    const { data: contractData, isLoading: isReading } = useReadContracts({
        contracts: [
            { address: daoAddress, abi: rayanChainDaoAbi, functionName: 'votingPeriod' },
            { address: financeAddress, abi: financeAbi, functionName: 'protocolFeeBps' },
            { address: financeAddress, abi: financeAbi, functionName: 'clientFeeBps' },
        ],
        query: { enabled: isHydrated && !!daoAddress && !!financeAddress }
    });

    useEffect(() => {
        if (contractData) {
            if (contractData[0].status === 'success') setVotingPeriod(contractData[0].result.toString());
            // تبدیل BPS به درصد (مثلا 100 به 1)
            if (contractData[1].status === 'success') setProtocolFee((Number(contractData[1].result) / 100).toString());
            if (contractData[2].status === 'success') setClientFee((Number(contractData[2].result) / 100).toString());
        }
    }, [contractData]);

    // 2. تابع ذخیره امن کانفیگ
    const handleSaveConfig = async () => {
        if (!address) return toast.error(t('wallet.not_connected'));

        try {
            setIsSaving(true);
            
            // ساخت آبجکت کانفیگ نهایی
            const newConfig = {
                dao: {
                    votingPeriod: Number(votingPeriod),
                    quorumPercentage: 10, 
                    approvalThreshold: 51
                },
                finance: {
                    protocolFeeBps: Number(protocolFee) * 100,
                    clientFeeBps: Number(clientFee) * 100
                }
            };

            const timestamp = new Date().toISOString();
            const message = t('dashboard.admin.sign_message_content', {
                votingPeriod,
                protocolFee,
                clientFee,
                timestamp
            });

            // درخواست امضا از متامسک
            const signature = await signMessageAsync({ message });

            // ارسال به API
            const response = await fetch('/api/admin/save-dao-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address,
                    message,
                    signature,
                    config: newConfig
                })
            });

            const result = await response.json();

            if (result.success) {
                toast.success(t('dashboard.admin.config_saved_title'), { 
                    description: t('dashboard.admin.config_saved_desc') 
                });
            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            toast.error(t('dashboard.admin.save_failed'), { description: (error as Error).message });
        } finally {
            setIsSaving(false);
        }
    };

    if (isReading) return <div className="flex justify-center p-10"><DaoLoadingSpinner /></div>;

    return (
        <div className="container py-10 max-w-4xl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold font-headline text-gradient">
                        {t('dashboard.admin.title')}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        {t('dashboard.admin.settings_subtitle')}
                    </p>
                </div>
                <Button 
                    onClick={handleSaveConfig} 
                    disabled={isSaving}
                    className="bg-emerald-600 hover:bg-emerald-700"
                >
                    {isSaving ? <DaoLoadingSpinner /> : <ShieldCheck className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />}
                    {t('dashboard.admin.save_prepare_btn')}
                </Button>
            </div>
            
            <div className="space-y-6">
                {/* Governance Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('dashboard.admin.governance_card_title')}</CardTitle>
                        <CardDescription>
                            {/* ✅ FIX: استفاده از ?? برای جلوگیری از مقدار undefined */}
                            {t('dashboard.admin.current_onchain', { value: contractData?.[0].result?.toString() ?? '-' })} {t('common.seconds')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid w-full items-center gap-1.5">
                            <Label>
                                {t('dashboard.admin.voting_period_label')} ({t('common.seconds')})
                            </Label>
                            <Input 
                                type="number" 
                                value={votingPeriod} 
                                onChange={e => setVotingPeriod(e.target.value)} 
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Financial Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('dashboard.admin.financial_card_title')}</CardTitle>
                        <CardDescription>
                            {/* ✅ FIX: استفاده از ?? برای جلوگیری از مقدار undefined */}
                            {t('dashboard.admin.fee_status_desc', { 
                                protocol: contractData?.[1].result?.toString() ?? '-',
                                client: contractData?.[2].result?.toString() ?? '-'
                            })}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="grid w-full items-center gap-1.5">
                                <Label>{t('dashboard.admin.protocol_fee_label')} (%)</Label>
                                <Input 
                                    type="number" 
                                    step="0.01"
                                    value={protocolFee} 
                                    onChange={e => setProtocolFee(e.target.value)} 
                                />
                            </div>
                            <div className="grid w-full items-center gap-1.5">
                                <Label>{t('dashboard.admin.client_fee_label')} (%)</Label>
                                <Input 
                                    type="number" 
                                    step="0.01"
                                    value={clientFee} 
                                    onChange={e => setClientFee(e.target.value)} 
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}