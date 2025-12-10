// src/components/wallet/connect-wallet-modal.tsx

"use client";

import { useEffect, useState, useMemo } from "react";
import { useAccount, type Connector } from "wagmi";
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
import { Wallet, Shield, ChevronRight, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// آیکون‌های آنلاین و معتبر
const ICONS: Record<string, string> = {
  io_metaMask: "https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg",
  walletConnect: "https://raw.githubusercontent.com/WalletConnect/walletconnect-assets/master/Logo/Blue%20(Default)/Logo.svg",
  coinbaseWalletSDK: "https://raw.githubusercontent.com/0xsequence/web3-icons/master/assets/icons/coinbase.svg",
  safe: "https://raw.githubusercontent.com/0xsequence/web3-icons/master/assets/icons/gnosis-safe.svg",
  injected: "https://raw.githubusercontent.com/0xsequence/web3-icons/master/assets/icons/wallet-connect.svg",
};

// Helper: امن گرفتن شناسه کانکتور
function getConnectorId(connector: Connector | any): string {
  // اول id رسمی، سپس uid (در صورت وجود)، سپس name به عنوان fallback
  if (connector == null) return "unknown";
  if (typeof connector.id === "string" && connector.id.length > 0) return connector.id;
  if (typeof connector.uid === "string" && connector.uid.length > 0) return connector.uid;
  if (typeof connector.name === "string" && connector.name.length > 0) return connector.name;
  return "unknown";
}

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectors: readonly Connector[]; // از useConnect می‌آید
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
                    onClick={() => connect({ connector })}
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
                      onClick={() => connect({ connector })}
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
  // id رسمی کانکتور یا fallback
  const id = getConnectorId(connector);

  // انتخاب آیکون بر اساس id یا نوع یا fallback
  const iconSrc = ICONS[id] || ICONS[(connector as any).type] || ICONS.injected;

  // توضیحات کوتاه
  let description = t("wallet.click_to_connect");
  if (connector.name === "MetaMask") description = t("wallet.desc_metamask");
  if (connector.name === "WalletConnect") description = t("wallet.desc_walletconnect");
  if (connector.name === "Coinbase Wallet") description = t("wallet.desc_coinbase");

  // اگر connector.ready === false باشد، دکمه غیرفعال شود (مثلا در سرور یا محیط نامناسب)
  const disabled = (connector as any).ready === false;

  return (
    <Button
      variant="outline"
      className={cn(
        "w-full h-auto p-3 flex items-center justify-between group hover:border-primary/50 transition-all bg-card hover:bg-muted/50",
        isRecommended && "border-primary/20"
      )}
      onClick={onClick}
      disabled={Boolean(disabled || isPending)}
      aria-disabled={Boolean(disabled || isPending)}
    >
      <div className="flex items-center gap-3">
        <div className="relative w-8 h-8 rounded-lg bg-background p-1 shadow-sm border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={iconSrc} alt={connector.name || id} className="w-full h-full object-contain" />
        </div>
        <div className="flex flex-col items-start gap-0.5 text-start">
          <span className="font-semibold text-sm flex items-center gap-2">
            {connector.name}
            {isRecommended && connector.name === "WalletConnect" && (
              <Badge
                variant="secondary"
                className="h-3.5 px-1 text-[8px] bg-blue-100 text-blue-700 border-none rounded-sm"
              >
                {t("wallet.badge_mobile")}
              </Badge>
            )}
          </span>
          <span className="text-[9px] text-muted-foreground">{description}</span>
        </div>
      </div>

      {isPending ? (
        <DaoLoadingSpinner className="w-4 h-4 text-primary" />
      ) : (
        <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors rtl:rotate-180" />
      )}
    </Button>
  );
}
