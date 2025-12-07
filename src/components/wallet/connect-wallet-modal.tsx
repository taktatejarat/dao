// src/components/wallet/connect-wallet-modal.tsx

"use client";

import { useEffect, useState, useMemo } from "react";
import { useAccount, type Connector } from "wagmi";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { DaoLoadingSpinner } from "@/components/icons/dao-loading-spinner";
import { Wallet, Shield, ChevronRight, QrCode, AlertTriangle } from "lucide-react"; // آیکون‌ها
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// آیکون‌های SVG برای برندها
const ICONS: Record<string, string> = {
    metaMask: "/images/wallets/MetaMask_Fox.svg",
    walletConnect: "/images/wallets/WalletConnect.svg",
    coinbaseWalletSDK: "/images/wallets/coinbase-v2.svg",
    safe: "/images/wallets/Msig-wallet.png",
    injected: "/images/wallets/wallet.svg"
};


interface ConnectWalletModalProps {
    isOpen: boolean;
    onClose: () => void;
    connectors: readonly Connector[];
    connect: (props: { connector: Connector }) => void;
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
    const { t, locale } = useTranslation(); // استفاده از locale برای راست‌چین/چپ‌چین
    const { isConnected } = useAccount();
    const [activeTab, setActiveTab] = useState("popular");
    const isRtl = locale === 'fa' || locale === 'ar';

    useEffect(() => {
        if (isConnected) onClose();
    }, [isConnected, onClose]);

    const uniqueConnectors = useMemo(() => {
        const unique = connectors.filter((c, index, self) => 
            index === self.findIndex((t) => t.name === c.name)
        );
        return {
            popular: unique.filter(c => ['MetaMask', 'WalletConnect'].includes(c.name)),
            others: unique.filter(c => !['MetaMask', 'WalletConnect'].includes(c.name))
        };
    }, [connectors]);

    const handleConnect = (connector: Connector) => {
        connect({ connector });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[420px] p-0 gap-0 overflow-hidden border-border/40 bg-background/95 backdrop-blur-xl shadow-2xl" dir={isRtl ? 'rtl' : 'ltr'}>
                
                {/* Header */}
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 pb-4 border-b border-border/50">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-primary/10 rounded-full text-primary">
                                <Wallet className="w-5 h-5" />
                            </div>
                            <DialogTitle className="text-xl font-bold font-headline">
                                {t('wallet.connect_title')}
                            </DialogTitle>
                        </div>
                        <p className="text-sm text-muted-foreground text-start">
                            {t('wallet.connect_subtitle')}
                        </p>
                    </DialogHeader>
                </div>

                <div className="p-6">
                    <Tabs defaultValue="popular" className="w-full" onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/50">
                            <TabsTrigger value="popular" className="data-[state=active]:bg-background shadow-sm">
                                {t('wallet.tab_recommended')}
                            </TabsTrigger>
                            <TabsTrigger value="others" className="data-[state=active]:bg-background shadow-sm">
                                {t('wallet.tab_others')}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="popular" className="space-y-3 mt-0">
                            {uniqueConnectors.popular.map((connector) => (
                                <WalletButton 
                                    key={connector.uid} 
                                    connector={connector} 
                                    onClick={() => handleConnect(connector)}
                                    isPending={isPending}
                                    isRecommended
                                    t={t} // پاس دادن تابع ترجمه
                                />
                            ))}
                        </TabsContent>

                        <TabsContent value="others" className="space-y-3 mt-0">
                            {uniqueConnectors.others.length > 0 ? (
                                uniqueConnectors.others.map((connector) => (
                                    <WalletButton 
                                        key={connector.uid} 
                                        connector={connector} 
                                        onClick={() => handleConnect(connector)}
                                        isPending={isPending}
                                        t={t}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground text-sm flex flex-col items-center gap-2">
                                    <AlertTriangle className="w-8 h-8 opacity-50" />
                                    {t('wallet.no_other_wallets')}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>

                    {error && (
                        <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex gap-3 items-start animate-in slide-in-from-bottom-2">
                            <Shield className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                            <div className="flex-1 text-start">
                                <p className="text-xs font-bold text-destructive mb-0.5">{t('wallet.connection_failed')}</p>
                                <p className="text-[11px] text-destructive/80 leading-tight">
                                    {error.message.includes('User rejected') 
                                        ? t('wallet.rejected') 
                                        : error.message.substring(0, 80) + '...'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-muted/30 p-4 border-t border-border/50 flex justify-center items-center gap-2 text-[10px] text-muted-foreground">
                    <Shield className="w-3 h-3" />
                    <span>{t('wallet.secure_connection_note')}</span>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function WalletButton({ connector, onClick, isPending, isRecommended, t }: any) {
    const iconSrc = ICONS[connector.id] || ICONS[connector.type] || ICONS.injected;
    
    let description = t('wallet.click_to_connect');
    if (connector.name === 'MetaMask') description = t('wallet.desc_metamask');
    if (connector.name === 'WalletConnect') description = t('wallet.desc_walletconnect');
    if (connector.name === 'Coinbase Wallet') description = t('wallet.desc_coinbase');

    return (
        <Button
            variant="outline"
            className={cn(
                "w-full h-auto p-4 flex items-center justify-between group hover:border-primary/50 transition-all duration-300 bg-background/50",
                isRecommended && "border-primary/20 bg-primary/5"
            )}
            onClick={onClick}
            disabled={isPending}
        >
            <div className="flex items-center gap-4">
                <div className="relative w-10 h-10 rounded-xl bg-white p-1.5 shadow-sm border group-hover:scale-110 transition-transform">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={iconSrc} alt={connector.name} className="w-full h-full object-contain" />
                </div>
                <div className="flex flex-col items-start gap-0.5">
                    <span className="font-semibold text-sm flex items-center gap-2">
                        {connector.name}
                        {isRecommended && connector.name === 'WalletConnect' && (
                            <Badge variant="secondary" className="h-4 px-1 text-[9px] bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">
                                {t('wallet.badge_mobile')}
                            </Badge>
                        )}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-normal">{description}</span>
                </div>
            </div>
            
            {isPending ? (
                <DaoLoadingSpinner className="w-4 h-4" />
            ) : (
                <div className="text-muted-foreground/30 group-hover:text-primary transition-colors rtl:rotate-180">
                    {connector.name === 'WalletConnect' ? <QrCode className="w-5 h-5"/> : <ChevronRight className="w-5 h-5" />}
                </div>
            )}
        </Button>
    );
}