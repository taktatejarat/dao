// src/hooks/useAdminProfile.ts

import { useWeb3 } from '@/context/Web3Provider';
import { useReadContract } from 'wagmi';
import { daoRegistryAbi, rayanChainDaoAbi } from '@/lib/blockchain/generated';
import { REGISTRY_KEYS } from '@/lib/blockchain/registry-keys';
import { useOwnershipTransfer } from '@/hooks/useOwnershipTransfer';
import { type Address } from 'viem';

export function useAdminProfile() {
    const { registryAddress, isHydrated, userRole } = useWeb3();
    const isAdmin = userRole === 'admin';

    // 1. Read Critical Addresses
    const { data: tokenAddress, isLoading: l1 } = useReadContract({ 
        address: registryAddress as Address, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.TOKEN], 
        query: { enabled: isAdmin && !!registryAddress }
    });
    
    const { data: daoAddress, isLoading: l2 } = useReadContract({ 
        address: registryAddress as Address, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.DAO], 
        query: { enabled: isAdmin && !!registryAddress }
    });

    // 2. Read Contract Owner
    const { data: contractOwner, isLoading: l3 } = useReadContract({
        address: daoAddress, abi: rayanChainDaoAbi, functionName: 'owner',
        query: { enabled: isAdmin && !!daoAddress },
    });

    // 3. Ownership Transfer Logic (Reusing existing hook)
    const transferLogic = useOwnershipTransfer({ daoAddress });

    return {
        info: {
            daoAddress,
            tokenAddress,
            contractOwner: contractOwner as Address | undefined,
        },
        transferLogic,
        isLoading: l1 || l2 || l3,
        isAdmin
    };
}