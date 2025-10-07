
"use client";

import { Header } from "@/components/layout/header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useLanguage } from "@/context/LanguageProvider";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { direction, locale } = useLanguage();

  return (
    <SidebarProvider>
      <div 
        className={cn(
          "flex h-screen w-full bg-background font-body"
        )} 
        dir={direction}
        lang={locale}
      >
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}
