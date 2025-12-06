// src/components/wallet/custom-connect-button.tsx

"use client";

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
import { useEffect, useState } from "react"; // ✅ اضافه شد

export function CustomConnectButton() {
    const { t } = useTranslation();
    
    // ✅ اضافه کردن State برای تشخیص اینکه در کلاینت هستیم
    const [mounted, setMounted] = useState(false);

    const { address, isConnected, chain } = useAccount();
    const { data: balance } = useBalance({ address });
    const { data: ensName } = useEnsName({ address });
    
    const { 
        isModalOpen, openModal, closeModal, connectors, 
        connect, disconnect, isPending, connectError 
    } = useWalletConnect();

    // ✅ این افکت فقط در مرورگر اجرا می‌شود
    useEffect(() => {
        setMounted(true);
    }, []);

    const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";
    
    const copyAddress = () => {
        if (address) {
            navigator.clipboard.writeText(address);
            toast.success(t('common.copied'));
        }
    };

    // ✅ اگر هنوز صفحه کامل لود نشده (سمت سرور یا لحظه اول)، یک دکمه اسکلتی یا خالی نشان بده
    // این کار جلوی خطای {} را می‌گیرد چون سرور و کلاینت هر دو "هیچ" یا "Loading" می‌بینند.
    if (!mounted) {
        return (
            <Button className="font-semibold shadow-lg opacity-50 cursor-not-allowed">
                <Wallet className="mr-2 h-4 w-4" />
                {t('wallet.connect')}
            </Button>
        );
    }

    // --- از اینجا به بعد کد قبلی شماست ---
    if (!isConnected) {
        return (
            <>
                <Button 
                    onClick={openModal} 
                    className="font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
                >
                    <Wallet className="mr-2 h-4 w-4" />
                    {t('wallet.connect')}
                </Button>
                
                <ConnectWalletModal 
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    connectors={connectors}
                    connect={connect}
                    isPending={isPending}
                    error={connectError}
                />
            </>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="pl-2 pr-4 gap-2 h-10 border-primary/20 bg-background/50 hover:bg-muted/50">
                    <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-md -ml-1">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={`https://effigy.im/a/${address}.png`} />
                            <AvatarFallback>EOA</AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="flex flex-col items-start text-xs">
                        <span className="font-bold font-mono">
                            {ensName || shortAddress}
                        </span>
                        {balance && (
                            <span className="text-muted-foreground text-[10px]">
                                {parseFloat(balance.formatted).toFixed(3)} {balance.symbol}
                            </span>
                        )}
                    </div>
                    <ChevronDown className="w-3 h-3 text-muted-foreground ml-1" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
                {/* ... محتویات منو بدون تغییر ... */}
                <DropdownMenuLabel className="flex justify-between items-center">
                    <span>{t('wallet.my_account')}</span>
                    <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full border border-green-500/20">
                        {chain?.name || 'Unknown'}
                    </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={copyAddress} className="cursor-pointer">
                    <Copy className="w-4 h-4 mr-2" />
                    {t('wallet.copy_address')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(`https://amoy.polygonscan.com/address/${address}`, '_blank')} className="cursor-pointer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {t('wallet.view_explorer')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={disconnect} className="text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('wallet.disconnect')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}