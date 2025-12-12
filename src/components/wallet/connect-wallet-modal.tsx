// src/components/wallet/connect-wallet-modal.tsx

"use client";

import { useEffect, useState, useMemo } from "react";
import { useAccount, type Connector } from "wagmi";
import { useAppKit } from "@reown/appkit/react"; 
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { DaoLoadingSpinner } from "@/components/icons/dao-loading-spinner";
import { Wallet, Shield, ChevronRight, AlertTriangle, QrCode, Smartphone, Monitor } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import Image from "next/image";

// ✅ اصلاح آدرس آیکون‌ها به مسیر لوکال
const ICONS: Record<string, string> = {
  // MetaMask
  "io.metamask": "/images/wallets/MetaMask_Fox.svg",
  "io_metamask": "/images/wallets/MetaMask_Fox.svg",
  "metamask": "/images/wallets/MetaMask_Fox.svg",
  "MetaMask": "/images/wallets/MetaMask_Fox.svg",
  
  // WalletConnect
  "walletconnect": "/images/wallets/WalletConnect.svg",
  "WalletConnect": "/images/wallets/WalletConnect.svg",
  
  // Coinbase
  "coinbasewalletsdk": "/images/wallets/coinbase-v2.svg",
  "Coinbase Wallet": "/images/wallets/coinbase-v2.svg",
  
  // Safe & Others (Fallback to generic wallet icon if specific not found)
  "safe": "/images/wallets/wallet.svg",
  "injected": "/images/wallets/wallet.svg",
  "fallback": "/images/wallets/wallet.svg"
};

function getConnectorId(connector: Connector | any): string {
  if (connector == null) return "unknown";
  if (typeof connector.id === "string" && connector.id.length > 0) return connector.id;
  if (typeof connector.uid === "string" && connector.uid.length > 0) return connector.uid;
  if (typeof connector.name === "string" && connector.name.length > 0) return connector.name;
  return "unknown";
}

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectors: readonly Connector[]; 
  connect: (props: { connector: Connector }) => void;
  isPending: boolean;
  error: Error | null;
  pendingConnectorId?: string | null;
}

export function ConnectWalletModal({
  isOpen,
  onClose,
  connectors,
  connect,
  isPending,
  error,
  pendingConnectorId,
}: ConnectWalletModalProps) {
  const { t, locale } = useTranslation();
  const { isConnected } = useAccount();
  const { open: openAppKit } = useAppKit(); 
  const [activeTab, setActiveTab] = useState("popular");
  const dir = locale === "fa" || locale === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    if (isConnected) onClose();
  }, [isConnected, onClose]);

  const uniqueConnectors = useMemo(() => {
    const unique = connectors.filter((c, index, self) =>
      index === self.findIndex((t) => t.name === c.name)
    );
    return {
      popular: unique.filter((c) =>
        ["MetaMask", "WalletConnect", "Coinbase Wallet"].includes(c.name)
      ),
      others: unique.filter(
        (c) => !["MetaMask", "WalletConnect", "Coinbase Wallet"].includes(c.name)
      ),
    };
  }, [connectors]);

  // ✅ اصلاح منطق اتصال:
  // برای متامسک و ولت‌کانکت، کنترل را به Reown می‌سپاریم تا کاربر بتواند بین QR Code و Desktop انتخاب کند.
  const handleConnectionRequest = (connector: Connector) => {
      const needsQrOption = ['WalletConnect', 'MetaMask'].includes(connector.name);
      
      if (needsQrOption) {
          onClose(); // بستن مودال سفارشی ما
          // باز کردن مودال Reown که تب‌های QR و Desktop دارد
          openAppKit({ view: 'Connect' });
      } else {
          // برای سایر کیف پول‌ها (مثل Safe یا کیف پول‌های خاص مرورگر) اتصال مستقیم
          connect({ connector });
      }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[400px] p-0 gap-0 overflow-hidden border-border/40 bg-background/95 backdrop-blur-xl shadow-2xl"
        dir={dir}
      >
        <div className="bg-muted/30 p-6 pb-4 border-b border-border/50">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-primary/10 rounded-full text-primary">
                <Wallet className="w-5 h-5" />
              </div>
              <DialogTitle className="text-lg font-bold font-headline">
                {t("wallet.connect_title")}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              {t("wallet.connect_subtitle")}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-4">
          <Tabs defaultValue="popular" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="popular">{t("wallet.tab_recommended")}</TabsTrigger>
              <TabsTrigger value="others">{t("wallet.tab_others")}</TabsTrigger>
            </TabsList>

            <TabsContent value="popular" className="space-y-2 mt-0">
              {uniqueConnectors.popular.map((connector) => {
                const id = getConnectorId(connector);
                return (
                  <WalletButton
                    key={id}
                    connector={connector}
                    onClick={() => handleConnectionRequest(connector)}
                    isPending={Boolean(isPending && pendingConnectorId === id)}
                    isRecommended
                    t={t}
                  />
                );
              })}
            </TabsContent>

            <TabsContent value="others" className="space-y-2 mt-0">
              {uniqueConnectors.others.length > 0 ? (
                uniqueConnectors.others.map((connector) => {
                  const id = getConnectorId(connector);
                  return (
                    <WalletButton
                      key={id}
                      connector={connector}
                      onClick={() => handleConnectionRequest(connector)}
                      isPending={Boolean(isPending && pendingConnectorId === id)}
                      t={t}
                    />
                  );
                })
              ) : (
                <div className="text-center py-6 text-muted-foreground text-xs flex flex-col items-center gap-2">
                  <AlertTriangle className="w-6 h-6 opacity-30" />
                  {t("wallet.no_other_wallets")}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md flex gap-3 items-start animate-in fade-in">
              <Shield className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1 text-start">
                <p className="text-xs font-bold text-red-600 mb-0.5">
                  {t("wallet.connection_failed")}
                </p>
                <p className="text-[10px] text-red-500/80 leading-tight">
                  {error.message.includes("User rejected") ? t("wallet.rejected") : t("common.error")}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-muted/20 p-3 border-t border-border/50 text-center">
          <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
            <Shield className="w-3 h-3" /> {t("wallet.secure_connection_note")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WalletButton({ connector, onClick, isPending, isRecommended, t }: any) {
  const id = getConnectorId(connector);
   // ✅ منطق انتخاب آیکون بر اساس فایل‌های لوکال
  // اولویت با نام دقیق است، سپس با شناسه، سپس نوع، و در نهایت آیکون پیش‌فرض
  const iconSrc = 
    ICONS[connector.name] || 
    ICONS[id] || 
    ICONS[(connector as any).type] || 
    ICONS["fallback"];

  const supportsQr = ['WalletConnect', 'MetaMask'].includes(connector.name);

  let description = t("wallet.click_to_connect");
  if (connector.name === "MetaMask") description = t("wallet.desc_metamask");
  if (connector.name === "WalletConnect") description = t("wallet.desc_walletconnect");
  if (connector.name === "Coinbase Wallet") description = t("wallet.desc_coinbase");

  const disabled = (connector as any).ready === false && !supportsQr;

  return (
    <Button
      variant="outline"
      className={cn(
        "w-full h-auto p-3 flex items-center justify-between group hover:border-primary/50 transition-all bg-card hover:bg-muted/50",
        isRecommended && "border-primary/20"
      )}
      onClick={onClick}
      disabled={Boolean(disabled || isPending)}
    >
      <div className="flex items-center gap-3">
        <div className="relative w-8 h-8 rounded-lg bg-background p-1 shadow-sm border flex items-center justify-center overflow-hidden">
           {/* ✅ استفاده از Image کامپوننت Next.js برای بهینه‌سازی */}
           <Image 
             src={iconSrc} 
             alt={connector.name || id} 
             width={32} 
             height={32} 
             className="object-contain"
           />
        </div>
        <div className="flex flex-col items-start gap-0.5 text-start">
          <span className="font-semibold text-sm flex items-center gap-2">
            {connector.name}
            {isRecommended && supportsQr && (
              <Badge
                variant="secondary"
                className="h-3.5 px-1 text-[8px] bg-blue-100 text-blue-700 border-none rounded-sm flex items-center gap-0.5"
              >
                <Smartphone className="w-2 h-2" />
                {t("wallet.badge_mobile")}
              </Badge>
            )}
          </span>
          <span className="text-[9px] text-muted-foreground">{description}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {supportsQr && !isPending && (
            <QrCode className="w-3 h-3 text-muted-foreground/50" />
        )}
        
        {isPending ? (
            <DaoLoadingSpinner className="w-4 h-4 text-primary" />
        ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors rtl:rotate-180" />
        )}
      </div>
    </Button>
  );
}