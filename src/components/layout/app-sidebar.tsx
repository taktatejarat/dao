// src/components/layout/app-sidebar.tsx

"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard, FileText, PiggyBank, BarChart2, User,
  ShieldCheck, BrainCircuit, LogOut, LucideIcon
} from "lucide-react";
import { Logo } from "@/components/icons/logo";
import { useWeb3 } from "@/context/Web3Provider";
import { useTranslation } from "@/hooks/use-translation";
import { useLanguage } from "@/context/LanguageProvider";
import type { UserRole } from "@/context/Web3Provider";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAccount, useDisconnect } from "wagmi";

// تعریف اینترفیس‌ها برای تایپ‌سیفتی
interface SubItem {
    titleKey: string; // کلید ترجمه
    url: string;
    roles: UserRole[];
}

interface NavItem {
  titleKey: string; // کلید ترجمه
  url: string;
  icon: LucideIcon;
  roles: UserRole[];
  items?: SubItem[];
}

interface NavGroup {
  labelKey: string; // کلید ترجمه
  items: NavItem[];
}

export function AppSidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { userRole, isHydrated } = useWeb3();
  const { direction } = useLanguage();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();

  // نقش پیش‌فرض برای کاربرانی که هنوز نقش ندارند (مهمان)
  const currentRole = userRole || 'voter';

  // تعریف ساختار منو با استفاده از کلیدهای ترجمه
  const navStructure: NavGroup[] = React.useMemo(() => [
      {
        labelKey: 'sidebar.group_core',
        items: [
          { titleKey: 'sidebar.dashboard', url: "/dashboard", icon: LayoutDashboard, roles: ['admin', 'investor', 'startup', 'voter', 'delegate'] },
          { titleKey: 'sidebar.user_profile', url: "/profile", icon: User, roles: ['admin', 'investor', 'startup', 'voter', 'delegate'] },
        ]
      },
      {
        labelKey: 'sidebar.group_governance',
        items: [
          {
            titleKey: 'sidebar.proposals', url: "/proposals", icon: FileText, roles: ['admin', 'investor', 'startup', 'voter', 'delegate'],
            items: [
              { titleKey: 'sidebar.all_proposals', url: "/proposals", roles: ['admin', 'investor', 'startup', 'voter', 'delegate'] },
              { titleKey: 'sidebar.submit_proposal', url: "/proposals/new", roles: ['startup', 'admin'] }, // ادمین هم باید ببیند
            ]
          },
          { titleKey: 'sidebar.staking', url: "/staking", icon: PiggyBank, roles: ['admin', 'investor', 'startup', 'voter', 'delegate'] },
        ]
      },
      {
        labelKey: 'sidebar.group_intelligence',
        items: [
          { titleKey: 'sidebar.ai_reports', url: "/reports", icon: BrainCircuit, roles: ['admin', 'investor'] },
          { titleKey: 'sidebar.user_analytics', url: "/analytics", icon: BarChart2, roles: ['admin'] },
        ]
      },
      {
        labelKey: 'sidebar.group_admin',
        items: [
          { titleKey: 'sidebar.treasury', url: "/treasury", icon: ShieldCheck, roles: ['admin'] },
        ]
      }
  ], []);

  // فیلتر کردن منو بر اساس نقش کاربر
  const filteredNav = React.useMemo(() => {
      return navStructure.map(group => ({
          ...group,
          items: group.items.filter(item => item.roles.includes(currentRole))
      })).filter(group => group.items.length > 0);
  }, [navStructure, currentRole]);

  return (
    <Sidebar collapsible="icon" side={direction === 'rtl' ? 'right' : 'left'} className="border-r border-border/50">
      
      {/* هدر سایدبار */}
      <SidebarHeader className="h-16 flex items-center justify-center border-b border-border/40 bg-sidebar/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 w-full px-2 transition-all group-data-[collapsible=icon]:justify-center">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
            <Logo className="size-6" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
            <span className="font-bold text-lg tracking-tight">RayanChain</span>
            <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">DAO Protocol</span>
          </div>
        </div>
      </SidebarHeader>

      {/* محتوای منو */}
      <SidebarContent className="gap-0">
        {filteredNav.map((group, index) => (
          <React.Fragment key={group.labelKey}>
            {index > 0 && <SidebarSeparator className="mx-4 my-2 opacity-50" />}
            
            <SidebarGroup className="py-2">
              <SidebarGroupLabel className="text-xs font-bold text-foreground/70 uppercase tracking-wider px-4 mb-2 mt-1">
                {t(group.labelKey)}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const isActive = pathname === item.url || (item.items && item.items.some(sub => pathname === sub.url));
                    return (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton 
                          asChild 
                          tooltip={t(item.titleKey)} 
                          isActive={isActive}
                          className={cn(
                            "h-10 transition-all duration-200 mx-2 w-auto rounded-lg font-medium",
                            isActive 
                              ? "bg-primary/10 text-primary shadow-sm hover:bg-primary/15 hover:text-primary" 
                              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                          )}
                        >
                          <Link href={item.url}>
                            <item.icon className={cn("size-4", isActive && "text-primary")} />
                            <span>{t(item.titleKey)}</span>
                          </Link>
                        </SidebarMenuButton>
                        
                        {/* زیرمنوها (Sub-menus) */}
                        {item.items && item.items.length > 0 && isActive && (
                          <SidebarMenuSub>
                            {item.items.map((subItem) => (
                               subItem.roles.includes(currentRole) && (
                                <SidebarMenuSubItem key={subItem.url}>
                                  <SidebarMenuSubButton 
                                    asChild 
                                    isActive={pathname === subItem.url}
                                    className={cn(pathname === subItem.url ? "text-primary font-medium" : "text-muted-foreground")}
                                  >
                                    <Link href={subItem.url}>{t(subItem.titleKey)}</Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                               )
                            ))}
                          </SidebarMenuSub>
                        )}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </React.Fragment>
        ))}
      </SidebarContent>

      {/* فوتر (پروفایل کاربر) */}
      <SidebarFooter className="border-t border-border/40 p-2 bg-sidebar/30">
        <SidebarMenu>
          <SidebarMenuItem>
            {isHydrated && userRole ? (
                <div className="flex items-center gap-3 p-2 rounded-lg bg-card border border-border/50 shadow-sm group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:shadow-none">
                  <Avatar className="h-9 w-9 rounded-lg border border-border">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {userRole.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-start text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    {/* ✅ استفاده از کلید ترجمه داینامیک برای نقش */}
                    <span className="truncate font-semibold capitalize">{t(`roles.${userRole}`)}</span>
                    <span className="truncate text-xs text-muted-foreground font-mono">
                        {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '...'}
                    </span>
                  </div>
                  <button onClick={() => disconnect()} className="ml-auto text-muted-foreground hover:text-destructive transition-colors group-data-[collapsible=icon]:hidden" title={t('wallet.disconnect')}>
                      <LogOut className="size-4" />
                  </button>
                </div>
            ) : (
                <div className="flex flex-col gap-2 p-2 group-data-[collapsible=icon]:hidden">
                    <div className="text-xs text-center text-muted-foreground">{t('sidebar.guest_mode')}</div>
                </div>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}