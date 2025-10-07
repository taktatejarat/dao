"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/hooks/use-translation";
import { useWeb3 } from "@/context/Web3Provider";
import { useReadContract } from "wagmi";
import { daoRegistryAbi, rayanChainDaoAbi } from "@/lib/blockchain/generated";
import { REGISTRY_KEYS } from "@/lib/blockchain/registry-keys";
import { ProposalItem } from "./proposal-item";
import { DaoLoadingSpinner } from "../icons/dao-loading-spinner";
import type { Address } from "viem";

export function ProposalsList() {
    const { t } = useTranslation();
    const { registryAddress, isHydrated } = useWeb3();

    const { data: daoAddressResult, isLoading: isAddressLoading } = useReadContract({
        address: registryAddress ?? undefined,
        abi: daoRegistryAbi,
        functionName: 'getAddress',
        args: [REGISTRY_KEYS.DAO],
        query: { enabled: !!registryAddress && isHydrated },
    });
    const daoAddress = daoAddressResult as Address | undefined;

    // 2. Fetch the total number of proposals
    const { data: nextProposalId, isLoading: isCountLoading } = useReadContract({
        address: daoAddress,
        abi: rayanChainDaoAbi,
        functionName: 'nextProposalId',
        query: {
            enabled: !!daoAddress,
            // Refetch every 30 seconds to get new proposals
            refetchInterval: 30000,
        },
    });

    const proposalCount = nextProposalId ? Number(nextProposalId) : 0;
    const proposalIds = Array.from({ length: proposalCount > 0 ? proposalCount -1 : 0 }, (_, i) => BigInt(i + 1)).reverse();
    
    const isLoading = isAddressLoading || isCountLoading;

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('proposals_page.active_proposals')}</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <DaoLoadingSpinner />
                    </div>
                ) : proposalIds.length === 0 ? (
                    <p className="text-center text-muted-foreground p-8">
                        {t('reports_page.no_proposals_found')}
                    </p>
                ) : (
                    <div>
                        {proposalIds.map(id => (
                            <ProposalItem 
                                key={id.toString()} 
                                proposalId={id}
                                daoAddress={daoAddress} // ✅ Pass the address as a prop
                            />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}