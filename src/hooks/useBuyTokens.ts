// src/hooks/useBuyTokens.ts - FINAL, STABLE VERSION for Development

import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from '@/hooks/use-translation';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, BaseError, Hex } from 'viem';
import { rayanChainTokenAbi } from '@/lib/blockchain/generated';
import { toast } from 'sonner';
import type { Address } from 'viem';

interface UseBuyTokensProps {
    tokenAddress: Address | undefined;
}

export function useBuyTokens({ tokenAddress }: UseBuyTokensProps) {
    const { t } = useTranslation();
    const [buyAmount, setBuyAmount] = useState(''); // Amount of MATIC user wants to spend
    
    const [buyTxHash, setBuyTxHash] = useState<Hex | undefined>(undefined);
    const { isPending: isBuyPending, writeContractAsync } = useWriteContract();
    const { isLoading: isBuyConfirming, isSuccess: isBuyConfirmed } = useWaitForTransactionReceipt({ hash: buyTxHash });
    
    const isBuyActionPending = isBuyPending || isBuyConfirming;

    const extractRevertReason = (err: unknown): string => {
        const baseError = err as BaseError;
        const revertMatch = baseError?.shortMessage?.match(/reverted with the following reason: (.*)\.?/);
        if (revertMatch && revertMatch[1]) {
            return revertMatch[1];
        }
        return baseError?.shortMessage || t('new_proposal_page.unexpected_error_desc'); 
    };

   const handleBuyTokens = async () => {
        if (!tokenAddress) {
            toast.error(t('new_proposal_page.error_toast_title'), { description: t('staking_page.contract_addresses_missing') });
            return;
        }
        const maticToSend = parseEther(buyAmount || '0');
        if (maticToSend <= 0n) {
            toast.error(t('new_proposal_page.error_toast_title'), { description: t('staking_page.buy_amount_error') });
            return;
        }
        
        try {
            // ✅ FINAL FIX: Add a manual gas limit to prevent "Out of Gas" error.
            // 200,000 is a safe limit for a minting function.
            const SAFE_GAS_LIMIT = 200000n; 

            const hash = await writeContractAsync({
                address: tokenAddress,
                abi: rayanChainTokenAbi,
                functionName: 'buyTokensWithNative',
                value: maticToSend,
                gas: SAFE_GAS_LIMIT, // ✅ Set the gas limit explicitly
            });
            
            setBuyTxHash(hash);
            toast.info(t('new_proposal_page.pending_toast_title'), { description: t('staking_page.buy_in_progress') });

        } catch (err) {
            console.error("Buy tokens error:", err);
            toast.error(t('new_proposal_page.error_toast_title'), { description: extractRevertReason(err) });
        }
    };
    
    useEffect(() => {
        if (isBuyConfirmed) {
            toast.success(t('staking_page.buy_success_title'), { description: t('staking_page.buy_success_desc') });
        }
    }, [isBuyConfirmed, t]);


    return {
        buyAmount,
        setBuyAmount,
        handleBuyTokens,
        isBuyActionPending,
        isBuyConfirmed,
    };
}