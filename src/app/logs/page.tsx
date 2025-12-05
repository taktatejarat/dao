// src/app/logs/page.tsx - FINAL FIXED (I18N + USER DETECTION)

"use client";

import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useReadContract } from 'wagmi';
import { type Address, formatEther } from 'viem';
import { useTranslation } from '@/hooks/use-translation';
import { formatLocaleDate, formatAddress, formatNumber } from "@/lib/utils";
import { 
    Activity, Search, Filter, ExternalLink, 
    ShieldCheck, Layers, Banknote, Clock
} from 'lucide-react';
import { useWeb3 } from '@/context/Web3Provider';
import { useQuery } from '@tanstack/react-query';
import { daoRegistryAbi } from '@/lib/blockchain/generated';
import { REGISTRY_KEYS } from '@/lib/blockchain/registry-keys';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { StatCard } from '@/components/dashboard/stat-card';

// نوع داده‌ها
type DaoEvent = {
    eventName: string;
    blockNumber: string;
    timeStamp: string;
    transactionHash: string;
    args: any;
};

// --- Helper to Fix Type Error ---
const useSafeTranslation = () => {
    const { t: originalT, locale } = useTranslation();
    const t = (key: string, params?: any) => (originalT as any)(key, params);
    return { t, locale };
};

// کامپوننت لیست رویدادها
const EventList = ({ contractAddress, contractName, filter }: { contractAddress: Address; contractName: string; filter: string }) => {
    const { t, locale } = useSafeTranslation();
    const [searchTerm, setSearchTerm] = useState('');

    const { data: response, isLoading, error } = useQuery<{ success: boolean; result: DaoEvent[] }>({
        queryKey: ['events', contractAddress, contractName],
        queryFn: async () => {
            const params = new URLSearchParams({ contractAddress, contractName });
            const res = await fetch(`/api/events?${params.toString()}`, { cache: 'no-store' });
            if (!res.ok) throw new Error(t('logs_page.fetch_error'));
            return res.json();
        },
        enabled: !!contractAddress, 
    });

    // پردازش و ترجمه رویدادها
    const processedEvents = useMemo(() => {
        if (!response?.result) return [];

        return response.result.map(event => {
            const args = event.args || {};
            let description = '';
            let userAddress = '';

            // منطق تشخیص کاربر و ساخت توضیحات ترجمه شده
            switch (event.eventName) {
                case 'ProposalCreated':
                    userAddress = args.proposer;
                    description = t('activities.proposal_created', { id: args.id?.toString() });
                    break;
                case 'Voted':
                    userAddress = args.voter;
                    const voteText = args.vote === 0 ? t('proposal_detail.vote_for') : t('proposal_detail.vote_against');
                    description = t('activities.voted', { id: args.proposalId?.toString(), vote: voteText });
                    break;
                case 'Staked':
                    userAddress = args.user;
                    description = t('activities.staked', { amount: formatNumber(formatEther(args.amount || 0n), locale) });
                    break;
                case 'Unstaked':
                    userAddress = args.user;
                    description = t('activities.unstaked', { amount: formatNumber(formatEther(args.amount || 0n), locale) });
                    break;
                case 'RewardClaimed':
                    userAddress = args.user;
                    description = t('activities.reward_claimed', { amount: formatNumber(formatEther(args.reward || 0n), locale) });
                    break;
                case 'InvestmentReceived':
                    userAddress = args.investor;
                    description = t('activities.invested', { amount: formatNumber(formatEther(args.amount || 0n), locale), id: args.proposalId?.toString() });
                    break;
                case 'ProposalStateChanged':
                    // این رویداد سیستمی است
                    const states = ['Pending', 'Validation', 'Voting', 'Approved', 'Rejected', 'Executed', 'Expired', 'Cancelled', 'Funding', 'Funded', 'Failed'];
                    const stateName = states[Number(args.newState)] || 'Unknown';
                    description = t('activities.state_changed', { id: args.id?.toString(), state: stateName });
                    break;
                default:
                    userAddress = args.user || args.from || args.account;
                    description = t('activities.unknown_action') + ` (${event.eventName})`;
            }

            return {
                ...event,
                processedDescription: description,
                userDisplay: userAddress ? formatAddress(userAddress) : t('activities.system')
            };
        });
    }, [response, t, locale]);

    // اعمال فیلترها
    const filteredEvents = useMemo(() => {
        let filtered = processedEvents;

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(e => 
                e.processedDescription.toLowerCase().includes(lowerTerm) ||
                e.transactionHash.toLowerCase().includes(lowerTerm) ||
                e.userDisplay.toLowerCase().includes(lowerTerm)
            );
        }

        if (filter !== 'all') {
            const lowerFilter = filter.toLowerCase();
            filtered = filtered.filter(e => e.eventName.toLowerCase().includes(lowerFilter));
        }

        return filtered;
    }, [processedEvents, searchTerm, filter]);

    if (isLoading) return <div className="flex justify-center p-12"><DaoLoadingSpinner /></div>;
    if (error) return <div className="text-destructive text-center p-8">{(error as Error).message}</div>;
    if (filteredEvents.length === 0) return <div className="text-muted-foreground text-center p-12 bg-muted/20 rounded-xl border border-dashed">{t('logs_page.no_data')}</div>;

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

            <div className="space-y-3">
                {filteredEvents.map((event, idx) => (
                    <Card key={`${event.transactionHash}-${idx}`} className="group hover:shadow-md transition-all duration-300 border-l-4 border-l-primary/50">
                        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                            <div className="flex items-start gap-4">
                                <div className="p-2 rounded-full bg-primary/10 mt-1 sm:mt-0 text-primary">
                                    <Activity className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline" className="font-mono text-xs bg-muted/50">
                                            {event.userDisplay}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatLocaleDate(new Date(Number(event.timeStamp) * 1000), locale)}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium leading-relaxed text-foreground/90">
                                        {event.processedDescription}
                                    </p>
                                </div>
                            </div>
                            
                            <Button variant="ghost" size="sm" asChild className="shrink-0 opacity-70 group-hover:opacity-100 transition-opacity hover:text-primary">
                                <a href={`https://amoy.polygonscan.com/tx/${event.transactionHash}`} target="_blank" rel="noopener noreferrer" className="gap-2">
                                    <span className="hidden sm:inline text-xs">{t('common.view_tx')}</span>
                                    <ExternalLink className="h-4 w-4 rtl:rotate-180" />
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
    const { t } = useSafeTranslation();
    const { registryAddress } = useWeb3();
    const [activeTab, setActiveTab] = useState<'governance' | 'staking' | 'finance'>('governance');
    const [eventTypeFilter, setEventTypeFilter] = useState('all');

    // خواندن آدرس‌ها
    const { data: daoAddress } = useReadContract({ address: registryAddress as Address, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.DAO] });
    const { data: stakingAddress } = useReadContract({ address: registryAddress as Address, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.STAKING] });
    const { data: financeAddress } = useReadContract({ address: registryAddress as Address, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.FINANCE] });

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
                            <SelectTrigger className="w-[180px] border-0 focus:ring-0 h-8 bg-transparent">
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

                {/* تب‌های اصلی */}
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
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
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