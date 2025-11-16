// src/components/auth/auth-guard.tsx - FINAL, CORRECTED VERSION

"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useWeb3 } from '@/context/Web3Provider';
import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { useTranslation } from '@/hooks/use-translation';

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { userRole, isRoleLoading, registryAddress, isHydrated } = useWeb3();
    const { status, isConnecting, isReconnecting } = useAccount();
    const router = useRouter();
    const pathname = usePathname();
    const { t } = useTranslation();
    
    const isLoading = isConnecting || isReconnecting || isRoleLoading || !isHydrated;
    const isConnected = status === 'connected';

    // ✅ FIX 1: تعریف دقیق وضعیت استقرار پلتفرم
    const isPlatformDeployed = !!registryAddress;

    const isSetupPage = pathname === '/setup';
    const isRoleSelectionPage = pathname === '/role-selection';
    
    // ادمین می‌تواند همیشه به صفحه setup دسترسی داشته باشد
    const isAdmin = userRole === 'admin';

    useEffect(() => {
        if (isLoading) return; // تا زمان بارگذاری کامل، هیچ اقدامی نکن

        // --- Rule 1: پلتفرم هنوز مستقر نشده است ---
        // هر کاربری (حتی متصل) باید به صفحه setup هدایت شود.
        if (!isPlatformDeployed) {
            if (!isSetupPage) {
                console.log("[AuthGuard] Redirecting to /setup (platform not deployed).");
                router.replace('/setup');
            }
            return; // اجرای useEffect را متوقف کن
        }
        
        // --- از اینجا به بعد، می‌دانیم که پلتفرم مستقر شده است (isPlatformDeployed = true) ---

        // --- Rule 2: کاربر متصل نیست ---
        // اگر پلتفرم مستقر شده ولی کاربر متصل نیست، باید به صفحه‌ای برای اتصال کیف پول برود.
        // می‌توانیم او را به همان role-selection بفرستیم که دکمه Connect را دارد.
        if (!isConnected) {
            if (!isRoleSelectionPage) {
                 console.log("[AuthGuard] Redirecting to /role-selection (user not connected).");
                 router.replace('/role-selection');
            }
            return;
        }

        // --- از اینجا به بعد، می‌دانیم پلتفرم مستقر و کاربر متصل است ---

        // --- Rule 3: کاربر نقش ندارد ---
        // باید به صفحه انتخاب نقش هدایت شود.
        if (!userRole) {
            // ادمین نیازی به انتخاب نقش ندارد
            if (!isAdmin && !isRoleSelectionPage) {
                console.log("[AuthGuard] Redirecting to /role-selection (user has no role).");
                router.replace('/role-selection');
            }
            return;
        }
        
        // --- Rule 4: کاربر نقش دارد و در صفحات اولیه (setup/role-selection) است ---
        // او را به داشبورد هدایت کن.
        if (userRole) {
            if (isRoleSelectionPage) {
                console.log("[AuthGuard] Redirecting to /dashboard (user already has a role).");
                router.replace('/dashboard');
            }
            // ادمین می‌تواند در صفحه setup بماند
            if (isSetupPage && !isAdmin) {
                 console.log("[AuthGuard] Redirecting non-admin to /dashboard from /setup.");
                 router.replace('/dashboard');
            }
        }

    }, [isConnected, userRole, isLoading, pathname, router, registryAddress, isPlatformDeployed, isAdmin]);

    // --- منطق رندر ---
    if (isLoading) {
       return (
           <div className="flex items-center justify-center min-h-screen">
               <DaoLoadingSpinner className="w-12 h-12" />
           </div>
       );
    }

    // اگر پلتفرم مستقر نشده، فقط به صفحه setup اجازه دسترسی بده
    if (!isPlatformDeployed) {
        return isSetupPage ? <>{children}</> : null;
    }

    // اگر پلتفرم مستقر شده، به صفحات setup (فقط برای ادمین) و role-selection (برای همه) اجازه دسترسی بده
    if (isSetupPage && isAdmin) return <>{children}</>;
    if (isRoleSelectionPage) return <>{children}</>;
    
    // اگر کاربر نقش دارد و در صفحه دیگری است، محتوا را نمایش بده
    if (userRole) {
        return <>{children}</>;
    }
    
    // بازگشت به لودینگ برای حالت‌های گذار
    return (
        <div className="flex items-center justify-center min-h-screen">
            <DaoLoadingSpinner className="w-12 h-12" />
        </div>
    );
}