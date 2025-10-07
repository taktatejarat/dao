"use client";

import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useReadContract } from 'wagmi';
import type { Address } from 'viem';
import { daoRegistryAbi } from '@/lib/blockchain/generated';
import { REGISTRY_KEYS } from '@/lib/blockchain/registry-keys';
import { useWeb3 } from '@/context/Web3Provider';
import { Badge } from '@/components/ui/badge';

function AddressRow({ label, value }: { label: string; value?: Address }) {
  const isZero = !value || value === '0x0000000000000000000000000000000000000000';
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {isZero ? (
          <Badge variant="destructive">zero / unset</Badge>
        ) : (
          <Badge variant="secondary">ok</Badge>
        )}
        <span className="font-mono text-xs break-all">{value || '-'}</span>
      </div>
    </div>
  );
}

export default function RegistryDebugPage() {
  const { registryAddress, isHydrated } = useWeb3();

  const queryCfg = { query: { enabled: !!registryAddress && isHydrated } } as const;

  const { data: dao } = useReadContract({ address: registryAddress as Address, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.DAO], ...queryCfg });
  const { data: token } = useReadContract({ address: registryAddress as Address, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.TOKEN], ...queryCfg });
  const { data: finance } = useReadContract({ address: registryAddress as Address, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.FINANCE], ...queryCfg });
  const { data: staking } = useReadContract({ address: registryAddress as Address, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.STAKING], ...queryCfg });
  const { data: accControl } = useReadContract({ address: registryAddress as Address, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.ACC_CONTROL], ...queryCfg });
  const { data: userProfile } = useReadContract({ address: registryAddress as Address, abi: daoRegistryAbi, functionName: 'getAddress', args: [REGISTRY_KEYS.USER_PROFILE], ...queryCfg });

  return (
    <AppLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Registry Debug</CardTitle>
            <CardDescription>Live view of DAO Registry resolved addresses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!registryAddress ? (
              <Alert variant="destructive">
                <AlertTitle>No Registry Address</AlertTitle>
                <AlertDescription>Setup may be incomplete. Go to setup and configure deployment.</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Registry Address</span>
                  <span className="font-mono text-xs break-all">{registryAddress}</span>
                </div>
                <AddressRow label="DAO" value={dao as Address} />
                <AddressRow label="TOKEN" value={token as Address} />
                <AddressRow label="FINANCE" value={finance as Address} />
                <AddressRow label="STAKING" value={staking as Address} />
                <AddressRow label="ACC_CONTROL" value={accControl as Address} />
                <AddressRow label="USER_PROFILE" value={userProfile as Address} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}


