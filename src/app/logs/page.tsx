// src/app/logs/page.tsx - FINAL, COMPLETE, AND ERROR-FREE VERSION

"use client";

import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccount, useReadContract } from 'wagmi';
import { type Address, formatEther } from 'viem';
import { useTranslation } from "@/hooks/use-translation";
import { formatNumber, formatLocaleDate, formatAddress } from "@/lib/utils";
import { ShieldCheck, Layers, Banknote, ExternalLink, Info, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWeb3 } from '@/context/Web3Provider';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { daoRegistryAbi } from '@/lib/blockchain/generated';
import { REGISTRY_KEYS } from '@/lib/blockchain/registry-keys';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { useLanguage } from '@/context/LanguageProvider';

type DaoEvent = {
    eventName: string;
    description: string;
    blockNumber: string;
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
    
    const { data: events, isLoading, error } = useQuery<DaoEvent[]>({
        queryKey: ['events', contractAddress, contractName],
        queryFn: async () => {
            if (!contractAddress || !contractName) return [];
            const response = await fetch(`/api/events?contractAddress=${contractAddress}&contractName=${contractName}`, { cache: 'no-store' });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch events.');
            }
            const data = await response.json();
            return data.success ? data.result : [];
        },
        enabled: !!contractAddress && !!contractName, 
    });
    
    const formatEventDescription = (event: DaoEvent) => {
        // This can be expanded later
        return event.description;
    };

    if (isLoading) {
        return (
            <div className="space-y-2 p-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        );
    }
    
    if (error) {
        return (
             <Alert variant="destructive" className="m-4">
                 <AlertTriangle className="h-4 w-4" />
                 <AlertTitle>{t('profile_page.error_title')}</AlertTitle>
                 <AlertDescription>{(error as Error).message}</AlertDescription>
             </Alert>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[200px]">{t('logs_page.action')}</TableHead>
                    <TableHead>{t('logs_page.details')}</TableHead>
                    <TableHead className="w-[150px]">Block Number</TableHead>
                    <TableHead className="text-right w-[50px]">{t('actions')}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {events && events.length > 0 ? (
                    events.map((event, index) => (
                        <TableRow key={`${event.transactionHash}-${index}`}>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                     <Info className="size-4 text-muted-foreground shrink-0" />
                                     <span className="capitalize font-medium">{event.eventName.replace(/([A-Z])/g, ' $1').trim()}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                               <p className="text-sm">{formatEventDescription(event)}</p>
                            </TableCell>
                            <TableCell className="text-xs font-mono text-muted-foreground">
                                {event.blockNumber}
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