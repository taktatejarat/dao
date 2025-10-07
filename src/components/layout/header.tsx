
"use client";

import { useTheme } from "next-themes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Sun, Moon } from "lucide-react";
import { LanguageSwitcher } from "./language-switcher";
import { useTranslation } from "@/hooks/use-translation";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { SidebarTrigger } from "../ui/sidebar";

export function Header() {
  const { setTheme, theme } = useTheme();
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-card px-4 sm:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="relative flex-1">
        <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder={t('header.search')}
          className="w-full rounded-lg bg-background ps-8 md:w-[200px] lg:w-[320px]"
        />
      </div>

      <div className="flex items-center gap-2 ms-auto rtl:ms-0 rtl:me-auto">
        <LanguageSwitcher />
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label={t('header.toggle_theme')}>
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{t('header.toggle_theme')}</span>
        </Button>
        <ConnectButton />
      </div>
    </header>
  );
}
