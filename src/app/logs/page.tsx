
"use client";

import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccount, useBalance, useReadContract } from 'wagmi'; // ✅ useReadContract را اضافه می‌کنیم
import { type Address, formatEther } from 'viem';
import { useTranslation } from "@/hooks/use-translation";
import { formatNumber, formatLocaleDate, formatAddress } from "@/lib/utils";
import { ShieldCheck, Layers, Banknote, ExternalLink, Info, AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWeb3 } from '@/context/Web3Provider';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { daoRegistryAbi } from '@/lib/blockchain/generated'; // ✅ از منبع حقیقت واحد استفاده می‌کنیم
import { REGISTRY_KEYS } from '@/lib/blockchain/registry-keys';
import { useQueries } from '@tanstack/react-query'; // ✅ از useQueries استفاده می‌کنیم

// ✅✅✅ NEW: تعریف نوع داده برای رویدادهای پردازش شده
type DaoEvent = {
    eventName: string;
    description: string;
    blockNumber: string;
    transactionHash: string;
    args: any;
};

interface EventTableProps {
    contractAddress: Address | undefined | null;
    contractName: string;
    emptyMessage: string;
}

const EventTable: React.FC<EventTableProps> = ({ contractAddress, contractName, emptyMessage }) => {
    const { t, locale } = useTranslation();

    // ✅ 1. فراخوانی API جدید (/api/events)
    // توجه: ما دیگر از /api/transactions استفاده نمی‌کنیم

    const { data: events, isLoading, error } = useQuery<DaoEvent[]>({
        queryKey: ['events', contractAddress],
        queryFn: async () => {
            if (!contractAddress) return [];

            // ✅✅✅ THE FIX IS HERE ✅✅✅
            // با افزودن این گزینه، به Next.js می‌گوییم که این درخواست باید همیشه پویا باشد
            // و نتیجه آن نباید در زمان بیلد کش شود.
            const response = await fetch(`/api/events`, { cache: 'no-store' });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch events.');
            }
            const data = await response.json();
            
            if (data.success && Array.isArray(data.result)) {
                if (contractName === 'RayanChainDao') {
                    return data.result.filter((e: DaoEvent) => ['ProposalCreated', 'Voted', 'ProposalStateChanged', 'ProposalExecuted'].includes(e.eventName));
                }
                return data.result;
            }
            return [];
        },
        enabled: !!contractAddress,
    });
    
    // ✅ 3. تابع جدید برای ایجاد یک توضیح خوانا از هر رویداد
    const formatEventDescription = (event: DaoEvent) => {
        const { eventName, args } = event;
        switch (eventName) {
            case 'ProposalCreated':
                return `Proposal #${args.id} created by ${formatAddress(args.proposer)}`;
            case 'Voted':
                const voteType = args.vote === 0 ? 'For' : 'Against';
                return `${formatAddress(args.voter)} voted '${voteType}' on Proposal #${args.proposalId} with power ${formatNumber(formatEther(args.weight), locale)}`;
            case 'ProposalStateChanged':
                 const states = ['Pending', 'Validation', 'Voting', 'Approved', 'Rejected', 'Executed', 'Expired', 'Cancelled'];
                return `Proposal #${args.id} state changed to '${states[args.newState] || 'Unknown'}'`;
            case 'ProposalExecuted':
                return `Proposal #${args.id} was executed.`;
            // در آینده، رویدادهای Staked, Unstaked, Delegated و... را نیز اضافه می‌کنیم
            default:
                return `Event: ${eventName}`;
        }
    };

    if (isLoading) {
        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[180px] text-start">{t('logs_page.action')}</TableHead>
                        <TableHead className="text-start">{t('logs_page.details')}</TableHead>
                        <TableHead className="text-start">{t('logs_page.amount')}</TableHead>
                        <TableHead className="text-start">{t('logs_page.date')}</TableHead>
                        <TableHead className="w-[80px] text-end">{t('actions')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 3 }).map((_, i) => (
                       <TableRow key={i}>
                           <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                           <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                           <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                           <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                           <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                       </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    }
    
    if (error) {
        return (
             <Alert variant="destructive" className="m-4">
                 <AlertTriangle className="h-4 w-4" />
                 <AlertTitle>{t('profile_page.error_title')}</AlertTitle>
                 <AlertDescription>{(error as Error).message}</AlertDescription>
             </Alert>
        )
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[250px]">{t('logs_page.action')}</TableHead>
                    <TableHead>{t('logs_page.details')}</TableHead>
                    <TableHead className="w-[200px]">{t('logs_page.date')}</TableHead>
                    <TableHead className="text-right w-[50px]">{t('actions')}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {events && events.length > 0 ? (
                    events.map((event) => (
                        <TableRow key={event.transactionHash + event.eventName}>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                     <Info className="size-4 text-muted-foreground shrink-0" />
                                     <span className="capitalize font-medium">{event.eventName.replace(/([A-Z])/g, ' $1').trim()}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                               <p className="text-sm">{formatEventDescription(event)}</p>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                                {/* برای تاریخ، نیاز به Block Timestamp داریم که API فعلی برنمی‌گرداند. این را در فاز بعد اضافه می‌کنیم. */}
                                Block: {event.blockNumber}
                            </TableCell>
                            <TableCell className="text-right">
                               <Button variant="ghost" size="icon" asChild>
                                   <a href={`https://amoy.polygonscan.com/tx/${event.transactionHash}`} target="_blank" rel="noopener noreferrer">
                                       <ExternalLink className="h-4 w-4" />
                                   </a>
                               </Button>
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">{emptyMessage}</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
};

export default function LogsPage() {
    const { t, locale } = useTranslation();
    const { isConnected } = useAccount();
    const direction = locale === 'fa' ? 'rtl' : 'ltr';
 // ۱. فقط آدرس رجیستری را از Web3Provider می‌گیریم.
 const { registryAddress } = useWeb3();

 // ۲. با استفاده از useReadContract، آدرس‌های دیگر را از رجیستری می‌خوانیم.
 const { data: daoAddress } = useReadContract({ 
     address: registryAddress, 
     abi: daoRegistryAbi, 
     functionName: 'getAddress', 
     args: [REGISTRY_KEYS.DAO],
     query: { enabled: !!registryAddress }
 });
 const { data: stakingAddress } = useReadContract({ 
     address: registryAddress, 
     abi: daoRegistryAbi, 
     functionName: 'getAddress', 
     args: [REGISTRY_KEYS.STAKING],
     query: { enabled: !!registryAddress }
 });
 const { data: financeAddress } = useReadContract({ 
     address: registryAddress, 
     abi: daoRegistryAbi, 
     functionName: 'getAddress', 
     args: [REGISTRY_KEYS.FINANCE],
     query: { enabled: !!registryAddress }
 });
    return (
        <AppLayout>
            <header className="mb-6">
                <h1 className="text-3xl font-bold font-headline">{t('logs_page.title')}</h1>
                <p className="text-muted-foreground">{t('logs_page.subtitle')}</p>
            </header>

            {!isConnected && (
                 <Alert className="my-4">
                    <Info className="h-4 w-4" />
                    <AlertTitle>{t('dashboard.connect_to_see_data_title')}</AlertTitle>
                    <AlertDescription>{t('dashboard.connect_to_see_data')}</AlertDescription>
                </Alert>
            )}

             <Tabs defaultValue="governance" className="w-full mt-4" dir={direction}>
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
                    <TabsTrigger value="governance"><ShieldCheck className="ms-2"/>{t('logs_page.governance_tab')}</TabsTrigger>
                    <TabsTrigger value="staking"><Layers className="ms-2"/>{t('logs_page.staking_tab')}</TabsTrigger>
                    <TabsTrigger value="finance"><Banknote className="ms-2"/>{t('logs_page.finance_tab')}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="governance" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('logs_page.governance_events')}</CardTitle>
                            <CardDescription>{t('logs_page.governance_events_desc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <EventTable 
                                contractName="RayanChainDao"
                                contractAddress={daoAddress} 
                                emptyMessage={t('logs_page.no_governance_logs')} 
                           />
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="staking" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('logs_page.staking_events')}</CardTitle>
                            <CardDescription>{t('logs_page.staking_events_desc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <EventTable 
                                contractName="Staking"
                                contractAddress={stakingAddress} 
                                emptyMessage={t('logs_page.no_staking_logs')} 
                           />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="finance" className="mt-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>{t('logs_page.finance_events')}</CardTitle>
                            <CardDescription>{t('logs_page.finance_events_desc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <EventTable 
                                contractName="Finance"
                                contractAddress={financeAddress} 
                                emptyMessage={t('logs_page.no_finance_logs')} 
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </AppLayout>
    );
}
