"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { BrainCircuit } from "lucide-react"; 
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  FileText,
  PiggyBank,
  BarChart,
  User,
  Server,
  ScrollText,
  ShieldCheck,
  Wrench,
  LucideIcon, // ✅ وارد کردن نوع داده برای آیکون
} from "lucide-react";
import { Logo } from "@/components/icons/logo";
import { useWeb3 } from "@/context/Web3Provider";
import { useTranslation } from "@/hooks/use-translation";
import { useLanguage } from "@/context/LanguageProvider";
import type { UserRole } from "@/context/Web3Provider"; // وارد کردن نوع UserRole

// ✅✅✅ راه‌حل کلیدی: تعریف نوع داده برای آیتم‌های نویگیشن ✅✅✅
interface NavSubItem {
  href: string;
  label: string;
  roles: UserRole[];
}

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
  roles: UserRole[];
  subItems?: NavSubItem[]; // subItems اختیاری است
}

export function AppSidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { userRole } = useWeb3();
  const { direction } = useLanguage();

  const navItems = React.useMemo(() => {
    // ✅ به TypeScript می‌گوییم که این آرایه از نوع NavItem است
    const baseItems: NavItem[] = [
      {
        href: "/dashboard",
        icon: LayoutDashboard,
        label: t('sidebar.dashboard'),
        active: pathname.startsWith('/dashboard'),
        roles: ['admin', 'investor', 'startup', 'voter'],
      },
      {
        href: "/proposals",
        icon: FileText,
        label: t('sidebar.proposals'),
        active: pathname.startsWith('/proposals'),
        roles: ['admin', 'investor', 'startup', 'voter'],
        subItems: [
          { href: "/proposals/new", label: t('sidebar.submit_proposal'), roles: ['startup'] },
        ]
      },
       {
        href: "/staking",
        icon: PiggyBank,
        label: t('sidebar.staking'),
        active: pathname.startsWith('/staking'),
        roles: ['investor'],
      },
       {
        href: "/treasury",
        icon: ShieldCheck,
        label: t('sidebar.treasury'),
        active: pathname.startsWith('/treasury'),
        roles: ['admin'],
      },
      {
        href: "/reports",
        icon: BrainCircuit,
        label: t('sidebar.ai_reports'),
        active: pathname.startsWith('/reports'),
        roles: ['admin', 'investor'],
      },
      {
        href: "/analytics",
        icon: BarChart,
        label: t('sidebar.user_analytics'),
        active: pathname.startsWith('/analytics'),
        roles: ['admin'],
      },
      {
        href: "/contract-analyzer",
        icon: Wrench,
        label: t('sidebar.contract_analyzer'),
        active: pathname.startsWith('/contract-analyzer'),
        roles: ['admin'],
      },
    ];

    const settingsItems: NavItem[] = [
      {
        href: "/setup",
        icon: Server,
        label: t('sidebar.platform_setup'),
        active: pathname.startsWith('/setup'),
        roles: ['admin'],
      },
      {
        href: "/profile",
        icon: User,
        label: t('sidebar.user_profile'),
        active: pathname.startsWith('/profile'),
        roles: ['admin', 'investor', 'startup', 'voter'],
      },
      {
        href: "/logs",
        icon: ScrollText,
        label: t('sidebar.activity_logs'),
        active: pathname.startsWith('/logs'),
        roles: ['admin'],
      },
    ];

    const filterByRole = (items: NavItem[]) => items.filter(item => item.roles.includes(userRole || 'voter'));
    
    return {
        main: filterByRole(baseItems),
        settings: filterByRole(settingsItems)
    };

  }, [pathname, t, userRole]);
  
  return (
      <Sidebar side={direction === 'rtl' ? 'right' : 'left'}>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Logo className="size-8 text-primary" />
            <span className="text-xl font-bold text-primary font-headline">RayanChain</span>
          </div>
          </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.main.map((item) => ( // دیگر نیازی به index نیست
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={item.active} tooltip={item.label}>
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
                {item.subItems && (
                  <SidebarMenuSub>
                    {/* ✅ TypeScript اکنون نوع `subItem` را می‌شناسد */}
                    {item.subItems.map((subItem: NavSubItem) => (
                      subItem.roles.includes(userRole || 'voter') && (
                        <SidebarMenuSubItem key={subItem.href}>
                          <SidebarMenuSubButton asChild isActive={pathname === subItem.href}>
                            <Link href={subItem.href}>{subItem.label}</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarSeparator />
          <SidebarMenu>
            {navItems.settings.map((item, index) => (
               <SidebarMenuItem key={`${item.label}-${index}`}>
                  <SidebarMenuButton asChild isActive={item.active} tooltip={item.label}>
                     <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                     </Link>
                  </SidebarMenuButton>
               </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
  );
}
