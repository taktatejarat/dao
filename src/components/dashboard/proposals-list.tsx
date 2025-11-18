// src/components/dashboard/proposals-list.tsx (FINAL, HOOK-BASED VERSION)

"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; 
import { useTranslation } from "@/hooks/use-translation";
import { DaoLoadingSpinner } from "../icons/dao-loading-spinner";
import { useProposals, type ProposalListData } from "@/hooks/useProposals";
import { ClipboardCopy } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link"; 

export function ProposalsList() {
    console.log("--- RENDERING: ProposalsList ---");
    const { t } = useTranslation();
    
    // ✅✅✅ تمام منطق واکشی اکنون در این هوک قرار دارد ✅✅✅
    const { proposals, isLoading, error } = useProposals();

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('proposals_page.active_proposals')}</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center p-8"><DaoLoadingSpinner /></div>
                ) : error ? (
                    <p className="text-destructive text-center">{error}</p>
                ) : proposals.length === 0 ? (
                    <p className="text-muted-foreground text-center">{t('proposals_page.no_proposals_found')}</p>
                ) : (
                    <div className="space-y-4">
                        {proposals.map((proposal: ProposalListData) => (
                            // ✅ IMPROVEMENT: کل کارت را به یک لینک تبدیل می‌کنیم
                            <Link href={`/proposals/${proposal.proposalIdOnChain || proposal._id}`} key={proposal._id}>
                                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                                    <CardHeader>
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-lg">{proposal.projectName}</CardTitle>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground font-mono" title="Off-chain ID">{proposal._id}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    // جلوگیری از propagate شدن کلیک به لینک والد
                                                    onClick={(e) => {
                                                        e.preventDefault(); 
                                                        navigator.clipboard.writeText(proposal._id);
                                                        toast.success(t('toasts.id_copied'));
                                                    }}
                                                >
                                                    <ClipboardCopy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <CardDescription>{proposal.tagline}</CardDescription>
                                    </CardHeader>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}