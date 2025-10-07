"use client";

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { useWeb3 } from '@/context/Web3Provider';
import { useTranslation } from '@/hooks/use-translation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Banknote, Calendar, Check, Clock, Info, ShieldCheck, User, Users, X } from 'lucide-react';
import { formatNumber, formatLocaleDate, formatAddress } from '@/lib/utils';
import { formatEther, type Address } from 'viem';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useReadContract } from 'wagmi';
import { daoRegistryAbi, rayanChainDaoAbi } from '@/lib/blockchain/generated';
import { REGISTRY_KEYS } from '@/lib/blockchain/registry-keys';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { useProposalVote } from '@/hooks/useProposalVote';

// --- Helper Components & Functions (بدون تغییر) ---

const InfoCard = ({ icon: Icon, title, value }: { icon: React.ElementType, title: string, value: string | number }) => (
    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <Icon className="w-6 h-6 text-muted-foreground" />
        <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="font-semibold">{value}</p>
        </div>
    </div>
);

const getStatusInfo = (state: bigint, t: (key: string) => string) => {
    switch (state) {
        case 0n: return { text: t('proposal_detail.status.pending'), color: 'bg-gray-500', icon: Clock };
        case 1n: return { text: t('proposal_detail.status.active'), color: 'bg-blue-500', icon: Clock };
        case 2n: return { text: t('proposal_detail.status.voting'), color: 'bg-yellow-500', icon: Clock };
        case 3n: return { text: t('proposal_detail.status.approved'), color: 'bg-green-600', icon: Check };
        case 4n: return { text: t('proposal_detail.status.rejected'), color: 'bg-red-600', icon: X };
        case 5n: return { text: t('proposal_detail.status.executed'), color: 'bg-purple-600', icon: ShieldCheck };
        default: return { text: t('proposal_detail.status.unknown'), color: 'bg-gray-700', icon: Info };
    }
};

const SkeletonUI = () => (
    <div className="space-y-6">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <Card>
            <CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-5/6" />
            </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card><CardContent className="p-6 space-y-4"><Skeleton className="h-6 w-1/3" /><Skeleton className="h-10 w-full" /></CardContent></Card>
            <Card><CardContent className="p-6 space-y-4"><Skeleton className="h-6 w-1/3" /><Skeleton className="h-10 w-full" /></CardContent></Card>
        </div>
    </div>
);

const PROPOSAL_STATE_VOTING = 2n;

// --- Main Component ---
export default function ProposalDetailPage() {
    const { t, locale } = useTranslation();
    const { registryAddress, isHydrated } = useWeb3();
    const params = useParams();
    const proposalId = useMemo(() => BigInt(params.id as string), [params.id]);

    const { data: daoAddressResult, isLoading: isDaoAddressLoading } = useReadContract({
        address: (registryAddress || undefined) as Address | undefined,
        abi: daoRegistryAbi,
        functionName: 'getAddress',
        args: [REGISTRY_KEYS.DAO] as const,
        query: { enabled: !!registryAddress && isHydrated },
    });
    const daoAddress = daoAddressResult as Address | undefined;

    const { data: proposalResult, isLoading: isProposalLoading, error } = useReadContract({
        address: daoAddress,
        abi: rayanChainDaoAbi,
        functionName: 'proposals',
        args: [proposalId],
        query: { enabled: !!daoAddress },
    });
    
    const proposal = useMemo(() => {
        // The result from wagmi is an object-like array.
        // We check for a key property to ensure it's the expected object.
        if (!proposalResult || typeof proposalResult !== 'object' || !('id' in proposalResult)) {
            return undefined;
        }

        // Now we can safely access properties by name, which is more robust and readable.
        // TypeScript can infer these types much more reliably from the ABI.
        const resultAsObject = proposalResult as any;
        return {
            id: resultAsObject.id,
            title: resultAsObject.title,
            description: resultAsObject.description,
            proposer: resultAsObject.proposer,
            amount: resultAsObject.amount,
            forVotes: resultAsObject.forVotes,
            againstVotes: resultAsObject.againstVotes,
            state: resultAsObject.state,
            deadline: resultAsObject.deadline,
            executed: resultAsObject.executed,
        };
    }, [proposalResult]);
    
    const { handleVote, isVotingPending, canVoteFor, canVoteAgainst } = useProposalVote({
        daoAddress,
        proposalId,
        isVotingActive: !!proposal && proposal.state === PROPOSAL_STATE_VOTING,
    });
    
    const isLoading = isDaoAddressLoading || isProposalLoading;

    if (isLoading) {
        return <AppLayout><SkeletonUI /></AppLayout>;
    }

    if (error || !proposal) {
        return (
            <AppLayout>
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{t('proposal_detail.error_loading_title')}</AlertTitle>
                    <AlertDescription>{t('proposal_detail.error_loading_desc')}</AlertDescription>
                </Alert>
            </AppLayout>
        );
    }
    
    const totalVotes = proposal.forVotes + proposal.againstVotes;
    const forPercentage = totalVotes > 0n ? Number((proposal.forVotes * 100n) / totalVotes) : 0;
    const againstPercentage = totalVotes > 0n ? 100 - forPercentage : 0;
    const { text: statusText, color: statusColor, icon: StatusIcon } = getStatusInfo(proposal.state, t);

    return (
        <AppLayout>
            <header className="mb-6">
                <div className="flex items-center gap-3">
                     <Badge className={`${statusColor} hover:${statusColor} flex items-center gap-2`}>
                        <StatusIcon className="w-4 h-4" />
                        <span>{statusText}</span>
                    </Badge>
                    <h1 className="text-3xl font-bold font-headline">{proposal.title}</h1>
                </div>
                <p className="text-muted-foreground mt-2">
                    {t('proposal_detail.proposal_id_prefix')} <span className="font-mono">#{proposal.id.toString()}</span>
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>{t('proposal_detail.description')}</CardTitle></CardHeader>
                        <CardContent><p className="text-muted-foreground">{proposal.description}</p></CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>{t('proposal_detail.voting_results')}</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="flex justify-between mb-1 text-sm">
                                    <span className="font-medium text-green-600">{t('proposal_detail.votes_for')}</span>
                                    <span>{formatNumber(formatEther(proposal.forVotes), locale)} ({forPercentage}%)</span>
                                </div>
                                <Progress value={forPercentage} className="h-3 [&>*]:bg-green-600" />
                            </div>
                            <div>
                                <div className="flex justify-between mb-1 text-sm">
                                    <span className="font-medium text-destructive">{t('proposal_detail.votes_against')}</span>
                                    <span>{formatNumber(formatEther(proposal.againstVotes), locale)} ({againstPercentage}%)</span>
                                </div>
                                <Progress value={againstPercentage} className="h-3 [&>*]:bg-destructive" />
                            </div>
                        </CardContent>
                        {proposal.state === PROPOSAL_STATE_VOTING && (
                            <CardFooter className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Button size="lg" className="bg-green-600 hover:bg-green-700 w-full" onClick={() => handleVote('for')} disabled={!canVoteFor || isVotingPending}>
                                    {isVotingPending ? <DaoLoadingSpinner /> : <Check className="me-2"/>}
                                    {t('proposal_detail.vote_for')}
                                </Button>
                                <Button size="lg" variant="destructive" className="w-full" onClick={() => handleVote('against')} disabled={!canVoteAgainst || isVotingPending}>
                                    {isVotingPending ? <DaoLoadingSpinner /> : <X className="me-2"/>}
                                    {t('proposal_detail.vote_against')}
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                </div>
                
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>{t('proposal_detail.details')}</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <InfoCard icon={User} title={t('proposal_detail.proposer')} value={formatAddress(proposal.proposer)} />
                            <InfoCard icon={Banknote} title={t('proposal_detail.amount_requested')} value={`${formatNumber(formatEther(proposal.amount), locale)} RYC`} />
                            <InfoCard icon={Calendar} title={t('proposal_detail.voting_deadline')} value={formatLocaleDate(new Date(Number(proposal.deadline) * 1000), locale)} />
                            <InfoCard icon={Users} title={t('proposal_detail.total_votes')} value={formatNumber(formatEther(totalVotes), locale)} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}