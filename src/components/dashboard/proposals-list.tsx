// src/components/dashboard/proposals-list.tsx (نسخه اصلاح شده)
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/hooks/use-translation";
import { useWeb3 } from "@/context/Web3Provider";
import { useReadContract } from "wagmi";
import { daoRegistryAbi, rayanChainDaoAbi } from "@/lib/blockchain/generated";
import { REGISTRY_KEYS } from "@/lib/blockchain/registry-keys";
import { ProposalItem } from "./proposal-item"; // کامپوننت فرزند
import { DaoLoadingSpinner } from "../icons/dao-loading-spinner";
import type { Address } from "viem";

// تعریف یک تایپ برای داده‌های پروپوزال
export interface ProposalData {
    _id: string;
    proposalIdOnChain: string | null;
    projectName: string;
    tagline: string;
    // ... سایر فیلدهای آف‌چین
}   
export function ProposalsList() {
    const { t } = useTranslation();
    const { registryAddress, isHydrated } = useWeb3();

    const { data: daoAddressResult, isLoading: isAddressLoading } = useReadContract({ /* ... */ });
    const daoAddress = daoAddressResult as Address | undefined;

    const { data: nextProposalId, isLoading: isCountLoading } = useReadContract({
        address: daoAddress,
        abi: rayanChainDaoAbi,
        functionName: 'nextProposalId',
        query: { enabled: !!daoAddress, refetchInterval: 30000 },
    });

    const proposalCount = nextProposalId ? Number(nextProposalId) : 0;
    const proposalIds = Array.from({ length: proposalCount > 0 ? proposalCount - 1 : 0 }, (_, i) => BigInt(i + 1)).reverse();
    
    const isLoading = isAddressLoading || isCountLoading;

    return (
        <Card>
            <CardHeader><CardTitle>{t('proposals_page.active_proposals')}</CardTitle></CardHeader>
            <CardContent>
                {isLoading ? ( <div className="flex justify-center p-8"><DaoLoadingSpinner /></div> )
                 : proposalIds.length === 0 ? ( <p>{t('proposals_page.no_proposals_found')}</p> )
                 : ( <div>
                        {proposalIds.map(id => (
                            <ProposalItem 
                                key={id.toString()} 
                                proposalId={id}
                                daoAddress={daoAddress}
                            />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}