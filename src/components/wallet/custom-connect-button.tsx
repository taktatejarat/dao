// src/components/wallet/custom-connect-button.tsx - FIXED EMPTY MODAL


"use client";

import { useEffect, useState } from "react";
import { useAccount, useBalance, useDisconnect, useConnect, useConnectors } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { Button } from "@/components/ui/button";
import { ConnectWalletModal } from "./connect-wallet-modal"; 
import { Wallet, LogOut, ChevronDown, Copy, ExternalLink, Network, User } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/hooks/use-translation";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatEther } from "viem";


export function CustomConnectButton() {
    const { t } = useTranslation();
    const [mounted, setMounted] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Wagmi Hooks
    const { address, isConnected, chain } = useAccount();
    const { disconnect } = useDisconnect();
    
    const connectors = useConnectors(); // دریافت لیست
    const { connect, isPending, error: connectError } = useConnect(); // دریافت تابع عملیات

    const { data: balanceData } = useBalance({ address });
    const { open: openAppKit } = useAppKit();
    
    useEffect(() => {
        setMounted(true);
    }, []);

    const copyAddress = () => {
        if (address) {
            navigator.clipboard.writeText(address);
            toast.success(t('common.copied'));
        }
    };

    const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";
    
    const formattedBalance = balanceData 
        ? `${parseFloat(formatEther(balanceData.value)).toFixed(3)} ${balanceData.symbol}`
        : "0.000";

    if (!mounted) {
        return (
            <Button disabled variant="outline" className="gap-2">
                <DaoLoadingSpinner />
                {t('wallet.connecting')}
            </Button>
        );
    }

    // حالت 1: کاربر متصل نیست
    if (!isConnected) {
        return (
            <>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2 font-bold">
                    <Wallet className="h-4 w-4" />
                    {t('wallet.connect')}
                </Button>
                
                <ConnectWalletModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    connectors={connectors} // لیست کانکتورها از هوک جدید
                    connect={connect} 
                    isPending={isPending}
                    error={connectError}
                />
            </>
        );
    }

    // حالت 2: کاربر متصل است
    return (
        <div className="flex items-center gap-2">
            
            {/* نمایش شبکه */}
            <Button 
                variant="ghost" 
                size="sm" 
                className="hidden md:flex items-center gap-2 bg-muted/50 border border-border"
                onClick={() => openAppKit({ view: 'Networks' })} 
            >
                {chain?.id === 80002 ? ( 
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"/>
                ) : (
                    <Network className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-xs font-medium">{chain?.name || t('wallet.unknown_network')}</span>
            </Button>

            {/* نمایش موجودی */}
            <div className="hidden md:flex items-center px-3 py-1.5 bg-muted/30 border border-border rounded-md text-sm font-mono">
                {formattedBalance}
            </div>

            {/* منوی کاربری */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 pl-2 pr-3 border-primary/20 hover:bg-primary/5">
                        <Avatar className="h-6 w-6 border border-primary/20">
                            <AvatarImage src={`https://effigy.im/a/${address}.png`} />
                            <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-sm">{shortAddress}</span>
                        <ChevronDown className="w-4 h-4 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent align="end" className="w-64 p-2">
                    <DropdownMenuLabel className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">{t('wallet.connected_as')}</span>
                        <span className="font-mono text-sm break-all">{shortAddress}</span>
                    </DropdownMenuLabel>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onClick={copyAddress} className="cursor-pointer gap-2">
                        <Copy className="w-4 h-4" />
                        {t('wallet.copy_address')}
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild className="cursor-pointer gap-2">
                        <a 
                            href={`${chain?.blockExplorers?.default.url}/address/${address}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center"
                        >
                            <ExternalLink className="w-4 h-4" />
                            {t('wallet.view_explorer')}
                        </a>
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => openAppKit({ view: 'Account' })} className="cursor-pointer gap-2">
                        <User className="w-4 h-4" />
                        {t('wallet.my_account')}
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onClick={() => disconnect()} className="cursor-pointer text-red-500 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30 gap-2">
                        <LogOut className="w-4 h-4" />
                        {t('wallet.disconnect')}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

function DaoLoadingSpinner() {
    return <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />;
}