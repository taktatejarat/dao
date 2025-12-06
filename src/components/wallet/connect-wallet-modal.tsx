// src/components/wallet/connect-wallet-modal.tsx

"use client";

import { useEffect } from "react";
import { useAccount, type Connector } from "wagmi"; // ✅ اضافه کردن تایپ Connector
import { Wallet, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { DaoLoadingSpinner } from "@/components/icons/dao-loading-spinner";

const WalletIcons: Record<string, string> = {
    metaMask: "https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg",
    coinbaseWalletSDK: "https://avatars.githubusercontent.com/u/18060234?s=200&v=4",
    walletConnect: "https://raw.githubusercontent.com/WalletConnect/walletconnect-assets/master/Logo/Blue%20(Default)/Logo.svg",
    injected: "/fonts/wallet-default.svg"
};

interface ConnectWalletModalProps {
    isOpen: boolean;
    onClose: () => void;
    // ✅ اصلاح تایپ: افزودن readonly و استفاده از تایپ Connector خود wagmi
    connectors: readonly Connector[]; 
    connect: (id: string) => void;
    isPending: boolean;
    error: Error | null;
}

export function ConnectWalletModal({
    isOpen,
    onClose,
    connectors,
    connect,
    isPending,
    error
}: ConnectWalletModalProps) {
    const { t } = useTranslation();
    const { isConnected } = useAccount();

    useEffect(() => {
        if (isConnected) {
            onClose();
        }
    }, [isConnected, onClose]);

    const uniqueConnectors = connectors.filter((c, index, self) => 
        index === self.findIndex((t) => t.id === c.id)
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px] p-0 gap-0 overflow-hidden border-border/50 bg-background/95 backdrop-blur-xl">
                <DialogHeader className="p-6 pb-2">
                    <div className="flex items-center justify-between">
                        <DialogTitle>{t('wallet.connect_title')}</DialogTitle>
                    </div>
                    <DialogDescription>
                        {t('wallet.connect_subtitle')}
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 pt-2 grid gap-3">
                    {uniqueConnectors.map((connector) => (
                        <Button
                            key={connector.id}
                            variant="outline"
                            className="h-14 justify-between px-4 hover:bg-muted/50 transition-all border-muted-foreground/20 group"
                            onClick={() => connect(connector.id)}
                            disabled={isPending}
                        >
                            <span className="flex items-center gap-3 font-semibold text-foreground/80 group-hover:text-primary transition-colors">
                                {WalletIcons[connector.id] && (
                                    <div className="relative w-6 h-6">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img 
                                            src={WalletIcons[connector.id]} 
                                            alt={connector.name} 
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                )}
                                {connector.name === 'Injected' ? 'Browser Wallet' : connector.name}
                            </span>
                            {isPending && <DaoLoadingSpinner className="w-4 h-4" />}
                        </Button>
                    ))}

                    {error && (
                        <div className="bg-destructive/10 text-destructive text-xs p-3 rounded-md flex items-start gap-2 mt-2">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{error.message.includes('User rejected') ? t('wallet.rejected') : error.message}</span>
                        </div>
                    )}
                </div>

                <div className="bg-muted/30 p-4 text-center text-xs text-muted-foreground border-t">
                    {t('wallet.terms_notice')}
                </div>
            </DialogContent>
        </Dialog>
    );
}