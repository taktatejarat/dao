// src/hooks/useBuyTokens.ts - FINAL, SELF-CONTAINED VERSION

import { useState, useMemo } from 'react';
import { useTranslation } from '@/hooks/use-translation';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther, BaseError } from 'viem';
import { rayanChainTokenAbi } from '@/lib/blockchain/generated';
import { toast } from 'sonner';
import type { Address } from 'viem';

interface UseBuyTokensProps {
    tokenAddress: Address | undefined;
}

export function useBuyTokens({ tokenAddress }: UseBuyTokensProps) {
    const { t, locale } = useTranslation();
    const [buyAmount, setBuyAmount] = useState(''); // Amount of MATIC user wants to spend

    // Fetch RYC Price Constant
    const { data: RYC_PRICE_IN_USD_FULL, isLoading: isPriceLoading } = useReadContract({ 
        address: tokenAddress, abi: rayanChainTokenAbi, functionName: 'RYC_PRICE_IN_USD_FULL',
        query: { enabled: !!tokenAddress }
    });
    const RYC_USD_CENTS_DISPLAY = RYC_PRICE_IN_USD_FULL ? Number(formatEther(RYC_PRICE_IN_USD_FULL)) : 0.1; 
    
    // Wagmi Tx Hooks
    const { data: buyTxHash, isPending: isBuyPending, writeContract: writeBuyContract } = useWriteContract();
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
            writeBuyContract({
                address: tokenAddress,
                abi: rayanChainTokenAbi,
                functionName: 'buyTokensWithNative',
                value: maticToSend, 
            } as any);
            toast.info(t('new_proposal_page.pending_toast_title'), { description: t('staking_page.buy_in_progress') });

        } catch (err) {
            toast.error(t('new_proposal_page.error_toast_title'), { description: extractRevertReason(err) });
        }
    };

    return {
        buyAmount, setBuyAmount,
        RYC_USD_CENTS_DISPLAY,
        handleBuyTokens,
        isBuyActionPending,
        isBuyConfirmed,
        isPriceLoading,
    };
}