// src/hooks/useOwnershipTransfer.ts

import { useState } from 'react';
import { useWriteContract, useSimulateContract, useWaitForTransactionReceipt } from 'wagmi';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';
import { rayanChainDaoAbi } from '@/lib/blockchain/generated';
import type { Address } from 'viem';
import { BaseError, isAddress } from 'viem';

interface UseOwnershipTransferProps {
    daoAddress: Address | undefined;
}

export function useOwnershipTransfer({ daoAddress }: UseOwnershipTransferProps) {
    const { t } = useTranslation();
    const [newOwnerAddress, setNewOwnerAddress] = useState('');

    const { data: config, error: simulateError, isError: isSimulateError } = useSimulateContract({
        address: daoAddress,
        abi: rayanChainDaoAbi,
        functionName: 'transferOwnership',
        args: [newOwnerAddress as Address], // آرگومان‌ها در یک scope ایزوله هستند
        query: {
            enabled: !!daoAddress && isAddress(newOwnerAddress),
        },
    });

    const { isPending, writeContractAsync } = useWriteContract();
    const [submittedHash, setSubmittedHash] = useState<`0x${string}` | undefined>(undefined);
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: submittedHash });

    const handleTransfer = async () => {
        if (isSimulateError || !config?.request) {
            toast.error((simulateError as BaseError)?.shortMessage || 'Transaction simulation failed.');
            return;
        }
        try {
            const txHash = await writeContractAsync(config.request as any);
            setSubmittedHash(txHash);
            toast.success(t('profile_page.ownership_transfer_initiated_title'));
            toast.info(`${t('profile_page.ownership_transfer_initiated_desc')} ${txHash}`);
            setNewOwnerAddress('');
        } catch (err) {
            toast.error((err as BaseError).shortMessage || t('profile_page.error_desc'));
        }
    };

    return {
        newOwnerAddress,
        setNewOwnerAddress,
        handleTransfer,
        isPending: isPending || isConfirming,
        isSuccess,
        isButtonDisabled: !config?.request || isPending || isConfirming,
    };
}