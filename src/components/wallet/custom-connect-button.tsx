// src/components/wallet/custom-connect-button.tsx

"use client";

import { useEffect, useState } from "react";
import { useAccount, useBalance, useEnsName } from "wagmi";
import { Button } from "@/components/ui/button";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import { ConnectWalletModal } from "./connect-wallet-modal";
import { Wallet, LogOut, ChevronDown, Copy, ExternalLink } from "lucide-react";
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
import { formatEther } from "viem"; // برای فرمت کردن موجودی

export function CustomConnectButton() {
    const { t } = useTranslation();
    const [mounted, setMounted] = useState(false);

    const { address, isConnected, chain } = useAccount();
    const { data: balance } = useBalance({ address });
    const { data: ensName } = useEnsName({ address });
    
    // هوک اصلاح شده را صدا می‌زنیم
    const { 
        isModalOpen, openModal, closeModal, connectors, 
        connect, disconnect, isPending, connectError 
    } = useWalletConnect();

    useEffect(() => {
        setMounted(true);
    }, []);

    // آدرس کوتاه شده
    const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";
    
    // فرمت موجودی (تا ۳ رقم اعشار)
    const formattedBalance = balance 
        ? parseFloat(formatEther(balance.value)).toFixed(3) 
        : "0";

    const copyAddress = () => {
        if (address) {
            navigator.clipboard.writeText(address);
            toast.success(t('common.copied'));
        }
    };

    // جلوگیری از خطای Hydration
    if (!mounted) {
        return (
            <Button className="font-semibold shadow-lg opacity-50 cursor-not-allowed">
                <Wallet className="mr-2 h-4 w-4" />
                {t('wallet.connect')}
            </Button>
        );
    }

    // حالت قطع اتصال (نمایش دکمه اتصال)
    if (!isConnected) {
        return (
            <>
                <Button 
                    onClick={openModal} 
                    className="font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all bg-primary text-primary-foreground hover:bg-primary/90"
                >
                    <Wallet className="mr-2 h-4 w-4" />
                    {t('wallet.connect')}
                </Button>
                
                <ConnectWalletModal 
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    connectors={connectors}
                    connect={connect} // اکنون تایپ‌ها هماهنگ هستند
                    isPending={isPending}
                    error={connectError}
                />
            </>
        );
    }

    // حالت متصل (نمایش دراپ‌داون پروفایل)
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="pl-2 pr-4 gap-2 h-10 border-primary/20 bg-background/50 hover:bg-muted/50 transition-colors">
                    {/* آواتار */}
                    <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-md -ml-1 border border-border/50">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={`https://effigy.im/a/${address}.png`} />
                            <AvatarFallback>Wallet</AvatarFallback>
                        </Avatar>
                    </div>
                    
                    {/* اطلاعات متنی */}
                    <div className="flex flex-col items-start text-xs leading-tight">
                        <span className="font-bold font-mono text-foreground/90">
                            {ensName || shortAddress}
                        </span>
                        {balance && (
                            <span className="text-muted-foreground text-[10px] font-medium">
                                {formattedBalance} {balance.symbol}
                            </span>
                        )}
                    </div>
                    <ChevronDown className="w-3 h-3 text-muted-foreground ml-1" />
                </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-60 p-2">
                <DropdownMenuLabel className="flex justify-between items-center px-2 py-1.5">
                    <span className="text-sm font-semibold">{t('wallet.my_account')}</span>
                    {chain && (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                            {chain.name}
                        </span>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1" />
                
                <DropdownMenuItem onClick={copyAddress} className="cursor-pointer gap-2 py-2.5">
                    <Copy className="w-4 h-4 text-muted-foreground" />
                    <span>{t('wallet.copy_address')}</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                    onClick={() => window.open(`https://amoy.polygonscan.com/address/${address}`, '_blank')} 
                    className="cursor-pointer gap-2 py-2.5"
                >
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    <span>{t('wallet.view_explorer')}</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="my-1" />
                
                <DropdownMenuItem onClick={() => disconnect()} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer gap-2 py-2.5">
                    <LogOut className="w-4 h-4" />
                    <span>{t('wallet.disconnect')}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}