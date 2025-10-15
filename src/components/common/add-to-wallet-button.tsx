// src/components/common/add-to-wallet-button.tsx

"use client";

import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import type { Address } from 'viem';

interface AddToWalletButtonProps {
  tokenAddress: Address | undefined;
  tokenSymbol: string;
  tokenDecimals: number;
}

export function AddToWalletButton({ tokenAddress, tokenSymbol, tokenDecimals }: AddToWalletButtonProps) {
  const handleAddToken = async () => {
    if (!tokenAddress || typeof window === 'undefined' || !window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: tokenAddress,
            symbol: tokenSymbol,
            decimals: tokenDecimals,
          },
        },
      });
    } catch (error) {
      console.error("Failed to add token to wallet:", error);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleAddToken} disabled={!tokenAddress}>
      <Wallet className="mr-2 h-4 w-4" />
      Add RYC to MetaMask
    </Button>
  );
}