// src/components/wallet/custom-connect-button.tsx

"use client";

import { useEffect, useState } from "react";
import { useAccount, useBalance, useEnsName, useConnect, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { ConnectWalletModal } from "./connect-wallet-modal"; // مودال سفارشی خودمان
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
import { formatEther } from "viem";

export function CustomConnectButton() {
    const { t } = useTranslation();
    const [mounted, setMounted] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { address, isConnected, chain } = useAccount();
    const { data: balance } = useBalance({ address });
    const { data: ensName } = useEnsName({ address });
    
    // استفاده از هوک‌های استاندارد Wagmi (که الان توسط Reown قدرت گرفته‌اند)
    const { connectors, connect, isPending, error: connectError } = useConnect();
    const { disconnect } = useDisconnect();

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleConnect = ({ connector }: { connector: any }) => {
        connect({ connector });
        // مودال وقتی isConnected true شود بسته می‌شود (در داخل مودال هندل شده)
    };

    // ... (توابع کمکی کپی آدرس و فرمت - بدون تغییر)
    const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";
    const formattedBalance = balance ? parseFloat(formatEther(balance.value)).toFixed(3) : "0";
    const copyAddress = () => { navigator.clipboard.writeText(address || ''); toast.success(t('common.copied')); };

    if (!mounted) {
        return <Button disabled><Wallet className="mr-2 h-4 w-4" />{t('wallet.connect')}</Button>;
    }

    if (!isConnected) {
        return (
            <>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Wallet className="mr-2 h-4 w-4" />
                    {t('wallet.connect')}
                </Button>
                
                {/* استفاده از مودال سفارشی خودمان */}
                <ConnectWalletModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    connectors={connectors}
                    connect={handleConnect}
                    isPending={isPending}
                    error={connectError}
                />
            </>
        );
    }

    // ... (بخش دراپ‌داون پروفایل - بدون تغییر)
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Avatar className="h-6 w-6"><AvatarImage src={`https://effigy.im/a/${address}.png`} /></Avatar>
                    <span>{ensName || shortAddress}</span>
                    <ChevronDown className="w-4 h-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('wallet.my_account')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => disconnect()} className="text-red-500">
                    <LogOut className="w-4 h-4 mr-2" /> {t('wallet.disconnect')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}