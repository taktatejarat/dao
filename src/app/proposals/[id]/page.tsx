// src/app/proposals/[id]/page.tsx - STRICTLY ALIGNED WITH CONTRACTS

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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BrainCircuit, AlertTriangle, Banknote, 
    Calendar, Check, Clock, Info, ShieldCheck, User, 
    Users, X, PlayCircle, CheckCircle, LineChart, 
    Scale, Lock, XCircle } from 'lucide-react';
import { formatNumber, formatLocaleDate, formatAddress } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useReadContract, useWriteContract } from 'wagmi';
import { rayanChainDaoAbi, rayanChainTokenAbi } from '@/lib/blockchain/generated'; // stakingAbi حذف شد چون دستی استفاده می‌کنیم
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

// اینترفیس دقیق داده‌های خوانده شده از قرارداد
interface OnChainProposal { 
    id: bigint; 
    proposer: Address; 
    amount: bigint; // Hard Cap
    deadline: bigint; 
    forVotes: bigint; 
    againstVotes: bigint; 
    state: number; 
    executed: boolean; 
    aiRiskScore: bigint; 
    totalRaised: bigint;
    fundingDeadline: bigint;
}

const InfoCard = ({ icon: Icon, title, value }: { icon: React.ElementType, title: string, value: string | number }) => (
    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <Icon className="w-6 h-6 text-muted-foreground" />
        <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="font-semibold">{value}</p>
        </div>
    </div>
);

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
        // وضعیت‌های جدید Investment DAO
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
    
    // States for Dialogs and Inputs
    const [proofText, setProofText] = useState("");
    const [isReleaseDialogOpen, setIsReleaseDialogOpen] = useState(false);
    const [investAmount, setInvestAmount] = useState("");

    // 1. Fetch Off-chain Data
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

    // 2. Fetch On-chain Data (DAO)
    const { data: onChainResult, isLoading: isOnChainLoading, error: onChainError } = useReadContract({
        address: daoAddress,
        abi: rayanChainDaoAbi,
        functionName: 'proposals',
        args: onChainProposalId ? [onChainProposalId] : undefined,
        query: { enabled: isWeb3Hydrated && !!daoAddress && !!onChainProposalId },
    });

    // 3. Fetch User Voting Power
    const { data: userVotingPower } = useReadContract({
        address: stakingAddress, 
        abi: parseAbi(['function votingPower(address account) view returns (uint256)']),
        functionName: 'votingPower', 
        args: address ? [address] : undefined,
        query: { enabled: !!address && !!stakingAddress }
    });

    // 4. Fetch Token Supply (for percentage calc)
    const { data: tokenTotalSupply } = useReadContract({
        address: tokenAddress,
        abi: rayanChainTokenAbi,
        functionName: 'totalSupply',
        query: { enabled: !!tokenAddress }
    });

    // Parsed On-chain Data (Strict Index Mapping)
    const onChainData = useMemo((): OnChainProposal | null => {
        if (!onChainResult || !Array.isArray(onChainResult)) return null;
        const result = onChainResult as any[];
        
        // IMPORTANT: Solidity Getter skips arrays (milestones).
        // Mapping based on 'struct Proposal' in RayanChainDAO.sol:
        // 0:id, 1:pType, 2:proposer, 3:hash, 4:recipient, 5:amount, 6:tokenType, 
        // 7:creationTime, 8:votingDeadline, 9:forVotes, 10:againstVotes, 11:state, 12:executed
        // -- milestones skipped --
        // 13:currentMilestoneIndex, 14:aiRiskScore, 15:threshold, 16:roleToGrant, 17:totalRaised, 18:softCap, 19:fundingDeadline
        
        return {
            id: result[0],
            proposer: result[2],
            amount: result[5],
            deadline: result[8],
            forVotes: result[9],
            againstVotes: result[10],
            state: Number(result[11]), 
            executed: result[12],
            aiRiskScore: result[14], // Index 14 confirmed
            totalRaised: result[17] || 0n, // Index 17 (totalRaised)
            fundingDeadline: result[19] || 0n // Index 19 (fundingDeadline)
        };
    }, [onChainResult]);

    // --- Actions ---

    // Invest Action
    const { writeContractAsync: investAsync } = useWriteContract();
    
    const handleInvest = async () => {
        if (!daoAddress || !onChainProposalId) return;
        try {
            const toastId = toast.loading("Processing investment...");
            // Manual ABI for 'invest' function in DAO
            await investAsync({
                address: daoAddress,
                abi: parseAbi(['function invest(uint256 _proposalId, uint256 _amount) external']),
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

    // Refund Action
    const { writeContractAsync: refundAsync } = useWriteContract();
    
    const handleRefund = async () => {
        if (!daoAddress || !onChainProposalId) return;
        try {
            const toastId = toast.loading("Processing refund...");
            await refundAsync({
                address: daoAddress,
                abi: parseAbi(['function claimRefund(uint256 _proposalId) external']),
                functionName: 'claimRefund',
                args: [onChainProposalId]
            });
            toast.success("Refund claimed!", { id: toastId });
        } catch (e) {
            console.error(e);
            toast.error("Refund failed.");
        }
    };

    // Milestone Release Hook
    const { requestRelease, isreleasing } = useMilestoneRelease({
        daoAddress,
        originalProposalId: onChainProposalId || 0n
    });

    // Logic Checks
    const isProjectOwner = address && onChainData && 
        (address.toLowerCase() === onChainData.proposer.toLowerCase());

    const { handleVote: submitVote, isVotingPending, hasVoted } = useProposalVote({
        daoAddress,
        proposalId: onChainProposalId!,
        isVotingActive: !!onChainData && onChainData.state === PROPOSAL_STATE_VOTING,
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
    if (finalError || (!offChainData && !onChainData && !isLoading && !isOnChainLoading)) {
        return <AppLayout><Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>{t('common.error')}</AlertTitle><AlertDescription>{finalError}</AlertDescription></Alert></AppLayout>;
    }
    
    // Calculations
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

   return (
        <AppLayout>
            <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline text-gradient">
                        {offChainData?.projectName ?? (onChainData ? `${t('proposal_detail.proposal')} #${onChainData.id}` : t('common.loading'))}
                    </h1>
                    {offChainData?.tagline && <p className="text-muted-foreground mt-1">{offChainData.tagline}</p>}
                </div>
                <div className="flex items-center gap-4">
                    {offChainData?._id && (<Link href={`/reports?id=${offChainData._id}`} passHref><Button variant="outline"><BrainCircuit className="w-4 h-4 mr-2" />{t('proposal_detail.view_ai_report')}</Button></Link>)}
                    {onChainData && (<Badge variant="outline" className={`${statusColor} text-sm px-3 py-1.5 flex gap-2`}><StatusIcon className="w-4 h-4" /><span>{statusText}</span></Badge>)}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                     {/* AI Analysis Card */}
                     <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><BrainCircuit /> {t('proposal_detail.ai_analysis')}</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <InfoCard icon={LineChart} title={t('proposal_detail.ai_risk_score')} value={`${onChainData?.aiRiskScore?.toString() ?? t('proposal_detail.status.pending')}`} />
                            <InfoCard icon={Scale} title={t('proposal_detail.market_sentiment')} value={offChainData?.aiAnalysis?.financialAnalysis?.market_sentiment_score ? `${(offChainData.aiAnalysis.financialAnalysis.market_sentiment_score * 100).toFixed(0)}%` : 'N/A'} />
                            <InfoCard icon={Users} title={t('proposal_detail.team_competency')} value={offChainData?.aiAnalysis?.financialAnalysis?.team_competency_score ?? 'N/A'} />
                        </CardContent>
                    </Card>

                    {/* Description Card */}
                    <Card>
                        <CardHeader><CardTitle>{t('proposal_detail.description')}</CardTitle></CardHeader>
                        <CardContent><p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{offChainData?.description ?? t('proposal_detail.no_offchain_data')}</p></CardContent>
                    </Card>

                   {/* Voting Card */}
                   <Card>
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                <span>{t('proposal_detail.voting_results')}</span>
                                <Badge variant="secondary" className="text-xs font-normal">
                                    {t('common.quorum')}: 4% 
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isOnChainLoading ? (
                                <div className="space-y-3"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2" /></div>
                            ) : onChainData ? (
                                <div className="space-y-6">
                                    {/* Votes For */}
                                    <div>
                                        <div className="flex justify-between mb-2 text-sm">
                                            <span className="font-medium text-green-600 flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4" />
                                                {t('proposal_detail.votes_for')}
                                            </span>
                                            <div className="text-right">
                                                <span className="font-bold block">{forVotesFormatted} RYC</span>
                                                <span className="text-xs text-muted-foreground">{displayForPct}% {t('proposal_detail.total_supply')}</span>
                                            </div>
                                        </div>
                                        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden border border-border relative shadow-inner">
                                            <div 
                                                className="h-full bg-green-600 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(22,163,74,0.6)] relative" 
                                                style={{ width: `${forVotesBig > 0n ? Math.max(forPercentageRaw, 1) : 0}%` }} 
                                            >
                                                 <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse"></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Votes Against */}
                                    <div>
                                        <div className="flex justify-between mb-2 text-sm">
                                            <span className="font-medium text-destructive flex items-center gap-2">
                                                <XCircle className="w-4 h-4" />
                                                {t('proposal_detail.votes_against')}
                                            </span>
                                            <div className="text-right">
                                                <span className="font-bold block">{againstVotesFormatted} RYC</span>
                                                <span className="text-xs text-muted-foreground">{displayAgainstPct}% {t('proposal_detail.total_supply')}</span>
                                            </div>
                                        </div>
                                        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden border border-border shadow-inner">
                                            <div 
                                                className="h-full bg-destructive transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(220,38,38,0.6)] relative" 
                                                style={{ width: `${againstVotesBig > 0n ? Math.max(againstPercentageRaw, 1) : 0}%` }} 
                                            >
                                                 <div className="absolute inset-0 bg-white/10 w-full h-full"></div>
                                            </div>
                                        </div>
                                    </div>

                                    {hasVoted && (
                                        <Alert className="mt-4 border-green-500/50 bg-green-500/10">
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                            <AlertTitle className="text-green-600">{t('proposal_detail.you_have_voted_title')}</AlertTitle>
                                        </Alert>
                                    )}
                                </div>
                            ) : <div className="text-sm text-muted-foreground">{t('proposal_detail.onchain_data_unavailable')}</div>}
                        </CardContent>
                        
                            {onChainData && onChainData.state === PROPOSAL_STATE_VOTING && !hasVoted && (
                                <CardFooter className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Button size="lg" className="bg-green-600 hover:bg-green-700 w-full" onClick={() => handleVoteClick('for')} disabled={isVotingPending}>
                                        {isVotingPending ? <DaoLoadingSpinner /> : <Check className="me-2"/>}{t('proposal_detail.vote_for')}
                                    </Button>
                                    <Button size="lg" variant="destructive" className="w-full" onClick={() => handleVoteClick('against')} disabled={isVotingPending}>
                                        {isVotingPending ? <DaoLoadingSpinner /> : <X className="me-2"/>}{t('proposal_detail.vote_against')}
                                    </Button>
                                </CardFooter>
                            )}
                    </Card>

                    {/* Milestone Management (Only for Project Owner & When Funded) */}
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

                    {/* FUNDING SECTION (State 8) */}
                    {(onChainData?.state === PROPOSAL_STATE_FUNDING) && (
                        <Card className="border-primary/50 shadow-lg shadow-primary/10 mt-6">
                            <CardHeader>
                                <CardTitle className="text-primary">Funding In Progress</CardTitle>
                                <CardDescription>This project is approved and raising funds.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span>Raised: {formatEther(onChainData.totalRaised)} RYC</span>
                                        <span>Goal: {formatEther(onChainData.amount)} RYC</span>
                                    </div>
                                    
                                    {/* درصد سرمایه جذب شده */}
                                    <Progress value={Number((onChainData.totalRaised || 0n) * 100n / (onChainData.amount || 1n))} className="h-3" />
                                    
                                    <div className="flex gap-2 pt-2">
                                        <Input 
                                            type="number" 
                                            placeholder="Amount to invest" 
                                            value={investAmount} 
                                            onChange={e => setInvestAmount(e.target.value)} 
                                        />
                                        <Button onClick={handleInvest} className="bg-primary hover:bg-primary/90">Invest</Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* REFUND SECTION (State 10) */}
                    {(onChainData?.state === PROPOSAL_STATE_FUNDING_FAILED) && (
                        <Card className="border-destructive/50 mt-6">
                            <CardHeader><CardTitle className="text-destructive">Funding Failed</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">This project did not reach the soft cap. You can claim a refund.</p>
                                <Button variant="destructive" onClick={handleRefund}>Claim Refund</Button>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    {onChainData && <ProposalTimeline currentState={BigInt(onChainData.state)} />}
                    <Card>
                        <CardHeader><CardTitle>{t('proposal_detail.details')}</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <InfoCard icon={User} title={t('proposal_detail.proposer')} value={formatAddress(onChainData?.proposer || offChainData?.proposerAddress)} />
                            <InfoCard icon={Banknote} title={t('proposal_detail.total_requested')} value={`${formatNumber(offChainData?.milestones.reduce((acc: number, m: any) => acc + parseFloat(m.amount), 0) ?? 0)} RYC`} />
                            {onChainData && <InfoCard icon={Calendar} title={t('proposal_detail.voting_deadline')} value={formatLocaleDate(new Date(Number(onChainData.deadline) * 1000), locale)} />}
                            {onChainData && <InfoCard icon={Users} title={t('proposal_detail.total_votes')} value={formatNumber(formatEther(forVotesBig + againstVotesBig), locale)} />}
                        </CardContent>
                    </Card>
                    
                    {/* Admin Actions: Execute is only for APPROVED (3) state to transition to FUNDING */}
                    {userRole === 'admin' && onChainData && (onChainData.state === PROPOSAL_STATE_APPROVED) && !onChainData.executed && (
                         <Card className="border-primary"><CardHeader><CardTitle>{t('proposal_detail.admin_actions')}</CardTitle></CardHeader><CardContent><Button className="w-full" onClick={handleExecute} disabled={isExecuting}>{isExecuting ? <DaoLoadingSpinner className="me-2" /> : <PlayCircle className="me-2" />}{t('proposal_detail.execute_proposal')}</Button></CardContent></Card>
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