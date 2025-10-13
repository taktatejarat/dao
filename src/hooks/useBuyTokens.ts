// src/hooks/useBuyTokens.ts - Buy RYC with Native Currency Logic

import { useState, useMemo } from 'react';
import { useTranslation } from '@/hooks/use-translation';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther, BaseError } from 'viem';
import { rayanChainTokenAbi } from '@/lib/blockchain/generated';
import { toast } from 'sonner';
import type { Address } from 'viem';

interface UseBuyTokensProps {
    tokenAddress: Address | undefined;
    // Helper to extract revert reason (assuming it's defined globally or passed)
    extractRevertReason: (err: unknown) => string; 
}

export function useBuyTokens({ tokenAddress, extractRevertReason }: UseBuyTokensProps) {
    const { t, locale } = useTranslation();
    const [buyAmount, setBuyAmount] = useState(''); // Amount of RYC user wants to buy

    // Fetch RYC Price Constant
    const { data: RYC_PRICE_IN_USD_FULL, isLoading: isPriceLoading } = useReadContract({ 
        address: tokenAddress, abi: rayanChainTokenAbi, functionName: 'RYC_PRICE_IN_USD_FULL',
        query: { enabled: !!tokenAddress }
    });
    // Price Display (e.g., 0.1)
    const RYC_USD_CENTS_DISPLAY = RYC_PRICE_IN_USD_FULL ? Number(formatEther(RYC_PRICE_IN_USD_FULL)) : 0.1; 
    
    // Wagmi Tx Hooks
    const { data: buyTxHash, isPending: isBuyPending, writeContract: writeBuyContract } = useWriteContract();
    const { isLoading: isBuyConfirming, isSuccess: isBuyConfirmed } = useWaitForTransactionReceipt({ hash: buyTxHash });
    
    const isBuyActionPending = isBuyPending || isBuyConfirming;

    const handleBuyTokens = async () => {
        if (!tokenAddress) {
            toast.error(t('new_proposal_page.error_toast_title'), { description: t('staking_page.contract_addresses_missing') });
            return;
        }
        if (parseEther(buyAmount || '0') <= 0n) {
            toast.error(t('new_proposal_page.error_toast_title'), { description: t('staking_page.buy_amount_error') });
            return;
        }
        
        try {
            // ⚠️ CRITICAL: The contract calls buyTokensWithNative() which is payable.
            // We need to pass the MATIC/ETH value.
            // Since the contract calculates the price, we must send an amount *slightly more* 
            // than the estimated cost to ensure the transaction doesn't fail due to price slippage.
            
            // For a robust test, we ask the user to send 0.05 MATIC for any purchase (temp fix)
            const ARBITRARY_MATIC_VALUE = 50000000000000000n; // 0.05 MATIC/ETH
            
            writeBuyContract({
                address: tokenAddress,
                abi: rayanChainTokenAbi,
                functionName: 'buyTokensWithNative',
                value: ARBITRARY_MATIC_VALUE, 
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