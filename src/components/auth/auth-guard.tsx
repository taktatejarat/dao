"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useWeb3 } from '@/context/Web3Provider';
import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { useTranslation } from '@/hooks/use-translation';

export function AuthGuard({ children }: { children: React.ReactNode }) {
    // ✅ Step 1: Replace contractAddress with registryAddress
    const { userRole, isRoleLoading, registryAddress, isHydrated } = useWeb3();
    const { status, isConnecting, isReconnecting } = useAccount();
    const router = useRouter();
    const pathname = usePathname();
    const { t } = useTranslation();
    
    // The loading state correctly depends on wagmi's connection status and our context's hydration
    const isLoading = isConnecting || isReconnecting || isRoleLoading || !isHydrated;
    const isConnected = status === 'connected';

    // Define page types once
    const isPublicPage = pathname === '/landing';
    const isSetupPage = pathname === '/setup';
    const isRoleSelectionPage = pathname === '/role-selection';

    useEffect(() => {
        // Don't perform any redirects until all initial state is loaded
        if (isLoading) {
            return;
        }

        // --- Rule 1: Not Connected ---
        // If the user is not connected, they must be on the public landing page.
        if (!isConnected) {
            if (!isPublicPage) {
                router.push('/landing');
            }
            return;
        }
        
        // --- From here, we know the user is connected ---

        // ✅ Step 2: Check for registryAddress to see if the platform is deployed.
        // --- Rule 2: Platform Not Deployed ---
        // If connected, but no registry contract is found, force the user to the setup page.
        if (!registryAddress && !isSetupPage) {
            router.push('/setup');
            return;
        }
        
        // --- From here, we know the platform is deployed (registry exists) ---

        // ✅ Step 3: Use registryAddress as the condition for subsequent logic.
        if (registryAddress) {
            // --- Rule 3: No Role Selected ---
            // If the platform is deployed but the user hasn't selected a role, force them to the role selection page.
            if (!userRole && !isRoleSelectionPage) {
                router.push('/role-selection');
            }
            // --- Rule 4: Role Selected, but on a Public/Auth Page ---
            // If the user has a role, they should be in the app. Redirect them from public/auth pages to the dashboard.
            // BUT: Allow them to stay on setup page if they want to reset or redeploy
            else if (userRole && !isSetupPage && (isPublicPage || pathname === '/')) {router.push('/dashboard');
            }
        }

    }, [isConnected, userRole, isLoading, pathname, router, registryAddress]);

    // --- Render Logic ---
    const isAuthPage = pathname === '/role-selection' || pathname === '/setup';

    // During the initial loading phase, always show a full-screen spinner.
    if (isLoading) {
       return (
           <div className="flex flex-col items-center justify-center min-h-screen bg-background">
               <DaoLoadingSpinner className="w-16 h-16 mb-4" />
               <p className="text-muted-foreground">{t('auth_guard.loading')}</p>
           </div>
       );
    }
    
    // Allow access to public pages (if not connected) or auth pages (if connected but not fully set up).
    if (isPublicPage || (isConnected && isAuthPage)) {
        return <>{children}</>;
    }

    // If the user is fully authenticated (connected + has a role), show the protected content.
    if (isConnected && userRole) {
        return <>{children}</>;
    }

    // This fallback spinner handles edge cases during state transitions, ensuring no blank screens appear.
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background">
            <DaoLoadingSpinner className="w-16 h-16 mb-4" />
            <p className="text-muted-foreground">{t('auth_guard.loading')}</p>
        </div>
    );
}