// src/app/logs/page.tsx - FINAL, ADVANCED VERSION WITH FILTERS & PAGINATION

"use client";

import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccount, useReadContract } from 'wagmi';
import { type Address } from 'viem';
import { useTranslation } from "@/hooks/use-translation";
import { formatLocaleDate, formatAddress } from "@/lib/utils";
import { ShieldCheck, Layers, Banknote, ExternalLink, Info, AlertTriangle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWeb3 } from '@/context/Web3Provider';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { daoRegistryAbi } from '@/lib/blockchain/generated';
import { REGISTRY_KEYS } from '@/lib/blockchain/registry-keys';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { useLanguage } from '@/context/LanguageProvider';
import { Input } from '@/components/ui/input';

type DaoEvent = {
    eventName: string;
    description: string;
    blockNumber: string;
    timeStamp: string;
    transactionHash: string;
    args: any;
};

interface EventTableProps {
    contractAddress: Address;
    contractName: string;
    emptyMessage: string;
}

const EventTable: React.FC<EventTableProps> = ({ contractAddress, contractName, emptyMessage }) => {
    const { t, locale } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;

    const { data: response, isLoading, error } = useQuery<{ success: boolean; result: DaoEvent[] }>({
        queryKey: ['events', contractAddress, contractName],
        queryFn: async () => {
            const params = new URLSearchParams({
                contractAddress: contractAddress,
                contractName: contractName,
            });
            const res = await fetch(`/api/events?${params.toString()}`, { cache: 'no-store' });
            if (!res.ok) throw new Error('Failed to fetch events.');
            return res.json();
        },
        enabled: !!contractAddress && !!contractName, 
    });

    const filteredEvents = useMemo(() => {
        if (!response?.result) return [];
        return response.result.filter(event => 
            event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.transactionHash.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [response, searchTerm]);
    
    const paginatedEvents = useMemo(() => {
        return filteredEvents.slice((page - 1) * itemsPerPage, page * itemsPerPage);
    }, [filteredEvents, page, itemsPerPage]);

    const totalPages = useMemo(() => Math.ceil(filteredEvents.length / itemsPerPage), [filteredEvents]);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by details or transaction hash..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPage(1); // Reset to first page on new search
                        }}
                        className="pl-10"
                    />
                </div>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">Action</TableHead>
                            <TableHead>Details</TableHead>
                            <TableHead className="w-[200px]">Date</TableHead>
                            <TableHead className="text-right w-[50px]">Link</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                               <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                            ))
                        ) : error ? (
                            <TableRow><TableCell colSpan={4} className="text-center text-destructive py-8">{(error as Error).message}</TableCell></TableRow>
                        ) : paginatedEvents.length > 0 ? (
                            paginatedEvents.map((event, index) => (
                                <TableRow key={`${event.transactionHash}-${index}`}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                             <Info className="size-4 text-muted-foreground shrink-0" />
                                             <span className="capitalize font-medium">{event.eventName.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell><p className="text-sm font-medium">{event.description}</p></TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                       {formatLocaleDate(new Date(Number(event.timeStamp) * 1000), locale, { dateStyle: 'medium', timeStyle: 'short' })}
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
                            <TableRow><TableCell colSpan={4} className="h-24 text-center">{emptyMessage}</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages > 0 ? totalPages : 1}
                </span>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Previous</Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</Button>
                </div>
            </div>
        </div>
    );
};


// The LogsPage component remains the same, it doesn't need changes.
export default function LogsPage() {
    const { t } = useTranslation();
    const { isConnected } = useAccount();
    const { registryAddress } = useWeb3();
    const { direction } = useLanguage();

    const { data: daoAddress, isLoading: isLoadingDaoAddress } = useReadContract({ 
        address: registryAddress, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.DAO], query: { enabled: !!registryAddress }
    });
    const { data: stakingAddress, isLoading: isLoadingStakingAddress } = useReadContract({ 
        address: registryAddress, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.STAKING], query: { enabled: !!registryAddress }
    });
    const { data: financeAddress, isLoading: isLoadingFinanceAddress } = useReadContract({ 
        address: registryAddress, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.FINANCE], query: { enabled: !!registryAddress }
    });

    const areAddressesLoading = isLoadingDaoAddress || isLoadingStakingAddress || isLoadingFinanceAddress;

    const renderContent = (
        isLoading: boolean, 
        address: Address | undefined, 
        contractName: string, 
        emptyMessage: string
    ) => {
        if (isLoading) {
            return <div className="flex justify-center p-8"><DaoLoadingSpinner /></div>;
        }
        if (address) {
            return <EventTable contractName={contractName} contractAddress={address} emptyMessage={emptyMessage} />;
        }
        return <p className="text-center text-muted-foreground p-8">Could not load {contractName} contract address.</p>;
    };

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
                    <TabsTrigger value="governance"><ShieldCheck className="me-2"/>{t('logs_page.governance_tab')}</TabsTrigger>
                    <TabsTrigger value="staking"><Layers className="me-2"/>{t('logs_page.staking_tab')}</TabsTrigger>
                    <TabsTrigger value="finance"><Banknote className="me-2"/>{t('logs_page.finance_tab')}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="governance" className="mt-6">
                    <Card>
                        <CardHeader><CardTitle>{t('logs_page.governance_events')}</CardTitle><CardDescription>{t('logs_page.governance_events_desc')}</CardDescription></CardHeader>
                        <CardContent>
                            {renderContent(areAddressesLoading, daoAddress, "RayanChainDao", t('logs_page.no_governance_logs'))}
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="staking" className="mt-6">
                    <Card>
                        <CardHeader><CardTitle>{t('logs_page.staking_events')}</CardTitle><CardDescription>{t('logs_page.staking_events_desc')}</CardDescription></CardHeader>
                        <CardContent>
                            {renderContent(areAddressesLoading, stakingAddress, "Staking", t('logs_page.no_staking_logs'))}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="finance" className="mt-6">
                     <Card>
                        <CardHeader><CardTitle>{t('logs_page.finance_events')}</CardTitle><CardDescription>{t('logs_page.finance_events_desc')}</CardDescription></CardHeader>
                        <CardContent>
                            {renderContent(areAddressesLoading, financeAddress, "Finance", t('logs_page.no_finance_logs'))}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </AppLayout>
    );
}