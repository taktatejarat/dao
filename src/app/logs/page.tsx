
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

// Simplified Transaction type based on PolygonScan API response
type Transaction = {
    hash: string;
    from: string;
    to: string;
    value: string;
    timeStamp: string;
    blockNumber: string;
    functionName: string;
    isError: string;
};

interface TransactionTableProps {
    contractAddress: Address | undefined | null;
    contractName: string;
    emptyMessage: string;
}




const TransactionTable: React.FC<TransactionTableProps> = ({ contractAddress, contractName, emptyMessage }) => {
    const { t, locale } = useTranslation();
    const { data: nativeBalance } = useBalance({ address: contractAddress as Address });

    // ✅ ۱. فقط یک درخواست ساده
    const { data: transactions, isLoading, error } = useQuery<Transaction[]>({
        queryKey: ['transactions', contractAddress],
        queryFn: async () => {
            if (!contractAddress) return [];
            const response = await fetch(`/api/transactions?address=${contractAddress}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch transactions.');
            }
            const data = await response.json();
            
            // ✅ ۲. داده‌ها را از کلید 'result' استخراج می‌کنیم
            if (data.status === '1') {
                return data.result || [];
            } else if (data.message === 'No transactions found') {
                return [];
            } else {
                throw new Error(data.result || data.message);
            }
        },
        enabled: !!contractAddress,
    });

    const getTxnDirection = (from: string, to: string) => {
        const fromLower = from.toLowerCase();
        const toLower = to.toLowerCase();
        const contractLower = contractAddress?.toLowerCase();
        
        if (fromLower === contractLower) return 'out';
        if (toLower === contractLower) return 'in';
        return 'self';
    }

    const formatFunctionName = (name: string) => {
        if (!name) return t('logs_page.contract_interaction');
        return name.split('(')[0].replace(/([A-Z])/g, ' $1').trim();
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
        {/* ✅✅✅ ۳. اصلاح کامل ساختار جدول ✅✅✅ */}
        <TableHeader>
            <TableRow>
                <TableHead className="w-[200px]">{t('logs_page.action')}</TableHead>
                <TableHead>{t('logs_page.details')}</TableHead>
                <TableHead className="w-[150px]">{t('logs_page.amount')}</TableHead>
                <TableHead className="w-[200px]">{t('logs_page.date')}</TableHead>
                <TableHead className="text-right w-[50px]">{t('actions')}</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {transactions && transactions.length > 0 ? (
                transactions.map((tx) => (
                    <TableRow key={tx.hash}>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                 {getTxnDirection(tx.from, tx.to) === 'in' ? <ArrowRight className="size-4 text-green-500 shrink-0" /> : <ArrowLeft className="size-4 text-destructive shrink-0" />}
                                 <span className="capitalize font-medium truncate">{formatFunctionName(tx.functionName)}</span>
                                 {tx.isError === '1' && <Badge variant="destructive">{t('logs_page.failed')}</Badge>}
                            </div>
                        </TableCell>
                        <TableCell>
                           <div className="flex flex-col gap-1 text-xs font-mono">
                               <div>
                                   <span className="text-muted-foreground">{t('logs_page.from')}:</span> {formatAddress(tx.from)}
                               </div>
                               <div>
                                   <span className="text-muted-foreground">{t('logs_page.to')}:</span> {formatAddress(tx.to)}
                               </div>
                           </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                            {`${formatNumber(formatEther(BigInt(tx.value)), locale)} ${nativeBalance?.symbol ?? ''}`}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                            {formatLocaleDate(new Date(Number(tx.timeStamp) * 1000), locale, { dateStyle: 'medium', timeStyle: 'short' })}
                        </TableCell>
                        <TableCell className="text-right">
                           <Button variant="ghost" size="icon" asChild>
                               <a href={`https://amoy.polygonscan.com/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer">
                                   <ExternalLink className="h-4 w-4" />
                               </a>
                           </Button>
                        </TableCell>
                    </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">{emptyMessage}</TableCell>
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
                           <TransactionTable 
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
                           <TransactionTable 
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
                            <TransactionTable 
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
