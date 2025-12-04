// src/app/admin/[secureHash]/debug/page.tsx

"use client";

import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useReadContract } from 'wagmi';
import type { Address } from 'viem';
import { daoRegistryAbi } from '@/lib/blockchain/generated';
import { REGISTRY_KEYS } from '@/lib/blockchain/registry-keys';
import { useWeb3 } from '@/context/Web3Provider';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/use-translation';

// ... (AddressRow Component remains same) ...
function AddressRow({ label, value }: { label: string; value?: Address }) {
  const isZero = !value || value === '0x0000000000000000000000000000000000000000';
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0 border-border/50">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <Badge variant={isZero ? "destructive" : "secondary"} className="font-mono text-xs">
            {isZero ? "NOT SET" : "ACTIVE"}
        </Badge>
        <span className="font-mono text-xs break-all bg-muted/50 p-1.5 rounded select-all">{value || '-'}</span>
      </div>
    </div>
  );
}

export default function SecureDebugPage() {
  const { registryAddress, isHydrated } = useWeb3();
  const { t } = useTranslation();

  const queryCfg = { query: { enabled: !!registryAddress && isHydrated } } as const;

  // ... (Fetch logic remains same) ...
  const { data: dao } = useReadContract({ address: registryAddress as Address, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.DAO], ...queryCfg });
  // ... other contracts ...

  return (
    <div className="container py-10 max-w-4xl">
        <h1 className="text-3xl font-bold font-headline text-gradient mb-2">{t('page_titles.contract_debugger')}</h1>
        <p className="text-muted-foreground mb-8">System Registry Diagnostics & Health Check</p>

        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle>Registry Status</CardTitle>
            <CardDescription>Live resolution from on-chain registry</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center">
                      <span className="font-bold text-primary">Master Registry Contract</span>
                      <span className="font-mono text-sm">{registryAddress}</span>
                  </div>
              </div>
              
              <div className="space-y-1">
                <AddressRow label="DAO Core (Governance)" value={dao as Address} />
                {/* ... other rows ... */}
              </div>
          </CardContent>
        </Card>
    </div>
  );
}