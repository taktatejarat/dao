// src/components/auth/auth-guard.tsx

"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useWeb3 } from '@/context/Web3Provider';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { useTranslation } from '@/hooks/use-translation';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isConnected, isConnecting, isReconnecting } = useAccount();
  const { userRole, isRoleLoading, registryAddress, isHydrated } = useWeb3();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  
  const [isAuthorized, setIsAuthorized] = useState(false);

  // وضعیت لودینگ اولیه (شامل چک کردن وضعیت اتصال و هیدراتاسیون کانتکست)
  const isGlobalLoading = isConnecting || isReconnecting || isRoleLoading || !isHydrated;

  useEffect(() => {
    // 1. تا زمانی که وضعیت کلی مشخص نشده، کاری نکن (نمایش اسپینر)
    if (isGlobalLoading) return;

    // --- لیست صفحات عمومی (Public Routes) ---
    // این صفحات نیاز به هیچ شرطی ندارند و همیشه در دسترس هستند
    const publicPaths = ['/landing', '/guide', '/privacy', '/terms'];
    const isPublicPage = publicPaths.some(path => pathname.startsWith(path));

    // 2. اگر کاربر متصل نیست
    if (!isConnected) {
        if (isPublicPage) {
            setIsAuthorized(true); // اجازه دسترسی به صفحات عمومی
        } else {
            router.push('/landing'); // ریدایرکت به لندینگ برای صفحات خصوصی
        }
        return;
    }

    // --- از اینجا به بعد کاربر متصل است (Connected) ---

    // 3. چک کردن وضعیت استقرار پلتفرم (Setup Check)
    // اگر رجیستری ست نشده باشد، یعنی پلتفرم هنوز بالا نیامده (فقط برای ادمین اول)
    if (!registryAddress) {
        if (pathname !== '/setup') {
            router.push('/setup');
        } else {
            setIsAuthorized(true);
        }
        return;
    }

    // 4. چک کردن امضای قوانین (Terms Acceptance)
    // این مقدار در TermsPage پس از امضا در لوکال استوریج ست می‌شود
    const hasAcceptedTerms = typeof window !== 'undefined' ? localStorage.getItem('termsAccepted') : null;
    
    if (!hasAcceptedTerms) {
        // اگر هنوز قوانین را امضا نکرده، فقط اجازه دارد در صفحه Terms یا صفحات عمومی باشد
        if (pathname !== '/terms' && !isPublicPage) {
            router.push('/terms');
            return;
        }
    }

    // 5. چک کردن نقش کاربر (Role Check)
    // اگر نقش ندارد (و قوانین را پذیرفته)، باید نقش انتخاب کند
    if (!userRole && hasAcceptedTerms) {
        if (pathname !== '/role-selection' && !isPublicPage) {
            router.push('/role-selection');
            return;
        }
    }

    // 6. مدیریت ورود کاربران لاگین شده (Redirect Loop Prevention)
    // اگر کاربر همه مراحل (کانکت، قوانین، نقش) را طی کرده اما می‌خواهد به لندینگ یا انتخاب نقش برود
    // او را به داشبورد هدایت می‌کنیم (مگر اینکه در صفحه ستاپ باشد)
    const isAuthFlowPage = ['/landing', '/role-selection', '/terms'].includes(pathname);
    if (userRole && hasAcceptedTerms && isAuthFlowPage && pathname !== '/setup') {
        router.push('/dashboard');
        return;
    }

    // 7. نهایتاً اجازه دسترسی
    setIsAuthorized(true);

  }, [isGlobalLoading, isConnected, registryAddress, userRole, pathname, router]);

  // --- Render Logic ---

  if (isGlobalLoading || !isAuthorized) {
      return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-background animate-in fade-in duration-500">
              <DaoLoadingSpinner className="w-16 h-16 mb-4 text-primary" />
              <p className="text-muted-foreground font-medium animate-pulse">
                  {t('auth_guard.loading')}
              </p>
          </div>
      );
  }

  return <>{children}</>;
}