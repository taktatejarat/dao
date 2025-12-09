// src/hooks/useBuyTokens.ts - FINAL, STABLE VERSION for Development

import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from '@/hooks/use-translation';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, BaseError, Hex, formatEther  } from 'viem';
import { rayanChainTokenAbi } from '@/lib/blockchain/generated';
import { toast } from 'sonner';
import type { Address } from 'viem';

interface UseBuyTokensProps {
    tokenAddress: Address | undefined;
}

export function useBuyTokens({ tokenAddress }: UseBuyTokensProps) {
    const { t } = useTranslation();
    const [buyAmount, setBuyAmount] = useState(''); // مقدار MATIC
    const maticToSend = useMemo(() => {
        try { return parseEther(buyAmount || '0'); } catch { return 0n; }
    }, [buyAmount]);

    // ✅ NEW: فراخوانی view function برای پیش‌نمایش تعداد توکن
    const { data: estimatedRycAmount, isLoading: isEstimating } = useReadContract({
        address: tokenAddress,
        abi: rayanChainTokenAbi,
        functionName: 'getAmountOfTokensForNative',
        args: [maticToSend],
        query: {
            enabled: !!tokenAddress && maticToSend > 0n,
            // هر ۵ ثانیه قیمت را به‌روز می‌کند تا کاربر قیمت لحظه‌ای را ببیند
            refetchInterval: 1000,
        }
    });
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
        return baseError?.shortMessage || t('proposals.new.unexpected_error_desc'); 
    };

   const handleBuyTokens = async () => {
        if (!tokenAddress) {
            toast.error(t('proposals.new.error_toast_title'), { description: t('staking_page.contract_addresses_missing') });
            return;
        }
        const maticToSend = parseEther(buyAmount || '0');
        if (maticToSend <= 0n) {
            toast.error(t('proposals.new.error_toast_title'), { description: t('staking_page.buy_amount_error') });
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
            toast.info(t('proposals.new.pending_toast_title'), { description: t('staking_page.buy_in_progress') });

        } catch (err) {
            console.error("Buy tokens error:", err);
            toast.error(t('proposals.new.error_toast_title'), { description: extractRevertReason(err) });
        }
    };

    const resetBuyState = () => {
        setBuyTxHash(undefined);
        setBuyAmount('');
    };

   return {
        buyAmount,
        setBuyAmount,
        handleBuyTokens,
        isBuyActionPending,
        isBuyConfirmed,
        // ✅ NEW: مقادیر جدید برای نمایش در UI
        estimatedRycReceived: estimatedRycAmount ? formatEther(estimatedRycAmount as bigint) : '0',
        isEstimatingPrice: isEstimating,
        resetBuyState, 
    };
}