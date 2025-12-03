// src/app/logs/page.tsx - FINAL ACTIVITY EXPLORER DESIGN

"use client";

import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAccount, useReadContract } from 'wagmi';
import { type Address } from 'viem';
import { useTranslation } from '@/hooks/use-translation';
import { formatLocaleDate } from "@/lib/utils";
import { 
    Activity, Search, Filter, ExternalLink, 
    ShieldCheck, Layers, Banknote, Clock, 
    CheckCircle, AlertTriangle
} from 'lucide-react';
import { useWeb3 } from '@/context/Web3Provider';
import { useQuery } from '@tanstack/react-query';
import { daoRegistryAbi } from '@/lib/blockchain/generated';
import { REGISTRY_KEYS } from '@/lib/blockchain/registry-keys';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { StatCard } from '@/components/dashboard/stat-card'; // ✅ New Import

// نوع داده‌ها
type DaoEvent = {
    eventName: string;
    description: string;
    blockNumber: string;
    timeStamp: string;
    transactionHash: string;
    args: any;
};

// کامپوننت لیست رویدادها
const EventList = ({ contractAddress, contractName, filter }: { contractAddress: Address; contractName: string; filter: string }) => {
    const { t, locale } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');

    const { data: response, isLoading, error } = useQuery<{ success: boolean; result: DaoEvent[] }>({
        queryKey: ['events', contractAddress, contractName],
        queryFn: async () => {
            const params = new URLSearchParams({ contractAddress, contractName });
            const res = await fetch(`/api/events?${params.toString()}`, { cache: 'no-store' });
            if (!res.ok) throw new Error('Failed to fetch events.');
            return res.json();
        },
        enabled: !!contractAddress, 
    });

    const events = useMemo(() => {
        if (!response?.result) return [];
        let filtered = response.result;

        // فیلتر متنی
        if (searchTerm) {
            filtered = filtered.filter(e => 
                e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                e.transactionHash.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // فیلتر نوع رویداد (ساده‌سازی شده)
        if (filter !== 'all') {
            filtered = filtered.filter(e => e.eventName.toLowerCase().includes(filter));
        }

        return filtered;
    }, [response, searchTerm, filter]);

    if (isLoading) return <div className="flex justify-center p-12"><DaoLoadingSpinner /></div>;
    if (error) return <div className="text-destructive text-center p-8">{(error as Error).message}</div>;
    if (events.length === 0) return <div className="text-muted-foreground text-center p-12 bg-muted/20 rounded-xl border border-dashed">{t('logs_page.no_data')}</div>;

    return (
        <div className="space-y-4">
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:right-3 rtl:left-auto" />
                <Input 
                    placeholder={t('logs_page.search_placeholder')} 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 rtl:pr-10 rtl:pl-4 bg-card"
                />
            </div>

            <div className="space-y-4">
                {events.map((event, idx) => (
                    <Card key={`${event.transactionHash}-${idx}`} className="group hover:shadow-md transition-all duration-300 border-l-4 border-l-primary/50">
                        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                            <div className="flex items-start gap-4">
                                <div className="p-2 rounded-full bg-primary/10 mt-1 sm:mt-0">
                                    <Activity className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline" className="font-mono text-xs">{event.eventName}</Badge>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatLocaleDate(new Date(Number(event.timeStamp) * 1000), locale)}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium leading-relaxed text-foreground/90">{event.description}</p>
                                </div>
                            </div>
                            
                            <Button variant="ghost" size="sm" asChild className="shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">
                                <a href={`https://amoy.polygonscan.com/tx/${event.transactionHash}`} target="_blank" rel="noopener noreferrer" className="gap-2">
                                    <span className="hidden sm:inline text-xs">{t('common.view_tx')}</span>
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default function LogsPage() {
    const { t } = useTranslation();
    const { registryAddress } = useWeb3();
    const [activeTab, setActiveTab] = useState<'governance' | 'staking' | 'finance'>('governance');
    const [eventTypeFilter, setEventTypeFilter] = useState('all');

    // خواندن آدرس‌ها
    const { data: daoAddress } = useReadContract({ address: registryAddress, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.DAO] });
    const { data: stakingAddress } = useReadContract({ address: registryAddress, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.STAKING] });
    const { data: financeAddress } = useReadContract({ address: registryAddress, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.FINANCE] });

    return (
        <AppLayout>
            <div className="space-y-8 pb-10">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold font-headline text-gradient">{t('logs_page.title')}</h1>
                        <p className="text-muted-foreground mt-1">{t('logs_page.subtitle')}</p>
                    </div>
                    
                    {/* فیلتر نوع رویداد */}
                    <div className="flex items-center gap-2 bg-card p-1 rounded-lg border shadow-sm">
                        <Filter className="h-4 w-4 ml-2 text-muted-foreground" />
                        <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                            <SelectTrigger className="w-[180px] border-0 focus:ring-0 h-8">
                                <SelectValue placeholder={t('logs_page.filter_placeholder')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('common.all')}</SelectItem>
                                <SelectItem value="proposal">{t('logs_page.filter_proposal')}</SelectItem>
                                <SelectItem value="vote">{t('logs_page.filter_vote')}</SelectItem>
                                <SelectItem value="transfer">{t('logs_page.filter_transfer')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </header>

                {/* تب‌های اصلی با استفاده از StatCard به عنوان دکمه */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard 
                        title={t('logs_page.governance_tab')} 
                        value={t('logs_page.core_system')} 
                        icon={ShieldCheck} 
                        variant={activeTab === 'governance' ? 'default' : 'neutral'}
                        onClick={() => setActiveTab('governance')}
                        description={t('logs_page.governance_events_desc')}
                    />
                    <StatCard 
                        title={t('logs_page.staking_tab')} 
                        value={t('logs_page.staking_protocol')} 
                        icon={Layers} 
                        variant={activeTab === 'staking' ? 'default' : 'neutral'}
                        onClick={() => setActiveTab('staking')}
                        description={t('logs_page.staking_events_desc')}
                    />
                    <StatCard 
                        title={t('logs_page.finance_tab')} 
                        value={t('logs_page.treasury_system')}
                        icon={Banknote} 
                        variant={activeTab === 'finance' ? 'default' : 'neutral'}
                        onClick={() => setActiveTab('finance')}
                        description={t('logs_page.finance_events_desc')}
                    />
                </div>

                {/* کانتینر اصلی */}
                <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        {activeTab === 'governance' && t('logs_page.governance_events')}
                        {activeTab === 'staking' && t('logs_page.staking_events')}
                        {activeTab === 'finance' && t('logs_page.finance_events')}
                    </h2>
                    
                    {activeTab === 'governance' && daoAddress && <EventList contractAddress={daoAddress} contractName="RayanChainDAO" filter={eventTypeFilter} />}
                    {activeTab === 'staking' && stakingAddress && <EventList contractAddress={stakingAddress} contractName="Staking" filter={eventTypeFilter} />}
                    {activeTab === 'finance' && financeAddress && <EventList contractAddress={financeAddress} contractName="Finance" filter={eventTypeFilter} />}
                </div>
            </div>
        </AppLayout>
    );
}