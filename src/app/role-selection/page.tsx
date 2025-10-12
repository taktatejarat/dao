// src/app/role-selection/page.tsx - FINAL FIX: Simplified to be a pure Role Gateway

"use client";

import { useState } from 'react';
import { useWeb3 } from '@/context/Web3Provider';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Rocket, Briefcase, Vote, Users } from 'lucide-react'; 
import { useLanguage } from '@/context/LanguageProvider';
import { useTranslation } from '@/hooks/use-translation';
import type { UserRole } from '@/context/Web3Provider';
import { useRouter } from 'next/navigation';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';
import { toast } from 'sonner';


export default function RoleSelectionPage() {
    const { setUserRole, isHydrated } = useWeb3();
    const router = useRouter();
    // ✅ FIX 2: Initialize selectedTab as 'investor' (a valid string literal)
    const [selectedTab, setSelectedTab] = useState<string>('investor'); 
    const [isRedirecting, setIsRedirecting] = useState(false); 
    const { direction } = useLanguage();
    const { t } = useTranslation();

    // --- Main Handler for Role Selection ---
    const handleRoleSelect = (role: UserRole) => {
        setIsRedirecting(true);
        setUserRole(role);
        
        if (typeof window !== 'undefined') {
            // We store the role for persistence. Role is already UserRole (string).
            localStorage.setItem('userRole', role as string); 
        }
        
        setTimeout(() => {
            router.push('/staking');
        }, 500); 
    };
    
    // ✅ FIX: isAddressLoading is not defined. We check only isHydrated.
    if (!isHydrated) {
        return <div className="flex justify-center items-center h-screen"><DaoLoadingSpinner /></div>;
    }
    
   return (
        <div dir={direction} className="flex flex-col items-center justify-center min-h-screen bg-background p-4 sm:p-6 md:p-8">
            <div className="w-full">
                {/* ... (Header remains the same) ... */}
                
                <Tabs value={selectedTab} onValueChange={value => setSelectedTab(value)} className="w-full">
                    <TabsList className="grid w-full grid-cols-1 sm:grid-cols-4 mb-8 max-w-2xl mx-auto">
                        <TabsTrigger value="investor"><Briefcase className="me-2" />{t('role_selection.investor')}</TabsTrigger>
                        <TabsTrigger value="startup"><Rocket className="me-2" />{t('role_selection.startup')}</TabsTrigger>
                        <TabsTrigger value="voter"><Vote className="me-2" />{t('role_selection.voter')}</TabsTrigger>
                        <TabsTrigger value="delegate"><Users className="me-2" />{t('role_selection.delegate')}</TabsTrigger>
                    </TabsList>
                    
                   {/* --- Investor Content --- */}
                    <TabsContent value="investor">
                         <div className="text-center mb-8">
                             <h2 className="text-2xl font-semibold">{t('role_selection.investor_title')}</h2>
                             <p className="text-muted-foreground mt-1">{t('role_selection.investor_subtitle')}</p>
                         </div>
                        <Card className="max-w-md mx-auto border-2 border-border shadow-lg"> 
                             <CardHeader className="text-center">
                                <Briefcase className="w-16 h-16 mx-auto text-primary mb-4" />
                                <CardTitle className="font-headline">{t('role_selection.investor_title')}</CardTitle>
                             </CardHeader>
                             <CardContent className="text-center">
                                <p className="text-muted-foreground">{t('role_selection.investor_desc_short')}</p>
                             </CardContent>
                             <CardFooter>
                                <Button className="w-full" onClick={() => handleRoleSelect('delegate')} disabled={isRedirecting}>
                                {isRedirecting ? <DaoLoadingSpinner className="me-2" /> : t('role_selection.continue_to_staking_cta')}
                                 </Button>
                             </CardFooter>
                        </Card>
                    </TabsContent>

                    {/* --- Startup Content (Simplified) --- */}
                    <TabsContent value="startup">
                        <Card className="max-w-md mx-auto border-2 border-border shadow-lg">
                             <CardHeader className="text-center">
                                <Rocket className="w-16 h-16 mx-auto text-primary mb-4" />
                                <CardTitle className="font-headline">{t('role_selection.startup_title')}</CardTitle>
                             </CardHeader>
                             <CardContent className="text-center">
                                <p className="text-muted-foreground">{t('role_selection.startup_desc')}</p>
                             </CardContent>
                            <CardFooter>
                                <Button 
                                    className="w-full" 
                                    onClick={() => handleRoleSelect('startup')}
                                    disabled={isRedirecting}
                                >
                                    {isRedirecting ? (
                                        <>
                                         <DaoLoadingSpinner className="me-2" />
                                        {t('role_selection.redirecting')} 
                                    </>
                                    ) : (
                                    t('role_selection.continue_to_staking_cta')
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    {/* --- Voter Content --- */}
                    <TabsContent value="voter">
                        <Card className="max-w-md mx-auto border-2 border-border shadow-lg">
                            <CardHeader className="text-center">
                                <Vote className="w-16 h-16 mx-auto text-primary mb-4" />
                                <CardTitle className="font-headline">{t('role_selection.voter_title')}</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center">
                                <p className="text-muted-foreground">
                                    {t('role_selection.voter_desc')}
                                </p>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" onClick={() => handleRoleSelect('voter')} disabled={isRedirecting}>
                                    {isRedirecting ? <DaoLoadingSpinner className="me-2" /> : t('role_selection.continue_to_staking_cta')}
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    {/* --- Delegate Content --- */}
                    <TabsContent value="delegate">
                        <Card className="max-w-md mx-auto border-2 border-border shadow-lg">
                            <CardHeader className="text-center">
                                <Users className="w-16 h-16 mx-auto text-primary mb-4" />
                                <CardTitle className="font-headline">{t('role_selection.delegate_title')}</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center">
                                <p className="text-muted-foreground">
                                    {t('role_selection.delegate_desc')}
                                </p>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" onClick={() => handleRoleSelect('delegate')} disabled={isRedirecting}>
                                    {isRedirecting ? <DaoLoadingSpinner className="me-2" /> : t('role_selection.continue_to_staking_cta')}
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}