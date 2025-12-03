// src/app/components/layout/header.tsx - FINAL REDESIGNED & TYPE-SAFE
"use client";

import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Sun, Moon, Command, Bell } from "lucide-react";
import { LanguageSwitcher } from "./language-switcher";
import { useTranslation } from "@/hooks/use-translation";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { SidebarTrigger } from "../ui/sidebar";
import { Separator } from "@/components/ui/separator";

export function Header() {
  const { setTheme, theme } = useTheme();
  const { t } = useTranslation();
  const pathname = usePathname();

  // ✅ منطق جدید برای دریافت عنوان صفحه
  const getPageTitle = () => {
    // 1. بررسی دقیق صفحات خاص (برای جلوگیری از تداخل)
    if (pathname === '/dashboard') return t('page_titles.dashboard');
    if (pathname === '/proposals/new') return t('page_titles.new_proposal');
    if (pathname.startsWith('/proposals/')) return t('page_titles.proposal_details');
    if (pathname.startsWith('/admin') && pathname.includes('/settings')) return t('page_titles.admin_settings');
    if (pathname.startsWith('/reports') && (pathname.includes('?id=') || pathname.length > 8)) return t('page_titles.ai_report_detail');

    // 2. بررسی عمومی بر اساس سگمنت اول URL
    const segment = pathname.split('/')[1] || 'dashboard';
    
    // تلاش برای یافتن کلید در دیکشنری page_titles
    const titleKey = `page_titles.${segment}`;
    const translated = t(titleKey);

    // اگر ترجمه پیدا نشد (یعنی کلید را برگرداند)، از فال‌بک استفاده کن
    if (translated === titleKey) {
        // فال‌بک: نام انگلیسی را مرتب کن (حرف اول بزرگ)
        return segment.charAt(0).toUpperCase() + segment.slice(1);
    }
    
    return translated;
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-4 border-b border-border/40 bg-background/80 px-4 shadow-sm backdrop-blur-md transition-all sm:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-primary" />
        <Separator orientation="vertical" className="mr-2 h-4 hidden md:block" />
        {/* Page Title */}
        <h2 className="text-sm font-bold text-foreground hidden md:block animate-in fade-in slide-in-from-left-2">
            {getPageTitle()}
        </h2>
      </div>

      <div className="flex-1 flex justify-center md:justify-start">
        <div className="relative hidden md:flex items-center w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground rtl:right-2.5 rtl:left-auto" />
            <Input
            type="search"
            placeholder={t('header.search')}
            className="w-full rounded-full bg-muted/50 pl-9 pr-12 rtl:pr-9 rtl:pl-12 focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-primary/20 transition-all"
            />
            <div className="absolute right-3 top-2.5 flex items-center gap-1 opacity-50 rtl:left-3 rtl:right-auto">
                <Command className="h-3 w-3" />
                <span className="text-[10px]">K</span>
            </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hidden sm:flex">
            <Bell className="h-5 w-5" />
        </Button>

        <LanguageSwitcher />
        
        <Button 
          variant="ghost" 
          size="icon"
          className="text-muted-foreground hover:text-primary"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label={t('header.toggle_theme')}>
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
        
        <div className="h-8 w-[1px] bg-border mx-1 hidden sm:block"></div>
        
        <ConnectButton 
            accountStatus={{ smallScreen: 'avatar', largeScreen: 'full' }}
            chainStatus="icon"
            showBalance={false}
        />
      </div>
    </header>
  );
}