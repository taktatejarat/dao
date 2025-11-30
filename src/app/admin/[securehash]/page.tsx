// src/app/admin/[secureHash]/page.tsx

"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Settings, Activity } from 'lucide-react';
import { useWeb3 } from '@/context/Web3Provider';
import { DaoLoadingSpinner } from '@/components/icons/dao-loading-spinner';

// 🔴 TODO: این هش باید در فایل .env ذخیره شود و از سمت سرور چک شود
// فعلاً برای نسخه MVP هاردکد می‌کنیم یا از .env می‌خوانیم
const ADMIN_HASH = process.env.NEXT_PUBLIC_ADMIN_HASH || "secure-admin-123"; 

export default function AdminDashboard() {
    const params = useParams();
    const router = useRouter();
    const { userRole, isHydrated } = useWeb3();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        // 1. بررسی هش URL
        if (params.secureHash !== ADMIN_HASH) {
            router.push('/404'); // اگر هش اشتباه بود، وانمود کن صفحه نیست
            return;
        }
        // 2. بررسی نقش کاربر (فقط ادمین)
        if (isHydrated && userRole !== 'admin') {
            router.push('/dashboard');
            return;
        }
        setIsAuthorized(true);
    }, [params.secureHash, userRole, isHydrated, router]);

    if (!isAuthorized) return <div className="flex h-screen items-center justify-center"><DaoLoadingSpinner /></div>;

    return (
        <div className="container py-10">
            <h1 className="text-3xl font-bold mb-8">Admin Control Center</h1>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="hover:border-primary cursor-pointer transition-all" onClick={() => router.push(`/admin/${ADMIN_HASH}/settings`)}>
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg"><Settings className="w-8 h-8 text-primary" /></div>
                        <CardTitle>Platform Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Configure fees, voting periods, and upgrade contracts.</p>
                    </CardContent>
                </Card>

                <Card className="hover:border-primary cursor-pointer transition-all">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg"><ShieldCheck className="w-8 h-8 text-primary" /></div>
                        <CardTitle>Security & Roles</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Manage access controls and emergency pause.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}