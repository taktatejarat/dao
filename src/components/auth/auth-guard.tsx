'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { usePathname, useRouter } from 'next/navigation';
import { useWeb3 } from '@/context/Web3Provider';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';

interface AuthGuardProps {
  children: React.ReactNode;
}

// Global guard: if wallet not connected, push to landing.
// Extra check: admin routes require admin wallet.
export function AuthGuard({ children }: AuthGuardProps) {
  const { status, address, isConnected } = useAccount();
  const { userRole, isHydrated } = useWeb3();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const isAdminRoute = pathname?.startsWith('/admin');
  const adminEnv = process.env.NEXT_PUBLIC_ADMIN_ADDRESS?.toLowerCase();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    // If wallet disconnected at any time, send to landing
    if (status === 'disconnected' || !isConnected) {
      router.replace('/landing');
      return;
    }
    // For admin routes, enforce admin wallet/role
    if (isAdminRoute) {
      const isAdminAddress = adminEnv && address ? address.toLowerCase() === adminEnv : false;
      if (!isHydrated) return; // wait for role hydration to avoid flicker
      if (userRole !== 'admin' || !isAdminAddress) {
        router.replace('/landing');
      }
    }
  }, [mounted, status, isConnected, isAdminRoute, userRole, isHydrated, router, address, adminEnv]);

  // Show a lightweight loader during initial hydration or connecting state
  if (!mounted || status === 'connecting' || (isAdminRoute && !isHydrated)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <DaoLoadingSpinner />
      </div>
    );
  }

  return <>{children}</>;
}

