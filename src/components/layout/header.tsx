// src/components/layout/header.tsx - SMART SEARCH IMPLEMENTED

"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Sun, Moon, Command, Bell } from "lucide-react";
import { LanguageSwitcher } from "./language-switcher";
import { useTranslation } from "@/hooks/use-translation";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { SidebarTrigger } from "../ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { isAddress } from "viem"; // برای تشخیص آدرس کیف پول

export function Header() {
  const { setTheme, theme } = useTheme();
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // منطق هوشمند جستجو
  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const query = searchQuery.trim();
      if (!query) return;

      // 1. اگر آدرس کیف پول است -> برو به آنالیتیکس
      if (isAddress(query)) {
        router.push(`/analytics?address=${query}`);
      }
      // 2. اگر عدد است -> برو به پروپوزال خاص
      else if (/^\d+$/.test(query)) {
        router.push(`/proposals/${query}`);
      }
      // 3. اگر متن است -> برو به لیست پروپوزال‌ها با کوئری
      else {
        router.push(`/proposals?q=${encodeURIComponent(query)}`);
      }
      
      // اختیاری: پاک کردن فیلد بعد از جستجو
      setSearchQuery(""); 
    }
  };

  const getPageTitle = () => {
    // 1. بررسی دقیق صفحات خاص (بدون تغییر)
    if (pathname === '/dashboard') return t('page_titles.dashboard');
    if (pathname === '/proposals/new') return t('page_titles.new_proposal');
    if (pathname.startsWith('/proposals/')) return t('page_titles.proposal_details');
    if (pathname.startsWith('/admin') && pathname.includes('/settings')) return t('page_titles.admin_settings');
    if (pathname.startsWith('/reports') && (pathname.includes('?id=') || pathname.length > 8)) return t('page_titles.ai_report_detail');

    // 2. دریافت سگمنت اول URL
    let segment = pathname.split('/')[1] || 'dashboard';
    
    // ✅ FIX: تبدیل خط تیره به زیرخط برای هماهنگی با فایل زبان
    // contract-analyzer -> contract_analyzer
    segment = segment.replace(/-/g, '_');

    // تلاش برای یافتن کلید
    const titleKey = `page_titles.${segment}`;
    const translated = t(titleKey);

    // اگر ترجمه پیدا نشد، فال‌بک را نمایش بده
    if (translated === titleKey) {
        // تبدیل مجدد برای نمایش زیبا (حذف زیرخط و بزرگ کردن حرف اول)
        return segment.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    return translated;
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-4 border-b border-border/40 bg-background/80 px-4 shadow-sm backdrop-blur-md transition-all sm:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-primary" />
        <Separator orientation="vertical" className="mr-2 h-4 hidden md:block" />
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
            />
            <div className="absolute right-3 top-2.5 flex items-center gap-1 opacity-50 rtl:left-3 rtl:right-auto pointer-events-none">
                <span className="text-[10px] bg-muted px-1.5 rounded border">Enter</span>
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