// src/components/dashboard/proposals-list.tsx (FINAL, HOOK-BASED VERSION)

"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/hooks/use-translation";
import { ProposalItem } from "./proposal-item";
import { DaoLoadingSpinner } from "../icons/dao-loading-spinner";
import { useProposals } from "@/hooks/useProposals"; // ✅ ایمپورت هوک جدید

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
                    <div>
                        {proposals.map(proposal => (
                            <ProposalItem
                                key={proposal._id}
                                proposalData={proposal}
                            />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}