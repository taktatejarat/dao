// src/app/components/layout/app-sidebar.tsx - FINAL REDESIGNED & TYPE-SAFE
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
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator, // ✅ اضافه شد
} from "@/components/ui/sidebar";
import {
  LayoutDashboard, FileText, PiggyBank, BarChart2, User,
  ShieldCheck, Wrench, BrainCircuit, ScrollText, LucideIcon,
  LogOut
} from "lucide-react";
import { Logo } from "@/components/icons/logo";
import { useWeb3 } from "@/context/Web3Provider";
import { useTranslation } from "@/hooks/use-translation";
import { useLanguage } from "@/context/LanguageProvider";
import type { UserRole } from "@/context/Web3Provider";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAccount, useDisconnect } from "wagmi";

// ... (Interface ها مثل قبل باقی می‌مانند)
interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  roles: UserRole[];
  isActive?: boolean;
  items?: { title: string; url: string; roles: UserRole[] }[];
}
interface NavGroup {
  label: string;
  items: NavItem[];
}

export function AppSidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { userRole, isHydrated } = useWeb3();
  const { direction } = useLanguage();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();

  const currentRole = userRole || 'voter';

  const data = React.useMemo(() => {
    const groups: NavGroup[] = [
      {
        label: t('sidebar.group_core'),
        items: [
          { title: t('sidebar.dashboard'), url: "/dashboard", icon: LayoutDashboard, roles: ['admin', 'investor', 'startup', 'voter', 'delegate'] },
          { title: t('sidebar.user_profile'), url: "/profile", icon: User, roles: ['admin', 'investor', 'startup', 'voter', 'delegate'] },
        ]
      },
      {
        label: t('sidebar.group_governance'),
        items: [
          {
            title: t('sidebar.proposals'), url: "/proposals", icon: FileText, roles: ['admin', 'investor', 'startup', 'voter', 'delegate'],
            items: [
              { title: t('sidebar.all_proposals'), url: "/proposals", roles: ['admin', 'investor', 'startup', 'voter', 'delegate'] },
              { title: t('sidebar.submit_proposal'), url: "/proposals/new", roles: ['startup'] },
            ]
          },
          { title: t('sidebar.staking'), url: "/staking", icon: PiggyBank, roles: ['admin', 'investor', 'startup', 'voter', 'delegate'] },
        ]
      },
      {
        label: t('sidebar.group_intelligence'),
        items: [
          { title: t('sidebar.ai_reports'), url: "/reports", icon: BrainCircuit, roles: ['admin', 'investor'] },
          { title: t('sidebar.user_analytics'), url: "/analytics", icon: BarChart2, roles: ['admin'] },
        ]
      },
      {
        label: t('sidebar.group_admin'),
        items: [
          { title: t('sidebar.treasury'), url: "/treasury", icon: ShieldCheck, roles: ['admin'] },
          { title: t('sidebar.contract_analyzer'), url: "/contract-analyzer", icon: Wrench, roles: ['admin'] },
          { title: t('sidebar.activity_logs'), url: "/logs", icon: ScrollText, roles: ['admin'] },
        ]
      }
    ];

    return groups.map(group => ({
      ...group,
      items: group.items.filter(item => item.roles.includes(currentRole))
    })).filter(group => group.items.length > 0);

  }, [t, currentRole, pathname]);

  return (
    <Sidebar collapsible="icon" side={direction === 'rtl' ? 'right' : 'left'} className="border-r border-border/50">
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

      <SidebarContent className="gap-0">
        {data.map((group, index) => (
          <React.Fragment key={group.label}>
            {/* ✅ اضافه کردن جداکننده بین گروه‌ها (به جز گروه اول) */}
            {index > 0 && <SidebarSeparator className="mx-4 my-2 opacity-50" />}
            
            <SidebarGroup className="py-2">
              {/* ✅ افزایش سایز فونت و بولد کردن تیتر گروه‌ها */}
              <SidebarGroupLabel className="text-sm font-bold text-foreground/80 uppercase tracking-wider px-4 mb-2 mt-1">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const isActive = pathname === item.url || (item.items && item.items.some(sub => pathname === sub.url));
                    return (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton 
                          asChild 
                          tooltip={item.title} 
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
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                        
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
                                    <Link href={subItem.url}>{subItem.title}</Link>
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
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold capitalize">{t(`role_selection.${userRole}`)}</span>
                    <span className="truncate text-xs text-muted-foreground font-mono">
                        {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '...'}
                    </span>
                  </div>
                  <button onClick={() => disconnect()} className="ml-auto text-muted-foreground hover:text-destructive transition-colors group-data-[collapsible=icon]:hidden">
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