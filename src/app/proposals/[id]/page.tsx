// src/app/proposals/[id]/page.tsx - FIXED TYPE ERRORS

"use client";

import { useMemo, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/app-layout';
import { useWeb3 } from '@/context/Web3Provider';
import { useTranslation } from '@/hooks/use-translation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
    BrainCircuit, AlertTriangle, Banknote, Calendar, Check, Clock, ShieldCheck, 
    User, Users, X, PlayCircle, CheckCircle, LineChart, XCircle, TrendingUp, 
    Wallet, Info, Hash, Lock
} from 'lucide-react';
import { formatNumber, formatLocaleDate, formatAddress } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useReadContract, useWriteContract } from 'wagmi';
import { rayanChainDaoAbi, rayanChainTokenAbi } from '@/lib/blockchain/generated';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { useProposalVote } from '@/hooks/useProposalVote'; 
import { useProposalExecute } from '@/hooks/useProposalExecute'; 
import { ProposalTimeline } from '@/components/proposals/proposal-timeline';
import { formatEther, type Address, parseAbi, parseEther } from 'viem';
import { useMilestoneRelease } from '@/hooks/useMilestoneRelease';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress"; 
import { Input } from "@/components/ui/input"; 
import { toast } from 'sonner';
import { StatCard } from '@/components/dashboard/stat-card';

// ABIs defined outside component
const VOTING_POWER_ABI = parseAbi(['function votingPower(address account) view returns (uint256)']);
const INVEST_ABI = parseAbi(['function invest(uint256 _proposalId, uint256 _amount) external']);
const REFUND_ABI = parseAbi(['function claimRefund(uint256 _proposalId) external']);

interface OnChainProposal { 
    id: bigint; proposer: Address; amount: bigint; deadline: bigint; 
    forVotes: bigint; againstVotes: bigint; state: number; executed: boolean; 
    aiRiskScore: bigint; totalRaised: bigint; fundingDeadline: bigint;
}

const getStatusInfo = (state: number, t: (key: string) => string) => {
    switch (state) {
        case 0: return { text: t('proposal_detail.status.pending'), color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: Clock };
        case 1: return { text: t('proposal_detail.status.validation'), color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20', icon: ShieldCheck };
        case 2: return { text: t('proposal_detail.status.active'), color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: PlayCircle }; 
        case 3: return { text: t('proposal_detail.status.succeeded'), color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle }; 
        case 4: return { text: t('proposal_detail.status.defeated'), color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: XCircle }; 
        case 5: return { text: t('proposal_detail.status.executed'), color: 'bg-emerald-600/10 text-emerald-600 border-emerald-600/20', icon: ShieldCheck };
        case 6: return { text: t('proposal_detail.status.expired'), color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', icon: AlertTriangle };
        case 7: return { text: t('proposal_detail.status.canceled'), color: 'bg-gray-500/10 text-gray-500 border-gray-500/20', icon: X };
        case 8: return { text: "Funding", color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20', icon: Banknote };
        case 9: return { text: "Funded", color: 'bg-teal-500/10 text-teal-500 border-teal-500/20', icon: CheckCircle };
        case 10: return { text: "Funding Failed", color: 'bg-rose-500/10 text-rose-500 border-rose-500/20', icon: AlertTriangle };
        default: return { text: t('proposal_detail.status.unknown'), color: 'bg-gray-500', icon: Info };
    }
};

const PROPOSAL_STATE_VOTING = 2;
const PROPOSAL_STATE_APPROVED = 3;
const PROPOSAL_STATE_FUNDING = 8;
const PROPOSAL_STATE_FUNDED = 9;
const PROPOSAL_STATE_FUNDING_FAILED = 10;

export default function ProposalDetailPage() {
    const { t, locale } = useTranslation();
    const router = useRouter();
    const { daoAddress, tokenAddress, stakingAddress, isHydrated: isWeb3Hydrated, userRole, address } = useWeb3();
    const params = useParams();
    const proposalIdParam = params.id as string;

    const [offChainData, setOffChainData] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showStakingAlert, setShowStakingAlert] = useState(false);
    
    const [proofText, setProofText] = useState("");
    const [isReleaseDialogOpen, setIsReleaseDialogOpen] = useState(false);
    const [investAmount, setInvestAmount] = useState("");

    // 1. Fetch Off-Chain Data
    useEffect(() => {
        const fetchAllData = async () => {
            if (!proposalIdParam) { setIsLoading(false); return; }
            setIsLoading(true);
            try {
                const response = await fetch(`/api/proposals/${proposalIdParam}`);
                const result = await response.json();
                if (!response.ok || !result.success) throw new Error(result.message || 'Failed to fetch proposal.');
                setOffChainData(result.data);
            } catch (err) { setError((err as Error).message); } 
            finally { setIsLoading(false); }
        };
        fetchAllData();
    }, [proposalIdParam]);

    const onChainProposalId = useMemo(() => {
        const raw = offChainData?.proposalIdOnChain;
        if (raw == null) return null;
        try { return BigInt(raw.toString()); } catch { return null; }
    }, [offChainData]);

    // ✅ FIX: Added 'as const' to fix type mismatch (bigint[] vs readonly [bigint])
    const contractReadArgs = useMemo(() => 
        onChainProposalId ? ([onChainProposalId] as const) : undefined
    , [onChainProposalId]);

    // 2. Fetch On-Chain Data
    const { data: onChainResult, isLoading: isOnChainLoading, error: onChainError } = useReadContract({
        address: daoAddress,
        abi: rayanChainDaoAbi,
        functionName: 'proposals',
        args: contractReadArgs, 
        query: { enabled: isWeb3Hydrated && !!daoAddress && !!onChainProposalId },
    });

    // 3. User Voting Power
    // ✅ FIX: Added 'as const' to fix type mismatch (string[] vs readonly [Address])
    const votingPowerArgs = useMemo(() => address ? ([address] as const) : undefined, [address]);
    
    const { data: userVotingPower } = useReadContract({
        address: stakingAddress, 
        abi: VOTING_POWER_ABI, 
        functionName: 'votingPower', 
        args: votingPowerArgs,
        query: { enabled: !!address && !!stakingAddress }
    });

    // 4. Token Supply
    const { data: tokenTotalSupply } = useReadContract({
        address: tokenAddress,
        abi: rayanChainTokenAbi,
        functionName: 'totalSupply',
        query: { enabled: !!tokenAddress }
    });

    const onChainData = useMemo((): OnChainProposal | null => {
        if (!onChainResult || !Array.isArray(onChainResult)) return null;
        const result = onChainResult as any[];
        return {
            id: result[0],
            proposer: result[2],
            amount: result[5],
            deadline: result[8],
            forVotes: result[9],
            againstVotes: result[10],
            state: Number(result[11]), 
            executed: result[12],
            aiRiskScore: result[14], 
            totalRaised: result[17] || 0n, 
            fundingDeadline: result[19] || 0n 
        };
    }, [onChainResult]);

    // SMART LOGIC: محاسبه وضعیت واقعی بر اساس زمان و آرا 
    const smartStatus = useMemo(() => {
        if (!onChainData) return null;
        const now = Date.now() / 1000; // time in seconds
        const deadline = Number(onChainData.deadline);
        const state = onChainData.state;
        const forVotes = onChainData.forVotes;
        const againstVotes = onChainData.againstVotes;

        // اگر در حال رأی‌گیری است اما زمان تمام شده
        if (state === PROPOSAL_STATE_VOTING && now > deadline) {
            if (forVotes > againstVotes) {
                // رأی آورده ولی هنوز Execute نشده
                return { state: 3, label: t('proposal_detail.status.succeeded'), color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: CheckCircle };
            } else {
                // رأی نیاورده و منقضی شده
                return { state: 4, label: t('proposal_detail.status.defeated'), color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: XCircle };
            }
        }

        // حالت‌های استاندارد
        switch (state) {
            case 0: return { state: 0, label: t('proposal_detail.status.pending'), color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: Clock };
            case 1: return { state: 1, label: t('proposal_detail.status.validation'), color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20', icon: ShieldCheck };
            case 2: return { state: 2, label: t('proposal_detail.status.active'), color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: PlayCircle }; 
            case 3: return { state: 3, label: t('proposal_detail.status.succeeded'), color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle }; 
            case 4: return { state: 4, label: t('proposal_detail.status.defeated'), color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: XCircle }; 
            case 5: return { state: 5, label: t('proposal_detail.status.executed'), color: 'bg-emerald-600/10 text-emerald-600 border-emerald-600/20', icon: ShieldCheck };
            case 6: return { state: 6, label: t('proposal_detail.status.expired'), color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', icon: AlertTriangle };
            case 7: return { state: 7, label: t('proposal_detail.status.canceled'), color: 'bg-gray-500/10 text-gray-500 border-gray-500/20', icon: X };
            case 8: return { state: 8, label: "Funding", color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20', icon: Banknote };
            case 9: return { state: 9, label: "Funded", color: 'bg-teal-500/10 text-teal-500 border-teal-500/20', icon: CheckCircle };
            case 10: return { state: 10, label: "Funding Failed", color: 'bg-rose-500/10 text-rose-500 border-rose-500/20', icon: AlertTriangle };
            default: return { state: -1, label: t('proposal_detail.status.unknown'), color: 'bg-gray-500', icon: Info };
        }
    }, [onChainData, t]);

    const isVotingAllowed = useMemo(() => {
        if (!onChainData) return false;
        const now = Date.now() / 1000;
        // فقط اگر وضعیت Voting باشد و زمان نگذشته باشد
        return onChainData.state === PROPOSAL_STATE_VOTING && now <= Number(onChainData.deadline);
    }, [onChainData]);

    const aiMetrics = useMemo(() => {
        if (!offChainData?.aiAnalysis) return null;
        const financial = offChainData.aiAnalysis.financialAnalysis || {};
        const marketScoreRaw = financial.market_sentiment_score ?? offChainData.aiAnalysis.market_sentiment ?? 0;
        const teamScoreRaw = financial.team_competency_score ?? offChainData.aiAnalysis.team_score ?? 0;
        return {
            marketScore: typeof marketScoreRaw === 'number' ? `${(marketScoreRaw * 100).toFixed(0)}%` : 'N/A',
            teamScore: typeof teamScoreRaw === 'number' ? `${(teamScoreRaw * 100).toFixed(0)}%` : 'N/A',
        };
    }, [offChainData]);

    const { writeContractAsync: investAsync } = useWriteContract();
    
    const handleInvest = async () => {
        if (!daoAddress || !onChainProposalId) return;
        try {
            const toastId = toast.loading("Processing investment...");
            await investAsync({
                address: daoAddress,
                abi: INVEST_ABI,
                functionName: 'invest',
                args: [onChainProposalId, parseEther(investAmount)]
            });
            toast.success("Investment submitted!", { id: toastId });
            setInvestAmount("");
        } catch (e) { 
            console.error(e);
            toast.error("Investment failed. Check wallet balance and approval."); 
        }
    };

    const { writeContractAsync: refundAsync } = useWriteContract();
    const handleRefund = async () => {
        if (!daoAddress || !onChainProposalId) return;
        try {
            const toastId = toast.loading("Processing refund...");
            await refundAsync({
                address: daoAddress,
                abi: REFUND_ABI,
                functionName: 'claimRefund',
                args: [onChainProposalId]
            });
            toast.success("Refund claimed!", { id: toastId });
        } catch (e) {
            console.error(e);
            toast.error("Refund failed.");
        }
    };

    const { requestRelease, isreleasing } = useMilestoneRelease({
        daoAddress,
        originalProposalId: onChainProposalId || 0n
    });

    const isProjectOwner = address && onChainData && (address.toLowerCase() === onChainData.proposer.toLowerCase());

    const { handleVote: submitVote, isVotingPending, hasVoted } = useProposalVote({
        daoAddress,
        proposalId: onChainProposalId!,
        isVotingActive: isVotingAllowed, // ✅ استفاده از وضعیت هوشمند
    });
    
    const { handleExecute, isExecuting } = useProposalExecute({
        daoAddress,
        proposalId: onChainProposalId!,
        isExecutable: !!onChainData && onChainData.state === PROPOSAL_STATE_APPROVED && !onChainData.executed,
    });

    const handleVoteClick = (voteType: 'for' | 'against') => {
        if (!userVotingPower || userVotingPower === 0n) {
            setShowStakingAlert(true); 
            return;
        }
        submitVote(voteType);
    };

    const finalError = error || onChainError?.message;
    
    if (finalError) {
        return <AppLayout><Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>{t('common.error')}</AlertTitle><AlertDescription>{finalError}</AlertDescription></Alert></AppLayout>;
    }
    
    const networkTotal = tokenTotalSupply ? BigInt(tokenTotalSupply.toString()) : 0n;
    const forVotesBig = onChainData ? BigInt(onChainData.forVotes) : 0n;
    const againstVotesBig = onChainData ? BigInt(onChainData.againstVotes) : 0n;

    let forPercentageRaw = 0;
    let againstPercentageRaw = 0;

    if (networkTotal > 0n) {
        forPercentageRaw = Number((forVotesBig * 10000n) / networkTotal) / 100;
        againstPercentageRaw = Number((againstVotesBig * 10000n) / networkTotal) / 100;
    }

    const forVotesFormatted = formatNumber(formatEther(forVotesBig), locale);
    const againstVotesFormatted = formatNumber(formatEther(againstVotesBig), locale);
    const displayForPct = forPercentageRaw < 0.01 && forPercentageRaw > 0 ? "< 0.01" : forPercentageRaw.toFixed(2);
    const displayAgainstPct = againstPercentageRaw < 0.01 && againstPercentageRaw > 0 ? "< 0.01" : againstPercentageRaw.toFixed(2);

    const { text: statusText, color: statusColor, icon: StatusIcon } = getStatusInfo(onChainData?.state ?? -1, t);

    const totalRequested = (offChainData?.milestones || []).reduce((acc: number, m: any) => {
        return acc + (parseFloat(m.amount) || 0);
    }, 0);

  return (
        <AppLayout>
            <header className="mb-10 bg-card border rounded-2xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                    <BrainCircuit className="w-64 h-64" />
                </div>

                <div className="flex flex-col gap-6 relative z-10">
                    <div className="flex flex-wrap justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                            <Link href="/proposals">
                                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                                    ← {t('dashboard.view_all')}
                                </Button>
                            </Link>
                            <Badge variant="secondary" className="px-3 py-1.5 text-sm font-mono flex items-center gap-1.5 bg-muted/80">
                                <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="font-semibold text-foreground">
                                    {onChainData ? onChainData.id.toString() : "..."}
                                </span>
                            </Badge>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* ✅ نمایش وضعیت هوشمند */}
                            {smartStatus && (
                                <Badge variant="outline" className={`${smartStatus.color} px-4 py-1.5 text-sm font-medium flex items-center gap-2 border-2`}>
                                    <smartStatus.icon className="w-4 h-4" />
                                    <span>{smartStatus.label}</span>
                                </Badge>
                            )}
                            {offChainData?._id && (
                                <Link href={`/reports?id=${offChainData._id}`} passHref>
                                    <Button variant="outline" size="sm" className="hidden sm:flex gap-2">
                                        <BrainCircuit className="w-4 h-4" />
                                        {t('proposal_detail.view_ai_report')}
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>

                    <div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold font-headline text-gradient leading-tight mb-3">
                            {offChainData?.projectName ?? t('common.loading')}
                        </h1>
                        <p className="text-lg text-muted-foreground leading-relaxed max-w-4xl">
                            {offChainData?.tagline}
                        </p>
                    </div>
                </div>
            </header>
            {/* ✅ هشدار زمان منقضی */}
            {!isVotingAllowed && onChainData?.state === PROPOSAL_STATE_VOTING && (
                <Alert className="mb-8 border-orange-500/50 bg-orange-500/10">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <AlertTitle className="text-orange-600">{t('proposal_detail.alert.deadline_passed_title')}</AlertTitle>
                    <AlertDescription>{t('proposal_detail.alert.deadline_passed_desc')}</AlertDescription>
                </Alert>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <StatCard 
                            title={t('proposal_detail.ai_risk_score')} 
                            value={onChainData?.aiRiskScore?.toString() ?? "..."} 
                            icon={LineChart} 
                            variant="default" 
                            isLoading={isOnChainLoading}
                        />
                        <StatCard 
                            title={t('proposal_detail.market_sentiment')} 
                            value={aiMetrics?.marketScore ?? "N/A"} 
                            icon={TrendingUp} 
                            variant="positive" 
                            isLoading={!offChainData}
                        />
                        <StatCard 
                            title={t('proposal_detail.team_competency')} 
                            value={aiMetrics?.teamScore ?? "N/A"} 
                            icon={Users} 
                            variant="neutral" 
                            isLoading={!offChainData}
                        />
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <BrainCircuit className="w-6 h-6 text-muted-foreground"/> 
                                {t('proposal_detail.description')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-base text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                {offChainData?.description ?? t('proposal_detail.no_offchain_data')}
                            </p>
                        </CardContent>
                    </Card>

                   <Card>
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center text-xl">
                                <span>{t('proposal_detail.voting_results')}</span>
                                <Badge variant="secondary" className="text-sm font-normal px-3">
                                    {t('common.quorum')}: 4% 
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isOnChainLoading ? (
                                <div className="space-y-4"><Skeleton className="h-8 w-3/4" /><Skeleton className="h-6 w-1/2" /></div>
                            ) : onChainData ? (
                                <div className="space-y-8">
                                    <div>
                                        <div className="flex justify-between mb-2 text-base">
                                            <span className="font-medium text-green-600 flex items-center gap-2">
                                                <CheckCircle className="w-5 h-5" />
                                                {t('proposal_detail.votes_for')}
                                            </span>
                                            <div className="text-right">
                                                <span className="font-bold block text-lg">{forVotesFormatted} RYC</span>
                                                <span className="text-sm text-muted-foreground">{displayForPct}% {t('proposal_detail.total_supply')}</span>
                                            </div>
                                        </div>
                                        <Progress value={Math.max(forPercentageRaw, 1)} className="h-4 bg-green-100 dark:bg-green-950 [&>div]:bg-green-600" />
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-2 text-base">
                                            <span className="font-medium text-destructive flex items-center gap-2">
                                                <XCircle className="w-5 h-5" />
                                                {t('proposal_detail.votes_against')}
                                            </span>
                                            <div className="text-right">
                                                <span className="font-bold block text-lg">{againstVotesFormatted} RYC</span>
                                                <span className="text-sm text-muted-foreground">{displayAgainstPct}% {t('proposal_detail.total_supply')}</span>
                                            </div>
                                        </div>
                                        <Progress value={Math.max(againstPercentageRaw, 1)} className="h-4 bg-red-100 dark:bg-red-950 [&>div]:bg-destructive" />
                                    </div>
                                    {hasVoted && (
                                        <Alert className="mt-6 border-green-500/50 bg-green-500/10">
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                            <AlertTitle className="text-green-600 text-base font-semibold">{t('proposal_detail.you_have_voted_title')}</AlertTitle>
                                        </Alert>
                                    )}
                                </div>
                            ) : <div className="text-base text-muted-foreground">{t('proposal_detail.onchain_data_unavailable')}</div>}
                        </CardContent>
                        
                        {/* ✅ FIX: دکمه‌ها فقط زمانی فعال باشند که رأی‌گیری مجاز است */}
                                {isVotingAllowed && !hasVoted && (
                                        <CardFooter className="grid grid-cols-2 gap-4 pt-2">
                                        <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleVoteClick('for')} disabled={isVotingPending}><Check className="me-2"/>{t('proposal_detail.vote_for')}</Button>
                                        <Button variant="destructive" onClick={() => handleVoteClick('against')} disabled={isVotingPending}><X className="me-2"/>{t('proposal_detail.vote_against')}</Button>
                                    </CardFooter>
                                    )} 
                                    {/* پیام وضعیت غیرفعال */}
                                    {!isVotingAllowed && onChainData?.state === PROPOSAL_STATE_VOTING && (
                                 <CardFooter><Button variant="secondary" className="w-full" disabled>{t('proposal_detail.voting_ended')}</Button></CardFooter>
                             )}
                    </Card>

                    {(onChainData?.state === PROPOSAL_STATE_FUNDING) && (
                        <Card className="border-primary/50 shadow-lg shadow-primary/10 overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Banknote className="w-32 h-32 text-primary" /></div>
                            <CardHeader>
                                <CardTitle className="text-primary flex items-center gap-2"><Banknote className="w-5 h-5"/> Funding In Progress</CardTitle>
                                <CardDescription>This project is approved and currently raising funds.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm font-medium">
                                        <span>Raised: {formatEther(onChainData.totalRaised)} RYC</span>
                                        <span>Goal: {formatEther(onChainData.amount)} RYC</span>
                                    </div>
                                    <Progress value={Number((onChainData.totalRaised || 0n) * 100n / (onChainData.amount || 1n))} className="h-4" />
                                </div>
                                
                                <div className="flex gap-4 items-end">
                                    <div className="space-y-2 flex-1">
                                        <label className="text-xs font-medium text-muted-foreground">Investment Amount (RYC)</label>
                                        <Input 
                                            type="number" 
                                            placeholder="0.0" 
                                            value={investAmount} 
                                            onChange={e => setInvestAmount(e.target.value)} 
                                        />
                                    </div>
                                    <Button onClick={handleInvest} className="bg-primary hover:bg-primary/90 min-w-[120px]">
                                        Invest Now
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {(onChainData?.state === PROPOSAL_STATE_FUNDING_FAILED) && (
                        <Card className="border-destructive/50 bg-destructive/5">
                            <CardHeader>
                                <CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle /> Funding Failed</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">This project did not reach the soft cap. You can claim a refund for your investment.</p>
                                <Button variant="destructive" onClick={handleRefund}>Claim Refund</Button>
                            </CardContent>
                        </Card>
                    )}

                    {isProjectOwner && onChainData?.state === PROPOSAL_STATE_FUNDED && (
                        <Card className="border-blue-500/50 bg-blue-500/5 shadow-lg shadow-blue-500/10">
                            <CardHeader>
                                <CardTitle className="text-blue-600 flex items-center gap-2">
                                    <Banknote className="w-5 h-5" />
                                    {t('proposal_detail.milestone_management')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                                    {t('proposal_detail.milestone_management_desc')}
                                </p>
                                
                                <Dialog open={isReleaseDialogOpen} onOpenChange={setIsReleaseDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg font-bold transition-all hover:scale-[1.02]">
                                            {t('proposal_detail.request_next_milestone')}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>{t('proposal_detail.submit_progress_report')}</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">{t('proposal_detail.progress_description')}</label>
                                                <Textarea 
                                                    placeholder={t('proposal_detail.progress_placeholder')} 
                                                    value={proofText}
                                                    onChange={(e) => setProofText(e.target.value)}
                                                    className="min-h-[120px]"
                                                />
                                            </div>
                                            <Button 
                                                onClick={() => {
                                                    requestRelease(proofText);
                                                    setIsReleaseDialogOpen(false);
                                                }} 
                                                disabled={isreleasing || !proofText}
                                                className="w-full"
                                            >
                                                {isreleasing ? <DaoLoadingSpinner /> : t('proposal_detail.submit_request')}
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    {onChainData && <ProposalTimeline currentState={BigInt(onChainData.state)} />}
                    
                    <div className="space-y-4">
                        <StatCard 
                            title={t('proposal_detail.proposer')} 
                            value={formatAddress(onChainData?.proposer || offChainData?.proposerAddress)} 
                            icon={User} 
                            variant="neutral"
                            description="Project Lead"
                        />
                        <StatCard 
                            title={t('proposal_detail.total_requested')} 
                            value={`${formatNumber(totalRequested)} RYC`} 
                            icon={Wallet} 
                            variant="warning"
                        />
                        {onChainData && (
                            <>
                                <StatCard 
                                    title={t('proposal_detail.voting_deadline')} 
                                    value={formatLocaleDate(new Date(Number(onChainData.deadline) * 1000), locale)} 
                                    icon={Calendar} 
                                    variant="neutral"
                                />
                                <StatCard 
                                    title={t('proposal_detail.total_votes')} 
                                    value={formatNumber(formatEther(BigInt(onChainData.forVotes) + BigInt(onChainData.againstVotes)), locale)} 
                                    icon={Users} 
                                    variant="default"
                                />
                            </>
                        )}
                    </div>
                    
                    {userRole === 'admin' && onChainData && (onChainData.state === PROPOSAL_STATE_APPROVED) && !onChainData.executed && (
                         <Card className="border-primary border-dashed bg-primary/5">
                             <CardHeader><CardTitle className="text-primary text-sm">{t('proposal_detail.admin_actions')}</CardTitle></CardHeader>
                             <CardContent>
                                 <Button className="w-full" onClick={handleExecute} disabled={isExecuting}>
                                     {isExecuting ? <DaoLoadingSpinner className="me-2" /> : <PlayCircle className="me-2" />}
                                     {t('proposal_detail.execute_proposal')}
                                 </Button>
                             </CardContent>
                         </Card>
                    )}
                </div>
            </div>

            <AlertDialog open={showStakingAlert} onOpenChange={setShowStakingAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-yellow-600">
                            <Lock className="h-5 w-5" />
                            {t('proposal_detail.alert.insufficient_power_title')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('proposal_detail.alert.insufficient_power_desc')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('proposal_detail.alert.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => router.push('/staking')}>
                            {t('proposal_detail.alert.go_to_staking')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}