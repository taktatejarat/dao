// src/app/role-selection/page.tsx - REDESIGNED & LOGIC FIXED

"use client";

import { useState } from 'react';
import { useWeb3 } from '@/context/Web3Provider';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Rocket, Briefcase, Vote, Users, CheckCircle2 } from 'lucide-react'; 
import { useLanguage } from '@/context/LanguageProvider';
import { useTranslation } from '@/hooks/use-translation';
import type { UserRole } from '@/context/Web3Provider';
import { useRouter } from 'next/navigation';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { cn } from '@/lib/utils';

export default function RoleSelectionPage() {
    const { setUserRole, isHydrated } = useWeb3();
    const router = useRouter();
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { direction } = useLanguage();
    const { t } = useTranslation();

    const roles = [
        { id: 'investor', icon: Briefcase, title: t('role_selection.investor'), desc: t('role_selection.investor_desc_short') },
        { id: 'startup', icon: Rocket, title: t('role_selection.startup'), desc: t('role_selection.startup_desc') },
        { id: 'voter', icon: Vote, title: t('role_selection.voter'), desc: t('role_selection.voter_desc') },
        { id: 'delegate', icon: Users, title: t('role_selection.delegate'), desc: t('role_selection.delegate_desc') },
    ];

    const handleConfirm = () => {
        if (!selectedRole) return;
        setIsSaving(true);
        
        // ذخیره نقش در کانتکست و لوکال استوریج
        setUserRole(selectedRole);
        localStorage.setItem('userRole', selectedRole);

        // شبیه‌سازی تاخیر برای تجربه کاربری
        setTimeout(() => {
            router.push('/dashboard');
        }, 800);
    };
    
    if (!isHydrated) return <div className="flex justify-center items-center h-screen"><DaoLoadingSpinner /></div>;
    
    return (
        <div dir={direction} className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
            <div className="max-w-5xl w-full space-y-12">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold font-headline text-gradient">{t('role_selection.title')}</h1>
                    <p className="text-xl text-muted-foreground">{t('role_selection.subtitle')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {roles.map((role) => {
                        const isSelected = selectedRole === role.id;
                        return (
                            <Card 
                                key={role.id}
                                className={cn(
                                    "relative cursor-pointer transition-all duration-300 hover:shadow-lg border-2",
                                    isSelected 
                                        ? "border-primary bg-primary/5 scale-105 shadow-primary/20" 
                                        : "border-border hover:border-primary/50 bg-card"
                                )}
                                onClick={() => setSelectedRole(role.id as UserRole)}
                            >
                                {isSelected && (
                                    <div className="absolute top-3 right-3 text-primary animate-in zoom-in">
                                        <CheckCircle2 className="w-6 h-6 fill-primary text-primary-foreground" />
                                    </div>
                                )}
                                <CardHeader className="text-center pb-2">
                                    <div className={cn("mx-auto p-4 rounded-full mb-4 transition-colors", isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                                        <role.icon className="w-8 h-8" />
                                    </div>
                                    <CardTitle className="text-xl">{role.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="text-center pb-6">
                                    <CardDescription className="text-sm leading-relaxed">{role.desc}</CardDescription>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="flex justify-center pt-8">
                    <Button 
                        size="lg" 
                        className="w-full max-w-sm h-14 text-lg rounded-full shadow-xl shadow-primary/20" 
                        disabled={!selectedRole || isSaving}
                        onClick={handleConfirm}
                    >
                        {isSaving ? <DaoLoadingSpinner className="mr-2" /> : t('common.confirm_continue')}
                    </Button>
                </div>
            </div>
        </div>
    );
}